package service

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	adminmailpkg "suaybsimsek.com/blog-api/pkg/adminmail"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	newsletterpkg "suaybsimsek.com/blog-api/pkg/newsletter"

	"golang.org/x/crypto/bcrypt"
)

func RequestAdminPasswordReset(ctx context.Context, email, locale string) error {
	resolvedEmail, err := newsletterpkg.NormalizeSubscriberEmail(email)
	if err != nil {
		return apperrors.New(
			"ADMIN_PASSWORD_RESET_EMAIL_INVALID",
			"email address is invalid",
			400,
			nil,
		)
	}

	userRecord, err := adminUsersRepository.FindByEmail(ctx, resolvedEmail)
	if err != nil {
		return apperrors.Internal(adminLoadAdminUserMessage, err)
	}
	if userRecord == nil {
		return nil
	}

	siteURL, err := resolveSiteURLFn()
	if err != nil {
		return apperrors.Config("admin password reset site url is not configured", err)
	}

	mailCfg, err := resolveMailConfigFn()
	if err != nil {
		return apperrors.Config("admin password reset mail transport is not configured", err)
	}

	token, err := generateConfirmTokenFn()
	if err != nil {
		return apperrors.Internal("failed to issue admin password reset token", err)
	}

	now := nowUTCFn()
	expiresAt := now.Add(adminPasswordResetTTL)
	resolvedLocale := newsletterpkg.ResolveLocale(locale, "")
	resetURL, err := buildAdminPasswordResetURL(siteURL, token, resolvedLocale)
	if err != nil {
		return apperrors.Config("admin password reset url is invalid", err)
	}

	pending := domain.AdminPendingPasswordReset{
		TokenHash:   hashValue(token),
		Locale:      resolvedLocale,
		RequestedAt: now,
		ExpiresAt:   expiresAt,
	}

	if err := adminUsersRepository.SetPendingPasswordResetByID(ctx, userRecord.ID, pending); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return nil
		}
		return apperrors.Internal("failed to store admin password reset request", err)
	}

	if err := sendAdminPasswordResetEmailFn(mailCfg, resolvedEmail, resetURL, resolvedLocale, siteURL); err != nil {
		_ = adminUsersRepository.ClearPendingPasswordResetByID(ctx, userRecord.ID)
		return apperrors.ServiceUnavailable("failed to send admin password reset email", err)
	}

	return nil
}

func ValidateAdminPasswordResetToken(
	ctx context.Context,
	token string,
	localeHint string,
) (*AdminPasswordResetValidationResult, error) {
	resolvedToken := strings.TrimSpace(token)
	resolvedLocale := newsletterpkg.ResolveLocale(localeHint, "")
	if resolvedToken == "" {
		return &AdminPasswordResetValidationResult{
			Status: string(adminmailpkg.StatusInvalidLink),
			Locale: resolvedLocale,
		}, nil
	}

	userRecord, err := adminUsersRepository.FindByPendingPasswordResetTokenHash(ctx, hashValue(resolvedToken))
	if err != nil {
		return nil, apperrors.Internal("failed to load admin password reset request", err)
	}
	if userRecord == nil || userRecord.PendingPasswordReset == nil {
		return &AdminPasswordResetValidationResult{
			Status: string(adminmailpkg.StatusInvalidLink),
			Locale: resolvedLocale,
		}, nil
	}

	pending := userRecord.PendingPasswordReset
	if pending.Locale != "" {
		resolvedLocale = newsletterpkg.ResolveLocale(pending.Locale, "")
	}

	now := nowUTCFn()
	if now.After(pending.ExpiresAt) {
		if clearErr := adminUsersRepository.ClearPendingPasswordResetByID(ctx, userRecord.ID); clearErr != nil &&
			!errors.Is(clearErr, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Internal("failed to clear expired admin password reset request", clearErr)
		}
		return &AdminPasswordResetValidationResult{
			Status: string(adminmailpkg.StatusExpired),
			Locale: resolvedLocale,
		}, nil
	}

	return &AdminPasswordResetValidationResult{
		Status: string(adminmailpkg.StatusSuccess),
		Locale: resolvedLocale,
	}, nil
}

func ResetAdminPasswordWithToken(
	ctx context.Context,
	token string,
	newPassword string,
	confirmPassword string,
	localeHint string,
) (*AdminPasswordResetResult, error) {
	resolvedToken := strings.TrimSpace(token)
	if resolvedToken == "" {
		return nil, apperrors.New(
			"ADMIN_PASSWORD_RESET_TOKEN_REQUIRED",
			"password reset token is required",
			400,
			nil,
		)
	}

	validation, err := ValidateAdminPasswordResetToken(ctx, resolvedToken, localeHint)
	if err != nil {
		return nil, err
	}
	if validation == nil || validation.Status == string(adminmailpkg.StatusInvalidLink) {
		return nil, newAdminPasswordResetTokenInvalidError()
	}
	if validation.Status == string(adminmailpkg.StatusExpired) {
		return nil, apperrors.New(
			"ADMIN_PASSWORD_RESET_TOKEN_EXPIRED",
			"password reset token has expired",
			400,
			nil,
		)
	}

	if err := validateAdminPasswordResetPassword(newPassword, confirmPassword); err != nil {
		return nil, err
	}

	userRecord, err := loadAdminPasswordResetUserRecord(ctx, resolvedToken)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin password reset request", err)
	}
	if userRecord == nil {
		return nil, newAdminPasswordResetTokenInvalidError()
	}

	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, apperrors.Internal("failed to hash admin password", err)
	}

	if err := adminUsersRepository.UpdatePasswordHashByID(ctx, userRecord.ID, string(passwordHashBytes)); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return nil, newAdminPasswordResetTokenInvalidError()
		}
		return nil, apperrors.Internal("failed to update admin password", err)
	}

	if err := adminRefreshTokensRepository.RevokeAllByUserID(ctx, userRecord.ID, nowUTCFn()); err != nil {
		return nil, toAdminSessionError(err)
	}

	return &AdminPasswordResetResult{
		Success: true,
		Locale:  validation.Locale,
	}, nil
}

func newAdminPasswordResetTokenInvalidError() error {
	return apperrors.New(
		"ADMIN_PASSWORD_RESET_TOKEN_INVALID",
		adminPasswordResetTokenInvalidMessage,
		400,
		nil,
	)
}

func validateAdminPasswordResetPassword(
	newPassword, confirmPassword string,
) error {
	resolvedPassword := strings.TrimSpace(newPassword)
	if resolvedPassword == "" {
		return apperrors.New(
			"ADMIN_PASSWORD_RESET_PASSWORD_REQUIRED",
			"new password is required",
			400,
			nil,
		)
	}
	if len(resolvedPassword) < minAdminPasswordLength {
		return apperrors.New(
			"ADMIN_PASSWORD_RESET_PASSWORD_TOO_SHORT",
			"new password must be at least 8 characters",
			400,
			nil,
		)
	}
	if newPassword != confirmPassword {
		return apperrors.New(
			"ADMIN_PASSWORD_RESET_CONFIRM_MISMATCH",
			"password confirmation does not match",
			400,
			nil,
		)
	}

	return nil
}

func loadAdminPasswordResetUserRecord(ctx context.Context, token string) (*domain.AdminUserRecord, error) {
	userRecord, err := adminUsersRepository.FindByPendingPasswordResetTokenHash(ctx, hashValue(token))
	if err != nil {
		return nil, err
	}
	if userRecord == nil || userRecord.PendingPasswordReset == nil {
		return nil, nil
	}

	return userRecord, nil
}

func buildAdminPasswordResetURL(siteURL, token, locale string) (string, error) {
	parsed, err := url.Parse(siteURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", errors.New("invalid SITE_URL")
	}

	resolvedLocale := newsletterpkg.ResolveLocale(locale, "")
	parsed.Path = strings.TrimRight(parsed.Path, "/") + "/" + resolvedLocale + "/admin/reset-password"
	query := parsed.Query()
	query.Set("token", strings.TrimSpace(token))
	parsed.RawQuery = query.Encode()

	return parsed.String(), nil
}

func sendAdminPasswordResetEmail(
	cfg appconfig.MailConfig,
	recipientEmail,
	resetURL,
	locale,
	siteURL string,
) error {
	subject, htmlBody, err := adminmailpkg.PasswordResetEmail(locale, resetURL, siteURL)
	if err != nil {
		return fmt.Errorf("build admin password reset email failed: %w", err)
	}

	return newsletterpkg.SendHTMLEmail(cfg, recipientEmail, subject, htmlBody, nil)
}
