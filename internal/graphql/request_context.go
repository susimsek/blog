package graphql

import (
	"context"
	"net/http"
	"strings"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	appservice "suaybsimsek.com/blog-api/internal/service"
)

type (
	requestContextKey    struct{}
	readerUserContextKey struct{}
)

func WithPublicRequestContext(ctx context.Context, request *http.Request) (context.Context, error) {
	if request != nil {
		ctx = context.WithValue(ctx, requestContextKey{}, request)
	}
	if request == nil {
		return ctx, nil
	}

	config := appconfig.ResolveReaderConfig()
	if strings.TrimSpace(config.AccessCookieName) == "" {
		return ctx, nil
	}

	cookie, err := request.Cookie(config.AccessCookieName)
	if err != nil || strings.TrimSpace(cookie.Value) == "" {
		return ctx, nil
	}

	user, err := appservice.ResolveReaderFromAccessToken(ctx, cookie.Value)
	if err != nil || user == nil {
		return ctx, nil
	}

	return context.WithValue(ctx, readerUserContextKey{}, user), nil
}

func getReaderUser(ctx context.Context) *domain.ReaderUser {
	if ctx == nil {
		return nil
	}

	user, _ := ctx.Value(readerUserContextKey{}).(*domain.ReaderUser)
	return user
}
