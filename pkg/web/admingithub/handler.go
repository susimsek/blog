package admingithub

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	appservice "suaybsimsek.com/blog-api/internal/service"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpapi"
	"suaybsimsek.com/blog-api/pkg/httpauth"
)

const (
	githubOAuthCallbackPath = "/api/github/callback"
	githubOAuthStateCookie  = "admin_github_oauth_state"
	githubOAuthStatePath    = "/api/github"
	githubOAuthStateTTL     = 10 * time.Minute
	githubOAuthStateVersion = "v1"
)

type githubOAuthState struct {
	Intent     string `json:"intent"`
	Locale     string `json:"locale"`
	UserID     string `json:"userId,omitempty"`
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
	case githubOAuthCallbackPath:
		handleGithubOAuthCallback(w, r)
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

	handleGithubOAuthStart(w, r)
}

func handleGithubOAuthStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	adminConfig := appconfig.ResolveAdminConfig()
	githubConfig := appconfig.ResolveAdminGithubConfig()
	if strings.TrimSpace(adminConfig.JWTSecret) == "" || !githubConfig.Enabled() {
		redirectToAdminFlow(w, r, resolveAdminLocale(r.URL.Query().Get("locale")), "login", "failed")
		return
	}

	siteURL, err := appconfig.ResolveSiteURL()
	if err != nil {
		redirectToAdminFlow(w, r, resolveAdminLocale(r.URL.Query().Get("locale")), "login", "failed")
		return
	}

	intent := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("intent")))
	if intent != "connect" && intent != "login" {
		intent = "login"
	}

	state := githubOAuthState{
		Intent:    intent,
		Locale:    resolveAdminLocale(r.URL.Query().Get("locale")),
		ExpiresAt: time.Now().UTC().Add(githubOAuthStateTTL).Unix(),
	}
	if intent == "connect" {
		adminUser, err := resolveAuthenticatedAdminUser(r)
		if err != nil || adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
			redirectToAdminFlow(w, r, state.Locale, intent, "failed")
			return
		}
		state.UserID = strings.TrimSpace(adminUser.ID)
	} else {
		state.RememberMe = resolveBooleanQueryValue(r.URL.Query().Get("rememberMe"))
	}

	stateToken, err := issueGithubOAuthState(state, adminConfig.JWTSecret)
	if err != nil {
		redirectToAdminFlow(w, r, state.Locale, intent, "failed")
		return
	}

	redirectURI := strings.TrimRight(siteURL, "/") + githubOAuthCallbackPath
	authorizeURL, err := buildGithubAuthorizeURL(githubConfig, redirectURI, stateToken)
	if err != nil {
		redirectToAdminFlow(w, r, state.Locale, intent, "failed")
		return
	}

	httpauth.SetCookie(
		w,
		githubOAuthStateCookie,
		stateToken,
		int(githubOAuthStateTTL.Seconds()),
		adminConfig.SecureCookies,
		githubOAuthStatePath,
	)
	http.Redirect(w, r, authorizeURL, http.StatusTemporaryRedirect)
}

func handleGithubOAuthCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	adminConfig := appconfig.ResolveAdminConfig()
	query := r.URL.Query()
	locale := resolveAdminLocale(query.Get("locale"))
	intent := "login"

	stateToken := strings.TrimSpace(query.Get("state"))
	stateCookie, _ := r.Cookie(githubOAuthStateCookie)
	clearGithubOAuthStateCookie(w, adminConfig)

	if stateToken == "" || stateCookie == nil || strings.TrimSpace(stateCookie.Value) == "" || stateCookie.Value != stateToken {
		redirectToAdminFlow(w, r, locale, intent, "failed")
		return
	}

	state, err := parseGithubOAuthState(stateToken, adminConfig.JWTSecret, time.Now().UTC())
	if err != nil {
		redirectToAdminFlow(w, r, locale, intent, "failed")
		return
	}
	locale = state.Locale
	intent = state.Intent

	if strings.TrimSpace(query.Get("error")) != "" {
		redirectToAdminFlow(w, r, locale, intent, "cancelled")
		return
	}

	code := strings.TrimSpace(query.Get("code"))
	if code == "" {
		redirectToAdminFlow(w, r, locale, intent, "failed")
		return
	}

	siteURL, err := appconfig.ResolveSiteURL()
	if err != nil {
		redirectToAdminFlow(w, r, locale, intent, "failed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	identity, err := appservice.ResolveAdminGithubIdentityFromCode(
		ctx,
		code,
		strings.TrimRight(siteURL, "/")+githubOAuthCallbackPath,
	)
	if err != nil {
		redirectToAdminFlow(w, r, locale, intent, mapGithubOAuthErrorToStatus(err, intent))
		return
	}

	switch intent {
	case "connect":
		if _, err := appservice.LinkAdminGithubAccount(ctx, state.UserID, identity); err != nil {
			redirectToAdminFlow(w, r, locale, intent, mapGithubOAuthErrorToStatus(err, intent))
			return
		}
		redirectToAdminFlow(w, r, locale, intent, "connected")
	default:
		payload, err := appservice.LoginAdminWithGithubSubject(
			ctx,
			identity.Subject,
			state.RememberMe,
			resolveAdminSessionMetadata(ctx, r),
		)
		if err != nil {
			redirectToAdminFlow(w, r, locale, intent, mapGithubOAuthErrorToStatus(err, intent))
			return
		}
		setAdminSessionCookies(w, adminConfig, payload)
		http.Redirect(w, r, "/"+locale+"/admin", http.StatusSeeOther)
	}
}

func buildGithubAuthorizeURL(config appconfig.AdminGithubConfig, redirectURI, stateToken string) (string, error) {
	if !config.Enabled() {
		return "", errors.New("github oauth is not configured")
	}

	parsed, err := url.Parse("https://github.com/login/oauth/authorize")
	if err != nil {
		return "", err
	}

	query := parsed.Query()
	query.Set("client_id", config.ClientID)
	query.Set("redirect_uri", strings.TrimSpace(redirectURI))
	query.Set("scope", "read:user user:email")
	query.Set("state", strings.TrimSpace(stateToken))
	query.Set("allow_signup", "false")
	parsed.RawQuery = query.Encode()

	return parsed.String(), nil
}

func resolveAuthenticatedAdminUser(r *http.Request) (*domain.AdminUser, error) {
	if r == nil {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	adminConfig := appconfig.ResolveAdminConfig()
	if strings.TrimSpace(adminConfig.AccessCookieName) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	cookie, err := r.Cookie(adminConfig.AccessCookieName)
	if err != nil || strings.TrimSpace(cookie.Value) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	adminUser, err := appservice.ResolveAdminFromAccessToken(r.Context(), cookie.Value)
	if err != nil {
		return nil, err
	}
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	return adminUser, nil
}

func issueGithubOAuthState(state githubOAuthState, secret string) (string, error) {
	payloadBytes, err := json.Marshal(state)
	if err != nil {
		return "", err
	}

	payload := base64.RawURLEncoding.EncodeToString(payloadBytes)
	signature := signGithubOAuthState(payload, secret)
	return githubOAuthStateVersion + "." + payload + "." + signature, nil
}

func parseGithubOAuthState(token, secret string, now time.Time) (*githubOAuthState, error) {
	parts := strings.Split(strings.TrimSpace(token), ".")
	if len(parts) != 3 || parts[0] != githubOAuthStateVersion {
		return nil, errors.New("invalid oauth state")
	}

	expectedSignature := signGithubOAuthState(parts[1], secret)
	if !hmac.Equal([]byte(expectedSignature), []byte(parts[2])) {
		return nil, errors.New("invalid oauth state signature")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, err
	}

	var payload githubOAuthState
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return nil, err
	}
	if payload.ExpiresAt <= now.UTC().Unix() {
		return nil, errors.New("expired oauth state")
	}
	if payload.Intent != "connect" && payload.Intent != "login" {
		return nil, errors.New("invalid oauth intent")
	}

	payload.Locale = resolveAdminLocale(payload.Locale)
	return &payload, nil
}

func signGithubOAuthState(payload, secret string) string {
	mac := hmac.New(sha256.New, []byte(strings.TrimSpace(secret)))
	_, _ = mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func clearGithubOAuthStateCookie(w http.ResponseWriter, config appconfig.AdminConfig) {
	httpauth.ClearCookie(w, githubOAuthStateCookie, config.SecureCookies, githubOAuthStatePath)
}

func resolveAdminLocale(value string) string {
	if strings.EqualFold(strings.TrimSpace(value), "tr") {
		return "tr"
	}
	return "en"
}

func resolveBooleanQueryValue(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "1", "true", "yes", "on":
		return true
	default:
		return false
	}
}

func resolveAdminSessionMetadata(ctx context.Context, request *http.Request) appservice.AdminSessionMetadata {
	metadata := appservice.AdminSessionMetadata{}
	if trace, ok := httpapi.RequestTraceFromContext(ctx); ok {
		metadata.RemoteIP = strings.TrimSpace(trace.RemoteIP)
		metadata.UserAgent = strings.TrimSpace(trace.UserAgent)
		metadata.CountryCode = strings.TrimSpace(strings.ToUpper(trace.CountryCode))
	}

	if request != nil && strings.TrimSpace(metadata.UserAgent) == "" {
		metadata.UserAgent = strings.TrimSpace(request.UserAgent())
	}

	return metadata
}

func setAdminSessionCookies(w http.ResponseWriter, config appconfig.AdminConfig, payload *appservice.AdminAuthResponse) {
	if payload == nil {
		return
	}

	httpauth.SetSessionCookie(
		w,
		config.AccessCookieName,
		payload.AccessToken,
		config.SecureCookies,
		"/",
	)
	if payload.RememberMe {
		httpauth.SetCookie(
			w,
			config.RefreshCookieName,
			payload.RefreshToken,
			int(payload.RefreshTTL.Seconds()),
			config.SecureCookies,
			"/api/admin",
		)
		return
	}

	httpauth.SetSessionCookie(
		w,
		config.RefreshCookieName,
		payload.RefreshToken,
		config.SecureCookies,
		"/api/admin",
	)
}

func mapGithubOAuthErrorToStatus(err error, intent string) string {
	appErr := apperrors.From(err)
	if appErr == nil {
		return "failed"
	}

	if intent == "login" && strings.EqualFold(strings.TrimSpace(appErr.Code), "UNAUTHORIZED") {
		return "not-linked"
	}
	if strings.EqualFold(strings.TrimSpace(appErr.Code), "BAD_REQUEST") &&
		strings.Contains(strings.ToLower(strings.TrimSpace(appErr.Message)), "another admin") {
		return "conflict"
	}

	return "failed"
}

func redirectToAdminFlow(w http.ResponseWriter, r *http.Request, locale, intent, status string) {
	redirectPath := fmt.Sprintf("/%s/admin/login?github=%s", resolveAdminLocale(locale), url.QueryEscape(status))
	if intent == "connect" {
		redirectPath = fmt.Sprintf("/%s/admin/settings/security?github=%s", resolveAdminLocale(locale), url.QueryEscape(status))
	}
	http.Redirect(w, r, redirectPath, http.StatusSeeOther)
}
