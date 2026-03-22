package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
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
		if message := ResolveAdminErrorMessage(context.Background(), " ", " fallback "); message != "fallback" {
			t.Fatalf("expected trimmed fallback, got %q", message)
		}
		if message := ResolveAdminErrorMessage(context.Background(), "", " "); message != "Admin request failed." {
			t.Fatalf("expected default message, got %q", message)
		}
	})

	t.Run("falls back to english catalog", func(t *testing.T) {
		adminErrorMessageRepository = stubErrorMessageRepository{}
		adminErrorCatalogCache = nil
		adminErrorCatalogExpiry = time.Time{}

		ctx := httpapi.WithRequestTrace(context.Background(), httpapi.RequestTrace{AcceptLang: "fr-FR"})
		message := ResolveAdminErrorMessage(ctx, adminErrorCodeUnauthorized, "")
		if message != "Authentication is required." {
			t.Fatalf("expected english fallback, got %q", message)
		}
	})

	t.Run("resolve locale lookup clone and invalidate helpers", func(t *testing.T) {
		ctx := httpapi.WithRequestTrace(context.Background(), httpapi.RequestTrace{AcceptLang: "tr-TR"})
		if locale := resolveAdminErrorLocale(ctx); locale != adminErrorLocaleTR {
			t.Fatalf("expected tr locale, got %q", locale)
		}

		if lookupAdminErrorMessage(map[string]map[string]string{
			adminErrorLocaleEN: {"CODE": " value "},
		}, adminErrorLocaleEN, "CODE") != "value" {
			t.Fatal("expected trimmed lookup value")
		}
		if lookupAdminErrorMessage(map[string]map[string]string{}, adminErrorLocaleEN, "CODE") != "" {
			t.Fatal("expected empty lookup for missing locale")
		}

		cloned := cloneAdminErrorCatalog(map[string]map[string]string{
			adminErrorLocaleEN: {"CODE": "value"},
		})
		cloned[adminErrorLocaleEN]["CODE"] = "changed"
		if defaultAdminErrorCatalog[adminErrorLocaleEN]["INVALID_CREDENTIALS"] == "" {
			t.Fatal("expected default catalog to remain populated")
		}

		adminErrorCatalogCache = map[string]map[string]string{adminErrorLocaleEN: {"CODE": "value"}}
		adminErrorCatalogExpiry = time.Now().Add(time.Minute)
		InvalidateAdminErrorCatalogCache()
		if adminErrorCatalogCache != nil || !adminErrorCatalogExpiry.IsZero() {
			t.Fatalf("expected cache invalidation, got cache=%v expiry=%v", adminErrorCatalogCache, adminErrorCatalogExpiry)
		}
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
		if calls != 1 {
			t.Fatalf("expected repository to be read once, got %d", calls)
		}
		if first[adminErrorLocaleEN]["INVALID_CREDENTIALS"] != "Cached" || second[adminErrorLocaleEN]["INVALID_CREDENTIALS"] != "Cached" {
			t.Fatalf("expected cached override catalog, got %#v %#v", first, second)
		}
	})
}
