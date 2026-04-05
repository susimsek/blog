package service

import (
	"context"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/pkg/apperrors"
)

func ListAdminContentTopics(
	ctx context.Context,
	adminUser *domain.AdminUser,
	locale string,
	query string,
) ([]domain.AdminContentTopicRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminContentAuthRequired)
	}

	resolvedLocale, err := normalizeAdminContentLocale(locale, true)
	if err != nil {
		return nil, err
	}

	items, err := adminContentRepository.ListTopics(ctx, resolvedLocale, strings.TrimSpace(query))
	if err != nil {
		return nil, toAdminContentError(err, "failed to list content topics")
	}
	if items == nil {
		return []domain.AdminContentTopicRecord{}, nil
	}

	return items, nil
}

func ListAdminContentTopicsPage(
	ctx context.Context,
	adminUser *domain.AdminUser,
	filter domain.AdminContentTaxonomyFilter,
) (*domain.AdminContentTopicListResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminContentAuthRequired)
	}

	page := clampPositiveInt(filter.Page, 1, 100000)
	size := clampPositiveInt(filter.Size, adminContentDefaultPageSize, adminContentMaxPageSize)
	resolvedLocale, err := normalizeAdminContentLocale(filter.Locale, true)
	if err != nil {
		return nil, err
	}
	resolvedPreferredLocale, err := normalizeAdminContentLocale(filter.PreferredLocale, true)
	if err != nil {
		return nil, err
	}

	result, err := adminContentRepository.ListTopicGroups(
		ctx,
		domain.AdminContentTaxonomyFilter{
			Locale:          resolvedLocale,
			PreferredLocale: resolvedPreferredLocale,
			Query:           strings.TrimSpace(filter.Query),
			Page:            &page,
			Size:            &size,
		},
	)
	if err != nil {
		return nil, toAdminContentError(err, "failed to list content topics")
	}
	if result == nil {
		return &domain.AdminContentTopicListResult{
			Items: []domain.AdminContentTopicGroupRecord{},
			Total: 0,
			Page:  1,
			Size:  size,
		}, nil
	}

	return result, nil
}

func ListAdminContentCategories(
	ctx context.Context,
	adminUser *domain.AdminUser,
	locale string,
) ([]domain.AdminContentCategoryRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminContentAuthRequired)
	}

	resolvedLocale, err := normalizeAdminContentLocale(locale, true)
	if err != nil {
		return nil, err
	}

	items, err := adminContentRepository.ListCategories(ctx, resolvedLocale)
	if err != nil {
		return nil, toAdminContentError(err, "failed to list content categories")
	}
	if items == nil {
		return []domain.AdminContentCategoryRecord{}, nil
	}

	return items, nil
}

func ListAdminContentCategoriesPage(
	ctx context.Context,
	adminUser *domain.AdminUser,
	filter domain.AdminContentTaxonomyFilter,
) (*domain.AdminContentCategoryListResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminContentAuthRequired)
	}

	page := clampPositiveInt(filter.Page, 1, 100000)
	size := clampPositiveInt(filter.Size, adminContentDefaultPageSize, adminContentMaxPageSize)
	resolvedLocale, err := normalizeAdminContentLocale(filter.Locale, true)
	if err != nil {
		return nil, err
	}
	resolvedPreferredLocale, err := normalizeAdminContentLocale(filter.PreferredLocale, true)
	if err != nil {
		return nil, err
	}

	result, err := adminContentRepository.ListCategoryGroups(
		ctx,
		domain.AdminContentTaxonomyFilter{
			Locale:          resolvedLocale,
			PreferredLocale: resolvedPreferredLocale,
			Query:           strings.TrimSpace(filter.Query),
			Page:            &page,
			Size:            &size,
		},
	)
	if err != nil {
		return nil, toAdminContentError(err, "failed to list content categories")
	}
	if result == nil {
		return &domain.AdminContentCategoryListResult{
			Items: []domain.AdminContentCategoryGroupRecord{},
			Total: 0,
			Page:  1,
			Size:  size,
		}, nil
	}

	return result, nil
}

func CreateAdminContentTopic(
	ctx context.Context,
	adminUser *domain.AdminUser,
	input domain.AdminContentTopicInput,
) (*domain.AdminContentTopicRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminContentAuthRequired)
	}

	record, err := normalizeAdminContentTopicInput(input)
	if err != nil {
		return nil, err
	}

	existing, err := adminContentRepository.FindTopicByLocaleAndID(ctx, record.Locale, record.ID)
	if err != nil {
		return nil, toAdminContentError(err, "failed to load content topic")
	}
	if existing != nil {
		return nil, apperrors.BadRequest("content topic already exists")
	}

	now := time.Now().UTC()
	saved, err := adminContentRepository.UpsertTopic(ctx, record, now)
	if err != nil {
		return nil, toAdminContentError(err, "failed to create content topic")
	}
	if saved == nil {
		return nil, apperrors.Internal("failed to create content topic", nil)
	}

	if err := adminContentRepository.SyncTopicOnPosts(ctx, *saved, now); err != nil {
		return nil, toAdminContentError(err, "failed to sync content topic on posts")
	}

	if err := createAdminContentAuditLog(
		ctx,
		adminUser,
		"content_topic_created",
		"topic",
		saved.Locale,
		saved.ID,
		"",
		marshalAdminContentAuditValue(saved),
	); err != nil {
		return nil, err
	}

	return saved, nil
}

func UpdateAdminContentTopic(
	ctx context.Context,
	adminUser *domain.AdminUser,
	input domain.AdminContentTopicInput,
) (*domain.AdminContentTopicRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminContentAuthRequired)
	}

	record, err := normalizeAdminContentTopicInput(input)
	if err != nil {
		return nil, err
	}

	existing, err := adminContentRepository.FindTopicByLocaleAndID(ctx, record.Locale, record.ID)
	if err != nil {
		return nil, toAdminContentError(err, "failed to load content topic")
	}
	if existing == nil {
		return nil, apperrors.BadRequest("content topic not found")
	}

	now := time.Now().UTC()
	saved, err := adminContentRepository.UpsertTopic(ctx, record, now)
	if err != nil {
		return nil, toAdminContentError(err, "failed to update content topic")
	}
	if saved == nil {
		return nil, apperrors.Internal("failed to update content topic", nil)
	}

	if err := adminContentRepository.SyncTopicOnPosts(ctx, *saved, now); err != nil {
		return nil, toAdminContentError(err, "failed to sync content topic on posts")
	}

	if err := createAdminContentAuditLog(
		ctx,
		adminUser,
		"content_topic_updated",
		"topic",
		saved.Locale,
		saved.ID,
		marshalAdminContentAuditValue(existing),
		marshalAdminContentAuditValue(saved),
	); err != nil {
		return nil, err
	}

	return saved, nil
}

func DeleteAdminContentTopic(
	ctx context.Context,
	adminUser *domain.AdminUser,
	locale string,
	topicID string,
) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized(adminContentAuthRequired)
	}

	resolvedLocale, err := normalizeAdminContentLocale(locale, false)
	if err != nil {
		return err
	}
	resolvedTopicID, err := normalizeAdminContentID(topicID, "topic id")
	if err != nil {
		return err
	}

	existing, err := adminContentRepository.FindTopicByLocaleAndID(ctx, resolvedLocale, resolvedTopicID)
	if err != nil {
		return toAdminContentError(err, "failed to load content topic")
	}
	if existing == nil {
		return apperrors.BadRequest("content topic not found")
	}

	deleted, err := adminContentRepository.DeleteTopicByLocaleAndID(ctx, resolvedLocale, resolvedTopicID)
	if err != nil {
		return toAdminContentError(err, "failed to delete content topic")
	}
	if !deleted {
		return apperrors.BadRequest("content topic not found")
	}

	now := time.Now().UTC()
	if err := adminContentRepository.RemoveTopicFromPosts(ctx, resolvedLocale, resolvedTopicID, now); err != nil {
		return toAdminContentError(err, "failed to remove content topic from posts")
	}

	return createAdminContentAuditLog(
		ctx,
		adminUser,
		"content_topic_deleted",
		"topic",
		resolvedLocale,
		resolvedTopicID,
		marshalAdminContentAuditValue(existing),
		"",
	)
}

func CreateAdminContentCategory(
	ctx context.Context,
	adminUser *domain.AdminUser,
	input domain.AdminContentCategoryInput,
) (*domain.AdminContentCategoryRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminContentAuthRequired)
	}

	record, err := normalizeAdminContentCategoryInput(input)
	if err != nil {
		return nil, err
	}

	existing, err := adminContentRepository.FindCategoryByLocaleAndID(ctx, record.Locale, record.ID)
	if err != nil {
		return nil, toAdminContentError(err, "failed to load content category")
	}
	if existing != nil {
		return nil, apperrors.BadRequest("content category already exists")
	}

	now := time.Now().UTC()
	saved, err := adminContentRepository.UpsertCategory(ctx, record, now)
	if err != nil {
		return nil, toAdminContentError(err, "failed to create content category")
	}
	if saved == nil {
		return nil, apperrors.Internal("failed to create content category", nil)
	}

	if err := adminContentRepository.SyncCategoryOnPosts(ctx, *saved, now); err != nil {
		return nil, toAdminContentError(err, "failed to sync content category on posts")
	}

	if err := createAdminContentAuditLog(
		ctx,
		adminUser,
		"content_category_created",
		"category",
		saved.Locale,
		saved.ID,
		"",
		marshalAdminContentAuditValue(saved),
	); err != nil {
		return nil, err
	}

	return saved, nil
}

func UpdateAdminContentCategory(
	ctx context.Context,
	adminUser *domain.AdminUser,
	input domain.AdminContentCategoryInput,
) (*domain.AdminContentCategoryRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminContentAuthRequired)
	}

	record, err := normalizeAdminContentCategoryInput(input)
	if err != nil {
		return nil, err
	}

	existing, err := adminContentRepository.FindCategoryByLocaleAndID(ctx, record.Locale, record.ID)
	if err != nil {
		return nil, toAdminContentError(err, "failed to load content category")
	}
	if existing == nil {
		return nil, apperrors.BadRequest("content category not found")
	}

	now := time.Now().UTC()
	saved, err := adminContentRepository.UpsertCategory(ctx, record, now)
	if err != nil {
		return nil, toAdminContentError(err, "failed to update content category")
	}
	if saved == nil {
		return nil, apperrors.Internal("failed to update content category", nil)
	}

	if err := adminContentRepository.SyncCategoryOnPosts(ctx, *saved, now); err != nil {
		return nil, toAdminContentError(err, "failed to sync content category on posts")
	}

	if err := createAdminContentAuditLog(
		ctx,
		adminUser,
		"content_category_updated",
		"category",
		saved.Locale,
		saved.ID,
		marshalAdminContentAuditValue(existing),
		marshalAdminContentAuditValue(saved),
	); err != nil {
		return nil, err
	}

	return saved, nil
}

func DeleteAdminContentCategory(
	ctx context.Context,
	adminUser *domain.AdminUser,
	locale string,
	categoryID string,
) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized(adminContentAuthRequired)
	}

	resolvedLocale, err := normalizeAdminContentLocale(locale, false)
	if err != nil {
		return err
	}
	resolvedCategoryID, err := normalizeAdminContentID(categoryID, "category id")
	if err != nil {
		return err
	}

	existing, err := adminContentRepository.FindCategoryByLocaleAndID(ctx, resolvedLocale, resolvedCategoryID)
	if err != nil {
		return toAdminContentError(err, "failed to load content category")
	}
	if existing == nil {
		return apperrors.BadRequest("content category not found")
	}

	deleted, err := adminContentRepository.DeleteCategoryByLocaleAndID(ctx, resolvedLocale, resolvedCategoryID)
	if err != nil {
		return toAdminContentError(err, "failed to delete content category")
	}
	if !deleted {
		return apperrors.BadRequest("content category not found")
	}

	now := time.Now().UTC()
	if err := adminContentRepository.ClearCategoryFromPosts(ctx, resolvedLocale, resolvedCategoryID, now); err != nil {
		return toAdminContentError(err, "failed to remove content category from posts")
	}

	return createAdminContentAuditLog(
		ctx,
		adminUser,
		"content_category_deleted",
		"category",
		resolvedLocale,
		resolvedCategoryID,
		marshalAdminContentAuditValue(existing),
		"",
	)
}

func normalizeAdminContentTopicInput(input domain.AdminContentTopicInput) (domain.AdminContentTopicRecord, error) {
	resolvedLocale, err := normalizeAdminContentLocale(input.Locale, false)
	if err != nil {
		return domain.AdminContentTopicRecord{}, err
	}
	resolvedID, err := normalizeAdminContentID(input.ID, "topic id")
	if err != nil {
		return domain.AdminContentTopicRecord{}, err
	}
	resolvedName, err := normalizeAdminContentName(input.Name, "topic name")
	if err != nil {
		return domain.AdminContentTopicRecord{}, err
	}
	resolvedColor, err := normalizeAdminContentColor(input.Color, "topic color")
	if err != nil {
		return domain.AdminContentTopicRecord{}, err
	}
	resolvedLink, err := normalizeAdminContentLink(input.Link)
	if err != nil {
		return domain.AdminContentTopicRecord{}, err
	}

	return domain.AdminContentTopicRecord{
		Locale: resolvedLocale,
		ID:     resolvedID,
		Name:   resolvedName,
		Color:  resolvedColor,
		Link:   resolvedLink,
	}, nil
}

func normalizeAdminContentCategoryInput(
	input domain.AdminContentCategoryInput,
) (domain.AdminContentCategoryRecord, error) {
	resolvedLocale, err := normalizeAdminContentLocale(input.Locale, false)
	if err != nil {
		return domain.AdminContentCategoryRecord{}, err
	}
	resolvedID, err := normalizeAdminContentID(input.ID, "category id")
	if err != nil {
		return domain.AdminContentCategoryRecord{}, err
	}
	resolvedName, err := normalizeAdminContentName(input.Name, "category name")
	if err != nil {
		return domain.AdminContentCategoryRecord{}, err
	}
	resolvedColor, err := normalizeAdminContentColor(input.Color, "category color")
	if err != nil {
		return domain.AdminContentCategoryRecord{}, err
	}
	resolvedIcon := strings.TrimSpace(input.Icon)
	if len(resolvedIcon) > adminContentIconMaxLength {
		return domain.AdminContentCategoryRecord{}, apperrors.BadRequest("category icon is too long")
	}
	resolvedLink, err := normalizeAdminContentLink(input.Link)
	if err != nil {
		return domain.AdminContentCategoryRecord{}, err
	}

	return domain.AdminContentCategoryRecord{
		Locale: resolvedLocale,
		ID:     resolvedID,
		Name:   resolvedName,
		Color:  resolvedColor,
		Icon:   resolvedIcon,
		Link:   resolvedLink,
	}, nil
}
