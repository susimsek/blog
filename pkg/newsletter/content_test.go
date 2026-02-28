package newsletter

import (
	"strings"
	"testing"
	"time"
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
		"https://example.com/images/launch-update.webp",
		&PostCategoryBadge{
			Name:        "Gaming",
			URL:         "https://example.com/en/categories/gaming",
			IconHTML:    "&#127918;",
			BgColor:     "#fee2e2",
			TextColor:   "#b91c1c",
			BorderColor: "#fca5a5",
		},
		[]PostTopicBadge{
			{
				Name:        "Spring Boot",
				URL:         "https://example.com/en/topics/spring-boot",
				BgColor:     "#dcfce7",
				TextColor:   "#166534",
				BorderColor: "#86efac",
			},
			{Name: "Java", BgColor: "#fee2e2", TextColor: "#b91c1c", BorderColor: "#fca5a5"},
		},
		time.Date(2026, time.February, 4, 0, 0, 0, 0, time.UTC),
		3,
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

	if !strings.Contains(htmlBody, "src=\"https://example.com/images/launch-update.webp\"") {
		t.Fatalf("html body does not contain post image URL: %q", htmlBody)
	}

	if strings.Count(htmlBody, "https://example.com/posts/launch-update") < 3 {
		t.Fatalf("post URL should be used for heading, image, and CTA links: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "&#128197; February 4, 2026") {
		t.Fatalf("html body does not contain formatted EN published date: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "&#128197;") {
		t.Fatalf("html body does not contain calendar icon: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, ">Spring Boot<") || !strings.Contains(htmlBody, ">Java<") {
		t.Fatalf("html body does not contain topic badges: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "&#9201; 3 min read") {
		t.Fatalf("html body does not contain reading time metadata: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "background:#dcfce7") || !strings.Contains(htmlBody, "color:#166534") {
		t.Fatalf("html body does not contain topic badge colors: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, ">Gaming<") || !strings.Contains(htmlBody, "color:#b91c1c") {
		t.Fatalf("html body does not contain category badge: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "href=\"https://example.com/en/categories/gaming\"") {
		t.Fatalf("html body does not contain category URL: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "&#127918;") {
		t.Fatalf("html body does not contain category icon html: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "href=\"https://example.com/en/topics/spring-boot\"") {
		t.Fatalf("html body does not contain topic URL: %q", htmlBody)
	}
}

func TestPostAnnouncementEmailFormatsTurkishPublishedDate(t *testing.T) {
	_, htmlBody, err := PostAnnouncementEmail(
		LocaleTR,
		"Deneme yazi",
		"Test ozeti",
		"",
		nil,
		nil,
		time.Date(2026, time.February, 4, 0, 0, 0, 0, time.UTC),
		8,
		"https://example.com/tr/posts/deneme-yazi",
		"https://example.com/tr/rss.xml",
		"https://example.com/api/subscribe-unsubscribe?token=abc",
		"https://example.com",
	)
	if err != nil {
		t.Fatalf("PostAnnouncementEmail returned error: %v", err)
	}

	if !strings.Contains(htmlBody, "&#128197; 4 Subat 2026") {
		t.Fatalf("html body does not contain formatted TR published date: %q", htmlBody)
	}

	if !strings.Contains(htmlBody, "&#9201; 8 dk") {
		t.Fatalf("html body does not contain formatted TR reading time: %q", htmlBody)
	}
}
