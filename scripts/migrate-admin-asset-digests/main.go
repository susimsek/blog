package main

import (
	"bufio"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"flag"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

const (
	adminAvatarCollection = "admin_avatar_files"
	adminMediaCollection  = "admin_media_assets"
	adminUsersCollection  = "admin_users"
)

type migrationReport struct {
	mediaAssetsUpdated int64
	avatarFilesUpdated int64
	adminUsersUpdated  int64
	mediaAssetsPending int64
	avatarFilesPending int64
	adminUsersPending  int64
}

type mediaAssetDocument struct {
	ID     string `bson:"id"`
	Digest string `bson:"digest"`
	Data   []byte `bson:"data"`
}

type avatarDocument struct {
	UserID  string `bson:"userId"`
	Digest  string `bson:"digest"`
	Version int64  `bson:"version"`
	Source  struct {
		Data []byte `bson:"data"`
	} `bson:"source"`
	Variants []struct {
		Size int    `bson:"size"`
		Data []byte `bson:"data"`
	} `bson:"variants"`
}

type adminUserDocument struct {
	ID            string `bson:"id"`
	AvatarURL     string `bson:"avatarUrl"`
	AvatarDigest  string `bson:"avatarDigest"`
	AvatarVersion int64  `bson:"avatarVersion"`
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	apply := flag.Bool("apply", false, "write updated digests to MongoDB; without this flag, only report changes")
	envFile := flag.String("env-file", ".env.local", "path to the environment file containing MongoDB configuration")
	flag.Parse()

	loadDotEnv(*envFile)
	cfg, err := appconfig.ResolveDatabaseConfig()
	if err != nil {
		return fmt.Errorf("resolve MongoDB configuration: %w", err)
	}
	client, err := appconfig.NewMongoClient(cfg, "blog-api-admin-asset-digest-migration")
	if err != nil {
		return fmt.Errorf("connect to MongoDB: %w", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = client.Disconnect(ctx)
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	report, err := migrateDigests(ctx, client.Database(cfg.Name), *apply)
	if err != nil {
		return fmt.Errorf("migrate asset digests: %w", err)
	}

	if *apply {
		fmt.Printf("Updated %d media digests, %d avatar digests, and %d admin-user avatar records.\n",
			report.mediaAssetsUpdated, report.avatarFilesUpdated, report.adminUsersUpdated)
		return nil
	}

	fmt.Printf("Dry run: %d media digests, %d avatar digests, and %d admin-user avatar records would change. Run with --apply to write them.\n",
		report.mediaAssetsPending, report.avatarFilesPending, report.adminUsersPending)
	return nil
}

func migrateDigests(ctx context.Context, database *mongo.Database, apply bool) (migrationReport, error) {
	var report migrationReport
	mediaCollection := database.Collection(adminMediaCollection)
	mediaCursor, err := mediaCollection.Find(ctx, bson.M{})
	if err != nil {
		return report, fmt.Errorf("read media assets: %w", err)
	}
	defer func() { _ = mediaCursor.Close(ctx) }()

	for mediaCursor.Next(ctx) {
		var asset mediaAssetDocument
		if err := mediaCursor.Decode(&asset); err != nil {
			return report, fmt.Errorf("decode media asset: %w", err)
		}
		if asset.ID == "" || len(asset.Data) == 0 {
			return report, fmt.Errorf("media asset %q has no id or data", asset.ID)
		}

		digest := digestPayload(asset.Data)
		if digest == asset.Digest {
			continue
		}
		report.mediaAssetsPending++
		if apply {
			result, err := mediaCollection.UpdateOne(ctx,
				bson.M{"id": asset.ID, "digest": asset.Digest},
				bson.M{"$set": bson.M{"digest": digest}},
			)
			if err != nil {
				return report, fmt.Errorf("update media asset %q: %w", asset.ID, err)
			}
			report.mediaAssetsUpdated += result.ModifiedCount
		}
	}
	if err := mediaCursor.Err(); err != nil {
		return report, fmt.Errorf("iterate media assets: %w", err)
	}

	avatarCollection := database.Collection(adminAvatarCollection)
	userCollection := database.Collection(adminUsersCollection)
	avatarCursor, err := avatarCollection.Find(ctx, bson.M{})
	if err != nil {
		return report, fmt.Errorf("read admin avatars: %w", err)
	}
	defer func() { _ = avatarCursor.Close(ctx) }()

	for avatarCursor.Next(ctx) {
		var avatar avatarDocument
		if err := avatarCursor.Decode(&avatar); err != nil {
			return report, fmt.Errorf("decode admin avatar: %w", err)
		}
		if strings.TrimSpace(avatar.UserID) == "" {
			return report, errors.New("admin avatar has no user id")
		}
		payload := avatarPayload(avatar)
		if len(payload) == 0 {
			return report, fmt.Errorf("admin avatar for user %q has no image data", avatar.UserID)
		}

		digest := digestPayload(payload)
		if digest != avatar.Digest {
			report.avatarFilesPending++
		}

		var user adminUserDocument
		err := userCollection.FindOne(ctx, bson.M{"id": avatar.UserID}).Decode(&user)
		if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
			return report, fmt.Errorf("read admin user %q: %w", avatar.UserID, err)
		}
		if err == nil && user.AvatarVersion == avatar.Version {
			avatarURL := user.AvatarURL
			if user.AvatarVersion > 0 {
				avatarURL = buildAdminAvatarURL(user.ID, digest, user.AvatarVersion)
			}
			if user.AvatarDigest != digest || user.AvatarURL != avatarURL {
				report.adminUsersPending++
				if apply {
					result, err := userCollection.UpdateOne(ctx,
						bson.M{"id": user.ID, "avatarVersion": user.AvatarVersion},
						bson.M{"$set": bson.M{"avatarDigest": digest, "avatarUrl": avatarURL}},
					)
					if err != nil {
						return report, fmt.Errorf("update admin user %q: %w", user.ID, err)
					}
					report.adminUsersUpdated += result.ModifiedCount
				}
			}
		}

		if digest != avatar.Digest && apply {
			result, err := avatarCollection.UpdateOne(ctx,
				bson.M{"userId": avatar.UserID, "version": avatar.Version, "digest": avatar.Digest},
				bson.M{"$set": bson.M{"digest": digest}},
			)
			if err != nil {
				return report, fmt.Errorf("update admin avatar for user %q: %w", avatar.UserID, err)
			}
			report.avatarFilesUpdated += result.ModifiedCount
		}
	}
	if err := avatarCursor.Err(); err != nil {
		return report, fmt.Errorf("iterate admin avatars: %w", err)
	}

	return report, nil
}

func digestPayload(payload []byte) string {
	digest := sha256.Sum256(payload)
	return hex.EncodeToString(digest[:])
}

func avatarPayload(avatar avatarDocument) []byte {
	if len(avatar.Source.Data) > 0 {
		return avatar.Source.Data
	}

	var largestVariant []byte
	largestSize := 0
	for _, variant := range avatar.Variants {
		if variant.Size > largestSize && len(variant.Data) > 0 {
			largestVariant = variant.Data
			largestSize = variant.Size
		}
	}
	return largestVariant
}

func buildAdminAvatarURL(userID, digest string, version int64) string {
	query := url.Values{}
	query.Set("id", strings.TrimSpace(userID))
	query.Set("s", "256")
	query.Set("u", digest)
	query.Set("v", strconv.FormatInt(version, 10))
	return "/api/admin-avatar?" + query.Encode()
}

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer func() { _ = file.Close() }()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		if key == "" {
			continue
		}
		if _, exists := os.LookupEnv(key); exists {
			continue
		}
		_ = os.Setenv(key, strings.TrimSpace(parts[1]))
	}
}
