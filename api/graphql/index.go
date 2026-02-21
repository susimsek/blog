package handler

import (
	"net/http"

	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/vektah/gqlparser/v2/ast"
	graphqlhandler "github.com/99designs/gqlgen/graphql/handler"
	"suaybsimsek.com/blog-api/pkg/graph"
	"suaybsimsek.com/blog-api/pkg/graph/generated"
	"suaybsimsek.com/blog-api/pkg/newsletter"
)

var graphQLServer = newGraphQLServer()

func newGraphQLServer() *graphqlhandler.Server {
	server := graphqlhandler.New(
		generated.NewExecutableSchema(
			generated.Config{Resolvers: &graph.Resolver{}},
		),
	)
	server.AddTransport(transport.Options{})
	server.AddTransport(transport.GET{})
	server.AddTransport(transport.POST{})
	server.SetQueryCache(lru.New[*ast.QueryDocument](1000))
	server.Use(extension.Introspection{})
	server.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New[string](100),
	})

	return server
}

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
