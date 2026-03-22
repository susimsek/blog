package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/httpauth"

	"golang.org/x/crypto/bcrypt"
)

type adminAuthSessionStubUserRepository struct {
	*adminAuthEmailChangeStubUserRepository
	findByIDFn          func(context.Context, string) (*domain.AdminUserRecord, error)
	findByEmailFn       func(context.Context, string) (*domain.AdminUserRecord, error)
	findByUsername      func(context.Context, string) (*domain.AdminUserRecord, error)
	findByGithubSubject func(context.Context, string) (*domain.AdminUserRecord, error)
	findByGoogleSubject func(context.Context, string) (*domain.AdminUserRecord, error)
	hasAnyGithubLink    func(context.Context) (bool, error)
	hasAnyGoogleLink    func(context.Context) (bool, error)
	updateUsername      func(context.Context, string, string) error
	updateName          func(context.Context, string, string) error
	updateAvatar        func(context.Context, string, string, string, int64) error
	updateGithubLink    func(context.Context, string, string, string, time.Time) error
	clearGithubLink     func(context.Context, string) error
	updateGoogleLink    func(context.Context, string, string, string, time.Time) error
	clearGoogleLink     func(context.Context, string) error
	disableByID         func(context.Context, string) error
}

func (stub *adminAuthSessionStubUserRepository) FindByID(
	ctx context.Context,
	id string,
) (*domain.AdminUserRecord, error) {
	if stub.findByIDFn != nil {
		return stub.findByIDFn(ctx, id)
	}

	return stub.adminAuthEmailChangeStubUserRepository.FindByID(ctx, id)
}

func (stub *adminAuthSessionStubUserRepository) FindByEmail(
	ctx context.Context,
	email string,
) (*domain.AdminUserRecord, error) {
	if stub.findByEmailFn != nil {
		return stub.findByEmailFn(ctx, email)
	}

	return stub.adminAuthEmailChangeStubUserRepository.FindByEmail(ctx, email)
}

func (stub *adminAuthSessionStubUserRepository) FindByUsername(
	ctx context.Context,
	username string,
) (*domain.AdminUserRecord, error) {
	if stub.findByUsername != nil {
		return stub.findByUsername(ctx, username)
	}

	return stub.adminAuthEmailChangeStubUserRepository.FindByUsername(ctx, username)
}

func (stub *adminAuthSessionStubUserRepository) FindByGithubSubject(
	ctx context.Context,
	subject string,
) (*domain.AdminUserRecord, error) {
	if stub.findByGithubSubject != nil {
		return stub.findByGithubSubject(ctx, subject)
	}

	return stub.adminAuthEmailChangeStubUserRepository.FindByGithubSubject(ctx, subject)
}

func (stub *adminAuthSessionStubUserRepository) FindByGoogleSubject(
	ctx context.Context,
	subject string,
) (*domain.AdminUserRecord, error) {
	if stub.findByGoogleSubject != nil {
		return stub.findByGoogleSubject(ctx, subject)
	}

	return stub.adminAuthEmailChangeStubUserRepository.FindByGoogleSubject(ctx, subject)
}

func (stub *adminAuthSessionStubUserRepository) HasAnyGithubLink(ctx context.Context) (bool, error) {
	if stub.hasAnyGithubLink != nil {
		return stub.hasAnyGithubLink(ctx)
	}

	return stub.adminAuthEmailChangeStubUserRepository.HasAnyGithubLink(ctx)
}

func (stub *adminAuthSessionStubUserRepository) HasAnyGoogleLink(ctx context.Context) (bool, error) {
	if stub.hasAnyGoogleLink != nil {
		return stub.hasAnyGoogleLink(ctx)
	}

	return stub.adminAuthEmailChangeStubUserRepository.HasAnyGoogleLink(ctx)
}

func (stub *adminAuthSessionStubUserRepository) UpdateUsernameByID(
	ctx context.Context,
	id, username string,
) error {
	if stub.updateUsername != nil {
		return stub.updateUsername(ctx, id, username)
	}

	return stub.adminAuthEmailChangeStubUserRepository.UpdateUsernameByID(ctx, id, username)
}

func (stub *adminAuthSessionStubUserRepository) UpdateNameByID(
	ctx context.Context,
	id, name string,
) error {
	if stub.updateName != nil {
		return stub.updateName(ctx, id, name)
	}

	return stub.adminAuthEmailChangeStubUserRepository.UpdateNameByID(ctx, id, name)
}

func (stub *adminAuthSessionStubUserRepository) UpdateAvatarByID(
	ctx context.Context,
	id, avatarURL, avatarDigest string,
	avatarVersion int64,
) error {
	if stub.updateAvatar != nil {
		return stub.updateAvatar(ctx, id, avatarURL, avatarDigest, avatarVersion)
	}

	return stub.adminAuthEmailChangeStubUserRepository.UpdateAvatarByID(ctx, id, avatarURL, avatarDigest, avatarVersion)
}

func (stub *adminAuthSessionStubUserRepository) UpdateGithubLinkByID(
	ctx context.Context,
	id, subject, email string,
	linkedAt time.Time,
) error {
	if stub.updateGithubLink != nil {
		return stub.updateGithubLink(ctx, id, subject, email, linkedAt)
	}

	return stub.adminAuthEmailChangeStubUserRepository.UpdateGithubLinkByID(ctx, id, subject, email, linkedAt)
}

func (stub *adminAuthSessionStubUserRepository) ClearGithubLinkByID(ctx context.Context, id string) error {
	if stub.clearGithubLink != nil {
		return stub.clearGithubLink(ctx, id)
	}

	return stub.adminAuthEmailChangeStubUserRepository.ClearGithubLinkByID(ctx, id)
}

func (stub *adminAuthSessionStubUserRepository) UpdateGoogleLinkByID(
	ctx context.Context,
	id, subject, email string,
	linkedAt time.Time,
) error {
	if stub.updateGoogleLink != nil {
		return stub.updateGoogleLink(ctx, id, subject, email, linkedAt)
	}

	return stub.adminAuthEmailChangeStubUserRepository.UpdateGoogleLinkByID(ctx, id, subject, email, linkedAt)
}

func (stub *adminAuthSessionStubUserRepository) ClearGoogleLinkByID(ctx context.Context, id string) error {
	if stub.clearGoogleLink != nil {
		return stub.clearGoogleLink(ctx, id)
	}

	return stub.adminAuthEmailChangeStubUserRepository.ClearGoogleLinkByID(ctx, id)
}

func (stub *adminAuthSessionStubUserRepository) DisableByID(ctx context.Context, id string) error {
	if stub.disableByID != nil {
		return stub.disableByID(ctx, id)
	}

	return stub.adminAuthEmailChangeStubUserRepository.DisableByID(ctx, id)
}

type adminAuthSessionStubRefreshRepository struct {
	create               func(context.Context, domain.AdminRefreshTokenRecord) error
	findActiveByToken    func(context.Context, string, string, time.Time) (*domain.AdminRefreshTokenRecord, error)
	listActiveByUser     func(context.Context, string, time.Time, int) ([]domain.AdminSessionRecord, error)
	rotate               func(context.Context, string, domain.AdminRefreshTokenRecord, time.Time) error
	revokeByJTIAndUserID func(context.Context, string, string, time.Time) (bool, error)
	revokeByJTI          func(context.Context, string, time.Time) error
	revokeAllByUserID    func(context.Context, string, time.Time) error
}

func (stub adminAuthSessionStubRefreshRepository) Create(ctx context.Context, record domain.AdminRefreshTokenRecord) error {
	if stub.create == nil {
		return nil
	}

	return stub.create(ctx, record)
}

func (stub adminAuthSessionStubRefreshRepository) FindActiveByToken(
	ctx context.Context,
	jti, rawToken string,
	now time.Time,
) (*domain.AdminRefreshTokenRecord, error) {
	if stub.findActiveByToken == nil {
		return nil, nil
	}

	return stub.findActiveByToken(ctx, jti, rawToken, now)
}

func (stub adminAuthSessionStubRefreshRepository) ListActiveByUserID(
	ctx context.Context,
	userID string,
	now time.Time,
	limit int,
) ([]domain.AdminSessionRecord, error) {
	if stub.listActiveByUser == nil {
		return nil, nil
	}

	return stub.listActiveByUser(ctx, userID, now, limit)
}

func (stub adminAuthSessionStubRefreshRepository) Rotate(
	ctx context.Context,
	currentJTI string,
	replacement domain.AdminRefreshTokenRecord,
	now time.Time,
) error {
	if stub.rotate == nil {
		return nil
	}

	return stub.rotate(ctx, currentJTI, replacement, now)
}

func (stub adminAuthSessionStubRefreshRepository) RevokeByJTIAndUserID(
	ctx context.Context,
	jti, userID string,
	now time.Time,
) (bool, error) {
	if stub.revokeByJTIAndUserID == nil {
		return false, nil
	}

	return stub.revokeByJTIAndUserID(ctx, jti, userID, now)
}

func (stub adminAuthSessionStubRefreshRepository) RevokeByJTI(
	ctx context.Context,
	jti string,
	now time.Time,
) error {
	if stub.revokeByJTI == nil {
		return nil
	}

	return stub.revokeByJTI(ctx, jti, now)
}

func (stub adminAuthSessionStubRefreshRepository) RevokeAllByUserID(
	ctx context.Context,
	userID string,
	now time.Time,
) error {
	if stub.revokeAllByUserID == nil {
		return nil
	}

	return stub.revokeAllByUserID(ctx, userID, now)
}

func TestLoginAdminIssuesTokens(t *testing.T) {
	t.Setenv("JWT_SECRET", "admin-secret")

	previousUsersRepo := adminUsersRepository
	previousRefreshRepo := adminRefreshTokensRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminRefreshTokensRepository = previousRefreshRepo
	})

	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte("admin-password"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("GenerateFromPassword returned error: %v", err)
	}

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:    "admin-1",
			Email: "admin@example.com",
			Roles: []string{"admin"},
		},
		PasswordHash:    string(passwordHashBytes),
		PasswordVersion: 4,
	}

	var created domain.AdminRefreshTokenRecord
	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
	}
	adminRefreshTokensRepository = adminAuthSessionStubRefreshRepository{
		create: func(_ context.Context, record domain.AdminRefreshTokenRecord) error {
			created = record
			return nil
		},
	}

	response, err := LoginAdmin(context.Background(), " admin@example.com ", "admin-password", true, AdminSessionMetadata{
		UserAgent:   "browser",
		RemoteIP:    "127.0.0.1",
		CountryCode: "tr",
	})
	if err != nil {
		t.Fatalf("LoginAdmin returned error: %v", err)
	}
	if response == nil || response.AccessToken == "" || response.RefreshToken == "" {
		t.Fatalf("unexpected response: %#v", response)
	}
	if !response.RememberMe || created.UserID != "admin-1" || !created.Persistent {
		t.Fatalf("unexpected refresh token record: %#v", created)
	}
}

func TestRefreshAdminSessionRotatesTokens(t *testing.T) {
	t.Setenv("JWT_SECRET", "admin-secret")

	previousUsersRepo := adminUsersRepository
	previousRefreshRepo := adminRefreshTokensRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminRefreshTokensRepository = previousRefreshRepo
	})

	refreshToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
		ID:              "refresh-jti",
		Subject:         "admin-1",
		Type:            "refresh",
		PasswordVersion: 2,
		IssuedAt:        time.Now().Add(-time.Minute).Unix(),
		ExpiresAt:       time.Now().Add(time.Hour).Unix(),
	}, "admin-secret")
	if err != nil {
		t.Fatalf("IssueHS256JWT returned error: %v", err)
	}

	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(&domain.AdminUserRecord{
			AdminUser: domain.AdminUser{
				ID:    "admin-1",
				Email: "admin@example.com",
				Roles: []string{"admin"},
			},
			PasswordVersion: 2,
		}),
	}

	var rotatedTo string
	adminRefreshTokensRepository = adminAuthSessionStubRefreshRepository{
		findActiveByToken: func(_ context.Context, jti, rawToken string, _ time.Time) (*domain.AdminRefreshTokenRecord, error) {
			if jti != "refresh-jti" || rawToken != refreshToken {
				t.Fatalf("FindActiveByToken args = %q %q", jti, rawToken)
			}
			return &domain.AdminRefreshTokenRecord{
				JTI:        jti,
				UserID:     "admin-1",
				Persistent: true,
			}, nil
		},
		rotate: func(_ context.Context, currentJTI string, replacement domain.AdminRefreshTokenRecord, _ time.Time) error {
			if currentJTI != "refresh-jti" {
				t.Fatalf("Rotate currentJTI = %q", currentJTI)
			}
			rotatedTo = replacement.JTI
			return nil
		},
	}

	response, err := RefreshAdminSession(context.Background(), refreshToken, AdminSessionMetadata{})
	if err != nil {
		t.Fatalf("RefreshAdminSession returned error: %v", err)
	}
	if response == nil || response.AccessToken == "" || response.RefreshToken == "" {
		t.Fatalf("unexpected response: %#v", response)
	}
	if rotatedTo == "" {
		t.Fatal("expected token rotation")
	}
}

func TestLogoutAdminRevokesRefreshToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "admin-secret")

	previousRefreshRepo := adminRefreshTokensRepository
	t.Cleanup(func() {
		adminRefreshTokensRepository = previousRefreshRepo
	})

	refreshToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
		ID:        "refresh-jti",
		Subject:   "admin-1",
		Type:      "refresh",
		IssuedAt:  time.Now().Add(-time.Minute).Unix(),
		ExpiresAt: time.Now().Add(time.Hour).Unix(),
	}, "admin-secret")
	if err != nil {
		t.Fatalf("IssueHS256JWT returned error: %v", err)
	}

	var revokedJTI string
	adminRefreshTokensRepository = adminAuthSessionStubRefreshRepository{
		revokeByJTI: func(_ context.Context, jti string, _ time.Time) error {
			revokedJTI = jti
			return nil
		},
	}

	if err := LogoutAdmin(context.Background(), refreshToken); err != nil {
		t.Fatalf("LogoutAdmin returned error: %v", err)
	}
	if revokedJTI != "refresh-jti" {
		t.Fatalf("expected refresh-jti, got %q", revokedJTI)
	}
}

func TestChangeAdminPasswordUpdatesHashAndRevokesSessions(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousRefreshRepo := adminRefreshTokensRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminRefreshTokensRepository = previousRefreshRepo
	})

	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte("current-password"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("GenerateFromPassword returned error: %v", err)
	}

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:    "admin-1",
			Email: "admin@example.com",
		},
		PasswordHash:    string(passwordHashBytes),
		PasswordVersion: 1,
	}

	repo := &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
	}
	adminUsersRepository = repo

	var revokedUserID string
	adminRefreshTokensRepository = adminAuthSessionStubRefreshRepository{
		revokeAllByUserID: func(_ context.Context, userID string, _ time.Time) error {
			revokedUserID = userID
			return nil
		},
	}

	err = ChangeAdminPassword(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		"current-password",
		"next-password",
		"next-password",
	)
	if err != nil {
		t.Fatalf("ChangeAdminPassword returned error: %v", err)
	}
	if revokedUserID != "admin-1" {
		t.Fatalf("expected revoked user admin-1, got %q", revokedUserID)
	}
	if compareErr := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte("next-password")); compareErr != nil {
		t.Fatalf("expected password hash update, got %v", compareErr)
	}
}

func TestChangeAdminUsernameUpdatesAndReloadsUser(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
	})

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:       "admin-1",
			Username: "old-name",
			Email:    "admin@example.com",
		},
	}

	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
		updateUsername: func(_ context.Context, id, username string) error {
			user.Username = username
			return nil
		},
	}

	updated, err := ChangeAdminUsername(context.Background(), &domain.AdminUser{ID: "admin-1"}, "new-name")
	if err != nil {
		t.Fatalf("ChangeAdminUsername returned error: %v", err)
	}
	if updated == nil || updated.Username != "new-name" {
		t.Fatalf("unexpected updated user: %#v", updated)
	}
}

func TestChangeAdminNameUpdatesAndReloadsUser(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
	})

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:    "admin-1",
			Name:  "Old Name",
			Email: "admin@example.com",
		},
	}

	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
		updateName: func(_ context.Context, id, name string) error {
			if id != "admin-1" {
				t.Fatalf("UpdateNameByID id = %q", id)
			}
			user.Name = name
			return nil
		},
	}

	updated, err := ChangeAdminName(context.Background(), &domain.AdminUser{ID: "admin-1"}, "  New Name  ")
	if err != nil {
		t.Fatalf("ChangeAdminName returned error: %v", err)
	}
	if updated == nil || updated.Name != "New Name" {
		t.Fatalf("unexpected updated user: %#v", updated)
	}
}

func TestDeleteAdminAccountDisablesUserAndRevokesSessions(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousRefreshRepo := adminRefreshTokensRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminRefreshTokensRepository = previousRefreshRepo
	})

	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte("current-password"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("GenerateFromPassword returned error: %v", err)
	}

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:    "admin-1",
			Email: "admin@example.com",
		},
		PasswordHash: string(passwordHashBytes),
	}

	disabled := false
	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
		disableByID: func(_ context.Context, id string) error {
			if id != "admin-1" {
				t.Fatalf("DisableByID id = %q", id)
			}
			disabled = true
			return nil
		},
	}

	revoked := false
	adminRefreshTokensRepository = adminAuthSessionStubRefreshRepository{
		revokeAllByUserID: func(_ context.Context, userID string, _ time.Time) error {
			revoked = userID == "admin-1"
			return nil
		},
	}

	if err := DeleteAdminAccount(context.Background(), &domain.AdminUser{ID: "admin-1"}, "current-password"); err != nil {
		t.Fatalf("DeleteAdminAccount returned error: %v", err)
	}
	if !disabled || !revoked {
		t.Fatalf("expected disable and revoke, got disabled=%v revoked=%v", disabled, revoked)
	}
}

func TestAdminSessionAndProfileOperationsRejectInvalidState(t *testing.T) {
	t.Run("profile auth required", func(t *testing.T) {
		if _, err := ChangeAdminName(context.Background(), nil, "Name"); err == nil {
			t.Fatal("expected ChangeAdminName auth error")
		}
		if _, err := ChangeAdminUsername(context.Background(), nil, "username"); err == nil {
			t.Fatal("expected ChangeAdminUsername auth error")
		}
	})

	t.Run("username already exists", func(t *testing.T) {
		previousUsersRepo := adminUsersRepository
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
		})

		user := &domain.AdminUserRecord{
			AdminUser: domain.AdminUser{
				ID:       "admin-1",
				Username: "old-name",
			},
		}

		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
			updateUsername: func(context.Context, string, string) error {
				return repository.ErrAdminUsernameAlreadyExists
			},
		}

		if _, err := ChangeAdminUsername(context.Background(), &domain.AdminUser{ID: "admin-1"}, "taken-name"); err == nil || err.Error() != "username is already in use" {
			t.Fatalf("expected duplicate username error, got %v", err)
		}
	})

	t.Run("delete account invalid password and auth checks", func(t *testing.T) {
		previousUsersRepo := adminUsersRepository
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
		})

		passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte("current-password"), bcrypt.DefaultCost)
		if err != nil {
			t.Fatalf("GenerateFromPassword returned error: %v", err)
		}

		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(&domain.AdminUserRecord{
				AdminUser:    domain.AdminUser{ID: "admin-1"},
				PasswordHash: string(passwordHashBytes),
			}),
		}

		if err := DeleteAdminAccount(context.Background(), nil, "current-password"); err == nil {
			t.Fatal("expected DeleteAdminAccount auth error")
		}
		if err := DeleteAdminAccount(context.Background(), &domain.AdminUser{ID: "admin-1"}, ""); err == nil {
			t.Fatal("expected DeleteAdminAccount password required error")
		}
		if err := DeleteAdminAccount(context.Background(), &domain.AdminUser{ID: "admin-1"}, "wrong-password"); err == nil || err.Error() != "current password is incorrect" {
			t.Fatalf("expected incorrect password error, got %v", err)
		}
	})

	t.Run("session auth required", func(t *testing.T) {
		if _, err := ListActiveAdminSessions(context.Background(), nil); err == nil {
			t.Fatal("expected ListActiveAdminSessions auth error")
		}
		if _, err := RevokeAdminSession(context.Background(), nil, "session-1"); err == nil {
			t.Fatal("expected RevokeAdminSession auth error")
		}
		if err := RevokeAllAdminSessions(context.Background(), nil); err == nil {
			t.Fatal("expected RevokeAllAdminSessions auth error")
		}
	})
}

func TestResolveAdminFromAccessTokenFallsBackToUsername(t *testing.T) {
	t.Setenv("JWT_SECRET", "admin-secret")

	previousUsersRepo := adminUsersRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
	})

	token, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
		Subject:         "legacy-user",
		Email:           "admin@example.com",
		Type:            "access",
		PasswordVersion: 7,
		IssuedAt:        time.Now().Add(-time.Minute).Unix(),
		ExpiresAt:       time.Now().Add(time.Hour).Unix(),
	}, "admin-secret")
	if err != nil {
		t.Fatalf("IssueHS256JWT returned error: %v", err)
	}

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:       "admin-1",
			Username: "legacy-user",
			Email:    "admin@example.com",
		},
		PasswordVersion: 7,
	}
	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
		findByUsername: func(_ context.Context, username string) (*domain.AdminUserRecord, error) {
			if username != "legacy-user" {
				t.Fatalf("FindByUsername username = %q", username)
			}
			return user, nil
		},
	}

	resolved, err := ResolveAdminFromAccessToken(context.Background(), token)
	if err != nil {
		t.Fatalf("ResolveAdminFromAccessToken returned error: %v", err)
	}
	if resolved == nil || resolved.ID != "admin-1" {
		t.Fatalf("unexpected resolved user: %#v", resolved)
	}
}

func TestAdminSessionHelpersReturnRepositoryResults(t *testing.T) {
	previousRefreshRepo := adminRefreshTokensRepository
	t.Cleanup(func() {
		adminRefreshTokensRepository = previousRefreshRepo
	})

	adminRefreshTokensRepository = adminAuthSessionStubRefreshRepository{
		listActiveByUser: func(_ context.Context, userID string, _ time.Time, limit int) ([]domain.AdminSessionRecord, error) {
			if userID != "admin-1" || limit != maxActiveAdminSessions {
				t.Fatalf("ListActiveByUserID args = %q %d", userID, limit)
			}
			return []domain.AdminSessionRecord{{ID: "session-1"}}, nil
		},
		revokeByJTIAndUserID: func(_ context.Context, jti, userID string, _ time.Time) (bool, error) {
			return jti == "session-1" && userID == "admin-1", nil
		},
		revokeAllByUserID: func(_ context.Context, userID string, _ time.Time) error {
			if userID != "admin-1" {
				t.Fatalf("RevokeAllByUserID userID = %q", userID)
			}
			return nil
		},
	}

	sessions, err := ListActiveAdminSessions(context.Background(), &domain.AdminUser{ID: "admin-1"})
	if err != nil {
		t.Fatalf("ListActiveAdminSessions returned error: %v", err)
	}
	if len(sessions) != 1 || sessions[0].ID != "session-1" {
		t.Fatalf("unexpected sessions: %#v", sessions)
	}

	revoked, err := RevokeAdminSession(context.Background(), &domain.AdminUser{ID: "admin-1"}, "session-1")
	if err != nil {
		t.Fatalf("RevokeAdminSession returned error: %v", err)
	}
	if !revoked {
		t.Fatal("expected session revocation")
	}

	if err := RevokeAllAdminSessions(context.Background(), &domain.AdminUser{ID: "admin-1"}); err != nil {
		t.Fatalf("RevokeAllAdminSessions returned error: %v", err)
	}
}

func TestToAdminSessionErrorMapsRepositoryUnavailable(t *testing.T) {
	appErr := toAdminSessionError(repository.ErrAdminRefreshTokenRepositoryUnavailable)
	if appErr == nil || !errors.Is(appErr, repository.ErrAdminRefreshTokenRepositoryUnavailable) {
		t.Fatalf("expected wrapped repository error, got %v", appErr)
	}
}

func TestAdminAuthSessionErrorPaths(t *testing.T) {
	t.Setenv("JWT_SECRET", "admin-secret")

	t.Run("LoginAdmin rejects invalid credentials", func(t *testing.T) {
		previousUsersRepo := adminUsersRepository
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
		})

		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(nil),
		}

		if _, err := LoginAdmin(context.Background(), "missing@example.com", "password", false, AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "invalid credentials") {
			t.Fatalf("expected invalid credentials error, got %v", err)
		}
	})

	t.Run("RefreshAdminSession rejects missing persisted session", func(t *testing.T) {
		previousUsersRepo := adminUsersRepository
		previousRefreshRepo := adminRefreshTokensRepository
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
			adminRefreshTokensRepository = previousRefreshRepo
		})

		refreshToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			ID:              "refresh-jti",
			Subject:         "admin-1",
			Type:            "refresh",
			PasswordVersion: 2,
			IssuedAt:        time.Now().Add(-time.Minute).Unix(),
			ExpiresAt:       time.Now().Add(time.Hour).Unix(),
		}, "admin-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}

		adminRefreshTokensRepository = adminAuthSessionStubRefreshRepository{
			findActiveByToken: func(context.Context, string, string, time.Time) (*domain.AdminRefreshTokenRecord, error) {
				return nil, nil
			},
		}

		if _, err := RefreshAdminSession(context.Background(), refreshToken, AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "invalid admin session") {
			t.Fatalf("expected invalid session error, got %v", err)
		}
	})

	t.Run("LogoutAdmin ignores invalid token", func(t *testing.T) {
		if err := LogoutAdmin(context.Background(), "not-a-jwt"); err != nil {
			t.Fatalf("expected invalid token to be ignored, got %v", err)
		}
	})

	t.Run("ChangeAdminPassword validates auth and password rules", func(t *testing.T) {
		previousUsersRepo := adminUsersRepository
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
		})

		passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte("current-password"), bcrypt.DefaultCost)
		if err != nil {
			t.Fatalf("GenerateFromPassword returned error: %v", err)
		}

		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(&domain.AdminUserRecord{
				AdminUser:    domain.AdminUser{ID: "admin-1"},
				PasswordHash: string(passwordHashBytes),
			}),
		}

		if err := ChangeAdminPassword(context.Background(), nil, "current-password", "next-password", "next-password"); err == nil || !strings.Contains(err.Error(), adminAuthRequiredMessage) {
			t.Fatalf("expected auth error, got %v", err)
		}
		if err := ChangeAdminPassword(context.Background(), &domain.AdminUser{ID: "admin-1"}, "current-password", "short", "short"); err == nil || !strings.Contains(err.Error(), "at least 8 characters") {
			t.Fatalf("expected length error, got %v", err)
		}
		if err := ChangeAdminPassword(context.Background(), &domain.AdminUser{ID: "admin-1"}, "current-password", "next-password", "different"); err == nil || !strings.Contains(err.Error(), "does not match") {
			t.Fatalf("expected confirmation error, got %v", err)
		}
		if err := ChangeAdminPassword(context.Background(), &domain.AdminUser{ID: "admin-1"}, "current-password", "current-password", "current-password"); err == nil || !strings.Contains(err.Error(), "must be different") {
			t.Fatalf("expected same password error, got %v", err)
		}
	})
}

func TestAdminAuthProfileAndAccessTokenFallbacks(t *testing.T) {
	t.Run("profile validation errors", func(t *testing.T) {
		previousUsersRepo := adminUsersRepository
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
		})

		user := &domain.AdminUserRecord{
			AdminUser: domain.AdminUser{
				ID:       "admin-1",
				Username: "old-name",
				Name:     "Old Name",
			},
		}
		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
		}

		if _, err := ChangeAdminUsername(context.Background(), &domain.AdminUser{ID: "admin-1"}, "ab"); err == nil {
			t.Fatal("expected username length error")
		}
		if _, err := ChangeAdminUsername(context.Background(), &domain.AdminUser{ID: "admin-1"}, "bad name"); err == nil {
			t.Fatal("expected username pattern error")
		}
		if _, err := ChangeAdminUsername(context.Background(), &domain.AdminUser{ID: "admin-1"}, "old-name"); err == nil {
			t.Fatal("expected same username rejection")
		}
		if _, err := ChangeAdminName(context.Background(), &domain.AdminUser{ID: "admin-1"}, "a"); err == nil {
			t.Fatal("expected short name error")
		}
	})

	t.Run("resolve access token handles missing config invalid token and email fallback", func(t *testing.T) {
		previousUsersRepo := adminUsersRepository
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
		})

		if user, err := ResolveAdminFromAccessToken(context.Background(), "anything"); err != nil || user != nil {
			t.Fatalf("expected nil without jwt config, got user=%#v err=%v", user, err)
		}

		t.Setenv("JWT_SECRET", "admin-secret")
		if user, err := ResolveAdminFromAccessToken(context.Background(), "not-a-jwt"); err != nil || user != nil {
			t.Fatalf("expected nil for invalid token, got user=%#v err=%v", user, err)
		}

		token, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			Subject:         "old-subject",
			Email:           "admin@example.com",
			Type:            "access",
			PasswordVersion: 7,
			IssuedAt:        time.Now().Add(-time.Minute).Unix(),
			ExpiresAt:       time.Now().Add(time.Hour).Unix(),
		}, "admin-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}

		userRecord := &domain.AdminUserRecord{
			AdminUser: domain.AdminUser{
				ID:       "admin-1",
				Username: "new-subject",
				Email:    "admin@example.com",
			},
			PasswordVersion: 7,
		}
		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(userRecord),
			findByUsername: func(context.Context, string) (*domain.AdminUserRecord, error) {
				return nil, nil
			},
		}

		user, err := ResolveAdminFromAccessToken(context.Background(), token)
		if err != nil {
			t.Fatalf("ResolveAdminFromAccessToken fallback returned error: %v", err)
		}
		if user == nil || user.ID != "admin-1" {
			t.Fatalf("unexpected resolved user: %#v", user)
		}
	})

	t.Run("refresh session rejects token without jti", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "admin-secret")
		token, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			Subject:         "admin-1",
			Type:            "refresh",
			PasswordVersion: 1,
			IssuedAt:        time.Now().Add(-time.Minute).Unix(),
			ExpiresAt:       time.Now().Add(time.Hour).Unix(),
		}, "admin-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}
		if _, err := RefreshAdminSession(context.Background(), token, AdminSessionMetadata{}); err == nil {
			t.Fatal("expected invalid admin session error")
		}
	})
}

func TestAdminAuthHelperAndSessionErrorPaths(t *testing.T) {
	t.Run("login maps config and repository errors", func(t *testing.T) {
		previousUsersRepo := adminUsersRepository
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
		})

		if _, err := LoginAdmin(context.Background(), "admin@example.com", "password", false, AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "admin jwt is not configured") {
			t.Fatalf("expected jwt config error, got %v", err)
		}

		t.Setenv("JWT_SECRET", "admin-secret")
		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(nil),
			findByEmailFn: func(context.Context, string) (*domain.AdminUserRecord, error) {
				return nil, errors.New("db down")
			},
		}
		if _, err := LoginAdmin(context.Background(), "admin@example.com", "password", false, AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), adminLoadAdminUserMessage) {
			t.Fatalf("expected load admin user error, got %v", err)
		}
	})

	t.Run("refresh session maps repository and user validation failures", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "admin-secret")

		previousUsersRepo := adminUsersRepository
		previousRefreshRepo := adminRefreshTokensRepository
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
			adminRefreshTokensRepository = previousRefreshRepo
		})

		makeToken := func(jti string, version int) string {
			t.Helper()
			token, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
				ID:              jti,
				Subject:         "admin-1",
				Type:            "refresh",
				PasswordVersion: int64(version),
				IssuedAt:        time.Now().Add(-time.Minute).Unix(),
				ExpiresAt:       time.Now().Add(time.Hour).Unix(),
			}, "admin-secret")
			if err != nil {
				t.Fatalf("IssueHS256JWT returned error: %v", err)
			}
			return token
		}

		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(nil),
			findByIDFn: func(_ context.Context, id string) (*domain.AdminUserRecord, error) {
				switch id {
				case "admin-error":
					return nil, errors.New("db down")
				case "admin-missing":
					return nil, nil
				case "admin-mismatch":
					return &domain.AdminUserRecord{
						AdminUser:       domain.AdminUser{ID: "admin-mismatch"},
						PasswordVersion: 1,
					}, nil
				case "admin-userid-mismatch":
					return &domain.AdminUserRecord{
						AdminUser:       domain.AdminUser{ID: "admin-actual"},
						PasswordVersion: 3,
					}, nil
				default:
					return &domain.AdminUserRecord{
						AdminUser:       domain.AdminUser{ID: id},
						PasswordVersion: 3,
					}, nil
				}
			},
		}
		adminRefreshTokensRepository = adminAuthSessionStubRefreshRepository{
			findActiveByToken: func(_ context.Context, jti, rawToken string, _ time.Time) (*domain.AdminRefreshTokenRecord, error) {
				switch jti {
				case "repo-error":
					return nil, repository.ErrAdminRefreshTokenRepositoryUnavailable
				case "empty-user":
					return &domain.AdminRefreshTokenRecord{JTI: jti, UserID: " "}, nil
				case "user-error":
					return &domain.AdminRefreshTokenRecord{JTI: jti, UserID: "admin-error"}, nil
				case "user-missing":
					return &domain.AdminRefreshTokenRecord{JTI: jti, UserID: "admin-missing"}, nil
				case "password-mismatch":
					return &domain.AdminRefreshTokenRecord{JTI: jti, UserID: "admin-mismatch"}, nil
				case "userid-mismatch":
					return &domain.AdminRefreshTokenRecord{JTI: jti, UserID: "admin-userid-mismatch"}, nil
				default:
					return nil, nil
				}
			},
		}

		if _, err := RefreshAdminSession(context.Background(), makeToken("repo-error", 3), AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "admin session storage is unavailable") {
			t.Fatalf("expected session storage error, got %v", err)
		}
		if _, err := RefreshAdminSession(context.Background(), makeToken("empty-user", 3), AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "invalid admin session") {
			t.Fatalf("expected invalid session for empty user id, got %v", err)
		}
		if _, err := RefreshAdminSession(context.Background(), makeToken("user-error", 3), AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), adminLoadAdminUserMessage) {
			t.Fatalf("expected load admin user error, got %v", err)
		}
		if _, err := RefreshAdminSession(context.Background(), makeToken("user-missing", 3), AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "invalid admin session") {
			t.Fatalf("expected invalid session for missing user, got %v", err)
		}
		if _, err := RefreshAdminSession(context.Background(), makeToken("password-mismatch", 3), AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "invalid admin session") {
			t.Fatalf("expected invalid session for password mismatch, got %v", err)
		}
		if _, err := RefreshAdminSession(context.Background(), makeToken("userid-mismatch", 3), AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "invalid admin session") {
			t.Fatalf("expected invalid session for user id mismatch, got %v", err)
		}
	})

	t.Run("logout and session helpers map repository failures", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "admin-secret")

		previousRefreshRepo := adminRefreshTokensRepository
		t.Cleanup(func() {
			adminRefreshTokensRepository = previousRefreshRepo
		})

		refreshToken, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
			ID:        "refresh-jti",
			Subject:   "admin-1",
			Type:      "refresh",
			IssuedAt:  time.Now().Add(-time.Minute).Unix(),
			ExpiresAt: time.Now().Add(time.Hour).Unix(),
		}, "admin-secret")
		if err != nil {
			t.Fatalf("IssueHS256JWT returned error: %v", err)
		}

		adminRefreshTokensRepository = adminAuthSessionStubRefreshRepository{
			revokeByJTI: func(context.Context, string, time.Time) error {
				return repository.ErrAdminRefreshTokenRepositoryUnavailable
			},
			listActiveByUser: func(context.Context, string, time.Time, int) ([]domain.AdminSessionRecord, error) {
				return nil, repository.ErrAdminRefreshTokenRepositoryUnavailable
			},
			revokeByJTIAndUserID: func(context.Context, string, string, time.Time) (bool, error) {
				return false, repository.ErrAdminRefreshTokenRepositoryUnavailable
			},
			revokeAllByUserID: func(context.Context, string, time.Time) error {
				return repository.ErrAdminRefreshTokenRepositoryUnavailable
			},
		}

		if err := LogoutAdmin(context.Background(), refreshToken); err == nil || !strings.Contains(err.Error(), "admin session storage is unavailable") {
			t.Fatalf("expected logout storage error, got %v", err)
		}
		if _, err := ListActiveAdminSessions(context.Background(), &domain.AdminUser{ID: "admin-1"}); err == nil || !strings.Contains(err.Error(), "admin session storage is unavailable") {
			t.Fatalf("expected list sessions storage error, got %v", err)
		}
		if _, err := RevokeAdminSession(context.Background(), &domain.AdminUser{ID: "admin-1"}, " "); err == nil || !strings.Contains(err.Error(), "session id is required") {
			t.Fatalf("expected session id required error, got %v", err)
		}
		if _, err := RevokeAdminSession(context.Background(), &domain.AdminUser{ID: "admin-1"}, "session-1"); err == nil || !strings.Contains(err.Error(), "admin session storage is unavailable") {
			t.Fatalf("expected revoke session storage error, got %v", err)
		}
		if err := RevokeAllAdminSessions(context.Background(), &domain.AdminUser{ID: "admin-1"}); err == nil || !strings.Contains(err.Error(), "admin session storage is unavailable") {
			t.Fatalf("expected revoke all storage error, got %v", err)
		}
	})

	t.Run("helper functions map user and password failures", func(t *testing.T) {
		passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte("current-password"), bcrypt.DefaultCost)
		if err != nil {
			t.Fatalf("GenerateFromPassword returned error: %v", err)
		}

		previousUsersRepo := adminUsersRepository
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
		})

		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(nil),
			findByIDFn: func(_ context.Context, id string) (*domain.AdminUserRecord, error) {
				switch id {
				case "error":
					return nil, errors.New("db down")
				case "missing":
					return nil, nil
				default:
					return &domain.AdminUserRecord{
						AdminUser:    domain.AdminUser{ID: id},
						PasswordHash: string(passwordHashBytes),
					}, nil
				}
			},
		}

		if _, err := loadAdminUserRecord(context.Background(), "error"); err == nil || !strings.Contains(err.Error(), adminLoadAdminUserMessage) {
			t.Fatalf("expected load user error, got %v", err)
		}
		if _, err := loadAdminUserRecord(context.Background(), "missing"); err == nil || !strings.Contains(err.Error(), adminAuthRequiredMessage) {
			t.Fatalf("expected auth required from missing user, got %v", err)
		}
		if _, err := reloadAdminUser(context.Background(), "error"); err == nil || !strings.Contains(err.Error(), adminLoadAdminUserMessage) {
			t.Fatalf("expected reload user error, got %v", err)
		}
		if err := validateAdminCurrentPassword(&domain.AdminUserRecord{PasswordHash: string(passwordHashBytes)}, "wrong-password"); err == nil || !strings.Contains(err.Error(), adminCurrentPasswordIncorrectMessage) {
			t.Fatalf("expected current password validation error, got %v", err)
		}
		if err := validateAdminCurrentPassword(&domain.AdminUserRecord{PasswordHash: string(passwordHashBytes)}, "current-password"); err != nil {
			t.Fatalf("expected valid current password, got %v", err)
		}
	})

	t.Run("change name delete account and issue tokens error paths", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "admin-secret")

		previousUsersRepo := adminUsersRepository
		previousRefreshRepo := adminRefreshTokensRepository
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
			adminRefreshTokensRepository = previousRefreshRepo
		})

		passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte("current-password"), bcrypt.DefaultCost)
		if err != nil {
			t.Fatalf("GenerateFromPassword returned error: %v", err)
		}

		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(&domain.AdminUserRecord{
				AdminUser: domain.AdminUser{
					ID:    "admin-1",
					Name:  "Old Name",
					Email: "admin@example.com",
				},
				PasswordHash:    string(passwordHashBytes),
				PasswordVersion: 2,
			}),
			updateName: func(context.Context, string, string) error {
				return repository.ErrAdminUserNotFound
			},
			disableByID: func(context.Context, string) error {
				return repository.ErrAdminUserNotFound
			},
		}
		adminRefreshTokensRepository = adminAuthSessionStubRefreshRepository{
			revokeAllByUserID: func(context.Context, string, time.Time) error {
				return repository.ErrAdminRefreshTokenRepositoryUnavailable
			},
			create: func(context.Context, domain.AdminRefreshTokenRecord) error {
				return repository.ErrAdminRefreshTokenRepositoryUnavailable
			},
			rotate: func(context.Context, string, domain.AdminRefreshTokenRecord, time.Time) error {
				return repository.ErrAdminRefreshTokenNotFound
			},
		}

		if _, err := ChangeAdminName(context.Background(), &domain.AdminUser{ID: "admin-1"}, "Valid Name"); err == nil || !strings.Contains(err.Error(), adminAuthRequiredMessage) {
			t.Fatalf("expected unauthorized from change name update, got %v", err)
		}
		if err := DeleteAdminAccount(context.Background(), &domain.AdminUser{ID: "admin-1"}, "current-password"); err == nil || !strings.Contains(err.Error(), adminAuthRequiredMessage) {
			t.Fatalf("expected unauthorized from disable not found, got %v", err)
		}

		config := appconfig.ResolveAdminConfig()
		if _, err := issueAdminTokens(context.Background(), config, &domain.AdminUserRecord{}, "", false, AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "admin id is not configured") {
			t.Fatalf("expected admin id config error, got %v", err)
		}
		if _, err := issueAdminTokens(context.Background(), config, &domain.AdminUserRecord{
			AdminUser:       domain.AdminUser{ID: "admin-1", Email: "admin@example.com"},
			PasswordVersion: 2,
		}, "", false, AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "admin session storage is unavailable") {
			t.Fatalf("expected token create storage error, got %v", err)
		}
		if _, err := issueAdminTokens(context.Background(), config, &domain.AdminUserRecord{
			AdminUser:       domain.AdminUser{ID: "admin-1", Email: "admin@example.com"},
			PasswordVersion: 2,
		}, "current-jti", true, AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "invalid admin session") {
			t.Fatalf("expected rotate invalid session error, got %v", err)
		}

		adminRefreshTokensRepository = adminAuthSessionStubRefreshRepository{
			rotate: func(context.Context, string, domain.AdminRefreshTokenRecord, time.Time) error {
				return repository.ErrAdminRefreshTokenRepositoryUnavailable
			},
		}
		if _, err := issueAdminTokens(context.Background(), config, &domain.AdminUserRecord{
			AdminUser:       domain.AdminUser{ID: "admin-1", Email: "admin@example.com"},
			PasswordVersion: 2,
		}, "current-jti", true, AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), "admin session storage is unavailable") {
			t.Fatalf("expected rotate storage error, got %v", err)
		}
	})
}
