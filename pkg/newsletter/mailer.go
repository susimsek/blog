package newsletter

import (
	"fmt"
	"net/mail"
	"net/smtp"
	"strings"

	appconfig "suaybsimsek.com/blog-api/internal/config"
)

var smtpSendMail = smtp.SendMail

func SendHTMLEmail(
	cfg appconfig.MailConfig,
	recipientEmail string,
	subject string,
	htmlBody string,
	extraHeaders map[string]string,
) error {
	fromHeader := (&mail.Address{
		Name:    cfg.FromName,
		Address: cfg.FromMail,
	}).String()

	message := strings.Builder{}
	_, _ = fmt.Fprintf(&message, "From: %s\r\n", fromHeader)
	_, _ = fmt.Fprintf(&message, "To: %s\r\n", strings.TrimSpace(recipientEmail))
	_, _ = fmt.Fprintf(&message, "Subject: %s\r\n", strings.TrimSpace(subject))
	for key, value := range extraHeaders {
		trimmedKey := strings.TrimSpace(key)
		if trimmedKey == "" {
			continue
		}
		_, _ = fmt.Fprintf(&message, "%s: %s\r\n", trimmedKey, strings.TrimSpace(value))
	}
	message.WriteString("MIME-Version: 1.0\r\n")
	message.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	message.WriteString("\r\n")
	message.WriteString(htmlBody)
	message.WriteString("\r\n")

	auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)
	serverAddr := appconfig.BuildSMTPServerAddress(cfg)
	if err := smtpSendMail(serverAddr, auth, cfg.FromMail, []string{recipientEmail}, []byte(message.String())); err != nil {
		return fmt.Errorf("smtp send failed: %w", err)
	}

	return nil
}
