package service

import (
	"context"
	"errors"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpauth"
)

func ListActiveAdminSessions(ctx context.Context, adminUser *domain.AdminUser) ([]domain.AdminSessionRecord, error) {
	if err := requireAdminAuthentication(adminUser); err != nil {
		return nil, err
	}

	sessions, err := adminRefreshTokensRepository.ListActiveByUserID(ctx, adminUser.ID, time.Now().UTC(), maxActiveAdminSessions)
	if err != nil {
		return nil, toAdminSessionError(err)
	}

	return sessions, nil
}

func RevokeAdminSession(ctx context.Context, adminUser *domain.AdminUser, sessionID string) (bool, error) {
	if err := requireAdminAuthentication(adminUser); err != nil {
		return false, err
	}

	resolvedSessionID := strings.TrimSpace(sessionID)
	if resolvedSessionID == "" {
		return false, apperrors.BadRequest("session id is required")
	}

	revoked, err := adminRefreshTokensRepository.RevokeByJTIAndUserID(ctx, resolvedSessionID, adminUser.ID, time.Now().UTC())
	if err != nil {
		return false, toAdminSessionError(err)
	}

	return revoked, nil
}

func RevokeAllAdminSessions(ctx context.Context, adminUser *domain.AdminUser) error {
	if err := requireAdminAuthentication(adminUser); err != nil {
		return err
	}

	if err := adminRefreshTokensRepository.RevokeAllByUserID(ctx, adminUser.ID, time.Now().UTC()); err != nil {
		return toAdminSessionError(err)
	}

	return nil
}

func ResolveAdminFromAccessToken(ctx context.Context, token string) (*domain.AdminUser, error) { // NOSONAR
	config := appconfig.ResolveAdminConfig()
	if strings.TrimSpace(config.JWTSecret) == "" {
		return nil, nil
	}

	claims, err := httpauth.VerifyHS256JWT(token, config.JWTSecret, "access", time.Now().UTC())
	if err != nil {
		if errors.Is(err, httpauth.ErrInvalidJWT) || errors.Is(err, httpauth.ErrExpiredJWT) || errors.Is(err, httpauth.ErrUnsupportedJWT) {
			return nil, nil
		}
		return nil, err
	}

	resolvedSubject := strings.TrimSpace(claims.Subject)
	userRecord, err := adminUsersRepository.FindByID(ctx, resolvedSubject)
	if err != nil {
		return nil, err
	}
	if userRecord == nil {
		userRecord, err = adminUsersRepository.FindByUsername(ctx, resolvedSubject)
		if err != nil {
			return nil, err
		}
	}
	if userRecord == nil {
		resolvedEmail := strings.TrimSpace(strings.ToLower(claims.Email))
		if resolvedEmail != "" {
			userRecord, err = adminUsersRepository.FindByEmail(ctx, resolvedEmail)
			if err != nil {
				return nil, err
			}
		}
	}
	if userRecord == nil {
		return nil, nil
	}
	if claims.PasswordVersion != userRecord.PasswordVersion {
		return nil, nil
	}

	return &userRecord.AdminUser, nil
}
