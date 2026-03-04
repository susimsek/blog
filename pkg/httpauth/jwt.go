package httpauth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

type JWTClaims struct {
	ID              string   `json:"jti,omitempty"`
	Subject         string   `json:"sub"`
	Email           string   `json:"email,omitempty"`
	Roles           []string `json:"roles,omitempty"`
	PasswordVersion int64    `json:"pwdv,omitempty"`
	Type            string   `json:"typ"`
	Issuer          string   `json:"iss,omitempty"`
	Audience        string   `json:"aud,omitempty"`
	IssuedAt        int64    `json:"iat"`
	ExpiresAt       int64    `json:"exp"`
}

var (
	ErrInvalidJWT       = errors.New("invalid jwt")
	ErrExpiredJWT       = errors.New("expired jwt")
	ErrUnsupportedJWT   = errors.New("unsupported jwt")
	ErrMissingJWTSecret = errors.New("missing jwt secret")
)

func GenerateOpaqueToken(byteLength int) (string, error) {
	if byteLength <= 0 {
		byteLength = 32
	}

	buffer := make([]byte, byteLength)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(buffer), nil
}

func IssueHS256JWT(claims JWTClaims, secret string) (string, error) {
	if strings.TrimSpace(secret) == "" {
		return "", ErrMissingJWTSecret
	}

	headerJSON, err := json.Marshal(map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	})
	if err != nil {
		return "", err
	}

	payloadJSON, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	headerSegment := base64.RawURLEncoding.EncodeToString(headerJSON)
	payloadSegment := base64.RawURLEncoding.EncodeToString(payloadJSON)
	signingInput := fmt.Sprintf("%s.%s", headerSegment, payloadSegment)

	return fmt.Sprintf("%s.%s", signingInput, signHS256(signingInput, secret)), nil
}

func VerifyHS256JWT(token, secret, expectedType string, now time.Time) (*JWTClaims, error) {
	if strings.TrimSpace(secret) == "" {
		return nil, ErrMissingJWTSecret
	}

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, ErrInvalidJWT
	}

	signingInput := fmt.Sprintf("%s.%s", parts[0], parts[1])
	expectedSignature := signHS256(signingInput, secret)
	if !hmac.Equal([]byte(expectedSignature), []byte(parts[2])) {
		return nil, ErrInvalidJWT
	}

	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, ErrInvalidJWT
	}

	var header struct {
		Algorithm string `json:"alg"`
		Type      string `json:"typ"`
	}
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return nil, ErrInvalidJWT
	}
	if header.Algorithm != "HS256" || header.Type != "JWT" {
		return nil, ErrUnsupportedJWT
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, ErrInvalidJWT
	}

	var claims JWTClaims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, ErrInvalidJWT
	}
	if expectedType != "" && claims.Type != expectedType {
		return nil, ErrUnsupportedJWT
	}
	if claims.ExpiresAt <= now.UTC().Unix() {
		return nil, ErrExpiredJWT
	}
	if claims.Subject == "" {
		return nil, ErrInvalidJWT
	}

	return &claims, nil
}

func signHS256(signingInput, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(signingInput))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
