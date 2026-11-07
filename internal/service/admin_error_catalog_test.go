package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/testassert"
	"suaybsimsek.com/blog-api/pkg/httpapi"
)

type stubErrorMessageRepository struct {
	listByScope func(ctx context.Context, scope string) ([]domain.ErrorMessageRecord, error)
}

func (stub stubErrorMessageRepository) ListByScope(
	ctx context.Context,
	scope string,
) ([]domain.ErrorMessageRecord, error) {
	if stub.listByScope == nil {
		return nil, nil
	}
	return stub.listByScope(ctx, scope)
}

func (stubErrorMessageRepository) UpsertMany(context.Context, []domain.ErrorMessageRecord) error {
	return nil
}

func (stubErrorMessageRepository) DeleteByKey(context.Context, string, string, string) (bool, error) {
	return false, nil
}

func TestResolveAdminErrorMessageUsesLocaleDefaults(t *testing.T) {
	previousRepository := adminErrorMessageRepository
	previousCache := adminErrorCatalogCache
	previousExpiry := adminErrorCatalogExpiry
	t.Cleanup(func() {
		adminErrorMessageRepository = previousRepository
		adminErrorCatalogCache = previousCache
		adminErrorCatalogExpiry = previousExpiry
	})

	adminErrorMessageRepository = stubErrorMessageRepository{
		listByScope: func(context.Context, string) ([]domain.ErrorMessageRecord, error) {
			return nil, errors.New("db unavailable")
		},
	}
	adminErrorCatalogCache = nil
	adminErrorCatalogExpiry = time.Time{}

	ctx := httpapi.WithRequestTrace(context.Background(), httpapi.RequestTrace{AcceptLang: "tr-TR,tr;q=0.9"})
	message := ResolveAdminErrorMessage(ctx, "INVALID_CREDENTIALS", "invalid credentials")
	if message != "E-posta veya parola hatalı." {
		t.Fatalf("message = %q", message)
	}
}

func TestResolveAdminErrorMessageUsesRepositoryOverride(t *testing.T) {
	previousRepository := adminErrorMessageRepository
	previousCache := adminErrorCatalogCache
	previousExpiry := adminErrorCatalogExpiry
	t.Cleanup(func() {
		adminErrorMessageRepository = previousRepository
		adminErrorCatalogCache = previousCache
		adminErrorCatalogExpiry = previousExpiry
	})

	adminErrorMessageRepository = stubErrorMessageRepository{
		listByScope: func(context.Context, string) ([]domain.ErrorMessageRecord, error) {
			return []domain.ErrorMessageRecord{
				{
					Scope:   adminErrorMessageScope,
					Locale:  "tr",
					Code:    "INVALID_CREDENTIALS",
					Message: "Özel DB mesajı",
				},
			}, nil
		},
	}
	adminErrorCatalogCache = nil
	adminErrorCatalogExpiry = time.Time{}

	ctx := httpapi.WithRequestTrace(context.Background(), httpapi.RequestTrace{AcceptLang: "tr"})
	message := ResolveAdminErrorMessage(ctx, "INVALID_CREDENTIALS", "invalid credentials")
	if message != "Özel DB mesajı" {
		t.Fatalf("message = %q", message)
	}
}

func TestResolveAdminErrorMessageFallsBackToInputMessage(t *testing.T) {
	previousRepository := adminErrorMessageRepository
	previousCache := adminErrorCatalogCache
	previousExpiry := adminErrorCatalogExpiry
	t.Cleanup(func() {
		adminErrorMessageRepository = previousRepository
		adminErrorCatalogCache = previousCache
		adminErrorCatalogExpiry = previousExpiry
	})

	adminErrorMessageRepository = stubErrorMessageRepository{}
	adminErrorCatalogCache = nil
	adminErrorCatalogExpiry = time.Time{}

	message := ResolveAdminErrorMessage(context.Background(), "UNKNOWN_CODE", "fallback message")
	if message != "fallback message" {
		t.Fatalf("message = %q", message)
	}
}

func TestAdminErrorCatalogFallbacksAndCacheHelpers(t *testing.T) {
	previousRepository := adminErrorMessageRepository
	previousCache := adminErrorCatalogCache
	previousExpiry := adminErrorCatalogExpiry
	previousDefaults := defaultAdminErrorCatalog
	t.Cleanup(func() {
		adminErrorMessageRepository = previousRepository
		adminErrorCatalogCache = previousCache
		adminErrorCatalogExpiry = previousExpiry
		defaultAdminErrorCatalog = previousDefaults
	})

	t.Run("empty code uses fallback or default", func(t *testing.T) {
		testassert.Equal(t, ResolveAdminErrorMessage(context.Background(), " ", " fallback "), "fallback", "trimmed fallback")
		testassert.Equal(t, ResolveAdminErrorMessage(context.Background(), "", " "), "Admin request failed.", "default message")
	})

	t.Run("falls back to english catalog", func(t *testing.T) {
		adminErrorMessageRepository = stubErrorMessageRepository{}
		adminErrorCatalogCache = nil
		adminErrorCatalogExpiry = time.Time{}

		ctx := httpapi.WithRequestTrace(context.Background(), httpapi.RequestTrace{AcceptLang: "fr-FR"})
		message := ResolveAdminErrorMessage(ctx, adminErrorCodeUnauthorized, "")
		testassert.Equal(t, message, "Authentication is required.", "english fallback")
	})

	t.Run("resolve locale lookup clone and invalidate helpers", func(t *testing.T) {
		ctx := httpapi.WithRequestTrace(context.Background(), httpapi.RequestTrace{AcceptLang: "tr-TR"})
		testassert.Equal(t, resolveAdminErrorLocale(ctx), adminErrorLocaleTR, "resolved locale")

		testassert.Equal(t, lookupAdminErrorMessage(map[string]map[string]string{
			adminErrorLocaleEN: {"CODE": " value "},
		}, adminErrorLocaleEN, "CODE"), "value", "trimmed lookup value")
		testassert.Equal(t, lookupAdminErrorMessage(map[string]map[string]string{}, adminErrorLocaleEN, "CODE"), "", "missing locale lookup")

		cloned := cloneAdminErrorCatalog(map[string]map[string]string{
			adminErrorLocaleEN: {"CODE": "value"},
		})
		cloned[adminErrorLocaleEN]["CODE"] = "changed"
		testassert.True(t, defaultAdminErrorCatalog[adminErrorLocaleEN]["INVALID_CREDENTIALS"] != "", "default catalog should remain populated")

		adminErrorCatalogCache = map[string]map[string]string{adminErrorLocaleEN: {"CODE": "value"}}
		adminErrorCatalogExpiry = time.Now().Add(time.Minute)
		InvalidateAdminErrorCatalogCache()
		testassert.True(t, adminErrorCatalogCache == nil, "cache should be invalidated")
		testassert.True(t, adminErrorCatalogExpiry.IsZero(), "cache expiry should be reset")
	})

	t.Run("repository values are cached until invalidated", func(t *testing.T) {
		calls := 0
		defaultAdminErrorCatalog = map[string]map[string]string{
			adminErrorLocaleEN: {"INVALID_CREDENTIALS": "Default"},
		}
		adminErrorMessageRepository = stubErrorMessageRepository{
			listByScope: func(context.Context, string) ([]domain.ErrorMessageRecord, error) {
				calls++
				return []domain.ErrorMessageRecord{
					{Scope: adminErrorMessageScope, Locale: "en", Code: "INVALID_CREDENTIALS", Message: "Cached"},
					{Scope: adminErrorMessageScope, Locale: " ", Code: "INVALID_CREDENTIALS", Message: "Ignored"},
				}, nil
			},
		}
		adminErrorCatalogCache = nil
		adminErrorCatalogExpiry = time.Time{}

		first := getAdminErrorCatalog(context.Background())
		second := getAdminErrorCatalog(context.Background())
		testassert.Equal(t, calls, 1, "repository reads")
		testassert.Equal(t, first[adminErrorLocaleEN]["INVALID_CREDENTIALS"], "Cached", "first cached value")
		testassert.Equal(t, second[adminErrorLocaleEN]["INVALID_CREDENTIALS"], "Cached", "second cached value")
	})
}
