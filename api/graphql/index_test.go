package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandlerServesGraphiQLOnGraphiQLRoute(t *testing.T) {
	t.Setenv("GRAPHIQL_ENABLED", "true")
	t.Setenv("API_CORS_ORIGIN", "http://localhost:3000")

	request := httptest.NewRequest(http.MethodGet, "/graphiql", nil)
	recorder := httptest.NewRecorder()

	Handler(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	if got := recorder.Header().Get("Content-Type"); got != "text/html; charset=utf-8" {
		t.Fatalf("content type = %q, want %q", got, "text/html; charset=utf-8")
	}
}
