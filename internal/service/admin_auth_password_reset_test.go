package service

import (
	"context"
	"errors"
	"testing"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/pkg/apperrors"

	"golang.org/x/crypto/bcrypt"
)

func TestRequestAdminPasswordResetStoresPendingRequestAndSendsMail(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousResolveSiteURLFn := resolveSiteURLFn
	previousResolveMailConfigFn := resolveMailConfigFn
	previousGenerateConfirmTokenFn := generateConfirmTokenFn
	previousNowUTCFn := nowUTCFn
	previousSendReset := sendAdminPasswordResetEmailFn
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		resolveSiteURLFn = previousResolveSiteURLFn
		resolveMailConfigFn = previousResolveMailConfigFn
		generateConfirmTokenFn = previousGenerateConfirmTokenFn
		nowUTCFn = previousNowUTCFn
		sendAdminPasswordResetEmailFn = previousSendReset
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
	resolveMailConfigFn = func() (appconfig.MailConfig, error) {
		return appconfig.MailConfig{Host: "smtp.example.com", Port: "2525", Username: "user", Password: "pass"}, nil
	}
	generateConfirmTokenFn = func() (string, error) { return "reset-token", nil }
	fixedNow := time.Date(2026, time.March, 20, 10, 0, 0, 0, time.UTC)
	nowUTCFn = func() time.Time { return fixedNow }

	var sentRecipient string
	sendAdminPasswordResetEmailFn = func(
		_ appconfig.MailConfig,
		recipientEmail,
		resetURL,
		locale,
		siteURL string,
	) error {
		sentRecipient = recipientEmail
		if resetURL != "https://example.com/tr/admin/reset-password?token=reset-token" {
			t.Fatalf("unexpected reset URL: %q", resetURL)
		}
		if locale != "tr" || siteURL != "https://example.com" {
			t.Fatalf("unexpected locale/siteURL: %q %q", locale, siteURL)
		}
		return nil
	}

	err = RequestAdminPasswordReset(context.Background(), "admin@example.com", "tr")
	if err != nil {
		t.Fatalf("RequestAdminPasswordReset returned error: %v", err)
	}

	if sentRecipient != "admin@example.com" {
		t.Fatalf("expected reset email recipient %q, got %q", "admin@example.com", sentRecipient)
	}
	if user.PendingPasswordReset == nil {
		t.Fatal("expected pending password reset to be stored")
	}
	if user.PendingPasswordReset.TokenHash != hashValue("reset-token") {
		t.Fatalf("unexpected token hash: %q", user.PendingPasswordReset.TokenHash)
	}
	if user.PendingPasswordReset.Locale != "tr" {
		t.Fatalf("expected locale %q, got %q", "tr", user.PendingPasswordReset.Locale)
	}
}

func TestRequestAdminPasswordResetReturnsGenericSuccessWhenAdminDoesNotExist(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
	})

	adminUsersRepository = newAdminAuthEmailChangeStubUserRepository(nil)
	if err := RequestAdminPasswordReset(context.Background(), "missing@example.com", "en"); err != nil {
		t.Fatalf("RequestAdminPasswordReset returned error: %v", err)
	}
}

func TestValidateAdminPasswordResetTokenReturnsExpiredAndClearsRequest(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousNowUTCFn := nowUTCFn
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		nowUTCFn = previousNowUTCFn
	})

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:    "admin-1",
			Email: "admin@example.com",
			Roles: []string{"admin"},
		},
		PendingPasswordReset: &domain.AdminPendingPasswordReset{
			TokenHash:   hashValue("reset-token"),
			Locale:      "tr",
			RequestedAt: time.Date(2026, time.March, 20, 8, 0, 0, 0, time.UTC),
			ExpiresAt:   time.Date(2026, time.March, 20, 9, 0, 0, 0, time.UTC),
		},
	}
	repo := newAdminAuthEmailChangeStubUserRepository(user)
	repo.byPendingResetTokenHash[hashValue("reset-token")] = user
	adminUsersRepository = repo
	nowUTCFn = func() time.Time { return time.Date(2026, time.March, 20, 10, 0, 0, 0, time.UTC) }

	result, err := ValidateAdminPasswordResetToken(context.Background(), "reset-token", "en")
	if err != nil {
		t.Fatalf("ValidateAdminPasswordResetToken returned error: %v", err)
	}
	if result == nil || result.Status != "expired" || result.Locale != "tr" {
		t.Fatalf("unexpected validation result: %+v", result)
	}
	if user.PendingPasswordReset != nil {
		t.Fatal("expected expired password reset token to be cleared")
	}
}

func TestResetAdminPasswordWithTokenUpdatesPasswordAndRevokesSessions(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousRefreshRepo := adminRefreshTokensRepository
	previousNowUTCFn := nowUTCFn
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminRefreshTokensRepository = previousRefreshRepo
		nowUTCFn = previousNowUTCFn
	})

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:    "admin-1",
			Email: "admin@example.com",
			Roles: []string{"admin"},
		},
		PasswordHash:    "$2a$10$abcdefghijklmnopqrstuv",
		PasswordVersion: 2,
		PendingPasswordReset: &domain.AdminPendingPasswordReset{
			TokenHash:   hashValue("reset-token"),
			Locale:      "en",
			RequestedAt: time.Date(2026, time.March, 20, 8, 0, 0, 0, time.UTC),
			ExpiresAt:   time.Date(2026, time.March, 20, 11, 0, 0, 0, time.UTC),
		},
	}
	repo := newAdminAuthEmailChangeStubUserRepository(user)
	repo.byPendingResetTokenHash[hashValue("reset-token")] = user
	refreshRepo := &adminAuthEmailChangeStubRefreshRepository{}
	adminUsersRepository = repo
	adminRefreshTokensRepository = refreshRepo
	nowUTCFn = func() time.Time { return time.Date(2026, time.March, 20, 10, 0, 0, 0, time.UTC) }

	result, err := ResetAdminPasswordWithToken(context.Background(), "reset-token", "new-password", "new-password", "en")
	if err != nil {
		t.Fatalf("ResetAdminPasswordWithToken returned error: %v", err)
	}
	if result == nil || !result.Success {
		t.Fatalf("unexpected reset result: %+v", result)
	}
	if user.PendingPasswordReset != nil {
		t.Fatal("expected pending password reset to be cleared")
	}
	if len(refreshRepo.revokedUserIDs) != 1 || refreshRepo.revokedUserIDs[0] != "admin-1" {
		t.Fatalf("expected sessions to be revoked for admin-1, got %+v", refreshRepo.revokedUserIDs)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte("new-password")); err != nil {
		t.Fatalf("expected password hash to be updated, compare returned error: %v", err)
	}
}

func TestResetAdminPasswordWithTokenReturnsInvalidTokenCode(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
	})

	adminUsersRepository = newAdminAuthEmailChangeStubUserRepository(nil)

	_, err := ResetAdminPasswordWithToken(context.Background(), "missing-token", "new-password", "new-password", "en")
	if err == nil {
		t.Fatal("expected invalid token error")
	}

	appErr := apperrors.From(err)
	if appErr.Code != "ADMIN_PASSWORD_RESET_TOKEN_INVALID" {
		t.Fatalf("expected ADMIN_PASSWORD_RESET_TOKEN_INVALID, got %q", appErr.Code)
	}
}

func TestRequestAdminPasswordResetReturnsCustomEmailCode(t *testing.T) {
	err := RequestAdminPasswordReset(context.Background(), "invalid-email", "en")
	if err == nil {
		t.Fatal("expected email validation error")
	}

	appErr := apperrors.From(err)
	if appErr.Code != "ADMIN_PASSWORD_RESET_EMAIL_INVALID" {
		t.Fatalf("expected ADMIN_PASSWORD_RESET_EMAIL_INVALID, got %q", appErr.Code)
	}
}

func TestRequestAdminPasswordResetClearsPendingRequestWhenMailFails(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousResolveSiteURLFn := resolveSiteURLFn
	previousResolveMailConfigFn := resolveMailConfigFn
	previousGenerateConfirmTokenFn := generateConfirmTokenFn
	previousSendReset := sendAdminPasswordResetEmailFn
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		resolveSiteURLFn = previousResolveSiteURLFn
		resolveMailConfigFn = previousResolveMailConfigFn
		generateConfirmTokenFn = previousGenerateConfirmTokenFn
		sendAdminPasswordResetEmailFn = previousSendReset
	})

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:    "admin-1",
			Email: "admin@example.com",
			Roles: []string{"admin"},
		},
	}
	repo := newAdminAuthEmailChangeStubUserRepository(user)
	adminUsersRepository = repo
	resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
	resolveMailConfigFn = func() (appconfig.MailConfig, error) { return appconfig.MailConfig{}, nil }
	generateConfirmTokenFn = func() (string, error) { return "reset-token", nil }
	sendAdminPasswordResetEmailFn = func(appconfig.MailConfig, string, string, string, string) error {
		return errors.New("boom")
	}

	err := RequestAdminPasswordReset(context.Background(), "admin@example.com", "en")
	if err == nil {
		t.Fatal("expected mail error")
	}
	if user.PendingPasswordReset != nil {
		t.Fatal("expected pending password reset to be cleared after mail failure")
	}
}

func TestAdminPasswordResetHelpersHandleValidationAndInvalidStates(t *testing.T) {
	t.Run("validate password reset token empty and success", func(t *testing.T) {
		previousUsersRepo := adminUsersRepository
		previousNowUTCFn := nowUTCFn
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
			nowUTCFn = previousNowUTCFn
		})

		result, err := ValidateAdminPasswordResetToken(context.Background(), "", "tr")
		if err != nil {
			t.Fatalf("ValidateAdminPasswordResetToken empty token error: %v", err)
		}
		if result == nil || result.Status != "invalid-link" || result.Locale != "tr" {
			t.Fatalf("unexpected empty token result: %#v", result)
		}

		user := &domain.AdminUserRecord{
			AdminUser: domain.AdminUser{ID: "admin-1", Email: "admin@example.com"},
			PendingPasswordReset: &domain.AdminPendingPasswordReset{
				TokenHash:   hashValue("reset-token"),
				Locale:      "en",
				RequestedAt: time.Date(2026, time.March, 20, 8, 0, 0, 0, time.UTC),
				ExpiresAt:   time.Date(2026, time.March, 20, 11, 0, 0, 0, time.UTC),
			},
		}
		repo := newAdminAuthEmailChangeStubUserRepository(user)
		repo.byPendingResetTokenHash[hashValue("reset-token")] = user
		adminUsersRepository = repo
		nowUTCFn = func() time.Time { return time.Date(2026, time.March, 20, 10, 0, 0, 0, time.UTC) }

		result, err = ValidateAdminPasswordResetToken(context.Background(), "reset-token", "tr")
		if err != nil {
			t.Fatalf("ValidateAdminPasswordResetToken success error: %v", err)
		}
		if result == nil || result.Status != "success" || result.Locale != "en" {
			t.Fatalf("unexpected success result: %#v", result)
		}
	})

	t.Run("validate reset password helper errors", func(t *testing.T) {
		if err := validateAdminPasswordResetPassword("", ""); err == nil {
			t.Fatal("expected required password error")
		}
		if err := validateAdminPasswordResetPassword("short", "short"); err == nil {
			t.Fatal("expected short password error")
		}
		if err := validateAdminPasswordResetPassword("new-password", "different"); err == nil {
			t.Fatal("expected mismatch error")
		}
		if err := validateAdminPasswordResetPassword("new-password", "new-password"); err != nil {
			t.Fatalf("unexpected valid password error: %v", err)
		}
	})

	t.Run("reset password validates required and expired tokens", func(t *testing.T) {
		if _, err := ResetAdminPasswordWithToken(context.Background(), "", "new-password", "new-password", "en"); err == nil {
			t.Fatal("expected token required error")
		}

		previousUsersRepo := adminUsersRepository
		previousNowUTCFn := nowUTCFn
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
			nowUTCFn = previousNowUTCFn
		})

		user := &domain.AdminUserRecord{
			AdminUser: domain.AdminUser{ID: "admin-1", Email: "admin@example.com"},
			PendingPasswordReset: &domain.AdminPendingPasswordReset{
				TokenHash:   hashValue("expired-token"),
				Locale:      "en",
				RequestedAt: time.Date(2026, time.March, 20, 8, 0, 0, 0, time.UTC),
				ExpiresAt:   time.Date(2026, time.March, 20, 9, 0, 0, 0, time.UTC),
			},
		}
		repo := newAdminAuthEmailChangeStubUserRepository(user)
		repo.byPendingResetTokenHash[hashValue("expired-token")] = user
		adminUsersRepository = repo
		nowUTCFn = func() time.Time { return time.Date(2026, time.March, 20, 10, 0, 0, 0, time.UTC) }

		if _, err := ResetAdminPasswordWithToken(context.Background(), "expired-token", "new-password", "new-password", "en"); err == nil {
			t.Fatal("expected expired token error")
		}
	})
}
