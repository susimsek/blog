package service

import (
	"context"
	"errors"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
)

var adminDashboardRepository repository.AdminDashboardRepository = repository.NewAdminDashboardMongoRepository()

func QueryAdminDashboard(ctx context.Context) (*domain.AdminDashboard, error) {
	operationCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	totalPosts, err := adminDashboardRepository.CountDistinctPosts(operationCtx)
	if err != nil {
		return nil, toAdminDashboardError(err)
	}

	totalSubscribers, err := adminDashboardRepository.CountActiveSubscribers(operationCtx)
	if err != nil {
		return nil, toAdminDashboardError(err)
	}

	topViewedPosts, err := adminDashboardRepository.ListTopPostsByHits(operationCtx, 5)
	if err != nil {
		return nil, toAdminDashboardError(err)
	}

	topLikedPosts, err := adminDashboardRepository.ListTopPostsByLikes(operationCtx, 5)
	if err != nil {
		return nil, toAdminDashboardError(err)
	}

	contentHealth, err := adminDashboardRepository.BuildContentHealthSummary(operationCtx)
	if err != nil {
		return nil, toAdminDashboardError(err)
	}

	return &domain.AdminDashboard{
		TotalPosts:       totalPosts,
		TotalSubscribers: totalSubscribers,
		TopViewedPosts:   topViewedPosts,
		TopLikedPosts:    topLikedPosts,
		ContentHealth:    contentHealth,
	}, nil
}

func toAdminDashboardError(err error) error {
	if errors.Is(err, repository.ErrAdminDashboardRepositoryUnavailable) {
		return apperrors.ServiceUnavailable("admin dashboard is unavailable", err)
	}

	return apperrors.Internal("failed to load admin dashboard", err)
}
