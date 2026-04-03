package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpapi"
)

const (
	adminContentDefaultPageSize         = 20
	adminContentMaxPageSize             = 100
	adminContentIDMaxLength             = 128
	adminContentNameMaxLength           = 120
	adminContentTitleMaxLength          = 240
	adminContentSummaryMaxLength        = 4000
	adminContentColorMaxLength          = 32
	adminContentIconMaxLength           = 64
	adminContentLinkMaxLength           = 512
	adminContentThumbnailMaxLength      = 1024
	adminContentBodyMaxLength           = 400000
	adminContentRevisionDefaultPageSize = 10

	adminContentAuditResource      = "admin_content_management"
	adminContentAuditStatusSuccess = "success"
	adminContentAuthRequired       = "admin authentication required"
	adminContentCategoryIDField    = "category id"
	adminContentTopicIDField       = "topic id"
	adminContentPostIDField        = "post id"
	adminContentPostNotFound       = "content post not found"
	adminContentCategoryNotFound   = "content category not found"
	adminContentTopicNotFound      = "content topic not found"
	adminContentLoadPostFailed     = "failed to load content post"
	adminContentLoadCategoryFailed = "failed to load content category"
	adminContentLoadTopicFailed    = "failed to load content topic"
	adminContentInvalidLink        = "invalid content link"
	adminContentFieldRequired      = " is required"
	adminContentFieldInvalid       = "invalid "
	adminContentRevisionNotFound   = "content post revision not found"
)

var (
	adminContentIDPattern                                    = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,127}$`)
	adminContentRepository repository.AdminContentRepository = repository.NewAdminContentRepository()
)

func ListAdminContentPosts(
	ctx context.Context,
	adminUser *domain.AdminUser,
	filter domain.AdminContentPostFilter,
) (*domain.AdminContentPostListResult, error) {
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
	if resolvedPreferredLocale == "" {
		resolvedPreferredLocale = adminErrorLocaleEN
	}
	resolvedSource, err := normalizeAdminContentSource(filter.Source, true)
	if err != nil {
		return nil, err
	}

	resolvedCategoryID := strings.TrimSpace(strings.ToLower(filter.CategoryID))
	if resolvedCategoryID != "" {
		if _, err := normalizeAdminContentID(resolvedCategoryID, adminContentCategoryIDField); err != nil {
			return nil, err
		}
	}

	resolvedTopicID := strings.TrimSpace(strings.ToLower(filter.TopicID))
	if resolvedTopicID != "" {
		if _, err := normalizeAdminContentID(resolvedTopicID, adminContentTopicIDField); err != nil {
			return nil, err
		}
	}

	result, err := adminContentRepository.ListPostGroups(ctx, domain.AdminContentPostFilter{
		Locale:          resolvedLocale,
		PreferredLocale: resolvedPreferredLocale,
		Source:          resolvedSource,
		Query:           strings.TrimSpace(filter.Query),
		CategoryID:      resolvedCategoryID,
		TopicID:         resolvedTopicID,
		Page:            &page,
		Size:            &size,
	})
	if err != nil {
		return nil, toAdminContentError(err, "failed to list content posts")
	}
	if result == nil {
		return &domain.AdminContentPostListResult{
			Items: []domain.AdminContentPostGroupRecord{},
			Total: 0,
			Page:  1,
			Size:  size,
		}, nil
	}

	populateAdminContentPostGroupAnalytics(ctx, result.Items)
	return result, nil
}

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

func UpdateAdminContentPostMetadata( // NOSONAR
	ctx context.Context,
	adminUser *domain.AdminUser,
	input domain.AdminContentPostMetadataInput,
) (*domain.AdminContentPostRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminContentAuthRequired)
	}

	resolvedLocale, err := normalizeAdminContentLocale(input.Locale, false)
	if err != nil {
		return nil, err
	}
	resolvedPostID, err := normalizeAdminContentID(input.ID, adminContentPostIDField)
	if err != nil {
		return nil, err
	}

	before, err := adminContentRepository.FindPostByLocaleAndID(ctx, resolvedLocale, resolvedPostID)
	if err != nil {
		return nil, toAdminContentError(err, adminContentLoadPostFailed)
	}
	if before == nil {
		return nil, apperrors.BadRequest(adminContentPostNotFound)
	}

	metadataFields, err := normalizeAdminContentPostMetadataFields(input, *before)
	if err != nil {
		return nil, err
	}

	resolvedCategoryID := strings.TrimSpace(strings.ToLower(input.CategoryID))
	if resolvedCategoryID != "" {
		if _, err := normalizeAdminContentID(resolvedCategoryID, adminContentCategoryIDField); err != nil {
			return nil, err
		}
	}

	var category *domain.AdminContentCategoryRecord
	if resolvedCategoryID != "" {
		category, err = adminContentRepository.FindCategoryByLocaleAndID(ctx, resolvedLocale, resolvedCategoryID)
		if err != nil {
			return nil, toAdminContentError(err, adminContentLoadCategoryFailed)
		}
		if category == nil {
			return nil, apperrors.BadRequest(adminContentCategoryNotFound)
		}
	}

	resolvedTopicIDs, err := normalizeAdminContentIDs(input.TopicIDs, adminContentTopicIDField)
	if err != nil {
		return nil, err
	}
	topics := make([]domain.AdminContentTopicRecord, 0, len(resolvedTopicIDs))
	for _, topicID := range resolvedTopicIDs {
		topic, err := adminContentRepository.FindTopicByLocaleAndID(ctx, resolvedLocale, topicID)
		if err != nil {
			return nil, toAdminContentError(err, adminContentLoadTopicFailed)
		}
		if topic == nil {
			return nil, apperrors.BadRequest(adminContentTopicNotFound)
		}
		topics = append(topics, *topic)
	}

	now := time.Now().UTC()
	var revisionStamp *domain.AdminContentPostRevisionStamp
	if adminContentMetadataChanged(*before, metadataFields, resolvedCategoryID, resolvedTopicIDs) {
		savedRevision, revisionErr := adminContentRepository.CreatePostRevision(
			ctx,
			*before,
			before.RevisionCount+1,
			now,
		)
		if revisionErr != nil {
			return nil, toAdminContentError(revisionErr, "failed to create content post revision")
		}
		revisionStamp = &domain.AdminContentPostRevisionStamp{
			Number:    savedRevision.RevisionNumber,
			CreatedAt: savedRevision.CreatedAt,
		}
	}

	updated, err := adminContentRepository.UpdatePostMetadata(
		ctx,
		resolvedLocale,
		resolvedPostID,
		metadataFields,
		category,
		topics,
		revisionStamp,
		now,
	)
	if err != nil {
		return nil, toAdminContentError(err, "failed to update content post")
	}

	if err := createAdminContentAuditLog(
		ctx,
		adminUser,
		"content_post_updated",
		"post",
		resolvedLocale,
		resolvedPostID,
		marshalAdminContentAuditValue(before),
		marshalAdminContentAuditValue(updated),
	); err != nil {
		return nil, err
	}

	return populateAdminContentPostAnalytics(ctx, updated), nil
}

func GetAdminContentPost(
	ctx context.Context,
	adminUser *domain.AdminUser,
	locale string,
	postID string,
) (*domain.AdminContentPostRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminContentAuthRequired)
	}

	resolvedLocale, err := normalizeAdminContentLocale(locale, false)
	if err != nil {
		return nil, err
	}
	resolvedPostID, err := normalizeAdminContentID(postID, "post id")
	if err != nil {
		return nil, err
	}

	record, err := adminContentRepository.FindPostByLocaleAndID(ctx, resolvedLocale, resolvedPostID)
	if err != nil {
		return nil, toAdminContentError(err, "failed to load content post")
	}
	if record == nil {
		return nil, apperrors.BadRequest("content post not found")
	}

	return populateAdminContentPostAnalytics(ctx, record), nil
}

func ListAdminContentPostRevisions(
	ctx context.Context,
	adminUser *domain.AdminUser,
	locale string,
	postID string,
	page *int,
	size *int,
) (*domain.AdminContentPostRevisionListResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminContentAuthRequired)
	}

	resolvedLocale, err := normalizeAdminContentLocale(locale, false)
	if err != nil {
		return nil, err
	}
	resolvedPostID, err := normalizeAdminContentID(postID, adminContentPostIDField)
	if err != nil {
		return nil, err
	}

	resolvedPage := clampPositiveInt(page, 1, 100000)
	resolvedSize := clampPositiveInt(size, adminContentRevisionDefaultPageSize, adminContentMaxPageSize)
	result, err := adminContentRepository.ListPostRevisions(ctx, resolvedLocale, resolvedPostID, resolvedPage, resolvedSize)
	if err != nil {
		return nil, toAdminContentError(err, "failed to list content post revisions")
	}
	if result == nil {
		return &domain.AdminContentPostRevisionListResult{
			Items: []domain.AdminContentPostRevisionRecord{},
			Total: 0,
			Page:  1,
			Size:  resolvedSize,
		}, nil
	}
	return result, nil
}

func UpdateAdminContentPostContent(
	ctx context.Context,
	adminUser *domain.AdminUser,
	input domain.AdminContentPostContentInput,
) (*domain.AdminContentPostRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	resolvedLocale, err := normalizeAdminContentLocale(input.Locale, false)
	if err != nil {
		return nil, err
	}
	resolvedPostID, err := normalizeAdminContentID(input.ID, "post id")
	if err != nil {
		return nil, err
	}
	resolvedContent, err := normalizeAdminContentBody(input.Content)
	if err != nil {
		return nil, err
	}

	before, err := adminContentRepository.FindPostByLocaleAndID(ctx, resolvedLocale, resolvedPostID)
	if err != nil {
		return nil, toAdminContentError(err, "failed to load content post")
	}
	if before == nil {
		return nil, apperrors.BadRequest("content post not found")
	}
	if strings.ToLower(strings.TrimSpace(before.Source)) != "blog" {
		return nil, apperrors.BadRequest("content updates are only allowed for blog posts")
	}

	now := time.Now().UTC()
	var revisionStamp *domain.AdminContentPostRevisionStamp
	if strings.TrimSpace(before.Content) != strings.TrimSpace(resolvedContent) {
		savedRevision, revisionErr := adminContentRepository.CreatePostRevision(
			ctx,
			*before,
			before.RevisionCount+1,
			now,
		)
		if revisionErr != nil {
			return nil, toAdminContentError(revisionErr, "failed to create content post revision")
		}
		revisionStamp = &domain.AdminContentPostRevisionStamp{
			Number:    savedRevision.RevisionNumber,
			CreatedAt: savedRevision.CreatedAt,
		}
	}

	updated, err := adminContentRepository.UpdatePostContent(
		ctx,
		resolvedLocale,
		resolvedPostID,
		resolvedContent,
		revisionStamp,
		now,
	)
	if err != nil {
		return nil, toAdminContentError(err, "failed to update content post content")
	}

	if err := createAdminContentAuditLog(
		ctx,
		adminUser,
		"content_post_content_updated",
		"post",
		resolvedLocale,
		resolvedPostID,
		marshalAdminContentAuditValue(before),
		marshalAdminContentAuditValue(updated),
	); err != nil {
		return nil, err
	}

	return populateAdminContentPostAnalytics(ctx, updated), nil
}

func RestoreAdminContentPostRevision(
	ctx context.Context,
	adminUser *domain.AdminUser,
	locale string,
	postID string,
	revisionID string,
) (*domain.AdminContentPostRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized(adminContentAuthRequired)
	}

	resolvedLocale, err := normalizeAdminContentLocale(locale, false)
	if err != nil {
		return nil, err
	}
	resolvedPostID, err := normalizeAdminContentID(postID, adminContentPostIDField)
	if err != nil {
		return nil, err
	}
	resolvedRevisionID := strings.TrimSpace(revisionID)
	if resolvedRevisionID == "" {
		return nil, apperrors.BadRequest("content post revision id is required")
	}

	before, err := adminContentRepository.FindPostByLocaleAndID(ctx, resolvedLocale, resolvedPostID)
	if err != nil {
		return nil, toAdminContentError(err, adminContentLoadPostFailed)
	}
	if before == nil {
		return nil, apperrors.BadRequest(adminContentPostNotFound)
	}

	revision, err := adminContentRepository.FindPostRevisionByID(ctx, resolvedLocale, resolvedPostID, resolvedRevisionID)
	if err != nil {
		return nil, toAdminContentError(err, "failed to load content post revision")
	}
	if revision == nil {
		return nil, apperrors.BadRequest(adminContentRevisionNotFound)
	}

	now := time.Now().UTC()
	savedRevision, err := adminContentRepository.CreatePostRevision(ctx, *before, before.RevisionCount+1, now)
	if err != nil {
		return nil, toAdminContentError(err, "failed to create content post revision")
	}

	updated, err := adminContentRepository.RestorePostRevision(
		ctx,
		*revision,
		&domain.AdminContentPostRevisionStamp{
			Number:    savedRevision.RevisionNumber,
			CreatedAt: savedRevision.CreatedAt,
		},
		now,
	)
	if err != nil {
		return nil, toAdminContentError(err, "failed to restore content post revision")
	}

	if err := createAdminContentAuditLog(
		ctx,
		adminUser,
		"content_post_revision_restored",
		"post",
		resolvedLocale,
		resolvedPostID,
		marshalAdminContentAuditValue(before),
		marshalAdminContentAuditValue(updated),
	); err != nil {
		return nil, err
	}

	return populateAdminContentPostAnalytics(ctx, updated), nil
}

func populateAdminContentPostAnalytics(
	ctx context.Context,
	record *domain.AdminContentPostRecord,
) *domain.AdminContentPostRecord {
	if record == nil || strings.TrimSpace(record.ID) == "" {
		return record
	}

	postScope := []domain.PostRecord{{ID: record.ID}}
	postIDs := []string{record.ID}

	if likesByPostID := postsRepository.ResolveLikesByPostID(ctx, postScope); likesByPostID != nil {
		record.LikeCount = likesByPostID[record.ID]
	}
	if hitsByPostID := postsRepository.ResolveHitsByPostID(ctx, postScope); hitsByPostID != nil {
		record.ViewCount = hitsByPostID[record.ID]
	}
	if commentsByPostID, err := postCommentRepository.CountApprovedByPosts(ctx, postIDs); err == nil && commentsByPostID != nil {
		record.CommentCount = commentsByPostID[record.ID]
	}

	return record
}

func populateAdminContentPostGroupAnalytics(ctx context.Context, groups []domain.AdminContentPostGroupRecord) {
	if len(groups) == 0 {
		return
	}

	seenPostIDs := make(map[string]struct{}, len(groups))
	postScope := make([]domain.PostRecord, 0, len(groups))
	postIDs := make([]string, 0, len(groups))

	collect := func(item *domain.AdminContentPostRecord) {
		if item == nil || strings.TrimSpace(item.ID) == "" {
			return
		}
		if _, exists := seenPostIDs[item.ID]; exists {
			return
		}
		seenPostIDs[item.ID] = struct{}{}
		postScope = append(postScope, domain.PostRecord{ID: item.ID})
		postIDs = append(postIDs, item.ID)
	}

	for index := range groups {
		collect(&groups[index].Preferred)
		collect(groups[index].EN)
		collect(groups[index].TR)
	}

	if len(postScope) == 0 {
		return
	}

	likesByPostID := postsRepository.ResolveLikesByPostID(ctx, postScope)
	hitsByPostID := postsRepository.ResolveHitsByPostID(ctx, postScope)
	commentsByPostID, _ := postCommentRepository.CountApprovedByPosts(ctx, postIDs)

	apply := func(item *domain.AdminContentPostRecord) {
		if item == nil {
			return
		}
		item.LikeCount = likesByPostID[item.ID]
		item.ViewCount = hitsByPostID[item.ID]
		if commentsByPostID != nil {
			item.CommentCount = commentsByPostID[item.ID]
		}
	}

	for index := range groups {
		apply(&groups[index].Preferred)
		apply(groups[index].EN)
		apply(groups[index].TR)
	}
}

func DeleteAdminContentPost(
	ctx context.Context,
	adminUser *domain.AdminUser,
	locale string,
	postID string,
) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized("admin authentication required")
	}

	resolvedLocale, err := normalizeAdminContentLocale(locale, false)
	if err != nil {
		return err
	}
	resolvedPostID, err := normalizeAdminContentID(postID, "post id")
	if err != nil {
		return err
	}

	before, err := adminContentRepository.FindPostByLocaleAndID(ctx, resolvedLocale, resolvedPostID)
	if err != nil {
		return toAdminContentError(err, "failed to load content post")
	}
	if before == nil {
		return apperrors.BadRequest("content post not found")
	}

	deleted, err := adminContentRepository.DeletePostByLocaleAndID(ctx, resolvedLocale, resolvedPostID)
	if err != nil {
		return toAdminContentError(err, "failed to delete content post")
	}
	if !deleted {
		return apperrors.BadRequest("content post not found")
	}

	return createAdminContentAuditLog(
		ctx,
		adminUser,
		"content_post_deleted",
		"post",
		resolvedLocale,
		resolvedPostID,
		marshalAdminContentAuditValue(before),
		"",
	)
}

func CreateAdminContentTopic(
	ctx context.Context,
	adminUser *domain.AdminUser,
	input domain.AdminContentTopicInput,
) (*domain.AdminContentTopicRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
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
		return nil, apperrors.Unauthorized("admin authentication required")
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
		return apperrors.Unauthorized("admin authentication required")
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
		return nil, apperrors.Unauthorized("admin authentication required")
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
		return nil, apperrors.Unauthorized("admin authentication required")
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
		return apperrors.Unauthorized("admin authentication required")
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

func normalizeAdminContentPostMetadataFields(
	input domain.AdminContentPostMetadataInput,
	before domain.AdminContentPostRecord,
) (domain.AdminContentPostMetadataFields, error) {
	title := strings.TrimSpace(before.Title)
	if input.Title != nil {
		resolvedTitle, err := normalizeAdminContentPostTitle(*input.Title)
		if err != nil {
			return domain.AdminContentPostMetadataFields{}, err
		}
		title = resolvedTitle
	}

	summary := strings.TrimSpace(before.Summary)
	if input.Summary != nil {
		resolvedSummary, err := normalizeAdminContentPostSummary(*input.Summary)
		if err != nil {
			return domain.AdminContentPostMetadataFields{}, err
		}
		summary = resolvedSummary
	}

	thumbnail := strings.TrimSpace(before.Thumbnail)
	if input.Thumbnail != nil {
		resolvedThumbnail, err := normalizeAdminContentThumbnail(*input.Thumbnail)
		if err != nil {
			return domain.AdminContentPostMetadataFields{}, err
		}
		thumbnail = resolvedThumbnail
	}

	publishedDate := strings.TrimSpace(before.PublishedDate)
	if input.PublishedDate != nil {
		resolvedPublishedDate, err := normalizeAdminContentRequiredDate(*input.PublishedDate, "published date")
		if err != nil {
			return domain.AdminContentPostMetadataFields{}, err
		}
		publishedDate = resolvedPublishedDate
	}

	updatedDate := strings.TrimSpace(before.UpdatedDate)
	if input.UpdatedDate != nil {
		resolvedUpdatedDate, err := normalizeAdminContentOptionalDate(*input.UpdatedDate, "updated date")
		if err != nil {
			return domain.AdminContentPostMetadataFields{}, err
		}
		updatedDate = resolvedUpdatedDate
	}

	status, scheduledAt, err := normalizeAdminContentPostLifecycle(input, before)
	if err != nil {
		return domain.AdminContentPostMetadataFields{}, err
	}

	return domain.AdminContentPostMetadataFields{
		Title:         title,
		Summary:       summary,
		Thumbnail:     thumbnail,
		PublishedDate: publishedDate,
		UpdatedDate:   updatedDate,
		Status:        status,
		ScheduledAt:   scheduledAt,
	}, nil
}

func normalizeAdminContentPostLifecycle(
	input domain.AdminContentPostMetadataInput,
	before domain.AdminContentPostRecord,
) (string, time.Time, error) {
	status := normalizeAdminContentPostStatus(before.Status)
	if input.Status != nil {
		status = normalizeAdminContentPostStatus(*input.Status)
	}

	scheduledAt := before.ScheduledAt.UTC()
	if input.ScheduledAt != nil {
		scheduledAt = input.ScheduledAt.UTC()
	}

	switch status {
	case domain.AdminContentPostStatusDraft:
		return status, time.Time{}, nil
	case domain.AdminContentPostStatusPublished:
		return status, time.Time{}, nil
	case domain.AdminContentPostStatusScheduled:
		if scheduledAt.IsZero() {
			return "", time.Time{}, apperrors.BadRequest("scheduled publish date is required")
		}
		if !scheduledAt.After(time.Now().UTC()) {
			return "", time.Time{}, apperrors.BadRequest("scheduled publish date must be in the future")
		}
		return status, scheduledAt, nil
	default:
		return "", time.Time{}, apperrors.BadRequest("invalid content post status")
	}
}

func normalizeAdminContentPostStatus(value string) string {
	switch strings.TrimSpace(strings.ToLower(value)) {
	case domain.AdminContentPostStatusDraft:
		return domain.AdminContentPostStatusDraft
	case domain.AdminContentPostStatusScheduled:
		return domain.AdminContentPostStatusScheduled
	default:
		return domain.AdminContentPostStatusPublished
	}
}

func adminContentMetadataChanged(
	before domain.AdminContentPostRecord,
	fields domain.AdminContentPostMetadataFields,
	categoryID string,
	topicIDs []string,
) bool {
	if strings.TrimSpace(before.Title) != strings.TrimSpace(fields.Title) ||
		strings.TrimSpace(before.Summary) != strings.TrimSpace(fields.Summary) ||
		strings.TrimSpace(before.Thumbnail) != strings.TrimSpace(fields.Thumbnail) ||
		strings.TrimSpace(before.PublishedDate) != strings.TrimSpace(fields.PublishedDate) ||
		strings.TrimSpace(before.UpdatedDate) != strings.TrimSpace(fields.UpdatedDate) ||
		normalizeAdminContentPostStatus(before.Status) != normalizeAdminContentPostStatus(fields.Status) ||
		!before.ScheduledAt.Equal(fields.ScheduledAt) ||
		strings.TrimSpace(strings.ToLower(before.CategoryID)) != strings.TrimSpace(strings.ToLower(categoryID)) {
		return true
	}

	if len(before.TopicIDs) != len(topicIDs) {
		return true
	}
	for index := range before.TopicIDs {
		if strings.TrimSpace(strings.ToLower(before.TopicIDs[index])) != strings.TrimSpace(strings.ToLower(topicIDs[index])) {
			return true
		}
	}

	return false
}

func normalizeAdminContentPostTitle(value string) (string, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		return "", apperrors.BadRequest("post title is required")
	}
	if len(resolved) > adminContentTitleMaxLength {
		return "", apperrors.BadRequest("post title is too long")
	}
	return resolved, nil
}

func normalizeAdminContentPostSummary(value string) (string, error) {
	resolved := strings.TrimSpace(value)
	if len(resolved) > adminContentSummaryMaxLength {
		return "", apperrors.BadRequest("post summary is too long")
	}
	return resolved, nil
}

func normalizeAdminContentThumbnail(value string) (string, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		return "", nil
	}
	if len(resolved) > adminContentThumbnailMaxLength {
		return "", apperrors.BadRequest("post thumbnail is too long")
	}
	if strings.HasPrefix(resolved, "/") {
		return resolved, nil
	}

	parsed, err := url.Parse(resolved)
	if err != nil {
		return "", apperrors.BadRequest("invalid post thumbnail")
	}
	scheme := strings.ToLower(strings.TrimSpace(parsed.Scheme))
	if (scheme != "http" && scheme != "https") || strings.TrimSpace(parsed.Host) == "" {
		return "", apperrors.BadRequest("invalid post thumbnail")
	}

	return resolved, nil
}

func normalizeAdminContentRequiredDate(value, field string) (string, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		return "", apperrors.BadRequest(field + adminContentFieldRequired)
	}
	if _, err := time.Parse("2006-01-02", resolved); err != nil {
		return "", apperrors.BadRequest(adminContentFieldInvalid + field)
	}
	return resolved, nil
}

func normalizeAdminContentOptionalDate(value, field string) (string, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		return "", nil
	}
	if _, err := time.Parse("2006-01-02", resolved); err != nil {
		return "", apperrors.BadRequest(adminContentFieldInvalid + field)
	}
	return resolved, nil
}

func normalizeAdminContentLocale(value string, allowAll bool) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	switch resolved {
	case "", "all":
		if allowAll {
			return "", nil
		}
		return "", apperrors.BadRequest("content locale is required")
	case adminErrorLocaleEN, adminErrorLocaleTR:
		return resolved, nil
	default:
		return "", apperrors.BadRequest("unsupported content locale")
	}
}

func normalizeAdminContentSource(value string, allowAll bool) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	switch resolved {
	case "", "all":
		if allowAll {
			return "", nil
		}
		return "", apperrors.BadRequest("content source is required")
	case "blog", "medium":
		return resolved, nil
	default:
		return "", apperrors.BadRequest("unsupported content source")
	}
}

func normalizeAdminContentID(value, field string) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	if resolved == "" {
		return "", apperrors.BadRequest(field + adminContentFieldRequired)
	}
	if len(resolved) > adminContentIDMaxLength || !adminContentIDPattern.MatchString(resolved) {
		return "", apperrors.BadRequest(adminContentFieldInvalid + field)
	}
	return resolved, nil
}

func normalizeAdminContentIDs(values []string, field string) ([]string, error) {
	if len(values) == 0 {
		return []string{}, nil
	}

	seen := make(map[string]struct{}, len(values))
	ids := make([]string, 0, len(values))
	for _, value := range values {
		id, err := normalizeAdminContentID(value, field)
		if err != nil {
			return nil, err
		}
		if _, exists := seen[id]; exists {
			continue
		}
		seen[id] = struct{}{}
		ids = append(ids, id)
	}

	sort.Strings(ids)
	return ids, nil
}

func normalizeAdminContentName(value, field string) (string, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		return "", apperrors.BadRequest(field + adminContentFieldRequired)
	}
	if len(resolved) > adminContentNameMaxLength {
		return "", apperrors.BadRequest(field + " is too long")
	}
	return resolved, nil
}

func normalizeAdminContentColor(value, field string) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	if resolved == "" {
		return "", apperrors.BadRequest(field + adminContentFieldRequired)
	}
	if len(resolved) > adminContentColorMaxLength {
		return "", apperrors.BadRequest(field + " is too long")
	}
	return resolved, nil
}

func normalizeAdminContentLink(value string) (string, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		return "", nil
	}
	if len(resolved) > adminContentLinkMaxLength {
		return "", apperrors.BadRequest("content link is too long")
	}

	parsed, err := url.Parse(resolved)
	if err != nil {
		return "", apperrors.BadRequest(adminContentInvalidLink)
	}
	scheme := strings.ToLower(strings.TrimSpace(parsed.Scheme))
	if scheme != "http" && scheme != "https" {
		return "", apperrors.BadRequest(adminContentInvalidLink)
	}
	if strings.TrimSpace(parsed.Host) == "" {
		return "", apperrors.BadRequest(adminContentInvalidLink)
	}

	return resolved, nil
}

func normalizeAdminContentBody(value string) (string, error) {
	resolved := strings.ReplaceAll(value, "\r\n", "\n")
	if strings.TrimSpace(resolved) == "" {
		return "", apperrors.BadRequest("post content is required")
	}
	if len(resolved) > adminContentBodyMaxLength {
		return "", apperrors.BadRequest("post content is too long")
	}
	return resolved, nil
}

func toAdminContentError(err error, message string) error {
	switch {
	case errors.Is(err, repository.ErrAdminContentRepositoryUnavailable):
		return apperrors.ServiceUnavailable("admin content management is unavailable", err)
	case errors.Is(err, repository.ErrAdminContentPostNotFound):
		return apperrors.BadRequest(adminContentPostNotFound)
	case errors.Is(err, repository.ErrAdminContentTopicNotFound):
		return apperrors.BadRequest(adminContentTopicNotFound)
	case errors.Is(err, repository.ErrAdminContentCategoryNotFound):
		return apperrors.BadRequest(adminContentCategoryNotFound)
	default:
		return apperrors.Internal(message, err)
	}
}

func marshalAdminContentAuditValue(value any) string {
	if value == nil {
		return ""
	}

	jsonValue, err := json.Marshal(value)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(jsonValue))
}

func createAdminContentAuditLog( // NOSONAR
	ctx context.Context,
	adminUser *domain.AdminUser,
	action string,
	scope string,
	locale string,
	code string,
	beforeValue string,
	afterValue string,
) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized(adminContentAuthRequired)
	}

	trace, _ := httpapi.RequestTraceFromContext(ctx)
	record := domain.AdminAuditLogRecord{
		ActorID:     strings.TrimSpace(adminUser.ID),
		ActorEmail:  strings.TrimSpace(strings.ToLower(adminUser.Email)),
		Action:      strings.TrimSpace(action),
		Resource:    adminContentAuditResource,
		Scope:       strings.TrimSpace(scope),
		Locale:      strings.TrimSpace(strings.ToLower(locale)),
		Code:        strings.TrimSpace(strings.ToUpper(code)),
		BeforeValue: strings.TrimSpace(beforeValue),
		AfterValue:  strings.TrimSpace(afterValue),
		Status:      adminContentAuditStatusSuccess,
		RequestID:   httpapi.RequestIDFromContext(ctx),
		RemoteIP:    strings.TrimSpace(trace.RemoteIP),
		CountryCode: strings.TrimSpace(strings.ToUpper(trace.CountryCode)),
		UserAgent:   strings.TrimSpace(trace.UserAgent),
		CreatedAt:   time.Now().UTC(),
	}

	if err := adminAuditLogRepo.Create(ctx, record); err != nil {
		return apperrors.Internal("failed to persist admin audit log", err)
	}

	return nil
}
