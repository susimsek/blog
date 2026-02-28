package main

import (
	"bufio"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	graphqlapi "suaybsimsek.com/blog-api/api/graphql"
	newsletterdispatch "suaybsimsek.com/blog-api/api/newsletter-dispatch"
)

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

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

	port := strings.TrimSpace(os.Getenv("LOCAL_GO_API_PORT"))
	if port == "" {
		port = "8080"
	}

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
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("local go api listening on http://localhost:%s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
