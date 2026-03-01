package handler

import (
	"net/http"

	dispatchhandler "suaybsimsek.com/blog-api/pkg/web/newsletterdispatch"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	dispatchhandler.Handler(w, r)
}
