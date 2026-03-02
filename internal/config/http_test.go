package config

import (
	"testing"
	"time"
)

func TestResolveHTTPConfig(t *testing.T) {
	t.Run("uses defaults", func(t *testing.T) {
		cfg := ResolveHTTPConfig()

		if cfg.LocalPort != DefaultLocalHTTPPort {
			t.Fatalf("LocalPort = %q", cfg.LocalPort)
		}
		if cfg.ReadHeaderTimeout != DefaultHTTPReadHeaderTimeout {
			t.Fatalf("ReadHeaderTimeout = %s", cfg.ReadHeaderTimeout)
		}
		if cfg.AllowedOrigin != "" {
			t.Fatalf("AllowedOrigin = %q", cfg.AllowedOrigin)
		}
	})

	t.Run("trims configured values", func(t *testing.T) {
		t.Setenv("LOCAL_GO_API_PORT", " 9090 ")
		t.Setenv("API_CORS_ORIGIN", " https://example.com ")

		cfg := ResolveHTTPConfig()

		if cfg.LocalPort != "9090" {
			t.Fatalf("LocalPort = %q", cfg.LocalPort)
		}
		if cfg.AllowedOrigin != "https://example.com" {
			t.Fatalf("AllowedOrigin = %q", cfg.AllowedOrigin)
		}
		if cfg.ReadHeaderTimeout != 10*time.Second {
			t.Fatalf("ReadHeaderTimeout = %s", cfg.ReadHeaderTimeout)
		}
	})
}
