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
	admingraphqlapi "suaybsimsek.com/blog-api/api/admin-graphql"
	adminpasswordresetconfirmapi "suaybsimsek.com/blog-api/api/admin-password-reset/confirm"
	adminpasswordresetrequestapi "suaybsimsek.com/blog-api/api/admin-password-reset/request"
	githubcallbackapi "suaybsimsek.com/blog-api/api/github/callback"
	googlecallbackapi "suaybsimsek.com/blog-api/api/google/callback"
	graphqlapi "suaybsimsek.com/blog-api/api/graphql"
	mediaapi "suaybsimsek.com/blog-api/api/media"
	newsletterdispatch "suaybsimsek.com/blog-api/api/newsletter-dispatch"
	oauthconnectapi "suaybsimsek.com/blog-api/api/oauth/connect"
	readerauthapi "suaybsimsek.com/blog-api/api/reader-auth"
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
	mux.HandleFunc("/api/admin-password-reset/request", adminpasswordresetrequestapi.Handler)
	mux.HandleFunc("/api/admin-password-reset/confirm", adminpasswordresetconfirmapi.Handler)
	mux.HandleFunc("/api/oauth/connect", oauthconnectapi.Handler)
	mux.HandleFunc("/api/github/connect", oauthconnectapi.Handler)
	mux.HandleFunc("/api/github/callback", githubcallbackapi.Handler)
	mux.HandleFunc("/api/google/connect", oauthconnectapi.Handler)
	mux.HandleFunc("/api/google/callback", googlecallbackapi.Handler)
	mux.HandleFunc("/api/media", mediaapi.Handler)
	mux.HandleFunc("/api/media/", mediaapi.Handler)
	mux.HandleFunc("/api/reader-auth/session", readerauthapi.Handler)
	mux.HandleFunc("/api/reader-auth/logout", readerauthapi.Handler)
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
