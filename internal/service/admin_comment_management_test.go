package service

import (
	"context"
	"strings"
	"testing"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
)

func TestDeleteAdminCommentRemovesComment(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	commentRepository = commentStubRepository{
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
		deleteCommentByID: func(context.Context, string) (bool, error) {
			return false, nil
		},
	}

	err := DeleteAdminComment(context.Background(), &domain.AdminUser{ID: "admin-1"}, "missing")
	if err == nil || err.Error() != "comment not found" {
		t.Fatalf("DeleteAdminComment error = %v", err)
	}
}

func TestDeleteAdminCommentMapsRepositoryErrors(t *testing.T) {
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		commentRepository = originalCommentRepository
	})

	commentRepository = commentStubRepository{
		deleteCommentByID: func(context.Context, string) (bool, error) {
			return false, repository.ErrCommentRepositoryUnavailable
		},
	}

	err := DeleteAdminComment(context.Background(), &domain.AdminUser{ID: "admin-1"}, "comment-1")
	if err == nil || !strings.Contains(err.Error(), "comment moderation storage is unavailable") {
		t.Fatalf("DeleteAdminComment error = %v", err)
	}
}
