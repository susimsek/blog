package config

import "strings"

type ReaderGoogleConfig struct {
	ClientID     string
	ClientSecret string
}

func ResolveReaderGoogleConfig() ReaderGoogleConfig {
	clientID := strings.TrimSpace(getenv("GOOGLE_CLIENT_ID"))
	clientSecret := strings.TrimSpace(getenv("GOOGLE_CLIENT_SECRET"))

	return ReaderGoogleConfig{
		ClientID:     clientID,
		ClientSecret: clientSecret,
	}
}

func (cfg ReaderGoogleConfig) Enabled() bool {
	return cfg.ClientID != "" && cfg.ClientSecret != ""
}
