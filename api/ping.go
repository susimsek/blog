package handler

import (
  "encoding/json"
  "net/http"
  "os"
  "time"
)

type pingResponse struct {
  Status    string `json:"status"`
  Message   string `json:"message"`
  Service   string `json:"service"`
  Timestamp string `json:"timestamp"`
  Path      string `json:"path"`
}

func resolveAllowedOrigin() string {
  value := os.Getenv("API_CORS_ORIGIN")
  if value == "" {
    return "*"
  }
  return value
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
    Status:    "ok",
    Message:   "pong",
		Service:   "blog-api",
    Timestamp: time.Now().UTC().Format(time.RFC3339),
    Path:      r.URL.Path,
  }

  _ = json.NewEncoder(w).Encode(response)
}
