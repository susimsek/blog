package adminpasswordresetconfirm

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	appservice "suaybsimsek.com/blog-api/internal/service"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpapi"
)

type confirmRequestPayload struct {
	Token           string `json:"token"`
	NewPassword     string `json:"newPassword"`
	ConfirmPassword string `json:"confirmPassword"`
	Locale          string `json:"locale"`
}

type validationResponse struct {
	Status string `json:"status"`
	Locale string `json:"locale"`
}

type confirmResponse struct {
	Success bool   `json:"success"`
	Locale  string `json:"locale"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		handleValidate(w, r)
	case http.MethodPost:
		handleConfirm(w, r)
	default:
		httpapi.WriteErrorWithContext(r.Context(), w, apperrors.MethodNotAllowed("method not allowed"))
	}
}

func handleValidate(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	token := strings.TrimSpace(query.Get("token"))
	locale := strings.TrimSpace(query.Get("locale"))

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	result, err := appservice.ValidateAdminPasswordResetToken(ctx, token, locale)
	if err != nil {
		httpapi.WriteErrorWithContext(ctx, w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(validationResponse{
		Status: result.Status,
		Locale: result.Locale,
	})
}

func handleConfirm(w http.ResponseWriter, r *http.Request) {
	var payload confirmRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpapi.WriteErrorWithContext(r.Context(), w, apperrors.BadRequest("request body is invalid"))
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	result, err := appservice.ResetAdminPasswordWithToken(
		ctx,
		payload.Token,
		payload.NewPassword,
		payload.ConfirmPassword,
		payload.Locale,
	)
	if err != nil {
		httpapi.WriteErrorWithContext(ctx, w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(confirmResponse{
		Success: result.Success,
		Locale:  result.Locale,
	})
}
