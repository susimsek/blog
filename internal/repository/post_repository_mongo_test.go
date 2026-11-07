package repository

import (
	"context"
	"testing"

	mtest "suaybsimsek.com/blog-api/internal/repository/testutil/mtest"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestPostRepositoryCountAndFindAnyLocale(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("count posts and find without locale", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockPostClient(mt)

		mt.AddMockResponses(
			mockCountDocumentsResponse("blog_test."+postsCollectionName, 4),
			mockFindResponse("blog_test."+postsCollectionName, bson.D{
				{Key: "id", Value: "post-1"},
				{Key: "locale", Value: " EN "},
				{Key: "title", Value: "Example"},
				{Key: "source", Value: " ALL "},
				{Key: "thumbnail", Value: " /cover.webp "},
			}),
			mockFindResponse("blog_test."+postsCollectionName),
		)

		repository := NewPostMongoRepository()
		ctx := context.Background()
		count, err := repository.CountPosts(ctx, bson.M{"source": "blog"})
		if err != nil || count != 4 {
			mt.Fatalf("CountPosts() = %d, %v", count, err)
		}

		post, err := repository.FindPostByIDAnyLocale(ctx, "post-1")
		if err != nil || post == nil {
			mt.Fatalf("FindPostByIDAnyLocale() = %#v, %v", post, err)
		}
		if post.ID != "post-1" || post.Title != "Example" || post.Source != "blog" || post.Thumbnail == nil || *post.Thumbnail != "/cover.webp" {
			mt.Fatalf("post was not normalized: %#v", post)
		}

		missing, err := repository.FindPostByIDAnyLocale(ctx, "missing")
		if err != nil || missing != nil {
			mt.Fatalf("FindPostByIDAnyLocale(missing) = %#v, %v", missing, err)
		}
	})
}
