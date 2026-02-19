package newsletter

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

const (
	defaultSMTPHost = "smtp.gmail.com"
	defaultSMTPPort = "587"
)

type SMTPConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	FromName string
	FromMail string
}

func requiredEnv(name string) (string, error) {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return "", fmt.Errorf("missing required env: %s", name)
	}
	return value, nil
}

func ResolveAllowedOriginRequired() (string, error) {
	return requiredEnv("API_CORS_ORIGIN")
}

func ResolveAllowedOriginOptional() string {
	return strings.TrimSpace(os.Getenv("API_CORS_ORIGIN"))
}

func ResolveDatabaseName() (string, error) {
	return requiredEnv("MONGODB_DATABASE")
}

func ResolveMongoURI() (string, error) {
	return requiredEnv("MONGODB_URI")
}

func ResolveSiteURL() (string, error) {
	value, err := requiredEnv("SITE_URL")
	if err != nil {
		return "", err
	}
	return strings.TrimRight(value, "/"), nil
}

func ResolveSiteURLOrRoot() string {
	value := strings.TrimSpace(os.Getenv("SITE_URL"))
	if value == "" {
		return "/"
	}
	return strings.TrimRight(value, "/")
}

func ResolveCronSecret() (string, error) {
	return requiredEnv("CRON_SECRET")
}

func ResolveUnsubscribeSecret() (string, error) {
	return requiredEnv("NEWSLETTER_UNSUBSCRIBE_SECRET")
}

func ResolveSMTPConfig() (SMTPConfig, error) {
	username, err := requiredEnv("GMAIL_SMTP_USER")
	if err != nil {
		return SMTPConfig{}, err
	}

	password, err := requiredEnv("GMAIL_SMTP_APP_PASSWORD")
	if err != nil {
		return SMTPConfig{}, err
	}

	host := strings.TrimSpace(os.Getenv("GMAIL_SMTP_HOST"))
	if host == "" {
		host = defaultSMTPHost
	}

	port := strings.TrimSpace(os.Getenv("GMAIL_SMTP_PORT"))
	if port == "" {
		port = defaultSMTPPort
	}

	fromMail := strings.TrimSpace(os.Getenv("GMAIL_FROM_EMAIL"))
	if fromMail == "" {
		fromMail = username
	}

	fromName := strings.TrimSpace(os.Getenv("GMAIL_FROM_NAME"))
	if fromName == "" {
		fromName = "Suayb's Blog"
	}

	return SMTPConfig{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
		FromName: fromName,
		FromMail: fromMail,
	}, nil
}

func ResolvePositiveIntEnv(name string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}

	return parsed
}
