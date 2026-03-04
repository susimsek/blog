package admingraphql

import (
	"net/http"

	admingraphqlhandler "suaybsimsek.com/blog-api/pkg/web/admingraphql"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	admingraphqlhandler.Handler(w, r)
}
