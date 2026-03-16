package readergoogle

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	appservice "suaybsimsek.com/blog-api/internal/service"
	"suaybsimsek.com/blog-api/pkg/httpapi"
	"suaybsimsek.com/blog-api/pkg/httpauth"
	readeroauth "suaybsimsek.com/blog-api/pkg/web/readeroauth"
)

const (
	readerGoogleOAuthCallbackPath = "/api/google/callback"
	readerGoogleOAuthStateCookie  = "reader_google_oauth_state"
	readerGoogleOAuthStatePath    = "/api/google"
	readerGoogleOAuthStateTTL     = 10 * time.Minute
	readerGoogleOAuthStateVersion = "v1"
)

type readerGoogleOAuthState struct {
	Locale     string `json:"locale"`
	ReturnTo   string `json:"returnTo"`
	RememberMe bool   `json:"rememberMe,omitempty"`
	ExpiresAt  int64  `json:"exp"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	r = httpapi.EnsureRequestContext(w, r)
	if r == nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	switch r.URL.Path {
	case readerGoogleOAuthCallbackPath:
		handleReaderGoogleOAuthCallback(w, r)
	default:
		http.NotFound(w, r)
	}
}

func Start(w http.ResponseWriter, r *http.Request) {
	r = httpapi.EnsureRequestContext(w, r)
	if r == nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	handleReaderGoogleOAuthStart(w, r)
}

func handleReaderGoogleOAuthStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	readerConfig := appconfig.ResolveReaderConfig()
	googleConfig := appconfig.ResolveReaderGoogleConfig()
	if strings.TrimSpace(readerConfig.JWTSecret) == "" || !googleConfig.Enabled() {
		slog.WarnContext(r.Context(), "reader google oauth start failed", "reason", "provider_not_configured")
		readeroauth.RedirectToReaderFlow(
			w,
			r,
			readeroauth.SanitizeReaderReturnTo(r.URL.Query().Get("returnTo"), r.URL.Query().Get("locale")),
			"google",
			"failed",
		)
		return
	}

	siteURL, err := appconfig.ResolveSiteURL()
	if err != nil {
		slog.WarnContext(r.Context(), "reader google oauth start failed", "reason", "site_url_resolution_failed", "error", err)
		readeroauth.RedirectToReaderFlow(
			w,
			r,
			readeroauth.SanitizeReaderReturnTo(r.URL.Query().Get("returnTo"), r.URL.Query().Get("locale")),
			"google",
			"failed",
		)
		return
	}

	state := readerGoogleOAuthState{
		Locale:     readeroauth.ResolveReaderLocale(r.URL.Query().Get("locale")),
		ReturnTo:   readeroauth.SanitizeReaderReturnTo(r.URL.Query().Get("returnTo"), r.URL.Query().Get("locale")),
		RememberMe: readeroauth.ResolveBooleanQueryValue(r.URL.Query().Get("rememberMe")),
		ExpiresAt:  time.Now().UTC().Add(readerGoogleOAuthStateTTL).Unix(),
	}

	stateToken, err := issueReaderGoogleOAuthState(state, readerConfig.JWTSecret)
	if err != nil {
		slog.WarnContext(r.Context(), "reader google oauth start failed", "reason", "state_issue_failed", "error", err)
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "google", "failed")
		return
	}

	authorizeURL, err := buildReaderGoogleAuthorizeURL(googleConfig, strings.TrimRight(siteURL, "/")+readerGoogleOAuthCallbackPath, stateToken)
	if err != nil {
		slog.WarnContext(r.Context(), "reader google oauth start failed", "reason", "authorize_url_build_failed", "error", err)
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "google", "failed")
		return
	}

	httpauth.SetCookie(w, readerGoogleOAuthStateCookie, stateToken, int(readerGoogleOAuthStateTTL.Seconds()), readerConfig.SecureCookies, readerGoogleOAuthStatePath)
	http.Redirect(w, r, authorizeURL, http.StatusTemporaryRedirect)
}

func handleReaderGoogleOAuthCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	readerConfig := appconfig.ResolveReaderConfig()
	query := r.URL.Query()
	stateToken := strings.TrimSpace(query.Get("state"))
	stateCookie, _ := r.Cookie(readerGoogleOAuthStateCookie)
	clearReaderGoogleOAuthStateCookie(w, readerConfig)
	if stateToken == "" || stateCookie == nil || strings.TrimSpace(stateCookie.Value) == "" || stateCookie.Value != stateToken {
		slog.WarnContext(
			r.Context(),
			"reader google oauth callback failed",
			"reason",
			"state_mismatch",
			"hasStateToken",
			stateToken != "",
			"hasStateCookie",
			stateCookie != nil && strings.TrimSpace(stateCookie.Value) != "",
		)
		readeroauth.RedirectToReaderFlow(w, r, readeroauth.SanitizeReaderReturnTo("", query.Get("locale")), "google", "failed")
		return
	}

	state, err := parseReaderGoogleOAuthState(stateToken, readerConfig.JWTSecret, time.Now().UTC())
	if err != nil {
		slog.WarnContext(r.Context(), "reader google oauth callback failed", "reason", "state_parse_failed", "error", err)
		readeroauth.RedirectToReaderFlow(w, r, readeroauth.SanitizeReaderReturnTo("", query.Get("locale")), "google", "failed")
		return
	}

	if strings.TrimSpace(query.Get("error")) != "" {
		slog.WarnContext(
			r.Context(),
			"reader google oauth callback cancelled",
			"reason",
			"provider_cancelled",
			"providerError",
			strings.TrimSpace(query.Get("error")),
		)
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "google", "cancelled")
		return
	}

	code := strings.TrimSpace(query.Get("code"))
	if code == "" {
		slog.WarnContext(r.Context(), "reader google oauth callback failed", "reason", "missing_code")
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "google", "failed")
		return
	}

	siteURL, err := appconfig.ResolveSiteURL()
	if err != nil {
		slog.WarnContext(r.Context(), "reader google oauth callback failed", "reason", "site_url_resolution_failed", "error", err)
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "google", "failed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	trace, _ := httpapi.RequestTraceFromContext(r.Context())

	identity, err := appservice.ResolveReaderGoogleIdentityFromCode(ctx, code, strings.TrimRight(siteURL, "/")+readerGoogleOAuthCallbackPath)
	if err != nil {
		slog.WarnContext(r.Context(), "reader google oauth callback failed", "reason", "identity_exchange_failed", "error", err)
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "google", "failed")
		return
	}

	payload, err := appservice.LoginReaderWithGoogleIdentity(ctx, identity, state.RememberMe, appservice.ReaderSessionMetadata{
		UserAgent:   strings.TrimSpace(r.UserAgent()),
		RemoteIP:    trace.RemoteIP,
		CountryCode: trace.CountryCode,
	})
	if err != nil {
		slog.WarnContext(
			r.Context(),
			"reader google oauth callback failed",
			"reason",
			"reader_login_failed",
			"error",
			err,
			"googleSubject",
			identity.Subject,
			"googleEmail",
			identity.Email,
		)
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "google", "failed")
		return
	}

	readeroauth.SetReaderSessionCookies(w, readerConfig, payload)
	slog.InfoContext(
		r.Context(),
		"reader google oauth callback succeeded",
		"reason",
		"connected",
		"readerID",
		payload.User.ID,
		"readerEmail",
		payload.User.Email,
	)
	readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "google", "connected")
}

func buildReaderGoogleAuthorizeURL(config appconfig.ReaderGoogleConfig, redirectURI, stateToken string) (string, error) {
	parsed, err := url.Parse("https://accounts.google.com/o/oauth2/v2/auth")
	if err != nil {
		return "", err
	}

	query := parsed.Query()
	query.Set("client_id", config.ClientID)
	query.Set("redirect_uri", strings.TrimSpace(redirectURI))
	query.Set("response_type", "code")
	query.Set("scope", "openid email profile")
	query.Set("state", strings.TrimSpace(stateToken))
	query.Set("prompt", "select_account")
	parsed.RawQuery = query.Encode()

	return parsed.String(), nil
}

func issueReaderGoogleOAuthState(state readerGoogleOAuthState, secret string) (string, error) {
	payloadBytes, err := json.Marshal(state)
	if err != nil {
		return "", err
	}
	payload := base64.RawURLEncoding.EncodeToString(payloadBytes)
	signature := signReaderGoogleOAuthState(payload, secret)
	return readerGoogleOAuthStateVersion + "." + payload + "." + signature, nil
}

func parseReaderGoogleOAuthState(token, secret string, now time.Time) (*readerGoogleOAuthState, error) {
	parts := strings.Split(strings.TrimSpace(token), ".")
	if len(parts) != 3 || parts[0] != readerGoogleOAuthStateVersion {
		return nil, errors.New("invalid oauth state")
	}
	if !hmac.Equal([]byte(parts[2]), []byte(signReaderGoogleOAuthState(parts[1], secret))) {
		return nil, errors.New("invalid oauth state signature")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, err
	}

	var payload readerGoogleOAuthState
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return nil, err
	}
	if payload.ExpiresAt <= now.UTC().Unix() {
		return nil, errors.New("expired oauth state")
	}
	payload.Locale = readeroauth.ResolveReaderLocale(payload.Locale)
	payload.ReturnTo = readeroauth.SanitizeReaderReturnTo(payload.ReturnTo, payload.Locale)
	return &payload, nil
}

func signReaderGoogleOAuthState(payload, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func clearReaderGoogleOAuthStateCookie(w http.ResponseWriter, config appconfig.ReaderConfig) {
	httpauth.ClearCookie(w, readerGoogleOAuthStateCookie, config.SecureCookies, readerGoogleOAuthStatePath)
}
