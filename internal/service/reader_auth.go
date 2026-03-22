package service

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpauth"
)

type ReaderAuthResponse struct {
	Success      bool
	User         *domain.ReaderUser
	AccessToken  string
	RefreshToken string
	RememberMe   bool
	RefreshTTL   time.Duration
}

type ReaderSessionMetadata struct {
	UserAgent   string
	RemoteIP    string
	CountryCode string
}

var (
	readerUsersRepository         repository.ReaderUserRepository         = repository.NewReaderUserRepository()
	readerRefreshTokensRepository repository.ReaderRefreshTokenRepository = repository.NewReaderRefreshTokenMongoRepository()
	readerDisplayWordPattern                                              = regexp.MustCompile(`[._-]+`)
)

const (
	readerAuthRequiredMessage    = "reader authentication required"
	readerInvalidSessionMessage  = "invalid reader session"
	readerSessionUnavailableText = "reader session is unavailable"
	readerSessionFailedText      = "reader session failed"
)

func ResolveReaderFromAccessToken(ctx context.Context, token string) (*domain.ReaderUser, error) {
	config := appconfig.ResolveReaderConfig()
	if strings.TrimSpace(config.JWTSecret) == "" || strings.TrimSpace(token) == "" {
		return nil, apperrors.Unauthorized(readerAuthRequiredMessage)
	}

	claims, err := httpauth.VerifyHS256JWT(token, config.JWTSecret, "access", time.Now().UTC())
	if err != nil {
		return nil, apperrors.Unauthorized(readerAuthRequiredMessage)
	}
	if strings.TrimSpace(claims.Subject) == "" {
		return nil, apperrors.Unauthorized(readerAuthRequiredMessage)
	}

	userRecord, err := readerUsersRepository.FindByID(ctx, strings.TrimSpace(claims.Subject))
	if err != nil {
		return nil, apperrors.Internal("failed to load reader user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized(readerAuthRequiredMessage)
	}
	if claims.PasswordVersion != userRecord.SessionVersion {
		return nil, apperrors.Unauthorized(readerAuthRequiredMessage)
	}

	return &userRecord.ReaderUser, nil
}

func RefreshReaderSession(ctx context.Context, token string, metadata ReaderSessionMetadata) (*ReaderAuthResponse, error) {
	config := appconfig.ResolveReaderConfig()
	if strings.TrimSpace(config.JWTSecret) == "" {
		return nil, apperrors.Config("reader jwt is not configured", nil)
	}

	claims, err := httpauth.VerifyHS256JWT(token, config.JWTSecret, "refresh", time.Now().UTC())
	if err != nil {
		return nil, apperrors.Unauthorized(readerInvalidSessionMessage)
	}
	if strings.TrimSpace(claims.ID) == "" {
		return nil, apperrors.Unauthorized(readerInvalidSessionMessage)
	}

	record, err := readerRefreshTokensRepository.FindActiveByToken(ctx, claims.ID, token, time.Now().UTC())
	if err != nil {
		return nil, toReaderSessionError(err)
	}
	if record == nil {
		return nil, apperrors.Unauthorized(readerInvalidSessionMessage)
	}

	userRecord, err := readerUsersRepository.FindByID(ctx, strings.TrimSpace(record.UserID))
	if err != nil {
		return nil, apperrors.Internal("failed to load reader user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized(readerInvalidSessionMessage)
	}
	if claims.PasswordVersion != userRecord.SessionVersion {
		return nil, apperrors.Unauthorized(readerInvalidSessionMessage)
	}

	return issueReaderTokens(ctx, config, userRecord, claims.ID, record.Persistent, metadata)
}

func LogoutReader(ctx context.Context, token string) error {
	config := appconfig.ResolveReaderConfig()
	if strings.TrimSpace(config.JWTSecret) == "" || strings.TrimSpace(token) == "" {
		return nil
	}

	claims, err := httpauth.VerifyHS256JWT(token, config.JWTSecret, "refresh", time.Now().UTC())
	if err != nil {
		if errors.Is(err, httpauth.ErrInvalidJWT) || errors.Is(err, httpauth.ErrExpiredJWT) || errors.Is(err, httpauth.ErrUnsupportedJWT) {
			return nil
		}
		return toReaderSessionError(err)
	}
	if strings.TrimSpace(claims.ID) == "" {
		return nil
	}

	if err := readerRefreshTokensRepository.RevokeByJTI(ctx, claims.ID, time.Now().UTC()); err != nil {
		return toReaderSessionError(err)
	}

	return nil
}

func issueReaderTokens(
	ctx context.Context,
	config appconfig.ReaderConfig,
	userRecord *domain.ReaderUserRecord,
	currentRefreshJTI string,
	rememberMe bool,
	metadata ReaderSessionMetadata,
) (*ReaderAuthResponse, error) {
	readerID := strings.TrimSpace(userRecord.ID)
	if readerID == "" {
		return nil, apperrors.Config("reader id is not configured", nil)
	}

	now := time.Now().UTC()
	refreshTTL := config.RefreshTTL
	if rememberMe {
		refreshTTL = config.RememberRefreshTTL
	}

	accessToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
		Subject:         readerID,
		Email:           userRecord.Email,
		PasswordVersion: userRecord.SessionVersion,
		Type:            "access",
		Issuer:          config.JWTIssuer,
		Audience:        config.JWTAudience,
		IssuedAt:        now.Unix(),
		ExpiresAt:       now.Add(config.AccessTTL).Unix(),
	}, config.JWTSecret)
	if err != nil {
		return nil, apperrors.Internal("failed to issue reader access token", err)
	}

	refreshJTI, err := httpauth.GenerateOpaqueToken(32)
	if err != nil {
		return nil, apperrors.Internal("failed to issue reader refresh token", err)
	}

	refreshToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
		ID:              refreshJTI,
		Subject:         readerID,
		Email:           userRecord.Email,
		PasswordVersion: userRecord.SessionVersion,
		Type:            "refresh",
		Issuer:          config.JWTIssuer,
		Audience:        config.JWTAudience,
		IssuedAt:        now.Unix(),
		ExpiresAt:       now.Add(refreshTTL).Unix(),
	}, config.JWTSecret)
	if err != nil {
		return nil, apperrors.Internal("failed to issue reader refresh token", err)
	}

	refreshRecord := domain.ReaderRefreshTokenRecord{
		JTI:         refreshJTI,
		UserID:      userRecord.ID,
		TokenHash:   repository.HashReaderRefreshToken(refreshToken),
		Persistent:  rememberMe,
		UserAgent:   strings.TrimSpace(metadata.UserAgent),
		RemoteIP:    strings.TrimSpace(metadata.RemoteIP),
		CountryCode: strings.TrimSpace(metadata.CountryCode),
		LastSeenAt:  now,
		ExpiresAt:   now.Add(refreshTTL),
		CreatedAt:   now,
	}

	if strings.TrimSpace(currentRefreshJTI) == "" {
		if err := readerRefreshTokensRepository.Create(ctx, refreshRecord); err != nil {
			return nil, toReaderSessionError(err)
		}
	} else {
		if err := readerRefreshTokensRepository.Rotate(ctx, currentRefreshJTI, refreshRecord, now); err != nil {
			if errors.Is(err, repository.ErrReaderRefreshTokenNotFound) {
				return nil, apperrors.Unauthorized(readerInvalidSessionMessage)
			}
			return nil, toReaderSessionError(err)
		}
	}

	return &ReaderAuthResponse{
		Success:      true,
		User:         &userRecord.ReaderUser,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		RememberMe:   rememberMe,
		RefreshTTL:   refreshTTL,
	}, nil
}

func normalizeReaderDisplayName(name, email string) string {
	resolvedName := strings.Join(strings.Fields(strings.TrimSpace(name)), " ")
	if len(resolvedName) >= commentMinNameLength && len(resolvedName) <= commentMaxNameLength {
		return resolvedName
	}

	localPart := strings.TrimSpace(strings.Split(strings.TrimSpace(strings.ToLower(email)), "@")[0])
	if localPart == "" {
		return "Reader"
	}

	words := strings.Fields(readerDisplayWordPattern.ReplaceAllString(localPart, " "))
	for index, word := range words {
		if word == "" {
			continue
		}
		words[index] = strings.ToUpper(word[:1]) + word[1:]
	}

	resolvedName = strings.Join(words, " ")
	if len(resolvedName) < commentMinNameLength || len(resolvedName) > commentMaxNameLength {
		return "Reader"
	}

	return resolvedName
}

func toReaderSessionError(err error) error {
	if errors.Is(err, repository.ErrReaderRefreshTokenRepositoryUnavailable) || errors.Is(err, repository.ErrReaderUserRepositoryUnavailable) {
		return apperrors.ServiceUnavailable(readerSessionUnavailableText, err)
	}
	return apperrors.Internal(readerSessionFailedText, err)
}
