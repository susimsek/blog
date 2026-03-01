package config

import "testing"

func TestResolveMailConfig(t *testing.T) {
	t.Setenv("GMAIL_SMTP_USER", "sender@example.com")
	t.Setenv("GMAIL_SMTP_APP_PASSWORD", "app-password")

	cfg, err := ResolveMailConfig()
	if err != nil {
		t.Fatalf("ResolveMailConfig() error = %v", err)
	}
	if cfg.Host != DefaultSMTPHost || cfg.Port != DefaultSMTPPort {
		t.Fatalf("default mail config = %#v", cfg)
	}
	if cfg.FromMail != "sender@example.com" || cfg.FromName != DefaultMailFromName {
		t.Fatalf("default sender config = %#v", cfg)
	}

	t.Setenv("GMAIL_SMTP_HOST", "smtp.example.com")
	t.Setenv("GMAIL_SMTP_PORT", "2525")
	t.Setenv("GMAIL_FROM_EMAIL", "noreply@example.com")
	t.Setenv("GMAIL_FROM_NAME", "Blog Mailer")

	cfg, err = ResolveMailConfig()
	if err != nil {
		t.Fatalf("ResolveMailConfig() error = %v", err)
	}
	if cfg.Host != "smtp.example.com" || cfg.Port != "2525" {
		t.Fatalf("custom mail config = %#v", cfg)
	}
	if cfg.FromMail != "noreply@example.com" || cfg.FromName != "Blog Mailer" {
		t.Fatalf("custom sender config = %#v", cfg)
	}
}

func TestBuildSMTPServerAddress(t *testing.T) {
	if got := BuildSMTPServerAddress(MailConfig{Host: "smtp.example.com", Port: "2525"}); got != "smtp.example.com:2525" {
		t.Fatalf("BuildSMTPServerAddress() = %q", got)
	}
}
