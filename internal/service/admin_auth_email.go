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
)

type adminEmailChangeRequest struct {
	SiteURL    string
	MailConfig appconfig.MailConfig
	Locale     string
	ConfirmURL string
	Pending    domain.AdminPendingEmailChange
}

func RequestAdminEmailChange(
	ctx context.Context,
	adminUser *domain.AdminUser,
	newEmail string,
	currentPassword string,
	locale string,
) (*AdminEmailChangeRequestResult, error) {
	if err := requireAdminAuthentication(adminUser); err != nil {
		return nil, err
	}
	if strings.TrimSpace(currentPassword) == "" {
		return nil, apperrors.BadRequest("current password is required")
	}

	userRecord, err := loadAdminUserRecord(ctx, adminUser.ID)
	if err != nil {
		return nil, err
	}
	if err := validateAdminCurrentPassword(userRecord, currentPassword); err != nil {
		return nil, err
	}

	resolvedEmail, err := resolveAdminEmailChangeTarget(ctx, userRecord, newEmail)
	if err != nil {
		return nil, err
	}

	request, err := buildAdminEmailChangeRequest(resolvedEmail, locale)
	if err != nil {
		return nil, err
	}

	if err := adminUsersRepository.SetPendingEmailChangeByID(ctx, userRecord.ID, request.Pending); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Unauthorized(adminAuthRequiredMessage)
		}
		return nil, apperrors.Internal("failed to store admin email change request", err)
	}

	if err := sendAdminEmailChangeConfirmationEmailFn(
		request.MailConfig,
		resolvedEmail,
		request.ConfirmURL,
		request.Locale,
		request.SiteURL,
	); err != nil {
		_ = adminUsersRepository.ClearPendingEmailChangeByID(ctx, userRecord.ID)
		return nil, apperrors.ServiceUnavailable("failed to send email change confirmation", err)
	}

	_ = sendAdminEmailChangeNoticeEmailFn(request.MailConfig, userRecord.Email, request.Locale, request.SiteURL)

	return &AdminEmailChangeRequestResult{
		Success:      true,
		PendingEmail: resolvedEmail,
		ExpiresAt:    request.Pending.ExpiresAt,
	}, nil
}

func ConfirmAdminEmailChange(
	ctx context.Context,
	token string,
	localeHint string,
) (*AdminEmailChangeConfirmResult, error) {
	resolvedToken := strings.TrimSpace(token)
	resolvedLocale := newsletterpkg.ResolveLocale(localeHint, "")
	if resolvedToken == "" {
		return &AdminEmailChangeConfirmResult{
			Status: string(adminmailpkg.StatusInvalidLink),
			Locale: resolvedLocale,
		}, nil
	}

	userRecord, err := adminUsersRepository.FindByPendingEmailChangeTokenHash(ctx, hashValue(resolvedToken))
	if err != nil {
		return nil, apperrors.Internal("failed to load admin email change request", err)
	}
	if userRecord == nil || userRecord.PendingEmailChange == nil {
		return &AdminEmailChangeConfirmResult{
			Status: string(adminmailpkg.StatusInvalidLink),
			Locale: resolvedLocale,
		}, nil
	}

	pending := userRecord.PendingEmailChange
	if pending.Locale != "" {
		resolvedLocale = newsletterpkg.ResolveLocale(pending.Locale, "")
	}

	now := nowUTCFn()
	if now.After(pending.ExpiresAt) {
		if clearErr := adminUsersRepository.ClearPendingEmailChangeByID(ctx, userRecord.ID); clearErr != nil &&
			!errors.Is(clearErr, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Internal("failed to clear expired admin email change request", clearErr)
		}
		return &AdminEmailChangeConfirmResult{
			Status: string(adminmailpkg.StatusExpired),
			Locale: resolvedLocale,
		}, nil
	}

	if err := adminUsersRepository.UpdateEmailByID(ctx, userRecord.ID, pending.NewEmail); err != nil {
		if errors.Is(err, repository.ErrAdminEmailAlreadyExists) {
			_ = adminUsersRepository.ClearPendingEmailChangeByID(ctx, userRecord.ID)
			return &AdminEmailChangeConfirmResult{
				Status: string(adminmailpkg.StatusFailed),
				Locale: resolvedLocale,
			}, nil
		}
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return &AdminEmailChangeConfirmResult{
				Status: string(adminmailpkg.StatusInvalidLink),
				Locale: resolvedLocale,
			}, nil
		}
		return nil, apperrors.Internal("failed to update admin email", err)
	}

	if err := adminRefreshTokensRepository.RevokeAllByUserID(ctx, userRecord.ID, now); err != nil {
		return nil, toAdminSessionError(err)
	}

	return &AdminEmailChangeConfirmResult{
		Status: string(adminmailpkg.StatusSuccess),
		Locale: resolvedLocale,
	}, nil
}

func resolveAdminEmailChangeTarget(
	ctx context.Context,
	userRecord *domain.AdminUserRecord,
	newEmail string,
) (string, error) {
	resolvedEmail, err := newsletterpkg.NormalizeSubscriberEmail(newEmail)
	if err != nil {
		return "", apperrors.BadRequest("new email is invalid")
	}
	if strings.EqualFold(strings.TrimSpace(userRecord.Email), resolvedEmail) {
		return "", apperrors.BadRequest("new email must be different from current email")
	}

	existingUser, err := adminUsersRepository.FindByEmail(ctx, resolvedEmail)
	if err != nil {
		return "", apperrors.Internal("failed to validate admin email", err)
	}
	if existingUser != nil && existingUser.ID != userRecord.ID {
		return "", apperrors.BadRequest("email is already in use")
	}

	return resolvedEmail, nil
}

func buildAdminEmailChangeRequest(
	resolvedEmail, locale string,
) (*adminEmailChangeRequest, error) {
	siteURL, err := resolveSiteURLFn()
	if err != nil {
		return nil, apperrors.Config("admin email change site url is not configured", err)
	}

	mailCfg, err := resolveMailConfigFn()
	if err != nil {
		return nil, apperrors.Config("admin email change mail transport is not configured", err)
	}

	token, err := generateConfirmTokenFn()
	if err != nil {
		return nil, apperrors.Internal("failed to issue admin email change token", err)
	}

	now := nowUTCFn()
	resolvedLocale := newsletterpkg.ResolveLocale(locale, "")
	confirmURL, err := buildAdminEmailChangeConfirmURL(siteURL, token, resolvedLocale)
	if err != nil {
		return nil, apperrors.Config("admin email change confirm url is invalid", err)
	}

	return &adminEmailChangeRequest{
		SiteURL:    siteURL,
		MailConfig: mailCfg,
		Locale:     resolvedLocale,
		ConfirmURL: confirmURL,
		Pending: domain.AdminPendingEmailChange{
			NewEmail:    resolvedEmail,
			TokenHash:   hashValue(token),
			Locale:      resolvedLocale,
			RequestedAt: now,
			ExpiresAt:   now.Add(adminEmailChangeTTL),
		},
	}, nil
}

func buildAdminEmailChangeConfirmURL(siteURL, token, locale string) (string, error) {
	parsed, err := url.Parse(siteURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", errors.New("invalid SITE_URL")
	}

	resolvedLocale := newsletterpkg.ResolveLocale(locale, "")
	parsed.Path = strings.TrimRight(parsed.Path, "/") + "/" + resolvedLocale + "/admin/email-change"
	query := parsed.Query()
	query.Set("token", strings.TrimSpace(token))
	parsed.RawQuery = query.Encode()

	return parsed.String(), nil
}

func sendAdminEmailChangeConfirmationEmail(
	cfg appconfig.MailConfig,
	recipientEmail,
	confirmURL,
	locale,
	siteURL string,
) error {
	subject, htmlBody, err := adminmailpkg.ConfirmationEmail(locale, confirmURL, siteURL)
	if err != nil {
		return fmt.Errorf("build admin email change confirmation email failed: %w", err)
	}

	return newsletterpkg.SendHTMLEmail(cfg, recipientEmail, subject, htmlBody, nil)
}

func sendAdminEmailChangeNoticeEmail(
	cfg appconfig.MailConfig,
	recipientEmail,
	locale,
	siteURL string,
) error {
	subject, htmlBody, err := adminmailpkg.ChangeRequestedNoticeEmail(locale, siteURL)
	if err != nil {
		return fmt.Errorf("build admin email change notice email failed: %w", err)
	}

	return newsletterpkg.SendHTMLEmail(cfg, recipientEmail, subject, htmlBody, nil)
}
