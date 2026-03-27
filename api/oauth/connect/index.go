package oauthconnect

import (
	"net/http"
	"strings"

	admingithubhandler "suaybsimsek.com/blog-api/pkg/web/admingithub"
	admingooglehandler "suaybsimsek.com/blog-api/pkg/web/admingoogle"
	readergithubhandler "suaybsimsek.com/blog-api/pkg/web/readergithub"
	readergooglehandler "suaybsimsek.com/blog-api/pkg/web/readergoogle"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	provider := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("provider")))
	flow := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("flow")))

	if provider == "" {
		switch {
		case strings.Contains(r.URL.Path, "/api/google/connect"):
			provider = "google"
		case strings.Contains(r.URL.Path, "/api/github/connect"):
			provider = "github"
		}
	}

	switch provider + ":" + flow {
	case "google:admin":
		admingooglehandler.Start(w, r)
	case "google:reader":
		readergooglehandler.Start(w, r)
	case "github:admin":
		admingithubhandler.Start(w, r)
	case "github:reader":
		readergithubhandler.Start(w, r)
	default:
		http.NotFound(w, r)
	}
}
