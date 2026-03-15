package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/newsletter"
)

const (
	adminCommentDefaultPageSize = 20
	adminCommentMaxPageSize     = 100
)

func ListAdminComments(
	ctx context.Context,
	adminUser *domain.AdminUser,
	filter domain.AdminCommentFilter,
) (*domain.AdminCommentListResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	page := clampPositiveInt(filter.Page, 1, 100000)
	size := clampPositiveInt(filter.Size, adminCommentDefaultPageSize, adminCommentMaxPageSize)

	locale := strings.TrimSpace(strings.ToLower(filter.Locale))
	if locale != "" {
		locale = newsletter.ResolveLocale(locale, "")
	}

	status := strings.TrimSpace(strings.ToLower(filter.Status))
	if status != "" && !isSupportedCommentStatus(status) {
		return nil, apperrors.BadRequest("unsupported comment status")
	}

	postID := strings.TrimSpace(strings.ToLower(filter.PostID))
	if postID != "" {
		if _, ok := normalizePostID(postID); !ok {
			return nil, apperrors.BadRequest("invalid post id")
		}
	}

	result, err := commentRepository.ListComments(
		ctx,
		domain.AdminCommentFilter{
			Locale: locale,
			Status: status,
			PostID: postID,
			Query:  strings.TrimSpace(filter.Query),
		},
		page,
		size,
	)
	if err != nil {
		return nil, toAdminCommentError(err, "failed to list comments")
	}
	if result == nil {
		return &domain.AdminCommentListResult{
			Items: []domain.CommentRecord{},
			Total: 0,
			Page:  page,
			Size:  size,
		}, nil
	}
	if result.Items == nil {
		result.Items = []domain.CommentRecord{}
	}

	return result, nil
}

func UpdateAdminCommentStatus(
	ctx context.Context,
	adminUser *domain.AdminUser,
	commentID string,
	status string,
) (*domain.CommentRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	resolvedID := strings.TrimSpace(commentID)
	if resolvedID == "" {
		return nil, apperrors.BadRequest("comment id is required")
	}

	resolvedStatus := strings.TrimSpace(strings.ToLower(status))
	if !isSupportedCommentStatus(resolvedStatus) {
		return nil, apperrors.BadRequest("unsupported comment status")
	}

	updated, err := commentRepository.UpdateCommentStatusByID(
		ctx,
		resolvedID,
		resolvedStatus,
		"admin moderation",
		time.Now().UTC(),
	)
	if err != nil {
		return nil, toAdminCommentError(err, "failed to update comment status")
	}

	return updated, nil
}

func DeleteAdminComment(
	ctx context.Context,
	adminUser *domain.AdminUser,
	commentID string,
) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized("admin authentication required")
	}

	resolvedID := strings.TrimSpace(commentID)
	if resolvedID == "" {
		return apperrors.BadRequest("comment id is required")
	}

	deleted, err := commentRepository.DeleteCommentByID(ctx, resolvedID)
	if err != nil {
		return toAdminCommentError(err, "failed to delete comment")
	}
	if !deleted {
		return apperrors.BadRequest("comment not found")
	}

	return nil
}

func isSupportedCommentStatus(value string) bool {
	switch value {
	case commentStatusPending, commentStatusApproved, commentStatusRejected, commentStatusSpam:
		return true
	default:
		return false
	}
}

func toAdminCommentError(err error, fallbackMessage string) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, repository.ErrCommentNotFound) {
		return apperrors.BadRequest("comment not found")
	}
	if errors.Is(err, repository.ErrCommentRepositoryUnavailable) {
		return apperrors.ServiceUnavailable("comment moderation storage is unavailable", err)
	}
	return apperrors.Internal(fallbackMessage, err)
}
