package handler

import (
  "context"
  "encoding/json"
  "fmt"
  "net/http"
  "os"
  "strings"
  "sync"
  "time"

  "go.mongodb.org/mongo-driver/mongo"
  "go.mongodb.org/mongo-driver/mongo/options"
  "go.mongodb.org/mongo-driver/mongo/readpref"
)

type pingResponse struct {
  Status    string `json:"status"`
  Message   string `json:"message"`
  Service   string `json:"service"`
  Database  string `json:"database"`
  Error     string `json:"error,omitempty"`
  Timestamp string `json:"timestamp"`
  Path      string `json:"path"`
}

var (
  mongoClient  *mongo.Client
  mongoInitErr error
  mongoOnce    sync.Once
)

func resolveAllowedOrigin() string {
  value := os.Getenv("API_CORS_ORIGIN")
  if value == "" {
    return "*"
  }
  return value
}

func getMongoClient() (*mongo.Client, error) {
  mongoOnce.Do(func() {
    uri := strings.TrimSpace(os.Getenv("MONGODB_URI"))
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetAppName("blog-api"))
    if err != nil {
      mongoInitErr = fmt.Errorf("mongodb connect failed: %w", err)
      return
    }

    mongoClient = client
  })

  if mongoInitErr != nil {
    return nil, mongoInitErr
  }
  return mongoClient, nil
}

func pingMongo() error {
  client, err := getMongoClient()
  if err != nil {
    return err
  }

  ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
  defer cancel()

  if err := client.Ping(ctx, readpref.Primary()); err != nil {
    return fmt.Errorf("mongodb ping failed: %w", err)
  }

  return nil
}

func Handler(w http.ResponseWriter, r *http.Request) {
  allowedOrigin := resolveAllowedOrigin()
  w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
  w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
  w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  w.Header().Set("Vary", "Origin")

  if r.Method == http.MethodOptions {
    w.WriteHeader(http.StatusNoContent)
    return
  }

  if r.Method != http.MethodGet {
    w.Header().Set("Allow", "GET, OPTIONS")
    http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
    return
  }

  w.Header().Set("Content-Type", "application/json; charset=utf-8")
  w.Header().Set("Cache-Control", "no-store")

  response := pingResponse{
    Service:   "blog-api",
    Timestamp: time.Now().UTC().Format(time.RFC3339),
    Path:      r.URL.Path,
  }

  if err := pingMongo(); err != nil {
    response.Status = "error"
    response.Message = "pong (mongo unavailable)"
    response.Database = "down"
    response.Error = err.Error()
    w.WriteHeader(http.StatusServiceUnavailable)
    _ = json.NewEncoder(w).Encode(response)
    return
  }

  response.Status = "ok"
  response.Message = "pong"
  response.Database = "up"
  _ = json.NewEncoder(w).Encode(response)
}
