package newsletter

import (
	"bytes"
	"embed"
	"fmt"
	htmltemplate "html/template"
	"strings"
	"sync"
	"time"
)

const (
	LocaleEN = "en"
	LocaleTR = "tr"
)

type emailContent struct {
	Subject      string
	EyebrowLabel string
	Title        string
	Heading      string
	Body         string
	ButtonLabel  string
	FallbackLead string
}

type pageContent struct {
	Title       string
	Heading     string
	Message     string
	ButtonLabel string
}

type postEmailContent struct {
	SubjectPrefix    string
	Title            string
	Body             string
	NewsletterLabel  string
	ButtonLabel      string
	PublishedLabel   string
	RSSLabel         string
	UnsubscribeLabel string
	FooterNote       string
}

type confirmationEmailTemplateData struct {
	Lang         string
	FaviconURL   string
	EyebrowLabel string
	Title        string
	Heading      string
	Body         string
	ButtonLabel  string
	FallbackLead string
	ConfirmURL   string
}

type postAnnouncementEmailTemplateData struct {
	Lang             string
	FaviconURL       string
	Subject          string
	Title            string
	Body             string
	NewsletterLabel  string
	PostTitle        string
	PostSummary      string
	PostImageURL     string
	PublishedLabel   string
	PublishedDate    string
	ButtonLabel      string
	PostURL          string
	RSSLabel         string
	RSSURL           string
	UnsubscribeLabel string
	UnsubscribeURL   string
	FooterNote       string
}

type PageKey string

const (
	PageConfigError        PageKey = "config-error"
	PageMethodNotAllowed   PageKey = "method-not-allowed"
	PageMissingToken       PageKey = "missing-token"
	PageServiceDown        PageKey = "service-down"
	PageConfirmFailed      PageKey = "confirm-failed"
	PageTokenExpired       PageKey = "token-expired"
	PageSuccess            PageKey = "success"
	PageUnsubscribeSuccess PageKey = "unsubscribe-success"
	PageUnsubscribeInvalid PageKey = "unsubscribe-invalid"
	PageUnsubscribeFailed  PageKey = "unsubscribe-failed"
)

var emailByLocale = map[string]emailContent{
	LocaleEN: {
		Subject:      "Confirm your newsletter subscription",
		EyebrowLabel: "Newsletter",
		Title:        "Suayb's Blog",
		Heading:      "Complete your subscription",
		Body:         "Click the button below to confirm your newsletter subscription. If you did not request this, you can ignore this email.",
		ButtonLabel:  "Confirm now",
		FallbackLead: "If the button does not work, copy and paste this link into your browser:",
	},
	LocaleTR: {
		Subject:      "Bulten aboneliginizi onaylayin",
		EyebrowLabel: "Bulten",
		Title:        "Suayb's Blog",
		Heading:      "Aboneliginizi tamamlayin",
		Body:         "Newsletter aboneliginizi onaylamak icin asagidaki butona tiklayin. Bu islemi siz yapmadiysaniz bu e-postayi yok sayabilirsiniz.",
		ButtonLabel:  "Simdi onayla",
		FallbackLead: "Buton calismazsa bu baglantiyi tarayiciniza yapistirin:",
	},
}

var pageByLocale = map[string]map[PageKey]pageContent{
	LocaleEN: {
		PageConfigError: {
			Title:       "Newsletter confirmation error",
			Heading:     "Configuration error",
			Message:     "Newsletter confirmation is not configured correctly.",
			ButtonLabel: "Go back",
		},
		PageMethodNotAllowed: {
			Title:       "Method not allowed",
			Heading:     "Invalid method",
			Message:     "This endpoint only supports GET.",
			ButtonLabel: "Go to blog",
		},
		PageMissingToken: {
			Title:       "Invalid confirmation link",
			Heading:     "Invalid confirmation link",
			Message:     "The confirmation link is missing a token.",
			ButtonLabel: "Go to blog",
		},
		PageServiceDown: {
			Title:       "Confirmation unavailable",
			Heading:     "Service unavailable",
			Message:     "Please try again in a few minutes.",
			ButtonLabel: "Go to blog",
		},
		PageConfirmFailed: {
			Title:       "Confirmation failed",
			Heading:     "Could not confirm subscription",
			Message:     "Please try subscribing again.",
			ButtonLabel: "Go to blog",
		},
		PageTokenExpired: {
			Title:       "Link expired",
			Heading:     "Confirmation link expired or invalid",
			Message:     "Please subscribe again to receive a fresh confirmation email.",
			ButtonLabel: "Go to blog",
		},
		PageSuccess: {
			Title:       "Subscription confirmed",
			Heading:     "Subscription confirmed",
			Message:     "Your email is now confirmed. You will receive new newsletter updates.",
			ButtonLabel: "Go to blog",
		},
		PageUnsubscribeSuccess: {
			Title:       "Unsubscribed",
			Heading:     "You are unsubscribed",
			Message:     "You will no longer receive newsletter emails.",
			ButtonLabel: "Go to blog",
		},
		PageUnsubscribeInvalid: {
			Title:       "Invalid unsubscribe link",
			Heading:     "Invalid or expired link",
			Message:     "Please use a valid unsubscribe link from your email.",
			ButtonLabel: "Go to blog",
		},
		PageUnsubscribeFailed: {
			Title:       "Unsubscribe failed",
			Heading:     "Could not complete request",
			Message:     "Please try again in a few minutes.",
			ButtonLabel: "Go to blog",
		},
	},
	LocaleTR: {
		PageConfigError: {
			Title:       "Bulten onay hatasi",
			Heading:     "Yapilandirma hatasi",
			Message:     "Bulten onay akisi dogru sekilde yapilandirilmamis.",
			ButtonLabel: "Geri don",
		},
		PageMethodNotAllowed: {
			Title:       "Gecersiz istek metodu",
			Heading:     "Gecersiz metod",
			Message:     "Bu endpoint sadece GET metodunu destekler.",
			ButtonLabel: "Bloga git",
		},
		PageMissingToken: {
			Title:       "Gecersiz onay linki",
			Heading:     "Gecersiz onay linki",
			Message:     "Onay linkinde token bulunamadi.",
			ButtonLabel: "Bloga git",
		},
		PageServiceDown: {
			Title:       "Onay servisi kullanilamiyor",
			Heading:     "Servis su an kullanilamiyor",
			Message:     "Lutfen birkac dakika sonra tekrar deneyin.",
			ButtonLabel: "Bloga git",
		},
		PageConfirmFailed: {
			Title:       "Onay basarisiz",
			Heading:     "Abonelik onaylanamadi",
			Message:     "Lutfen tekrar abone olmayi deneyin.",
			ButtonLabel: "Bloga git",
		},
		PageTokenExpired: {
			Title:       "Link suresi dolmus",
			Heading:     "Onay linki gecersiz veya suresi dolmus",
			Message:     "Yeni bir onay e-postasi icin tekrar abone olun.",
			ButtonLabel: "Bloga git",
		},
		PageSuccess: {
			Title:       "Abonelik onaylandi",
			Heading:     "Abonelik onaylandi",
			Message:     "E-posta adresiniz dogrulandi. Yeni newsletter guncellemelerini alacaksiniz.",
			ButtonLabel: "Bloga git",
		},
		PageUnsubscribeSuccess: {
			Title:       "Abonelikten cikildi",
			Heading:     "Abonelik iptal edildi",
			Message:     "Artik newsletter e-postalari almayacaksiniz.",
			ButtonLabel: "Bloga git",
		},
		PageUnsubscribeInvalid: {
			Title:       "Gecersiz cikis linki",
			Heading:     "Gecersiz veya suresi dolmus link",
			Message:     "Lutfen e-postadaki gecerli cikis linkini kullanin.",
			ButtonLabel: "Bloga git",
		},
		PageUnsubscribeFailed: {
			Title:       "Cikis islemi basarisiz",
			Heading:     "Islem tamamlanamadi",
			Message:     "Lutfen birkac dakika sonra tekrar deneyin.",
			ButtonLabel: "Bloga git",
		},
	},
}

var postEmailByLocale = map[string]postEmailContent{
	LocaleEN: {
		SubjectPrefix:    "New post",
		Title:            "Suayb's Blog",
		Body:             "A new article is live on the blog. Read it from the link below.",
		NewsletterLabel:  "New post",
		ButtonLabel:      "Read article",
		PublishedLabel:   "Published",
		RSSLabel:         "RSS feed",
		UnsubscribeLabel: "Unsubscribe",
		FooterNote:       "You are receiving this email because you subscribed to Suayb's Blog newsletter.",
	},
	LocaleTR: {
		SubjectPrefix:    "Yeni yazi",
		Title:            "Suayb's Blog",
		Body:             "Blogda yeni bir yazi yayinda. Asagidaki baglantidan okuyabilirsin.",
		NewsletterLabel:  "Yeni yazi",
		ButtonLabel:      "Yaziyi oku",
		PublishedLabel:   "Yayim tarihi",
		RSSLabel:         "RSS akisi",
		UnsubscribeLabel: "Abonelikten cik",
		FooterNote:       "Bu e-postayi Suayb's Blog newsletter aboneliginiz oldugu icin aliyorsunuz.",
	},
}

func formatPublishedDate(locale string, publishedAt time.Time) string {
	if publishedAt.IsZero() {
		return ""
	}

	normalized := publishedAt.UTC()
	if locale == LocaleTR {
		months := [...]string{
			"Ocak",
			"Subat",
			"Mart",
			"Nisan",
			"Mayis",
			"Haziran",
			"Temmuz",
			"Agustos",
			"Eylul",
			"Ekim",
			"Kasim",
			"Aralik",
		}
		month := months[int(normalized.Month())-1]
		return fmt.Sprintf("%d %s %d", normalized.Day(), month, normalized.Year())
	}

	return normalized.Format("January 2, 2006")
}

//go:embed templates/*.tmpl
var newsletterTemplateFS embed.FS

var (
	emailTemplatesOnce sync.Once
	emailTemplatesErr  error

	confirmationHTMLTmpl *htmltemplate.Template
	postHTMLTmpl         *htmltemplate.Template
)

func ResolveLocale(explicitLocale string, acceptLanguageHeader string) string {
	explicit := strings.ToLower(strings.TrimSpace(explicitLocale))
	if explicit == LocaleTR || explicit == LocaleEN {
		return explicit
	}

	header := strings.ToLower(strings.TrimSpace(acceptLanguageHeader))
	if strings.HasPrefix(header, "tr") || strings.Contains(header, ",tr") {
		return LocaleTR
	}

	return LocaleEN
}

func ensureEmailTemplates() error {
	emailTemplatesOnce.Do(func() {
		var err error

		confirmationHTMLTmpl, err = htmltemplate.ParseFS(newsletterTemplateFS, "templates/confirmation_email.html.tmpl")
		if err != nil {
			emailTemplatesErr = fmt.Errorf("parse confirmation html template: %w", err)
			return
		}

		postHTMLTmpl, err = htmltemplate.ParseFS(newsletterTemplateFS, "templates/post_announcement_email.html.tmpl")
		if err != nil {
			emailTemplatesErr = fmt.Errorf("parse post html template: %w", err)
			return
		}
	})

	return emailTemplatesErr
}

func renderHTMLTemplate(tmpl *htmltemplate.Template, data any) (string, error) {
	var buffer bytes.Buffer
	if err := tmpl.Execute(&buffer, data); err != nil {
		return "", err
	}
	return buffer.String(), nil
}

func ConfirmationEmail(locale string, confirmURL string, siteURL string) (subject string, htmlBody string, err error) {
	if err := ensureEmailTemplates(); err != nil {
		return "", "", err
	}

	resolved := ResolveLocale(locale, "")
	content, ok := emailByLocale[resolved]
	if !ok {
		content = emailByLocale[LocaleEN]
	}

	data := confirmationEmailTemplateData{
		Lang:         resolved,
		FaviconURL:   BuildFaviconURL(siteURL),
		EyebrowLabel: content.EyebrowLabel,
		Title:        content.Title,
		Heading:      content.Heading,
		Body:         content.Body,
		ButtonLabel:  content.ButtonLabel,
		FallbackLead: content.FallbackLead,
		ConfirmURL:   strings.TrimSpace(confirmURL),
	}

	htmlBody, err = renderHTMLTemplate(confirmationHTMLTmpl, data)
	if err != nil {
		return "", "", fmt.Errorf("render confirmation html template: %w", err)
	}

	return content.Subject, htmlBody, nil
}

func ConfirmationPage(locale string, key PageKey) pageContent {
	resolved := ResolveLocale(locale, "")
	if values, ok := pageByLocale[resolved]; ok {
		if content, exists := values[key]; exists {
			return content
		}
	}

	return pageByLocale[LocaleEN][key]
}

func stripHTMLTags(value string) string {
	var builder strings.Builder
	builder.Grow(len(value))

	inTag := false
	for _, r := range value {
		switch r {
		case '<':
			inTag = true
		case '>':
			inTag = false
		default:
			if !inTag {
				builder.WriteRune(r)
			}
		}
	}

	return strings.TrimSpace(builder.String())
}

func truncateText(value string, maxRunes int) string {
	if maxRunes <= 0 {
		return ""
	}

	runes := []rune(strings.TrimSpace(value))
	if len(runes) <= maxRunes {
		return strings.TrimSpace(value)
	}

	return strings.TrimSpace(string(runes[:maxRunes])) + "..."
}

func PostAnnouncementEmail(
	locale string,
	postTitle string,
	postSummary string,
	postImageURL string,
	publishedAt time.Time,
	postURL string,
	rssURL string,
	unsubscribeURL string,
	siteURL string,
) (subject string, htmlBody string, err error) {
	if err := ensureEmailTemplates(); err != nil {
		return "", "", err
	}

	resolved := ResolveLocale(locale, "")
	content, ok := postEmailByLocale[resolved]
	if !ok {
		content = postEmailByLocale[LocaleEN]
	}

	cleanSummary := truncateText(stripHTMLTags(postSummary), 240)
	if cleanSummary == "" {
		cleanSummary = content.Body
	}

	subject = fmt.Sprintf("%s: %s", content.SubjectPrefix, postTitle)

	data := postAnnouncementEmailTemplateData{
		Lang:             resolved,
		FaviconURL:       BuildFaviconURL(siteURL),
		Subject:          subject,
		Title:            content.Title,
		Body:             cleanSummary,
		NewsletterLabel:  content.NewsletterLabel,
		PostTitle:        strings.TrimSpace(postTitle),
		PostSummary:      cleanSummary,
		PostImageURL:     strings.TrimSpace(postImageURL),
		PublishedLabel:   content.PublishedLabel,
		PublishedDate:    formatPublishedDate(resolved, publishedAt),
		ButtonLabel:      content.ButtonLabel,
		PostURL:          strings.TrimSpace(postURL),
		RSSLabel:         content.RSSLabel,
		RSSURL:           strings.TrimSpace(rssURL),
		UnsubscribeLabel: content.UnsubscribeLabel,
		UnsubscribeURL:   strings.TrimSpace(unsubscribeURL),
		FooterNote:       content.FooterNote,
	}

	htmlBody, err = renderHTMLTemplate(postHTMLTmpl, data)
	if err != nil {
		return "", "", fmt.Errorf("render post html template: %w", err)
	}

	return subject, htmlBody, nil
}
