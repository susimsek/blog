package graphql

import (
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
)

func TestMapCommentAndThreads(t *testing.T) {
	now := time.Date(2026, time.March, 21, 10, 0, 0, 0, time.UTC)
	parentID := "root-1"

	if mapComment(domain.CommentRecord{}) != nil {
		t.Fatal("expected invalid comment to map to nil")
	}

	mapped := mapComment(domain.CommentRecord{
		ID:              " root-1 ",
		AuthorName:      " Alice ",
		AuthorAvatarURL: " /avatar.png ",
		Content:         " First ",
		CreatedAt:       now,
	})
	if mapped == nil || mapped.ID != "root-1" || mapped.AvatarURL == nil || *mapped.AvatarURL != "/avatar.png" {
		t.Fatalf("unexpected mapped comment: %#v", mapped)
	}

	threads := mapCommentThreads([]domain.CommentRecord{
		{ID: "reply-1", ParentID: &parentID, AuthorName: "Bob", Content: "Reply", CreatedAt: now.Add(2 * time.Minute)},
		{ID: "root-1", AuthorName: "Alice", Content: "First", CreatedAt: now},
		{ID: "reply-2", ParentID: &parentID, AuthorName: "Cara", Content: "Second reply", CreatedAt: now.Add(time.Minute)},
		{ID: "root-2", AuthorName: "Dan", Content: "Later root", CreatedAt: now.Add(3 * time.Minute)},
	})
	if len(threads) != 2 {
		t.Fatalf("expected 2 comment threads, got %d", len(threads))
	}
	if threads[0].Root.ID != "root-1" || len(threads[0].Replies) != 2 {
		t.Fatalf("unexpected first thread: %#v", threads[0])
	}
	if threads[0].Replies[0].ID != "reply-2" || threads[0].Replies[1].ID != "reply-1" {
		t.Fatalf("expected replies to be time-sorted: %#v", threads[0].Replies)
	}
	if len(mapCommentThreads(nil)) != 0 {
		t.Fatal("expected empty thread list for nil input")
	}
}
