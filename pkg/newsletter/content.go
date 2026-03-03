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
	LocaleEN   = "en"
	LocaleTR   = "tr"
	blogTitle  = "Suayb's Blog"
	goToBlogEN = "Go to blog"
	goToBlogTR = "Bloga git"
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
	ReadingTimeLabel string
	RSSLabel         string
	UnsubscribeLabel string
	FooterNote       string
}

type PostTopicBadge struct {
	Name        string
	URL         string
	BgColor     string
	TextColor   string
	BorderColor string
}

type PostCategoryBadge struct {
	Name        string
	URL         string
	IconHTML    htmltemplate.HTML
	BgColor     string
	TextColor   string
	BorderColor string
}

const (
	defaultTopicBadgeBgColor     = "#f8fafc"
	defaultTopicBadgeTextColor   = "#334155"
	defaultTopicBadgeBorderColor = "#dbe4ef"
)

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
	PostCategory     *PostCategoryBadge
	PostTitle        string
	PostSummary      string
	PostTopics       []PostTopicBadge
	PostImageURL     string
	PublishedLabel   string
	PublishedDate    string
	ReadingTimeLabel string
	ReadingTimeText  string
	ButtonLabel      string
	PostURL          string
	RSSLabel         string
	RSSURL           string
	UnsubscribeLabel string
	UnsubscribeURL   string
	FooterNote       string
}

type PostAnnouncementInput struct {
	Locale         string
	PostTitle      string
	PostSummary    string
	PostImageURL   string
	PostCategory   *PostCategoryBadge
	PostTopics     []PostTopicBadge
	PublishedAt    time.Time
	ReadingTimeMin int
	PostURL        string
	RSSURL         string
	UnsubscribeURL string
	SiteURL        string
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
		Title:        blogTitle,
		Heading:      "Complete your subscription",
		Body:         "Click the button below to confirm your newsletter subscription. If you did not request this, you can ignore this email.",
		ButtonLabel:  "Confirm now",
		FallbackLead: "If the button does not work, copy and paste this link into your browser:",
	},
	LocaleTR: {
		Subject:      "Bulten aboneliginizi onaylayin",
		EyebrowLabel: "Bulten",
		Title:        blogTitle,
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
			ButtonLabel: goToBlogEN,
		},
		PageMissingToken: {
			Title:       "Invalid confirmation link",
			Heading:     "Invalid confirmation link",
			Message:     "The confirmation link is missing a token.",
			ButtonLabel: goToBlogEN,
		},
		PageServiceDown: {
			Title:       "Confirmation unavailable",
			Heading:     "Service unavailable",
			Message:     "Please try again in a few minutes.",
			ButtonLabel: goToBlogEN,
		},
		PageConfirmFailed: {
			Title:       "Confirmation failed",
			Heading:     "Could not confirm subscription",
			Message:     "Please try subscribing again.",
			ButtonLabel: goToBlogEN,
		},
		PageTokenExpired: {
			Title:       "Link expired",
			Heading:     "Confirmation link expired or invalid",
			Message:     "Please subscribe again to receive a fresh confirmation email.",
			ButtonLabel: goToBlogEN,
		},
		PageSuccess: {
			Title:       "Subscription confirmed",
			Heading:     "Subscription confirmed",
			Message:     "Your email is now confirmed. You will receive new newsletter updates.",
			ButtonLabel: goToBlogEN,
		},
		PageUnsubscribeSuccess: {
			Title:       "Unsubscribed",
			Heading:     "You are unsubscribed",
			Message:     "You will no longer receive newsletter emails.",
			ButtonLabel: goToBlogEN,
		},
		PageUnsubscribeInvalid: {
			Title:       "Invalid unsubscribe link",
			Heading:     "Invalid or expired link",
			Message:     "Please use a valid unsubscribe link from your email.",
			ButtonLabel: goToBlogEN,
		},
		PageUnsubscribeFailed: {
			Title:       "Unsubscribe failed",
			Heading:     "Could not complete request",
			Message:     "Please try again in a few minutes.",
			ButtonLabel: goToBlogEN,
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
			ButtonLabel: goToBlogTR,
		},
		PageMissingToken: {
			Title:       "Gecersiz onay linki",
			Heading:     "Gecersiz onay linki",
			Message:     "Onay linkinde token bulunamadi.",
			ButtonLabel: goToBlogTR,
		},
		PageServiceDown: {
			Title:       "Onay servisi kullanilamiyor",
			Heading:     "Servis su an kullanilamiyor",
			Message:     "Lutfen birkac dakika sonra tekrar deneyin.",
			ButtonLabel: goToBlogTR,
		},
		PageConfirmFailed: {
			Title:       "Onay basarisiz",
			Heading:     "Abonelik onaylanamadi",
			Message:     "Lutfen tekrar abone olmayi deneyin.",
			ButtonLabel: goToBlogTR,
		},
		PageTokenExpired: {
			Title:       "Link suresi dolmus",
			Heading:     "Onay linki gecersiz veya suresi dolmus",
			Message:     "Yeni bir onay e-postasi icin tekrar abone olun.",
			ButtonLabel: goToBlogTR,
		},
		PageSuccess: {
			Title:       "Abonelik onaylandi",
			Heading:     "Abonelik onaylandi",
			Message:     "E-posta adresiniz dogrulandi. Yeni newsletter guncellemelerini alacaksiniz.",
			ButtonLabel: goToBlogTR,
		},
		PageUnsubscribeSuccess: {
			Title:       "Abonelikten cikildi",
			Heading:     "Abonelik iptal edildi",
			Message:     "Artik newsletter e-postalari almayacaksiniz.",
			ButtonLabel: goToBlogTR,
		},
		PageUnsubscribeInvalid: {
			Title:       "Gecersiz cikis linki",
			Heading:     "Gecersiz veya suresi dolmus link",
			Message:     "Lutfen e-postadaki gecerli cikis linkini kullanin.",
			ButtonLabel: goToBlogTR,
		},
		PageUnsubscribeFailed: {
			Title:       "Cikis islemi basarisiz",
			Heading:     "Islem tamamlanamadi",
			Message:     "Lutfen birkac dakika sonra tekrar deneyin.",
			ButtonLabel: goToBlogTR,
		},
	},
}

var postEmailByLocale = map[string]postEmailContent{
	LocaleEN: {
		SubjectPrefix:    "New post",
		Title:            blogTitle,
		Body:             "A new article is live on the blog. Read it from the link below.",
		NewsletterLabel:  "New post",
		ButtonLabel:      "Read article",
		PublishedLabel:   "Published",
		ReadingTimeLabel: "Reading time",
		RSSLabel:         "RSS feed",
		UnsubscribeLabel: "Unsubscribe",
		FooterNote:       "You are receiving this email because you subscribed to Suayb's Blog newsletter.",
	},
	LocaleTR: {
		SubjectPrefix:    "Yeni yazi",
		Title:            blogTitle,
		Body:             "Blogda yeni bir yazi yayinda. Asagidaki baglantidan okuyabilirsin.",
		NewsletterLabel:  "Yeni yazi",
		ButtonLabel:      "Yaziyi oku",
		PublishedLabel:   "Yayim tarihi",
		ReadingTimeLabel: "Okuma suresi",
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

func ResolveLocale(explicitLocale, acceptLanguageHeader string) string {
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

func ConfirmationEmail(locale, confirmURL, siteURL string) (subject, htmlBody string, err error) {
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

func normalizeTopics(topics []PostTopicBadge) []PostTopicBadge {
	seen := make(map[string]struct{}, len(topics))
	result := make([]PostTopicBadge, 0, len(topics))
	for _, raw := range topics {
		trimmedName := strings.TrimSpace(raw.Name)
		if trimmedName == "" {
			continue
		}
		key := strings.ToLower(trimmedName)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		bgColor := strings.TrimSpace(raw.BgColor)
		if bgColor == "" {
			bgColor = defaultTopicBadgeBgColor
		}
		textColor := strings.TrimSpace(raw.TextColor)
		if textColor == "" {
			textColor = defaultTopicBadgeTextColor
		}
		borderColor := strings.TrimSpace(raw.BorderColor)
		if borderColor == "" {
			borderColor = defaultTopicBadgeBorderColor
		}
		result = append(result, PostTopicBadge{
			Name:        trimmedName,
			URL:         strings.TrimSpace(raw.URL),
			BgColor:     bgColor,
			TextColor:   textColor,
			BorderColor: borderColor,
		})
	}
	return result
}

func formatReadingTime(locale string, readingTimeMin int) string {
	if readingTimeMin <= 0 {
		return ""
	}

	if locale == LocaleTR {
		return fmt.Sprintf("%d dk", readingTimeMin)
	}

	return fmt.Sprintf("%d min read", readingTimeMin)
}

func PostAnnouncementEmail(input PostAnnouncementInput) (subject, htmlBody string, err error) {
	if err := ensureEmailTemplates(); err != nil {
		return "", "", err
	}

	resolved := ResolveLocale(input.Locale, "")
	content, ok := postEmailByLocale[resolved]
	if !ok {
		content = postEmailByLocale[LocaleEN]
	}

	cleanSummary := truncateText(stripHTMLTags(input.PostSummary), 240)
	if cleanSummary == "" {
		cleanSummary = content.Body
	}

	subject = fmt.Sprintf("%s: %s", content.SubjectPrefix, input.PostTitle)

	data := postAnnouncementEmailTemplateData{
		Lang:             resolved,
		FaviconURL:       BuildFaviconURL(input.SiteURL),
		Subject:          subject,
		Title:            content.Title,
		Body:             cleanSummary,
		NewsletterLabel:  content.NewsletterLabel,
		PostCategory:     normalizeCategory(input.PostCategory),
		PostTitle:        strings.TrimSpace(input.PostTitle),
		PostSummary:      cleanSummary,
		PostTopics:       normalizeTopics(input.PostTopics),
		PostImageURL:     strings.TrimSpace(input.PostImageURL),
		PublishedLabel:   content.PublishedLabel,
		PublishedDate:    formatPublishedDate(resolved, input.PublishedAt),
		ReadingTimeLabel: content.ReadingTimeLabel,
		ReadingTimeText:  formatReadingTime(resolved, input.ReadingTimeMin),
		ButtonLabel:      content.ButtonLabel,
		PostURL:          strings.TrimSpace(input.PostURL),
		RSSLabel:         content.RSSLabel,
		RSSURL:           strings.TrimSpace(input.RSSURL),
		UnsubscribeLabel: content.UnsubscribeLabel,
		UnsubscribeURL:   strings.TrimSpace(input.UnsubscribeURL),
		FooterNote:       content.FooterNote,
	}

	htmlBody, err = renderHTMLTemplate(postHTMLTmpl, data)
	if err != nil {
		return "", "", fmt.Errorf("render post html template: %w", err)
	}

	return subject, htmlBody, nil
}

func normalizeCategory(category *PostCategoryBadge) *PostCategoryBadge {
	if category == nil {
		return nil
	}

	name := strings.TrimSpace(category.Name)
	if name == "" {
		return nil
	}
	url := strings.TrimSpace(category.URL)

	bgColor := strings.TrimSpace(category.BgColor)
	if bgColor == "" {
		bgColor = defaultTopicBadgeBgColor
	}
	textColor := strings.TrimSpace(category.TextColor)
	if textColor == "" {
		textColor = defaultTopicBadgeTextColor
	}
	borderColor := strings.TrimSpace(category.BorderColor)
	if borderColor == "" {
		borderColor = defaultTopicBadgeBorderColor
	}

	return &PostCategoryBadge{
		Name:        name,
		URL:         url,
		IconHTML:    category.IconHTML,
		BgColor:     bgColor,
		TextColor:   textColor,
		BorderColor: borderColor,
	}
}
