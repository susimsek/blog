package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/pkg/apperrors"
)

func TestWriteError(t *testing.T) {
	recorder := httptest.NewRecorder()

	WriteError(recorder, apperrors.BadRequest("invalid request"))

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d", recorder.Code)
	}
	if got := recorder.Header().Get("Content-Type"); got != "application/json; charset=utf-8" {
		t.Fatalf("content-type = %q", got)
	}

	var payload ErrorResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("unmarshal failed: %v", err)
	}
	if payload.Status != "error" || payload.Code != "BAD_REQUEST" || payload.Message != "invalid request" {
		t.Fatalf("payload = %#v", payload)
	}
	if _, err := time.Parse(time.RFC3339, payload.Timestamp); err != nil {
		t.Fatalf("timestamp parse failed: %v", err)
	}
}

func TestWriteErrorWrapsUnknownErrors(t *testing.T) {
	recorder := httptest.NewRecorder()

	WriteError(recorder, errors.New("boom"))

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d", recorder.Code)
	}
	if recorder.Body.String() == "" {
		t.Fatal("expected response body")
	}
}

func TestWriteErrorWithContextIncludesRequestID(t *testing.T) {
	recorder := httptest.NewRecorder()
	ctx := WithRequestID(context.Background(), "req-test-1")

	WriteErrorWithContext(ctx, recorder, apperrors.BadRequest("invalid request"))

	var payload ErrorResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("unmarshal failed: %v", err)
	}

	if payload.RequestID != "req-test-1" {
		t.Fatalf("requestId = %q", payload.RequestID)
	}
}
