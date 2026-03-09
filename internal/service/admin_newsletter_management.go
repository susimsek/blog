package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	newsletterpkg "suaybsimsek.com/blog-api/pkg/newsletter"
)

const (
	adminNewsletterDefaultPageSize = 20
	adminNewsletterMaxPageSize     = 100
	adminNewsletterStatusPending   = "pending"
	adminNewsletterStatusActive    = "active"
	adminNewsletterStatusDisabled  = "unsubscribed"
)

var adminNewsletterRepository repository.AdminNewsletterRepository = repository.NewAdminNewsletterRepository()

func ListAdminNewsletterSubscribers(
	ctx context.Context,
	adminUser *domain.AdminUser,
	filter domain.AdminNewsletterSubscriberFilter,
) (*domain.AdminNewsletterSubscriberListResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	page := clampPositiveInt(filter.Page, 1, 100000)
	size := clampPositiveInt(filter.Size, adminNewsletterDefaultPageSize, adminNewsletterMaxPageSize)
	locale, err := normalizeAdminNewsletterLocale(filter.Locale)
	if err != nil {
		return nil, err
	}
	status, err := normalizeAdminNewsletterStatusFilter(filter.Status)
	if err != nil {
		return nil, err
	}

	result, err := adminNewsletterRepository.ListSubscribers(
		ctx,
		domain.AdminNewsletterSubscriberFilter{
			Locale: locale,
			Status: status,
			Query:  strings.TrimSpace(filter.Query),
		},
		page,
		size,
	)
	if err != nil {
		return nil, toAdminNewsletterError(err, "failed to list newsletter subscribers")
	}
	if result == nil {
		return &domain.AdminNewsletterSubscriberListResult{
			Items: []domain.AdminNewsletterSubscriberRecord{},
			Total: 0,
			Page:  page,
			Size:  size,
		}, nil
	}

	if result.Items == nil {
		result.Items = []domain.AdminNewsletterSubscriberRecord{}
	}

	return result, nil
}

func UpdateAdminNewsletterSubscriberStatus(
	ctx context.Context,
	adminUser *domain.AdminUser,
	email string,
	status string,
) (*domain.AdminNewsletterSubscriberRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	resolvedEmail, err := newsletterpkg.NormalizeSubscriberEmail(email)
	if err != nil {
		return nil, apperrors.BadRequest("invalid subscriber email")
	}

	resolvedStatus, err := normalizeAdminNewsletterMutableStatus(status)
	if err != nil {
		return nil, err
	}

	updated, err := adminNewsletterRepository.UpdateSubscriberStatusByEmail(
		ctx,
		resolvedEmail,
		resolvedStatus,
		time.Now().UTC(),
	)
	if err != nil {
		return nil, toAdminNewsletterError(err, "failed to update newsletter subscriber")
	}

	return updated, nil
}

func DeleteAdminNewsletterSubscriber(ctx context.Context, adminUser *domain.AdminUser, email string) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized("admin authentication required")
	}

	resolvedEmail, err := newsletterpkg.NormalizeSubscriberEmail(email)
	if err != nil {
		return apperrors.BadRequest("invalid subscriber email")
	}

	deleted, err := adminNewsletterRepository.DeleteSubscriberByEmail(ctx, resolvedEmail)
	if err != nil {
		return toAdminNewsletterError(err, "failed to delete newsletter subscriber")
	}
	if !deleted {
		return apperrors.BadRequest("newsletter subscriber not found")
	}

	return nil
}

func normalizeAdminNewsletterLocale(value string) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	switch resolved {
	case "", "all":
		return "", nil
	case adminErrorLocaleEN, adminErrorLocaleTR:
		return resolved, nil
	default:
		return "", apperrors.BadRequest("unsupported newsletter locale")
	}
}

func normalizeAdminNewsletterStatusFilter(value string) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	switch resolved {
	case "", "all":
		return "", nil
	case adminNewsletterStatusPending, adminNewsletterStatusActive, adminNewsletterStatusDisabled:
		return resolved, nil
	default:
		return "", apperrors.BadRequest("unsupported newsletter status")
	}
}

func normalizeAdminNewsletterMutableStatus(value string) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	switch resolved {
	case adminNewsletterStatusActive, adminNewsletterStatusDisabled:
		return resolved, nil
	default:
		return "", apperrors.BadRequest("unsupported newsletter status")
	}
}

func toAdminNewsletterError(err error, message string) error {
	switch {
	case errors.Is(err, repository.ErrAdminNewsletterRepositoryUnavailable):
		return apperrors.ServiceUnavailable("admin newsletter is unavailable", err)
	case errors.Is(err, repository.ErrAdminNewsletterSubscriberNotFound):
		return apperrors.BadRequest("newsletter subscriber not found")
	default:
		return apperrors.Internal(message, err)
	}
}
