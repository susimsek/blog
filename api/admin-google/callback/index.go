package handler

import (
	"net/http"

	googlehandler "suaybsimsek.com/blog-api/pkg/web/admingoogle"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	googlehandler.Handler(w, r)
}
