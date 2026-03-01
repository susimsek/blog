package graphqlapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	appconfig "suaybsimsek.com/blog-api/internal/config"
)

func TestGraphiQLHandler(t *testing.T) {
	t.Run("returns 404 when disabled", func(t *testing.T) {
		request := httptest.NewRequest(http.MethodGet, "/graphiql", nil)
		recorder := httptest.NewRecorder()

		GraphiQLHandler(recorder, request)

		if recorder.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want %d", recorder.Code, http.StatusNotFound)
		}
	})

	t.Run("returns HTML page when enabled", func(t *testing.T) {
		t.Setenv("GRAPHIQL_ENABLED", "true")

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
		t.Setenv("GRAPHIQL_ENABLED", "true")

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

	t.Run("serves head requests", func(t *testing.T) {
		t.Setenv("GRAPHIQL_ENABLED", "true")

		request := httptest.NewRequest(http.MethodHead, "/graphiql", nil)
		recorder := httptest.NewRecorder()

		GraphiQLHandler(recorder, request)

		if recorder.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
		}
	})
}

func TestBuildGraphiQLPageData(t *testing.T) {
	pageData := buildGraphiQLPageData(appconfig.GraphQLConfig{PublicPath: "/graphql"})

	if pageData.GraphiQLVersion != graphiqlVersion || pageData.GraphQLVersion != graphqlVersion {
		t.Fatalf("pageData versions = %#v", pageData)
	}

	var endpoint string
	if err := json.Unmarshal([]byte(pageData.EndpointJSON), &endpoint); err != nil || endpoint != "/graphql" {
		t.Fatalf("EndpointJSON = %q, %v", pageData.EndpointJSON, err)
	}

	var headers string
	if err := json.Unmarshal([]byte(pageData.DefaultHeadersJSON), &headers); err != nil || !strings.Contains(headers, "Accept-Language") {
		t.Fatalf("DefaultHeadersJSON = %q, %v", pageData.DefaultHeadersJSON, err)
	}

	var query string
	if err := json.Unmarshal([]byte(pageData.DefaultQueryJSON), &query); err != nil || !strings.Contains(query, "PostsExample") {
		t.Fatalf("DefaultQueryJSON = %q, %v", pageData.DefaultQueryJSON, err)
	}
}
