package newsletter

import (
	"errors"
	"net/smtp"
	"strings"
	"testing"
)

func TestSendHTMLEmail(t *testing.T) {
	originalSendMail := smtpSendMail
	t.Cleanup(func() {
		smtpSendMail = originalSendMail
	})

	smtpSendMail = func(addr string, auth smtp.Auth, from string, to []string, msg []byte) error {
		if addr != "smtp.example.com:2525" {
			t.Fatalf("addr = %q", addr)
		}
		if from != "noreply@example.com" {
			t.Fatalf("from = %q", from)
		}
		if len(to) != 1 || to[0] != "reader@example.com" {
			t.Fatalf("to = %#v", to)
		}

		message := string(msg)
		for _, fragment := range []string{
			"From: \"Blog Mailer\" <noreply@example.com>",
			"To: reader@example.com",
			"Subject: Welcome",
			"X-Campaign: launch",
			"Content-Type: text/html; charset=\"UTF-8\"",
			"<strong>Hello</strong>",
		} {
			if !strings.Contains(message, fragment) {
				t.Fatalf("message missing %q: %s", fragment, message)
			}
		}

		return nil
	}

	err := SendHTMLEmail(
		SMTPConfig{
			Host:     "smtp.example.com",
			Port:     "2525",
			Username: "user",
			Password: "pass",
			FromName: "Blog Mailer",
			FromMail: "noreply@example.com",
		},
		"reader@example.com",
		"Welcome",
		"<strong>Hello</strong>",
		map[string]string{
			"X-Campaign": "launch",
			" ":          "ignored",
		},
	)
	if err != nil {
		t.Fatalf("SendHTMLEmail() error = %v", err)
	}
}

func TestSendHTMLEmailReturnsSMTPError(t *testing.T) {
	originalSendMail := smtpSendMail
	t.Cleanup(func() {
		smtpSendMail = originalSendMail
	})

	smtpSendMail = func(string, smtp.Auth, string, []string, []byte) error {
		return errors.New("smtp down")
	}

	err := SendHTMLEmail(
		SMTPConfig{Host: "smtp.example.com", Port: "2525", Username: "user", Password: "pass", FromMail: "noreply@example.com"},
		"reader@example.com",
		"Welcome",
		"<strong>Hello</strong>",
		nil,
	)
	if err == nil || !strings.Contains(err.Error(), "smtp send failed") {
		t.Fatalf("unexpected error = %v", err)
	}
}
