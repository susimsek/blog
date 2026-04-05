package admingraphql

import (
	"context"
	"strings"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/graphql/admin/model"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	appscalars "suaybsimsek.com/blog-api/pkg/graphql/scalars"
)

// Dashboard is the resolver for the dashboard field.
func (*adminQueryResolver) Dashboard(ctx context.Context) (*model.AdminDashboard, error) {
	if _, err := requireAdminUser(ctx); err != nil {
		return nil, err
	}

	payload, err := queryAdminDashboardFn(ctx)
	if err != nil {
		return nil, err
	}

	return mapAdminDashboard(payload), nil
}

// ActiveSessions is the resolver for the activeSessions field.
func (*adminQueryResolver) ActiveSessions(ctx context.Context) ([]*model.AdminSession, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	sessions, err := listActiveAdminSessionsFn(ctx, adminUser)
	if err != nil {
		return nil, err
	}

	currentSessionID := resolveCurrentRefreshSessionID(ctx)
	return mapAdminSessions(sessions, currentSessionID), nil
}

// ChangeName is the resolver for the changeName field.
func (*adminMutationResolver) ChangeName(
	ctx context.Context,
	input model.AdminChangeNameInput,
) (*model.AdminAuthPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	updatedAdminUser, err := changeAdminNameFn(ctx, adminUser, input.Name)
	if err != nil {
		return nil, err
	}

	return &model.AdminAuthPayload{
		Success: true,
		User:    mapAdminUser(updatedAdminUser),
	}, nil
}

// ChangeAvatar is the resolver for the changeAvatar field.
func (*adminMutationResolver) ChangeAvatar(
	ctx context.Context,
	input model.AdminChangeAvatarInput,
) (*model.AdminAuthPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	updatedAdminUser, err := changeAdminAvatarFn(ctx, adminUser, urlPointerToStringPointer(input.AvatarURL))
	if err != nil {
		return nil, err
	}

	return &model.AdminAuthPayload{
		Success: true,
		User:    mapAdminUser(updatedAdminUser),
	}, nil
}

// ChangeUsername is the resolver for the changeUsername field.
func (*adminMutationResolver) ChangeUsername(
	ctx context.Context,
	input model.AdminChangeUsernameInput,
) (*model.AdminAuthPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	updatedAdminUser, err := changeAdminUsernameFn(ctx, adminUser, input.NewUsername)
	if err != nil {
		return nil, err
	}

	return &model.AdminAuthPayload{
		Success: true,
		User:    mapAdminUser(updatedAdminUser),
	}, nil
}

// RequestEmailChange is the resolver for the requestEmailChange field.
func (*adminMutationResolver) RequestEmailChange(
	ctx context.Context,
	input model.AdminRequestEmailChangeInput,
) (*model.AdminEmailChangeRequestPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	payload, err := requestAdminEmailChangeFn(
		ctx,
		adminUser,
		string(input.NewEmail),
		input.CurrentPassword,
		localePointerValue(input.Locale),
	)
	if err != nil {
		return nil, err
	}

	return &model.AdminEmailChangeRequestPayload{
		Success:      payload.Success,
		PendingEmail: appscalars.Email(payload.PendingEmail),
		ExpiresAt:    payload.ExpiresAt,
	}, nil
}

// DeleteAccount is the resolver for the deleteAccount field.
func (*adminMutationResolver) DeleteAccount(
	ctx context.Context,
	input model.AdminDeleteAccountInput,
) (*model.AdminAccountDeletePayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	if err := deleteAdminAccountFn(ctx, adminUser, input.CurrentPassword); err != nil {
		return nil, err
	}

	responseWriter := getResponseWriter(ctx)
	config := appconfig.ResolveAdminConfig()
	clearAdminSessionCookies(responseWriter, config)

	return &model.AdminAccountDeletePayload{Success: true}, nil
}

// ChangePassword is the resolver for the changePassword field.
func (*adminMutationResolver) ChangePassword(
	ctx context.Context,
	input model.AdminChangePasswordInput,
) (*model.AdminPasswordChangePayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	if err := changeAdminPasswordFn(
		ctx,
		adminUser,
		input.CurrentPassword,
		input.NewPassword,
		input.ConfirmPassword,
	); err != nil {
		return nil, err
	}

	responseWriter := getResponseWriter(ctx)
	config := appconfig.ResolveAdminConfig()
	clearAdminSessionCookies(responseWriter, config)

	return &model.AdminPasswordChangePayload{Success: true}, nil
}

// RevokeSession is the resolver for the revokeSession field.
func (*adminMutationResolver) RevokeSession(ctx context.Context, sessionID string) (*model.AdminSessionRevokePayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	revoked, err := revokeAdminSessionFn(ctx, adminUser, sessionID)
	if err != nil {
		return nil, err
	}
	if !revoked {
		return nil, apperrors.BadRequest("session not found")
	}

	if strings.TrimSpace(sessionID) == resolveCurrentRefreshSessionID(ctx) {
		clearAdminSessionCookies(getResponseWriter(ctx), appconfig.ResolveAdminConfig())
	}

	return &model.AdminSessionRevokePayload{Success: true}, nil
}

// RevokeAllSessions is the resolver for the revokeAllSessions field.
func (*adminMutationResolver) RevokeAllSessions(ctx context.Context) (*model.AdminSessionRevokePayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	if err := revokeAllAdminSessionsFn(ctx, adminUser); err != nil {
		return nil, err
	}

	clearAdminSessionCookies(getResponseWriter(ctx), appconfig.ResolveAdminConfig())
	return &model.AdminSessionRevokePayload{Success: true}, nil
}
