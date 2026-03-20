package service

import (
	"context"
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
