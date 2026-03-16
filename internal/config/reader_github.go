package config

import "strings"

type ReaderGithubConfig struct {
	ClientID     string
	ClientSecret string
}

func ResolveReaderGithubConfig() ReaderGithubConfig {
	clientID := strings.TrimSpace(getenv("GITHUB_CLIENT_ID"))
	clientSecret := strings.TrimSpace(getenv("GITHUB_CLIENT_SECRET"))

	return ReaderGithubConfig{
		ClientID:     clientID,
		ClientSecret: clientSecret,
	}
}

func (cfg ReaderGithubConfig) Enabled() bool {
	return cfg.ClientID != "" && cfg.ClientSecret != ""
}
