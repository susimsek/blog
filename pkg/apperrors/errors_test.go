package apperrors

import (
	"errors"
	"net/http"
	"testing"
)

func TestAppErrorMethodsAndDefaults(t *testing.T) {
	rootCause := errors.New("boom")

	err := New(" ", " ", 0, rootCause)
	if err.Code != "INTERNAL_ERROR" {
		t.Fatalf("Code = %q, want INTERNAL_ERROR", err.Code)
	}
	if err.Message != "Internal server error" {
		t.Fatalf("Message = %q", err.Message)
	}
	if err.HTTPStatus != http.StatusInternalServerError {
		t.Fatalf("HTTPStatus = %d", err.HTTPStatus)
	}
	if err.Error() != "Internal server error: boom" {
		t.Fatalf("Error() = %q", err.Error())
	}
	if !errors.Is(err, rootCause) {
		t.Fatal("expected wrapped cause")
	}

	var nilErr *AppError
	if nilErr.Error() != "unknown error" {
		t.Fatalf("nil Error() = %q", nilErr.Error())
	}
	if nilErr.Unwrap() != nil {
		t.Fatal("nil Unwrap() should be nil")
	}
}

func TestFactoryHelpersAndFrom(t *testing.T) {
	testCases := []struct {
		name       string
		err        *AppError
		wantCode   string
		wantStatus int
	}{
		{name: "bad request", err: BadRequest("bad"), wantCode: "BAD_REQUEST", wantStatus: http.StatusBadRequest},
		{name: "unauthorized", err: Unauthorized("nope"), wantCode: "UNAUTHORIZED", wantStatus: http.StatusUnauthorized},
		{name: "method not allowed", err: MethodNotAllowed("no"), wantCode: "METHOD_NOT_ALLOWED", wantStatus: http.StatusMethodNotAllowed},
		{name: "config", err: Config("cfg", nil), wantCode: "CONFIG_ERROR", wantStatus: http.StatusInternalServerError},
		{name: "service unavailable", err: ServiceUnavailable("down", nil), wantCode: "SERVICE_UNAVAILABLE", wantStatus: http.StatusServiceUnavailable},
		{name: "internal", err: Internal("boom", nil), wantCode: "INTERNAL_ERROR", wantStatus: http.StatusInternalServerError},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			if testCase.err.Code != testCase.wantCode {
				t.Fatalf("Code = %q, want %q", testCase.err.Code, testCase.wantCode)
			}
			if testCase.err.HTTPStatus != testCase.wantStatus {
				t.Fatalf("HTTPStatus = %d, want %d", testCase.err.HTTPStatus, testCase.wantStatus)
			}
			if From(testCase.err) != testCase.err {
				t.Fatal("From should return the original AppError")
			}
		})
	}

	if From(nil) != nil {
		t.Fatal("From(nil) should be nil")
	}

	wrapped := From(errors.New("plain"))
	if wrapped.Code != "INTERNAL_ERROR" || wrapped.HTTPStatus != http.StatusInternalServerError {
		t.Fatalf("wrapped = %#v", wrapped)
	}
	if !errors.Is(wrapped, wrapped.Cause) {
		t.Fatal("expected wrapped internal cause")
	}
}
