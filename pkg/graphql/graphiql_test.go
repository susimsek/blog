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
		assertGraphiQLStatus(t, recorder, http.StatusNotFound)
	})

	t.Run("returns HTML page when enabled", func(t *testing.T) {
		t.Setenv("GRAPHIQL_ENABLED", "true")

		request := httptest.NewRequest(http.MethodGet, "/graphiql", nil)
		recorder := httptest.NewRecorder()

		GraphiQLHandler(recorder, request)
		assertGraphiQLStatus(t, recorder, http.StatusOK)
		assertGraphiQLHeader(t, recorder, "Content-Type", "text/html; charset=utf-8")
		assertGraphiQLBodyContains(t, recorder.Body.String(), []string{
			"@graphiql/plugin-explorer",
			"suayb-blog:graphiql",
			"/graphql",
			"PostsExample",
			"graphiql/setup-workers/esm.sh",
			"importmap",
		})
	})

	t.Run("rejects unsupported methods", func(t *testing.T) {
		t.Setenv("GRAPHIQL_ENABLED", "true")

		request := httptest.NewRequest(http.MethodPost, "/graphiql", nil)
		recorder := httptest.NewRecorder()

		GraphiQLHandler(recorder, request)
		assertGraphiQLStatus(t, recorder, http.StatusMethodNotAllowed)
		assertGraphiQLHeader(t, recorder, "Allow", "GET, HEAD")
	})

	t.Run("serves head requests", func(t *testing.T) {
		t.Setenv("GRAPHIQL_ENABLED", "true")

		request := httptest.NewRequest(http.MethodHead, "/graphiql", nil)
		recorder := httptest.NewRecorder()

		GraphiQLHandler(recorder, request)
		assertGraphiQLStatus(t, recorder, http.StatusOK)
	})
}

func assertGraphiQLStatus(t *testing.T, recorder *httptest.ResponseRecorder, want int) {
	t.Helper()
	if recorder.Code != want {
		t.Fatalf("status = %d, want %d", recorder.Code, want)
	}
}

func assertGraphiQLHeader(t *testing.T, recorder *httptest.ResponseRecorder, name, want string) {
	t.Helper()
	if got := recorder.Header().Get(name); got != want {
		t.Fatalf("%s = %q, want %q", name, got, want)
	}
}

func assertGraphiQLBodyContains(t *testing.T, body string, expected []string) {
	t.Helper()
	for _, value := range expected {
		if !strings.Contains(body, value) {
			t.Fatalf("expected response body to contain %q", value)
		}
	}
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
