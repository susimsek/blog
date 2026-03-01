package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
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

func TestHandlerBranches(t *testing.T) {
	t.Run("returns config error when origin is missing", func(t *testing.T) {
		request := httptest.NewRequest(http.MethodGet, "/graphql", nil)
		recorder := httptest.NewRecorder()

		Handler(recorder, request)

		if recorder.Code != http.StatusInternalServerError {
			t.Fatalf("status = %d", recorder.Code)
		}
	})

	t.Run("handles preflight requests", func(t *testing.T) {
		t.Setenv("API_CORS_ORIGIN", "http://localhost:3000")
		request := httptest.NewRequest(http.MethodOptions, "/graphql", nil)
		recorder := httptest.NewRecorder()

		Handler(recorder, request)

		if recorder.Code != http.StatusNoContent {
			t.Fatalf("status = %d", recorder.Code)
		}
		if recorder.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
			t.Fatalf("origin = %q", recorder.Header().Get("Access-Control-Allow-Origin"))
		}
	})

	t.Run("rejects unsupported methods", func(t *testing.T) {
		t.Setenv("API_CORS_ORIGIN", "http://localhost:3000")
		request := httptest.NewRequest(http.MethodDelete, "/graphql", nil)
		recorder := httptest.NewRecorder()

		Handler(recorder, request)

		if recorder.Code != http.StatusMethodNotAllowed {
			t.Fatalf("status = %d", recorder.Code)
		}
		if recorder.Header().Get("Allow") != "GET, POST, OPTIONS" {
			t.Fatalf("allow = %q", recorder.Header().Get("Allow"))
		}

		var payload map[string]any
		if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
			t.Fatalf("unmarshal failed: %v", err)
		}
		if payload["code"] != "METHOD_NOT_ALLOWED" {
			t.Fatalf("payload = %#v", payload)
		}
	})
}

func TestShouldServeGraphiQL(t *testing.T) {
	if shouldServeGraphiQL(nil) {
		t.Fatal("nil request should not serve GraphiQL")
	}
	if !shouldServeGraphiQL(httptest.NewRequest(http.MethodGet, "/graphiql", nil)) {
		t.Fatal("/graphiql should serve GraphiQL")
	}
	if shouldServeGraphiQL(httptest.NewRequest(http.MethodGet, "/graphql", nil)) {
		t.Fatal("/graphql should not serve GraphiQL")
	}
}

func TestGetGraphQLServerInitializesSingleton(t *testing.T) {
	originalServer := graphQLServer
	originalOnce := graphQLServerOnce
	t.Cleanup(func() {
		graphQLServer = originalServer
		graphQLServerOnce = originalOnce
	})

	graphQLServer = nil
	graphQLServerOnce = sync.Once{}

	server := getGraphQLServer()
	if server == nil {
		t.Fatal("expected graphql server")
	}
	if getGraphQLServer() != server {
		t.Fatal("expected singleton graphql server")
	}
	if newGraphQLServer() == nil {
		t.Fatal("expected new graphql server instance")
	}
}

func TestHandlerServesGraphQLRequests(t *testing.T) {
	originalServer := graphQLServer
	originalOnce := graphQLServerOnce
	t.Cleanup(func() {
		graphQLServer = originalServer
		graphQLServerOnce = originalOnce
	})

	graphQLServer = nil
	graphQLServerOnce = sync.Once{}

	t.Setenv("API_CORS_ORIGIN", "http://localhost:3000")
	request := httptest.NewRequest(http.MethodPost, "/graphql", bytes.NewBufferString(`{"query":"query { __typename }"}`))
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()

	Handler(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d body=%s", recorder.Code, recorder.Body.String())
	}
	if got := recorder.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3000" {
		t.Fatalf("origin = %q", got)
	}
	if got := recorder.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("cache-control = %q", got)
	}
	if body := recorder.Body.String(); body == "" || !bytes.Contains(recorder.Body.Bytes(), []byte(`"__typename":"Query"`)) {
		t.Fatalf("unexpected body = %q", body)
	}
}

func TestHandlerSupportsIntrospectionWhenEnabled(t *testing.T) {
	originalServer := graphQLServer
	originalOnce := graphQLServerOnce
	t.Cleanup(func() {
		graphQLServer = originalServer
		graphQLServerOnce = originalOnce
	})

	graphQLServer = nil
	graphQLServerOnce = sync.Once{}

	t.Setenv("API_CORS_ORIGIN", "http://localhost:3000")
	t.Setenv("GRAPHQL_INTROSPECTION_ENABLED", "true")
	request := httptest.NewRequest(
		http.MethodPost,
		"/graphql",
		bytes.NewBufferString(`{"query":"query { __schema { queryType { name } } }"}`),
	)
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()

	Handler(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d body=%s", recorder.Code, recorder.Body.String())
	}
	if !bytes.Contains(recorder.Body.Bytes(), []byte(`"name":"Query"`)) {
		t.Fatalf("unexpected body = %q", recorder.Body.String())
	}
}

func TestHandlerUsesGraphQLErrorPresenter(t *testing.T) {
	originalServer := graphQLServer
	originalOnce := graphQLServerOnce
	t.Cleanup(func() {
		graphQLServer = originalServer
		graphQLServerOnce = originalOnce
	})

	graphQLServer = nil
	graphQLServerOnce = sync.Once{}

	t.Setenv("API_CORS_ORIGIN", "http://localhost:3000")
	request := httptest.NewRequest(
		http.MethodPost,
		"/graphql",
		bytes.NewBufferString(`{"query":"query { post(locale: EN, id: \" \") { status } }"}`),
	)
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()

	Handler(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d body=%s", recorder.Code, recorder.Body.String())
	}
	if !bytes.Contains(recorder.Body.Bytes(), []byte(`"message":"Internal server error"`)) {
		t.Fatalf("unexpected body = %q", recorder.Body.String())
	}
	if !bytes.Contains(recorder.Body.Bytes(), []byte(`"code":"INTERNAL_ERROR"`)) {
		t.Fatalf("unexpected body = %q", recorder.Body.String())
	}
}
