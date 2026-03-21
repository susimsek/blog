package handler

import (
	"net/http"

	resetrequesthandler "suaybsimsek.com/blog-api/pkg/web/adminpasswordresetrequest"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	resetrequesthandler.Handler(w, r)
}
