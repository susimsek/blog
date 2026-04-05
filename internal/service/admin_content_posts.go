package service

import (
	"context"
	"net/url"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/pkg/apperrors"
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
		topic, topicErr := adminContentRepository.FindTopicByLocaleAndID(ctx, resolvedLocale, topicID)
		if topicErr != nil {
			return nil, toAdminContentError(topicErr, adminContentLoadTopicFailed)
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
	resolvedPostID, err := normalizeAdminContentID(postID, adminContentPostIDField)
	if err != nil {
		return nil, err
	}

	record, err := adminContentRepository.FindPostByLocaleAndID(ctx, resolvedLocale, resolvedPostID)
	if err != nil {
		return nil, toAdminContentError(err, adminContentLoadPostFailed)
	}
	if record == nil {
		return nil, apperrors.BadRequest(adminContentPostNotFound)
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
	resolvedContent, err := normalizeAdminContentBody(input.Content)
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

func DeleteAdminContentPost(
	ctx context.Context,
	adminUser *domain.AdminUser,
	locale string,
	postID string,
) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized(adminContentAuthRequired)
	}

	resolvedLocale, err := normalizeAdminContentLocale(locale, false)
	if err != nil {
		return err
	}
	resolvedPostID, err := normalizeAdminContentID(postID, adminContentPostIDField)
	if err != nil {
		return err
	}

	before, err := adminContentRepository.FindPostByLocaleAndID(ctx, resolvedLocale, resolvedPostID)
	if err != nil {
		return toAdminContentError(err, adminContentLoadPostFailed)
	}
	if before == nil {
		return apperrors.BadRequest(adminContentPostNotFound)
	}

	deleted, err := adminContentRepository.DeletePostByLocaleAndID(ctx, resolvedLocale, resolvedPostID)
	if err != nil {
		return toAdminContentError(err, "failed to delete content post")
	}
	if !deleted {
		return apperrors.BadRequest(adminContentPostNotFound)
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
