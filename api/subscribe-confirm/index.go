package handler

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const newsletterCollectionName = "newsletter_subscribers"

var (
	confirmClient  *mongo.Client
	confirmInitErr error
	confirmOnce    sync.Once
)

func getConfirmClient() (*mongo.Client, error) {
	confirmOnce.Do(func() {
		uri, err := newsletter.ResolveMongoURI()
		if err != nil {
			confirmInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetAppName("blog-api-newsletter-confirm"))
		if err != nil {
			confirmInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		confirmClient = client
	})

	if confirmInitErr != nil {
		return nil, confirmInitErr
	}

	return confirmClient, nil
}

func hashValue(value string) string {
	if value == "" {
		return ""
	}
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

type confirmResponse struct {
	Status string `json:"status"`
}

func writeJSON(w http.ResponseWriter, statusCode int, payload confirmResponse) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func Handler(w http.ResponseWriter, r *http.Request) {
	allowedOrigin, corsErr := newsletter.ResolveAllowedOriginRequired()
	if corsErr != nil {
		writeJSON(w, http.StatusInternalServerError, confirmResponse{Status: "config-error"})
		return
	}

	databaseName, databaseErr := newsletter.ResolveDatabaseName()
	if databaseErr != nil {
		writeJSON(w, http.StatusInternalServerError, confirmResponse{Status: "config-error"})
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Vary", "Origin")
	w.Header().Set("Cache-Control", "no-store")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET, OPTIONS")
		writeJSON(w, http.StatusMethodNotAllowed, confirmResponse{Status: "method-not-allowed"})
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		writeJSON(w, http.StatusBadRequest, confirmResponse{Status: "invalid-link"})
		return
	}

	client, err := getConfirmClient()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, confirmResponse{Status: "service-unavailable"})
		return
	}

	collection := client.Database(databaseName).Collection(newsletterCollectionName)
	now := time.Now().UTC()

	filter := bson.M{
		"confirmTokenHash":      hashValue(token),
		"status":                "pending",
		"confirmTokenExpiresAt": bson.M{"$gt": now},
	}

	update := bson.M{
		"$set": bson.M{
			"status":      "active",
			"confirmedAt": now,
			"updatedAt":   now,
		},
		"$unset": bson.M{
			"confirmTokenHash":      "",
			"confirmTokenExpiresAt": "",
			"confirmRequestedAt":    "",
		},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, confirmResponse{Status: "failed"})
		return
	}

	if result.MatchedCount == 0 {
		writeJSON(w, http.StatusGone, confirmResponse{Status: "expired"})
		return
	}

	writeJSON(w, http.StatusOK, confirmResponse{Status: "success"})
}
