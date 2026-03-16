package readeroauth

import (
	"net/http"
	"net/url"
	"strings"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	appservice "suaybsimsek.com/blog-api/internal/service"
	"suaybsimsek.com/blog-api/pkg/httpauth"
	newsletterpkg "suaybsimsek.com/blog-api/pkg/newsletter"
)

func ResolveReaderLocale(value string) string {
	return newsletterpkg.ResolveLocale(strings.TrimSpace(value), "")
}

func ResolveBooleanQueryValue(value string) bool {
	resolved := strings.TrimSpace(strings.ToLower(value))
	return resolved == "1" || resolved == "true" || resolved == "yes" || resolved == "on"
}

func SanitizeReaderReturnTo(value, locale string) string {
	resolvedLocale := ResolveReaderLocale(locale)
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "/" + resolvedLocale
	}
	parsed, err := url.Parse(trimmed)
	if err != nil || strings.TrimSpace(parsed.Host) != "" || strings.TrimSpace(parsed.Scheme) != "" {
		return "/" + resolvedLocale
	}
	path := strings.TrimSpace(parsed.Path)
	if path == "" || !strings.HasPrefix(path, "/") || strings.HasPrefix(path, "//") {
		return "/" + resolvedLocale
	}
	return parsed.String()
}

func RedirectToReaderFlow(w http.ResponseWriter, r *http.Request, returnTo, provider, status string) {
	parsed, err := url.Parse(SanitizeReaderReturnTo(returnTo, ""))
	if err != nil {
		http.Redirect(w, r, "/en", http.StatusSeeOther)
		return
	}

	query := parsed.Query()
	query.Set("commentAuth", strings.TrimSpace(status))
	query.Set("commentProvider", strings.TrimSpace(provider))
	parsed.RawQuery = query.Encode()
	http.Redirect(w, r, parsed.String(), http.StatusSeeOther)
}

func SetReaderSessionCookies(w http.ResponseWriter, config appconfig.ReaderConfig, payload *appservice.ReaderAuthResponse) {
	httpauth.SetSessionCookie(w, config.AccessCookieName, payload.AccessToken, config.SecureCookies, "/")
	httpauth.SetCookie(
		w,
		config.RefreshCookieName,
		payload.RefreshToken,
		int(payload.RefreshTTL.Seconds()),
		config.SecureCookies,
		"/",
	)
}

func ClearReaderSessionCookies(w http.ResponseWriter, config appconfig.ReaderConfig) {
	httpauth.ClearCookie(w, config.AccessCookieName, config.SecureCookies, "/")
	httpauth.ClearCookie(w, config.RefreshCookieName, config.SecureCookies, "/")
}
