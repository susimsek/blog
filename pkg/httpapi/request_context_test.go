package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestEnsureRequestContextUsesIncomingRequestID(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/api/admin/graphql", nil)
	request.Header.Set(HeaderRequestID, "req-123")
	request.RemoteAddr = "127.0.0.1:52344"
	recorder := httptest.NewRecorder()

	nextRequest := EnsureRequestContext(recorder, request)
	if nextRequest == nil {
		t.Fatal("expected request")
	}

	if got := RequestIDFromContext(nextRequest.Context()); got != "req-123" {
		t.Fatalf("requestID = %q", got)
	}
	if got := recorder.Header().Get(HeaderRequestID); got != "req-123" {
		t.Fatalf("response request id = %q", got)
	}
}

func TestEnsureRequestContextGeneratesRequestIDAndTrace(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/api/admin/graphql", nil)
	request.Header.Set("X-Forwarded-For", "203.0.113.10, 10.0.0.1")
	request.Header.Set("CF-IPCountry", "tr")
	request.Header.Set("User-Agent", "go-test")
	recorder := httptest.NewRecorder()

	nextRequest := EnsureRequestContext(recorder, request)
	if nextRequest == nil {
		t.Fatal("expected request")
	}

	requestID := RequestIDFromContext(nextRequest.Context())
	if len(requestID) != 32 {
		t.Fatalf("expected generated request id length 32, got %d", len(requestID))
	}
	if got := recorder.Header().Get(HeaderRequestID); got != requestID {
		t.Fatalf("response request id = %q, request context id = %q", got, requestID)
	}

	trace, ok := RequestTraceFromContext(nextRequest.Context())
	if !ok {
		t.Fatal("expected request trace")
	}
	if trace.Method != http.MethodPost {
		t.Fatalf("method = %q", trace.Method)
	}
	if trace.Path != "/api/admin/graphql" {
		t.Fatalf("path = %q", trace.Path)
	}
	if trace.RemoteIP != "203.0.113.10" {
		t.Fatalf("remote ip = %q", trace.RemoteIP)
	}
	if trace.CountryCode != "TR" {
		t.Fatalf("country code = %q", trace.CountryCode)
	}
	if trace.UserAgent != "go-test" {
		t.Fatalf("user agent = %q", trace.UserAgent)
	}
}
