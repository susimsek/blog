package newsletter

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRenderStatusPageIncludesLocaleLang(t *testing.T) {
	recorder := httptest.NewRecorder()

	err := RenderStatusPage(
		recorder,
		http.StatusOK,
		LocaleTR,
		"https://example.com",
		"Baslik",
		"Onaylandi",
		"Abonelik islemi tamamlandi.",
		"https://example.com",
		"Bloga git",
	)
	if err != nil {
		t.Fatalf("RenderStatusPage returned error: %v", err)
	}

	body := recorder.Body.String()
	if !strings.Contains(body, "<html lang=\"tr\">") {
		t.Fatalf("expected tr lang attribute, got %q", body)
	}
	if !strings.Contains(body, "href=\"https://example.com/favicon.ico\"") {
		t.Fatalf("expected favicon link, got %q", body)
	}
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", recorder.Code)
	}
}
