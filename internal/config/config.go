package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

var getenv = os.Getenv

func requiredEnv(name string) (string, error) {
	value := strings.TrimSpace(getenv(name))
	if value == "" {
		return "", fmt.Errorf("missing required env: %s", name)
	}
	return value, nil
}

func ResolveAllowedOriginRequired() (string, error) {
	return requiredEnv("API_CORS_ORIGIN")
}

func ResolveAllowedOriginOptional() string {
	return strings.TrimSpace(getenv("API_CORS_ORIGIN"))
}

func ResolveSiteURL() (string, error) {
	value, err := requiredEnv("SITE_URL")
	if err != nil {
		return "", err
	}
	return strings.TrimRight(value, "/"), nil
}

func ResolveSiteURLOrRoot() string {
	value := strings.TrimSpace(getenv("SITE_URL"))
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

func ResolvePositiveIntEnv(name string, fallback int) int {
	value := strings.TrimSpace(getenv(name))
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}

	return parsed
}

func resolveOptionalBoolEnv(name string) (bool, bool) {
	rawValue := strings.TrimSpace(getenv(name))
	if rawValue == "" {
		return false, false
	}

	switch strings.ToLower(rawValue) {
	case "1", "true", "yes", "on":
		return true, true
	case "0", "false", "no", "off":
		return false, true
	default:
		return false, false
	}
}

func resolveBoolEnv(name string, fallback bool) bool {
	if value, ok := resolveOptionalBoolEnv(name); ok {
		return value
	}

	return fallback
}
