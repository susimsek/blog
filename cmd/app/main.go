package main

import (
	"bufio"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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
	loadDotEnv(filepath.Join(".", ".env.local"))
	httpConfig := appconfig.ResolveHTTPConfig()

	mux := http.NewServeMux()
	mux.HandleFunc("/graphql", graphqlapi.Handler)
	mux.HandleFunc("/api/graphql", graphqlapi.Handler)
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

	log.Printf("local go api listening on http://localhost:%s", httpConfig.LocalPort)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
