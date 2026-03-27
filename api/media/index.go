package media

import (
	"net/http"

	mediaassethandler "suaybsimsek.com/blog-api/pkg/web/mediaasset"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	mediaassethandler.Handler(w, r)
}
