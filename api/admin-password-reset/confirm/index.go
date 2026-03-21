package handler

import (
	"net/http"

	resetconfirmhandler "suaybsimsek.com/blog-api/pkg/web/adminpasswordresetconfirm"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	resetconfirmhandler.Handler(w, r)
}
