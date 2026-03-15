package adminemailchange

import (
	"context"
	"net/http"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	appservice "suaybsimsek.com/blog-api/internal/service"
	adminmailpkg "suaybsimsek.com/blog-api/pkg/adminmail"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	siteURL, err := appconfig.ResolveSiteURL()
	if err != nil {
		writeStatusPage(w, http.StatusServiceUnavailable, adminmailpkg.StatusConfigError, "en", "/")
		return
	}

	query := r.URL.Query()
	localeHint := strings.TrimSpace(query.Get("locale"))
	token := strings.TrimSpace(query.Get("token"))
	if token == "" {
		writeStatusPage(w, http.StatusBadRequest, adminmailpkg.StatusInvalidLink, localeHint, siteURL)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	result, err := appservice.ConfirmAdminEmailChange(ctx, token, localeHint)
	if err != nil {
		status := adminmailpkg.StatusServiceUnavailable
		if strings.Contains(strings.ToLower(strings.TrimSpace(err.Error())), "config") {
			status = adminmailpkg.StatusConfigError
		}
		writeStatusPage(w, http.StatusServiceUnavailable, status, localeHint, siteURL)
		return
	}

	status := adminmailpkg.StatusKey(strings.TrimSpace(result.Status))
	switch status {
	case adminmailpkg.StatusSuccess:
		writeStatusPage(w, http.StatusOK, status, result.Locale, siteURL)
	case adminmailpkg.StatusExpired:
		writeStatusPage(w, http.StatusGone, status, result.Locale, siteURL)
	case adminmailpkg.StatusInvalidLink:
		writeStatusPage(w, http.StatusBadRequest, status, result.Locale, siteURL)
	default:
		writeStatusPage(w, http.StatusBadRequest, adminmailpkg.StatusFailed, result.Locale, siteURL)
	}
}

func writeStatusPage(w http.ResponseWriter, statusCode int, status adminmailpkg.StatusKey, locale, siteURL string) {
	body, err := adminmailpkg.StatusPage(locale, status, siteURL)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusServiceUnavailable), http.StatusServiceUnavailable)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(statusCode)
	_, _ = w.Write([]byte(body))
}
