package graphqlapi

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestGraphiQLHandler(t *testing.T) {
	originalGetenv := getenv
	t.Cleanup(func() {
		getenv = originalGetenv
	})

	t.Run("returns 404 when disabled", func(t *testing.T) {
		getenv = func(_ string) string {
			return ""
		}

		request := httptest.NewRequest(http.MethodGet, "/graphiql", nil)
		recorder := httptest.NewRecorder()

		GraphiQLHandler(recorder, request)

		if recorder.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want %d", recorder.Code, http.StatusNotFound)
		}
	})

	t.Run("returns HTML page when enabled", func(t *testing.T) {
		getenv = func(name string) string {
			if name == "GRAPHIQL_ENABLED" {
				return "true"
			}
			return ""
		}

		request := httptest.NewRequest(http.MethodGet, "/graphiql", nil)
		recorder := httptest.NewRecorder()

		GraphiQLHandler(recorder, request)

		if recorder.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
		}

		if got := recorder.Header().Get("Content-Type"); got != "text/html; charset=utf-8" {
			t.Fatalf("content type = %q, want %q", got, "text/html; charset=utf-8")
		}

		body := recorder.Body.String()
		for _, expected := range []string{
			"@graphiql/plugin-explorer",
			"suayb-blog:graphiql",
			"/graphql",
			"PostsExample",
			"graphiql/setup-workers/esm.sh",
			"importmap",
		} {
			if !strings.Contains(body, expected) {
				t.Fatalf("expected response body to contain %q", expected)
			}
		}
	})

	t.Run("rejects unsupported methods", func(t *testing.T) {
		getenv = func(name string) string {
			if name == "GRAPHIQL_ENABLED" {
				return "true"
			}
			return ""
		}

		request := httptest.NewRequest(http.MethodPost, "/graphiql", nil)
		recorder := httptest.NewRecorder()

		GraphiQLHandler(recorder, request)

		if recorder.Code != http.StatusMethodNotAllowed {
			t.Fatalf("status = %d, want %d", recorder.Code, http.StatusMethodNotAllowed)
		}

		if got := recorder.Header().Get("Allow"); got != "GET, HEAD" {
			t.Fatalf("allow = %q, want %q", got, "GET, HEAD")
		}
	})

}
