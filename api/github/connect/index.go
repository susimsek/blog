package githubconnect

import (
	"net/http"
	"strings"

	admingithubhandler "suaybsimsek.com/blog-api/pkg/web/admingithub"
	readergithubhandler "suaybsimsek.com/blog-api/pkg/web/readergithub"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	flow := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("flow")))

	switch flow {
	case "admin":
		admingithubhandler.Start(w, r)
	case "reader":
		readergithubhandler.Start(w, r)
	default:
		http.NotFound(w, r)
	}
}
