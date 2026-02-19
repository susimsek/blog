package newsletter

import (
	"strings"
	"testing"
	"time"
)

func TestBuildAndParseUnsubscribeToken(t *testing.T) {
	now := time.Date(2026, 2, 18, 12, 0, 0, 0, time.UTC)
	token, err := BuildUnsubscribeToken("Reader@Example.com", "secret-value", now, 2*time.Hour)
	if err != nil {
		t.Fatalf("BuildUnsubscribeToken returned error: %v", err)
	}

	email, err := ParseUnsubscribeToken(token, "secret-value", now.Add(30*time.Minute))
	if err != nil {
		t.Fatalf("ParseUnsubscribeToken returned error: %v", err)
	}

	if email != "reader@example.com" {
		t.Fatalf("expected normalized email, got %q", email)
	}
}

func TestParseUnsubscribeTokenExpired(t *testing.T) {
	now := time.Date(2026, 2, 18, 12, 0, 0, 0, time.UTC)
	token, err := BuildUnsubscribeToken("reader@example.com", "secret-value", now, 10*time.Minute)
	if err != nil {
		t.Fatalf("BuildUnsubscribeToken returned error: %v", err)
	}

	_, err = ParseUnsubscribeToken(token, "secret-value", now.Add(11*time.Minute))
	if err == nil || !strings.Contains(err.Error(), "expired") {
		t.Fatalf("expected expired error, got %v", err)
	}
}

func TestParseUnsubscribeTokenTampered(t *testing.T) {
	now := time.Date(2026, 2, 18, 12, 0, 0, 0, time.UTC)
	token, err := BuildUnsubscribeToken("reader@example.com", "secret-value", now, time.Hour)
	if err != nil {
		t.Fatalf("BuildUnsubscribeToken returned error: %v", err)
	}

	tampered := token + "a"
	_, err = ParseUnsubscribeToken(tampered, "secret-value", now.Add(5*time.Minute))
	if err == nil || !strings.Contains(err.Error(), "signature") {
		t.Fatalf("expected signature error, got %v", err)
	}
}
