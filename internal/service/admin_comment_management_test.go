package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
)

func TestDeleteAdminCommentRemovesComment(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	commentRepository = commentStubRepository{
		findCommentByID: func(_ context.Context, id string) (*domain.CommentRecord, error) {
			if id != "comment-1" {
				t.Fatalf("FindCommentByID id = %q", id)
			}
			return &domain.CommentRecord{ID: id, PostID: "alpha-post", Status: commentStatusPending}, nil
		},
		deleteCommentByID: func(_ context.Context, id string) (bool, error) {
			if id != "comment-1" {
				t.Fatalf("DeleteCommentByID id = %q", id)
			}
			return true, nil
		},
	}

	err := DeleteAdminComment(context.Background(), &domain.AdminUser{ID: "admin-1"}, " comment-1 ")
	if err != nil {
		t.Fatalf("DeleteAdminComment returned error: %v", err)
	}
}

func TestDeleteAdminCommentReturnsBadRequestWhenMissing(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	commentRepository = commentStubRepository{
		findCommentByID: func(_ context.Context, id string) (*domain.CommentRecord, error) {
			return &domain.CommentRecord{ID: id, PostID: "alpha-post", Status: commentStatusPending}, nil
		},
		deleteCommentByID: func(context.Context, string) (bool, error) {
			return false, nil
		},
	}

	err := DeleteAdminComment(context.Background(), &domain.AdminUser{ID: "admin-1"}, "missing")
	if err == nil || err.Error() != "comment not found" {
		t.Fatalf("DeleteAdminComment error = %v", err)
	}
	if appErr := apperrors.From(err); appErr.Code != adminCommentCodeNotFound {
		t.Fatalf("DeleteAdminComment code = %q", appErr.Code)
	}
}

func TestDeleteAdminCommentMapsRepositoryErrors(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	commentRepository = commentStubRepository{
		findCommentByID: func(_ context.Context, id string) (*domain.CommentRecord, error) {
			return &domain.CommentRecord{ID: id, PostID: "alpha-post", Status: commentStatusPending}, nil
		},
		deleteCommentByID: func(context.Context, string) (bool, error) {
			return false, repository.ErrCommentRepositoryUnavailable
		},
	}

	err := DeleteAdminComment(context.Background(), &domain.AdminUser{ID: "admin-1"}, "comment-1")
	if err == nil || !strings.Contains(err.Error(), "comment moderation storage is unavailable") {
		t.Fatalf("DeleteAdminComment error = %v", err)
	}
}

func TestBulkUpdateAdminCommentStatus(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	commentRepository = commentStubRepository{
		updateCommentStatusByIDs: func(_ context.Context, ids []string, status, moderationNote string, _ time.Time) (int, error) {
			expectedIDs := []string{"comment-1", "comment-2"}
			if len(ids) != len(expectedIDs) || ids[0] != expectedIDs[0] || ids[1] != expectedIDs[1] {
				t.Fatalf("UpdateCommentStatusByIDs ids = %#v", ids)
			}
			if status != commentStatusApproved {
				t.Fatalf("UpdateCommentStatusByIDs status = %q", status)
			}
			if moderationNote != "admin moderation" {
				t.Fatalf("UpdateCommentStatusByIDs moderationNote = %q", moderationNote)
			}
			return 2, nil
		},
	}

	successCount, err := BulkUpdateAdminCommentStatus(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		[]string{" comment-1 ", "comment-2", "comment-1"},
		" APPROVED ",
	)
	if err != nil {
		t.Fatalf("BulkUpdateAdminCommentStatus returned error: %v", err)
	}
	if successCount != 2 {
		t.Fatalf("BulkUpdateAdminCommentStatus successCount = %d", successCount)
	}
}

func TestBulkDeleteAdminComments(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	commentRepository = commentStubRepository{
		deleteCommentsByIDs: func(_ context.Context, ids []string) (int, error) {
			expectedIDs := []string{"comment-1", "comment-2"}
			if len(ids) != len(expectedIDs) || ids[0] != expectedIDs[0] || ids[1] != expectedIDs[1] {
				t.Fatalf("DeleteCommentsByIDs ids = %#v", ids)
			}
			return 2, nil
		},
	}

	successCount, err := BulkDeleteAdminComments(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		[]string{" comment-1 ", "comment-2", "comment-1"},
	)
	if err != nil {
		t.Fatalf("BulkDeleteAdminComments returned error: %v", err)
	}
	if successCount != 2 {
		t.Fatalf("BulkDeleteAdminComments successCount = %d", successCount)
	}
}

func TestBulkDeleteAdminCommentsReturnsBadRequestWhenMissing(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	commentRepository = commentStubRepository{
		deleteCommentsByIDs: func(context.Context, []string) (int, error) {
			return 0, nil
		},
	}

	_, err := BulkDeleteAdminComments(context.Background(), &domain.AdminUser{ID: "admin-1"}, []string{"missing"})
	if err == nil || err.Error() != "comments not found" {
		t.Fatalf("BulkDeleteAdminComments error = %v", err)
	}
	if appErr := apperrors.From(err); appErr.Code != adminCommentCodeManyNotFound {
		t.Fatalf("BulkDeleteAdminComments code = %q", appErr.Code)
	}
}

func TestListAdminCommentsNormalizesFiltersAndReturnsEmptyResult(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	commentRepository = commentStubRepository{
		listComments: func(_ context.Context, filter domain.AdminCommentFilter, page, size int) (*domain.AdminCommentListResult, error) {
			if filter.Status != commentStatusApproved || filter.PostID != "alpha-post" || filter.Query != "hello" {
				t.Fatalf("unexpected filter: %#v", filter)
			}
			if page != 1 || size != adminCommentDefaultPageSize {
				t.Fatalf("unexpected pagination: %d %d", page, size)
			}
			return nil, nil
		},
		findCommentByID: func(context.Context, string) (*domain.CommentRecord, error) { return nil, nil },
	}

	result, err := ListAdminComments(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminCommentFilter{
		Status: " APPROVED ",
		PostID: " Alpha-Post ",
		Query:  " hello ",
	})
	if err != nil {
		t.Fatalf("ListAdminComments returned error: %v", err)
	}
	if result == nil || result.Total != 0 || len(result.Items) != 0 {
		t.Fatalf("unexpected result: %#v", result)
	}
}

func TestUpdateAdminCommentStatusUpdatesModerationState(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	commentRepository = commentStubRepository{
		updateCommentStatusByID: func(_ context.Context, id, status, moderationNote string, _ time.Time) (*domain.CommentRecord, error) {
			if id != "comment-1" || status != commentStatusSpam || moderationNote != "admin moderation" {
				t.Fatalf("unexpected update args: %q %q %q", id, status, moderationNote)
			}
			return &domain.CommentRecord{ID: id, Status: status}, nil
		},
		findCommentByID: func(context.Context, string) (*domain.CommentRecord, error) { return nil, nil },
	}

	record, err := UpdateAdminCommentStatus(context.Background(), &domain.AdminUser{ID: "admin-1"}, " comment-1 ", " SPAM ")
	if err != nil {
		t.Fatalf("UpdateAdminCommentStatus returned error: %v", err)
	}
	if record == nil || record.Status != commentStatusSpam {
		t.Fatalf("unexpected updated record: %#v", record)
	}
}

func TestListAdminCommentsErrorPaths(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	if _, err := ListAdminComments(context.Background(), nil, domain.AdminCommentFilter{}); err == nil || !strings.Contains(err.Error(), "admin authentication required") {
		t.Fatalf("expected auth error, got %v", err)
	}

	if _, err := ListAdminComments(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminCommentFilter{Status: "weird"}); err == nil || !strings.Contains(err.Error(), adminCommentStatusUnsupported) {
		t.Fatalf("expected status validation error, got %v", err)
	}

	if _, err := ListAdminComments(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminCommentFilter{PostID: "??"}); err == nil || !strings.Contains(err.Error(), "invalid post id") {
		t.Fatalf("expected post id validation error, got %v", err)
	}

	commentRepository = commentStubRepository{
		listComments: func(context.Context, domain.AdminCommentFilter, int, int) (*domain.AdminCommentListResult, error) {
			return nil, repository.ErrCommentRepositoryUnavailable
		},
	}
	if _, err := ListAdminComments(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminCommentFilter{}); err == nil || !strings.Contains(err.Error(), "comment moderation storage is unavailable") {
		t.Fatalf("expected repository unavailable error, got %v", err)
	}

	commentRepository = commentStubRepository{
		listComments: func(context.Context, domain.AdminCommentFilter, int, int) (*domain.AdminCommentListResult, error) {
			return &domain.AdminCommentListResult{Items: nil, Total: 1, Page: 2, Size: 3}, nil
		},
	}
	result, err := ListAdminComments(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminCommentFilter{})
	if err != nil {
		t.Fatalf("ListAdminComments returned error: %v", err)
	}
	if result == nil || len(result.Items) != 0 || result.Page != 2 || result.Size != 3 {
		t.Fatalf("unexpected result: %#v", result)
	}
}

func TestUpdateAdminCommentStatusErrorPaths(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	if _, err := UpdateAdminCommentStatus(context.Background(), nil, "comment-1", commentStatusApproved); err == nil || !strings.Contains(err.Error(), "admin authentication required") {
		t.Fatalf("expected auth error, got %v", err)
	}

	if _, err := UpdateAdminCommentStatus(context.Background(), &domain.AdminUser{ID: "admin-1"}, " ", commentStatusApproved); err == nil || !strings.Contains(err.Error(), "comment id is required") {
		t.Fatalf("expected id required error, got %v", err)
	}

	if _, err := UpdateAdminCommentStatus(context.Background(), &domain.AdminUser{ID: "admin-1"}, "comment-1", "weird"); err == nil || !strings.Contains(err.Error(), adminCommentStatusUnsupported) {
		t.Fatalf("expected invalid status error, got %v", err)
	}

	commentRepository = commentStubRepository{
		updateCommentStatusByID: func(context.Context, string, string, string, time.Time) (*domain.CommentRecord, error) {
			return nil, repository.ErrCommentNotFound
		},
	}
	if _, err := UpdateAdminCommentStatus(context.Background(), &domain.AdminUser{ID: "admin-1"}, "comment-1", commentStatusApproved); err == nil || err.Error() != "comment not found" {
		t.Fatalf("expected comment not found error, got %v", err)
	}

	commentRepository = commentStubRepository{
		updateCommentStatusByID: func(context.Context, string, string, string, time.Time) (*domain.CommentRecord, error) {
			return nil, errors.New("boom")
		},
	}
	if _, err := UpdateAdminCommentStatus(context.Background(), &domain.AdminUser{ID: "admin-1"}, "comment-1", commentStatusApproved); err == nil || !strings.Contains(err.Error(), "failed to update comment status") {
		t.Fatalf("expected fallback internal error, got %v", err)
	}
}

func TestBulkUpdateAdminCommentStatusErrorPaths(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	if _, err := BulkUpdateAdminCommentStatus(context.Background(), nil, []string{"comment-1"}, commentStatusApproved); err == nil || !strings.Contains(err.Error(), "admin authentication required") {
		t.Fatalf("expected auth error, got %v", err)
	}

	if _, err := BulkUpdateAdminCommentStatus(context.Background(), &domain.AdminUser{ID: "admin-1"}, []string{" ", ""}, commentStatusApproved); err == nil || !strings.Contains(err.Error(), "at least one comment id is required") {
		t.Fatalf("expected ids required error, got %v", err)
	}

	if _, err := BulkUpdateAdminCommentStatus(context.Background(), &domain.AdminUser{ID: "admin-1"}, []string{"comment-1"}, "invalid"); err == nil || !strings.Contains(err.Error(), adminCommentStatusUnsupported) {
		t.Fatalf("expected invalid status error, got %v", err)
	}

	commentRepository = commentStubRepository{
		updateCommentStatusByIDs: func(context.Context, []string, string, string, time.Time) (int, error) {
			return 0, repository.ErrCommentRepositoryUnavailable
		},
	}
	if _, err := BulkUpdateAdminCommentStatus(context.Background(), &domain.AdminUser{ID: "admin-1"}, []string{"comment-1"}, commentStatusApproved); err == nil || !strings.Contains(err.Error(), "comment moderation storage is unavailable") {
		t.Fatalf("expected repository unavailable error, got %v", err)
	}

	commentRepository = commentStubRepository{
		updateCommentStatusByIDs: func(context.Context, []string, string, string, time.Time) (int, error) {
			return 0, nil
		},
	}
	if _, err := BulkUpdateAdminCommentStatus(context.Background(), &domain.AdminUser{ID: "admin-1"}, []string{"comment-1"}, commentStatusApproved); err == nil || err.Error() != "comments not found" {
		t.Fatalf("expected comments not found error, got %v", err)
	}
}

func TestBulkDeleteAdminCommentsErrorPathsAndHelpers(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	if _, err := BulkDeleteAdminComments(context.Background(), nil, []string{"comment-1"}); err == nil || !strings.Contains(err.Error(), "admin authentication required") {
		t.Fatalf("expected auth error, got %v", err)
	}

	if _, err := BulkDeleteAdminComments(context.Background(), &domain.AdminUser{ID: "admin-1"}, []string{" ", ""}); err == nil || !strings.Contains(err.Error(), "at least one comment id is required") {
		t.Fatalf("expected ids required error, got %v", err)
	}

	commentRepository = commentStubRepository{
		deleteCommentsByIDs: func(context.Context, []string) (int, error) {
			return 0, repository.ErrCommentRepositoryUnavailable
		},
	}
	if _, err := BulkDeleteAdminComments(context.Background(), &domain.AdminUser{ID: "admin-1"}, []string{"comment-1"}); err == nil || !strings.Contains(err.Error(), "comment moderation storage is unavailable") {
		t.Fatalf("expected repository unavailable error, got %v", err)
	}

	if !isSupportedCommentStatus(commentStatusApproved) || isSupportedCommentStatus("mystery") {
		t.Fatalf("unexpected status support evaluation")
	}
	if toAdminCommentError(nil, "ignored") != nil {
		t.Fatal("expected nil admin comment error passthrough")
	}
}
