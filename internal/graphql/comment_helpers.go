package graphql

import (
	"sort"
	"strings"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/graphql/model"
)

func mapComment(record domain.CommentRecord) *model.Comment {
	id := strings.TrimSpace(record.ID)
	authorName := strings.TrimSpace(record.AuthorName)
	content := strings.TrimSpace(record.Content)
	createdAt := record.CreatedAt.UTC().Format("2006-01-02T15:04:05Z")
	if id == "" || authorName == "" || content == "" || createdAt == "" {
		return nil
	}

	return &model.Comment{
		ID:         id,
		ParentID:   toOptionalString(derefString(record.ParentID)),
		AuthorName: authorName,
		AvatarURL:  toOptionalString(strings.TrimSpace(record.AuthorAvatarURL)),
		Content:    content,
		CreatedAt:  createdAt,
	}
}

func mapCommentThreads(items []domain.CommentRecord) []*model.CommentThread {
	if len(items) == 0 {
		return []*model.CommentThread{}
	}

	rootItems := make([]domain.CommentRecord, 0, len(items))
	repliesByParentID := make(map[string][]domain.CommentRecord)
	for _, item := range items {
		if item.ParentID == nil || strings.TrimSpace(*item.ParentID) == "" {
			rootItems = append(rootItems, item)
			continue
		}

		parentID := strings.TrimSpace(*item.ParentID)
		repliesByParentID[parentID] = append(repliesByParentID[parentID], item)
	}

	sort.SliceStable(rootItems, func(left, right int) bool {
		return rootItems[left].CreatedAt.Before(rootItems[right].CreatedAt)
	})

	threads := make([]*model.CommentThread, 0, len(rootItems))
	for _, rootItem := range rootItems {
		root := mapComment(rootItem)
		if root == nil {
			continue
		}

		replyItems := repliesByParentID[rootItem.ID]
		sort.SliceStable(replyItems, func(left, right int) bool {
			return replyItems[left].CreatedAt.Before(replyItems[right].CreatedAt)
		})

		replies := make([]*model.Comment, 0, len(replyItems))
		for _, replyItem := range replyItems {
			reply := mapComment(replyItem)
			if reply == nil {
				continue
			}
			replies = append(replies, reply)
		}

		threads = append(threads, &model.CommentThread{
			Root:    root,
			Replies: replies,
		})
	}

	return threads
}
