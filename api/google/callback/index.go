package googlecallback

import (
	"net/http"

	oauthcallback "suaybsimsek.com/blog-api/pkg/web/oauthcallback"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	oauthcallback.GoogleHandler(w, r)
}
