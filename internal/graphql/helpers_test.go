package graphql

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"suaybsimsek.com/blog-api/internal/graphql/model"
	appservice "suaybsimsek.com/blog-api/internal/service"
	"suaybsimsek.com/blog-api/internal/testassert"
)

func TestEnumAndScalarHelpers(t *testing.T) {
	testassert.Equal(t, mapLocaleInput("tr"), "tr", "locale input")
	testassert.Equal(t, mapLocaleOutput(" TR "), "tr", "locale output")
	testassert.Equal(t, mapLocaleOutput("unknown"), "en", "default locale")

	sortOrder := mapResolvedSortOrder("asc")
	testassert.NotNil(t, sortOrder, "ascending sort order should be mapped")
	testassert.Equal(t, *sortOrder, model.SortOrderAsc, "ascending sort order")
	testassert.True(t, mapResolvedSortOrder("nope") == nil, "unknown sort order should be nil")

	testassert.Equal(t, mapContentQueryStatus("not-found"), model.ContentQueryStatusNotFound, "not-found query status")
	testassert.Equal(t, mapContentQueryStatus("service-unavailable"), model.ContentQueryStatusServiceUnavailable, "unavailable query status")
	testassert.Equal(t, mapContentQueryStatus("invalid-scope-ids"), model.ContentQueryStatusInvalidScopeIDS, "invalid scope status")
	testassert.Equal(t, mapContentQueryStatus("invalid-post-id"), model.ContentQueryStatusInvalidPostID, "invalid post status")
	testassert.Equal(t, mapContentQueryStatus("unknown"), model.ContentQueryStatusFailed, "default query status")
	testassert.Equal(t, mapPostMetricStatus("invalid-post-id"), model.PostMetricStatusInvalidPostID, "invalid post metric status")
	testassert.Equal(t, mapPostMetricStatus("service-unavailable"), model.PostMetricStatusServiceUnavailable, "unavailable post metric status")
	testassert.Equal(t, mapPostMetricStatus("unknown"), model.PostMetricStatusFailed, "default post metric status")
	testassert.Equal(t, mapNewsletterMutationStatus("success"), model.NewsletterMutationStatusSuccess, "successful newsletter status")
	testassert.Equal(t, mapNewsletterMutationStatus("invalid-email"), model.NewsletterMutationStatusInvalidEmail, "invalid email status")
	testassert.Equal(t, mapNewsletterMutationStatus("rate-limited"), model.NewsletterMutationStatusRateLimited, "rate-limited status")
	testassert.Equal(t, mapNewsletterMutationStatus("invalid-link"), model.NewsletterMutationStatusInvalidLink, "invalid link status")
	testassert.Equal(t, mapNewsletterMutationStatus("config-error"), model.NewsletterMutationStatusConfigError, "configuration error status")
	testassert.Equal(t, mapNewsletterMutationStatus("service-unavailable"), model.NewsletterMutationStatusServiceUnavailable, "newsletter unavailable status")
	testassert.Equal(t, mapNewsletterMutationStatus("expired"), model.NewsletterMutationStatusExpired, "expired status")
	testassert.Equal(t, mapNewsletterMutationStatus("failed"), model.NewsletterMutationStatusFailed, "failed newsletter status")
	testassert.Equal(t, mapNewsletterMutationStatus("unknown"), model.NewsletterMutationStatusUnknownError, "unknown newsletter status")
	testassert.True(t, toGraphQLInt(int64(^uint32(0))) > 0, "GraphQL integer should remain positive")
}

func TestPostMappingHelpers(t *testing.T) {
	link := "https://example.com/topic"
	updatedDate := "2026-03-01"
	thumbnail := "/thumb.webp"
	postLink := "https://example.com/post"

	topics := mapTopicsFromPostTopics([]appservice.TopicRecord{
		{ID: "react", Name: "React", Color: "blue", Link: &link},
		{ID: "", Name: "Ignored", Color: "gray"},
	})
	if len(topics) != 1 || topics[0].Link == nil || string(*topics[0].Link) != link {
		t.Fatalf("topics = %#v", topics)
	}

	category := mapCategoryFromPostCategory(&appservice.CategoryRecord{ID: "programming", Name: "Programming"})
	if category == nil || category.Color != "blue" {
		t.Fatalf("category = %#v", category)
	}
	if got := mapCategoryFromPostCategory(&appservice.CategoryRecord{}); got != nil {
		t.Fatalf("empty category = %#v", got)
	}

	posts := mapPosts([]appservice.PostRecord{
		{
			ID:             "alpha-post",
			Title:          "Alpha",
			Category:       &appservice.CategoryRecord{ID: "programming", Name: "Programming", Color: "green", Icon: "code"},
			PublishedDate:  "2026-03-01",
			UpdatedDate:    &updatedDate,
			Summary:        "Summary",
			SearchText:     "alpha summary",
			Thumbnail:      &thumbnail,
			Topics:         []appservice.TopicRecord{{ID: "react", Name: "React", Color: "blue"}},
			ReadingTimeMin: 0,
			Source:         "blog",
			Link:           &postLink,
		},
		{ID: "", Title: "Ignored"},
	})
	if len(posts) != 1 || posts[0].ReadingTime != 1 || posts[0].URL == nil || string(*posts[0].URL) != postLink {
		t.Fatalf("posts = %#v", posts)
	}

	engagement := mapEngagement(
		map[string]int64{"alpha-post": 4, "": 99},
		map[string]int64{"alpha-post": 7, "beta-post": 9},
		map[string]int64{"beta-post": 2},
	)
	if len(engagement) != 2 || engagement[0].PostID != "alpha-post" || engagement[1].PostID != "beta-post" {
		t.Fatalf("engagement = %#v", engagement)
	}
	if engagement[1].Comments != 2 {
		t.Fatalf("engagement comments = %#v", engagement)
	}
	if empty := mapEngagement(nil, nil, nil); len(empty) != 0 {
		t.Fatalf("empty engagement = %#v", empty)
	}
	if got := mapSortOrder(nil); got != "" {
		t.Fatalf("mapSortOrder(nil) = %q", got)
	}
	desc := model.SortOrderDesc
	if got := mapSortOrder(&desc); got != "desc" {
		t.Fatalf("mapSortOrder(desc) = %q", got)
	}
	if derefString(nil) != "" || toOptionalStringValue(nil) != "" {
		t.Fatal("expected nil string helpers to return empty string")
	}
}

func TestRequestMetadataHelpers(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	request.RemoteAddr = "127.0.0.1:8080"
	request.Header.Set("X-Forwarded-For", "203.0.113.5, 203.0.113.6")
	request.Header.Set("Accept-Language", "tr-TR")
	request.Header.Set("X-Real-IP", "198.51.100.2")

	ctx := WithRequestMetadata(context.Background(), request)
	metadata := getRequestMetadata(ctx)
	if metadata.ClientIP != "203.0.113.5" || metadata.AcceptLanguage != "tr-TR" {
		t.Fatalf("metadata = %#v", metadata)
	}

	request.Header.Del("X-Forwarded-For")
	if got := resolveClientIP(request); got != "198.51.100.2" {
		t.Fatalf("resolveClientIP(real ip) = %q", got)
	}

	request.Header.Del("X-Real-IP")
	if got := resolveClientIP(request); got != "127.0.0.1" {
		t.Fatalf("resolveClientIP(remote addr) = %q", got)
	}

	if metadata := getRequestMetadata(nil); metadata.ClientIP != "" {
		t.Fatalf("nil metadata = %#v", metadata)
	}
	if WithRequestMetadata(context.Background(), nil) == nil {
		t.Fatal("WithRequestMetadata(nil request) returned nil context")
	}
}
