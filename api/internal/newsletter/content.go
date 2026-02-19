package newsletter

import (
	"fmt"
	"html"
	"strings"
)

const (
	LocaleEN = "en"
	LocaleTR = "tr"
)

type emailContent struct {
	Subject      string
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
	HeadingPrefix    string
	Body             string
	ButtonLabel      string
	RSSLabel         string
	UnsubscribeLabel string
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
		Title:        "Suayb's Blog",
		Heading:      "Complete your subscription",
		Body:         "Click the button below to confirm your newsletter subscription. If you did not request this, you can ignore this email.",
		ButtonLabel:  "Confirm now",
		FallbackLead: "If the button does not work, copy and paste this link into your browser:",
	},
	LocaleTR: {
		Subject:      "Bulten aboneliginizi onaylayin",
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
		HeadingPrefix:    "Fresh article",
		Body:             "A new article is live on the blog. Read it from the link below.",
		ButtonLabel:      "Read article",
		RSSLabel:         "RSS feed",
		UnsubscribeLabel: "Unsubscribe",
	},
	LocaleTR: {
		SubjectPrefix:    "Yeni yazi",
		Title:            "Suayb's Blog",
		HeadingPrefix:    "Yeni makale",
		Body:             "Blogda yeni bir yazi yayinda. Asagidaki baglantidan okuyabilirsin.",
		ButtonLabel:      "Yaziyi oku",
		RSSLabel:         "RSS akisi",
		UnsubscribeLabel: "Abonelikten cik",
	},
}

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

func ConfirmationEmail(locale string, confirmURL string) (subject string, plainBody string, htmlBody string) {
	resolved := ResolveLocale(locale, "")
	content, ok := emailByLocale[resolved]
	if !ok {
		content = emailByLocale[LocaleEN]
	}

	escapedURL := html.EscapeString(confirmURL)
	plainBody = fmt.Sprintf("%s: %s", content.ButtonLabel, confirmURL)
	htmlBody = fmt.Sprintf(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>%s</title>
  </head>
  <body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;">
            <tr><td style="font-size:40px;line-height:1;font-weight:800;color:#111827;padding-bottom:8px;">%s</td></tr>
            <tr><td style="font-size:34px;line-height:1.2;font-weight:700;color:#111827;padding:10px 0 10px;">%s</td></tr>
            <tr><td style="font-size:18px;line-height:1.7;color:#374151;padding-bottom:18px;">%s</td></tr>
            <tr>
              <td style="padding:8px 0 24px;">
                <a href="%s" style="display:inline-block;background:#1677ff;color:#ffffff;text-decoration:none;font-weight:700;border-radius:999px;padding:14px 26px;font-size:18px;">%s</a>
              </td>
            </tr>
            <tr>
              <td style="font-size:14px;line-height:1.6;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:18px;word-break:break-word;">
                %s<br/>
                <a href="%s" style="color:#2563eb;">%s</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`, html.EscapeString(content.Subject), html.EscapeString(content.Title), html.EscapeString(content.Heading), html.EscapeString(content.Body), escapedURL, html.EscapeString(content.ButtonLabel), html.EscapeString(content.FallbackLead), escapedURL, escapedURL)

	return content.Subject, plainBody, htmlBody
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
	postURL string,
	rssURL string,
	unsubscribeURL string,
) (subject string, plainBody string, htmlBody string) {
	resolved := ResolveLocale(locale, "")
	content, ok := postEmailByLocale[resolved]
	if !ok {
		content = postEmailByLocale[LocaleEN]
	}

	cleanSummary := truncateText(stripHTMLTags(postSummary), 240)
	if cleanSummary == "" {
		cleanSummary = content.Body
	}

	escapedPostURL := html.EscapeString(postURL)
	escapedRSSURL := html.EscapeString(rssURL)
	escapedUnsubscribeURL := html.EscapeString(unsubscribeURL)
	escapedTitle := html.EscapeString(postTitle)
	escapedSummary := html.EscapeString(cleanSummary)

	subject = fmt.Sprintf("%s: %s", content.SubjectPrefix, postTitle)
	plainBody = fmt.Sprintf(
		"%s\n\n%s\n%s: %s\n%s: %s",
		postTitle,
		cleanSummary,
		content.ButtonLabel,
		postURL,
		content.UnsubscribeLabel,
		unsubscribeURL,
	)

	htmlBody = fmt.Sprintf(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>%s</title>
  </head>
  <body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;">
            <tr><td style="font-size:40px;line-height:1;font-weight:800;color:#111827;padding-bottom:8px;">%s</td></tr>
            <tr><td style="font-size:30px;line-height:1.2;font-weight:700;color:#111827;padding:10px 0 10px;">%s: %s</td></tr>
            <tr><td style="font-size:16px;line-height:1.7;color:#374151;padding-bottom:18px;">%s</td></tr>
            <tr><td style="font-size:26px;line-height:1.35;font-weight:700;color:#111827;padding-bottom:16px;">%s</td></tr>
            <tr>
              <td style="padding:8px 0 24px;">
                <a href="%s" style="display:inline-block;background:#1677ff;color:#ffffff;text-decoration:none;font-weight:700;border-radius:999px;padding:14px 26px;font-size:18px;">%s</a>
              </td>
            </tr>
            <tr>
              <td style="font-size:14px;line-height:1.6;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:18px;word-break:break-word;">
                %s: <a href="%s" style="color:#2563eb;">%s</a><br/>
                %s: <a href="%s" style="color:#2563eb;">%s</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
		html.EscapeString(subject),
		html.EscapeString(content.Title),
		html.EscapeString(content.HeadingPrefix),
		escapedTitle,
		escapedSummary,
		escapedTitle,
		escapedPostURL,
		html.EscapeString(content.ButtonLabel),
		html.EscapeString(content.RSSLabel),
		escapedRSSURL,
		escapedRSSURL,
		html.EscapeString(content.UnsubscribeLabel),
		escapedUnsubscribeURL,
		escapedUnsubscribeURL,
	)

	return subject, plainBody, htmlBody
}
