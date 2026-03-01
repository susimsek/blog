package graph

import (
	"context"
	"net/http/httptest"
	"testing"

	appservice "suaybsimsek.com/blog-api/internal/service"
	"suaybsimsek.com/blog-api/pkg/graph/model"
)

func TestQueryResolverPostsAndPost(t *testing.T) {
	originalQueryContentFn := queryContentFn
	originalQueryPostFn := queryPostFn
	t.Cleanup(func() {
		queryContentFn = originalQueryContentFn
		queryPostFn = originalQueryPostFn
	})

	queryContentFn = func(_ context.Context, input appservice.ContentQueryInput) appservice.ContentResponse {
		if input.Locale != "tr" || input.Sort != "asc" || len(input.ScopeIDs) != 1 || input.ScopeIDs[0] != "alpha-post" {
			t.Fatalf("query content input = %#v", input)
		}
		return appservice.ContentResponse{
			Status:        "success",
			Locale:        "tr",
			Posts:         []appservice.PostRecord{{ID: "alpha-post", Title: "Alpha", PublishedDate: "2026-03-01", Summary: "Summary", SearchText: "alpha", ReadingTimeMin: 3}},
			LikesByPostID: map[string]int64{"alpha-post": 4},
			HitsByPostID:  map[string]int64{"alpha-post": 8},
			Total:         -1,
			Page:          0,
			Size:          0,
			Sort:          "desc",
		}
	}
	queryPostFn = func(_ context.Context, input appservice.PostQueryInput) appservice.ContentResponse {
		if input.Locale != "tr" || input.PostID != "alpha-post" {
			t.Fatalf("query post input = %#v", input)
		}
		return appservice.ContentResponse{
			Status:        "success",
			Locale:        "tr",
			Posts:         []appservice.PostRecord{{ID: "alpha-post", Title: "Alpha", PublishedDate: "2026-03-01", Summary: "Summary", SearchText: "alpha", ReadingTimeMin: 3}},
			LikesByPostID: map[string]int64{"alpha-post": 4},
		}
	}

	page := 2
	size := 5
	sortOrder := model.SortOrderAsc
	connection, err := (&queryResolver{&Resolver{}}).Posts(context.Background(), model.LocaleTr, &model.PostsQueryInput{
		Page:     &page,
		Size:     &size,
		Sort:     &sortOrder,
		ScopeIds: []string{"alpha-post"},
	})
	if err != nil {
		t.Fatalf("Posts() error = %v", err)
	}
	if connection.Total != 0 || connection.Page != 1 || connection.Size != 1 || connection.Sort == nil || *connection.Sort != model.SortOrderDesc {
		t.Fatalf("connection = %#v", connection)
	}
	if len(connection.Nodes) != 1 || len(connection.Engagement) != 1 {
		t.Fatalf("connection nodes = %#v", connection)
	}

	postResult, err := (&queryResolver{&Resolver{}}).Post(context.Background(), model.LocaleTr, "alpha-post")
	if err != nil {
		t.Fatalf("Post() error = %v", err)
	}
	if postResult.Node == nil || postResult.Engagement == nil {
		t.Fatalf("postResult = %#v", postResult)
	}
}

func TestMutationResolverMetricsAndNewsletter(t *testing.T) {
	originalIncrementLikeFn := incrementLikeFn
	originalIncrementHitFn := incrementHitFn
	originalSubscribeFn := subscribeFn
	originalResendFn := resendFn
	originalConfirmFn := confirmFn
	originalUnsubscribeFn := unsubscribeFn
	t.Cleanup(func() {
		incrementLikeFn = originalIncrementLikeFn
		incrementHitFn = originalIncrementHitFn
		subscribeFn = originalSubscribeFn
		resendFn = originalResendFn
		confirmFn = originalConfirmFn
		unsubscribeFn = originalUnsubscribeFn
	})

	incrementLikeFn = func(context.Context, string) appservice.ContentResponse {
		return appservice.ContentResponse{Status: "success", PostID: "", Likes: 7}
	}
	incrementHitFn = func(context.Context, string) appservice.ContentResponse {
		return appservice.ContentResponse{Status: "failed", PostID: "alpha-post", Hits: 9}
	}
	subscribeFn = func(_ context.Context, input appservice.SubscribeInput, meta appservice.RequestMetadata) appservice.Result {
		if input.Locale != "tr" || input.Email != "reader@example.com" || input.FormName != "footer" || meta.ClientIP != "203.0.113.5" {
			t.Fatalf("subscribe input = %#v %#v", input, meta)
		}
		return appservice.Result{Status: "success", ForwardTo: "/tr/thanks"}
	}
	resendFn = func(_ context.Context, input appservice.ResendInput, meta appservice.RequestMetadata) appservice.Result {
		if input.Locale != "tr" || input.Email != "reader@example.com" || meta.AcceptLanguage != "tr-TR" {
			t.Fatalf("resend input = %#v %#v", input, meta)
		}
		return appservice.Result{Status: "rate-limited"}
	}
	confirmFn = func(context.Context, string) appservice.Result { return appservice.Result{Status: "expired"} }
	unsubscribeFn = func(context.Context, string) appservice.Result { return appservice.Result{Status: "success"} }

	request := httptest.NewRequest("POST", "/graphql", nil)
	request.RemoteAddr = "203.0.113.5:8080"
	request.Header.Set("Accept-Language", "tr-TR")
	ctx := WithRequestMetadata(context.Background(), request)

	likeResult, err := (&mutationResolver{&Resolver{}}).IncrementPostLike(ctx, "alpha-post")
	if err != nil {
		t.Fatalf("IncrementPostLike() error = %v", err)
	}
	if likeResult.Likes == nil || *likeResult.Likes != 7 || likeResult.PostID != "alpha-post" {
		t.Fatalf("likeResult = %#v", likeResult)
	}

	hitResult, err := (&mutationResolver{&Resolver{}}).IncrementPostHit(ctx, "alpha-post")
	if err != nil {
		t.Fatalf("IncrementPostHit() error = %v", err)
	}
	if hitResult.Hits == nil || *hitResult.Hits != 9 || hitResult.Status != model.PostMetricStatusFailed {
		t.Fatalf("hitResult = %#v", hitResult)
	}

	formName := " footer "
	subscribeResult, err := (&mutationResolver{&Resolver{}}).SubscribeNewsletter(ctx, model.NewsletterSubscribeInput{
		Locale:   model.LocaleTr,
		Email:    " reader@example.com ",
		Tags:     []string{"news"},
		FormName: &formName,
	})
	if err != nil {
		t.Fatalf("SubscribeNewsletter() error = %v", err)
	}
	if subscribeResult.ForwardTo == nil || *subscribeResult.ForwardTo != "/tr/thanks" {
		t.Fatalf("subscribeResult = %#v", subscribeResult)
	}

	resendResult, err := (&mutationResolver{&Resolver{}}).ResendNewsletterConfirmation(ctx, model.NewsletterResendInput{
		Locale: model.LocaleTr,
		Email:  "reader@example.com",
	})
	if err != nil || resendResult.Status != model.NewsletterMutationStatusRateLimited {
		t.Fatalf("resendResult = %#v, %v", resendResult, err)
	}

	confirmResult, err := (&mutationResolver{&Resolver{}}).ConfirmNewsletterSubscription(ctx, " token ")
	if err != nil || confirmResult.Status != model.NewsletterMutationStatusExpired {
		t.Fatalf("confirmResult = %#v, %v", confirmResult, err)
	}

	unsubscribeResult, err := (&mutationResolver{&Resolver{}}).UnsubscribeNewsletter(ctx, " token ")
	if err != nil || unsubscribeResult.Status != model.NewsletterMutationStatusSuccess {
		t.Fatalf("unsubscribeResult = %#v, %v", unsubscribeResult, err)
	}

	if (&Resolver{}).Mutation() == nil || (&Resolver{}).Query() == nil {
		t.Fatal("expected resolver accessors")
	}
}
