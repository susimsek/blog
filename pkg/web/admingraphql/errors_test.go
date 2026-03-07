package handler

import (
	"context"
	"net/http"
	"testing"

	"suaybsimsek.com/blog-api/pkg/apperrors"
)

func TestPresentAdminError(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		err        error
		wantCode   string
		wantStatus int
		wantMsg    string
	}{
		{
			name:       "maps internal to service unavailable",
			err:        apperrors.Internal("failed to load admin user", nil),
			wantCode:   "SERVICE_UNAVAILABLE",
			wantStatus: http.StatusServiceUnavailable,
			wantMsg:    "Admin service is temporarily unavailable. Please try again.",
		},
		{
			name:       "maps invalid credentials to stable code",
			err:        apperrors.Unauthorized("invalid credentials"),
			wantCode:   "INVALID_CREDENTIALS",
			wantStatus: http.StatusUnauthorized,
			wantMsg:    "Invalid email or password.",
		},
		{
			name:       "maps invalid session to stable code",
			err:        apperrors.Unauthorized("invalid admin session"),
			wantCode:   "ADMIN_SESSION_INVALID",
			wantStatus: http.StatusUnauthorized,
			wantMsg:    "Your session expired. Sign in again.",
		},
		{
			name:       "maps csrf to stable code",
			err:        apperrors.Unauthorized("invalid csrf token"),
			wantCode:   "INVALID_CSRF_TOKEN",
			wantStatus: http.StatusUnauthorized,
			wantMsg:    "Security verification failed. Refresh the page and try again.",
		},
		{
			name:       "maps bad request to stable validation code",
			err:        apperrors.BadRequest("username is already in use"),
			wantCode:   "ADMIN_USERNAME_TAKEN",
			wantStatus: http.StatusBadRequest,
			wantMsg:    "This username is already in use.",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			got := presentAdminError(context.Background(), tc.err)
			if got.Code != tc.wantCode {
				t.Fatalf("code = %q, want %q", got.Code, tc.wantCode)
			}
			if got.HTTPStatus != tc.wantStatus {
				t.Fatalf("status = %d, want %d", got.HTTPStatus, tc.wantStatus)
			}
			if got.Message != tc.wantMsg {
				t.Fatalf("message = %q, want %q", got.Message, tc.wantMsg)
			}
		})
	}
}

func TestIsRetryableAdminError(t *testing.T) {
	t.Parallel()

	retryable := apperrors.ServiceUnavailable("admin service unavailable", nil)
	if !isRetryableAdminError(retryable) {
		t.Fatalf("expected service unavailable error to be retryable")
	}

	notRetryable := apperrors.Unauthorized("invalid credentials")
	if isRetryableAdminError(notRetryable) {
		t.Fatalf("expected unauthorized error to be non-retryable")
	}
}
