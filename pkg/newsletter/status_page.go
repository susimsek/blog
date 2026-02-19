package newsletter

import (
	"bytes"
	"fmt"
	htmltemplate "html/template"
	"net/http"
	"sync"
)

type statusPageTemplateData struct {
	Lang        string
	FaviconURL  string
	Title       string
	Heading     string
	Message     string
	ButtonHref  string
	ButtonLabel string
}

var (
	statusPageTemplateOnce sync.Once
	statusPageTemplateErr  error
	statusPageTemplate     *htmltemplate.Template
)

func ensureStatusPageTemplate() error {
	statusPageTemplateOnce.Do(func() {
		var err error
		statusPageTemplate, err = htmltemplate.ParseFS(newsletterTemplateFS, "templates/status_page.html.tmpl")
		if err != nil {
			statusPageTemplateErr = fmt.Errorf("parse status page template: %w", err)
			return
		}
	})

	return statusPageTemplateErr
}

func RenderStatusPage(
	w http.ResponseWriter,
	statusCode int,
	locale string,
	siteURL string,
	title string,
	heading string,
	message string,
	buttonHref string,
	buttonLabel string,
) error {
	if err := ensureStatusPageTemplate(); err != nil {
		return err
	}

	data := statusPageTemplateData{
		Lang:        ResolveLocale(locale, ""),
		FaviconURL:  BuildFaviconURL(siteURL),
		Title:       title,
		Heading:     heading,
		Message:     message,
		ButtonHref:  buttonHref,
		ButtonLabel: buttonLabel,
	}

	var buffer bytes.Buffer
	if err := statusPageTemplate.Execute(&buffer, data); err != nil {
		return fmt.Errorf("render status page template: %w", err)
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(statusCode)
	_, _ = w.Write(buffer.Bytes())
	return nil
}
