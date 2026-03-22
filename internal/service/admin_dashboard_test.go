package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
)

type adminDashboardStubRepository struct {
	countDistinctPosts        func(context.Context) (int, error)
	countActiveSubscribers    func(context.Context) (int, error)
	listTopPostsByHits        func(context.Context, int) ([]domain.AdminDashboardPostMetric, error)
	listTopPostsByLikes       func(context.Context, int) ([]domain.AdminDashboardPostMetric, error)
	buildContentHealthSummary func(context.Context) (domain.AdminDashboardContentHealth, error)
}

func (stub adminDashboardStubRepository) CountDistinctPosts(ctx context.Context) (int, error) {
	return stub.countDistinctPosts(ctx)
}

func (stub adminDashboardStubRepository) CountActiveSubscribers(ctx context.Context) (int, error) {
	return stub.countActiveSubscribers(ctx)
}

func (stub adminDashboardStubRepository) ListTopPostsByHits(
	ctx context.Context,
	limit int,
) ([]domain.AdminDashboardPostMetric, error) {
	return stub.listTopPostsByHits(ctx, limit)
}

func (stub adminDashboardStubRepository) ListTopPostsByLikes(
	ctx context.Context,
	limit int,
) ([]domain.AdminDashboardPostMetric, error) {
	return stub.listTopPostsByLikes(ctx, limit)
}

func (stub adminDashboardStubRepository) BuildContentHealthSummary(
	ctx context.Context,
) (domain.AdminDashboardContentHealth, error) {
	return stub.buildContentHealthSummary(ctx)
}

func TestQueryAdminDashboardAggregatesRepositoryData(t *testing.T) {
	previousRepository := adminDashboardRepository
	t.Cleanup(func() {
		adminDashboardRepository = previousRepository
	})

	adminDashboardRepository = adminDashboardStubRepository{
		countDistinctPosts:     func(context.Context) (int, error) { return 12, nil },
		countActiveSubscribers: func(context.Context) (int, error) { return 345, nil },
		listTopPostsByHits: func(_ context.Context, limit int) ([]domain.AdminDashboardPostMetric, error) {
			if limit != 5 {
				t.Fatalf("expected hits limit 5, got %d", limit)
			}
			return []domain.AdminDashboardPostMetric{{PostID: "alpha", Hits: 100}}, nil
		},
		listTopPostsByLikes: func(_ context.Context, limit int) ([]domain.AdminDashboardPostMetric, error) {
			if limit != 5 {
				t.Fatalf("expected likes limit 5, got %d", limit)
			}
			return []domain.AdminDashboardPostMetric{{PostID: "beta", Likes: 20}}, nil
		},
		buildContentHealthSummary: func(context.Context) (domain.AdminDashboardContentHealth, error) {
			return domain.AdminDashboardContentHealth{
				LocalePairCoverage:  97,
				MissingTranslations: 1,
			}, nil
		},
	}

	result, err := QueryAdminDashboard(context.Background())
	if err != nil {
		t.Fatalf("QueryAdminDashboard returned error: %v", err)
	}
	if result == nil || result.TotalPosts != 12 || result.TotalSubscribers != 345 {
		t.Fatalf("unexpected dashboard result: %#v", result)
	}
	if len(result.TopViewedPosts) != 1 || result.TopViewedPosts[0].Hits != 100 {
		t.Fatalf("unexpected top viewed posts: %#v", result.TopViewedPosts)
	}
	if len(result.TopLikedPosts) != 1 || result.TopLikedPosts[0].Likes != 20 {
		t.Fatalf("unexpected top liked posts: %#v", result.TopLikedPosts)
	}
	if result.ContentHealth.LocalePairCoverage != 97 {
		t.Fatalf("unexpected content health: %#v", result.ContentHealth)
	}
}

func TestToAdminDashboardErrorMapsRepositoryUnavailable(t *testing.T) {
	err := toAdminDashboardError(repository.ErrAdminDashboardRepositoryUnavailable)
	if err == nil || err.Error() == "" || !errors.Is(err, repository.ErrAdminDashboardRepositoryUnavailable) {
		t.Fatalf("unexpected mapped error: %v", err)
	}
}

func TestQueryAdminDashboardMapsRepositoryErrors(t *testing.T) {
	previousRepository := adminDashboardRepository
	t.Cleanup(func() {
		adminDashboardRepository = previousRepository
	})

	testCases := []struct {
		name     string
		repo     adminDashboardStubRepository
		contains string
	}{
		{
			name: "count posts unavailable",
			repo: adminDashboardStubRepository{
				countDistinctPosts: func(context.Context) (int, error) { return 0, repository.ErrAdminDashboardRepositoryUnavailable },
			},
			contains: "admin dashboard is unavailable",
		},
		{
			name: "count subscribers internal",
			repo: adminDashboardStubRepository{
				countDistinctPosts:     func(context.Context) (int, error) { return 1, nil },
				countActiveSubscribers: func(context.Context) (int, error) { return 0, errors.New("boom") },
			},
			contains: "failed to load admin dashboard",
		},
		{
			name: "top hits internal",
			repo: adminDashboardStubRepository{
				countDistinctPosts:     func(context.Context) (int, error) { return 1, nil },
				countActiveSubscribers: func(context.Context) (int, error) { return 2, nil },
				listTopPostsByHits:     func(context.Context, int) ([]domain.AdminDashboardPostMetric, error) { return nil, errors.New("boom") },
			},
			contains: "failed to load admin dashboard",
		},
		{
			name: "top likes internal",
			repo: adminDashboardStubRepository{
				countDistinctPosts:     func(context.Context) (int, error) { return 1, nil },
				countActiveSubscribers: func(context.Context) (int, error) { return 2, nil },
				listTopPostsByHits:     func(context.Context, int) ([]domain.AdminDashboardPostMetric, error) { return nil, nil },
				listTopPostsByLikes:    func(context.Context, int) ([]domain.AdminDashboardPostMetric, error) { return nil, errors.New("boom") },
			},
			contains: "failed to load admin dashboard",
		},
		{
			name: "content health internal",
			repo: adminDashboardStubRepository{
				countDistinctPosts:     func(context.Context) (int, error) { return 1, nil },
				countActiveSubscribers: func(context.Context) (int, error) { return 2, nil },
				listTopPostsByHits:     func(context.Context, int) ([]domain.AdminDashboardPostMetric, error) { return nil, nil },
				listTopPostsByLikes:    func(context.Context, int) ([]domain.AdminDashboardPostMetric, error) { return nil, nil },
				buildContentHealthSummary: func(context.Context) (domain.AdminDashboardContentHealth, error) {
					return domain.AdminDashboardContentHealth{}, errors.New("boom")
				},
			},
			contains: "failed to load admin dashboard",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			adminDashboardRepository = testCase.repo

			_, err := QueryAdminDashboard(context.Background())
			if err == nil || err.Error() == "" || !strings.Contains(err.Error(), testCase.contains) {
				t.Fatalf("expected error containing %q, got %v", testCase.contains, err)
			}
		})
	}
}

func TestToAdminDashboardErrorFallsBackToInternal(t *testing.T) {
	err := toAdminDashboardError(errors.New("boom"))
	if err == nil || !strings.Contains(err.Error(), "failed to load admin dashboard") {
		t.Fatalf("unexpected internal dashboard error: %v", err)
	}
}
