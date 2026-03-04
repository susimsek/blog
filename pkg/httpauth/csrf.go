package httpauth

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"net/http"
	"strings"
)

var ErrInvalidCSRFToken = errors.New("invalid csrf token")

const CSRFHeaderName = "X-CSRF-Token"

func GenerateCSRFToken() (string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(buffer), nil
}

func EnsureCSRFCookie(w http.ResponseWriter, r *http.Request, cookieName string, secure bool, path string) (string, error) {
	if r != nil {
		if cookie, err := r.Cookie(cookieName); err == nil && strings.TrimSpace(cookie.Value) != "" {
			return cookie.Value, nil
		}
	}

	token, err := GenerateCSRFToken()
	if err != nil {
		return "", err
	}

	SetClientCookie(w, cookieName, token, 86400, secure, path)
	return token, nil
}

func ValidateDoubleSubmitCSRF(r *http.Request, cookieName string) error {
	if r == nil {
		return ErrInvalidCSRFToken
	}

	cookie, err := r.Cookie(cookieName)
	if err != nil {
		return ErrInvalidCSRFToken
	}

	cookieValue := strings.TrimSpace(cookie.Value)
	headerValue := strings.TrimSpace(r.Header.Get(CSRFHeaderName))
	if cookieValue == "" || headerValue == "" || cookieValue != headerValue {
		return ErrInvalidCSRFToken
	}

	return nil
}
