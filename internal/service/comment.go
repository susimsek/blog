package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/httpauth"
)

const (
	commentStatusPending        = "pending"
	commentStatusApproved       = "approved"
	commentStatusRejected       = "rejected"
	commentStatusSpam           = "spam"
	commentStatusInvalidParent  = "invalid-parent"
	commentStatusInvalidAuthor  = "invalid-author"
	commentStatusInvalidEmail   = "invalid-email"
	commentStatusInvalidContent = "invalid-content"
	commentStatusRateLimited    = "rate-limited"
	commentStatusNotFound       = "not-found"
	commentDefaultPageSize      = 20
	commentMaxPageSize          = 100
	commentMaxDepth             = 1
	commentMaxLinks             = 3
	commentMaxNameLength        = 80
	commentMinNameLength        = 2
	commentMaxContentLength     = 2000
	commentMinContentLength     = 3
)

var (
	commentRepository repository.CommentRepository = repository.NewCommentRepository()
	commentLimiter                                 = newRateLimiter(3, 10*time.Minute)
	urlPattern                                     = regexp.MustCompile(`https?://|www\.`)
)

type CommentQueryInput struct {
	PostID string
}

type AddCommentInput struct {
	PostID                       string
	ParentID                     string
	AuthorName                   string
	AuthorEmail                  string
	AuthenticatedAuthorName      string
	AuthenticatedAuthorEmail     string
	AuthenticatedAuthorAvatarURL string
	Content                      string
}

func ListComments(ctx context.Context, input CommentQueryInput) domain.CommentListResult {
	postID, ok := normalizePostID(input.PostID)
	if !ok {
		return domain.CommentListResult{Status: statusInvalidPostID}
	}

	operationCtx, cancel := withTimeoutContext(ctx, 10*time.Second)
	defer cancel()

	post, queryErr := postsRepository.FindPostByIDAnyLocale(operationCtx, postID)
	if queryErr != nil {
		if errors.Is(queryErr, repository.ErrPostRepositoryUnavailable) {
			return domain.CommentListResult{Status: statusServiceUnavailable, PostID: postID}
		}
		return domain.CommentListResult{Status: "failed", PostID: postID}
	}
	if post == nil {
		return domain.CommentListResult{Status: commentStatusNotFound, PostID: postID}
	}

	items, err := commentRepository.ListApprovedByPost(operationCtx, postID)
	if err != nil {
		if errors.Is(err, repository.ErrCommentRepositoryUnavailable) {
			return domain.CommentListResult{Status: statusServiceUnavailable, PostID: postID}
		}
		return domain.CommentListResult{Status: "failed", PostID: postID}
	}
	if items == nil {
		items = []domain.CommentRecord{}
	}

	return domain.CommentListResult{
		Status:   "success",
		PostID:   postID,
		Total:    len(items),
		Comments: items,
	}
}

func AddComment(ctx context.Context, input AddCommentInput, meta RequestMetadata) domain.CommentMutationResult {
	postID, ok := normalizePostID(input.PostID)
	if !ok {
		return domain.CommentMutationResult{Status: statusInvalidPostID}
	}

	authorName := normalizeCommentAuthorName(input.AuthenticatedAuthorName)
	if authorName == "" {
		authorName = normalizeCommentAuthorName(input.AuthorName)
		if authorName == "" {
			return domain.CommentMutationResult{Status: commentStatusInvalidAuthor, PostID: postID}
		}
	}

	authorEmail, emailErr := normalizeCommentAuthorEmail(input.AuthenticatedAuthorEmail)
	if emailErr != nil {
		authorEmail, emailErr = normalizeCommentAuthorEmail(input.AuthorEmail)
		if emailErr != nil {
			return domain.CommentMutationResult{Status: commentStatusInvalidEmail, PostID: postID}
		}
	}

	content := normalizeCommentContent(input.Content)
	if content == "" {
		return domain.CommentMutationResult{Status: commentStatusInvalidContent, PostID: postID}
	}

	if !commentLimiter.allow(strings.TrimSpace(meta.ClientIP)) {
		return domain.CommentMutationResult{Status: commentStatusRateLimited, PostID: postID}
	}

	operationCtx, cancel := withTimeoutContext(ctx, 10*time.Second)
	defer cancel()

	post, queryErr := postsRepository.FindPostByIDAnyLocale(operationCtx, postID)
	if queryErr != nil {
		if errors.Is(queryErr, repository.ErrPostRepositoryUnavailable) {
			return domain.CommentMutationResult{Status: statusServiceUnavailable, PostID: postID}
		}
		return domain.CommentMutationResult{Status: "failed", PostID: postID}
	}
	if post == nil {
		return domain.CommentMutationResult{Status: commentStatusNotFound, PostID: postID}
	}

	var parentID *string
	resolvedParentID := strings.TrimSpace(input.ParentID)
	if resolvedParentID != "" {
		parentComment, err := commentRepository.FindCommentByID(operationCtx, resolvedParentID)
		if err != nil {
			if errors.Is(err, repository.ErrCommentRepositoryUnavailable) {
				return domain.CommentMutationResult{Status: statusServiceUnavailable, PostID: postID}
			}
			if errors.Is(err, repository.ErrCommentNotFound) {
				return domain.CommentMutationResult{Status: commentStatusInvalidParent, PostID: postID}
			}
			return domain.CommentMutationResult{Status: "failed", PostID: postID}
		}
		if parentComment == nil ||
			parentComment.PostID != postID ||
			parentComment.Status != commentStatusApproved ||
			parentComment.ParentID != nil ||
			commentDepth(*parentComment) >= commentMaxDepth {
			return domain.CommentMutationResult{Status: commentStatusInvalidParent, PostID: postID}
		}
		parentID = &parentComment.ID
	}

	commentID, idErr := httpauth.GenerateOpaqueToken(18)
	if idErr != nil {
		return domain.CommentMutationResult{Status: "failed", PostID: postID}
	}

	now := time.Now().UTC()
	moderationStatus := commentStatusPending
	moderationNote := ""
	if countCommentLinks(content) > commentMaxLinks {
		moderationStatus = commentStatusSpam
		moderationNote = "auto-flagged: too many links"
	}

	record := domain.CommentRecord{
		ID:              commentID,
		PostID:          postID,
		PostTitle:       strings.TrimSpace(post.Title),
		ParentID:        parentID,
		AuthorName:      authorName,
		AuthorAvatarURL: sanitizeReaderAvatarURL(input.AuthenticatedAuthorAvatarURL),
		AuthorEmail:     authorEmail,
		Content:         content,
		Status:          moderationStatus,
		CreatedAt:       now,
		UpdatedAt:       now,
		IPHash:          hashCommentValue(strings.TrimSpace(meta.ClientIP)),
		UserAgentHash:   hashCommentValue(strings.TrimSpace(meta.UserAgent)),
		ModerationNote:  moderationNote,
	}

	if err := commentRepository.CreateComment(operationCtx, record); err != nil {
		if errors.Is(err, repository.ErrCommentRepositoryUnavailable) {
			return domain.CommentMutationResult{Status: statusServiceUnavailable, PostID: postID}
		}
		return domain.CommentMutationResult{Status: "failed", PostID: postID}
	}

	publishCommentEvent(operationCtx, domain.CommentEvent{
		Type:    domain.CommentEventTypeCreated,
		PostID:  postID,
		Comment: &record,
		Total:   resolveApprovedCommentTotal(operationCtx, postID),
	})

	return domain.CommentMutationResult{
		Status:           "success",
		PostID:           postID,
		Comment:          &record,
		ModerationStatus: moderationStatus,
	}
}

func normalizeCommentAuthorName(value string) string {
	trimmed := strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
	if len(trimmed) < commentMinNameLength || len(trimmed) > commentMaxNameLength {
		return ""
	}
	return trimmed
}

func normalizeCommentAuthorEmail(value string) (string, error) {
	trimmed := strings.TrimSpace(strings.ToLower(value))
	if trimmed == "" {
		return "", errors.New("email is required")
	}
	parsed, err := mail.ParseAddress(trimmed)
	if err != nil || strings.TrimSpace(parsed.Address) == "" {
		return "", errors.New("invalid email")
	}
	return strings.TrimSpace(strings.ToLower(parsed.Address)), nil
}

func normalizeCommentContent(value string) string {
	normalizedLineBreaks := strings.ReplaceAll(value, "\r\n", "\n")
	lines := strings.Split(normalizedLineBreaks, "\n")
	for index, line := range lines {
		lines[index] = strings.TrimRight(strings.TrimSpace(line), " ")
	}

	content := strings.Join(lines, "\n")
	content = strings.TrimSpace(content)
	content = strings.Join(strings.FieldsFunc(content, func(r rune) bool {
		return r == '\u0000'
	}), "")
	if content == "" || len(content) < commentMinContentLength || len(content) > commentMaxContentLength {
		return ""
	}
	return content
}

func hashCommentValue(value string) string {
	if value == "" {
		return ""
	}
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func commentDepth(item domain.CommentRecord) int {
	if item.ParentID == nil || strings.TrimSpace(*item.ParentID) == "" {
		return 0
	}
	return 1
}

func countCommentLinks(value string) int {
	matches := urlPattern.FindAllStringIndex(strings.ToLower(value), -1)
	return len(matches)
}
