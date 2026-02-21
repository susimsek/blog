package handler

import (
	"net/http"

	graphqlhandler "github.com/99designs/gqlgen/graphql/handler"
	"suaybsimsek.com/blog-api/api/graphql/graph"
	"suaybsimsek.com/blog-api/api/graphql/graph/generated"
	"suaybsimsek.com/blog-api/pkg/newsletter"
)

var graphQLServer = graphqlhandler.NewDefaultServer(
	generated.NewExecutableSchema(
		generated.Config{Resolvers: &graph.Resolver{}},
	),
)

func Handler(w http.ResponseWriter, r *http.Request) {
	allowedOrigin, corsErr := newsletter.ResolveAllowedOriginRequired()
	if corsErr != nil {
		http.Error(w, "config-error", http.StatusInternalServerError)
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

	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		http.Error(w, "method-not-allowed", http.StatusMethodNotAllowed)
		return
	}

	requestWithMetadata := r.WithContext(graph.WithRequestMetadata(r.Context(), r))
	graphQLServer.ServeHTTP(w, requestWithMetadata)
}
