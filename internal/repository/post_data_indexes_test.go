package repository

import (
	"context"
	"testing"

	mtest "suaybsimsek.com/blog-api/internal/repository/testutil/mtest"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestPostRepositoryIndexInitializers(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("create post repository indexes", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		postMongoClient = mt.Client
		markOnceDone(&postMongoOnce)

		mt.AddMockResponses(
			mtest.CreateSuccessResponse(), mtest.CreateSuccessResponse(), mtest.CreateSuccessResponse(),
			mtest.CreateSuccessResponse(), mtest.CreateSuccessResponse(), mtest.CreateSuccessResponse(),
			mtest.CreateSuccessResponse(),
		)
		collections := []struct {
			collection string
			ensure     func() error
		}{
			{postLikesCollectionName, func() error {
				return ensurePostLikeIndexes(mt.Client.Database("blog_test").Collection(postLikesCollectionName))
			}},
			{postHitsCollectionName, func() error {
				return ensurePostHitIndexes(mt.Client.Database("blog_test").Collection(postHitsCollectionName))
			}},
			{postsCollectionName, func() error {
				return ensurePostContentIndexes(mt.Client.Database("blog_test").Collection(postsCollectionName))
			}},
			{topicsCollectionName, func() error {
				return ensurePostTopicIndexes(mt.Client.Database("blog_test").Collection(topicsCollectionName))
			}},
			{categoriesCollectionName, func() error {
				return ensurePostCategoryIndexes(mt.Client.Database("blog_test").Collection(categoriesCollectionName))
			}},
			{mediaAssetsCollectionName, func() error {
				return ensurePostMediaAssetIndexes(mt.Client.Database("blog_test").Collection(mediaAssetsCollectionName))
			}},
			{postRevisionsCollectionName, func() error {
				return ensurePostRevisionIndexes(mt.Client.Database("blog_test").Collection(postRevisionsCollectionName))
			}},
		}
		for _, item := range collections {
			if err := item.ensure(); err != nil {
				mt.Fatalf("ensure indexes for %s: %v", item.collection, err)
			}
		}
	})

	mt.RunOpts("cache post repository index failures", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		postMongoClient = mt.Client
		markOnceDone(&postMongoOnce)

		failure := bson.D{{Key: "ok", Value: 0}, {Key: "errmsg", Value: "index creation failed"}, {Key: "code", Value: int32(101)}}
		mt.AddMockResponses(failure, failure, failure, failure, failure, failure, failure)
		collections := []struct {
			collection string
			ensure     func() error
		}{
			{postLikesCollectionName, func() error {
				return ensurePostLikeIndexes(mt.Client.Database("blog_test").Collection(postLikesCollectionName))
			}},
			{postHitsCollectionName, func() error {
				return ensurePostHitIndexes(mt.Client.Database("blog_test").Collection(postHitsCollectionName))
			}},
			{postsCollectionName, func() error {
				return ensurePostContentIndexes(mt.Client.Database("blog_test").Collection(postsCollectionName))
			}},
			{topicsCollectionName, func() error {
				return ensurePostTopicIndexes(mt.Client.Database("blog_test").Collection(topicsCollectionName))
			}},
			{categoriesCollectionName, func() error {
				return ensurePostCategoryIndexes(mt.Client.Database("blog_test").Collection(categoriesCollectionName))
			}},
			{mediaAssetsCollectionName, func() error {
				return ensurePostMediaAssetIndexes(mt.Client.Database("blog_test").Collection(mediaAssetsCollectionName))
			}},
			{postRevisionsCollectionName, func() error {
				return ensurePostRevisionIndexes(mt.Client.Database("blog_test").Collection(postRevisionsCollectionName))
			}},
		}
		for _, item := range collections {
			if err := item.ensure(); err == nil {
				mt.Fatalf("ensure indexes for %s expected a database error", item.collection)
			}
			if item.ensure() == nil {
				mt.Fatalf("cached index error for %s was lost", item.collection)
			}
		}
	})
}

func TestGetPostMongoClientInitialization(t *testing.T) {
	tests := []struct {
		name     string
		uri      string
		database string
		wantErr  bool
	}{
		{name: "missing connection settings", database: "blog_test", wantErr: true},
		{name: "invalid URI", uri: "not-mongodb", database: "blog_test", wantErr: true},
		{name: "valid settings", uri: "mongodb://localhost:27017", database: "blog_test"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			resetPostRepositoryState()
			t.Cleanup(resetPostRepositoryState)
			t.Setenv("MONGODB_URI", test.uri)
			t.Setenv("MONGODB_DATABASE", test.database)

			client, err := getPostMongoClient()
			if (err != nil) != test.wantErr {
				t.Fatalf("getPostMongoClient() error = %v, wantErr %t", err, test.wantErr)
			}
			if test.wantErr {
				return
			}
			if client == nil {
				t.Fatal("getPostMongoClient() returned a nil client")
			}
			t.Cleanup(func() {
				if err := client.Disconnect(context.Background()); err != nil {
					t.Errorf("disconnect MongoDB client: %v", err)
				}
			})
		})
	}
}
