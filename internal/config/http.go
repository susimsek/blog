package config

import (
	"strings"
	"time"
)

const (
	DefaultLocalHTTPPort         = "8080"
	DefaultHTTPReadHeaderTimeout = 10 * time.Second
)

type HTTPConfig struct {
	AllowedOrigin     string
	LocalPort         string
	ReadHeaderTimeout time.Duration
}

func ResolveHTTPConfig() HTTPConfig {
	port := strings.TrimSpace(getenv("LOCAL_GO_API_PORT"))
	if port == "" {
		port = DefaultLocalHTTPPort
	}

	return HTTPConfig{
		AllowedOrigin:     strings.TrimSpace(getenv("API_CORS_ORIGIN")),
		LocalPort:         port,
		ReadHeaderTimeout: DefaultHTTPReadHeaderTimeout,
	}
}

func ResolveAllowedOriginRequired() (string, error) {
	httpConfig := ResolveHTTPConfig()
	if httpConfig.AllowedOrigin == "" {
		_, err := requiredEnv("API_CORS_ORIGIN")
		return "", err
	}

	return httpConfig.AllowedOrigin, nil
}

func ResolveAllowedOriginOptional() string {
	return ResolveHTTPConfig().AllowedOrigin
}
