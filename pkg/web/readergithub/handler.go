package readergithub

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
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
	readerGithubOAuthCallbackPath = "/api/github/callback"
	readerGithubOAuthStateCookie  = "reader_github_oauth_state"
	readerGithubOAuthStatePath    = "/api/github"
	readerGithubOAuthStateTTL     = 10 * time.Minute
	readerGithubOAuthStateVersion = "v1"
)

type readerGithubOAuthState struct {
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
	case readerGithubOAuthCallbackPath:
		handleReaderGithubOAuthCallback(w, r)
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

	handleReaderGithubOAuthStart(w, r)
}

func handleReaderGithubOAuthStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	readerConfig := appconfig.ResolveReaderConfig()
	githubConfig := appconfig.ResolveReaderGithubConfig()
	if strings.TrimSpace(readerConfig.JWTSecret) == "" || !githubConfig.Enabled() {
		readeroauth.RedirectToReaderFlow(
			w,
			r,
			readeroauth.SanitizeReaderReturnTo(r.URL.Query().Get("returnTo"), r.URL.Query().Get("locale")),
			"github",
			"failed",
		)
		return
	}

	siteURL, err := appconfig.ResolveSiteURL()
	if err != nil {
		readeroauth.RedirectToReaderFlow(
			w,
			r,
			readeroauth.SanitizeReaderReturnTo(r.URL.Query().Get("returnTo"), r.URL.Query().Get("locale")),
			"github",
			"failed",
		)
		return
	}

	state := readerGithubOAuthState{
		Locale:     readeroauth.ResolveReaderLocale(r.URL.Query().Get("locale")),
		ReturnTo:   readeroauth.SanitizeReaderReturnTo(r.URL.Query().Get("returnTo"), r.URL.Query().Get("locale")),
		RememberMe: readeroauth.ResolveBooleanQueryValue(r.URL.Query().Get("rememberMe")),
		ExpiresAt:  time.Now().UTC().Add(readerGithubOAuthStateTTL).Unix(),
	}

	stateToken, err := issueReaderGithubOAuthState(state, readerConfig.JWTSecret)
	if err != nil {
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "github", "failed")
		return
	}

	authorizeURL, err := buildReaderGithubAuthorizeURL(githubConfig, strings.TrimRight(siteURL, "/")+readerGithubOAuthCallbackPath, stateToken)
	if err != nil {
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "github", "failed")
		return
	}

	httpauth.SetCookie(w, readerGithubOAuthStateCookie, stateToken, int(readerGithubOAuthStateTTL.Seconds()), readerConfig.SecureCookies, readerGithubOAuthStatePath)
	http.Redirect(w, r, authorizeURL, http.StatusTemporaryRedirect)
}

func handleReaderGithubOAuthCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	readerConfig := appconfig.ResolveReaderConfig()
	query := r.URL.Query()
	stateToken := strings.TrimSpace(query.Get("state"))
	stateCookie, _ := r.Cookie(readerGithubOAuthStateCookie)
	clearReaderGithubOAuthStateCookie(w, readerConfig)
	if stateToken == "" || stateCookie == nil || strings.TrimSpace(stateCookie.Value) == "" || stateCookie.Value != stateToken {
		readeroauth.RedirectToReaderFlow(w, r, readeroauth.SanitizeReaderReturnTo("", query.Get("locale")), "github", "failed")
		return
	}

	state, err := parseReaderGithubOAuthState(stateToken, readerConfig.JWTSecret, time.Now().UTC())
	if err != nil {
		readeroauth.RedirectToReaderFlow(w, r, readeroauth.SanitizeReaderReturnTo("", query.Get("locale")), "github", "failed")
		return
	}

	if strings.TrimSpace(query.Get("error")) != "" {
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "github", "cancelled")
		return
	}

	code := strings.TrimSpace(query.Get("code"))
	if code == "" {
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "github", "failed")
		return
	}

	siteURL, err := appconfig.ResolveSiteURL()
	if err != nil {
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "github", "failed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	trace, _ := httpapi.RequestTraceFromContext(r.Context())

	identity, err := appservice.ResolveReaderGithubIdentityFromCode(ctx, code, strings.TrimRight(siteURL, "/")+readerGithubOAuthCallbackPath)
	if err != nil {
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "github", "failed")
		return
	}

	payload, err := appservice.LoginReaderWithGithubIdentity(ctx, identity, state.RememberMe, appservice.ReaderSessionMetadata{
		UserAgent:   strings.TrimSpace(r.UserAgent()),
		RemoteIP:    trace.RemoteIP,
		CountryCode: trace.CountryCode,
	})
	if err != nil {
		readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "github", "failed")
		return
	}

	readeroauth.SetReaderSessionCookies(w, readerConfig, payload)
	readeroauth.RedirectToReaderFlow(w, r, state.ReturnTo, "github", "connected")
}

func buildReaderGithubAuthorizeURL(config appconfig.ReaderGithubConfig, redirectURI, stateToken string) (string, error) {
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

func issueReaderGithubOAuthState(state readerGithubOAuthState, secret string) (string, error) {
	payloadBytes, err := json.Marshal(state)
	if err != nil {
		return "", err
	}
	payload := base64.RawURLEncoding.EncodeToString(payloadBytes)
	signature := signReaderGithubOAuthState(payload, secret)
	return readerGithubOAuthStateVersion + "." + payload + "." + signature, nil
}

func parseReaderGithubOAuthState(token, secret string, now time.Time) (*readerGithubOAuthState, error) {
	parts := strings.Split(strings.TrimSpace(token), ".")
	if len(parts) != 3 || parts[0] != readerGithubOAuthStateVersion {
		return nil, errors.New("invalid oauth state")
	}
	if !hmac.Equal([]byte(parts[2]), []byte(signReaderGithubOAuthState(parts[1], secret))) {
		return nil, errors.New("invalid oauth state signature")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, err
	}

	var payload readerGithubOAuthState
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

func signReaderGithubOAuthState(payload, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func clearReaderGithubOAuthStateCookie(w http.ResponseWriter, config appconfig.ReaderConfig) {
	httpauth.ClearCookie(w, readerGithubOAuthStateCookie, config.SecureCookies, readerGithubOAuthStatePath)
}
