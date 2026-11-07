package scalars

import (
	"bytes"
	"strings"
	"testing"
)

func TestNormalizeValues(t *testing.T) {
	tests := []struct {
		name      string
		normalize func(any) (string, error)
		input     any
		want      string
		wantErr   string
	}{
		{name: "date trims valid ISO value", normalize: NormalizeDateValue, input: " 2026-11-06 ", want: "2026-11-06"},
		{name: "date rejects wrong format", normalize: NormalizeDateValue, input: "06/11/2026", wantErr: "Date must match 2006-01-02"},
		{name: "date rejects impossible day", normalize: NormalizeDateValue, input: "2026-02-30", wantErr: "Date must match 2006-01-02"},
		{name: "email normalizes case", normalize: NormalizeEmailValue, input: " Reader@Example.COM ", want: "reader@example.com"},
		{name: "email rejects display name", normalize: NormalizeEmailValue, input: "Reader <reader@example.com>", wantErr: "Email must be a valid address"},
		{name: "locale normalizes case", normalize: NormalizeLocaleValue, input: " TR ", want: "tr"},
		{name: "locale rejects unsupported value", normalize: NormalizeLocaleValue, input: "fr", wantErr: "Locale must be one of: en, tr"},
		{name: "URL accepts URI", normalize: NormalizeURLValue, input: "https://example.com/path?q=1", want: "https://example.com/path?q=1"},
		{name: "URL rejects malformed URI", normalize: NormalizeURLValue, input: "http://[::1", wantErr: "URL must be a valid URI"},
		{name: "input must be a string", normalize: NormalizeDateValue, input: 42, wantErr: "Date must be a string"},
		{name: "input cannot be blank", normalize: NormalizeEmailValue, input: " \t", wantErr: "Email cannot be empty"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := tt.normalize(tt.input)
			if tt.wantErr != "" {
				if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
					t.Fatalf("normalize() error = %v, want containing %q", err, tt.wantErr)
				}
				return
			}
			if err != nil || got != tt.want {
				t.Fatalf("normalize() = %q, %v; want %q, nil", got, err, tt.want)
			}
		})
	}
}

func TestScalarMarshalAndUnmarshal(t *testing.T) {
	tests := []struct {
		name    string
		marshal func(*bytes.Buffer)
		got     string
		want    string
	}{
		{name: "date", marshal: func(w *bytes.Buffer) { Date(" 2026-11-06 ").MarshalGQL(w) }, want: `"2026-11-06"`},
		{name: "email", marshal: func(w *bytes.Buffer) { Email(" READER@EXAMPLE.COM ").MarshalGQL(w) }, want: `"reader@example.com"`},
		{name: "locale", marshal: func(w *bytes.Buffer) { Locale(" TR ").MarshalGQL(w) }, want: `"tr"`},
		{name: "unknown locale defaults to English", marshal: func(w *bytes.Buffer) { Locale("fr").MarshalGQL(w) }, want: `"en"`},
		{name: "URL", marshal: func(w *bytes.Buffer) { URL(" https://example.com ").MarshalGQL(w) }, want: `"https://example.com"`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var output bytes.Buffer
			tt.marshal(&output)
			if output.String() != tt.want {
				t.Fatalf("MarshalGQL() = %q, want %q", output.String(), tt.want)
			}
		})
	}

	var date Date
	if err := date.UnmarshalGQL(" 2026-11-06 "); err != nil || date != "2026-11-06" {
		t.Fatalf("Date.UnmarshalGQL() = %q, %v", date, err)
	}
	var email Email
	if err := email.UnmarshalGQL(" READER@EXAMPLE.COM "); err != nil || email != "reader@example.com" {
		t.Fatalf("Email.UnmarshalGQL() = %q, %v", email, err)
	}
	var locale Locale
	if err := locale.UnmarshalGQL("TR"); err != nil || locale != "tr" {
		t.Fatalf("Locale.UnmarshalGQL() = %q, %v", locale, err)
	}
	var url URL
	if err := url.UnmarshalGQL("https://example.com"); err != nil || url != "https://example.com" {
		t.Fatalf("URL.UnmarshalGQL() = %q, %v", url, err)
	}
	if err := new(Date).UnmarshalGQL(1); err == nil {
		t.Fatal("Date.UnmarshalGQL() expected invalid input error")
	}
}
