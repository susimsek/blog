package oauthcallback

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestDispatchProviderCallbackUsesExactStateMatch(t *testing.T) {
	t.Parallel()

	var delegatedPath string
	req := httptest.NewRequest(http.MethodGet, "/api/google/callback?state=reader-state", nil)
	req.AddCookie(&http.Cookie{Name: "admin_google_oauth_state", Value: "admin-state"})
	req.AddCookie(&http.Cookie{Name: "reader_google_oauth_state", Value: "reader-state"})

	recorder := httptest.NewRecorder()
	dispatchProviderCallback(recorder, req, []callbackTarget{
		{
			cookieName: "admin_google_oauth_state",
			targetPath: "/api/google/callback",
			handler: func(w http.ResponseWriter, r *http.Request) {
				delegatedPath = r.URL.Path
				w.WriteHeader(http.StatusAccepted)
			},
		},
		{
			cookieName: "reader_google_oauth_state",
			targetPath: "/api/google/callback",
			handler: func(w http.ResponseWriter, r *http.Request) {
				delegatedPath = r.URL.Path
				w.WriteHeader(http.StatusNoContent)
			},
		},
	})

	if recorder.Code != http.StatusNoContent {
		t.Fatalf("expected 204 response, got %d", recorder.Code)
	}
	if delegatedPath != "/api/google/callback" {
		t.Fatalf("expected delegated path to remain common callback path, got %q", delegatedPath)
	}
}

func TestDispatchProviderCallbackFallsBackToSingleCookie(t *testing.T) {
	t.Parallel()

	req := httptest.NewRequest(http.MethodGet, "/api/github/callback", nil)
	req.AddCookie(&http.Cookie{Name: "reader_github_oauth_state", Value: "reader-state"})

	recorder := httptest.NewRecorder()
	dispatchProviderCallback(recorder, req, []callbackTarget{
		{
			cookieName: "admin_github_oauth_state",
			targetPath: "/api/github/callback",
			handler: func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(http.StatusAccepted)
			},
		},
		{
			cookieName: "reader_github_oauth_state",
			targetPath: "/api/github/callback",
			handler: func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(http.StatusNoContent)
			},
		},
	})

	if recorder.Code != http.StatusNoContent {
		t.Fatalf("expected 204 response, got %d", recorder.Code)
	}
}

func TestDispatchProviderCallbackReturnsNotFoundWhenAmbiguous(t *testing.T) {
	t.Parallel()

	req := httptest.NewRequest(http.MethodGet, "/api/google/callback?state=unknown", nil)
	req.AddCookie(&http.Cookie{Name: "admin_google_oauth_state", Value: "admin-state"})
	req.AddCookie(&http.Cookie{Name: "reader_google_oauth_state", Value: "reader-state"})

	recorder := httptest.NewRecorder()
	dispatchProviderCallback(recorder, req, []callbackTarget{
		{
			cookieName: "admin_google_oauth_state",
			targetPath: "/api/google/callback",
			handler: func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(http.StatusAccepted)
			},
		},
		{
			cookieName: "reader_google_oauth_state",
			targetPath: "/api/google/callback",
			handler: func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(http.StatusNoContent)
			},
		},
	})

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404 response, got %d", recorder.Code)
	}
}
