package service

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"testing"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
)

func TestResolveAdminGithubIdentityFromCodeReturnsVerifiedIdentity(t *testing.T) {
	previousResolveGithubConfigFn := resolveGithubConfigFn
	previousExchangeFn := exchangeGithubAuthorizationCodeFn
	previousFetchFn := fetchGithubUserInfoFn
	t.Cleanup(func() {
		resolveGithubConfigFn = previousResolveGithubConfigFn
		exchangeGithubAuthorizationCodeFn = previousExchangeFn
		fetchGithubUserInfoFn = previousFetchFn
	})

	resolveGithubConfigFn = func() appconfig.AdminGithubConfig {
		return appconfig.AdminGithubConfig{ClientID: "client-id", ClientSecret: "client-secret"}
	}
	exchangeGithubAuthorizationCodeFn = func(context.Context, appconfig.AdminGithubConfig, string, string) (*githubTokenResponse, error) {
		return &githubTokenResponse{AccessToken: "github-token"}, nil
	}
	fetchGithubUserInfoFn = func(context.Context, string) (*AdminGithubIdentity, error) {
		return &AdminGithubIdentity{Subject: " 123 ", Email: " ADMIN@EXAMPLE.COM ", EmailVerified: true}, nil
	}

	identity, err := ResolveAdminGithubIdentityFromCode(context.Background(), "code", "https://example.com/callback")
	if err != nil {
		t.Fatalf("ResolveAdminGithubIdentityFromCode returned error: %v", err)
	}
	if identity == nil || identity.Subject != "123" || identity.Email != "admin@example.com" {
		t.Fatalf("unexpected identity: %#v", identity)
	}
}

func TestLinkAndDisconnectAdminGithubAccount(t *testing.T) {
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
		},
	}
	repo := &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
	}
	adminUsersRepository = repo
	nowUTCFn = func() time.Time { return time.Date(2026, time.March, 21, 10, 0, 0, 0, time.UTC) }

	updated, err := LinkAdminGithubAccount(context.Background(), "admin-1", &AdminGithubIdentity{
		Subject: "github-123",
		Email:   "admin@example.com",
	})
	if err != nil {
		t.Fatalf("LinkAdminGithubAccount returned error: %v", err)
	}
	if updated == nil || updated.GithubSubject != "github-123" {
		t.Fatalf("unexpected linked user: %#v", updated)
	}

	updated, err = DisconnectAdminGithubAccount(context.Background(), &domain.AdminUser{ID: "admin-1"})
	if err != nil {
		t.Fatalf("DisconnectAdminGithubAccount returned error: %v", err)
	}
	if updated == nil || updated.GithubSubject != "" {
		t.Fatalf("expected github link cleared, got %#v", updated)
	}
}

func TestResolveAdminGoogleIdentityFromCodeReturnsVerifiedIdentity(t *testing.T) {
	previousResolveGoogleConfigFn := resolveGoogleConfigFn
	previousExchangeFn := exchangeGoogleAuthorizationCodeFn
	previousFetchFn := fetchGoogleUserInfoFn
	t.Cleanup(func() {
		resolveGoogleConfigFn = previousResolveGoogleConfigFn
		exchangeGoogleAuthorizationCodeFn = previousExchangeFn
		fetchGoogleUserInfoFn = previousFetchFn
	})

	resolveGoogleConfigFn = func() appconfig.AdminGoogleConfig {
		return appconfig.AdminGoogleConfig{ClientID: "client-id", ClientSecret: "client-secret"}
	}
	exchangeGoogleAuthorizationCodeFn = func(context.Context, appconfig.AdminGoogleConfig, string, string) (*googleTokenResponse, error) {
		return &googleTokenResponse{AccessToken: "google-token"}, nil
	}
	fetchGoogleUserInfoFn = func(context.Context, string) (*AdminGoogleIdentity, error) {
		return &AdminGoogleIdentity{Subject: " google-123 ", Email: " ADMIN@EXAMPLE.COM ", EmailVerified: true}, nil
	}

	identity, err := ResolveAdminGoogleIdentityFromCode(context.Background(), "code", "https://example.com/callback")
	if err != nil {
		t.Fatalf("ResolveAdminGoogleIdentityFromCode returned error: %v", err)
	}
	if identity == nil || identity.Subject != "google-123" || identity.Email != "admin@example.com" {
		t.Fatalf("unexpected identity: %#v", identity)
	}
}

func TestLinkAndDisconnectAdminGoogleAccount(t *testing.T) {
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
		},
	}
	repo := &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
	}
	adminUsersRepository = repo
	nowUTCFn = func() time.Time { return time.Date(2026, time.March, 21, 10, 0, 0, 0, time.UTC) }

	updated, err := LinkAdminGoogleAccount(context.Background(), "admin-1", &AdminGoogleIdentity{
		Subject: "google-123",
		Email:   "admin@example.com",
	})
	if err != nil {
		t.Fatalf("LinkAdminGoogleAccount returned error: %v", err)
	}
	if updated == nil || updated.GoogleSubject != "google-123" {
		t.Fatalf("unexpected linked user: %#v", updated)
	}

	updated, err = DisconnectAdminGoogleAccount(context.Background(), &domain.AdminUser{ID: "admin-1"})
	if err != nil {
		t.Fatalf("DisconnectAdminGoogleAccount returned error: %v", err)
	}
	if updated == nil || updated.GoogleSubject != "" {
		t.Fatalf("expected google link cleared, got %#v", updated)
	}
}

func TestOAuthStatusQueriesAndConnectURLs(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousResolveGithubConfigFn := resolveGithubConfigFn
	previousResolveGoogleConfigFn := resolveGoogleConfigFn
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		resolveGithubConfigFn = previousResolveGithubConfigFn
		resolveGoogleConfigFn = previousResolveGoogleConfigFn
	})

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:            "admin-1",
			Email:         "admin@example.com",
			GithubSubject: "github-123",
			GoogleSubject: "google-123",
		},
	}
	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
	}
	resolveGithubConfigFn = func() appconfig.AdminGithubConfig {
		return appconfig.AdminGithubConfig{ClientID: "client-id", ClientSecret: "client-secret"}
	}
	resolveGoogleConfigFn = func() appconfig.AdminGoogleConfig {
		return appconfig.AdminGoogleConfig{ClientID: "client-id", ClientSecret: "client-secret"}
	}

	githubStatus, err := QueryAdminGithubAuthStatus(context.Background())
	if err != nil {
		t.Fatalf("QueryAdminGithubAuthStatus returned error: %v", err)
	}
	if githubStatus == nil || !githubStatus.Enabled || !githubStatus.LoginAvailable {
		t.Fatalf("unexpected github status: %#v", githubStatus)
	}

	googleStatus, err := QueryAdminGoogleAuthStatus(context.Background())
	if err != nil {
		t.Fatalf("QueryAdminGoogleAuthStatus returned error: %v", err)
	}
	if googleStatus == nil || !googleStatus.Enabled || !googleStatus.LoginAvailable {
		t.Fatalf("unexpected google status: %#v", googleStatus)
	}

	githubConnect, err := StartAdminGithubConnect(context.Background(), &domain.AdminUser{ID: "admin-1"}, "tr")
	if err != nil || githubConnect == nil || githubConnect.URL == "" {
		t.Fatalf("unexpected github connect result: %#v, err=%v", githubConnect, err)
	}

	googleConnect, err := StartAdminGoogleConnect(context.Background(), &domain.AdminUser{ID: "admin-1"}, "en")
	if err != nil || googleConnect == nil || googleConnect.URL == "" {
		t.Fatalf("unexpected google connect result: %#v, err=%v", googleConnect, err)
	}
}

func TestAdminOAuthLoginFunctionsIssueTokens(t *testing.T) {
	t.Setenv("JWT_SECRET", "admin-secret")

	previousUsersRepo := adminUsersRepository
	previousRefreshRepo := adminRefreshTokensRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminRefreshTokensRepository = previousRefreshRepo
	})

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:            "admin-1",
			Email:         "admin@example.com",
			Roles:         []string{"admin"},
			GithubSubject: "github-123",
			GoogleSubject: "google-123",
		},
		PasswordVersion: 3,
	}
	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
	}

	adminRefreshTokensRepository = adminAuthSessionStubRefreshRepository{
		create: func(context.Context, domain.AdminRefreshTokenRecord) error { return nil },
	}

	githubResponse, err := LoginAdminWithGithubSubject(context.Background(), "github-123", false, AdminSessionMetadata{})
	if err != nil || githubResponse == nil || githubResponse.AccessToken == "" {
		t.Fatalf("unexpected github login result: %#v, err=%v", githubResponse, err)
	}

	googleResponse, err := LoginAdminWithGoogleSubject(context.Background(), "google-123", true, AdminSessionMetadata{})
	if err != nil || googleResponse == nil || googleResponse.AccessToken == "" {
		t.Fatalf("unexpected google login result: %#v, err=%v", googleResponse, err)
	}
}

func TestGithubAndGoogleHTTPHelpersParseResponses(t *testing.T) {
	previousClient := http.DefaultClient
	t.Cleanup(func() {
		http.DefaultClient = previousClient
	})

	http.DefaultClient = &http.Client{
		Transport: roundTripFunc(func(request *http.Request) (*http.Response, error) {
			switch request.URL.String() {
			case "https://github.com/login/oauth/access_token":
				return newJSONResponse(http.StatusOK, `{"access_token":"gh-token"}`), nil
			case "https://api.github.com/user":
				return newJSONResponse(http.StatusOK, `{"id":123}`), nil
			case "https://api.github.com/user/emails":
				return newJSONResponse(http.StatusOK, `[{"email":"admin@example.com","primary":true,"verified":true}]`), nil
			case "https://oauth2.googleapis.com/token":
				return newJSONResponse(http.StatusOK, `{"access_token":"goog-token"}`), nil
			case "https://openidconnect.googleapis.com/v1/userinfo":
				return newJSONResponse(http.StatusOK, `{"sub":"google-123","email":"admin@example.com","email_verified":true}`), nil
			default:
				t.Fatalf("unexpected URL: %s", request.URL.String())
				return nil, nil
			}
		}),
	}

	githubToken, err := exchangeGithubAuthorizationCode(context.Background(), appconfig.AdminGithubConfig{
		ClientID:     "client-id",
		ClientSecret: "client-secret",
	}, "code", "https://example.com/callback")
	if err != nil || githubToken == nil || githubToken.AccessToken != "gh-token" {
		t.Fatalf("unexpected github token result: %#v, err=%v", githubToken, err)
	}

	githubIdentity, err := fetchGithubUserInfo(context.Background(), "gh-token")
	if err != nil || githubIdentity == nil || githubIdentity.Subject != "123" || githubIdentity.Email != "admin@example.com" {
		t.Fatalf("unexpected github identity result: %#v, err=%v", githubIdentity, err)
	}

	googleToken, err := exchangeGoogleAuthorizationCode(context.Background(), appconfig.AdminGoogleConfig{
		ClientID:     "client-id",
		ClientSecret: "client-secret",
	}, "code", "https://example.com/callback")
	if err != nil || googleToken == nil || googleToken.AccessToken != "goog-token" {
		t.Fatalf("unexpected google token result: %#v, err=%v", googleToken, err)
	}

	googleIdentity, err := fetchGoogleUserInfo(context.Background(), "goog-token")
	if err != nil || googleIdentity == nil || googleIdentity.Subject != "google-123" || googleIdentity.Email != "admin@example.com" {
		t.Fatalf("unexpected google identity result: %#v, err=%v", googleIdentity, err)
	}

	if email := resolveGithubVerifiedEmail([]githubUserEmailResponse{{Email: "secondary@example.com", Verified: true}}); email != "secondary@example.com" {
		t.Fatalf("unexpected resolved github email: %q", email)
	}
}

func TestResolveAdminGithubIdentityFromCodeMapsExchangeFailure(t *testing.T) {
	previousResolveGithubConfigFn := resolveGithubConfigFn
	previousExchangeFn := exchangeGithubAuthorizationCodeFn
	t.Cleanup(func() {
		resolveGithubConfigFn = previousResolveGithubConfigFn
		exchangeGithubAuthorizationCodeFn = previousExchangeFn
	})

	resolveGithubConfigFn = func() appconfig.AdminGithubConfig {
		return appconfig.AdminGithubConfig{ClientID: "client-id", ClientSecret: "client-secret"}
	}
	exchangeGithubAuthorizationCodeFn = func(context.Context, appconfig.AdminGithubConfig, string, string) (*githubTokenResponse, error) {
		return nil, errors.New("boom")
	}

	if _, err := ResolveAdminGithubIdentityFromCode(context.Background(), "code", "https://example.com/callback"); err == nil {
		t.Fatal("expected service unavailable error")
	}
}

func TestAdminOAuthBranchErrorsAndValidation(t *testing.T) {
	t.Run("github and google resolve identity reject config and invalid identities", func(t *testing.T) {
		previousResolveGithubConfigFn := resolveGithubConfigFn
		previousResolveGoogleConfigFn := resolveGoogleConfigFn
		previousExchangeGithubFn := exchangeGithubAuthorizationCodeFn
		previousExchangeGoogleFn := exchangeGoogleAuthorizationCodeFn
		previousFetchGithubFn := fetchGithubUserInfoFn
		previousFetchGoogleFn := fetchGoogleUserInfoFn
		t.Cleanup(func() {
			resolveGithubConfigFn = previousResolveGithubConfigFn
			resolveGoogleConfigFn = previousResolveGoogleConfigFn
			exchangeGithubAuthorizationCodeFn = previousExchangeGithubFn
			exchangeGoogleAuthorizationCodeFn = previousExchangeGoogleFn
			fetchGithubUserInfoFn = previousFetchGithubFn
			fetchGoogleUserInfoFn = previousFetchGoogleFn
		})

		resolveGithubConfigFn = func() appconfig.AdminGithubConfig { return appconfig.AdminGithubConfig{} }
		if _, err := ResolveAdminGithubIdentityFromCode(context.Background(), "code", "https://example.com/callback"); err == nil {
			t.Fatal("expected github config error")
		}

		resolveGoogleConfigFn = func() appconfig.AdminGoogleConfig { return appconfig.AdminGoogleConfig{} }
		if _, err := ResolveAdminGoogleIdentityFromCode(context.Background(), "code", "https://example.com/callback"); err == nil {
			t.Fatal("expected google config error")
		}

		resolveGithubConfigFn = func() appconfig.AdminGithubConfig {
			return appconfig.AdminGithubConfig{ClientID: "client-id", ClientSecret: "client-secret"}
		}
		exchangeGithubAuthorizationCodeFn = func(context.Context, appconfig.AdminGithubConfig, string, string) (*githubTokenResponse, error) {
			return &githubTokenResponse{AccessToken: "github-token"}, nil
		}
		fetchGithubUserInfoFn = func(context.Context, string) (*AdminGithubIdentity, error) {
			return &AdminGithubIdentity{Subject: "123", Email: "admin@example.com", EmailVerified: false}, nil
		}
		if _, err := ResolveAdminGithubIdentityFromCode(context.Background(), "code", "https://example.com/callback"); err == nil {
			t.Fatal("expected github unverified email error")
		}

		resolveGoogleConfigFn = func() appconfig.AdminGoogleConfig {
			return appconfig.AdminGoogleConfig{ClientID: "client-id", ClientSecret: "client-secret"}
		}
		exchangeGoogleAuthorizationCodeFn = func(context.Context, appconfig.AdminGoogleConfig, string, string) (*googleTokenResponse, error) {
			return &googleTokenResponse{AccessToken: "google-token"}, nil
		}
		fetchGoogleUserInfoFn = func(context.Context, string) (*AdminGoogleIdentity, error) {
			return &AdminGoogleIdentity{Subject: "google-123", Email: "", EmailVerified: true}, nil
		}
		if _, err := ResolveAdminGoogleIdentityFromCode(context.Background(), "code", "https://example.com/callback"); err == nil {
			t.Fatal("expected google invalid identity error")
		}
	})

	t.Run("oauth start connect and login validate auth and config", func(t *testing.T) {
		previousResolveGithubConfigFn := resolveGithubConfigFn
		previousResolveGoogleConfigFn := resolveGoogleConfigFn
		previousUsersRepo := adminUsersRepository
		t.Cleanup(func() {
			resolveGithubConfigFn = previousResolveGithubConfigFn
			resolveGoogleConfigFn = previousResolveGoogleConfigFn
			adminUsersRepository = previousUsersRepo
		})

		if _, err := StartAdminGithubConnect(context.Background(), nil, "tr"); err == nil {
			t.Fatal("expected github connect auth error")
		}
		if _, err := StartAdminGoogleConnect(context.Background(), nil, "tr"); err == nil {
			t.Fatal("expected google connect auth error")
		}

		resolveGithubConfigFn = func() appconfig.AdminGithubConfig { return appconfig.AdminGithubConfig{} }
		if _, err := StartAdminGithubConnect(context.Background(), &domain.AdminUser{ID: "admin-1"}, "tr"); err == nil {
			t.Fatal("expected github connect config error")
		}

		resolveGoogleConfigFn = func() appconfig.AdminGoogleConfig { return appconfig.AdminGoogleConfig{} }
		if _, err := StartAdminGoogleConnect(context.Background(), &domain.AdminUser{ID: "admin-1"}, "tr"); err == nil {
			t.Fatal("expected google connect config error")
		}

		if _, err := LoginAdminWithGithubSubject(context.Background(), "github-123", false, AdminSessionMetadata{}); err == nil {
			t.Fatal("expected github login config error")
		}
		if _, err := LoginAdminWithGoogleSubject(context.Background(), "google-123", false, AdminSessionMetadata{}); err == nil {
			t.Fatal("expected google login config error")
		}

		t.Setenv("JWT_SECRET", "admin-secret")
		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(nil),
		}
		if _, err := LoginAdminWithGithubSubject(context.Background(), "github-123", false, AdminSessionMetadata{}); err == nil {
			t.Fatal("expected github invalid credentials error")
		}
		if _, err := LoginAdminWithGoogleSubject(context.Background(), "google-123", false, AdminSessionMetadata{}); err == nil {
			t.Fatal("expected google invalid credentials error")
		}
	})

	t.Run("link and disconnect reject invalid states", func(t *testing.T) {
		previousUsersRepo := adminUsersRepository
		previousNowUTCFn := nowUTCFn
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
			nowUTCFn = previousNowUTCFn
		})

		user := &domain.AdminUserRecord{
			AdminUser: domain.AdminUser{
				ID:            "admin-1",
				Email:         "admin@example.com",
				GithubSubject: "github-old",
				GoogleSubject: "google-old",
			},
		}
		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
		}
		nowUTCFn = func() time.Time { return time.Date(2026, time.March, 21, 10, 0, 0, 0, time.UTC) }

		if _, err := LinkAdminGithubAccount(context.Background(), "", &AdminGithubIdentity{Subject: "github-123", Email: "admin@example.com"}); err == nil {
			t.Fatal("expected github auth required error")
		}
		if _, err := LinkAdminGoogleAccount(context.Background(), "", &AdminGoogleIdentity{Subject: "google-123", Email: "admin@example.com"}); err == nil {
			t.Fatal("expected google auth required error")
		}
		if _, err := LinkAdminGithubAccount(context.Background(), "admin-1", nil); err == nil {
			t.Fatal("expected github invalid identity error")
		}
		if _, err := LinkAdminGoogleAccount(context.Background(), "admin-1", nil); err == nil {
			t.Fatal("expected google invalid identity error")
		}
		if _, err := LinkAdminGithubAccount(context.Background(), "admin-1", &AdminGithubIdentity{Subject: "github-new", Email: "admin@example.com"}); err == nil {
			t.Fatal("expected github current-link conflict")
		}
		if _, err := LinkAdminGoogleAccount(context.Background(), "admin-1", &AdminGoogleIdentity{Subject: "google-new", Email: "admin@example.com"}); err == nil {
			t.Fatal("expected google current-link conflict")
		}

		if _, err := DisconnectAdminGithubAccount(context.Background(), nil); err == nil {
			t.Fatal("expected github disconnect auth error")
		}
		if _, err := DisconnectAdminGoogleAccount(context.Background(), nil); err == nil {
			t.Fatal("expected google disconnect auth error")
		}

		user.GithubSubject = ""
		user.GoogleSubject = ""
		if _, err := DisconnectAdminGithubAccount(context.Background(), &domain.AdminUser{ID: "admin-1"}); err == nil {
			t.Fatal("expected github not linked error")
		}
		if _, err := DisconnectAdminGoogleAccount(context.Background(), &domain.AdminUser{ID: "admin-1"}); err == nil {
			t.Fatal("expected google not linked error")
		}
	})
}

func TestAdminOAuthRepositoryAndHTTPErrorPaths(t *testing.T) {
	t.Run("status and login map repository errors", func(t *testing.T) {
		previousUsersRepo := adminUsersRepository
		previousResolveGithubConfigFn := resolveGithubConfigFn
		previousResolveGoogleConfigFn := resolveGoogleConfigFn
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
			resolveGithubConfigFn = previousResolveGithubConfigFn
			resolveGoogleConfigFn = previousResolveGoogleConfigFn
		})

		resolveGithubConfigFn = func() appconfig.AdminGithubConfig {
			return appconfig.AdminGithubConfig{ClientID: "client-id", ClientSecret: "client-secret"}
		}
		resolveGoogleConfigFn = func() appconfig.AdminGoogleConfig {
			return appconfig.AdminGoogleConfig{ClientID: "client-id", ClientSecret: "client-secret"}
		}
		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(nil),
			hasAnyGithubLink: func(context.Context) (bool, error) {
				return false, errors.New("db down")
			},
			hasAnyGoogleLink: func(context.Context) (bool, error) {
				return false, errors.New("db down")
			},
			findByGithubSubject: func(context.Context, string) (*domain.AdminUserRecord, error) {
				return nil, errors.New("db down")
			},
			findByGoogleSubject: func(context.Context, string) (*domain.AdminUserRecord, error) {
				return nil, errors.New("db down")
			},
		}

		if _, err := QueryAdminGithubAuthStatus(context.Background()); err == nil || !strings.Contains(err.Error(), "failed to load github auth status") {
			t.Fatalf("expected github status error, got %v", err)
		}
		if _, err := QueryAdminGoogleAuthStatus(context.Background()); err == nil || !strings.Contains(err.Error(), "failed to load google auth status") {
			t.Fatalf("expected google status error, got %v", err)
		}

		t.Setenv("JWT_SECRET", "admin-secret")
		if _, err := LoginAdminWithGithubSubject(context.Background(), "github-123", false, AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), adminLoadAdminUserMessage) {
			t.Fatalf("expected github login load error, got %v", err)
		}
		if _, err := LoginAdminWithGoogleSubject(context.Background(), "google-123", false, AdminSessionMetadata{}); err == nil || !strings.Contains(err.Error(), adminLoadAdminUserMessage) {
			t.Fatalf("expected google login load error, got %v", err)
		}
	})

	t.Run("link and disconnect map repository errors", func(t *testing.T) {
		previousUsersRepo := adminUsersRepository
		t.Cleanup(func() {
			adminUsersRepository = previousUsersRepo
		})

		user := &domain.AdminUserRecord{
			AdminUser: domain.AdminUser{
				ID:            "admin-1",
				Email:         "admin@example.com",
				GithubSubject: "",
				GoogleSubject: "",
			},
		}

		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
			findByGithubSubject: func(context.Context, string) (*domain.AdminUserRecord, error) {
				return nil, errors.New("db down")
			},
			findByGoogleSubject: func(context.Context, string) (*domain.AdminUserRecord, error) {
				return nil, errors.New("db down")
			},
		}
		if _, err := LinkAdminGithubAccount(context.Background(), "admin-1", &AdminGithubIdentity{Subject: "github-new", Email: "admin@example.com"}); err == nil || !strings.Contains(err.Error(), "failed to load github account link") {
			t.Fatalf("expected github link lookup error, got %v", err)
		}
		if _, err := LinkAdminGoogleAccount(context.Background(), "admin-1", &AdminGoogleIdentity{Subject: "google-new", Email: "admin@example.com"}); err == nil || !strings.Contains(err.Error(), "failed to load google account link") {
			t.Fatalf("expected google link lookup error, got %v", err)
		}

		user.GithubSubject = "github-123"
		user.GoogleSubject = "google-123"
		adminUsersRepository = &adminAuthSessionStubUserRepository{
			adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
			updateGithubLink: func(context.Context, string, string, string, time.Time) error {
				return repository.ErrAdminGithubAlreadyExists
			},
			updateGoogleLink: func(context.Context, string, string, string, time.Time) error {
				return repository.ErrAdminGoogleAlreadyExists
			},
			clearGithubLink: func(context.Context, string) error {
				return errors.New("boom")
			},
			clearGoogleLink: func(context.Context, string) error {
				return errors.New("boom")
			},
		}
		if _, err := LinkAdminGithubAccount(context.Background(), "admin-1", &AdminGithubIdentity{Subject: "github-123", Email: "admin@example.com"}); err == nil || !strings.Contains(err.Error(), "already linked to another admin") {
			t.Fatalf("expected github duplicate link error, got %v", err)
		}
		if _, err := LinkAdminGoogleAccount(context.Background(), "admin-1", &AdminGoogleIdentity{Subject: "google-123", Email: "admin@example.com"}); err == nil || !strings.Contains(err.Error(), "already linked to another admin") {
			t.Fatalf("expected google duplicate link error, got %v", err)
		}
		if _, err := DisconnectAdminGithubAccount(context.Background(), &domain.AdminUser{ID: "admin-1"}); err == nil || !strings.Contains(err.Error(), "failed to disconnect github account") {
			t.Fatalf("expected github disconnect error, got %v", err)
		}
		if _, err := DisconnectAdminGoogleAccount(context.Background(), &domain.AdminUser{ID: "admin-1"}); err == nil || !strings.Contains(err.Error(), "failed to disconnect google account") {
			t.Fatalf("expected google disconnect error, got %v", err)
		}
	})

	t.Run("http helpers map decode and response failures", func(t *testing.T) {
		previousClient := http.DefaultClient
		t.Cleanup(func() {
			http.DefaultClient = previousClient
		})

		http.DefaultClient = &http.Client{
			Transport: roundTripFunc(func(request *http.Request) (*http.Response, error) {
				switch request.URL.String() {
				case "https://github.com/login/oauth/access_token":
					return newJSONResponse(http.StatusBadGateway, `{"access_token":""}`), nil
				case "https://oauth2.googleapis.com/token":
					return newJSONResponse(http.StatusOK, `{`), nil
				default:
					return nil, errors.New("network down")
				}
			}),
		}

		if _, err := exchangeGithubAuthorizationCode(context.Background(), appconfig.AdminGithubConfig{
			ClientID:     "client-id",
			ClientSecret: "client-secret",
		}, "code", "https://example.com/callback"); err == nil || !strings.Contains(err.Error(), "github token exchange failed") {
			t.Fatalf("expected github token exchange failure, got %v", err)
		}

		if _, err := exchangeGoogleAuthorizationCode(context.Background(), appconfig.AdminGoogleConfig{
			ClientID:     "client-id",
			ClientSecret: "client-secret",
		}, "code", "https://example.com/callback"); err == nil {
			t.Fatal("expected google token decode failure")
		}

		http.DefaultClient = &http.Client{
			Transport: roundTripFunc(func(request *http.Request) (*http.Response, error) {
				switch request.URL.String() {
				case "https://api.github.com/user":
					return newJSONResponse(http.StatusOK, `{"id":0}`), nil
				case "https://openidconnect.googleapis.com/v1/userinfo":
					return newJSONResponse(http.StatusBadGateway, `{}`), nil
				default:
					t.Fatalf("unexpected URL: %s", request.URL.String())
					return nil, nil
				}
			}),
		}

		if _, err := fetchGithubUserInfo(context.Background(), "gh-token"); err == nil || !strings.Contains(err.Error(), adminGithubInvalidMessage) {
			t.Fatalf("expected invalid github identity error, got %v", err)
		}
		if _, err := fetchGoogleUserInfo(context.Background(), "goog-token"); err == nil || !strings.Contains(err.Error(), "google userinfo request failed") {
			t.Fatalf("expected google userinfo failure, got %v", err)
		}
	})

	t.Run("helper normalizers reject invalid payloads", func(t *testing.T) {
		if _, _, err := normalizeAdminGithubIdentity(nil); err == nil || !strings.Contains(err.Error(), adminGithubInvalidMessage) {
			t.Fatalf("expected github invalid identity error, got %v", err)
		}
		if _, _, err := normalizeAdminGithubIdentity(&AdminGithubIdentity{Subject: "github-123"}); err == nil || !strings.Contains(err.Error(), adminGithubInvalidMessage) {
			t.Fatalf("expected github missing email error, got %v", err)
		}
		if _, _, err := normalizeAdminGoogleIdentity(nil); err == nil || !strings.Contains(err.Error(), adminGoogleInvalidMessage) {
			t.Fatalf("expected google invalid identity error, got %v", err)
		}
		if _, _, err := normalizeAdminGoogleIdentity(&AdminGoogleIdentity{Subject: "google-123"}); err == nil || !strings.Contains(err.Error(), adminGoogleInvalidMessage) {
			t.Fatalf("expected google missing email error, got %v", err)
		}
	})
}
