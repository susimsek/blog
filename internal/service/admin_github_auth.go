package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
)

type AdminGithubAuthStatusResult struct {
	Enabled        bool
	LoginAvailable bool
}

type AdminGithubIdentity struct {
	Subject       string
	Email         string
	EmailVerified bool
}

type AdminGithubConnectResult struct {
	URL string
}

type githubTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	Scope       string `json:"scope"`
}

type githubUserResponse struct {
	ID    int64   `json:"id"`
	Email *string `json:"email"`
}

type githubUserEmailResponse struct {
	Email      string `json:"email"`
	Primary    bool   `json:"primary"`
	Verified   bool   `json:"verified"`
	Visibility string `json:"visibility"`
}

var (
	resolveGithubConfigFn             = appconfig.ResolveAdminGithubConfig
	exchangeGithubAuthorizationCodeFn = exchangeGithubAuthorizationCode
	fetchGithubUserInfoFn             = fetchGithubUserInfo
)

func QueryAdminGithubAuthStatus(ctx context.Context) (*AdminGithubAuthStatusResult, error) {
	config := resolveGithubConfigFn()
	if !config.Enabled() {
		return &AdminGithubAuthStatusResult{}, nil
	}

	hasLink, err := adminUsersRepository.HasAnyGithubLink(ctx)
	if err != nil {
		return nil, apperrors.Internal("failed to load github auth status", err)
	}

	return &AdminGithubAuthStatusResult{
		Enabled:        true,
		LoginAvailable: hasLink,
	}, nil
}

func ResolveAdminGithubIdentityFromCode(
	ctx context.Context,
	code string,
	redirectURI string,
) (*AdminGithubIdentity, error) {
	config := resolveGithubConfigFn()
	if !config.Enabled() {
		return nil, apperrors.Config("github oauth is not configured", nil)
	}

	token, err := exchangeGithubAuthorizationCodeFn(ctx, config, strings.TrimSpace(code), strings.TrimSpace(redirectURI))
	if err != nil {
		return nil, apperrors.ServiceUnavailable("github login is unavailable", err)
	}

	identity, err := fetchGithubUserInfoFn(ctx, strings.TrimSpace(token.AccessToken))
	if err != nil {
		return nil, apperrors.ServiceUnavailable("github login is unavailable", err)
	}

	identity.Subject = strings.TrimSpace(identity.Subject)
	identity.Email = strings.TrimSpace(strings.ToLower(identity.Email))
	if identity.Subject == "" || identity.Email == "" {
		return nil, apperrors.BadRequest("github account is invalid")
	}
	if !identity.EmailVerified {
		return nil, apperrors.BadRequest("github account email is not verified")
	}

	return identity, nil
}

func LinkAdminGithubAccount(
	ctx context.Context,
	adminUserID string,
	identity *AdminGithubIdentity,
) (*domain.AdminUser, error) {
	resolvedAdminUserID := strings.TrimSpace(adminUserID)
	if resolvedAdminUserID == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}
	if identity == nil {
		return nil, apperrors.BadRequest("github account is invalid")
	}

	userRecord, err := adminUsersRepository.FindByID(ctx, resolvedAdminUserID)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	resolvedSubject := strings.TrimSpace(identity.Subject)
	resolvedEmail := strings.TrimSpace(strings.ToLower(identity.Email))
	if resolvedSubject == "" || resolvedEmail == "" {
		return nil, apperrors.BadRequest("github account is invalid")
	}

	if strings.TrimSpace(userRecord.GithubSubject) != "" && strings.TrimSpace(userRecord.GithubSubject) != resolvedSubject {
		return nil, apperrors.BadRequest("disconnect the current github account before linking a different one")
	}

	matchedUser, err := adminUsersRepository.FindByGithubSubject(ctx, resolvedSubject)
	if err != nil {
		return nil, apperrors.Internal("failed to load github account link", err)
	}
	if matchedUser != nil && strings.TrimSpace(matchedUser.ID) != resolvedAdminUserID {
		return nil, apperrors.BadRequest("github account is already linked to another admin")
	}

	linkedAt := nowUTCFn()
	if err := adminUsersRepository.UpdateGithubLinkByID(ctx, resolvedAdminUserID, resolvedSubject, resolvedEmail, linkedAt); err != nil {
		if errors.Is(err, repository.ErrAdminGithubAlreadyExists) {
			return nil, apperrors.BadRequest("github account is already linked to another admin")
		}
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Unauthorized("admin authentication required")
		}
		return nil, apperrors.Internal("failed to link github account", err)
	}

	updatedRecord, err := adminUsersRepository.FindByID(ctx, resolvedAdminUserID)
	if err != nil {
		return nil, apperrors.Internal("failed to reload admin user", err)
	}
	if updatedRecord == nil {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	return &updatedRecord.AdminUser, nil
}

func StartAdminGithubConnect(
	ctx context.Context,
	adminUser *domain.AdminUser,
	locale string,
) (*AdminGithubConnectResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	if !resolveGithubConfigFn().Enabled() {
		return nil, apperrors.Config("github oauth is not configured", nil)
	}

	return &AdminGithubConnectResult{
		URL: "/api/admin-github/connect?intent=connect&locale=" + url.QueryEscape(strings.TrimSpace(locale)),
	}, nil
}

func DisconnectAdminGithubAccount(
	ctx context.Context,
	adminUser *domain.AdminUser,
) (*domain.AdminUser, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	userRecord, err := adminUsersRepository.FindByID(ctx, adminUser.ID)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized("admin authentication required")
	}
	if strings.TrimSpace(userRecord.GithubSubject) == "" {
		return nil, apperrors.BadRequest("github account is not linked")
	}

	if err := adminUsersRepository.ClearGithubLinkByID(ctx, userRecord.ID); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Unauthorized("admin authentication required")
		}
		return nil, apperrors.Internal("failed to disconnect github account", err)
	}

	updatedRecord, err := adminUsersRepository.FindByID(ctx, userRecord.ID)
	if err != nil {
		return nil, apperrors.Internal("failed to reload admin user", err)
	}
	if updatedRecord == nil {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	return &updatedRecord.AdminUser, nil
}

func LoginAdminWithGithubSubject(
	ctx context.Context,
	subject string,
	rememberMe bool,
	metadata AdminSessionMetadata,
) (*AdminAuthResponse, error) {
	config := appconfig.ResolveAdminConfig()
	if strings.TrimSpace(config.JWTSecret) == "" {
		return nil, apperrors.Config("admin jwt is not configured", nil)
	}

	userRecord, err := adminUsersRepository.FindByGithubSubject(ctx, strings.TrimSpace(subject))
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized("invalid credentials")
	}

	return issueAdminTokens(ctx, config, userRecord, "", rememberMe, metadata)
}

func exchangeGithubAuthorizationCode(
	ctx context.Context,
	config appconfig.AdminGithubConfig,
	code string,
	redirectURI string,
) (*githubTokenResponse, error) {
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
		return nil, err
	}
	request.Header.Set("Accept", "application/json")
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = response.Body.Close()
	}()

	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return nil, errors.New("github token exchange failed")
	}

	var payload githubTokenResponse
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return nil, err
	}
	if strings.TrimSpace(payload.AccessToken) == "" {
		return nil, errors.New("github token response missing access token")
	}

	return &payload, nil
}

func fetchGithubUserInfo(ctx context.Context, accessToken string) (*AdminGithubIdentity, error) {
	userRequest, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.github.com/user", nil)
	if err != nil {
		return nil, err
	}
	userRequest.Header.Set("Accept", "application/vnd.github+json")
	userRequest.Header.Set("Authorization", "Bearer "+strings.TrimSpace(accessToken))
	userRequest.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	userResponse, err := http.DefaultClient.Do(userRequest)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = userResponse.Body.Close()
	}()

	if userResponse.StatusCode < http.StatusOK || userResponse.StatusCode >= http.StatusMultipleChoices {
		return nil, errors.New("github user info request failed")
	}

	var userPayload githubUserResponse
	if err := json.NewDecoder(userResponse.Body).Decode(&userPayload); err != nil {
		return nil, err
	}
	if userPayload.ID <= 0 {
		return nil, errors.New("github account is invalid")
	}

	emailRequest, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.github.com/user/emails", nil)
	if err != nil {
		return nil, err
	}
	emailRequest.Header.Set("Accept", "application/vnd.github+json")
	emailRequest.Header.Set("Authorization", "Bearer "+strings.TrimSpace(accessToken))
	emailRequest.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	emailResponse, err := http.DefaultClient.Do(emailRequest)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = emailResponse.Body.Close()
	}()

	if emailResponse.StatusCode < http.StatusOK || emailResponse.StatusCode >= http.StatusMultipleChoices {
		return nil, errors.New("github user emails request failed")
	}

	var emailPayload []githubUserEmailResponse
	if err := json.NewDecoder(emailResponse.Body).Decode(&emailPayload); err != nil {
		return nil, err
	}

	resolvedEmail := resolveGithubVerifiedEmail(emailPayload)
	if resolvedEmail == "" && userPayload.Email != nil {
		resolvedEmail = strings.TrimSpace(strings.ToLower(*userPayload.Email))
	}

	return &AdminGithubIdentity{
		Subject:       strconv.FormatInt(userPayload.ID, 10),
		Email:         resolvedEmail,
		EmailVerified: resolvedEmail != "",
	}, nil
}

func resolveGithubVerifiedEmail(emails []githubUserEmailResponse) string {
	for _, item := range emails {
		if !item.Verified {
			continue
		}
		if item.Primary {
			return strings.TrimSpace(strings.ToLower(item.Email))
		}
	}

	for _, item := range emails {
		if item.Verified {
			return strings.TrimSpace(strings.ToLower(item.Email))
		}
	}

	return ""
}
