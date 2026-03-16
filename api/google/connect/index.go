package googleconnect

import (
	"net/http"
	"strings"

	admingooglehandler "suaybsimsek.com/blog-api/pkg/web/admingoogle"
	readergooglehandler "suaybsimsek.com/blog-api/pkg/web/readergoogle"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	flow := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("flow")))

	switch flow {
	case "admin":
		admingooglehandler.Start(w, r)
	case "reader":
		readergooglehandler.Start(w, r)
	default:
		http.NotFound(w, r)
	}
}
