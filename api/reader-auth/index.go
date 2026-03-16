package readerauth

import (
	"net/http"

	readerauthhandler "suaybsimsek.com/blog-api/pkg/web/readerauth"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	readerauthhandler.Handler(w, r)
}
