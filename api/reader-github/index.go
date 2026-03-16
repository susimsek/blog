package readergithub

import (
	"net/http"

	readergithubhandler "suaybsimsek.com/blog-api/pkg/web/readergithub"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	readergithubhandler.Handler(w, r)
}
