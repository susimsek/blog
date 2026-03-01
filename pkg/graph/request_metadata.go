package graph

import (
	"context"
	"net"
	"net/http"
	"strings"

	appservice "suaybsimsek.com/blog-api/internal/service"
)

type requestMetadataKey struct{}

func WithRequestMetadata(ctx context.Context, request *http.Request) context.Context {
	if request == nil {
		return ctx
	}

	metadata := appservice.RequestMetadata{
		ClientIP:       resolveClientIP(request),
		UserAgent:      strings.TrimSpace(request.UserAgent()),
		AcceptLanguage: strings.TrimSpace(request.Header.Get("Accept-Language")),
	}

	return context.WithValue(ctx, requestMetadataKey{}, metadata)
}

func getRequestMetadata(ctx context.Context) appservice.RequestMetadata {
	if ctx == nil {
		return appservice.RequestMetadata{}
	}

	metadata, ok := ctx.Value(requestMetadataKey{}).(appservice.RequestMetadata)
	if !ok {
		return appservice.RequestMetadata{}
	}

	return metadata
}

func resolveClientIP(request *http.Request) string {
	forwarded := strings.TrimSpace(request.Header.Get("X-Forwarded-For"))
	if forwarded != "" {
		parts := strings.Split(forwarded, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}

	if realIP := strings.TrimSpace(request.Header.Get("X-Real-IP")); realIP != "" {
		return realIP
	}

	host, _, err := net.SplitHostPort(strings.TrimSpace(request.RemoteAddr))
	if err == nil {
		return host
	}

	return strings.TrimSpace(request.RemoteAddr)
}
