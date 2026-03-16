package handler

import (
	"net/http"

	githubhandler "suaybsimsek.com/blog-api/pkg/web/admingithub"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	githubhandler.Handler(w, r)
}
