package handler

import (
	"net/http"

	adminavatarhandler "suaybsimsek.com/blog-api/pkg/web/adminavatar"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	adminavatarhandler.Handler(w, r)
}
