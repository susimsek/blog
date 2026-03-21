package adminmail

import (
	"bytes"
	"embed"
	"fmt"
	htmltemplate "html/template"
	"strings"
	"sync"

	"suaybsimsek.com/blog-api/pkg/newsletter"
)

//go:embed templates/*.tmpl
var templateFS embed.FS

type emailTemplateData struct {
	Lang         string
	FaviconURL   string
	EyebrowLabel string
	Title        string
	Heading      string
	Body         string
	ButtonLabel  string
	FallbackLead string
	ActionURL    string
}

type noticeTemplateData struct {
	Lang         string
	FaviconURL   string
	EyebrowLabel string
	Title        string
	Heading      string
	Body         string
	FooterNote   string
}

type statusTemplateData struct {
	Lang        string
	FaviconURL  string
	Title       string
	Heading     string
	Message     string
	ButtonLabel string
	ButtonHref  string
}

type emailCopy struct {
	Subject      string
	EyebrowLabel string
	Title        string
	Heading      string
	Body         string
	ButtonLabel  string
	FallbackLead string
}

type noticeCopy struct {
	Subject      string
	EyebrowLabel string
	Title        string
	Heading      string
	Body         string
	FooterNote   string
}

type statusCopy struct {
	Title       string
	Heading     string
	Message     string
	ButtonLabel string
}

type StatusKey string

const (
	StatusSuccess            StatusKey = "success"
	StatusInvalidLink        StatusKey = "invalid-link"
	StatusExpired            StatusKey = "expired"
	StatusFailed             StatusKey = "failed"
	StatusServiceUnavailable StatusKey = "service-unavailable"
	StatusConfigError        StatusKey = "config-error"
)

var (
	confirmationTemplate *htmltemplate.Template
	noticeTemplate       *htmltemplate.Template
	statusTemplate       *htmltemplate.Template
	templateErr          error
	templateOnce         sync.Once
)

var emailByLocale = map[string]emailCopy{
	"en": {
		Subject:      "Confirm your admin email change",
		EyebrowLabel: "Admin security",
		Title:        "Suayb's Blog",
		Heading:      "Confirm your new admin email",
		Body:         "Click the button below to confirm this new email address for your admin account. If you did not request this change, you can ignore this email.",
		ButtonLabel:  "Confirm email change",
		FallbackLead: "If the button does not work, copy and paste this link into your browser:",
	},
	"tr": {
		Subject:      "Yonetici e-posta degisikligini onaylayin",
		EyebrowLabel: "Yonetici guvenligi",
		Title:        "Suayb's Blog",
		Heading:      "Yeni yonetici e-postanizi onaylayin",
		Body:         "Yonetici hesabiniz icin bu yeni e-posta adresini onaylamak icin asagidaki butona tiklayin. Bu degisikligi siz baslatmadiysaniz bu e-postayi yok sayabilirsiniz.",
		ButtonLabel:  "E-posta degisikligini onayla",
		FallbackLead: "Buton calismazsa bu baglantiyi tarayiciniza yapistirin:",
	},
}

var passwordResetByLocale = map[string]emailCopy{
	"en": {
		Subject:      "Reset your admin password",
		EyebrowLabel: "Admin security",
		Title:        "Suayb's Blog",
		Heading:      "Reset your admin password",
		Body:         "Use the button below to choose a new password for your admin account. If you did not request this reset, you can ignore this email.",
		ButtonLabel:  "Reset password",
		FallbackLead: "If the button does not work, copy and paste this link into your browser:",
	},
	"tr": {
		Subject:      "Yonetici parolanizi sifirlayin",
		EyebrowLabel: "Yonetici guvenligi",
		Title:        "Suayb's Blog",
		Heading:      "Yonetici parolanizi sifirlayin",
		Body:         "Yonetici hesabiniz icin yeni bir parola belirlemek uzere asagidaki butonu kullanin. Bu sifirlama istegini siz baslatmadiysaniz bu e-postayi yok sayabilirsiniz.",
		ButtonLabel:  "Parolayi sifirla",
		FallbackLead: "Buton calismazsa bu baglantiyi tarayiciniza yapistirin:",
	},
}

var noticeByLocale = map[string]noticeCopy{
	"en": {
		Subject:      "Admin email change requested",
		EyebrowLabel: "Admin security",
		Title:        "Suayb's Blog",
		Heading:      "Your admin email change was requested",
		Body:         "A request was made to change your admin email address. The new address will become active only after it is confirmed from the new inbox.",
		FooterNote:   "If you did not request this change, review your admin account immediately.",
	},
	"tr": {
		Subject:      "Yonetici e-posta degisikligi istendi",
		EyebrowLabel: "Yonetici guvenligi",
		Title:        "Suayb's Blog",
		Heading:      "Yonetici e-posta degisikligi istendi",
		Body:         "Yonetici hesabinizin e-posta adresini degistirmek icin bir istek baslatildi. Yeni e-posta, yalnizca yeni gelen kutusundan onaylandiktan sonra aktif olur.",
		FooterNote:   "Bu istegi siz baslatmadiysaniz yonetici hesabinizi hemen kontrol edin.",
	},
}

var statusByLocale = map[string]map[StatusKey]statusCopy{
	"en": {
		StatusSuccess: {
			Title:       "Admin email updated",
			Heading:     "Your admin email is confirmed",
			Message:     "The new admin email address is now active. Sign in again to continue.",
			ButtonLabel: "Open admin login",
		},
		StatusInvalidLink: {
			Title:       "Invalid link",
			Heading:     "This confirmation link is invalid",
			Message:     "The email change link is missing or invalid.",
			ButtonLabel: "Go to home",
		},
		StatusExpired: {
			Title:       "Link expired",
			Heading:     "This confirmation link has expired",
			Message:     "Start the email change request again from the admin panel.",
			ButtonLabel: "Go to home",
		},
		StatusFailed: {
			Title:       "Email change failed",
			Heading:     "The email address could not be changed",
			Message:     "Try again from the admin panel.",
			ButtonLabel: "Go to home",
		},
		StatusServiceUnavailable: {
			Title:       "Service unavailable",
			Heading:     "The confirmation service is temporarily unavailable",
			Message:     "Please try again in a few minutes.",
			ButtonLabel: "Go to home",
		},
		StatusConfigError: {
			Title:       "Configuration error",
			Heading:     "The confirmation service is not configured correctly",
			Message:     "Please contact the administrator.",
			ButtonLabel: "Go to home",
		},
	},
	"tr": {
		StatusSuccess: {
			Title:       "Yonetici e-postasi guncellendi",
			Heading:     "Yeni yonetici e-postaniz onaylandi",
			Message:     "Yeni yonetici e-posta adresi artik aktif. Devam etmek icin yeniden giris yapin.",
			ButtonLabel: "Yonetici girisini ac",
		},
		StatusInvalidLink: {
			Title:       "Gecersiz baglanti",
			Heading:     "Bu onay baglantisi gecersiz",
			Message:     "E-posta degisikligi baglantisi eksik veya gecersiz.",
			ButtonLabel: "Ana sayfaya git",
		},
		StatusExpired: {
			Title:       "Baglanti suresi doldu",
			Heading:     "Bu onay baglantisinin suresi doldu",
			Message:     "E-posta degisikligi istegini yonetim panelinden tekrar baslatin.",
			ButtonLabel: "Ana sayfaya git",
		},
		StatusFailed: {
			Title:       "E-posta degisikligi basarisiz",
			Heading:     "E-posta adresi degistirilemedi",
			Message:     "Lutfen islemi yonetim panelinden tekrar deneyin.",
			ButtonLabel: "Ana sayfaya git",
		},
		StatusServiceUnavailable: {
			Title:       "Servis kullanilamiyor",
			Heading:     "Onay servisi gecici olarak kullanilamiyor",
			Message:     "Lutfen birkac dakika sonra tekrar deneyin.",
			ButtonLabel: "Ana sayfaya git",
		},
		StatusConfigError: {
			Title:       "Yapilandirma hatasi",
			Heading:     "Onay servisi dogru sekilde yapilandirilmamis",
			Message:     "Lutfen yonetici ile iletisime gecin.",
			ButtonLabel: "Ana sayfaya git",
		},
	},
}

func ConfirmationEmail(locale, confirmURL, siteURL string) (string, string, error) {
	if err := ensureTemplates(); err != nil {
		return "", "", err
	}

	resolved := resolveLocale(locale)
	content := emailByLocale[resolved]
	data := emailTemplateData{
		Lang:         resolved,
		FaviconURL:   newsletter.BuildFaviconURL(siteURL),
		EyebrowLabel: content.EyebrowLabel,
		Title:        content.Title,
		Heading:      content.Heading,
		Body:         content.Body,
		ButtonLabel:  content.ButtonLabel,
		FallbackLead: content.FallbackLead,
		ActionURL:    strings.TrimSpace(confirmURL),
	}

	htmlBody, err := renderTemplate(confirmationTemplate, data)
	if err != nil {
		return "", "", fmt.Errorf("render admin email change confirmation template: %w", err)
	}

	return content.Subject, htmlBody, nil
}

func PasswordResetEmail(locale, resetURL, siteURL string) (string, string, error) {
	if err := ensureTemplates(); err != nil {
		return "", "", err
	}

	resolved := resolveLocale(locale)
	content := passwordResetByLocale[resolved]
	data := emailTemplateData{
		Lang:         resolved,
		FaviconURL:   newsletter.BuildFaviconURL(siteURL),
		EyebrowLabel: content.EyebrowLabel,
		Title:        content.Title,
		Heading:      content.Heading,
		Body:         content.Body,
		ButtonLabel:  content.ButtonLabel,
		FallbackLead: content.FallbackLead,
		ActionURL:    strings.TrimSpace(resetURL),
	}

	htmlBody, err := renderTemplate(confirmationTemplate, data)
	if err != nil {
		return "", "", fmt.Errorf("render admin password reset email template: %w", err)
	}

	return content.Subject, htmlBody, nil
}

func ChangeRequestedNoticeEmail(locale, siteURL string) (string, string, error) {
	if err := ensureTemplates(); err != nil {
		return "", "", err
	}

	resolved := resolveLocale(locale)
	content := noticeByLocale[resolved]
	data := noticeTemplateData{
		Lang:         resolved,
		FaviconURL:   newsletter.BuildFaviconURL(siteURL),
		EyebrowLabel: content.EyebrowLabel,
		Title:        content.Title,
		Heading:      content.Heading,
		Body:         content.Body,
		FooterNote:   content.FooterNote,
	}

	htmlBody, err := renderTemplate(noticeTemplate, data)
	if err != nil {
		return "", "", fmt.Errorf("render admin email change notice template: %w", err)
	}

	return content.Subject, htmlBody, nil
}

func StatusPage(locale string, status StatusKey, siteURL string) (string, error) {
	if err := ensureTemplates(); err != nil {
		return "", err
	}

	resolved := resolveLocale(locale)
	content := statusByLocale[resolved][status]
	buttonHref := strings.TrimRight(siteURL, "/") + "/" + resolved
	if status == StatusSuccess {
		buttonHref = strings.TrimRight(siteURL, "/") + "/" + resolved + "/admin/login"
	}

	return renderTemplate(statusTemplate, statusTemplateData{
		Lang:        resolved,
		FaviconURL:  newsletter.BuildFaviconURL(siteURL),
		Title:       content.Title,
		Heading:     content.Heading,
		Message:     content.Message,
		ButtonLabel: content.ButtonLabel,
		ButtonHref:  buttonHref,
	})
}

func ensureTemplates() error {
	templateOnce.Do(func() {
		var err error
		confirmationTemplate, err = htmltemplate.ParseFS(templateFS, "templates/email_change_confirmation.html.tmpl")
		if err != nil {
			templateErr = fmt.Errorf("parse admin email change confirmation template: %w", err)
			return
		}

		noticeTemplate, err = htmltemplate.ParseFS(templateFS, "templates/email_change_notice.html.tmpl")
		if err != nil {
			templateErr = fmt.Errorf("parse admin email change notice template: %w", err)
			return
		}

		statusTemplate, err = htmltemplate.ParseFS(templateFS, "templates/status_page.html.tmpl")
		if err != nil {
			templateErr = fmt.Errorf("parse admin email change status template: %w", err)
		}
	})

	return templateErr
}

func renderTemplate(tmpl *htmltemplate.Template, data any) (string, error) {
	var buffer bytes.Buffer
	if err := tmpl.Execute(&buffer, data); err != nil {
		return "", err
	}
	return buffer.String(), nil
}

func resolveLocale(locale string) string {
	return newsletter.ResolveLocale(strings.TrimSpace(locale), "")
}
