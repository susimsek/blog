package config

import (
	"net"
	"strings"
)

const (
	DefaultSMTPHost     = "smtp.gmail.com"
	DefaultSMTPPort     = "587"
	DefaultMailFromName = "Suayb's Blog"
)

type MailConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	FromName string
	FromMail string
}

func ResolveMailConfig() (MailConfig, error) {
	username, err := requiredEnv("GMAIL_SMTP_USER")
	if err != nil {
		return MailConfig{}, err
	}

	password, err := requiredEnv("GMAIL_SMTP_APP_PASSWORD")
	if err != nil {
		return MailConfig{}, err
	}

	host := strings.TrimSpace(getenv("GMAIL_SMTP_HOST"))
	if host == "" {
		host = DefaultSMTPHost
	}

	port := strings.TrimSpace(getenv("GMAIL_SMTP_PORT"))
	if port == "" {
		port = DefaultSMTPPort
	}

	fromMail := strings.TrimSpace(getenv("GMAIL_FROM_EMAIL"))
	if fromMail == "" {
		fromMail = username
	}

	fromName := strings.TrimSpace(getenv("GMAIL_FROM_NAME"))
	if fromName == "" {
		fromName = DefaultMailFromName
	}

	return MailConfig{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
		FromName: fromName,
		FromMail: fromMail,
	}, nil
}

func BuildSMTPServerAddress(cfg MailConfig) string {
	return net.JoinHostPort(cfg.Host, cfg.Port)
}
