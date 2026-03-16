package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"

	"go.mongodb.org/mongo-driver/bson"
)

type commentStubRepository struct {
	listApprovedByPost      func(context.Context, string) ([]domain.CommentRecord, error)
	countApprovedByPost     func(context.Context, string) (int, error)
	createComment           func(context.Context, domain.CommentRecord) error
	findCommentByID         func(context.Context, string) (*domain.CommentRecord, error)
	listComments            func(context.Context, domain.AdminCommentFilter, int, int) (*domain.AdminCommentListResult, error)
	updateCommentStatusByID func(context.Context, string, string, string, time.Time) (*domain.CommentRecord, error)
	deleteCommentByID       func(context.Context, string) (bool, error)
}

func (stub commentStubRepository) ListApprovedByPost(ctx context.Context, postID string) ([]domain.CommentRecord, error) {
	return stub.listApprovedByPost(ctx, postID)
}

func (stub commentStubRepository) CountApprovedByPost(ctx context.Context, postID string) (int, error) {
	if stub.countApprovedByPost == nil {
		return 0, nil
	}
	return stub.countApprovedByPost(ctx, postID)
}

func (stub commentStubRepository) CreateComment(ctx context.Context, input domain.CommentRecord) error {
	return stub.createComment(ctx, input)
}

func (stub commentStubRepository) FindCommentByID(ctx context.Context, id string) (*domain.CommentRecord, error) {
	return stub.findCommentByID(ctx, id)
}

func (stub commentStubRepository) ListComments(
	ctx context.Context,
	filter domain.AdminCommentFilter,
	page int,
	size int,
) (*domain.AdminCommentListResult, error) {
	return stub.listComments(ctx, filter, page, size)
}

func (stub commentStubRepository) UpdateCommentStatusByID(
	ctx context.Context,
	id string,
	status string,
	moderationNote string,
	now time.Time,
) (*domain.CommentRecord, error) {
	return stub.updateCommentStatusByID(ctx, id, status, moderationNote, now)
}

func (stub commentStubRepository) DeleteCommentByID(ctx context.Context, id string) (bool, error) {
	return stub.deleteCommentByID(ctx, id)
}

func TestListComments(t *testing.T) {
	originalPostRepository := postsRepository
	originalCommentRepository := commentRepository
	t.Cleanup(func() {
		postsRepository = originalPostRepository
		commentRepository = originalCommentRepository
	})

	postsRepository = postStubRepository{
		countPosts: func(context.Context, bson.M) (int, error) { return 0, nil },
		findPosts:  func(context.Context, bson.M, string, int64, int64) ([]domain.PostRecord, error) { return nil, nil },
		findPostByID: func(_ context.Context, locale, postID string) (*domain.PostRecord, error) {
			if locale != "en" || postID != "alpha-post" {
				t.Fatalf("FindPostByID args = %q %q", locale, postID)
			}
			return &domain.PostRecord{ID: postID, Title: "Alpha", PublishedDate: "2026-03-01", Summary: "Summary", SearchText: "alpha", ReadingTimeMin: 3}, nil
		},
		findPostByIDAnyLocale: func(_ context.Context, postID string) (*domain.PostRecord, error) {
			if postID != "alpha-post" {
				t.Fatalf("FindPostByIDAnyLocale postID = %q", postID)
			}
			return &domain.PostRecord{ID: postID, Title: "Alpha", PublishedDate: "2026-03-01", Summary: "Summary", SearchText: "alpha", ReadingTimeMin: 3}, nil
		},
		resolveLikesByPostID: func(context.Context, []domain.PostRecord) map[string]int64 { return nil },
		resolveHitsByPostID:  func(context.Context, []domain.PostRecord) map[string]int64 { return nil },
		incrementPostLike:    func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		incrementPostHit:     func(context.Context, string, time.Time) (int64, error) { return 0, nil },
	}

	commentRepository = commentStubRepository{
		listApprovedByPost: func(_ context.Context, postID string) ([]domain.CommentRecord, error) {
			if postID != "alpha-post" {
				t.Fatalf("ListApprovedByPost postID = %q", postID)
			}
			return []domain.CommentRecord{
				{ID: "root", PostID: postID, AuthorName: "Alice", Content: "Hello", Status: commentStatusApproved, CreatedAt: time.Now().UTC()},
			}, nil
		},
		createComment:   func(context.Context, domain.CommentRecord) error { return nil },
		findCommentByID: func(context.Context, string) (*domain.CommentRecord, error) { return nil, nil },
		listComments: func(context.Context, domain.AdminCommentFilter, int, int) (*domain.AdminCommentListResult, error) {
			return nil, nil
		},
		updateCommentStatusByID: func(context.Context, string, string, string, time.Time) (*domain.CommentRecord, error) {
			return nil, nil
		},
	}

	result := ListComments(context.Background(), CommentQueryInput{PostID: "Alpha-Post"})
	if result.Status != "success" || result.Total != 1 || len(result.Comments) != 1 {
		t.Fatalf("result = %#v", result)
	}
}

func TestAddComment(t *testing.T) {
	originalPostRepository := postsRepository
	originalCommentRepository := commentRepository
	originalCommentLimiter := commentLimiter
	t.Cleanup(func() {
		postsRepository = originalPostRepository
		commentRepository = originalCommentRepository
		commentLimiter = originalCommentLimiter
	})

	commentLimiter = newRateLimiter(5, time.Minute)

	postsRepository = postStubRepository{
		countPosts: func(context.Context, bson.M) (int, error) { return 0, nil },
		findPosts:  func(context.Context, bson.M, string, int64, int64) ([]domain.PostRecord, error) { return nil, nil },
		findPostByID: func(_ context.Context, locale, postID string) (*domain.PostRecord, error) {
			return &domain.PostRecord{ID: postID, Title: "Alpha", PublishedDate: "2026-03-01", Summary: "Summary", SearchText: "alpha", ReadingTimeMin: 3}, nil
		},
		findPostByIDAnyLocale: func(_ context.Context, postID string) (*domain.PostRecord, error) {
			return &domain.PostRecord{ID: postID, Title: "Alpha", PublishedDate: "2026-03-01", Summary: "Summary", SearchText: "alpha", ReadingTimeMin: 3}, nil
		},
		resolveLikesByPostID: func(context.Context, []domain.PostRecord) map[string]int64 { return nil },
		resolveHitsByPostID:  func(context.Context, []domain.PostRecord) map[string]int64 { return nil },
		incrementPostLike:    func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		incrementPostHit:     func(context.Context, string, time.Time) (int64, error) { return 0, nil },
	}

	var stored domain.CommentRecord
	commentRepository = commentStubRepository{
		listApprovedByPost: func(context.Context, string) ([]domain.CommentRecord, error) { return nil, nil },
		createComment: func(_ context.Context, input domain.CommentRecord) error {
			stored = input
			return nil
		},
		findCommentByID: func(context.Context, string) (*domain.CommentRecord, error) { return nil, nil },
		listComments: func(context.Context, domain.AdminCommentFilter, int, int) (*domain.AdminCommentListResult, error) {
			return nil, nil
		},
		updateCommentStatusByID: func(context.Context, string, string, string, time.Time) (*domain.CommentRecord, error) {
			return nil, nil
		},
	}

	result := AddComment(
		context.Background(),
		AddCommentInput{
			PostID:                       "Alpha-Post",
			AuthorName:                   " Alice ",
			AuthorEmail:                  " Alice@example.com ",
			AuthenticatedAuthorAvatarURL: "https://example.com/avatar.png",
			Content:                      "First comment",
		},
		RequestMetadata{ClientIP: "203.0.113.10", UserAgent: "Browser"},
	)
	if result.Status != "success" || result.ModerationStatus != commentStatusPending {
		t.Fatalf("result = %#v", result)
	}
	if stored.AuthorName != "Alice" || stored.AuthorEmail != "alice@example.com" || stored.Status != commentStatusPending {
		t.Fatalf("stored = %#v", stored)
	}
	if stored.AuthorAvatarURL != "https://example.com/avatar.png" {
		t.Fatalf("expected avatar URL to be stored, got %#v", stored)
	}
	if stored.IPHash == "" || stored.UserAgentHash == "" {
		t.Fatalf("expected hashes in stored comment = %#v", stored)
	}
}

func TestAddCommentReplyValidationAndRateLimit(t *testing.T) {
	originalPostRepository := postsRepository
	originalCommentRepository := commentRepository
	originalCommentLimiter := commentLimiter
	t.Cleanup(func() {
		postsRepository = originalPostRepository
		commentRepository = originalCommentRepository
		commentLimiter = originalCommentLimiter
	})

	commentLimiter = newRateLimiter(1, time.Hour)

	postsRepository = postStubRepository{
		countPosts: func(context.Context, bson.M) (int, error) { return 0, nil },
		findPosts:  func(context.Context, bson.M, string, int64, int64) ([]domain.PostRecord, error) { return nil, nil },
		findPostByID: func(_ context.Context, locale, postID string) (*domain.PostRecord, error) {
			return &domain.PostRecord{ID: postID, Title: "Alpha", PublishedDate: "2026-03-01", Summary: "Summary", SearchText: "alpha", ReadingTimeMin: 3}, nil
		},
		findPostByIDAnyLocale: func(_ context.Context, postID string) (*domain.PostRecord, error) {
			return &domain.PostRecord{ID: postID, Title: "Alpha", PublishedDate: "2026-03-01", Summary: "Summary", SearchText: "alpha", ReadingTimeMin: 3}, nil
		},
		resolveLikesByPostID: func(context.Context, []domain.PostRecord) map[string]int64 { return nil },
		resolveHitsByPostID:  func(context.Context, []domain.PostRecord) map[string]int64 { return nil },
		incrementPostLike:    func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		incrementPostHit:     func(context.Context, string, time.Time) (int64, error) { return 0, nil },
	}

	commentRepository = commentStubRepository{
		listApprovedByPost: func(context.Context, string) ([]domain.CommentRecord, error) { return nil, nil },
		createComment:      func(context.Context, domain.CommentRecord) error { return nil },
		findCommentByID: func(_ context.Context, id string) (*domain.CommentRecord, error) {
			if id == "missing" {
				return nil, repository.ErrCommentNotFound
			}
			if id == "root" {
				return &domain.CommentRecord{
					ID:         id,
					PostID:     "alpha-post",
					Status:     commentStatusApproved,
					AuthorName: "Alice",
					Content:    "Root",
					CreatedAt:  time.Now().UTC(),
				}, nil
			}
			parentID := "other-parent"
			return &domain.CommentRecord{
				ID:         id,
				PostID:     "alpha-post",
				ParentID:   &parentID,
				Status:     commentStatusApproved,
				AuthorName: "Alice",
				Content:    "Nested",
				CreatedAt:  time.Now().UTC(),
			}, nil
		},
		listComments: func(context.Context, domain.AdminCommentFilter, int, int) (*domain.AdminCommentListResult, error) {
			return nil, nil
		},
		updateCommentStatusByID: func(context.Context, string, string, string, time.Time) (*domain.CommentRecord, error) {
			return nil, nil
		},
	}

	invalidParent := AddComment(
		context.Background(),
		AddCommentInput{
			PostID:      "alpha-post",
			ParentID:    "missing",
			AuthorName:  "Alice",
			AuthorEmail: "alice@example.com",
			Content:     "Reply",
		},
		RequestMetadata{ClientIP: "203.0.113.11"},
	)
	if invalidParent.Status != commentStatusInvalidParent {
		t.Fatalf("invalidParent = %#v", invalidParent)
	}

	nestedParent := AddComment(
		context.Background(),
		AddCommentInput{
			PostID:      "alpha-post",
			ParentID:    "nested",
			AuthorName:  "Alice",
			AuthorEmail: "alice@example.com",
			Content:     "Reply",
		},
		RequestMetadata{ClientIP: "203.0.113.13"},
	)
	if nestedParent.Status != commentStatusInvalidParent {
		t.Fatalf("nestedParent = %#v", nestedParent)
	}

	validSharedReply := AddComment(
		context.Background(),
		AddCommentInput{
			PostID:      "alpha-post",
			ParentID:    "root",
			AuthorName:  "Alice",
			AuthorEmail: "alice@example.com",
			Content:     "Shared discussion reply",
		},
		RequestMetadata{ClientIP: "203.0.113.15"},
	)
	if validSharedReply.Status != "success" {
		t.Fatalf("validSharedReply = %#v", validSharedReply)
	}

	first := AddComment(
		context.Background(),
		AddCommentInput{
			PostID:      "alpha-post",
			AuthorName:  "Alice",
			AuthorEmail: "alice@example.com",
			Content:     "First",
		},
		RequestMetadata{ClientIP: "203.0.113.12"},
	)
	if first.Status != "success" {
		t.Fatalf("first = %#v", first)
	}

	rateLimited := AddComment(
		context.Background(),
		AddCommentInput{
			PostID:      "alpha-post",
			AuthorName:  "Alice",
			AuthorEmail: "alice@example.com",
			Content:     "Second",
		},
		RequestMetadata{ClientIP: "203.0.113.12"},
	)
	if rateLimited.Status != commentStatusRateLimited {
		t.Fatalf("rateLimited = %#v", rateLimited)
	}

	commentRepository = commentStubRepository{
		listApprovedByPost: func(context.Context, string) ([]domain.CommentRecord, error) { return nil, nil },
		createComment:      func(context.Context, domain.CommentRecord) error { return errors.New("boom") },
		findCommentByID:    func(context.Context, string) (*domain.CommentRecord, error) { return nil, nil },
		listComments: func(context.Context, domain.AdminCommentFilter, int, int) (*domain.AdminCommentListResult, error) {
			return nil, nil
		},
		updateCommentStatusByID: func(context.Context, string, string, string, time.Time) (*domain.CommentRecord, error) {
			return nil, nil
		},
	}

	failed := AddComment(
		context.Background(),
		AddCommentInput{
			PostID:      "alpha-post",
			AuthorName:  "Alice",
			AuthorEmail: "alice@example.com",
			Content:     "Third",
		},
		RequestMetadata{ClientIP: "203.0.113.14"},
	)
	if failed.Status != "failed" {
		t.Fatalf("failed = %#v", failed)
	}
}
