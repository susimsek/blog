package repository

import (
	"context"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	mtest "suaybsimsek.com/blog-api/internal/repository/testutil/mtest"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestAdminNewsletterRepositoryMongoFailurePaths(t *testing.T) {
	ctx := context.Background()
	subscriberCollection := "blog_test." + newsletterCollectionName
	campaignCollection := "blog_test.newsletter_campaigns"
	deliveryCollection := "blog_test.newsletter_deliveries"
	postCollection := "blog_test." + postsCollectionName
	campaign := bson.D{
		{Key: "locale", Value: "en"},
		{Key: "itemKey", Value: "post:alpha-post"},
		{Key: "title", Value: "Alpha"},
		{Key: "link", Value: "https://example.com/en/posts/alpha-post"},
	}
	tests := []struct {
		name      string
		responses []bson.D
		call      func(AdminNewsletterRepository) error
	}{
		{
			name:      "subscriber count",
			responses: []bson.D{adminNewsletterMockErrorResponse()},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListSubscribers(ctx, domain.AdminNewsletterSubscriberFilter{}, 1, 10)
				return err
			},
		},
		{
			name: "subscriber find",
			responses: []bson.D{
				mockCountDocumentsResponse(subscriberCollection, 0),
				adminNewsletterMockErrorResponse(),
			},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListSubscribers(ctx, domain.AdminNewsletterSubscriberFilter{}, 1, 10)
				return err
			},
		},
		{
			name: "subscriber decode",
			responses: []bson.D{
				mockCountDocumentsResponse(subscriberCollection, 1),
				mockFindResponse(subscriberCollection, bson.D{{Key: "email", Value: int32(1)}}),
			},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListSubscribers(ctx, domain.AdminNewsletterSubscriberFilter{}, 1, 10)
				return err
			},
		},
		{
			name: "subscriber cursor",
			responses: []bson.D{
				mockCountDocumentsResponse(subscriberCollection, 0),
				mtest.CreateCursorResponse(1, subscriberCollection, mtest.FirstBatch),
				adminNewsletterMockErrorResponse(),
			},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListSubscribers(ctx, domain.AdminNewsletterSubscriberFilter{}, 1, 10)
				return err
			},
		},
		{
			name:      "campaign count",
			responses: []bson.D{adminNewsletterMockErrorResponse()},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListCampaigns(ctx, domain.AdminNewsletterCampaignFilter{}, 1, 10)
				return err
			},
		},
		{
			name: "campaign find",
			responses: []bson.D{
				mockCountDocumentsResponse(campaignCollection, 0),
				adminNewsletterMockErrorResponse(),
			},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListCampaigns(ctx, domain.AdminNewsletterCampaignFilter{}, 1, 10)
				return err
			},
		},
		{
			name: "campaign cursor",
			responses: []bson.D{
				mockCountDocumentsResponse(campaignCollection, 0),
				mtest.CreateCursorResponse(1, campaignCollection, mtest.FirstBatch),
				adminNewsletterMockErrorResponse(),
			},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListCampaigns(ctx, domain.AdminNewsletterCampaignFilter{}, 1, 10)
				return err
			},
		},
		{
			name: "campaign decode",
			responses: []bson.D{
				mockCountDocumentsResponse(campaignCollection, 1),
				mockFindResponse(campaignCollection, bson.D{{Key: "locale", Value: int32(1)}}),
			},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListCampaigns(ctx, domain.AdminNewsletterCampaignFilter{}, 1, 10)
				return err
			},
		},
		{
			name: "campaign summary find",
			responses: []bson.D{
				mockCountDocumentsResponse(campaignCollection, 1),
				mockFindResponse(campaignCollection, campaign),
				adminNewsletterMockErrorResponse(),
			},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListCampaigns(ctx, domain.AdminNewsletterCampaignFilter{}, 1, 10)
				return err
			},
		},
		{
			name: "campaign summary decode",
			responses: []bson.D{
				mockCountDocumentsResponse(campaignCollection, 1),
				mockFindResponse(campaignCollection, campaign),
				mockFindResponse(postCollection, bson.D{{Key: "id", Value: int32(1)}}),
			},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListCampaigns(ctx, domain.AdminNewsletterCampaignFilter{}, 1, 10)
				return err
			},
		},
		{
			name: "campaign summary cursor",
			responses: []bson.D{
				mockCountDocumentsResponse(campaignCollection, 1),
				mockFindResponse(campaignCollection, campaign),
				mtest.CreateCursorResponse(1, postCollection, mtest.FirstBatch),
				adminNewsletterMockErrorResponse(),
			},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListCampaigns(ctx, domain.AdminNewsletterCampaignFilter{}, 1, 10)
				return err
			},
		},
		{
			name:      "delivery count",
			responses: []bson.D{adminNewsletterMockErrorResponse()},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListDeliveryFailures(ctx, domain.AdminNewsletterDeliveryFailureFilter{}, 1, 10)
				return err
			},
		},
		{
			name: "delivery find",
			responses: []bson.D{
				mockCountDocumentsResponse(deliveryCollection, 0),
				adminNewsletterMockErrorResponse(),
			},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListDeliveryFailures(ctx, domain.AdminNewsletterDeliveryFailureFilter{}, 1, 10)
				return err
			},
		},
		{
			name: "delivery decode",
			responses: []bson.D{
				mockCountDocumentsResponse(deliveryCollection, 1),
				mockFindResponse(deliveryCollection, bson.D{{Key: "locale", Value: int32(1)}}),
			},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListDeliveryFailures(ctx, domain.AdminNewsletterDeliveryFailureFilter{}, 1, 10)
				return err
			},
		},
		{
			name: "delivery cursor",
			responses: []bson.D{
				mockCountDocumentsResponse(deliveryCollection, 0),
				mtest.CreateCursorResponse(1, deliveryCollection, mtest.FirstBatch),
				adminNewsletterMockErrorResponse(),
			},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.ListDeliveryFailures(ctx, domain.AdminNewsletterDeliveryFailureFilter{}, 1, 10)
				return err
			},
		},
		{
			name:      "status update",
			responses: []bson.D{adminNewsletterMockErrorResponse()},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.UpdateSubscriberStatusByEmail(ctx, "reader@example.com", "active", time.Now().UTC())
				return err
			},
		},
		{
			name:      "status update missing subscriber",
			responses: []bson.D{mtest.CreateSuccessResponse(bson.E{Key: "value", Value: nil})},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.UpdateSubscriberStatusByEmail(ctx, "reader@example.com", "active", time.Now().UTC())
				return err
			},
		},
		{
			name:      "subscriber delete",
			responses: []bson.D{adminNewsletterMockErrorResponse()},
			call: func(repository AdminNewsletterRepository) error {
				_, err := repository.DeleteSubscriberByEmail(ctx, "reader@example.com")
				return err
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
			mt.RunOpts("mock newsletter repository", mtest.NewOptions().ClientType(mtest.Mock).DatabaseName("blog_test").CreateCollection(false), func(mt *mtest.T) {
				resetNewsletterRepositoryState()
				resetPostRepositoryState()
				resetAdminRepositoryState()
				t.Cleanup(resetNewsletterRepositoryState)
				t.Cleanup(resetPostRepositoryState)
				t.Cleanup(resetAdminRepositoryState)
				configureRepositoryMockDatabase(t, "blog_test")
				useMockNewsletterClient(mt)
				useMockPostClient(mt)
				useMockAdminClient(mt)
				mt.AddMockResponses(test.responses...)

				if err := test.call(NewAdminNewsletterRepository()); err == nil {
					t.Fatal("repository call succeeded, want an error")
				}
			})
		})
	}
}

func TestAdminNewsletterRepositoryUpdatesUnsubscribedAndOtherStatuses(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("newsletter status transitions", mtest.NewOptions().ClientType(mtest.Mock).DatabaseName("blog_test").CreateCollection(false), func(mt *mtest.T) {
		resetNewsletterRepositoryState()
		t.Cleanup(resetNewsletterRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockNewsletterClient(mt)

		now := time.Now().UTC()
		updatedSubscriber := bson.D{
			{Key: "email", Value: "reader@example.com"},
			{Key: "locale", Value: "en"},
			{Key: "status", Value: "unsubscribed"},
			{Key: "unsubscribedAt", Value: now},
		}
		otherStatusSubscriber := bson.D{
			{Key: "email", Value: "reader@example.com"},
			{Key: "locale", Value: "en"},
			{Key: "status", Value: "pending"},
		}
		mt.AddMockResponses(
			mtest.CreateSuccessResponse(bson.E{Key: "value", Value: updatedSubscriber}),
			mtest.CreateSuccessResponse(bson.E{Key: "value", Value: otherStatusSubscriber}),
		)

		repository := NewAdminNewsletterRepository()
		unsubscribed, err := repository.UpdateSubscriberStatusByEmail(context.Background(), "reader@example.com", "unsubscribed", now)
		if err != nil || unsubscribed == nil || unsubscribed.UnsubscribedAt == nil {
			t.Fatalf("unsubscribed update = %#v, %v", unsubscribed, err)
		}
		otherStatus, err := repository.UpdateSubscriberStatusByEmail(context.Background(), "reader@example.com", "pending", now)
		if err != nil || otherStatus == nil || otherStatus.Status != "pending" || otherStatus.ConfirmedAt != nil || otherStatus.UnsubscribedAt != nil {
			t.Fatalf("other status update = %#v, %v", otherStatus, err)
		}
	})
}

func TestAdminNewsletterCampaignSummaryEnrichmentSkipsUnresolvableItems(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("campaign summary edge cases", mtest.NewOptions().ClientType(mtest.Mock).DatabaseName("blog_test").CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		resetAdminRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		t.Cleanup(resetAdminRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockPostClient(mt)
		useMockAdminClient(mt)

		campaigns := []bson.D{
			{{Key: "locale", Value: "en"}, {Key: "itemKey", Value: "post:found"}, {Key: "link", Value: "/en/posts/found"}},
			{{Key: "locale", Value: "en"}, {Key: "itemKey", Value: "post:existing"}, {Key: "summary", Value: "Already present"}, {Key: "link", Value: "/en/posts/existing"}},
			{{Key: "locale", Value: "en"}, {Key: "itemKey", Value: "post:invalid-link"}, {Key: "link", Value: "/about"}},
			{{Key: "locale", Value: "en"}, {Key: "itemKey", Value: "post:missing-summary"}, {Key: "link", Value: "/en/posts/missing-summary"}},
			{{Key: "locale", Value: " "}, {Key: "itemKey", Value: "post:invalid-locale"}},
		}
		mt.AddMockResponses(
			mockCountDocumentsResponse("blog_test.newsletter_campaigns", int64(len(campaigns))),
			mockFindResponse("blog_test.newsletter_campaigns", campaigns...),
			mockFindResponse("blog_test."+postsCollectionName,
				bson.D{{Key: "id", Value: "found"}, {Key: "summary", Value: "Resolved summary"}},
				bson.D{{Key: "id", Value: "bad id"}, {Key: "summary", Value: "Ignored summary"}},
				bson.D{{Key: "id", Value: "missing-summary"}, {Key: "summary", Value: "  "}},
			),
		)

		result, err := NewAdminNewsletterRepository().ListCampaigns(context.Background(), domain.AdminNewsletterCampaignFilter{}, 1, 10)
		if err != nil {
			t.Fatalf("ListCampaigns() error = %v", err)
		}
		if result.Total != len(campaigns) || len(result.Items) != 4 {
			t.Fatalf("ListCampaigns() = %#v", result)
		}
		if result.Items[0].Summary != "Resolved summary" || result.Items[1].Summary != "Already present" || result.Items[2].Summary != "" || result.Items[3].Summary != "" {
			t.Fatalf("campaign summaries were not preserved or resolved: %#v", result.Items)
		}
	})
}

func adminNewsletterMockErrorResponse() bson.D {
	return bson.D{
		{Key: "ok", Value: int32(0)},
		{Key: "errmsg", Value: "mock newsletter repository failure"},
		{Key: "code", Value: int32(1)},
	}
}
