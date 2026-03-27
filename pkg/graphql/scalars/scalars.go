package scalars

import (
	"errors"
	"fmt"
	"io"
	"net/mail"
	neturl "net/url"
	"strconv"
	"strings"
	"time"
)

const isoDateLayout = "2006-01-02"

type (
	Date   string
	Email  string
	Locale string
	URL    string
)

func normalizeStringInput(name string, value any) (string, error) {
	text, ok := value.(string)
	if !ok {
		return "", fmt.Errorf("%s must be a string", name)
	}

	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return "", fmt.Errorf("%s cannot be empty", name)
	}

	return trimmed, nil
}

func NormalizeDateValue(value any) (string, error) {
	text, err := normalizeStringInput("Date", value)
	if err != nil {
		return "", err
	}

	if _, err := time.Parse(isoDateLayout, text); err != nil {
		return "", fmt.Errorf("Date must match %s", isoDateLayout)
	}

	return text, nil
}

func NormalizeEmailValue(value any) (string, error) {
	text, err := normalizeStringInput("Email", value)
	if err != nil {
		return "", err
	}

	normalized := strings.ToLower(text)
	addr, err := mail.ParseAddress(normalized)
	if err != nil || addr.Address != normalized {
		return "", errors.New("Email must be a valid address")
	}

	return normalized, nil
}

func NormalizeLocaleValue(value any) (string, error) {
	text, err := normalizeStringInput("Locale", value)
	if err != nil {
		return "", err
	}

	switch strings.ToLower(text) {
	case "en", "tr":
		return strings.ToLower(text), nil
	default:
		return "", errors.New("Locale must be one of: en, tr")
	}
}

func NormalizeURLValue(value any) (string, error) {
	text, err := normalizeStringInput("URL", value)
	if err != nil {
		return "", err
	}

	if _, err := neturl.ParseRequestURI(text); err != nil {
		return "", errors.New("URL must be a valid URI")
	}

	return text, nil
}

func NormalizeDateOutput(value string) string {
	return strings.TrimSpace(value)
}

func NormalizeEmailOutput(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func NormalizeLocaleOutput(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "tr":
		return "tr"
	default:
		return "en"
	}
}

func NormalizeURLOutput(value string) string {
	return strings.TrimSpace(value)
}

func marshalString(w io.Writer, value string) {
	_, _ = io.WriteString(w, strconv.Quote(value))
}

func (value *Date) UnmarshalGQL(input any) error {
	normalized, err := NormalizeDateValue(input)
	if err != nil {
		return err
	}

	*value = Date(normalized)
	return nil
}

func (value Date) MarshalGQL(w io.Writer) {
	marshalString(w, NormalizeDateOutput(string(value)))
}

func (value *Email) UnmarshalGQL(input any) error {
	normalized, err := NormalizeEmailValue(input)
	if err != nil {
		return err
	}

	*value = Email(normalized)
	return nil
}

func (value Email) MarshalGQL(w io.Writer) {
	marshalString(w, NormalizeEmailOutput(string(value)))
}

func (value *Locale) UnmarshalGQL(input any) error {
	normalized, err := NormalizeLocaleValue(input)
	if err != nil {
		return err
	}

	*value = Locale(normalized)
	return nil
}

func (value Locale) MarshalGQL(w io.Writer) {
	marshalString(w, NormalizeLocaleOutput(string(value)))
}

func (value *URL) UnmarshalGQL(input any) error {
	normalized, err := NormalizeURLValue(input)
	if err != nil {
		return err
	}

	*value = URL(normalized)
	return nil
}

func (value URL) MarshalGQL(w io.Writer) {
	marshalString(w, NormalizeURLOutput(string(value)))
}
