package main

import (
	"bufio"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	adminavatarapi "suaybsimsek.com/blog-api/api/admin-avatar"
	adminemailchangeapi "suaybsimsek.com/blog-api/api/admin-email-change"
	admingithubapi "suaybsimsek.com/blog-api/api/admin-github"
	admingoogleapi "suaybsimsek.com/blog-api/api/admin-google"
	admingraphqlapi "suaybsimsek.com/blog-api/api/admin-graphql"
	graphqlapi "suaybsimsek.com/blog-api/api/graphql"
	newsletterdispatch "suaybsimsek.com/blog-api/api/newsletter-dispatch"
	appconfig "suaybsimsek.com/blog-api/internal/config"
)

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer func() {
		_ = file.Close()
	}()

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
		value := strings.TrimSpace(parts[1])
		if key == "" {
			continue
		}
		if _, exists := os.LookupEnv(key); exists {
			continue
		}
		_ = os.Setenv(key, value)
	}
}

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	loadDotEnv(filepath.Join(".", ".env.local"))
	httpConfig := appconfig.ResolveHTTPConfig()

	mux := http.NewServeMux()
	mux.HandleFunc("/graphql", graphqlapi.Handler)
	mux.HandleFunc("/api/graphql", graphqlapi.Handler)
	mux.HandleFunc("/api/admin/graphql", admingraphqlapi.Handler)
	mux.HandleFunc("/api/admin-avatar", adminavatarapi.Handler)
	mux.HandleFunc("/api/admin-email-change/confirm", adminemailchangeapi.Handler)
	mux.HandleFunc("/api/admin-github/connect", admingithubapi.Handler)
	mux.HandleFunc("/api/admin-github/callback", admingithubapi.Handler)
	mux.HandleFunc("/api/admin-google/connect", admingoogleapi.Handler)
	mux.HandleFunc("/api/admin-google/callback", admingoogleapi.Handler)
	mux.HandleFunc("/graphiql", graphqlapi.Handler)
	mux.HandleFunc("/api/newsletter-dispatch", newsletterdispatch.Handler)
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = w.Write([]byte("ok"))
	})

	server := &http.Server{
		Addr:              ":" + httpConfig.LocalPort,
		Handler:           mux,
		ReadHeaderTimeout: httpConfig.ReadHeaderTimeout,
	}

	slog.Info("local go api listening", "url", "http://localhost:"+httpConfig.LocalPort)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("local go api terminated", "error", err)
		os.Exit(1)
	}
}
