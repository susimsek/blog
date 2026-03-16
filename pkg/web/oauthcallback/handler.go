package oauthcallback

import (
	"net/http"
	"strings"

	admingithubhandler "suaybsimsek.com/blog-api/pkg/web/admingithub"
	admingooglehandler "suaybsimsek.com/blog-api/pkg/web/admingoogle"
	readergithubhandler "suaybsimsek.com/blog-api/pkg/web/readergithub"
	readergooglehandler "suaybsimsek.com/blog-api/pkg/web/readergoogle"
)

const (
	googleCallbackPath = "/api/google/callback"
	githubCallbackPath = "/api/github/callback"
)

type callbackTarget struct {
	cookieName string
	targetPath string
	handler    func(http.ResponseWriter, *http.Request)
}

func GoogleHandler(w http.ResponseWriter, r *http.Request) {
	dispatchProviderCallback(w, r, []callbackTarget{
		{
			cookieName: "admin_google_oauth_state",
			targetPath: googleCallbackPath,
			handler:    admingooglehandler.Handler,
		},
		{
			cookieName: "reader_google_oauth_state",
			targetPath: googleCallbackPath,
			handler:    readergooglehandler.Handler,
		},
	})
}

func GithubHandler(w http.ResponseWriter, r *http.Request) {
	dispatchProviderCallback(w, r, []callbackTarget{
		{
			cookieName: "admin_github_oauth_state",
			targetPath: githubCallbackPath,
			handler:    admingithubhandler.Handler,
		},
		{
			cookieName: "reader_github_oauth_state",
			targetPath: githubCallbackPath,
			handler:    readergithubhandler.Handler,
		},
	})
}

func dispatchProviderCallback(w http.ResponseWriter, r *http.Request, targets []callbackTarget) {
	stateToken := strings.TrimSpace(r.URL.Query().Get("state"))

	for _, target := range targets {
		if cookieMatchesState(r, target.cookieName, stateToken) {
			delegateCallback(w, r, target)
			return
		}
	}

	var fallback *callbackTarget
	for i := range targets {
		if hasCookieValue(r, targets[i].cookieName) {
			if fallback != nil {
				http.NotFound(w, r)
				return
			}
			fallback = &targets[i]
		}
	}

	if fallback == nil {
		http.NotFound(w, r)
		return
	}

	delegateCallback(w, r, *fallback)
}

func delegateCallback(w http.ResponseWriter, r *http.Request, target callbackTarget) {
	cloned := r.Clone(r.Context())
	if cloned.URL != nil {
		updatedURL := *cloned.URL
		updatedURL.Path = target.targetPath
		updatedURL.RawPath = target.targetPath
		cloned.URL = &updatedURL
	}
	cloned.RequestURI = target.targetPath
	target.handler(w, cloned)
}

func cookieMatchesState(r *http.Request, name, stateToken string) bool {
	if stateToken == "" {
		return false
	}

	cookie, err := r.Cookie(name)
	if err != nil {
		return false
	}

	return strings.TrimSpace(cookie.Value) == stateToken
}

func hasCookieValue(r *http.Request, name string) bool {
	cookie, err := r.Cookie(name)
	if err != nil {
		return false
	}

	return strings.TrimSpace(cookie.Value) != ""
}
