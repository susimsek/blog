package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpauth"
)

type ReaderGoogleIdentity struct {
	Subject       string
	Email         string
	EmailVerified bool
	Name          string
	AvatarURL     string
}

type readerGoogleTokenResponse struct {
	AccessToken string `json:"access_token"`
}

func ResolveReaderGoogleIdentityFromCode(ctx context.Context, code, redirectURI string) (*ReaderGoogleIdentity, error) {
	config := appconfig.ResolveReaderGoogleConfig()
	if !config.Enabled() {
		return nil, apperrors.Config("google oauth is not configured", nil)
	}

	form := url.Values{}
	form.Set("code", strings.TrimSpace(code))
	form.Set("client_id", config.ClientID)
	form.Set("client_secret", config.ClientSecret)
	form.Set("redirect_uri", strings.TrimSpace(redirectURI))
	form.Set("grant_type", "authorization_code")

	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"https://oauth2.googleapis.com/token",
		strings.NewReader(form.Encode()),
	)
	if err != nil {
		return nil, apperrors.ServiceUnavailable("google login is unavailable", err)
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return nil, apperrors.ServiceUnavailable("google login is unavailable", err)
	}
	defer func() {
		_ = response.Body.Close()
	}()
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return nil, apperrors.ServiceUnavailable("google login is unavailable", nil)
	}

	var tokenPayload readerGoogleTokenResponse
	if err := json.NewDecoder(response.Body).Decode(&tokenPayload); err != nil || strings.TrimSpace(tokenPayload.AccessToken) == "" {
		return nil, apperrors.ServiceUnavailable("google login is unavailable", err)
	}

	userInfoRequest, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://openidconnect.googleapis.com/v1/userinfo",
		nil,
	)
	if err != nil {
		return nil, apperrors.ServiceUnavailable("google login is unavailable", err)
	}
	userInfoRequest.Header.Set("Authorization", "Bearer "+strings.TrimSpace(tokenPayload.AccessToken))

	userInfoResponse, err := http.DefaultClient.Do(userInfoRequest)
	if err != nil {
		return nil, apperrors.ServiceUnavailable("google login is unavailable", err)
	}
	defer func() {
		_ = userInfoResponse.Body.Close()
	}()
	if userInfoResponse.StatusCode < http.StatusOK || userInfoResponse.StatusCode >= http.StatusMultipleChoices {
		return nil, apperrors.ServiceUnavailable("google login is unavailable", nil)
	}

	var payload struct {
		Subject       string `json:"sub"`
		Email         string `json:"email"`
		EmailVerified bool   `json:"email_verified"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
	}
	if err := json.NewDecoder(userInfoResponse.Body).Decode(&payload); err != nil {
		return nil, apperrors.ServiceUnavailable("google login is unavailable", err)
	}

	identity := &ReaderGoogleIdentity{
		Subject:       strings.TrimSpace(payload.Subject),
		Email:         strings.TrimSpace(strings.ToLower(payload.Email)),
		EmailVerified: payload.EmailVerified,
		Name:          normalizeReaderDisplayName(payload.Name, payload.Email),
		AvatarURL:     sanitizeReaderAvatarURL(payload.Picture),
	}
	if identity.Subject == "" || identity.Email == "" || !identity.EmailVerified {
		return nil, apperrors.BadRequest("google account is invalid")
	}

	return identity, nil
}

func LoginReaderWithGoogleIdentity(
	ctx context.Context,
	identity *ReaderGoogleIdentity,
	rememberMe bool,
	metadata ReaderSessionMetadata,
) (*ReaderAuthResponse, error) {
	if identity == nil {
		return nil, apperrors.BadRequest("google account is invalid")
	}

	config := appconfig.ResolveReaderConfig()
	if strings.TrimSpace(config.JWTSecret) == "" {
		return nil, apperrors.Config("reader jwt is not configured", nil)
	}

	record, err := resolveReaderRecordForGoogle(ctx, identity)
	if err != nil {
		return nil, err
	}

	return issueReaderTokens(ctx, config, record, "", rememberMe, metadata)
}

func resolveReaderRecordForGoogle(ctx context.Context, identity *ReaderGoogleIdentity) (*domain.ReaderUserRecord, error) {
	subject := strings.TrimSpace(identity.Subject)
	email := strings.TrimSpace(strings.ToLower(identity.Email))
	name := normalizeReaderDisplayName(identity.Name, identity.Email)
	avatarURL := sanitizeReaderAvatarURL(identity.AvatarURL)
	now := time.Now().UTC()

	existingBySubject, err := readerUsersRepository.FindByGoogleSubject(ctx, subject)
	if err != nil {
		return nil, apperrors.Internal("failed to load reader account", err)
	}
	if existingBySubject != nil {
		if err := readerUsersRepository.UpdateGoogleIdentityByID(ctx, existingBySubject.ID, subject, email, name, avatarURL, now); err != nil {
			return nil, apperrors.Internal("failed to update reader account", err)
		}
		return readerUsersRepository.FindByID(ctx, existingBySubject.ID)
	}

	existingByEmail, err := readerUsersRepository.FindByEmail(ctx, email)
	if err != nil {
		return nil, apperrors.Internal("failed to load reader account", err)
	}
	if existingByEmail != nil {
		if err := readerUsersRepository.UpdateGoogleIdentityByID(ctx, existingByEmail.ID, subject, email, name, avatarURL, now); err != nil {
			return nil, apperrors.Internal("failed to update reader account", err)
		}
		return readerUsersRepository.FindByID(ctx, existingByEmail.ID)
	}

	readerID, err := httpauth.GenerateOpaqueToken(18)
	if err != nil {
		return nil, apperrors.Internal("failed to create reader account", err)
	}

	record := domain.ReaderUserRecord{
		ReaderUser: domain.ReaderUser{
			ID:                readerID,
			Name:              name,
			Email:             email,
			AvatarURL:         avatarURL,
			LastLoginProvider: "google",
			GoogleSubject:     subject,
			GoogleEmail:       email,
			GoogleLinkedAt:    &now,
		},
		SessionVersion: 1,
	}

	if err := readerUsersRepository.Create(ctx, record); err != nil {
		return nil, apperrors.Internal("failed to create reader account", err)
	}

	return readerUsersRepository.FindByID(ctx, readerID)
}
