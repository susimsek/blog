package handler

import (
	"context"
	"net/http"
	"strings"
	"sync"

	"github.com/99designs/gqlgen/graphql"
	graphqlhandler "github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/vektah/gqlparser/v2/ast"
	"github.com/vektah/gqlparser/v2/gqlerror"
	appconfig "suaybsimsek.com/blog-api/internal/config"
	graphschema "suaybsimsek.com/blog-api/internal/graphql"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	graphqlapi "suaybsimsek.com/blog-api/pkg/graphql"
	"suaybsimsek.com/blog-api/pkg/httpapi"
)

var (
	graphQLServer     *graphqlhandler.Server
	graphQLServerOnce sync.Once
)

func newGraphQLServer() *graphqlhandler.Server {
	graphQLConfig := appconfig.ResolveGraphQLConfig()

	server := graphqlhandler.New(
		graphschema.NewExecutableSchema(
			graphschema.Config{Resolvers: &graphschema.Resolver{}},
		),
	)
	server.AddTransport(transport.Options{})
	server.AddTransport(transport.GET{})
	server.AddTransport(transport.POST{})
	server.SetQueryCache(lru.New[*ast.QueryDocument](graphQLConfig.QueryCacheSize))
	if graphQLConfig.IntrospectionEnabled {
		server.Use(extension.Introspection{})
	}
	server.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New[string](graphQLConfig.APQCacheSize),
	})
	server.SetErrorPresenter(func(ctx context.Context, err error) *gqlerror.Error {
		gqlErr := graphql.DefaultErrorPresenter(ctx, err)
		appErr := apperrors.From(err)

		gqlErr.Message = appErr.Message
		if gqlErr.Extensions == nil {
			gqlErr.Extensions = map[string]any{}
		}
		gqlErr.Extensions["code"] = appErr.Code

		return gqlErr
	})
	server.SetRecoverFunc(func(_ context.Context, recovered any) error {
		return apperrors.Internal("Internal server error", nil)
	})

	return server
}

func getGraphQLServer() *graphqlhandler.Server {
	graphQLServerOnce.Do(func() {
		graphQLServer = newGraphQLServer()
	})

	return graphQLServer
}

func Handler(w http.ResponseWriter, r *http.Request) {
	if shouldServeGraphiQL(r) {
		graphqlapi.GraphiQLHandler(w, r)
		return
	}

	allowedOrigin, corsErr := appconfig.ResolveAllowedOriginRequired()
	if corsErr != nil {
		httpapi.WriteError(w, apperrors.Config("configuration error", corsErr))
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
		httpapi.WriteError(w, apperrors.MethodNotAllowed("method not allowed"))
		return
	}

	requestWithMetadata := r.WithContext(graphschema.WithRequestMetadata(r.Context(), r))
	getGraphQLServer().ServeHTTP(w, requestWithMetadata)
}

func shouldServeGraphiQL(r *http.Request) bool {
	if r == nil {
		return false
	}

	path := strings.TrimSpace(r.URL.Path)
	return path == "/graphiql"
}
