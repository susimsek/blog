package adminpasswordresetrequest

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	appservice "suaybsimsek.com/blog-api/internal/service"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpapi"
)

type requestPayload struct {
	Email  string `json:"email"`
	Locale string `json:"locale"`
}

type requestResponse struct {
	Success bool `json:"success"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		httpapi.WriteErrorWithContext(r.Context(), w, apperrors.MethodNotAllowed("method not allowed"))
		return
	}

	var payload requestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpapi.WriteErrorWithContext(r.Context(), w, apperrors.BadRequest("request body is invalid"))
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	if err := appservice.RequestAdminPasswordReset(ctx, payload.Email, payload.Locale); err != nil {
		httpapi.WriteErrorWithContext(ctx, w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(requestResponse{Success: true})
}
