package service

import (
	"context"
	"strings"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/pkg/commentsub"
)

var commentEventBroker = commentsub.NewBroker()

func SubscribeCommentEvents(postID string) (<-chan domain.CommentEvent, func()) {
	return commentEventBroker.Subscribe(strings.TrimSpace(strings.ToLower(postID)))
}

func SubscribeAllCommentEvents() (<-chan domain.CommentEvent, func()) {
	return commentEventBroker.Subscribe("")
}

func publishCommentEvent(ctx context.Context, event domain.CommentEvent) {
	resolvedPostID := strings.TrimSpace(strings.ToLower(event.PostID))
	if resolvedPostID == "" {
		return
	}

	event.PostID = resolvedPostID
	if event.Comment != nil {
		copied := *event.Comment
		event.Comment = &copied
		event.Comment.PostID = resolvedPostID
		if strings.TrimSpace(copied.ID) != "" {
			event.CommentID = strings.TrimSpace(copied.ID)
		}
		if copied.ParentID != nil {
			parentID := strings.TrimSpace(*copied.ParentID)
			if parentID != "" {
				event.ParentID = &parentID
			}
		}
		if strings.TrimSpace(copied.Status) != "" {
			event.Status = strings.TrimSpace(strings.ToLower(copied.Status))
		}
	}
	if event.CommentID == "" && event.Comment != nil {
		event.CommentID = strings.TrimSpace(event.Comment.ID)
	}
	if event.Status != "" {
		event.Status = strings.TrimSpace(strings.ToLower(event.Status))
	}

	commentEventBroker.Publish(event)
}

func resolveApprovedCommentTotal(ctx context.Context, postID string) *int {
	total, err := commentRepository.CountApprovedByPost(ctx, postID)
	if err != nil {
		return nil
	}

	resolvedTotal := total
	return &resolvedTotal
}
