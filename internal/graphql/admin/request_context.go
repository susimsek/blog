package admingraphql

import (
	"context"
	"net/http"
	"strings"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	appservice "suaybsimsek.com/blog-api/internal/service"
	"suaybsimsek.com/blog-api/pkg/apperrors"
)

type (
	responseWriterContextKey struct{}
	requestContextKey        struct{}
	adminUserContextKey      struct{}
)

func withRequestContext(ctx context.Context, request *http.Request, responseWriter http.ResponseWriter) context.Context {
	if responseWriter != nil {
		ctx = context.WithValue(ctx, responseWriterContextKey{}, responseWriter)
	}
	if request != nil {
		ctx = context.WithValue(ctx, requestContextKey{}, request)
	}
	return ctx
}

func WithAdminRequestContext(
	ctx context.Context,
	request *http.Request,
	responseWriter http.ResponseWriter,
) (context.Context, error) {
	ctx = withRequestContext(ctx, request, responseWriter)
	if request == nil {
		return ctx, nil
	}

	config := appconfig.ResolveAdminConfig()
	if config.AccessCookieName == "" {
		return ctx, nil
	}

	cookie, err := request.Cookie(config.AccessCookieName)
	if err != nil {
		return ctx, nil
	}

	user, err := appservice.ResolveAdminFromAccessToken(ctx, cookie.Value)
	if err != nil {
		return ctx, nil
	}
	if user == nil {
		return ctx, nil
	}

	return WithAdminUser(ctx, user), nil
}

func getRequest(ctx context.Context) *http.Request {
	if ctx == nil {
		return nil
	}

	request, _ := ctx.Value(requestContextKey{}).(*http.Request)
	return request
}

func getResponseWriter(ctx context.Context) http.ResponseWriter {
	if ctx == nil {
		return nil
	}

	responseWriter, _ := ctx.Value(responseWriterContextKey{}).(http.ResponseWriter)
	return responseWriter
}

func WithAdminUser(ctx context.Context, user *domain.AdminUser) context.Context {
	if ctx == nil || user == nil {
		return ctx
	}

	return context.WithValue(ctx, adminUserContextKey{}, user)
}

func getAdminUser(ctx context.Context) *domain.AdminUser {
	if ctx == nil {
		return nil
	}

	user, _ := ctx.Value(adminUserContextKey{}).(*domain.AdminUser)
	return user
}

func requireAdminUser(ctx context.Context) (*domain.AdminUser, error) {
	user := getAdminUser(ctx)
	if user == nil || strings.TrimSpace(user.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	return user, nil
}
