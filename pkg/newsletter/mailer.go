package newsletter

import (
	"fmt"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
)

func SendHTMLEmail(
	cfg SMTPConfig,
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
	message.WriteString(fmt.Sprintf("From: %s\r\n", fromHeader))
	message.WriteString(fmt.Sprintf("To: %s\r\n", strings.TrimSpace(recipientEmail)))
	message.WriteString(fmt.Sprintf("Subject: %s\r\n", strings.TrimSpace(subject)))
	for key, value := range extraHeaders {
		trimmedKey := strings.TrimSpace(key)
		if trimmedKey == "" {
			continue
		}
		message.WriteString(fmt.Sprintf("%s: %s\r\n", trimmedKey, strings.TrimSpace(value)))
	}
	message.WriteString("MIME-Version: 1.0\r\n")
	message.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	message.WriteString("\r\n")
	message.WriteString(htmlBody)
	message.WriteString("\r\n")

	auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)
	serverAddr := net.JoinHostPort(cfg.Host, cfg.Port)
	if err := smtp.SendMail(serverAddr, auth, cfg.FromMail, []string{recipientEmail}, []byte(message.String())); err != nil {
		return fmt.Errorf("smtp send failed: %w", err)
	}

	return nil
}
