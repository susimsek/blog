package service

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/httpauth"
)

type stubReaderUserRepository struct {
	findByID               func(context.Context, string) (*domain.ReaderUserRecord, error)
	findByEmail            func(context.Context, string) (*domain.ReaderUserRecord, error)
	findByGoogleSubject    func(context.Context, string) (*domain.ReaderUserRecord, error)
	findByGithubSubject    func(context.Context, string) (*domain.ReaderUserRecord, error)
	create                 func(context.Context, domain.ReaderUserRecord) error
	updateGoogleIdentity   func(context.Context, string, string, string, string, string, time.Time) error
	updateGithubIdentity   func(context.Context, string, string, string, string, string, time.Time) error
	updateLastSeenProvider func(context.Context, string, string) error
}

func (s stubReaderUserRepository) FindByID(ctx context.Context, id string) (*domain.ReaderUserRecord, error) {
	if s.findByID == nil {
		return nil, nil
	}
	return s.findByID(ctx, id)
}

func (s stubReaderUserRepository) FindByEmail(ctx context.Context, email string) (*domain.ReaderUserRecord, error) {
	if s.findByEmail == nil {
		return nil, nil
	}
	return s.findByEmail(ctx, email)
}

func (s stubReaderUserRepository) FindByGoogleSubject(ctx context.Context, subject string) (*domain.ReaderUserRecord, error) {
	if s.findByGoogleSubject == nil {
		return nil, nil
	}
	return s.findByGoogleSubject(ctx, subject)
}

func (s stubReaderUserRepository) FindByGithubSubject(ctx context.Context, subject string) (*domain.ReaderUserRecord, error) {
	if s.findByGithubSubject == nil {
		return nil, nil
	}
	return s.findByGithubSubject(ctx, subject)
}

func (s stubReaderUserRepository) Create(ctx context.Context, record domain.ReaderUserRecord) error {
	if s.create == nil {
		return nil
	}
	return s.create(ctx, record)
}

func (s stubReaderUserRepository) UpdateGoogleIdentityByID(
	ctx context.Context,
	id, subject, email, name, avatarURL string,
	linkedAt time.Time,
) error {
	if s.updateGoogleIdentity == nil {
		return nil
	}
	return s.updateGoogleIdentity(ctx, id, subject, email, name, avatarURL, linkedAt)
}

func (s stubReaderUserRepository) UpdateGithubIdentityByID(
	ctx context.Context,
	id, subject, email, name, avatarURL string,
	linkedAt time.Time,
) error {
	if s.updateGithubIdentity == nil {
		return nil
	}
	return s.updateGithubIdentity(ctx, id, subject, email, name, avatarURL, linkedAt)
}

func (s stubReaderUserRepository) UpdateLastSeenProviderByID(ctx context.Context, id, provider string) error {
	if s.updateLastSeenProvider == nil {
		return nil
	}
	return s.updateLastSeenProvider(ctx, id, provider)
}

type stubReaderRefreshTokenRepository struct {
	create            func(context.Context, domain.ReaderRefreshTokenRecord) error
	findActiveByToken func(context.Context, string, string, time.Time) (*domain.ReaderRefreshTokenRecord, error)
	rotate            func(context.Context, string, domain.ReaderRefreshTokenRecord, time.Time) error
	revokeByJTI       func(context.Context, string, time.Time) error
}

func (s stubReaderRefreshTokenRepository) Create(ctx context.Context, record domain.ReaderRefreshTokenRecord) error {
	if s.create == nil {
		return nil
	}
	return s.create(ctx, record)
}

func (s stubReaderRefreshTokenRepository) FindActiveByToken(
	ctx context.Context,
	jti, rawToken string,
	now time.Time,
) (*domain.ReaderRefreshTokenRecord, error) {
	if s.findActiveByToken == nil {
		return nil, nil
	}
	return s.findActiveByToken(ctx, jti, rawToken, now)
}

func (s stubReaderRefreshTokenRepository) Rotate(
	ctx context.Context,
	currentJTI string,
	replacement domain.ReaderRefreshTokenRecord,
	now time.Time,
) error {
	if s.rotate == nil {
		return nil
	}
	return s.rotate(ctx, currentJTI, replacement, now)
}

func (s stubReaderRefreshTokenRepository) RevokeByJTI(ctx context.Context, jti string, now time.Time) error {
	if s.revokeByJTI == nil {
		return nil
	}
	return s.revokeByJTI(ctx, jti, now)
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (fn roundTripFunc) RoundTrip(request *http.Request) (*http.Response, error) {
	return fn(request)
}

func newJSONResponse(statusCode int, body string) *http.Response {
	return &http.Response{
		StatusCode: statusCode,
		Header: http.Header{
			"Content-Type": []string{"application/json"},
		},
		Body: io.NopCloser(strings.NewReader(body)),
	}
}

func TestResolveReaderFromAccessTokenReturnsReaderUser(t *testing.T) {
	t.Setenv("JWT_SECRET", "reader-secret")

	previousUsersRepo := readerUsersRepository
	t.Cleanup(func() {
		readerUsersRepository = previousUsersRepo
	})

	token, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
		Subject:         "reader-1",
		Type:            "access",
		PasswordVersion: 3,
		IssuedAt:        time.Now().Add(-time.Minute).Unix(),
		ExpiresAt:       time.Now().Add(time.Hour).Unix(),
	}, "reader-secret")
	if err != nil {
		t.Fatalf("IssueHS256JWT returned error: %v", err)
	}

	readerUsersRepository = stubReaderUserRepository{
		findByID: func(_ context.Context, id string) (*domain.ReaderUserRecord, error) {
			if id != "reader-1" {
				t.Fatalf("FindByID id = %q", id)
			}
			return &domain.ReaderUserRecord{
				ReaderUser: domain.ReaderUser{
					ID:    "reader-1",
					Name:  "Reader One",
					Email: "reader@example.com",
				},
				SessionVersion: 3,
			}, nil
		},
	}

	user, err := ResolveReaderFromAccessToken(context.Background(), token)
	if err != nil {
		t.Fatalf("ResolveReaderFromAccessToken returned error: %v", err)
	}
	if user == nil || user.ID != "reader-1" {
		t.Fatalf("unexpected user: %+v", user)
	}
}

func TestResolveReaderFromAccessTokenErrorPaths(t *testing.T) {
	previousUsersRepo := readerUsersRepository
	t.Cleanup(func() {
		readerUsersRepository = previousUsersRepo
	})

	t.Run("requires jwt secret and token", func(t *testing.T) {
		if _, err := ResolveReaderFromAccessToken(context.Background(), " "); err == nil || !strings.Contains(err.Error(), readerAuthRequiredMessage) {
			t.Fatalf("expected auth required error, got %v", err)
		}
	})

	t.Run("rejects invalid token", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "reader-secret")

		if _, err := ResolveReaderFromAccessToken(context.Background(), "invalid-token"); err == nil || !strings.Contains(err.Error(), readerAuthRequiredMessage) {
			t.Fatalf("expected auth required error, got %v", err)
		}
	})

	t.Run("rejects token without subject", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "reader-secret")

		token, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			Type:      "access",
			IssuedAt:  time.Now().Add(-time.Minute).Unix(),
			ExpiresAt: time.Now().Add(time.Hour).Unix(),
		}, "reader-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}

		if _, err := ResolveReaderFromAccessToken(context.Background(), token); err == nil || !strings.Contains(err.Error(), readerAuthRequiredMessage) {
			t.Fatalf("expected auth required error, got %v", err)
		}
	})

	t.Run("maps repository and session failures", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "reader-secret")

		token, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			Subject:         "reader-1",
			Type:            "access",
			PasswordVersion: 4,
			IssuedAt:        time.Now().Add(-time.Minute).Unix(),
			ExpiresAt:       time.Now().Add(time.Hour).Unix(),
		}, "reader-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}

		readerUsersRepository = stubReaderUserRepository{
			findByID: func(_ context.Context, id string) (*domain.ReaderUserRecord, error) {
				switch id {
				case "reader-1":
					return nil, repository.ErrReaderUserRepositoryUnavailable
				case "reader-2":
					return nil, nil
				default:
					return &domain.ReaderUserRecord{
						ReaderUser:     domain.ReaderUser{ID: id},
						SessionVersion: 1,
					}, nil
				}
			},
		}

		if _, err := ResolveReaderFromAccessToken(context.Background(), token); err == nil || !strings.Contains(err.Error(), "failed to load reader user") {
			t.Fatalf("expected load error, got %v", err)
		}

		missingUserToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			Subject:         "reader-2",
			Type:            "access",
			PasswordVersion: 4,
			IssuedAt:        time.Now().Add(-time.Minute).Unix(),
			ExpiresAt:       time.Now().Add(time.Hour).Unix(),
		}, "reader-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}
		if _, err := ResolveReaderFromAccessToken(context.Background(), missingUserToken); err == nil || !strings.Contains(err.Error(), readerAuthRequiredMessage) {
			t.Fatalf("expected missing user auth error, got %v", err)
		}

		mismatchToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			Subject:         "reader-3",
			Type:            "access",
			PasswordVersion: 4,
			IssuedAt:        time.Now().Add(-time.Minute).Unix(),
			ExpiresAt:       time.Now().Add(time.Hour).Unix(),
		}, "reader-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}
		if _, err := ResolveReaderFromAccessToken(context.Background(), mismatchToken); err == nil || !strings.Contains(err.Error(), readerAuthRequiredMessage) {
			t.Fatalf("expected session mismatch auth error, got %v", err)
		}
	})
}

func TestRefreshReaderSessionRotatesTokens(t *testing.T) {
	t.Setenv("JWT_SECRET", "reader-secret")

	previousUsersRepo := readerUsersRepository
	previousRefreshRepo := readerRefreshTokensRepository
	t.Cleanup(func() {
		readerUsersRepository = previousUsersRepo
		readerRefreshTokensRepository = previousRefreshRepo
	})

	refreshToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
		ID:              "refresh-jti",
		Subject:         "reader-1",
		Type:            "refresh",
		PasswordVersion: 2,
		IssuedAt:        time.Now().Add(-time.Minute).Unix(),
		ExpiresAt:       time.Now().Add(time.Hour).Unix(),
	}, "reader-secret")
	if err != nil {
		t.Fatalf("IssueHS256JWT returned error: %v", err)
	}

	readerUsersRepository = stubReaderUserRepository{
		findByID: func(_ context.Context, id string) (*domain.ReaderUserRecord, error) {
			return &domain.ReaderUserRecord{
				ReaderUser: domain.ReaderUser{
					ID:    id,
					Name:  "Reader One",
					Email: "reader@example.com",
				},
				SessionVersion: 2,
			}, nil
		},
	}

	var rotatedTo string
	readerRefreshTokensRepository = stubReaderRefreshTokenRepository{
		findActiveByToken: func(_ context.Context, jti, rawToken string, _ time.Time) (*domain.ReaderRefreshTokenRecord, error) {
			if jti != "refresh-jti" || rawToken != refreshToken {
				t.Fatalf("FindActiveByToken args = %q %q", jti, rawToken)
			}
			return &domain.ReaderRefreshTokenRecord{
				JTI:        jti,
				UserID:     "reader-1",
				Persistent: true,
			}, nil
		},
		rotate: func(_ context.Context, currentJTI string, replacement domain.ReaderRefreshTokenRecord, _ time.Time) error {
			if currentJTI != "refresh-jti" {
				t.Fatalf("Rotate currentJTI = %q", currentJTI)
			}
			rotatedTo = replacement.JTI
			return nil
		},
	}

	response, err := RefreshReaderSession(context.Background(), refreshToken, ReaderSessionMetadata{
		UserAgent:   "test-agent",
		RemoteIP:    "127.0.0.1",
		CountryCode: "tr",
	})
	if err != nil {
		t.Fatalf("RefreshReaderSession returned error: %v", err)
	}
	if response == nil || response.AccessToken == "" || response.RefreshToken == "" {
		t.Fatalf("unexpected response: %+v", response)
	}
	if rotatedTo == "" {
		t.Fatal("expected refresh token rotation to be recorded")
	}
}

func TestRefreshReaderSessionErrorPaths(t *testing.T) {
	previousUsersRepo := readerUsersRepository
	previousRefreshRepo := readerRefreshTokensRepository
	t.Cleanup(func() {
		readerUsersRepository = previousUsersRepo
		readerRefreshTokensRepository = previousRefreshRepo
	})

	t.Run("requires jwt config", func(t *testing.T) {
		if _, err := RefreshReaderSession(context.Background(), "token", ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "reader jwt is not configured") {
			t.Fatalf("expected jwt config error, got %v", err)
		}
	})

	t.Run("rejects invalid refresh tokens", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "reader-secret")

		if _, err := RefreshReaderSession(context.Background(), "bad-token", ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), readerInvalidSessionMessage) {
			t.Fatalf("expected invalid session error, got %v", err)
		}

		tokenWithoutID, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			Subject:   "reader-1",
			Type:      "refresh",
			IssuedAt:  time.Now().Add(-time.Minute).Unix(),
			ExpiresAt: time.Now().Add(time.Hour).Unix(),
		}, "reader-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}
		if _, err := RefreshReaderSession(context.Background(), tokenWithoutID, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), readerInvalidSessionMessage) {
			t.Fatalf("expected invalid session error, got %v", err)
		}
	})

	t.Run("maps repository and user validation failures", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "reader-secret")

		refreshToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			ID:              "refresh-jti",
			Subject:         "reader-1",
			Type:            "refresh",
			PasswordVersion: 3,
			IssuedAt:        time.Now().Add(-time.Minute).Unix(),
			ExpiresAt:       time.Now().Add(time.Hour).Unix(),
		}, "reader-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}

		readerRefreshTokensRepository = stubReaderRefreshTokenRepository{
			findActiveByToken: func(_ context.Context, jti, rawToken string, _ time.Time) (*domain.ReaderRefreshTokenRecord, error) {
				switch jti {
				case "refresh-jti":
					return nil, repository.ErrReaderRefreshTokenRepositoryUnavailable
				case "refresh-nil":
					return nil, nil
				case "refresh-user-missing":
					return &domain.ReaderRefreshTokenRecord{JTI: jti, UserID: "reader-missing"}, nil
				case "refresh-user-mismatch":
					return &domain.ReaderRefreshTokenRecord{JTI: jti, UserID: "reader-mismatch"}, nil
				default:
					return &domain.ReaderRefreshTokenRecord{JTI: jti, UserID: "reader-error"}, nil
				}
			},
		}
		readerUsersRepository = stubReaderUserRepository{
			findByID: func(_ context.Context, id string) (*domain.ReaderUserRecord, error) {
				switch id {
				case "reader-error":
					return nil, errors.New("db down")
				case "reader-missing":
					return nil, nil
				case "reader-mismatch":
					return &domain.ReaderUserRecord{
						ReaderUser:     domain.ReaderUser{ID: id},
						SessionVersion: 1,
					}, nil
				default:
					return &domain.ReaderUserRecord{
						ReaderUser:     domain.ReaderUser{ID: id},
						SessionVersion: 3,
					}, nil
				}
			},
		}

		if _, err := RefreshReaderSession(context.Background(), refreshToken, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), readerSessionUnavailableText) {
			t.Fatalf("expected session unavailable error, got %v", err)
		}

		nilRecordToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			ID:              "refresh-nil",
			Subject:         "reader-1",
			Type:            "refresh",
			PasswordVersion: 3,
			IssuedAt:        time.Now().Add(-time.Minute).Unix(),
			ExpiresAt:       time.Now().Add(time.Hour).Unix(),
		}, "reader-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}
		if _, err := RefreshReaderSession(context.Background(), nilRecordToken, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), readerInvalidSessionMessage) {
			t.Fatalf("expected invalid session error, got %v", err)
		}

		userErrorToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			ID:              "refresh-user-error",
			Subject:         "reader-1",
			Type:            "refresh",
			PasswordVersion: 3,
			IssuedAt:        time.Now().Add(-time.Minute).Unix(),
			ExpiresAt:       time.Now().Add(time.Hour).Unix(),
		}, "reader-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}
		if _, err := RefreshReaderSession(context.Background(), userErrorToken, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "failed to load reader user") {
			t.Fatalf("expected user load error, got %v", err)
		}

		missingUserToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			ID:              "refresh-user-missing",
			Subject:         "reader-1",
			Type:            "refresh",
			PasswordVersion: 3,
			IssuedAt:        time.Now().Add(-time.Minute).Unix(),
			ExpiresAt:       time.Now().Add(time.Hour).Unix(),
		}, "reader-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}
		if _, err := RefreshReaderSession(context.Background(), missingUserToken, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), readerInvalidSessionMessage) {
			t.Fatalf("expected missing user invalid session error, got %v", err)
		}

		mismatchUserToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			ID:              "refresh-user-mismatch",
			Subject:         "reader-1",
			Type:            "refresh",
			PasswordVersion: 3,
			IssuedAt:        time.Now().Add(-time.Minute).Unix(),
			ExpiresAt:       time.Now().Add(time.Hour).Unix(),
		}, "reader-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}
		if _, err := RefreshReaderSession(context.Background(), mismatchUserToken, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), readerInvalidSessionMessage) {
			t.Fatalf("expected session mismatch error, got %v", err)
		}
	})
}

func TestLogoutReaderRevokesRefreshToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "reader-secret")

	previousRefreshRepo := readerRefreshTokensRepository
	t.Cleanup(func() {
		readerRefreshTokensRepository = previousRefreshRepo
	})

	refreshToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
		ID:        "refresh-jti",
		Subject:   "reader-1",
		Type:      "refresh",
		IssuedAt:  time.Now().Add(-time.Minute).Unix(),
		ExpiresAt: time.Now().Add(time.Hour).Unix(),
	}, "reader-secret")
	if err != nil {
		t.Fatalf("IssueHS256JWT returned error: %v", err)
	}

	var revokedJTI string
	readerRefreshTokensRepository = stubReaderRefreshTokenRepository{
		revokeByJTI: func(_ context.Context, jti string, _ time.Time) error {
			revokedJTI = jti
			return nil
		},
	}

	if err := LogoutReader(context.Background(), refreshToken); err != nil {
		t.Fatalf("LogoutReader returned error: %v", err)
	}
	if revokedJTI != "refresh-jti" {
		t.Fatalf("expected revoked JTI %q, got %q", "refresh-jti", revokedJTI)
	}
}

func TestLogoutReaderErrorPaths(t *testing.T) {
	previousRefreshRepo := readerRefreshTokensRepository
	t.Cleanup(func() {
		readerRefreshTokensRepository = previousRefreshRepo
	})

	if err := LogoutReader(context.Background(), "token"); err != nil {
		t.Fatalf("LogoutReader without config returned error: %v", err)
	}

	t.Setenv("JWT_SECRET", "reader-secret")

	if err := LogoutReader(context.Background(), ""); err != nil {
		t.Fatalf("LogoutReader with empty token returned error: %v", err)
	}
	if err := LogoutReader(context.Background(), "bad-token"); err != nil {
		t.Fatalf("LogoutReader with invalid token returned error: %v", err)
	}

	noIDToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
		Subject:   "reader-1",
		Type:      "refresh",
		IssuedAt:  time.Now().Add(-time.Minute).Unix(),
		ExpiresAt: time.Now().Add(time.Hour).Unix(),
	}, "reader-secret")
	if err != nil {
		t.Fatalf("IssueHS256JWT returned error: %v", err)
	}
	if err := LogoutReader(context.Background(), noIDToken); err != nil {
		t.Fatalf("LogoutReader without jti returned error: %v", err)
	}

	revokeToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
		ID:        "refresh-jti",
		Subject:   "reader-1",
		Type:      "refresh",
		IssuedAt:  time.Now().Add(-time.Minute).Unix(),
		ExpiresAt: time.Now().Add(time.Hour).Unix(),
	}, "reader-secret")
	if err != nil {
		t.Fatalf("IssueHS256JWT returned error: %v", err)
	}

	readerRefreshTokensRepository = stubReaderRefreshTokenRepository{
		revokeByJTI: func(context.Context, string, time.Time) error {
			return repository.ErrReaderRefreshTokenRepositoryUnavailable
		},
	}
	if err := LogoutReader(context.Background(), revokeToken); err == nil || !strings.Contains(err.Error(), readerSessionUnavailableText) {
		t.Fatalf("expected session unavailable error, got %v", err)
	}
}

func TestIssueReaderTokensErrorPaths(t *testing.T) {
	previousRefreshRepo := readerRefreshTokensRepository
	t.Cleanup(func() {
		readerRefreshTokensRepository = previousRefreshRepo
	})

	t.Setenv("JWT_SECRET", "reader-secret")

	_, err := issueReaderTokens(context.Background(), appconfig.ResolveReaderConfig(), &domain.ReaderUserRecord{}, "", false, ReaderSessionMetadata{})
	if err == nil || !strings.Contains(err.Error(), "reader id is not configured") {
		t.Fatalf("expected missing reader id error, got %v", err)
	}

	config := appconfig.ResolveReaderConfig()
	record := &domain.ReaderUserRecord{
		ReaderUser: domain.ReaderUser{
			ID:    "reader-1",
			Email: "reader@example.com",
		},
		SessionVersion: 2,
	}

	readerRefreshTokensRepository = stubReaderRefreshTokenRepository{
		create: func(context.Context, domain.ReaderRefreshTokenRecord) error {
			return repository.ErrReaderRefreshTokenRepositoryUnavailable
		},
	}
	if _, err := issueReaderTokens(context.Background(), config, record, "", false, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), readerSessionUnavailableText) {
		t.Fatalf("expected create session error, got %v", err)
	}

	readerRefreshTokensRepository = stubReaderRefreshTokenRepository{
		rotate: func(context.Context, string, domain.ReaderRefreshTokenRecord, time.Time) error {
			return repository.ErrReaderRefreshTokenNotFound
		},
	}
	if _, err := issueReaderTokens(context.Background(), config, record, "current-jti", true, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), readerInvalidSessionMessage) {
		t.Fatalf("expected invalid session error, got %v", err)
	}

	readerRefreshTokensRepository = stubReaderRefreshTokenRepository{
		rotate: func(context.Context, string, domain.ReaderRefreshTokenRecord, time.Time) error {
			return repository.ErrReaderRefreshTokenRepositoryUnavailable
		},
	}
	if _, err := issueReaderTokens(context.Background(), config, record, "current-jti", true, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), readerSessionUnavailableText) {
		t.Fatalf("expected rotated session error, got %v", err)
	}
}

func TestResolveReaderGithubIdentityFromCodeReturnsVerifiedIdentity(t *testing.T) {
	t.Setenv("GITHUB_CLIENT_ID", "client-id")
	t.Setenv("GITHUB_CLIENT_SECRET", "client-secret")

	previousClient := http.DefaultClient
	t.Cleanup(func() {
		http.DefaultClient = previousClient
	})

	http.DefaultClient = &http.Client{
		Transport: roundTripFunc(func(request *http.Request) (*http.Response, error) {
			switch request.URL.String() {
			case "https://github.com/login/oauth/access_token":
				return newJSONResponse(http.StatusOK, `{"access_token":"github-token"}`), nil
			case "https://api.github.com/user":
				return newJSONResponse(http.StatusOK, `{"id":7,"login":"reader.dev","name":"Reader Dev","avatar_url":"https://cdn.example.com/avatar.png"}`), nil
			case "https://api.github.com/user/emails":
				return newJSONResponse(http.StatusOK, `[{"email":"reader@example.com","primary":true,"verified":true}]`), nil
			default:
				t.Fatalf("unexpected request URL: %s", request.URL.String())
				return nil, nil
			}
		}),
	}

	identity, err := ResolveReaderGithubIdentityFromCode(context.Background(), "oauth-code", "https://example.com/callback")
	if err != nil {
		t.Fatalf("ResolveReaderGithubIdentityFromCode returned error: %v", err)
	}
	if identity == nil || identity.Subject != "7" || identity.Email != "reader@example.com" || !identity.EmailVerified {
		t.Fatalf("unexpected identity: %+v", identity)
	}
}

func TestResolveReaderGoogleIdentityFromCodeReturnsVerifiedIdentity(t *testing.T) {
	t.Setenv("GOOGLE_CLIENT_ID", "client-id")
	t.Setenv("GOOGLE_CLIENT_SECRET", "client-secret")

	previousClient := http.DefaultClient
	t.Cleanup(func() {
		http.DefaultClient = previousClient
	})

	http.DefaultClient = &http.Client{
		Transport: roundTripFunc(func(request *http.Request) (*http.Response, error) {
			switch request.URL.String() {
			case "https://oauth2.googleapis.com/token":
				return newJSONResponse(http.StatusOK, `{"access_token":"google-token"}`), nil
			case "https://openidconnect.googleapis.com/v1/userinfo":
				return newJSONResponse(http.StatusOK, `{"sub":"google-1","email":"reader@example.com","email_verified":true,"name":"Reader Name","picture":"https://cdn.example.com/avatar.png"}`), nil
			default:
				t.Fatalf("unexpected request URL: %s", request.URL.String())
				return nil, nil
			}
		}),
	}

	identity, err := ResolveReaderGoogleIdentityFromCode(context.Background(), "oauth-code", "https://example.com/callback")
	if err != nil {
		t.Fatalf("ResolveReaderGoogleIdentityFromCode returned error: %v", err)
	}
	if identity == nil || identity.Subject != "google-1" || identity.Email != "reader@example.com" || !identity.EmailVerified {
		t.Fatalf("unexpected identity: %+v", identity)
	}
}

func TestResolveReaderRecordForGithubCreatesReaderWhenMissing(t *testing.T) {
	previousUsersRepo := readerUsersRepository
	t.Cleanup(func() {
		readerUsersRepository = previousUsersRepo
	})

	var created domain.ReaderUserRecord
	readerUsersRepository = stubReaderUserRepository{
		findByGithubSubject: func(context.Context, string) (*domain.ReaderUserRecord, error) { return nil, nil },
		findByEmail:         func(context.Context, string) (*domain.ReaderUserRecord, error) { return nil, nil },
		create: func(_ context.Context, record domain.ReaderUserRecord) error {
			created = record
			return nil
		},
		findByID: func(_ context.Context, id string) (*domain.ReaderUserRecord, error) {
			return &domain.ReaderUserRecord{ReaderUser: created.ReaderUser, SessionVersion: created.SessionVersion}, nil
		},
	}

	record, err := resolveReaderRecordForGithub(context.Background(), &ReaderGithubIdentity{
		Subject:       "github-subject",
		Email:         "reader@example.com",
		EmailVerified: true,
		Name:          "Reader Name",
		AvatarURL:     "https://cdn.example.com/avatar.png",
	})
	if err != nil {
		t.Fatalf("resolveReaderRecordForGithub returned error: %v", err)
	}
	if record == nil || record.GithubSubject != "github-subject" {
		t.Fatalf("unexpected record: %+v", record)
	}
}

func TestResolveReaderRecordForGoogleUpdatesExistingReader(t *testing.T) {
	previousUsersRepo := readerUsersRepository
	t.Cleanup(func() {
		readerUsersRepository = previousUsersRepo
	})

	updated := false
	readerUsersRepository = stubReaderUserRepository{
		findByGoogleSubject: func(context.Context, string) (*domain.ReaderUserRecord, error) {
			return &domain.ReaderUserRecord{
				ReaderUser: domain.ReaderUser{
					ID:    "reader-1",
					Email: "reader@example.com",
				},
				SessionVersion: 1,
			}, nil
		},
		updateGoogleIdentity: func(_ context.Context, id, subject, email, name, avatarURL string, _ time.Time) error {
			updated = id == "reader-1" && subject == "google-subject" && email == "reader@example.com"
			return nil
		},
		findByID: func(_ context.Context, id string) (*domain.ReaderUserRecord, error) {
			return &domain.ReaderUserRecord{
				ReaderUser: domain.ReaderUser{
					ID:            id,
					Email:         "reader@example.com",
					GoogleSubject: "google-subject",
				},
				SessionVersion: 1,
			}, nil
		},
	}

	record, err := resolveReaderRecordForGoogle(context.Background(), &ReaderGoogleIdentity{
		Subject:       "google-subject",
		Email:         "reader@example.com",
		EmailVerified: true,
		Name:          "Reader Name",
		AvatarURL:     "https://cdn.example.com/avatar.png",
	})
	if err != nil {
		t.Fatalf("resolveReaderRecordForGoogle returned error: %v", err)
	}
	if !updated || record == nil || record.GoogleSubject != "google-subject" {
		t.Fatalf("unexpected update state: updated=%v record=%+v", updated, record)
	}
}

func TestResolveReaderRecordForGoogleCreatesReaderWhenMissing(t *testing.T) {
	previousUsersRepo := readerUsersRepository
	t.Cleanup(func() {
		readerUsersRepository = previousUsersRepo
	})

	var created domain.ReaderUserRecord
	readerUsersRepository = stubReaderUserRepository{
		findByGoogleSubject: func(context.Context, string) (*domain.ReaderUserRecord, error) { return nil, nil },
		findByEmail:         func(context.Context, string) (*domain.ReaderUserRecord, error) { return nil, nil },
		create: func(_ context.Context, record domain.ReaderUserRecord) error {
			created = record
			return nil
		},
		findByID: func(_ context.Context, id string) (*domain.ReaderUserRecord, error) {
			return &domain.ReaderUserRecord{ReaderUser: created.ReaderUser, SessionVersion: created.SessionVersion}, nil
		},
	}

	record, err := resolveReaderRecordForGoogle(context.Background(), &ReaderGoogleIdentity{
		Subject:       "google-subject",
		Email:         "reader@example.com",
		EmailVerified: true,
		Name:          "Reader Name",
		AvatarURL:     "https://cdn.example.com/avatar.png",
	})
	if err != nil {
		t.Fatalf("resolveReaderRecordForGoogle returned error: %v", err)
	}
	if record == nil || record.GoogleSubject != "google-subject" || created.LastLoginProvider != "google" {
		t.Fatalf("unexpected record: %+v created=%+v", record, created)
	}
}

func TestResolveReaderRecordForGithubUpdatesExistingReaderByEmail(t *testing.T) {
	previousUsersRepo := readerUsersRepository
	t.Cleanup(func() {
		readerUsersRepository = previousUsersRepo
	})

	updated := false
	readerUsersRepository = stubReaderUserRepository{
		findByGithubSubject: func(context.Context, string) (*domain.ReaderUserRecord, error) {
			return nil, nil
		},
		findByEmail: func(_ context.Context, email string) (*domain.ReaderUserRecord, error) {
			if email != "reader@example.com" {
				t.Fatalf("FindByEmail email = %q", email)
			}
			return &domain.ReaderUserRecord{
				ReaderUser: domain.ReaderUser{
					ID:    "reader-1",
					Email: email,
				},
				SessionVersion: 1,
			}, nil
		},
		updateGithubIdentity: func(_ context.Context, id, subject, email, name, avatarURL string, _ time.Time) error {
			updated = id == "reader-1" && subject == "github-subject" && email == "reader@example.com"
			return nil
		},
		findByID: func(_ context.Context, id string) (*domain.ReaderUserRecord, error) {
			return &domain.ReaderUserRecord{
				ReaderUser: domain.ReaderUser{
					ID:            id,
					Email:         "reader@example.com",
					GithubSubject: "github-subject",
				},
				SessionVersion: 1,
			}, nil
		},
	}

	record, err := resolveReaderRecordForGithub(context.Background(), &ReaderGithubIdentity{
		Subject:       "github-subject",
		Email:         "reader@example.com",
		EmailVerified: true,
		Name:          "Reader Name",
		AvatarURL:     "https://cdn.example.com/avatar.png",
	})
	if err != nil {
		t.Fatalf("resolveReaderRecordForGithub returned error: %v", err)
	}
	if !updated || record == nil || record.GithubSubject != "github-subject" {
		t.Fatalf("unexpected update state: updated=%v record=%+v", updated, record)
	}
}

func TestLoginReaderWithGithubIdentityIssuesTokens(t *testing.T) {
	t.Setenv("JWT_SECRET", "reader-secret")

	previousUsersRepo := readerUsersRepository
	previousRefreshRepo := readerRefreshTokensRepository
	t.Cleanup(func() {
		readerUsersRepository = previousUsersRepo
		readerRefreshTokensRepository = previousRefreshRepo
	})

	readerUsersRepository = stubReaderUserRepository{
		findByGithubSubject: func(_ context.Context, subject string) (*domain.ReaderUserRecord, error) {
			if subject != "github-subject" {
				t.Fatalf("FindByGithubSubject subject = %q", subject)
			}
			return &domain.ReaderUserRecord{
				ReaderUser: domain.ReaderUser{
					ID:            "reader-1",
					Email:         "reader@example.com",
					GithubSubject: "github-subject",
				},
				SessionVersion: 2,
			}, nil
		},
		updateGithubIdentity: func(_ context.Context, id, subject, email, name, avatarURL string, _ time.Time) error {
			if id != "reader-1" || subject != "github-subject" || email != "reader@example.com" {
				t.Fatalf("unexpected github update args: %q %q %q", id, subject, email)
			}
			return nil
		},
		findByID: func(_ context.Context, id string) (*domain.ReaderUserRecord, error) {
			return &domain.ReaderUserRecord{
				ReaderUser: domain.ReaderUser{
					ID:            id,
					Email:         "reader@example.com",
					GithubSubject: "github-subject",
				},
				SessionVersion: 2,
			}, nil
		},
	}

	created := false
	readerRefreshTokensRepository = stubReaderRefreshTokenRepository{
		create: func(_ context.Context, record domain.ReaderRefreshTokenRecord) error {
			created = strings.TrimSpace(record.JTI) != "" && record.UserID == "reader-1"
			return nil
		},
	}

	response, err := LoginReaderWithGithubIdentity(context.Background(), &ReaderGithubIdentity{
		Subject:       "github-subject",
		Email:         "reader@example.com",
		EmailVerified: true,
		Name:          "Reader Name",
		AvatarURL:     "https://cdn.example.com/avatar.png",
	}, true, ReaderSessionMetadata{RemoteIP: "203.0.113.10"})
	if err != nil {
		t.Fatalf("LoginReaderWithGithubIdentity returned error: %v", err)
	}
	if response == nil || response.AccessToken == "" || response.RefreshToken == "" || !created {
		t.Fatalf("unexpected github login response: %+v created=%v", response, created)
	}
}

func TestLoginReaderWithGoogleIdentityIssuesTokens(t *testing.T) {
	t.Setenv("JWT_SECRET", "reader-secret")

	previousUsersRepo := readerUsersRepository
	previousRefreshRepo := readerRefreshTokensRepository
	t.Cleanup(func() {
		readerUsersRepository = previousUsersRepo
		readerRefreshTokensRepository = previousRefreshRepo
	})

	readerUsersRepository = stubReaderUserRepository{
		findByGoogleSubject: func(_ context.Context, subject string) (*domain.ReaderUserRecord, error) {
			if subject != "google-subject" {
				t.Fatalf("FindByGoogleSubject subject = %q", subject)
			}
			return &domain.ReaderUserRecord{
				ReaderUser: domain.ReaderUser{
					ID:            "reader-1",
					Email:         "reader@example.com",
					GoogleSubject: "google-subject",
				},
				SessionVersion: 3,
			}, nil
		},
		updateGoogleIdentity: func(_ context.Context, id, subject, email, name, avatarURL string, _ time.Time) error {
			if id != "reader-1" || subject != "google-subject" || email != "reader@example.com" {
				t.Fatalf("unexpected google update args: %q %q %q", id, subject, email)
			}
			return nil
		},
		findByID: func(_ context.Context, id string) (*domain.ReaderUserRecord, error) {
			return &domain.ReaderUserRecord{
				ReaderUser: domain.ReaderUser{
					ID:            id,
					Email:         "reader@example.com",
					GoogleSubject: "google-subject",
				},
				SessionVersion: 3,
			}, nil
		},
	}

	created := false
	readerRefreshTokensRepository = stubReaderRefreshTokenRepository{
		create: func(_ context.Context, record domain.ReaderRefreshTokenRecord) error {
			created = strings.TrimSpace(record.JTI) != "" && record.UserID == "reader-1"
			return nil
		},
	}

	response, err := LoginReaderWithGoogleIdentity(context.Background(), &ReaderGoogleIdentity{
		Subject:       "google-subject",
		Email:         "reader@example.com",
		EmailVerified: true,
		Name:          "Reader Name",
		AvatarURL:     "https://cdn.example.com/avatar.png",
	}, false, ReaderSessionMetadata{RemoteIP: "203.0.113.10"})
	if err != nil {
		t.Fatalf("LoginReaderWithGoogleIdentity returned error: %v", err)
	}
	if response == nil || response.AccessToken == "" || response.RefreshToken == "" || !created {
		t.Fatalf("unexpected google login response: %+v created=%v", response, created)
	}
}

func TestReaderOAuthErrorPaths(t *testing.T) {
	t.Run("github identity invalid when no verified email", func(t *testing.T) {
		t.Setenv("GITHUB_CLIENT_ID", "client-id")
		t.Setenv("GITHUB_CLIENT_SECRET", "client-secret")

		previousClient := http.DefaultClient
		t.Cleanup(func() {
			http.DefaultClient = previousClient
		})

		http.DefaultClient = &http.Client{
			Transport: roundTripFunc(func(request *http.Request) (*http.Response, error) {
				switch request.URL.String() {
				case "https://github.com/login/oauth/access_token":
					return newJSONResponse(http.StatusOK, `{"access_token":"github-token"}`), nil
				case "https://api.github.com/user":
					return newJSONResponse(http.StatusOK, `{"id":7,"login":"reader.dev","avatar_url":"https://cdn.example.com/avatar.png"}`), nil
				case "https://api.github.com/user/emails":
					return newJSONResponse(http.StatusOK, `[{"email":"reader@example.com","primary":false,"verified":true}]`), nil
				default:
					t.Fatalf("unexpected request URL: %s", request.URL.String())
					return nil, nil
				}
			}),
		}

		_, err := ResolveReaderGithubIdentityFromCode(context.Background(), "oauth-code", "https://example.com/callback")
		if err == nil || !strings.Contains(err.Error(), readerGithubInvalidMessage) {
			t.Fatalf("expected github invalid account error, got %v", err)
		}
	})

	t.Run("google identity invalid when email is not verified", func(t *testing.T) {
		t.Setenv("GOOGLE_CLIENT_ID", "client-id")
		t.Setenv("GOOGLE_CLIENT_SECRET", "client-secret")

		previousClient := http.DefaultClient
		t.Cleanup(func() {
			http.DefaultClient = previousClient
		})

		http.DefaultClient = &http.Client{
			Transport: roundTripFunc(func(request *http.Request) (*http.Response, error) {
				switch request.URL.String() {
				case "https://oauth2.googleapis.com/token":
					return newJSONResponse(http.StatusOK, `{"access_token":"google-token"}`), nil
				case "https://openidconnect.googleapis.com/v1/userinfo":
					return newJSONResponse(http.StatusOK, `{"sub":"google-1","email":"reader@example.com","email_verified":false,"name":"Reader Name","picture":"https://cdn.example.com/avatar.png"}`), nil
				default:
					t.Fatalf("unexpected request URL: %s", request.URL.String())
					return nil, nil
				}
			}),
		}

		_, err := ResolveReaderGoogleIdentityFromCode(context.Background(), "oauth-code", "https://example.com/callback")
		if err == nil || !strings.Contains(err.Error(), readerGoogleInvalidMessage) {
			t.Fatalf("expected google invalid account error, got %v", err)
		}
	})

	t.Run("reader login requires valid identity and jwt config", func(t *testing.T) {
		if _, err := LoginReaderWithGithubIdentity(context.Background(), nil, false, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), readerGithubInvalidMessage) {
			t.Fatalf("expected github identity error, got %v", err)
		}
		if _, err := LoginReaderWithGoogleIdentity(context.Background(), nil, false, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), readerGoogleInvalidMessage) {
			t.Fatalf("expected google identity error, got %v", err)
		}
		if _, err := LoginReaderWithGithubIdentity(context.Background(), &ReaderGithubIdentity{
			Subject: "github-subject",
			Email:   "reader@example.com",
		}, false, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "reader jwt is not configured") {
			t.Fatalf("expected reader jwt config error, got %v", err)
		}
		if _, err := LoginReaderWithGoogleIdentity(context.Background(), &ReaderGoogleIdentity{
			Subject: "google-subject",
			Email:   "reader@example.com",
		}, false, ReaderSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "reader jwt is not configured") {
			t.Fatalf("expected reader jwt config error, got %v", err)
		}
	})
}

func TestReaderHelpersNormalizeDisplayNameAndSessionErrors(t *testing.T) {
	if got := normalizeReaderDisplayName(" ", "reader.dev@example.com"); got != "Reader Dev" {
		t.Fatalf("normalizeReaderDisplayName() = %q", got)
	}
	if got := normalizeReaderDisplayName("", "x@example.com"); got != "Reader" {
		t.Fatalf("normalizeReaderDisplayName(short) = %q", got)
	}

	serviceUnavailableErr := toReaderSessionError(repository.ErrReaderRefreshTokenRepositoryUnavailable)
	if serviceUnavailableErr == nil {
		t.Fatal("expected service unavailable error")
	}

	internalErr := toReaderSessionError(errors.New("boom"))
	if internalErr == nil {
		t.Fatal("expected internal error")
	}
}
