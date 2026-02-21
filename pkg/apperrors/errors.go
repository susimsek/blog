package apperrors

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
)

type AppError struct {
	Code       string
	Message    string
	HTTPStatus int
	Cause      error
}

func (e *AppError) Error() string {
	if e == nil {
		return "unknown error"
	}
	if e.Cause != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Cause)
	}
	return e.Message
}

func (e *AppError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Cause
}

func New(code, message string, httpStatus int, cause error) *AppError {
	resolvedCode := strings.TrimSpace(code)
	if resolvedCode == "" {
		resolvedCode = "INTERNAL_ERROR"
	}
	resolvedMessage := strings.TrimSpace(message)
	if resolvedMessage == "" {
		resolvedMessage = "Internal server error"
	}
	if httpStatus <= 0 {
		httpStatus = http.StatusInternalServerError
	}
	return &AppError{
		Code:       resolvedCode,
		Message:    resolvedMessage,
		HTTPStatus: httpStatus,
		Cause:      cause,
	}
}

func BadRequest(message string) *AppError {
	return New("BAD_REQUEST", message, http.StatusBadRequest, nil)
}

func Unauthorized(message string) *AppError {
	return New("UNAUTHORIZED", message, http.StatusUnauthorized, nil)
}

func MethodNotAllowed(message string) *AppError {
	return New("METHOD_NOT_ALLOWED", message, http.StatusMethodNotAllowed, nil)
}

func Config(message string, cause error) *AppError {
	return New("CONFIG_ERROR", message, http.StatusInternalServerError, cause)
}

func ServiceUnavailable(message string, cause error) *AppError {
	return New("SERVICE_UNAVAILABLE", message, http.StatusServiceUnavailable, cause)
}

func Internal(message string, cause error) *AppError {
	return New("INTERNAL_ERROR", message, http.StatusInternalServerError, cause)
}

func From(err error) *AppError {
	if err == nil {
		return nil
	}

	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr
	}

	return Internal("Internal server error", err)
}
