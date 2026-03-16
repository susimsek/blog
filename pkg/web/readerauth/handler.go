package readerauth

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	appservice "suaybsimsek.com/blog-api/internal/service"
	"suaybsimsek.com/blog-api/pkg/httpapi"
	readeroauth "suaybsimsek.com/blog-api/pkg/web/readeroauth"
)

const (
	readerAuthSessionPath = "/api/reader-auth/session"
	readerAuthLogoutPath  = "/api/reader-auth/logout"
)

type readerAuthSessionResponse struct {
	Authenticated bool `json:"authenticated"`
	Providers     struct {
		Google bool `json:"google"`
		Github bool `json:"github"`
	} `json:"providers"`
	Viewer *struct {
		ID        string `json:"id"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatarUrl,omitempty"`
		Provider  string `json:"provider,omitempty"`
	} `json:"viewer,omitempty"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	r = httpapi.EnsureRequestContext(w, r)
	if r == nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if !applyReaderAuthCORS(w, r) {
		return
	}

	switch r.URL.Path {
	case readerAuthSessionPath:
		handleReaderAuthSession(w, r)
	case readerAuthLogoutPath:
		handleReaderAuthLogout(w, r)
	default:
		http.NotFound(w, r)
	}
}

func applyReaderAuthCORS(w http.ResponseWriter, r *http.Request) bool {
	httpConfig := appconfig.ResolveHTTPConfig()
	if httpConfig.AllowedOrigin == "" {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return false
	}

	w.Header().Set("Access-Control-Allow-Origin", httpConfig.AllowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept-Language")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Vary", "Origin")
	w.Header().Set("Cache-Control", "no-store")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return false
	}

	return true
}

func handleReaderAuthSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET, OPTIONS")
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	response := readerAuthSessionResponse{}
	response.Providers.Google = appconfig.ResolveReaderGoogleConfig().Enabled()
	response.Providers.Github = appconfig.ResolveReaderGithubConfig().Enabled()

	user := resolveAuthenticatedReader(r.Context(), r, w)
	if user != nil {
		response.Authenticated = true
		response.Viewer = &struct {
			ID        string `json:"id"`
			Name      string `json:"name"`
			Email     string `json:"email"`
			AvatarURL string `json:"avatarUrl,omitempty"`
			Provider  string `json:"provider,omitempty"`
		}{
			ID:        strings.TrimSpace(user.ID),
			Name:      strings.TrimSpace(user.Name),
			Email:     strings.TrimSpace(user.Email),
			AvatarURL: strings.TrimSpace(user.AvatarURL),
			Provider:  strings.TrimSpace(user.LastLoginProvider),
		}
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(response)
}

func handleReaderAuthLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST, OPTIONS")
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	readerConfig := appconfig.ResolveReaderConfig()
	refreshCookie, _ := r.Cookie(readerConfig.RefreshCookieName)
	if refreshCookie != nil && strings.TrimSpace(refreshCookie.Value) != "" {
		_ = appservice.LogoutReader(r.Context(), refreshCookie.Value)
	}

	readeroauth.ClearReaderSessionCookies(w, readerConfig)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func resolveAuthenticatedReader(_ context.Context, r *http.Request, w http.ResponseWriter) *domain.ReaderUser {
	readerConfig := appconfig.ResolveReaderConfig()
	trace, _ := httpapi.RequestTraceFromContext(r.Context())

	if accessCookie, err := r.Cookie(readerConfig.AccessCookieName); err == nil && strings.TrimSpace(accessCookie.Value) != "" {
		user, err := appservice.ResolveReaderFromAccessToken(r.Context(), accessCookie.Value)
		if err == nil && user != nil {
			return user
		}
	}

	refreshCookie, err := r.Cookie(readerConfig.RefreshCookieName)
	if err != nil || strings.TrimSpace(refreshCookie.Value) == "" {
		return nil
	}

	payload, err := appservice.RefreshReaderSession(r.Context(), refreshCookie.Value, appservice.ReaderSessionMetadata{
		UserAgent:   strings.TrimSpace(r.UserAgent()),
		RemoteIP:    trace.RemoteIP,
		CountryCode: trace.CountryCode,
	})
	if err != nil || payload == nil || payload.User == nil {
		readeroauth.ClearReaderSessionCookies(w, readerConfig)
		return nil
	}

	readeroauth.SetReaderSessionCookies(w, readerConfig, payload)
	return payload.User
}
