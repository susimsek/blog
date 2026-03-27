package mediaasset

import (
	"context"
	"net/http"
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

	mediaID := resolveMediaAssetID(r)
	if mediaID == "" {
		httpapi.WriteErrorWithContext(r.Context(), w, apperrors.BadRequest("media asset id is required"))
		return
	}

	asset, err := service.ResolveAdminMediaAsset(r.Context(), mediaID)
	if err != nil {
		httpapi.WriteErrorWithContext(r.Context(), w, err)
		return
	}

	if mediaAssetETagMatches(r.Header.Values("If-None-Match"), asset.ETag) {
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

func resolveMediaAssetID(r *http.Request) string {
	if queryID := strings.TrimSpace(r.URL.Query().Get("id")); queryID != "" {
		return queryID
	}
	return strings.TrimSpace(strings.TrimPrefix(r.URL.Path, "/api/media/"))
}

func mediaAssetETagMatches(values []string, current string) bool {
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
