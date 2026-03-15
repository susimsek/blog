package handler

import (
	"net/http"

	changehandler "suaybsimsek.com/blog-api/pkg/web/adminemailchange"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	changehandler.Handler(w, r)
}
