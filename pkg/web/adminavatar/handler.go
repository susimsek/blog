package handler

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"suaybsimsek.com/blog-api/internal/service"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpapi"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	r = httpapi.EnsureRequestContext(w, r)
	if r == nil {
		httpapi.WriteErrorWithContext(context.Background(), w, apperrors.Internal("invalid request context", nil))
		return
	}

	if r.Method == http.MethodOptions {
		w.Header().Set("Allow", "GET, HEAD, OPTIONS")
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD, OPTIONS")
		httpapi.WriteErrorWithContext(r.Context(), w, apperrors.MethodNotAllowed("method not allowed"))
		return
	}

	query := r.URL.Query()
	userID := strings.TrimSpace(query.Get("id"))
	if userID == "" {
		httpapi.WriteErrorWithContext(r.Context(), w, apperrors.BadRequest("avatar user is required"))
		return
	}

	size, err := parseAvatarSize(query.Get("s"))
	if err != nil {
		httpapi.WriteErrorWithContext(r.Context(), w, err)
		return
	}

	version, err := parseAvatarVersion(query.Get("v"))
	if err != nil {
		httpapi.WriteErrorWithContext(r.Context(), w, err)
		return
	}

	asset, err := service.ResolveAdminAvatarAsset(
		r.Context(),
		userID,
		size,
		strings.TrimSpace(query.Get("u")),
		version,
	)
	if err != nil {
		httpapi.WriteErrorWithContext(r.Context(), w, err)
		return
	}

	if avatarETagMatches(r.Header.Values("If-None-Match"), asset.ETag) {
		w.Header().Set("ETag", asset.ETag)
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		w.WriteHeader(http.StatusNotModified)
		return
	}

	w.Header().Set("Content-Type", asset.ContentType)
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	w.Header().Set("ETag", asset.ETag)
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(http.StatusOK)

	if r.Method == http.MethodHead {
		return
	}
	_, _ = w.Write(asset.Data)
}

func parseAvatarSize(value string) (int, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		return 0, nil
	}

	size, err := strconv.Atoi(resolved)
	if err != nil {
		return 0, apperrors.BadRequest("avatar size must be a valid integer")
	}

	return size, nil
}

func parseAvatarVersion(value string) (int64, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		return 0, nil
	}

	version, err := strconv.ParseInt(resolved, 10, 64)
	if err != nil {
		return 0, apperrors.BadRequest("avatar version must be a valid integer")
	}

	return version, nil
}

func avatarETagMatches(values []string, current string) bool {
	resolvedCurrent := strings.TrimSpace(current)
	if resolvedCurrent == "" {
		return false
	}

	for _, value := range values {
		for candidate := range strings.SplitSeq(value, ",") {
			trimmed := strings.TrimSpace(candidate)
			if trimmed == "" {
				continue
			}
			if trimmed == "*" || trimmed == resolvedCurrent {
				return true
			}
			if strings.HasPrefix(trimmed, "W/") && strings.TrimPrefix(trimmed, "W/") == resolvedCurrent {
				return true
			}
		}
	}

	return false
}
