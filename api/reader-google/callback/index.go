package readergoogle

import (
	"net/http"

	readergooglehandler "suaybsimsek.com/blog-api/pkg/web/readergoogle"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	readergooglehandler.Handler(w, r)
}
