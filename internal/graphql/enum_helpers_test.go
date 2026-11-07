package graphql

import (
	"testing"

	"suaybsimsek.com/blog-api/internal/graphql/model"
)

func TestMapResolvedSortOrder(t *testing.T) {
	for _, test := range []struct {
		input string
		want  *model.SortOrder
	}{
		{input: " ASC ", want: sortOrderPointer(model.SortOrderAsc)},
		{input: "desc", want: sortOrderPointer(model.SortOrderDesc)},
		{input: "other"},
	} {
		got := mapResolvedSortOrder(test.input)
		if !equalSortOrderPointer(got, test.want) {
			t.Errorf("mapResolvedSortOrder(%q) = %v, want %v", test.input, got, test.want)
		}
	}
}

func TestMapContentQueryStatus(t *testing.T) {
	tests := map[string]model.ContentQueryStatus{
		"success":               model.ContentQueryStatusSuccess,
		" service-unavailable ": model.ContentQueryStatusServiceUnavailable,
		"invalid-scope-ids":     model.ContentQueryStatusInvalidScopeIDS,
		"invalid-post-id":       model.ContentQueryStatusInvalidPostID,
		"not-found":             model.ContentQueryStatusNotFound,
		"unexpected":            model.ContentQueryStatusFailed,
	}
	for input, want := range tests {
		if got := mapContentQueryStatus(input); got != want {
			t.Errorf("mapContentQueryStatus(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestMapPostMetricStatus(t *testing.T) {
	tests := map[string]model.PostMetricStatus{
		"success":             model.PostMetricStatusSuccess,
		"service-unavailable": model.PostMetricStatusServiceUnavailable,
		"invalid-post-id":     model.PostMetricStatusInvalidPostID,
		"unexpected":          model.PostMetricStatusFailed,
	}
	for input, want := range tests {
		if got := mapPostMetricStatus(input); got != want {
			t.Errorf("mapPostMetricStatus(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestMapNewsletterMutationStatus(t *testing.T) {
	tests := map[string]model.NewsletterMutationStatus{
		"success":             model.NewsletterMutationStatusSuccess,
		"invalid-email":       model.NewsletterMutationStatusInvalidEmail,
		"rate-limited":        model.NewsletterMutationStatusRateLimited,
		"invalid-link":        model.NewsletterMutationStatusInvalidLink,
		"config-error":        model.NewsletterMutationStatusConfigError,
		"service-unavailable": model.NewsletterMutationStatusServiceUnavailable,
		"expired":             model.NewsletterMutationStatusExpired,
		"failed":              model.NewsletterMutationStatusFailed,
		"unexpected":          model.NewsletterMutationStatusUnknownError,
	}
	for input, want := range tests {
		if got := mapNewsletterMutationStatus(input); got != want {
			t.Errorf("mapNewsletterMutationStatus(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestMapCommentQueryStatus(t *testing.T) {
	tests := map[string]model.CommentQueryStatus{
		"success":             model.CommentQueryStatusSuccess,
		"service-unavailable": model.CommentQueryStatusServiceUnavailable,
		"invalid-post-id":     model.CommentQueryStatusInvalidPostID,
		"not-found":           model.CommentQueryStatusNotFound,
		"unexpected":          model.CommentQueryStatusFailed,
	}
	for input, want := range tests {
		if got := mapCommentQueryStatus(input); got != want {
			t.Errorf("mapCommentQueryStatus(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestMapCommentMutationStatus(t *testing.T) {
	tests := map[string]model.CommentMutationStatus{
		"success":             model.CommentMutationStatusSuccess,
		"service-unavailable": model.CommentMutationStatusServiceUnavailable,
		"invalid-post-id":     model.CommentMutationStatusInvalidPostID,
		"not-found":           model.CommentMutationStatusNotFound,
		"invalid-parent":      model.CommentMutationStatusInvalidParent,
		"invalid-author":      model.CommentMutationStatusInvalidAuthor,
		"invalid-email":       model.CommentMutationStatusInvalidEmail,
		"invalid-content":     model.CommentMutationStatusInvalidContent,
		"rate-limited":        model.CommentMutationStatusRateLimited,
		"unexpected":          model.CommentMutationStatusFailed,
	}
	for input, want := range tests {
		if got := mapCommentMutationStatus(input); got != want {
			t.Errorf("mapCommentMutationStatus(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestMapCommentModerationStatus(t *testing.T) {
	tests := map[string]*model.CommentModerationStatus{
		"pending":  commentModerationStatusPointer(model.CommentModerationStatusPending),
		"approved": commentModerationStatusPointer(model.CommentModerationStatusApproved),
		"rejected": commentModerationStatusPointer(model.CommentModerationStatusRejected),
		"spam":     commentModerationStatusPointer(model.CommentModerationStatusSpam),
		"unknown":  nil,
	}
	for input, want := range tests {
		got := mapCommentModerationStatus(input)
		if (got == nil) != (want == nil) || got != nil && *got != *want {
			t.Errorf("mapCommentModerationStatus(%q) = %v, want %v", input, got, want)
		}
	}
}

func sortOrderPointer(value model.SortOrder) *model.SortOrder { return &value }

func equalSortOrderPointer(left, right *model.SortOrder) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return *left == *right
}

func commentModerationStatusPointer(value model.CommentModerationStatus) *model.CommentModerationStatus {
	return &value
}
