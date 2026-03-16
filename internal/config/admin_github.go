package config

import "strings"

type AdminGithubConfig struct {
	ClientID     string
	ClientSecret string
}

func ResolveAdminGithubConfig() AdminGithubConfig {
	return AdminGithubConfig{
		ClientID:     strings.TrimSpace(getenv("GITHUB_CLIENT_ID")),
		ClientSecret: strings.TrimSpace(getenv("GITHUB_CLIENT_SECRET")),
	}
}

func (cfg AdminGithubConfig) Enabled() bool {
	return cfg.ClientID != "" && cfg.ClientSecret != ""
}
