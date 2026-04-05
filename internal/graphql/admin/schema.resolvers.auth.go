package admingraphql

import (
	"context"
	"strings"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/graphql/admin/model"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	appscalars "suaybsimsek.com/blog-api/pkg/graphql/scalars"
	"suaybsimsek.com/blog-api/pkg/httpauth"
)

// Me is the resolver for the me field.
func (*adminQueryResolver) Me(ctx context.Context) (*model.AdminMe, error) {
	user := getAdminUser(ctx)
	if user == nil {
		return &model.AdminMe{Authenticated: false}, nil
	}

	return &model.AdminMe{
		Authenticated: true,
		User:          mapAdminUser(user),
	}, nil
}

// ValidatePasswordResetToken is the resolver for the validatePasswordResetToken field.
func (*adminQueryResolver) ValidatePasswordResetToken(
	ctx context.Context,
	token string,
	locale *appscalars.Locale,
) (*model.AdminPasswordResetValidationPayload, error) {
	result, err := validateAdminPasswordResetTokenFn(ctx, strings.TrimSpace(token), localePointerValue(locale))
	if err != nil {
		return nil, err
	}

	return &model.AdminPasswordResetValidationPayload{
		Status: strings.TrimSpace(result.Status),
		Locale: appscalars.Locale(appscalars.NormalizeLocaleOutput(result.Locale)),
	}, nil
}

// GoogleAuthStatus is the resolver for the googleAuthStatus field.
func (*adminQueryResolver) GoogleAuthStatus(ctx context.Context) (*model.AdminGoogleAuthStatus, error) {
	payload, err := queryAdminGoogleAuthStatusFn(ctx)
	if err != nil {
		return nil, err
	}

	if payload == nil {
		return &model.AdminGoogleAuthStatus{}, nil
	}

	return &model.AdminGoogleAuthStatus{
		Enabled:        payload.Enabled,
		LoginAvailable: payload.LoginAvailable,
	}, nil
}

// GithubAuthStatus is the resolver for the githubAuthStatus field.
func (*adminQueryResolver) GithubAuthStatus(ctx context.Context) (*model.AdminGithubAuthStatus, error) {
	payload, err := queryAdminGithubAuthStatusFn(ctx)
	if err != nil {
		return nil, err
	}

	if payload == nil {
		return &model.AdminGithubAuthStatus{}, nil
	}

	return &model.AdminGithubAuthStatus{
		Enabled:        payload.Enabled,
		LoginAvailable: payload.LoginAvailable,
	}, nil
}

// Login is the resolver for the login field.
func (*adminMutationResolver) Login(ctx context.Context, input model.AdminLoginInput) (*model.AdminAuthPayload, error) {
	rememberMe := input.RememberMe != nil && *input.RememberMe
	payload, err := loginAdminFn(
		ctx,
		strings.TrimSpace(string(input.Email)),
		input.Password,
		rememberMe,
		resolveAdminSessionMetadata(ctx, getRequest(ctx)),
	)
	if err != nil {
		return nil, err
	}

	responseWriter := getResponseWriter(ctx)
	config := appconfig.ResolveAdminConfig()
	httpauth.SetSessionCookie(
		responseWriter,
		config.AccessCookieName,
		payload.AccessToken,
		config.SecureCookies,
		"/",
	)
	setAdminRefreshCookie(responseWriter, config, payload)

	return &model.AdminAuthPayload{
		Success: payload.Success,
		User:    mapAdminUser(payload.User),
	}, nil
}

// StartGoogleConnect is the resolver for the startGoogleConnect field.
func (*adminMutationResolver) StartGoogleConnect(
	ctx context.Context,
	input model.AdminStartGoogleConnectInput,
) (*model.AdminGoogleConnectPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	payload, err := startAdminGoogleConnectFn(
		ctx,
		adminUser,
		localePointerValue(input.Locale),
	)
	if err != nil {
		return nil, err
	}

	return &model.AdminGoogleConnectPayload{URL: appscalars.URL(payload.URL)}, nil
}

// DisconnectGoogle is the resolver for the disconnectGoogle field.
func (*adminMutationResolver) DisconnectGoogle(ctx context.Context) (*model.AdminGoogleDisconnectPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	updatedUser, err := disconnectAdminGoogleAccountFn(ctx, adminUser)
	if err != nil {
		return nil, err
	}

	return &model.AdminGoogleDisconnectPayload{
		Success: true,
		User:    mapAdminUser(updatedUser),
	}, nil
}

// StartGithubConnect is the resolver for the startGithubConnect field.
func (*adminMutationResolver) StartGithubConnect(
	ctx context.Context,
	input model.AdminStartGithubConnectInput,
) (*model.AdminGithubConnectPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	payload, err := startAdminGithubConnectFn(
		ctx,
		adminUser,
		localePointerValue(input.Locale),
	)
	if err != nil {
		return nil, err
	}

	return &model.AdminGithubConnectPayload{URL: appscalars.URL(payload.URL)}, nil
}

// DisconnectGithub is the resolver for the disconnectGithub field.
func (*adminMutationResolver) DisconnectGithub(ctx context.Context) (*model.AdminGithubDisconnectPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	updatedUser, err := disconnectAdminGithubAccountFn(ctx, adminUser)
	if err != nil {
		return nil, err
	}

	return &model.AdminGithubDisconnectPayload{
		Success: true,
		User:    mapAdminUser(updatedUser),
	}, nil
}

// RefreshAdminSession is the resolver for the refreshAdminSession field.
func (*adminMutationResolver) RefreshAdminSession(ctx context.Context) (*model.AdminAuthPayload, error) {
	request := getRequest(ctx)
	if request == nil {
		return nil, apperrors.Config("missing admin request context", nil)
	}

	config := appconfig.ResolveAdminConfig()
	refreshCookie, err := request.Cookie(config.RefreshCookieName)
	if err != nil {
		return nil, apperrors.Unauthorized("invalid admin session")
	}

	payload, err := refreshAdminSessionFn(
		ctx,
		strings.TrimSpace(refreshCookie.Value),
		resolveAdminSessionMetadata(ctx, request),
	)
	if err != nil {
		return nil, err
	}

	responseWriter := getResponseWriter(ctx)
	httpauth.SetSessionCookie(
		responseWriter,
		config.AccessCookieName,
		payload.AccessToken,
		config.SecureCookies,
		"/",
	)
	setAdminRefreshCookie(responseWriter, config, payload)

	return &model.AdminAuthPayload{
		Success: payload.Success,
		User:    mapAdminUser(payload.User),
	}, nil
}

// Logout is the resolver for the logout field.
func (*adminMutationResolver) Logout(ctx context.Context) (*model.AdminLogoutPayload, error) {
	request := getRequest(ctx)
	responseWriter := getResponseWriter(ctx)
	config := appconfig.ResolveAdminConfig()
	if request != nil {
		if refreshCookie, err := request.Cookie(config.RefreshCookieName); err == nil {
			if err := logoutAdminFn(ctx, strings.TrimSpace(refreshCookie.Value)); err != nil {
				return nil, err
			}
		}
	}
	clearAdminSessionCookies(responseWriter, config)

	return &model.AdminLogoutPayload{Success: true}, nil
}

// RequestPasswordReset is the resolver for the requestPasswordReset field.
func (*adminMutationResolver) RequestPasswordReset(
	ctx context.Context,
	input model.AdminRequestPasswordResetInput,
) (*model.AdminPasswordResetRequestPayload, error) {
	if err := requestAdminPasswordResetFn(ctx, string(input.Email), localePointerValue(input.Locale)); err != nil {
		return nil, err
	}

	return &model.AdminPasswordResetRequestPayload{Success: true}, nil
}

// ConfirmEmailChange is the resolver for the confirmEmailChange field.
func (*adminMutationResolver) ConfirmEmailChange(
	ctx context.Context,
	token string,
	locale *appscalars.Locale,
) (*model.AdminEmailChangeConfirmPayload, error) {
	result, err := confirmAdminEmailChangeFn(ctx, strings.TrimSpace(token), localePointerValue(locale))
	if err != nil {
		return nil, err
	}

	return &model.AdminEmailChangeConfirmPayload{
		Status: strings.TrimSpace(result.Status),
		Locale: appscalars.Locale(appscalars.NormalizeLocaleOutput(result.Locale)),
	}, nil
}

// ConfirmPasswordReset is the resolver for the confirmPasswordReset field.
func (*adminMutationResolver) ConfirmPasswordReset(
	ctx context.Context,
	input model.AdminConfirmPasswordResetInput,
) (*model.AdminPasswordResetConfirmPayload, error) {
	result, err := resetAdminPasswordWithTokenFn(
		ctx,
		strings.TrimSpace(input.Token),
		input.NewPassword,
		input.ConfirmPassword,
		localePointerValue(input.Locale),
	)
	if err != nil {
		return nil, err
	}

	return &model.AdminPasswordResetConfirmPayload{
		Success: result.Success,
		Locale:  appscalars.Locale(appscalars.NormalizeLocaleOutput(result.Locale)),
	}, nil
}
