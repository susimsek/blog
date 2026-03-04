package service

import (
	"context"
	"errors"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpauth"

	"golang.org/x/crypto/bcrypt"
)

type AdminAuthResponse struct {
	Success      bool
	User         *domain.AdminUser
	AccessToken  string
	RefreshToken string
	RememberMe   bool
	RefreshTTL   time.Duration
}

const minAdminPasswordLength = 8

var (
	adminUsersRepository         repository.AdminUserRepository         = repository.NewAdminUserRepository()
	adminRefreshTokensRepository repository.AdminRefreshTokenRepository = repository.NewAdminRefreshTokenMongoRepository()
)

func LoginAdmin(ctx context.Context, email, password string, rememberMe bool) (*AdminAuthResponse, error) {
	config := appconfig.ResolveAdminConfig()
	if strings.TrimSpace(config.JWTSecret) == "" {
		return nil, apperrors.Config("admin jwt is not configured", nil)
	}

	userRecord, err := adminUsersRepository.FindByEmail(ctx, strings.TrimSpace(strings.ToLower(email)))
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized("invalid credentials")
	}
	if err := verifyAdminPassword(userRecord, password); err != nil {
		return nil, apperrors.Unauthorized("invalid credentials")
	}

	return issueAdminTokens(ctx, config, userRecord, "", rememberMe)
}

func RefreshAdminSession(ctx context.Context, token string) (*AdminAuthResponse, error) {
	config := appconfig.ResolveAdminConfig()
	if strings.TrimSpace(config.JWTSecret) == "" {
		return nil, apperrors.Config("admin jwt is not configured", nil)
	}

	claims, err := httpauth.VerifyHS256JWT(token, config.JWTSecret, "refresh", time.Now().UTC())
	if err != nil {
		return nil, apperrors.Unauthorized("invalid admin session")
	}
	if strings.TrimSpace(claims.ID) == "" {
		return nil, apperrors.Unauthorized("invalid admin session")
	}

	record, err := adminRefreshTokensRepository.FindActiveByToken(ctx, claims.ID, token, time.Now().UTC())
	if err != nil {
		return nil, toAdminSessionError(err)
	}
	if record == nil {
		return nil, apperrors.Unauthorized("invalid admin session")
	}

	userRecord, err := adminUsersRepository.FindByUsername(ctx, claims.Subject)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized("invalid admin session")
	}
	if claims.PasswordVersion != userRecord.PasswordVersion {
		return nil, apperrors.Unauthorized("invalid admin session")
	}
	if strings.TrimSpace(record.UserID) != userRecord.ID {
		return nil, apperrors.Unauthorized("invalid admin session")
	}

	return issueAdminTokens(ctx, config, userRecord, claims.ID, record.Persistent)
}

func LogoutAdmin(ctx context.Context, token string) error {
	config := appconfig.ResolveAdminConfig()
	if strings.TrimSpace(config.JWTSecret) == "" || strings.TrimSpace(token) == "" {
		return nil
	}

	claims, err := httpauth.VerifyHS256JWT(token, config.JWTSecret, "refresh", time.Now().UTC())
	if err != nil {
		if errors.Is(err, httpauth.ErrInvalidJWT) || errors.Is(err, httpauth.ErrExpiredJWT) || errors.Is(err, httpauth.ErrUnsupportedJWT) {
			return nil
		}
		return toAdminSessionError(err)
	}
	if strings.TrimSpace(claims.ID) == "" {
		return nil
	}

	if err := adminRefreshTokensRepository.RevokeByJTI(ctx, claims.ID, time.Now().UTC()); err != nil {
		return toAdminSessionError(err)
	}

	return nil
}

func ChangeAdminPassword(
	ctx context.Context,
	adminUser *domain.AdminUser,
	currentPassword string,
	newPassword string,
	confirmPassword string,
) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized("admin authentication required")
	}

	userRecord, err := adminUsersRepository.FindByID(ctx, adminUser.ID)
	if err != nil {
		return apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return apperrors.Unauthorized("admin authentication required")
	}

	if err := verifyAdminPassword(userRecord, currentPassword); err != nil {
		return apperrors.BadRequest("current password is incorrect")
	}

	if len(newPassword) < minAdminPasswordLength {
		return apperrors.BadRequest("new password must be at least 8 characters")
	}
	if newPassword != confirmPassword {
		return apperrors.BadRequest("new password confirmation does not match")
	}
	if currentPassword == newPassword {
		return apperrors.BadRequest("new password must be different from current password")
	}

	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return apperrors.Internal("failed to hash admin password", err)
	}

	if err := adminUsersRepository.UpdatePasswordHashByID(ctx, userRecord.ID, string(passwordHashBytes)); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return apperrors.Unauthorized("admin authentication required")
		}
		return apperrors.Internal("failed to update admin password", err)
	}

	if err := adminRefreshTokensRepository.RevokeAllByUserID(ctx, userRecord.ID, time.Now().UTC()); err != nil {
		return toAdminSessionError(err)
	}

	return nil
}

func ResolveAdminFromAccessToken(ctx context.Context, token string) (*domain.AdminUser, error) {
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

	userRecord, err := adminUsersRepository.FindByUsername(ctx, claims.Subject)
	if err != nil {
		return nil, err
	}
	if userRecord == nil {
		return nil, nil
	}
	if claims.PasswordVersion != userRecord.PasswordVersion {
		return nil, nil
	}

	return &userRecord.AdminUser, nil
}

func issueAdminTokens(
	ctx context.Context,
	config appconfig.AdminConfig,
	userRecord *domain.AdminUserRecord,
	currentRefreshJTI string,
	rememberMe bool,
) (*AdminAuthResponse, error) {
	username := strings.TrimSpace(userRecord.Username)
	if username == "" {
		return nil, apperrors.Config("admin username is not configured", nil)
	}

	now := time.Now().UTC()
	refreshTTL := config.RefreshTTL
	if rememberMe {
		refreshTTL = config.RememberRefreshTTL
	}
	accessToken, err := httpauth.IssueHS256JWT(
		httpauth.JWTClaims{
			Subject:         username,
			Email:           userRecord.Email,
			Roles:           append([]string{}, userRecord.Roles...),
			PasswordVersion: userRecord.PasswordVersion,
			Type:            "access",
			Issuer:          config.JWTIssuer,
			Audience:        config.JWTAudience,
			IssuedAt:        now.Unix(),
			ExpiresAt:       now.Add(config.AccessTTL).Unix(),
		},
		config.JWTSecret,
	)
	if err != nil {
		return nil, apperrors.Internal("failed to issue admin access token", err)
	}

	refreshJTI, err := httpauth.GenerateOpaqueToken(32)
	if err != nil {
		return nil, apperrors.Internal("failed to issue admin refresh token", err)
	}

	refreshToken, err := httpauth.IssueHS256JWT(
		httpauth.JWTClaims{
			ID:              refreshJTI,
			Subject:         username,
			Email:           userRecord.Email,
			Roles:           append([]string{}, userRecord.Roles...),
			PasswordVersion: userRecord.PasswordVersion,
			Type:            "refresh",
			Issuer:          config.JWTIssuer,
			Audience:        config.JWTAudience,
			IssuedAt:        now.Unix(),
			ExpiresAt:       now.Add(refreshTTL).Unix(),
		},
		config.JWTSecret,
	)
	if err != nil {
		return nil, apperrors.Internal("failed to issue admin refresh token", err)
	}

	refreshRecord := domain.AdminRefreshTokenRecord{
		JTI:        refreshJTI,
		UserID:     userRecord.ID,
		TokenHash:  repository.HashAdminRefreshToken(refreshToken),
		Persistent: rememberMe,
		ExpiresAt:  now.Add(refreshTTL),
		CreatedAt:  now,
	}

	if strings.TrimSpace(currentRefreshJTI) == "" {
		if err := adminRefreshTokensRepository.Create(ctx, refreshRecord); err != nil {
			return nil, toAdminSessionError(err)
		}
	} else {
		if err := adminRefreshTokensRepository.Rotate(ctx, currentRefreshJTI, refreshRecord, now); err != nil {
			if errors.Is(err, repository.ErrAdminRefreshTokenNotFound) {
				return nil, apperrors.Unauthorized("invalid admin session")
			}
			return nil, toAdminSessionError(err)
		}
	}

	return &AdminAuthResponse{
		Success:      true,
		User:         &userRecord.AdminUser,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		RememberMe:   rememberMe,
		RefreshTTL:   refreshTTL,
	}, nil
}

func verifyAdminPassword(userRecord *domain.AdminUserRecord, rawPassword string) error {
	if userRecord == nil {
		return errors.New("missing admin user")
	}

	if strings.TrimSpace(userRecord.PasswordHash) == "" {
		return errors.New("missing admin password hash")
	}

	return bcrypt.CompareHashAndPassword([]byte(userRecord.PasswordHash), []byte(rawPassword))
}

func toAdminSessionError(err error) error {
	if errors.Is(err, repository.ErrAdminRefreshTokenRepositoryUnavailable) {
		return apperrors.ServiceUnavailable("admin session storage is unavailable", err)
	}

	return apperrors.Internal("failed to manage admin session", err)
}
