package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"io"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"

	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const postLikesCollectionName = "post_likes"
const maxBatchPostIDs = 60

var postIDPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,127}$`)

type likeRequest struct {
	PostID string `json:"postId"`
}

type likeResponse struct {
	Status        string           `json:"status"`
	PostID        string           `json:"postId,omitempty"`
	Likes         int64            `json:"likes,omitempty"`
	LikesByPostID map[string]int64 `json:"likesByPostId,omitempty"`
}

var (
	likesClient  *mongo.Client
	likesInitErr error
	likesOnce    sync.Once

	likesIndexesOnce sync.Once
	likesIndexesErr  error
)

func getLikesClient() (*mongo.Client, error) {
	likesOnce.Do(func() {
		uri, err := newsletter.ResolveMongoURI()
		if err != nil {
			likesInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetAppName("blog-api-post-likes"))
		if err != nil {
			likesInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		likesClient = client
	})

	if likesInitErr != nil {
		return nil, likesInitErr
	}

	return likesClient, nil
}

func ensureLikeIndexes(likesCollection *mongo.Collection) error {
	likesIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "postId", Value: 1}},
				Options: options.Index().SetName("uniq_post_likes_post_id").SetUnique(true),
			},
		}

		if _, err := likesCollection.Indexes().CreateMany(ctx, indexes); err != nil {
			likesIndexesErr = fmt.Errorf("post_likes index create failed: %w", err)
			return
		}
	})

	return likesIndexesErr
}

func writeJSON(w http.ResponseWriter, statusCode int, payload likeResponse) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func normalizePostID(value string) (string, bool) {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if !postIDPattern.MatchString(normalized) {
		return "", false
	}
	return normalized, true
}

func computeInitialLikes(postID string) int64 {
	hasher := fnv.New32a()
	_, _ = hasher.Write([]byte(postID))
	return 24 + int64(hasher.Sum32()%220)
}

func ensurePostLikesDocument(ctx context.Context, collection *mongo.Collection, postID string, now time.Time) error {
	_, err := collection.UpdateOne(
		ctx,
		bson.M{"postId": postID},
		bson.M{
			"$setOnInsert": bson.M{
				"postId":    postID,
				"likes":     computeInitialLikes(postID),
				"seededAt":  now,
				"createdAt": now,
			},
		},
		options.Update().SetUpsert(true),
	)
	return err
}

func ensurePostLikesDocuments(ctx context.Context, collection *mongo.Collection, postIDs []string, now time.Time) error {
	if len(postIDs) == 0 {
		return nil
	}

	models := make([]mongo.WriteModel, 0, len(postIDs))
	for _, postID := range postIDs {
		models = append(models, mongo.NewUpdateOneModel().
			SetFilter(bson.M{"postId": postID}).
			SetUpdate(bson.M{
				"$setOnInsert": bson.M{
					"postId":    postID,
					"likes":     computeInitialLikes(postID),
					"seededAt":  now,
					"createdAt": now,
				},
			}).
			SetUpsert(true),
		)
	}

	_, err := collection.BulkWrite(ctx, models, options.BulkWrite().SetOrdered(false))
	return err
}

func fetchLikeCount(ctx context.Context, collection *mongo.Collection, postID string) (int64, error) {
	var doc struct {
		Likes int64 `bson:"likes"`
	}

	if err := collection.FindOne(
		ctx,
		bson.M{"postId": postID},
		options.FindOne().SetProjection(bson.M{"likes": 1}),
	).Decode(&doc); err != nil {
		return 0, err
	}

	return doc.Likes, nil
}

func decodeLikeRequest(r *http.Request) (string, bool) {
	body := http.MaxBytesReader(nil, r.Body, 1<<20)
	defer body.Close()

	var payload likeRequest
	decoder := json.NewDecoder(body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&payload); err != nil {
		return "", false
	}

	if _, err := io.Copy(io.Discard, body); err != nil {
		return "", false
	}

	postID, ok := normalizePostID(payload.PostID)
	return postID, ok
}

func parseBatchPostIDs(raw string) ([]string, bool) {
	if strings.TrimSpace(raw) == "" {
		return nil, false
	}

	parts := strings.Split(raw, ",")
	seen := make(map[string]struct{}, len(parts))
	postIDs := make([]string, 0, len(parts))

	for _, part := range parts {
		postID, ok := normalizePostID(part)
		if !ok {
			return nil, false
		}

		if _, exists := seen[postID]; exists {
			continue
		}

		seen[postID] = struct{}{}
		postIDs = append(postIDs, postID)
	}

	if len(postIDs) == 0 || len(postIDs) > maxBatchPostIDs {
		return nil, false
	}

	return postIDs, true
}

func handleBatchGet(w http.ResponseWriter, r *http.Request, likesCollection *mongo.Collection) {
	postIDs, ok := parseBatchPostIDs(r.URL.Query().Get("postIds"))
	if !ok {
		writeJSON(w, http.StatusBadRequest, likeResponse{Status: "invalid-post-ids"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now().UTC()
	if err := ensurePostLikesDocuments(ctx, likesCollection, postIDs, now); err != nil {
		writeJSON(w, http.StatusInternalServerError, likeResponse{Status: "failed"})
		return
	}

	cursor, err := likesCollection.Find(
		ctx,
		bson.M{"postId": bson.M{"$in": postIDs}},
		options.Find().SetProjection(bson.M{"postId": 1, "likes": 1}),
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, likeResponse{Status: "failed"})
		return
	}
	defer cursor.Close(ctx)

	likesByPostID := make(map[string]int64, len(postIDs))
	for cursor.Next(ctx) {
		var doc struct {
			PostID string `bson:"postId"`
			Likes  int64  `bson:"likes"`
		}
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			writeJSON(w, http.StatusInternalServerError, likeResponse{Status: "failed"})
			return
		}
		likesByPostID[doc.PostID] = doc.Likes
	}

	if err := cursor.Err(); err != nil {
		writeJSON(w, http.StatusInternalServerError, likeResponse{Status: "failed"})
		return
	}

	for _, postID := range postIDs {
		if _, exists := likesByPostID[postID]; !exists {
			likesByPostID[postID] = computeInitialLikes(postID)
		}
	}

	writeJSON(w, http.StatusOK, likeResponse{
		Status:        "success",
		LikesByPostID: likesByPostID,
	})
}

func handleGet(w http.ResponseWriter, r *http.Request, likesCollection *mongo.Collection) {
	if strings.TrimSpace(r.URL.Query().Get("postIds")) != "" {
		handleBatchGet(w, r, likesCollection)
		return
	}

	postID, ok := normalizePostID(r.URL.Query().Get("postId"))
	if !ok {
		writeJSON(w, http.StatusBadRequest, likeResponse{Status: "invalid-post-id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now().UTC()
	if err := ensurePostLikesDocument(ctx, likesCollection, postID, now); err != nil {
		writeJSON(w, http.StatusInternalServerError, likeResponse{Status: "failed", PostID: postID})
		return
	}

	likes, err := fetchLikeCount(ctx, likesCollection, postID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, likeResponse{Status: "failed", PostID: postID})
		return
	}

	writeJSON(w, http.StatusOK, likeResponse{
		Status: "success",
		PostID: postID,
		Likes:  likes,
	})
}

func handlePost(w http.ResponseWriter, r *http.Request, likesCollection *mongo.Collection) {
	postID, ok := decodeLikeRequest(r)
	if !ok {
		writeJSON(w, http.StatusBadRequest, likeResponse{Status: "invalid-post-id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now().UTC()
	if err := ensurePostLikesDocument(ctx, likesCollection, postID, now); err != nil {
		writeJSON(w, http.StatusInternalServerError, likeResponse{Status: "failed", PostID: postID})
		return
	}

	var updated struct {
		Likes int64 `bson:"likes"`
	}

	err := likesCollection.FindOneAndUpdate(
		ctx,
		bson.M{"postId": postID},
		bson.M{
			"$inc": bson.M{"likes": 1},
			"$set": bson.M{"updatedAt": now},
		},
		options.FindOneAndUpdate().
			SetReturnDocument(options.After).
			SetProjection(bson.M{"likes": 1}),
	).Decode(&updated)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, likeResponse{Status: "failed", PostID: postID})
		return
	}

	writeJSON(w, http.StatusOK, likeResponse{
		Status: "success",
		PostID: postID,
		Likes:  updated.Likes,
	})
}

func Handler(w http.ResponseWriter, r *http.Request) {
	allowedOrigin, corsErr := newsletter.ResolveAllowedOriginRequired()
	if corsErr != nil {
		writeJSON(w, http.StatusInternalServerError, likeResponse{Status: "config-error"})
		return
	}

	databaseName, databaseErr := newsletter.ResolveDatabaseName()
	if databaseErr != nil {
		writeJSON(w, http.StatusInternalServerError, likeResponse{Status: "config-error"})
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept-Language")
	w.Header().Set("Vary", "Origin")
	w.Header().Set("Cache-Control", "no-store")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	client, err := getLikesClient()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, likeResponse{Status: "service-unavailable"})
		return
	}

	likesCollection := client.Database(databaseName).Collection(postLikesCollectionName)
	if err := ensureLikeIndexes(likesCollection); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, likeResponse{Status: "service-unavailable"})
		return
	}

	switch r.Method {
	case http.MethodGet:
		handleGet(w, r, likesCollection)
	case http.MethodPost:
		handlePost(w, r, likesCollection)
	default:
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeJSON(w, http.StatusMethodNotAllowed, likeResponse{Status: "method-not-allowed"})
	}
}
