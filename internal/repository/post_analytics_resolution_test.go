package repository

import (
	"context"
	"testing"

	mtest "suaybsimsek.com/blog-api/internal/repository/testutil/mtest"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestResolvePostAnalyticsByPostID(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("resolve likes and hits with seeded fallbacks", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockPostClient(mt)

		mt.AddMockResponses(
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(2)}, bson.E{Key: "nModified", Value: int32(0)}),
			mockFindResponse("blog_test."+postLikesCollectionName, bson.D{
				{Key: "postId", Value: "alpha-post"}, {Key: "likes", Value: int64(47)},
			}),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(2)}, bson.E{Key: "nModified", Value: int32(0)}),
			mockFindResponse("blog_test."+postHitsCollectionName, bson.D{
				{Key: "postId", Value: "alpha-post"}, {Key: "hits", Value: int64(1200)},
			}),
		)

		posts := []PostRecord{{ID: " ALPHA-POST "}, {ID: "beta-post"}}
		likes := resolvePostLikesByPostID(context.Background(), posts)
		if likes["alpha-post"] != 47 || likes["beta-post"] != computeInitialLikes("beta-post") {
			mt.Fatalf("resolvePostLikesByPostID() = %#v", likes)
		}

		hits := resolvePostHitsByPostID(context.Background(), posts)
		if hits["alpha-post"] != 1200 || hits["beta-post"] != computeInitialHits("beta-post") {
			mt.Fatalf("resolvePostHitsByPostID() = %#v", hits)
		}
	})
}
