package httpapi

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net"
	"net/http"
	"strings"
)

const HeaderRequestID = "X-Request-ID"

type (
	requestIDContextKey    struct{}
	requestTraceContextKey struct{}
)

type RequestTrace struct {
	Method      string
	Path        string
	RemoteIP    string
	CountryCode string
	AcceptLang  string
	UserAgent   string
}

func EnsureRequestContext(w http.ResponseWriter, r *http.Request) *http.Request {
	if r == nil {
		return nil
	}

	requestID := normalizeRequestID(r.Header.Get(HeaderRequestID))
	if requestID == "" {
		requestID = generateRequestID()
	}

	if w != nil && requestID != "" {
		w.Header().Set(HeaderRequestID, requestID)
	}

	ctx := WithRequestID(r.Context(), requestID)
	ctx = WithRequestTrace(ctx, resolveRequestTrace(r))
	return r.WithContext(ctx)
}

func WithRequestID(ctx context.Context, requestID string) context.Context {
	if ctx == nil {
		ctx = context.Background()
	}

	trimmed := strings.TrimSpace(requestID)
	if trimmed == "" {
		return ctx
	}

	return context.WithValue(ctx, requestIDContextKey{}, trimmed)
}

func RequestIDFromContext(ctx context.Context) string {
	if ctx == nil {
		return ""
	}

	requestID, _ := ctx.Value(requestIDContextKey{}).(string)
	return strings.TrimSpace(requestID)
}

func WithRequestTrace(ctx context.Context, trace RequestTrace) context.Context {
	if ctx == nil {
		ctx = context.Background()
	}

	return context.WithValue(ctx, requestTraceContextKey{}, trace)
}

func RequestTraceFromContext(ctx context.Context) (RequestTrace, bool) {
	if ctx == nil {
		return RequestTrace{}, false
	}

	trace, ok := ctx.Value(requestTraceContextKey{}).(RequestTrace)
	return trace, ok
}

func normalizeRequestID(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" || len(trimmed) > 128 {
		return ""
	}

	for _, char := range trimmed {
		switch {
		case char >= 'a' && char <= 'z':
		case char >= 'A' && char <= 'Z':
		case char >= '0' && char <= '9':
		case char == '-' || char == '_' || char == '.':
		default:
			return ""
		}
	}

	return trimmed
}

func generateRequestID() string {
	buffer := make([]byte, 16)
	if _, err := rand.Read(buffer); err != nil {
		return ""
	}

	return hex.EncodeToString(buffer)
}

func resolveRequestTrace(r *http.Request) RequestTrace {
	if r == nil {
		return RequestTrace{}
	}

	path := "/"
	if r.URL != nil {
		path = strings.TrimSpace(r.URL.Path)
		if path == "" {
			path = "/"
		}
	}

	return RequestTrace{
		Method:      strings.TrimSpace(r.Method),
		Path:        path,
		RemoteIP:    resolveRemoteIP(r),
		CountryCode: resolveCountryCode(r),
		AcceptLang:  strings.TrimSpace(r.Header.Get("Accept-Language")),
		UserAgent:   strings.TrimSpace(r.UserAgent()),
	}
}

func resolveCountryCode(r *http.Request) string {
	if r == nil {
		return ""
	}

	for _, header := range []string{"CF-IPCountry", "X-Country-Code", "X-AppEngine-Country"} {
		value := strings.TrimSpace(strings.ToUpper(r.Header.Get(header)))
		if len(value) == 2 {
			return value
		}
	}

	return ""
}

func resolveRemoteIP(r *http.Request) string {
	if r == nil {
		return ""
	}

	forwardedFor := strings.TrimSpace(r.Header.Get("X-Forwarded-For"))
	if forwardedFor != "" {
		parts := strings.Split(forwardedFor, ",")
		if len(parts) > 0 {
			candidate := strings.TrimSpace(parts[0])
			if candidate != "" {
				return candidate
			}
		}
	}

	realIP := strings.TrimSpace(r.Header.Get("X-Real-IP"))
	if realIP != "" {
		return realIP
	}

	host := strings.TrimSpace(r.RemoteAddr)
	if host == "" {
		return ""
	}

	parsedHost, _, err := net.SplitHostPort(host)
	if err == nil {
		return strings.TrimSpace(parsedHost)
	}

	return host
}
