package newsletter

import (
	"embed"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

func TestRenderStatusPageIncludesLocaleLang(t *testing.T) {
	recorder := httptest.NewRecorder()

	err := RenderStatusPage(recorder, http.StatusOK, StatusPageInput{
		Locale:      LocaleTR,
		SiteURL:     "https://example.com",
		Title:       "Baslik",
		Heading:     "Onaylandi",
		Message:     "Abonelik islemi tamamlandi.",
		ButtonHref:  "https://example.com",
		ButtonLabel: goToBlogTR,
	})
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

func TestRenderStatusPageFallsBackToEnglish(t *testing.T) {
	recorder := httptest.NewRecorder()

	err := RenderStatusPage(recorder, http.StatusAccepted, StatusPageInput{
		Locale:      "de",
		SiteURL:     "https://example.com",
		Title:       "Confirmation unavailable",
		Heading:     "Service unavailable",
		Message:     "Try again soon.",
		ButtonHref:  "https://example.com/en",
		ButtonLabel: goToBlogEN,
	})
	if err != nil {
		t.Fatalf("RenderStatusPage returned error: %v", err)
	}

	body := recorder.Body.String()
	if !strings.Contains(body, "<html lang=\"en\">") {
		t.Fatalf("expected en lang attribute, got %q", body)
	}
	if !strings.Contains(body, "href=\"https://example.com/en\"") {
		t.Fatalf("expected button href, got %q", body)
	}
	if recorder.Code != http.StatusAccepted {
		t.Fatalf("expected status 202, got %d", recorder.Code)
	}
}

func TestRenderStatusPageReturnsTemplateErrors(t *testing.T) {
	originalFS := newsletterTemplateFS
	originalOnce := statusPageTemplateOnce
	originalErr := statusPageTemplateErr
	originalTemplate := statusPageTemplate
	t.Cleanup(func() {
		newsletterTemplateFS = originalFS
		statusPageTemplateOnce = originalOnce
		statusPageTemplateErr = originalErr
		statusPageTemplate = originalTemplate
	})

	newsletterTemplateFS = embed.FS{}
	statusPageTemplateOnce = sync.Once{}
	statusPageTemplateErr = nil
	statusPageTemplate = nil

	err := RenderStatusPage(httptest.NewRecorder(), http.StatusOK, StatusPageInput{
		Locale:      LocaleEN,
		SiteURL:     "https://example.com",
		Title:       "Title",
		Heading:     "Heading",
		Message:     "Message",
		ButtonHref:  "https://example.com",
		ButtonLabel: goToBlogEN,
	})
	if err == nil {
		t.Fatal("expected template parse error")
	}
}
