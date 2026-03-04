package httpauth

import (
	"net/http"
	"strings"
	"time"
)

func SetCookie(
	w http.ResponseWriter,
	name string,
	value string,
	maxAge int,
	secure bool,
	path string,
) {
	if w == nil || strings.TrimSpace(name) == "" {
		return
	}

	resolvedPath := strings.TrimSpace(path)
	if resolvedPath == "" {
		resolvedPath = "/"
	}

	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     resolvedPath,
		MaxAge:   maxAge,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   secure,
		Expires:  time.Now().Add(time.Duration(maxAge) * time.Second),
	})
}

func SetSessionCookie(
	w http.ResponseWriter,
	name string,
	value string,
	secure bool,
	path string,
) {
	if w == nil || strings.TrimSpace(name) == "" {
		return
	}

	resolvedPath := strings.TrimSpace(path)
	if resolvedPath == "" {
		resolvedPath = "/"
	}

	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     resolvedPath,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   secure,
	})
}

func SetClientCookie(
	w http.ResponseWriter,
	name string,
	value string,
	maxAge int,
	secure bool,
	path string,
) {
	if w == nil || strings.TrimSpace(name) == "" {
		return
	}

	resolvedPath := strings.TrimSpace(path)
	if resolvedPath == "" {
		resolvedPath = "/"
	}

	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     resolvedPath,
		MaxAge:   maxAge,
		HttpOnly: false,
		SameSite: http.SameSiteLaxMode,
		Secure:   secure,
		Expires:  time.Now().Add(time.Duration(maxAge) * time.Second),
	})
}

func ClearCookie(w http.ResponseWriter, name string, secure bool, path string) {
	if w == nil || strings.TrimSpace(name) == "" {
		return
	}

	resolvedPath := strings.TrimSpace(path)
	if resolvedPath == "" {
		resolvedPath = "/"
	}

	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     resolvedPath,
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   secure,
		Expires:  time.Unix(0, 0).UTC(),
	})
}

func ClearClientCookie(w http.ResponseWriter, name string, secure bool, path string) {
	if w == nil || strings.TrimSpace(name) == "" {
		return
	}

	resolvedPath := strings.TrimSpace(path)
	if resolvedPath == "" {
		resolvedPath = "/"
	}

	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     resolvedPath,
		MaxAge:   -1,
		HttpOnly: false,
		SameSite: http.SameSiteLaxMode,
		Secure:   secure,
		Expires:  time.Unix(0, 0).UTC(),
	})
}
