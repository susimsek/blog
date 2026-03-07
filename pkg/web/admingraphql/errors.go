package handler

import (
	"context"
	"net/http"
	"strings"

	appservice "suaybsimsek.com/blog-api/internal/service"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpapi"
)

const (
	adminCodeInvalidCredentials = "INVALID_CREDENTIALS"
	adminCodeInvalidSession     = "ADMIN_SESSION_INVALID"
	adminCodeAuthRequired       = "ADMIN_AUTH_REQUIRED"
	adminCodeInvalidCSRFToken   = "INVALID_CSRF_TOKEN"
	adminCodeServiceUnavailable = "SERVICE_UNAVAILABLE"
	adminCodeCurrentPasswordBad = "ADMIN_CURRENT_PASSWORD_INCORRECT"
	adminCodeCurrentPasswordReq = "ADMIN_CURRENT_PASSWORD_REQUIRED"
	adminCodePasswordTooShort   = "ADMIN_PASSWORD_TOO_SHORT"
	adminCodePasswordMismatch   = "ADMIN_PASSWORD_CONFIRM_MISMATCH"
	adminCodePasswordSame       = "ADMIN_PASSWORD_SAME_AS_CURRENT"
	adminCodeUsernameTaken      = "ADMIN_USERNAME_TAKEN"
	adminCodeUsernameSame       = "ADMIN_USERNAME_SAME"
	adminCodeUsernamePattern    = "ADMIN_USERNAME_PATTERN_INVALID"
	adminCodeUsernameLength     = "ADMIN_USERNAME_LENGTH_INVALID"
	adminCodeNameLength         = "ADMIN_NAME_LENGTH_INVALID"
	adminCodeAvatarFormat       = "ADMIN_AVATAR_FORMAT_INVALID"
	adminCodeAvatarTooLarge     = "ADMIN_AVATAR_TOO_LARGE"
	adminCodeAvatarInvalid      = "ADMIN_AVATAR_INVALID"
)

const (
	adminMessageInvalidCredentials = "invalid credentials"
	adminMessageInvalidSession     = "invalid admin session"
	adminMessageAuthRequired       = "admin authentication required"
	adminMessageServiceUnavailable = "admin service unavailable"
)

func presentAdminError(ctx context.Context, err error) *apperrors.AppError {
	appErr := apperrors.From(err)
	if appErr == nil {
		return apperrors.Internal("Internal server error", nil)
	}

	normalized := mapAdminErrorToCode(appErr)
	localizedMessage := appservice.ResolveAdminErrorMessage(ctx, normalized.Code, normalized.Message)
	return apperrors.New(normalized.Code, localizedMessage, normalized.HTTPStatus, normalized.Cause)
}

func mapAdminErrorToCode(appErr *apperrors.AppError) *apperrors.AppError {
	normalizedMessage := strings.ToLower(strings.TrimSpace(appErr.Message))

	switch strings.ToUpper(strings.TrimSpace(appErr.Code)) {
	case "INTERNAL_ERROR", "CONFIG_ERROR", "SERVICE_UNAVAILABLE":
		return apperrors.New(
			adminCodeServiceUnavailable,
			adminMessageServiceUnavailable,
			http.StatusServiceUnavailable,
			appErr.Cause,
		)
	case "UNAUTHORIZED":
		switch normalizedMessage {
		case adminMessageInvalidCredentials:
			return apperrors.New(adminCodeInvalidCredentials, adminMessageInvalidCredentials, http.StatusUnauthorized, nil)
		case adminMessageInvalidSession:
			return apperrors.New(adminCodeInvalidSession, adminMessageInvalidSession, http.StatusUnauthorized, nil)
		case "invalid csrf token":
			return apperrors.New(adminCodeInvalidCSRFToken, "invalid csrf token", http.StatusUnauthorized, nil)
		case adminMessageAuthRequired:
			return apperrors.New(adminCodeAuthRequired, adminMessageAuthRequired, http.StatusUnauthorized, nil)
		default:
			return apperrors.New(adminCodeAuthRequired, adminMessageAuthRequired, http.StatusUnauthorized, nil)
		}
	case "BAD_REQUEST":
		switch normalizedMessage {
		case "current password is incorrect":
			return apperrors.New(adminCodeCurrentPasswordBad, appErr.Message, http.StatusBadRequest, nil)
		case "current password is required":
			return apperrors.New(adminCodeCurrentPasswordReq, appErr.Message, http.StatusBadRequest, nil)
		case "new password must be at least 8 characters":
			return apperrors.New(adminCodePasswordTooShort, appErr.Message, http.StatusBadRequest, nil)
		case "new password confirmation does not match":
			return apperrors.New(adminCodePasswordMismatch, appErr.Message, http.StatusBadRequest, nil)
		case "new password must be different from current password":
			return apperrors.New(adminCodePasswordSame, appErr.Message, http.StatusBadRequest, nil)
		case "username is already in use":
			return apperrors.New(adminCodeUsernameTaken, appErr.Message, http.StatusBadRequest, nil)
		case "new username must be different from current username":
			return apperrors.New(adminCodeUsernameSame, appErr.Message, http.StatusBadRequest, nil)
		case "username can include letters, numbers, dot, underscore, and dash only":
			return apperrors.New(adminCodeUsernamePattern, appErr.Message, http.StatusBadRequest, nil)
		case "username must be between 3 and 32 characters":
			return apperrors.New(adminCodeUsernameLength, appErr.Message, http.StatusBadRequest, nil)
		case "name must be between 2 and 80 characters":
			return apperrors.New(adminCodeNameLength, appErr.Message, http.StatusBadRequest, nil)
		case "avatar format must be png, jpeg, jpg, or webp":
			return apperrors.New(adminCodeAvatarFormat, appErr.Message, http.StatusBadRequest, nil)
		case "avatar image must be 2mb or smaller":
			return apperrors.New(adminCodeAvatarTooLarge, appErr.Message, http.StatusBadRequest, nil)
		case "avatar must be a valid base64 image":
			return apperrors.New(adminCodeAvatarInvalid, appErr.Message, http.StatusBadRequest, nil)
		default:
			return appErr
		}
	default:
		return appErr
	}
}

func isRetryableAdminError(appErr *apperrors.AppError) bool {
	if appErr == nil {
		return false
	}

	switch strings.ToUpper(strings.TrimSpace(appErr.Code)) {
	case "SERVICE_UNAVAILABLE", "TIMEOUT":
		return true
	default:
		return false
	}
}

func writeAdminErrorWithContext(ctx context.Context, w http.ResponseWriter, err error) {
	if ctx == nil {
		ctx = context.Background()
	}

	httpapi.WriteErrorWithContext(ctx, w, presentAdminError(ctx, err))
}
