package config

import "strings"

type AdminGoogleConfig struct {
	ClientID     string
	ClientSecret string
}

func ResolveAdminGoogleConfig() AdminGoogleConfig {
	return AdminGoogleConfig{
		ClientID:     strings.TrimSpace(getenv("GOOGLE_CLIENT_ID")),
		ClientSecret: strings.TrimSpace(getenv("GOOGLE_CLIENT_SECRET")),
	}
}

func (cfg AdminGoogleConfig) Enabled() bool {
	return cfg.ClientID != "" && cfg.ClientSecret != ""
}
