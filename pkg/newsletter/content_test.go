package newsletter

import (
	"strings"
	"testing"
)

func TestConfirmationEmailRendersTemplates(t *testing.T) {
	subject, htmlBody, err := ConfirmationEmail(
		LocaleEN,
		"https://example.com/confirm?token=abc&state=register",
		"https://example.com",
	)
	if err != nil {
		t.Fatalf("ConfirmationEmail returned error: %v", err)
	}

	if subject != "Confirm your newsletter subscription" {
		t.Fatalf("unexpected subject: %q", subject)
	}

	if !strings.Contains(htmlBody, "Complete your subscription") {
		t.Fatalf("html body does not contain heading: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "<html lang=\"en\">") {
		t.Fatalf("html body does not contain lang attribute: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "href=\"https://example.com/favicon.ico\"") {
		t.Fatalf("html body does not contain favicon link: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "href=\"https://example.com/confirm?token=abc&amp;state=register\"") {
		t.Fatalf("html body does not contain escaped confirmation URL: %q", htmlBody)
	}
}

func TestPostAnnouncementEmailStripsSummaryHTML(t *testing.T) {
	subject, htmlBody, err := PostAnnouncementEmail(
		LocaleEN,
		"Launch update",
		"<p><strong>New release</strong> is now available.</p>",
		"https://example.com/posts/launch-update",
		"https://example.com/en/rss.xml",
		"https://example.com/api/subscribe-unsubscribe?token=abc",
		"https://example.com",
	)
	if err != nil {
		t.Fatalf("PostAnnouncementEmail returned error: %v", err)
	}

	if subject != "New post: Launch update" {
		t.Fatalf("unexpected subject: %q", subject)
	}

	if strings.Contains(htmlBody, "<strong>") || strings.Contains(htmlBody, "<p>") {
		t.Fatalf("html body contains unescaped summary tags: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "New release is now available.") {
		t.Fatalf("html body does not contain cleaned summary: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "<html lang=\"en\">") {
		t.Fatalf("html body does not contain lang attribute: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "href=\"https://example.com/favicon.ico\"") {
		t.Fatalf("html body does not contain favicon link: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "https://example.com/api/subscribe-unsubscribe?token=abc") {
		t.Fatalf("html body does not contain unsubscribe URL: %q", htmlBody)
	}
}
