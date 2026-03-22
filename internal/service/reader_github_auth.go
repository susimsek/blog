package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpauth"
)

type ReaderGithubIdentity struct {
	Subject       string
	Email         string
	EmailVerified bool
	Name          string
	AvatarURL     string
}

type readerGithubTokenResponse struct {
	AccessToken string `json:"access_token"`
}

type readerGithubUserPayload struct {
	ID        int64   `json:"id"`
	Login     string  `json:"login"`
	Name      *string `json:"name"`
	AvatarURL string  `json:"avatar_url"`
	Email     *string `json:"email"`
}

const (
	readerGithubUnavailableMessage = "github login is unavailable"
	readerGithubInvalidMessage     = "github account is invalid"
)

func ResolveReaderGithubIdentityFromCode(ctx context.Context, code, redirectURI string) (*ReaderGithubIdentity, error) {
	config := appconfig.ResolveReaderGithubConfig()
	if !config.Enabled() {
		return nil, apperrors.Config("github oauth is not configured", nil)
	}

	accessToken, err := exchangeReaderGithubAccessToken(ctx, config, code, redirectURI)
	if err != nil {
		return nil, err
	}

	userPayload, err := fetchReaderGithubUser(ctx, accessToken)
	if err != nil {
		return nil, err
	}
	if userPayload.ID <= 0 {
		return nil, apperrors.BadRequest(readerGithubInvalidMessage)
	}

	email := ""
	emailVerified := false
	if userPayload.Email != nil {
		email = strings.TrimSpace(strings.ToLower(*userPayload.Email))
	}

	if email == "" {
		email, emailVerified, err = fetchReaderGithubPrimaryEmail(ctx, accessToken)
		if err != nil {
			return nil, err
		}
	} else {
		emailVerified = true
	}

	name := userPayload.Login
	if userPayload.Name != nil && strings.TrimSpace(*userPayload.Name) != "" {
		name = *userPayload.Name
	}

	identity := &ReaderGithubIdentity{
		Subject:       strconv.FormatInt(userPayload.ID, 10),
		Email:         email,
		EmailVerified: emailVerified,
		Name:          normalizeReaderDisplayName(name, email),
		AvatarURL:     sanitizeReaderAvatarURL(userPayload.AvatarURL),
	}
	if identity.Subject == "" || identity.Email == "" || !identity.EmailVerified {
		return nil, apperrors.BadRequest(readerGithubInvalidMessage)
	}

	return identity, nil
}

func LoginReaderWithGithubIdentity(
	ctx context.Context,
	identity *ReaderGithubIdentity,
	rememberMe bool,
	metadata ReaderSessionMetadata,
) (*ReaderAuthResponse, error) {
	if identity == nil {
		return nil, apperrors.BadRequest(readerGithubInvalidMessage)
	}

	config := appconfig.ResolveReaderConfig()
	if strings.TrimSpace(config.JWTSecret) == "" {
		return nil, apperrors.Config("reader jwt is not configured", nil)
	}

	record, err := resolveReaderRecordForGithub(ctx, identity)
	if err != nil {
		return nil, err
	}

	return issueReaderTokens(ctx, config, record, "", rememberMe, metadata)
}

func resolveReaderRecordForGithub(ctx context.Context, identity *ReaderGithubIdentity) (*domain.ReaderUserRecord, error) {
	subject := strings.TrimSpace(identity.Subject)
	email := strings.TrimSpace(strings.ToLower(identity.Email))
	name := normalizeReaderDisplayName(identity.Name, identity.Email)
	avatarURL := sanitizeReaderAvatarURL(identity.AvatarURL)
	now := time.Now().UTC()

	existingBySubject, err := readerUsersRepository.FindByGithubSubject(ctx, subject)
	if err != nil {
		return nil, apperrors.Internal("failed to load reader account", err)
	}
	if existingBySubject != nil {
		if err := readerUsersRepository.UpdateGithubIdentityByID(ctx, existingBySubject.ID, subject, email, name, avatarURL, now); err != nil {
			return nil, apperrors.Internal("failed to update reader account", err)
		}
		return readerUsersRepository.FindByID(ctx, existingBySubject.ID)
	}

	existingByEmail, err := readerUsersRepository.FindByEmail(ctx, email)
	if err != nil {
		return nil, apperrors.Internal("failed to load reader account", err)
	}
	if existingByEmail != nil {
		if err := readerUsersRepository.UpdateGithubIdentityByID(ctx, existingByEmail.ID, subject, email, name, avatarURL, now); err != nil {
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
			LastLoginProvider: "github",
			GithubSubject:     subject,
			GithubEmail:       email,
			GithubLinkedAt:    &now,
		},
		SessionVersion: 1,
	}

	if err := readerUsersRepository.Create(ctx, record); err != nil {
		return nil, apperrors.Internal("failed to create reader account", err)
	}

	return readerUsersRepository.FindByID(ctx, readerID)
}

func sanitizeReaderAvatarURL(value string) string {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		return ""
	}
	parsed, err := url.Parse(resolved)
	if err != nil || (parsed.Scheme != "https" && parsed.Scheme != "http") || parsed.Host == "" {
		return ""
	}
	return resolved
}

func exchangeReaderGithubAccessToken(
	ctx context.Context,
	config appconfig.ReaderGithubConfig,
	code string,
	redirectURI string,
) (string, error) {
	form := url.Values{}
	form.Set("code", strings.TrimSpace(code))
	form.Set("client_id", config.ClientID)
	form.Set("client_secret", config.ClientSecret)
	form.Set("redirect_uri", strings.TrimSpace(redirectURI))

	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"https://github.com/login/oauth/access_token",
		strings.NewReader(form.Encode()),
	)
	if err != nil {
		return "", apperrors.ServiceUnavailable(readerGithubUnavailableMessage, err)
	}
	request.Header.Set("Accept", "application/json")
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	var payload readerGithubTokenResponse
	if err := executeReaderGithubJSONRequest(request, &payload); err != nil {
		return "", err
	}

	accessToken := strings.TrimSpace(payload.AccessToken)
	if accessToken == "" {
		return "", apperrors.ServiceUnavailable(readerGithubUnavailableMessage, nil)
	}

	return accessToken, nil
}

func fetchReaderGithubUser(ctx context.Context, accessToken string) (*readerGithubUserPayload, error) {
	request, err := newReaderGithubAPIRequest(ctx, "https://api.github.com/user", accessToken)
	if err != nil {
		return nil, err
	}

	var payload readerGithubUserPayload
	if err := executeReaderGithubJSONRequest(request, &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

func fetchReaderGithubPrimaryEmail(ctx context.Context, accessToken string) (string, bool, error) {
	request, err := newReaderGithubAPIRequest(ctx, "https://api.github.com/user/emails", accessToken)
	if err != nil {
		return "", false, err
	}

	var payload []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}
	if err := executeReaderGithubJSONRequest(request, &payload); err != nil {
		return "", false, err
	}

	for _, item := range payload {
		if item.Primary && item.Verified && strings.TrimSpace(item.Email) != "" {
			return strings.TrimSpace(strings.ToLower(item.Email)), true, nil
		}
	}

	return "", false, nil
}

func newReaderGithubAPIRequest(
	ctx context.Context,
	endpoint string,
	accessToken string,
) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, apperrors.ServiceUnavailable(readerGithubUnavailableMessage, err)
	}
	request.Header.Set("Accept", "application/vnd.github+json")
	request.Header.Set("Authorization", "Bearer "+strings.TrimSpace(accessToken))
	request.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	return request, nil
}

func executeReaderGithubJSONRequest(request *http.Request, target any) error {
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return apperrors.ServiceUnavailable(readerGithubUnavailableMessage, err)
	}
	defer func() {
		_ = response.Body.Close()
	}()
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return apperrors.ServiceUnavailable(readerGithubUnavailableMessage, nil)
	}
	if err := json.NewDecoder(response.Body).Decode(target); err != nil {
		return apperrors.ServiceUnavailable(readerGithubUnavailableMessage, err)
	}
	return nil
}
