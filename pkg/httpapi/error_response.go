package httpapi

import (
	"context"
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
	RequestID string `json:"requestId,omitempty"`
}

func WriteError(w http.ResponseWriter, err error) {
	WriteErrorWithContext(context.Background(), w, err)
}

func WriteErrorWithContext(ctx context.Context, w http.ResponseWriter, err error) {
	appErr := apperrors.From(err)
	LogError(ctx, "http request failed", err)

	response := ErrorResponse{
		Status:    "error",
		Code:      appErr.Code,
		Message:   appErr.Message,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
	if requestID := RequestIDFromContext(ctx); requestID != "" {
		response.RequestID = requestID
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(appErr.HTTPStatus)
	_ = json.NewEncoder(w).Encode(response)
}
