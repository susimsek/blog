package httpapi

import (
	"encoding/json"
	"net/http"
	"time"

	"suaybsimsek.com/blog-api/pkg/apperrors"
)

type ErrorResponse struct {
	Status    string `json:"status"`
	Code      string `json:"code"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
}

func WriteError(w http.ResponseWriter, err error) {
	appErr := apperrors.From(err)

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(appErr.HTTPStatus)
	_ = json.NewEncoder(w).Encode(ErrorResponse{
		Status:    "error",
		Code:      appErr.Code,
		Message:   appErr.Message,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
