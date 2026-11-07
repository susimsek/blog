package main

import (
	"context"
	"testing"

	"suaybsimsek.com/blog-api/internal/repository/testutil/mtest"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestDigestPayloadUsesSHA256(t *testing.T) {
	if got := digestPayload([]byte("hello")); got != "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824" {
		t.Fatalf("digestPayload() = %q", got)
	}
}

func TestMigrateDigestsDryRunReportsChangesWithoutWriting(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("dry run", mtest.NewOptions().ClientType(mtest.Mock).DatabaseName("blog_test"), func(mt *mtest.T) {
		addMigrationReadResponses(mt)

		report, err := migrateDigests(context.Background(), mt.Client.Database("blog_test"), false)
		if err != nil {
			t.Fatalf("migrateDigests() error = %v", err)
		}
		if report.mediaAssetsPending != 1 || report.avatarFilesPending != 1 || report.adminUsersPending != 1 {
			t.Fatalf("migrateDigests() report = %#v", report)
		}
		if report.mediaAssetsUpdated != 0 || report.avatarFilesUpdated != 0 || report.adminUsersUpdated != 0 {
			t.Fatalf("dry-run unexpectedly reported writes: %#v", report)
		}
	})
}

func TestMigrateDigestsApplyUpdatesStoredDigestsAndAvatarURL(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("apply", mtest.NewOptions().ClientType(mtest.Mock).DatabaseName("blog_test"), func(mt *mtest.T) {
		mediaAsset := migrationMediaAssetDocument()
		avatar := migrationAvatarDocument()
		user := bson.D{
			{Key: "id", Value: "admin-1"},
			{Key: "avatarDigest", Value: "legacy-avatar-digest"},
			{Key: "avatarVersion", Value: int64(3)},
			{Key: "avatarUrl", Value: "/api/admin-avatar?id=admin-1&u=legacy-avatar-digest"},
		}
		mt.AddMockResponses(
			mtest.CreateCursorResponse(0, "blog_test.admin_media_assets", mtest.FirstBatch, mediaAsset),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}, bson.E{Key: "nModified", Value: int32(1)}),
			mtest.CreateCursorResponse(0, "blog_test.admin_avatar_files", mtest.FirstBatch, avatar),
			mtest.CreateCursorResponse(0, "blog_test.admin_users", mtest.FirstBatch, user),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}, bson.E{Key: "nModified", Value: int32(1)}),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}, bson.E{Key: "nModified", Value: int32(1)}),
		)

		report, err := migrateDigests(context.Background(), mt.Client.Database("blog_test"), true)
		if err != nil {
			t.Fatalf("migrateDigests() error = %v", err)
		}
		if report.mediaAssetsUpdated != 1 || report.avatarFilesUpdated != 1 || report.adminUsersUpdated != 1 {
			t.Fatalf("migrateDigests() report = %#v", report)
		}
	})
}

func addMigrationReadResponses(mt *mtest.T) {
	mt.AddMockResponses(
		mtest.CreateCursorResponse(0, "blog_test.admin_media_assets", mtest.FirstBatch, migrationMediaAssetDocument()),
		mtest.CreateCursorResponse(0, "blog_test.admin_avatar_files", mtest.FirstBatch, migrationAvatarDocument()),
		mtest.CreateCursorResponse(0, "blog_test.admin_users", mtest.FirstBatch, bson.D{
			{Key: "id", Value: "admin-1"},
			{Key: "avatarDigest", Value: "legacy-avatar-digest"},
			{Key: "avatarVersion", Value: int64(3)},
			{Key: "avatarUrl", Value: "/api/admin-avatar?id=admin-1&u=legacy-avatar-digest"},
		}),
	)
}

func migrationMediaAssetDocument() bson.D {
	return bson.D{
		{Key: "id", Value: "media-1"},
		{Key: "digest", Value: "legacy-media-digest"},
		{Key: "data", Value: []byte("hello")},
	}
}

func migrationAvatarDocument() bson.D {
	return bson.D{
		{Key: "userId", Value: "admin-1"},
		{Key: "digest", Value: "legacy-avatar-digest"},
		{Key: "version", Value: int64(3)},
		{Key: "source", Value: bson.D{{Key: "data", Value: []byte("hello")}}},
	}
}

func TestAvatarPayloadPrefersSourceAndFallsBackToLargestVariant(t *testing.T) {
	avatar := avatarDocument{Source: struct {
		Data []byte `bson:"data"`
	}{Data: []byte("source")}}
	if got := string(avatarPayload(avatar)); got != "source" {
		t.Fatalf("avatarPayload(source) = %q", got)
	}

	avatar.Source.Data = nil
	avatar.Variants = []struct {
		Size int    `bson:"size"`
		Data []byte `bson:"data"`
	}{
		{Size: 32, Data: []byte("small")},
		{Size: 64, Data: []byte("large")},
	}
	if got := string(avatarPayload(avatar)); got != "large" {
		t.Fatalf("avatarPayload(variants) = %q", got)
	}
}

func TestBuildAdminAvatarURLUsesMigratedDigest(t *testing.T) {
	got := buildAdminAvatarURL("admin-1", "digest", 7)
	if got != "/api/admin-avatar?id=admin-1&s=256&u=digest&v=7" {
		t.Fatalf("buildAdminAvatarURL() = %q", got)
	}
}
