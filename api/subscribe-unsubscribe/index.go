package handler

import (
	"context"
	"encoding/json"
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
	unsubscribeClient  *mongo.Client
	unsubscribeInitErr error
	unsubscribeOnce    sync.Once
)

func getUnsubscribeClient() (*mongo.Client, error) {
	unsubscribeOnce.Do(func() {
		uri, err := newsletter.ResolveMongoURI()
		if err != nil {
			unsubscribeInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetAppName("blog-api-newsletter-unsubscribe"))
		if err != nil {
			unsubscribeInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		unsubscribeClient = client
	})

	if unsubscribeInitErr != nil {
		return nil, unsubscribeInitErr
	}

	return unsubscribeClient, nil
}

type unsubscribeResponse struct {
	Status string `json:"status"`
}

func writeJSON(w http.ResponseWriter, statusCode int, payload unsubscribeResponse) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func Handler(w http.ResponseWriter, r *http.Request) {
	allowedOrigin, corsErr := newsletter.ResolveAllowedOriginRequired()
	if corsErr != nil {
		writeJSON(w, http.StatusInternalServerError, unsubscribeResponse{Status: "config-error"})
		return
	}

	databaseName, databaseErr := newsletter.ResolveDatabaseName()
	if databaseErr != nil {
		writeJSON(w, http.StatusInternalServerError, unsubscribeResponse{Status: "config-error"})
		return
	}

	unsubscribeSecret, secretErr := newsletter.ResolveUnsubscribeSecret()
	if secretErr != nil {
		writeJSON(w, http.StatusInternalServerError, unsubscribeResponse{Status: "config-error"})
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Vary", "Origin")
	w.Header().Set("Cache-Control", "no-store")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeJSON(w, http.StatusMethodNotAllowed, unsubscribeResponse{Status: "method-not-allowed"})
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" && r.Method == http.MethodPost {
		if err := r.ParseForm(); err == nil {
			token = strings.TrimSpace(r.FormValue("token"))
		}
	}
	if token == "" {
		writeJSON(w, http.StatusBadRequest, unsubscribeResponse{Status: "invalid-link"})
		return
	}

	email, tokenErr := newsletter.ParseUnsubscribeToken(token, unsubscribeSecret, time.Now().UTC())
	if tokenErr != nil {
		writeJSON(w, http.StatusBadRequest, unsubscribeResponse{Status: "invalid-link"})
		return
	}

	client, err := getUnsubscribeClient()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, unsubscribeResponse{Status: "service-unavailable"})
		return
	}

	collection := client.Database(databaseName).Collection(newsletterCollectionName)
	now := time.Now().UTC()

	update := bson.M{
		"$set": bson.M{
			"status":         "unsubscribed",
			"updatedAt":      now,
			"unsubscribedAt": now,
		},
		"$unset": bson.M{
			"confirmTokenHash":      "",
			"confirmTokenExpiresAt": "",
			"confirmRequestedAt":    "",
		},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err = collection.UpdateOne(ctx, bson.M{"email": email}, update)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, unsubscribeResponse{Status: "failed"})
		return
	}

	writeJSON(w, http.StatusOK, unsubscribeResponse{Status: "success"})
}
