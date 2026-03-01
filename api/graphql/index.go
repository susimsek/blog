package handler

import (
	"net/http"

	graphhandler "suaybsimsek.com/blog-api/pkg/web/graphql"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	graphhandler.Handler(w, r)
}
