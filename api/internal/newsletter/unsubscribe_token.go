package newsletter

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net/mail"
	"strconv"
	"strings"
	"time"
)

func normalizeSubscriberEmail(value string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(value))
	parsed, err := mail.ParseAddress(email)
	if err != nil || parsed.Address != email {
		return "", fmt.Errorf("invalid email")
	}
	return email, nil
}

func BuildUnsubscribeToken(email, secret string, now time.Time, ttl time.Duration) (string, error) {
	if strings.TrimSpace(secret) == "" {
		return "", fmt.Errorf("missing secret")
	}
	if ttl <= 0 {
		return "", fmt.Errorf("invalid ttl")
	}

	normalizedEmail, err := normalizeSubscriberEmail(email)
	if err != nil {
		return "", err
	}

	exp := now.UTC().Add(ttl).Unix()
	encodedEmail := base64.RawURLEncoding.EncodeToString([]byte(normalizedEmail))
	expString := strconv.FormatInt(exp, 10)
	payload := encodedEmail + "." + expString

	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	signature := hex.EncodeToString(mac.Sum(nil))

	return payload + "." + signature, nil
}

func ParseUnsubscribeToken(token, secret string, now time.Time) (string, error) {
	if strings.TrimSpace(secret) == "" {
		return "", fmt.Errorf("missing secret")
	}

	parts := strings.Split(strings.TrimSpace(token), ".")
	if len(parts) != 3 {
		return "", fmt.Errorf("invalid token")
	}

	encodedEmail := parts[0]
	expString := parts[1]
	providedSignatureHex := parts[2]
	payload := encodedEmail + "." + expString

	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	expectedSignature := mac.Sum(nil)

	providedSignature, err := hex.DecodeString(providedSignatureHex)
	if err != nil {
		return "", fmt.Errorf("invalid token signature")
	}

	if !hmac.Equal(providedSignature, expectedSignature) {
		return "", fmt.Errorf("invalid token signature")
	}

	expUnix, err := strconv.ParseInt(expString, 10, 64)
	if err != nil {
		return "", fmt.Errorf("invalid token expiration")
	}
	if now.UTC().Unix() > expUnix {
		return "", fmt.Errorf("token expired")
	}

	rawEmail, err := base64.RawURLEncoding.DecodeString(encodedEmail)
	if err != nil {
		return "", fmt.Errorf("invalid token payload")
	}

	return normalizeSubscriberEmail(string(rawEmail))
}
