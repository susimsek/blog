package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/99designs/gqlgen/graphql"
	graphqlhandler "github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/gorilla/websocket"
	"github.com/vektah/gqlparser/v2/ast"
	"github.com/vektah/gqlparser/v2/gqlerror"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	admingraphql "suaybsimsek.com/blog-api/internal/graphql/admin"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpapi"
	"suaybsimsek.com/blog-api/pkg/httpauth"
)

var (
	adminGraphQLServer     *graphqlhandler.Server
	adminGraphQLServerOnce sync.Once
)

func newAdminGraphQLServer() *graphqlhandler.Server {
	graphQLConfig := appconfig.ResolveGraphQLConfig()

	server := graphqlhandler.New(
		admingraphql.NewExecutableSchema(
			admingraphql.Config{Resolvers: &admingraphql.Resolver{}},
		),
	)
	server.AddTransport(transport.Options{})
	server.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 15 * time.Second,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				if r == nil {
					return false
				}

				httpConfig := appconfig.ResolveHTTPConfig()
				allowedOrigin := strings.TrimSpace(httpConfig.AllowedOrigin)
				origin := strings.TrimSpace(r.Header.Get("Origin"))
				if origin == "" {
					return true
				}
				if allowedOrigin == "" {
					return false
				}
				return origin == allowedOrigin
			},
		},
	})
	server.AddTransport(transport.GET{})
	server.AddTransport(transport.POST{})
	server.SetQueryCache(lru.New[*ast.QueryDocument](graphQLConfig.QueryCacheSize))
	server.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New[string](graphQLConfig.APQCacheSize),
	})
	server.SetErrorPresenter(func(ctx context.Context, err error) *gqlerror.Error {
		httpapi.LogError(ctx, "admin graphql execution failed", err, "component", "admin_graphql")

		gqlErr := graphql.DefaultErrorPresenter(ctx, err)
		presentedErr := presentAdminError(ctx, err)

		gqlErr.Message = presentedErr.Message
		if gqlErr.Extensions == nil {
			gqlErr.Extensions = map[string]any{}
		}
		gqlErr.Extensions["code"] = presentedErr.Code
		gqlErr.Extensions["httpStatus"] = presentedErr.HTTPStatus
		gqlErr.Extensions["retryable"] = isRetryableAdminError(presentedErr)
		if requestID := httpapi.RequestIDFromContext(ctx); requestID != "" {
			gqlErr.Extensions["requestId"] = requestID
		}

		return gqlErr
	})
	server.SetRecoverFunc(func(ctx context.Context, recovered any) error {
		httpapi.LogError(
			ctx,
			"admin graphql panic recovered",
			apperrors.Internal("Internal server error", fmt.Errorf("panic: %v", recovered)),
			"component",
			"admin_graphql",
		)
		return apperrors.Internal("Internal server error", nil)
	})

	return server
}

func getAdminGraphQLServer() *graphqlhandler.Server {
	adminGraphQLServerOnce.Do(func() {
		adminGraphQLServer = newAdminGraphQLServer()
	})

	return adminGraphQLServer
}

func Handler(w http.ResponseWriter, r *http.Request) {
	r = httpapi.EnsureRequestContext(w, r)
	if r == nil {
		writeAdminErrorWithContext(context.Background(), w, apperrors.Internal("invalid request context", nil))
		return
	}

	httpConfig := appconfig.ResolveHTTPConfig()
	if httpConfig.AllowedOrigin == "" {
		writeAdminErrorWithContext(r.Context(), w, apperrors.Config("configuration error", nil))
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", httpConfig.AllowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept-Language, X-CSRF-Token")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Vary", "Origin")
	w.Header().Set("Cache-Control", "no-store")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeAdminErrorWithContext(r.Context(), w, apperrors.MethodNotAllowed("method not allowed"))
		return
	}

	adminConfig := appconfig.ResolveAdminConfig()
	if _, err := httpauth.EnsureCSRFCookie(w, r, adminConfig.CSRFCookieName, adminConfig.SecureCookies, "/"); err != nil {
		writeAdminErrorWithContext(r.Context(), w, apperrors.Internal("failed to initialize csrf token", err))
		return
	}

	if isMutation, err := isAdminMutationRequest(r); err != nil {
		writeAdminErrorWithContext(r.Context(), w, apperrors.BadRequest("invalid GraphQL request payload"))
		return
	} else if isMutation && !isCSRFExemptOperation(r) {
		if err := httpauth.ValidateDoubleSubmitCSRF(r, adminConfig.CSRFCookieName); err != nil {
			writeAdminErrorWithContext(r.Context(), w, apperrors.Unauthorized("invalid csrf token"))
			return
		}
	}

	requestWithContext, err := admingraphql.WithAdminRequestContext(r.Context(), r, w)
	if err != nil {
		writeAdminErrorWithContext(r.Context(), w, apperrors.Internal("failed to resolve admin auth", err))
		return
	}

	getAdminGraphQLServer().ServeHTTP(w, r.WithContext(requestWithContext))
}

func isAdminMutationRequest(r *http.Request) (bool, error) {
	if r == nil || r.Method != http.MethodPost || r.Body == nil {
		return false, nil
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		return false, err
	}
	r.Body = io.NopCloser(bytes.NewReader(bodyBytes))

	var payload struct {
		Query string `json:"query"`
	}
	if err := json.Unmarshal(bodyBytes, &payload); err != nil {
		return false, err
	}

	trimmedQuery := strings.TrimSpace(payload.Query)
	return strings.HasPrefix(trimmedQuery, "mutation"), nil
}

func isCSRFExemptOperation(r *http.Request) bool {
	if r == nil || r.Method != http.MethodPost || r.Body == nil {
		return false
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		return false
	}
	r.Body = io.NopCloser(bytes.NewReader(bodyBytes))

	var payload struct {
		Query string `json:"query"`
	}
	if err := json.Unmarshal(bodyBytes, &payload); err != nil {
		return false
	}

	trimmedQuery := strings.TrimSpace(payload.Query)
	return strings.Contains(trimmedQuery, "mutation AdminLogin") || strings.Contains(trimmedQuery, "mutation AdminRefreshSession")
}
