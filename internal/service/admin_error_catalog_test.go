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
	t.Parallel()

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
	t.Parallel()

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
	t.Parallel()

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
