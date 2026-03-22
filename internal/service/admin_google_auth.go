package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
)

type AdminGoogleAuthStatusResult struct {
	Enabled        bool
	LoginAvailable bool
}

type AdminGoogleIdentity struct {
	Subject       string
	Email         string
	EmailVerified bool
}

type AdminGoogleConnectResult struct {
	URL string
}

type googleTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
}

const adminGoogleInvalidMessage = "google account is invalid"

var (
	resolveGoogleConfigFn             = appconfig.ResolveAdminGoogleConfig
	exchangeGoogleAuthorizationCodeFn = exchangeGoogleAuthorizationCode
	fetchGoogleUserInfoFn             = fetchGoogleUserInfo
)

func QueryAdminGoogleAuthStatus(ctx context.Context) (*AdminGoogleAuthStatusResult, error) {
	config := resolveGoogleConfigFn()
	if !config.Enabled() {
		return &AdminGoogleAuthStatusResult{}, nil
	}

	hasLink, err := adminUsersRepository.HasAnyGoogleLink(ctx)
	if err != nil {
		return nil, apperrors.Internal("failed to load google auth status", err)
	}

	return &AdminGoogleAuthStatusResult{
		Enabled:        true,
		LoginAvailable: hasLink,
	}, nil
}

func ResolveAdminGoogleIdentityFromCode(
	ctx context.Context,
	code string,
	redirectURI string,
) (*AdminGoogleIdentity, error) {
	config := resolveGoogleConfigFn()
	if !config.Enabled() {
		return nil, apperrors.Config("google oauth is not configured", nil)
	}

	token, err := exchangeGoogleAuthorizationCodeFn(ctx, config, strings.TrimSpace(code), strings.TrimSpace(redirectURI))
	if err != nil {
		return nil, apperrors.ServiceUnavailable("google login is unavailable", err)
	}

	identity, err := fetchGoogleUserInfoFn(ctx, strings.TrimSpace(token.AccessToken))
	if err != nil {
		return nil, apperrors.ServiceUnavailable("google login is unavailable", err)
	}

	identity.Subject = strings.TrimSpace(identity.Subject)
	identity.Email = strings.TrimSpace(strings.ToLower(identity.Email))
	if identity.Subject == "" || identity.Email == "" {
		return nil, apperrors.BadRequest(adminGoogleInvalidMessage)
	}
	if !identity.EmailVerified {
		return nil, apperrors.BadRequest("google account email is not verified")
	}

	return identity, nil
}

func LinkAdminGoogleAccount(
	ctx context.Context,
	adminUserID string,
	identity *AdminGoogleIdentity,
) (*domain.AdminUser, error) {
	resolvedAdminUserID := strings.TrimSpace(adminUserID)
	if resolvedAdminUserID == "" {
		return nil, apperrors.Unauthorized(adminAuthRequiredMessage)
	}

	userRecord, err := loadAdminUserRecord(ctx, resolvedAdminUserID)
	if err != nil {
		return nil, err
	}

	resolvedSubject, resolvedEmail, err := normalizeAdminGoogleIdentity(identity)
	if err != nil {
		return nil, err
	}
	if err := ensureAdminGoogleAccountLinkable(ctx, userRecord, resolvedAdminUserID, resolvedSubject); err != nil {
		return nil, err
	}

	linkedAt := nowUTCFn()
	if err := adminUsersRepository.UpdateGoogleLinkByID(ctx, resolvedAdminUserID, resolvedSubject, resolvedEmail, linkedAt); err != nil {
		if errors.Is(err, repository.ErrAdminGoogleAlreadyExists) {
			return nil, apperrors.BadRequest("google account is already linked to another admin")
		}
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Unauthorized(adminAuthRequiredMessage)
		}
		return nil, apperrors.Internal("failed to link google account", err)
	}

	return reloadAdminUser(ctx, resolvedAdminUserID)
}

func StartAdminGoogleConnect(
	ctx context.Context,
	adminUser *domain.AdminUser,
	locale string,
) (*AdminGoogleConnectResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminAuthRequiredMessage)
	}

	if !resolveGoogleConfigFn().Enabled() {
		return nil, apperrors.Config("google oauth is not configured", nil)
	}

	return &AdminGoogleConnectResult{
		URL: "/api/google/connect?flow=admin&intent=connect&locale=" + url.QueryEscape(strings.TrimSpace(locale)),
	}, nil
}

func DisconnectAdminGoogleAccount(
	ctx context.Context,
	adminUser *domain.AdminUser,
) (*domain.AdminUser, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminAuthRequiredMessage)
	}

	userRecord, err := loadAdminUserRecord(ctx, adminUser.ID)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(userRecord.GoogleSubject) == "" {
		return nil, apperrors.BadRequest("google account is not linked")
	}

	if err := adminUsersRepository.ClearGoogleLinkByID(ctx, userRecord.ID); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Unauthorized(adminAuthRequiredMessage)
		}
		return nil, apperrors.Internal("failed to disconnect google account", err)
	}

	return reloadAdminUser(ctx, userRecord.ID)
}

func LoginAdminWithGoogleSubject(
	ctx context.Context,
	subject string,
	rememberMe bool,
	metadata AdminSessionMetadata,
) (*AdminAuthResponse, error) {
	config := appconfig.ResolveAdminConfig()
	if strings.TrimSpace(config.JWTSecret) == "" {
		return nil, apperrors.Config("admin jwt is not configured", nil)
	}

	userRecord, err := adminUsersRepository.FindByGoogleSubject(ctx, strings.TrimSpace(subject))
	if err != nil {
		return nil, apperrors.Internal(adminLoadAdminUserMessage, err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized("invalid credentials")
	}

	return issueAdminTokens(ctx, config, userRecord, "", rememberMe, metadata)
}

func exchangeGoogleAuthorizationCode(
	ctx context.Context,
	config appconfig.AdminGoogleConfig,
	code string,
	redirectURI string,
) (*googleTokenResponse, error) {
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
		return nil, err
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = response.Body.Close()
	}()

	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return nil, errors.New("google token exchange failed")
	}

	var payload googleTokenResponse
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return nil, err
	}
	if strings.TrimSpace(payload.AccessToken) == "" {
		return nil, errors.New("google token response missing access token")
	}

	return &payload, nil
}

func fetchGoogleUserInfo(ctx context.Context, accessToken string) (*AdminGoogleIdentity, error) {
	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://openidconnect.googleapis.com/v1/userinfo",
		nil,
	)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Authorization", "Bearer "+strings.TrimSpace(accessToken))

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = response.Body.Close()
	}()

	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return nil, errors.New("google userinfo request failed")
	}

	var payload struct {
		Subject       string `json:"sub"`
		Email         string `json:"email"`
		EmailVerified bool   `json:"email_verified"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return nil, err
	}

	return &AdminGoogleIdentity{
		Subject:       payload.Subject,
		Email:         payload.Email,
		EmailVerified: payload.EmailVerified,
	}, nil
}

func normalizeAdminGoogleIdentity(identity *AdminGoogleIdentity) (string, string, error) {
	if identity == nil {
		return "", "", apperrors.BadRequest(adminGoogleInvalidMessage)
	}

	resolvedSubject := strings.TrimSpace(identity.Subject)
	resolvedEmail := strings.TrimSpace(strings.ToLower(identity.Email))
	if resolvedSubject == "" || resolvedEmail == "" {
		return "", "", apperrors.BadRequest(adminGoogleInvalidMessage)
	}

	return resolvedSubject, resolvedEmail, nil
}

func ensureAdminGoogleAccountLinkable(
	ctx context.Context,
	userRecord *domain.AdminUserRecord,
	resolvedAdminUserID string,
	resolvedSubject string,
) error {
	if strings.TrimSpace(userRecord.GoogleSubject) != "" && strings.TrimSpace(userRecord.GoogleSubject) != resolvedSubject {
		return apperrors.BadRequest("disconnect the current google account before linking a different one")
	}

	matchedUser, err := adminUsersRepository.FindByGoogleSubject(ctx, resolvedSubject)
	if err != nil {
		return apperrors.Internal("failed to load google account link", err)
	}
	if matchedUser != nil && strings.TrimSpace(matchedUser.ID) != resolvedAdminUserID {
		return apperrors.BadRequest("google account is already linked to another admin")
	}

	return nil
}
