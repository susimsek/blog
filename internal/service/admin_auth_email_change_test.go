package service

import (
	"context"
	"errors"
	"testing"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

type adminAuthEmailChangeStubUserRepository struct {
	byID               map[string]*domain.AdminUserRecord
	byEmail            map[string]*domain.AdminUserRecord
	byPendingTokenHash map[string]*domain.AdminUserRecord
	updateEmailErr     error
}

func newAdminAuthEmailChangeStubUserRepository(user *domain.AdminUserRecord) *adminAuthEmailChangeStubUserRepository {
	repo := &adminAuthEmailChangeStubUserRepository{
		byID:               map[string]*domain.AdminUserRecord{},
		byEmail:            map[string]*domain.AdminUserRecord{},
		byPendingTokenHash: map[string]*domain.AdminUserRecord{},
	}
	if user != nil {
		repo.byID[user.ID] = user
		repo.byEmail[user.Email] = user
	}
	return repo
}

func (stub *adminAuthEmailChangeStubUserRepository) FindByEmail(_ context.Context, email string) (*domain.AdminUserRecord, error) {
	return stub.byEmail[email], nil
}

func (stub *adminAuthEmailChangeStubUserRepository) FindByID(_ context.Context, id string) (*domain.AdminUserRecord, error) {
	return stub.byID[id], nil
}

func (*adminAuthEmailChangeStubUserRepository) FindByUsername(_ context.Context, _ string) (*domain.AdminUserRecord, error) {
	return nil, nil
}

func (stub *adminAuthEmailChangeStubUserRepository) FindByGoogleSubject(
	_ context.Context,
	subject string,
) (*domain.AdminUserRecord, error) {
	for _, user := range stub.byID {
		if user != nil && user.GoogleSubject == subject {
			return user, nil
		}
	}

	return nil, nil
}

func (stub *adminAuthEmailChangeStubUserRepository) FindByPendingEmailChangeTokenHash(
	_ context.Context,
	tokenHash string,
) (*domain.AdminUserRecord, error) {
	return stub.byPendingTokenHash[tokenHash], nil
}

func (stub *adminAuthEmailChangeStubUserRepository) HasAnyGoogleLink(_ context.Context) (bool, error) {
	for _, user := range stub.byID {
		if user != nil && user.GoogleSubject != "" {
			return true, nil
		}
	}

	return false, nil
}

func (*adminAuthEmailChangeStubUserRepository) UpdatePasswordHashByID(_ context.Context, _, _ string) error {
	return nil
}

func (*adminAuthEmailChangeStubUserRepository) UpdateNameByID(_ context.Context, _, _ string) error {
	return nil
}

func (*adminAuthEmailChangeStubUserRepository) UpdateUsernameByID(_ context.Context, _, _ string) error {
	return nil
}

func (stub *adminAuthEmailChangeStubUserRepository) SetPendingEmailChangeByID(
	_ context.Context,
	id string,
	pending domain.AdminPendingEmailChange,
) error {
	user := stub.byID[id]
	if user == nil {
		return repository.ErrAdminUserNotFound
	}

	user.PendingEmailChange = &pending
	user.PendingEmail = pending.NewEmail
	expiresAt := pending.ExpiresAt
	user.PendingEmailExpiresAt = &expiresAt
	stub.byPendingTokenHash[pending.TokenHash] = user
	return nil
}

func (stub *adminAuthEmailChangeStubUserRepository) ClearPendingEmailChangeByID(_ context.Context, id string) error {
	user := stub.byID[id]
	if user == nil {
		return repository.ErrAdminUserNotFound
	}

	if user.PendingEmailChange != nil {
		delete(stub.byPendingTokenHash, user.PendingEmailChange.TokenHash)
	}
	user.PendingEmailChange = nil
	user.PendingEmail = ""
	user.PendingEmailExpiresAt = nil
	return nil
}

func (stub *adminAuthEmailChangeStubUserRepository) UpdateEmailByID(_ context.Context, id, email string) error {
	if stub.updateEmailErr != nil {
		return stub.updateEmailErr
	}

	user := stub.byID[id]
	if user == nil {
		return repository.ErrAdminUserNotFound
	}

	delete(stub.byEmail, user.Email)
	user.Email = email
	user.PasswordVersion++
	if user.PendingEmailChange != nil {
		delete(stub.byPendingTokenHash, user.PendingEmailChange.TokenHash)
	}
	user.PendingEmailChange = nil
	user.PendingEmail = ""
	user.PendingEmailExpiresAt = nil
	stub.byEmail[email] = user
	return nil
}

func (stub *adminAuthEmailChangeStubUserRepository) UpdateGoogleLinkByID(
	_ context.Context,
	id, subject, email string,
	linkedAt time.Time,
) error {
	user := stub.byID[id]
	if user == nil {
		return repository.ErrAdminUserNotFound
	}

	user.GoogleSubject = subject
	user.GoogleEmail = email
	user.GoogleLinkedAt = &linkedAt
	return nil
}

func (stub *adminAuthEmailChangeStubUserRepository) ClearGoogleLinkByID(_ context.Context, id string) error {
	user := stub.byID[id]
	if user == nil {
		return repository.ErrAdminUserNotFound
	}

	user.GoogleSubject = ""
	user.GoogleEmail = ""
	user.GoogleLinkedAt = nil
	return nil
}

func (*adminAuthEmailChangeStubUserRepository) UpdateAvatarByID(_ context.Context, _, _, _ string, _ int64) error {
	return nil
}

func (*adminAuthEmailChangeStubUserRepository) DisableByID(_ context.Context, _ string) error {
	return nil
}

type adminAuthEmailChangeStubRefreshRepository struct {
	revokedUserIDs []string
}

func (*adminAuthEmailChangeStubRefreshRepository) Create(context.Context, domain.AdminRefreshTokenRecord) error {
	return nil
}

func (*adminAuthEmailChangeStubRefreshRepository) FindActiveByToken(
	context.Context,
	string,
	string,
	time.Time,
) (*domain.AdminRefreshTokenRecord, error) {
	return nil, nil
}

func (*adminAuthEmailChangeStubRefreshRepository) ListActiveByUserID(
	context.Context,
	string,
	time.Time,
	int,
) ([]domain.AdminSessionRecord, error) {
	return nil, nil
}

func (*adminAuthEmailChangeStubRefreshRepository) Rotate(
	context.Context,
	string,
	domain.AdminRefreshTokenRecord,
	time.Time,
) error {
	return nil
}

func (*adminAuthEmailChangeStubRefreshRepository) RevokeByJTIAndUserID(
	context.Context,
	string,
	string,
	time.Time,
) (bool, error) {
	return false, nil
}

func (*adminAuthEmailChangeStubRefreshRepository) RevokeByJTI(context.Context, string, time.Time) error {
	return nil
}

func (stub *adminAuthEmailChangeStubRefreshRepository) RevokeAllByUserID(
	_ context.Context,
	userID string,
	_ time.Time,
) error {
	stub.revokedUserIDs = append(stub.revokedUserIDs, userID)
	return nil
}

func TestRequestAdminEmailChangeStoresPendingRequestAndSendsMail(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousRefreshRepo := adminRefreshTokensRepository
	previousResolveSiteURLFn := resolveSiteURLFn
	previousResolveMailConfigFn := resolveMailConfigFn
	previousGenerateConfirmTokenFn := generateConfirmTokenFn
	previousNowUTCFn := nowUTCFn
	previousSendConfirmation := sendAdminEmailChangeConfirmationEmailFn
	previousSendNotice := sendAdminEmailChangeNoticeEmailFn
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminRefreshTokensRepository = previousRefreshRepo
		resolveSiteURLFn = previousResolveSiteURLFn
		resolveMailConfigFn = previousResolveMailConfigFn
		generateConfirmTokenFn = previousGenerateConfirmTokenFn
		nowUTCFn = previousNowUTCFn
		sendAdminEmailChangeConfirmationEmailFn = previousSendConfirmation
		sendAdminEmailChangeNoticeEmailFn = previousSendNotice
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
		PasswordHash: string(passwordHashBytes),
	}

	repo := newAdminAuthEmailChangeStubUserRepository(user)
	adminUsersRepository = repo
	adminRefreshTokensRepository = &adminAuthEmailChangeStubRefreshRepository{}
	resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
	resolveMailConfigFn = func() (appconfig.MailConfig, error) {
		return appconfig.MailConfig{Host: "smtp.example.com", Port: "2525", Username: "user", Password: "pass"}, nil
	}
	generateConfirmTokenFn = func() (string, error) { return "confirm-token", nil }
	fixedNow := time.Date(2026, time.March, 15, 20, 0, 0, 0, time.UTC)
	nowUTCFn = func() time.Time { return fixedNow }

	var confirmationRecipient string
	var noticeRecipient string
	sendAdminEmailChangeConfirmationEmailFn = func(
		_ appconfig.MailConfig,
		recipientEmail,
		confirmURL,
		locale,
		siteURL string,
	) error {
		confirmationRecipient = recipientEmail
		if confirmURL == "" || locale != "tr" || siteURL != "https://example.com" {
			t.Fatalf("unexpected confirmation payload: %q %q %q", confirmURL, locale, siteURL)
		}
		return nil
	}
	sendAdminEmailChangeNoticeEmailFn = func(
		_ appconfig.MailConfig,
		recipientEmail,
		locale,
		siteURL string,
	) error {
		noticeRecipient = recipientEmail
		if locale != "tr" || siteURL != "https://example.com" {
			t.Fatalf("unexpected notice payload: %q %q", locale, siteURL)
		}
		return nil
	}

	result, err := RequestAdminEmailChange(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		"new-admin@example.com",
		"admin-password",
		"tr",
	)
	if err != nil {
		t.Fatalf("RequestAdminEmailChange returned error: %v", err)
	}

	if !result.Success || result.PendingEmail != "new-admin@example.com" {
		t.Fatalf("unexpected result: %#v", result)
	}
	if confirmationRecipient != "new-admin@example.com" {
		t.Fatalf("confirmation recipient = %q", confirmationRecipient)
	}
	if noticeRecipient != "admin@example.com" {
		t.Fatalf("notice recipient = %q", noticeRecipient)
	}
	if user.PendingEmailChange == nil || user.PendingEmailChange.NewEmail != "new-admin@example.com" {
		t.Fatalf("pending email change not stored: %#v", user.PendingEmailChange)
	}
}

func TestConfirmAdminEmailChangeUpdatesEmailAndRevokesSessions(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousRefreshRepo := adminRefreshTokensRepository
	previousNowUTCFn := nowUTCFn
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminRefreshTokensRepository = previousRefreshRepo
		nowUTCFn = previousNowUTCFn
	})

	pending := domain.AdminPendingEmailChange{
		NewEmail:    "next@example.com",
		TokenHash:   hashValue("confirm-token"),
		Locale:      "en",
		RequestedAt: time.Date(2026, time.March, 15, 20, 0, 0, 0, time.UTC),
		ExpiresAt:   time.Date(2026, time.March, 15, 21, 0, 0, 0, time.UTC),
	}
	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:                    "admin-1",
			Email:                 "admin@example.com",
			PendingEmail:          pending.NewEmail,
			PendingEmailExpiresAt: &pending.ExpiresAt,
			Roles:                 []string{"admin"},
		},
		PasswordVersion:    4,
		PendingEmailChange: &pending,
	}

	repo := newAdminAuthEmailChangeStubUserRepository(user)
	repo.byPendingTokenHash[pending.TokenHash] = user
	adminUsersRepository = repo
	refreshRepo := &adminAuthEmailChangeStubRefreshRepository{}
	adminRefreshTokensRepository = refreshRepo
	nowUTCFn = func() time.Time { return time.Date(2026, time.March, 15, 20, 10, 0, 0, time.UTC) }

	result, err := ConfirmAdminEmailChange(context.Background(), "confirm-token", "tr")
	if err != nil {
		t.Fatalf("ConfirmAdminEmailChange returned error: %v", err)
	}

	if result.Status != "success" || result.Locale != "en" {
		t.Fatalf("unexpected result: %#v", result)
	}
	if user.Email != "next@example.com" {
		t.Fatalf("email not updated: %q", user.Email)
	}
	if user.PasswordVersion != 5 {
		t.Fatalf("password version = %d", user.PasswordVersion)
	}
	if user.PendingEmailChange != nil {
		t.Fatalf("pending email change should be cleared")
	}
	if len(refreshRepo.revokedUserIDs) != 1 || refreshRepo.revokedUserIDs[0] != "admin-1" {
		t.Fatalf("expected revoke for admin-1, got %#v", refreshRepo.revokedUserIDs)
	}
}

func TestConfirmAdminEmailChangeReturnsExpiredWhenPendingRequestIsExpired(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousNowUTCFn := nowUTCFn
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		nowUTCFn = previousNowUTCFn
	})

	pending := domain.AdminPendingEmailChange{
		NewEmail:    "next@example.com",
		TokenHash:   hashValue("confirm-token"),
		Locale:      "tr",
		RequestedAt: time.Date(2026, time.March, 15, 20, 0, 0, 0, time.UTC),
		ExpiresAt:   time.Date(2026, time.March, 15, 20, 30, 0, 0, time.UTC),
	}
	user := &domain.AdminUserRecord{
		AdminUser:          domain.AdminUser{ID: "admin-1", Email: "admin@example.com"},
		PendingEmailChange: &pending,
	}
	repo := newAdminAuthEmailChangeStubUserRepository(user)
	repo.byPendingTokenHash[pending.TokenHash] = user
	adminUsersRepository = repo
	nowUTCFn = func() time.Time { return time.Date(2026, time.March, 15, 21, 0, 0, 0, time.UTC) }

	result, err := ConfirmAdminEmailChange(context.Background(), "confirm-token", "en")
	if err != nil {
		t.Fatalf("ConfirmAdminEmailChange returned error: %v", err)
	}

	if result.Status != "expired" || result.Locale != "tr" {
		t.Fatalf("unexpected result: %#v", result)
	}
	if user.PendingEmailChange != nil {
		t.Fatalf("pending request should be cleared")
	}
}

func TestConfirmAdminEmailChangeReturnsFailedWhenEmailBecomesTaken(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousNowUTCFn := nowUTCFn
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		nowUTCFn = previousNowUTCFn
	})

	pending := domain.AdminPendingEmailChange{
		NewEmail:    "next@example.com",
		TokenHash:   hashValue("confirm-token"),
		Locale:      "en",
		RequestedAt: time.Now().UTC(),
		ExpiresAt:   time.Now().UTC().Add(time.Hour),
	}
	user := &domain.AdminUserRecord{
		AdminUser:          domain.AdminUser{ID: "admin-1", Email: "admin@example.com"},
		PendingEmailChange: &pending,
	}
	repo := newAdminAuthEmailChangeStubUserRepository(user)
	repo.byPendingTokenHash[pending.TokenHash] = user
	repo.updateEmailErr = repository.ErrAdminEmailAlreadyExists
	adminUsersRepository = repo
	nowUTCFn = func() time.Time { return time.Now().UTC() }

	result, err := ConfirmAdminEmailChange(context.Background(), "confirm-token", "en")
	if err != nil {
		t.Fatalf("ConfirmAdminEmailChange returned error: %v", err)
	}

	if result.Status != "failed" {
		t.Fatalf("unexpected result: %#v", result)
	}
}

func TestRequestAdminEmailChangeFailsWhenConfirmationMailCannotBeSent(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousResolveSiteURLFn := resolveSiteURLFn
	previousResolveMailConfigFn := resolveMailConfigFn
	previousGenerateConfirmTokenFn := generateConfirmTokenFn
	previousSendConfirmation := sendAdminEmailChangeConfirmationEmailFn
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		resolveSiteURLFn = previousResolveSiteURLFn
		resolveMailConfigFn = previousResolveMailConfigFn
		generateConfirmTokenFn = previousGenerateConfirmTokenFn
		sendAdminEmailChangeConfirmationEmailFn = previousSendConfirmation
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
		PasswordHash: string(passwordHashBytes),
	}
	repo := newAdminAuthEmailChangeStubUserRepository(user)
	adminUsersRepository = repo
	resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
	resolveMailConfigFn = func() (appconfig.MailConfig, error) { return appconfig.MailConfig{}, nil }
	generateConfirmTokenFn = func() (string, error) { return "confirm-token", nil }
	sendAdminEmailChangeConfirmationEmailFn = func(appconfig.MailConfig, string, string, string, string) error {
		return errors.New("smtp down")
	}

	_, err = RequestAdminEmailChange(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		"new-admin@example.com",
		"admin-password",
		"en",
	)
	if err == nil {
		t.Fatal("expected error when confirmation email send fails")
	}
	if user.PendingEmailChange != nil {
		t.Fatalf("pending request should be cleared on failure")
	}
}
