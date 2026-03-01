package newsletter

import (
	"embed"
	"errors"
	htmltemplate "html/template"
	"strings"
	"sync"
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
	subject, htmlBody, err := PostAnnouncementEmail(PostAnnouncementInput{
		Locale:       LocaleEN,
		PostTitle:    "Launch update",
		PostSummary:  "<p><strong>New release</strong> is now available.</p>",
		PostImageURL: "https://example.com/images/launch-update.webp",
		PostCategory: &PostCategoryBadge{
			Name:        "Gaming",
			URL:         "https://example.com/en/categories/gaming",
			IconHTML:    "&#127918;",
			BgColor:     "#fee2e2",
			TextColor:   "#b91c1c",
			BorderColor: "#fca5a5",
		},
		PostTopics: []PostTopicBadge{
			{
				Name:        "Spring Boot",
				URL:         "https://example.com/en/topics/spring-boot",
				BgColor:     "#dcfce7",
				TextColor:   "#166534",
				BorderColor: "#86efac",
			},
			{Name: "Java", BgColor: "#fee2e2", TextColor: "#b91c1c", BorderColor: "#fca5a5"},
		},
		PublishedAt:    time.Date(2026, time.February, 4, 0, 0, 0, 0, time.UTC),
		ReadingTimeMin: 3,
		PostURL:        "https://example.com/posts/launch-update",
		RSSURL:         "https://example.com/en/rss.xml",
		UnsubscribeURL: "https://example.com/api/subscribe-unsubscribe?token=abc",
		SiteURL:        "https://example.com",
	})
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
	_, htmlBody, err := PostAnnouncementEmail(PostAnnouncementInput{
		Locale:         LocaleTR,
		PostTitle:      "Deneme yazi",
		PostSummary:    "Test ozeti",
		PublishedAt:    time.Date(2026, time.February, 4, 0, 0, 0, 0, time.UTC),
		ReadingTimeMin: 8,
		PostURL:        "https://example.com/tr/posts/deneme-yazi",
		RSSURL:         "https://example.com/tr/rss.xml",
		UnsubscribeURL: "https://example.com/api/subscribe-unsubscribe?token=abc",
		SiteURL:        "https://example.com",
	})
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

func TestConfirmationPageAndHelpers(t *testing.T) {
	page := ConfirmationPage(LocaleTR, PageSuccess)
	if page.Title == "" || page.ButtonLabel == "" {
		t.Fatalf("page = %#v", page)
	}

	if got := ResolveLocale("tr", ""); got != LocaleTR {
		t.Fatalf("ResolveLocale(tr) = %q", got)
	}
	if got := ResolveLocale("", "tr-TR,tr;q=0.9"); got != LocaleTR {
		t.Fatalf("ResolveLocale(accept-language) = %q", got)
	}
	if got := ResolveLocale("", "de-DE"); got != LocaleEN {
		t.Fatalf("ResolveLocale(default) = %q", got)
	}

	if got := truncateText("  alpha beta gamma  ", 10); got != "alpha beta..." {
		t.Fatalf("truncateText() = %q", got)
	}
	if got := truncateText("text", 0); got != "" {
		t.Fatalf("truncateText(max=0) = %q", got)
	}

	topics := normalizeTopics([]PostTopicBadge{
		{Name: " React ", URL: "https://example.com/react", BgColor: "blue"},
		{Name: "", URL: "https://example.com/ignored"},
		{Name: "react", URL: "https://example.com/react-2"},
		{Name: "Tooling"},
	})
	if len(topics) != 2 || topics[0].URL == "" || topics[1].BgColor != defaultTopicBadgeBgColor {
		t.Fatalf("topics = %#v", topics)
	}

	if category := normalizeCategory(nil); category != nil {
		t.Fatalf("empty category = %#v", category)
	}
	category := normalizeCategory(&PostCategoryBadge{Name: "Programming", URL: "https://example.com/category", BgColor: "pink"})
	if category == nil || category.URL == "" || category.BgColor == "" {
		t.Fatalf("category = %#v", category)
	}

	if got := formatReadingTime(LocaleEN, 2); got != "2 min read" {
		t.Fatalf("formatReadingTime(en) = %q", got)
	}
	if got := formatReadingTime(LocaleTR, 4); got != "4 dk" {
		t.Fatalf("formatReadingTime(tr) = %q", got)
	}
}

func TestNewsletterContentFallbackBranches(t *testing.T) {
	if got := ResolveLocale(LocaleEN, "tr-TR"); got != LocaleEN {
		t.Fatalf("ResolveLocale(explicit en) = %q", got)
	}

	page := ConfirmationPage("de", PageUnsubscribeFailed)
	if page.ButtonLabel != goToBlogEN {
		t.Fatalf("fallback page = %#v", page)
	}

	if got := formatPublishedDate(LocaleEN, time.Time{}); got != "" {
		t.Fatalf("formatPublishedDate(zero) = %q", got)
	}
	if got := formatReadingTime(LocaleEN, 0); got != "" {
		t.Fatalf("formatReadingTime(zero) = %q", got)
	}

	subject, htmlBody, err := PostAnnouncementEmail(PostAnnouncementInput{
		Locale:         "de",
		PostTitle:      "  Launch update  ",
		PostSummary:    "   ",
		PostCategory:   &PostCategoryBadge{Name: "Programming"},
		PublishedAt:    time.Time{},
		ReadingTimeMin: 0,
		PostURL:        "https://example.com/posts/launch-update",
		RSSURL:         "https://example.com/en/rss.xml",
		UnsubscribeURL: "https://example.com/en/callback?operation=unsubscribe&token=abc",
		SiteURL:        "https://example.com",
	})
	if err != nil {
		t.Fatalf("PostAnnouncementEmail fallback returned error: %v", err)
	}
	if subject != "New post:   Launch update  " {
		t.Fatalf("fallback subject = %q", subject)
	}
	if !strings.Contains(htmlBody, "A new article is live on the blog.") {
		t.Fatalf("expected fallback summary in body: %q", htmlBody)
	}
	if strings.Contains(htmlBody, "&#9201;") || strings.Contains(htmlBody, "&#128197;") {
		t.Fatalf("did not expect empty metadata icons for zero values: %q", htmlBody)
	}

	confirmationSubject, confirmationHTML, err := ConfirmationEmail("de", "https://example.com/confirm?token=xyz", "https://example.com")
	if err != nil {
		t.Fatalf("ConfirmationEmail fallback returned error: %v", err)
	}
	if confirmationSubject != "Confirm your newsletter subscription" || !strings.Contains(confirmationHTML, "Complete your subscription") {
		t.Fatalf("fallback confirmation = %q %q", confirmationSubject, confirmationHTML)
	}
}

func TestEmailTemplateErrorBranches(t *testing.T) {
	originalFS := newsletterTemplateFS
	originalOnce := emailTemplatesOnce
	originalErr := emailTemplatesErr
	originalConfirmation := confirmationHTMLTmpl
	originalPost := postHTMLTmpl
	t.Cleanup(func() {
		newsletterTemplateFS = originalFS
		emailTemplatesOnce = originalOnce
		emailTemplatesErr = originalErr
		confirmationHTMLTmpl = originalConfirmation
		postHTMLTmpl = originalPost
	})

	newsletterTemplateFS = embed.FS{}
	emailTemplatesOnce = sync.Once{}
	emailTemplatesErr = nil
	confirmationHTMLTmpl = nil
	postHTMLTmpl = nil

	if _, _, err := ConfirmationEmail(LocaleEN, "https://example.com/confirm?token=abc", "https://example.com"); err == nil {
		t.Fatal("expected confirmation template parse error")
	}

	emailTemplatesOnce = sync.Once{}
	emailTemplatesErr = nil
	confirmationHTMLTmpl = nil
	postHTMLTmpl = nil
	if _, _, err := PostAnnouncementEmail(PostAnnouncementInput{
		Locale:         LocaleEN,
		PostTitle:      "Launch update",
		PostSummary:    "Summary",
		PostURL:        "https://example.com/posts/launch-update",
		RSSURL:         "https://example.com/en/rss.xml",
		UnsubscribeURL: "https://example.com/en/callback?operation=unsubscribe&token=abc",
		SiteURL:        "https://example.com",
	}); err == nil {
		t.Fatal("expected post template parse error")
	}
}

func TestRenderHTMLTemplateReturnsExecutionErrors(t *testing.T) {
	tmpl := htmltemplate.Must(
		htmltemplate.New("broken").Funcs(htmltemplate.FuncMap{
			"boom": func() (string, error) {
				return "", errors.New("boom")
			},
		}).Parse(`{{boom}}`),
	)

	if _, err := renderHTMLTemplate(tmpl, nil); err == nil {
		t.Fatal("expected renderHTMLTemplate to return execution error")
	}
}
