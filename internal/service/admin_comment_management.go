package service

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
)

const (
	adminCommentDefaultPageSize   = 20
	adminCommentMaxPageSize       = 100
	adminCommentCodeStatusInvalid = "ADMIN_COMMENT_STATUS_INVALID"
	adminCommentCodePostIDInvalid = "ADMIN_COMMENT_POST_ID_INVALID"
	adminCommentCodeIDRequired    = "ADMIN_COMMENT_ID_REQUIRED"
	adminCommentCodeIDsRequired   = "ADMIN_COMMENT_IDS_REQUIRED"
	adminCommentCodeNotFound      = "ADMIN_COMMENT_NOT_FOUND"
	adminCommentCodeManyNotFound  = "ADMIN_COMMENTS_NOT_FOUND"
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

	status := strings.TrimSpace(strings.ToLower(filter.Status))
	if status != "" && !isSupportedCommentStatus(status) {
		return nil, adminCommentBadRequest(adminCommentCodeStatusInvalid, "unsupported comment status")
	}

	postID := strings.TrimSpace(strings.ToLower(filter.PostID))
	if postID != "" {
		if _, ok := normalizePostID(postID); !ok {
			return nil, adminCommentBadRequest(adminCommentCodePostIDInvalid, "invalid post id")
		}
	}

	result, err := commentRepository.ListComments(
		ctx,
		domain.AdminCommentFilter{
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
		return nil, adminCommentBadRequest(adminCommentCodeIDRequired, "comment id is required")
	}

	resolvedStatus := strings.TrimSpace(strings.ToLower(status))
	if !isSupportedCommentStatus(resolvedStatus) {
		return nil, adminCommentBadRequest(adminCommentCodeStatusInvalid, "unsupported comment status")
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

func BulkUpdateAdminCommentStatus(
	ctx context.Context,
	adminUser *domain.AdminUser,
	commentIDs []string,
	status string,
) (int, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return 0, apperrors.Unauthorized("admin authentication required")
	}

	resolvedIDs := normalizeAdminCommentIDs(commentIDs)
	if len(resolvedIDs) == 0 {
		return 0, adminCommentBadRequest(adminCommentCodeIDsRequired, "at least one comment id is required")
	}

	resolvedStatus := strings.TrimSpace(strings.ToLower(status))
	if !isSupportedCommentStatus(resolvedStatus) {
		return 0, adminCommentBadRequest(adminCommentCodeStatusInvalid, "unsupported comment status")
	}

	successCount, err := commentRepository.UpdateCommentStatusByIDs(
		ctx,
		resolvedIDs,
		resolvedStatus,
		"admin moderation",
		time.Now().UTC(),
	)
	if err != nil {
		return 0, toAdminCommentError(err, "failed to update comment status")
	}
	if successCount == 0 {
		return 0, adminCommentBadRequest(adminCommentCodeManyNotFound, "comments not found")
	}

	return successCount, nil
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
		return adminCommentBadRequest(adminCommentCodeIDRequired, "comment id is required")
	}

	deleted, err := commentRepository.DeleteCommentByID(ctx, resolvedID)
	if err != nil {
		return toAdminCommentError(err, "failed to delete comment")
	}
	if !deleted {
		return adminCommentBadRequest(adminCommentCodeNotFound, "comment not found")
	}

	return nil
}

func BulkDeleteAdminComments(
	ctx context.Context,
	adminUser *domain.AdminUser,
	commentIDs []string,
) (int, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return 0, apperrors.Unauthorized("admin authentication required")
	}

	resolvedIDs := normalizeAdminCommentIDs(commentIDs)
	if len(resolvedIDs) == 0 {
		return 0, adminCommentBadRequest(adminCommentCodeIDsRequired, "at least one comment id is required")
	}

	deletedCount, err := commentRepository.DeleteCommentsByIDs(ctx, resolvedIDs)
	if err != nil {
		return 0, toAdminCommentError(err, "failed to delete comment")
	}
	if deletedCount == 0 {
		return 0, adminCommentBadRequest(adminCommentCodeManyNotFound, "comments not found")
	}

	return deletedCount, nil
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
		return adminCommentBadRequest(adminCommentCodeNotFound, "comment not found")
	}
	if errors.Is(err, repository.ErrCommentRepositoryUnavailable) {
		return apperrors.ServiceUnavailable("comment moderation storage is unavailable", err)
	}
	return apperrors.Internal(fallbackMessage, err)
}

func adminCommentBadRequest(code, message string) error {
	return apperrors.New(code, message, http.StatusBadRequest, nil)
}

func normalizeAdminCommentIDs(ids []string) []string {
	if len(ids) == 0 {
		return nil
	}

	seen := make(map[string]struct{}, len(ids))
	resolved := make([]string, 0, len(ids))
	for _, id := range ids {
		trimmed := strings.TrimSpace(id)
		if trimmed == "" {
			continue
		}
		if _, exists := seen[trimmed]; exists {
			continue
		}
		seen[trimmed] = struct{}{}
		resolved = append(resolved, trimmed)
	}

	return resolved
}
