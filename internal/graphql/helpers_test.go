package graphql

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"suaybsimsek.com/blog-api/internal/graphql/model"
	appservice "suaybsimsek.com/blog-api/internal/service"
)

func TestEnumAndScalarHelpers(t *testing.T) {
	if got := mapLocaleInput(model.LocaleTr); got != "tr" {
		t.Fatalf("mapLocaleInput() = %q", got)
	}
	if got := mapLocaleOutput(" TR "); got != model.LocaleTr {
		t.Fatalf("mapLocaleOutput() = %q", got)
	}
	if got := mapLocaleOutput("unknown"); got != model.LocaleEn {
		t.Fatalf("mapLocaleOutput(default) = %q", got)
	}
	if got := mapResolvedSortOrder("asc"); got == nil || *got != model.SortOrderAsc {
		t.Fatalf("mapResolvedSortOrder(asc) = %#v", got)
	}
	if got := mapResolvedSortOrder("nope"); got != nil {
		t.Fatalf("mapResolvedSortOrder(default) = %#v", got)
	}
	if got := mapContentQueryStatus("not-found"); got != model.ContentQueryStatusNotFound {
		t.Fatalf("mapContentQueryStatus() = %q", got)
	}
	if got := mapContentQueryStatus("service-unavailable"); got != model.ContentQueryStatusServiceUnavailable {
		t.Fatalf("mapContentQueryStatus(service-unavailable) = %q", got)
	}
	if got := mapContentQueryStatus("invalid-scope-ids"); got != model.ContentQueryStatusInvalidScopeIDS {
		t.Fatalf("mapContentQueryStatus(invalid-scope-ids) = %q", got)
	}
	if got := mapContentQueryStatus("invalid-post-id"); got != model.ContentQueryStatusInvalidPostID {
		t.Fatalf("mapContentQueryStatus(invalid-post-id) = %q", got)
	}
	if got := mapContentQueryStatus("unknown"); got != model.ContentQueryStatusFailed {
		t.Fatalf("mapContentQueryStatus(default) = %q", got)
	}
	if got := mapPostMetricStatus("invalid-post-id"); got != model.PostMetricStatusInvalidPostID {
		t.Fatalf("mapPostMetricStatus() = %q", got)
	}
	if got := mapPostMetricStatus("service-unavailable"); got != model.PostMetricStatusServiceUnavailable {
		t.Fatalf("mapPostMetricStatus(service-unavailable) = %q", got)
	}
	if got := mapPostMetricStatus("unknown"); got != model.PostMetricStatusFailed {
		t.Fatalf("mapPostMetricStatus(default) = %q", got)
	}
	if got := mapNewsletterMutationStatus("success"); got != model.NewsletterMutationStatusSuccess {
		t.Fatalf("mapNewsletterMutationStatus(success) = %q", got)
	}
	if got := mapNewsletterMutationStatus("invalid-email"); got != model.NewsletterMutationStatusInvalidEmail {
		t.Fatalf("mapNewsletterMutationStatus(invalid-email) = %q", got)
	}
	if got := mapNewsletterMutationStatus("rate-limited"); got != model.NewsletterMutationStatusRateLimited {
		t.Fatalf("mapNewsletterMutationStatus(rate-limited) = %q", got)
	}
	if got := mapNewsletterMutationStatus("invalid-link"); got != model.NewsletterMutationStatusInvalidLink {
		t.Fatalf("mapNewsletterMutationStatus(invalid-link) = %q", got)
	}
	if got := mapNewsletterMutationStatus("config-error"); got != model.NewsletterMutationStatusConfigError {
		t.Fatalf("mapNewsletterMutationStatus(config-error) = %q", got)
	}
	if got := mapNewsletterMutationStatus("service-unavailable"); got != model.NewsletterMutationStatusServiceUnavailable {
		t.Fatalf("mapNewsletterMutationStatus(service-unavailable) = %q", got)
	}
	if got := mapNewsletterMutationStatus("expired"); got != model.NewsletterMutationStatusExpired {
		t.Fatalf("mapNewsletterMutationStatus(expired) = %q", got)
	}
	if got := mapNewsletterMutationStatus("failed"); got != model.NewsletterMutationStatusFailed {
		t.Fatalf("mapNewsletterMutationStatus(failed) = %q", got)
	}
	if got := mapNewsletterMutationStatus("unknown"); got != model.NewsletterMutationStatusUnknownError {
		t.Fatalf("mapNewsletterMutationStatus(default) = %q", got)
	}
	if got := toGraphQLInt(int64(^uint32(0))); got <= 0 {
		t.Fatalf("toGraphQLInt() = %d", got)
	}
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
	if len(topics) != 1 || topics[0].Link == nil || *topics[0].Link != link {
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
	if len(posts) != 1 || posts[0].ReadingTime != 1 || posts[0].URL == nil || *posts[0].URL != postLink {
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
