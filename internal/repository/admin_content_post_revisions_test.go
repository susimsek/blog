package repository

import (
	"context"
	"errors"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	mtest "suaybsimsek.com/blog-api/internal/repository/testutil/mtest"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestAdminContentPostRevisionRepositoryWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock admin content post revisions", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockPostClient(mt)

		now := time.Date(2026, time.November, 6, 12, 0, 0, 0, time.UTC)
		revisionDocument := bson.D{
			{Key: "id", Value: "revision-1"},
			{Key: "locale", Value: " EN "},
			{Key: "postId", Value: " Post-1 "},
			{Key: "revisionNumber", Value: int32(4)},
			{Key: "title", Value: " Title "},
			{Key: "summary", Value: " Summary "},
			{Key: "content", Value: "content body"},
			{Key: "contentMode", Value: " MARKDOWN "},
			{Key: "thumbnail", Value: " /thumbnail.webp "},
			{Key: "source", Value: " BLOG "},
			{Key: "publishedDate", Value: " 2026-11-01 "},
			{Key: "updatedDate", Value: " 2026-11-06 "},
			{Key: "category", Value: bson.D{{Key: "id", Value: " GAMING "}, {Key: "name", Value: " Gaming "}}},
			{Key: "topics", Value: bson.A{
				bson.D{{Key: "id", Value: "topic-1"}, {Key: "name", Value: " Topic one "}},
				bson.D{{Key: "id", Value: "topic-2"}, {Key: "name", Value: " "}},
			}},
			{Key: "topicIds", Value: bson.A{" TOPIC-1 ", "", "topic-2"}},
			{Key: "readingTimeMin", Value: int32(5)},
			{Key: "status", Value: " scheduled "},
			{Key: "scheduledAt", Value: now.Add(time.Hour)},
			{Key: "createdAt", Value: now},
			{Key: "contentUpdatedAt", Value: now.Add(-time.Hour)},
			{Key: "updatedAt", Value: now},
		}
		postDocument := bson.D{
			{Key: "locale", Value: "en"},
			{Key: "id", Value: "post-1"},
			{Key: "title", Value: "Restored title"},
			{Key: "summary", Value: "Restored summary"},
			{Key: "content", Value: "Restored content"},
			{Key: "contentMode", Value: "markdown"},
			{Key: "thumbnail", Value: "/restored.webp"},
			{Key: "source", Value: "blog"},
			{Key: "publishedDate", Value: "2026-11-01"},
			{Key: "updatedDate", Value: "2026-11-06"},
			{Key: "category", Value: bson.D{{Key: "id", Value: "gaming"}, {Key: "name", Value: "Gaming"}}},
			{Key: "topics", Value: bson.A{bson.D{{Key: "id", Value: "topic-1"}, {Key: "name", Value: "Topic one"}}}},
			{Key: "topicIds", Value: bson.A{"topic-1"}},
			{Key: "readingTimeMin", Value: int32(5)},
			{Key: "status", Value: "scheduled"},
			{Key: "scheduledAt", Value: now.Add(time.Hour)},
			{Key: "contentUpdatedAt", Value: now.Add(-time.Hour)},
			{Key: "revisionCount", Value: int32(5)},
			{Key: "latestRevisionAt", Value: now},
			{Key: "updatedAt", Value: now},
		}
		mt.AddMockResponses(
			mockCountDocumentsResponse("blog_test."+postRevisionsCollectionName, 1),
			mockFindResponse("blog_test."+postRevisionsCollectionName, revisionDocument),
			mockFindResponse("blog_test."+postRevisionsCollectionName, revisionDocument),
			mockFindResponse("blog_test."+postRevisionsCollectionName),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
			mtest.CreateSuccessResponse(bson.E{Key: "value", Value: postDocument}),
			mockCountDocumentsResponse("blog_test."+postRevisionsCollectionName, 0),
			mtest.CreateSuccessResponse(bson.E{Key: "value", Value: nil}),
		)

		repository := NewAdminContentRepository()
		ctx := context.Background()
		assertPostRevisionListAndFind(ctx, t, repository)
		assertPostRevisionCreation(ctx, t, repository, now)
		assertPostRevisionRestore(ctx, t, repository, now)
	})
}

func assertPostRevisionListAndFind(ctx context.Context, t *testing.T, repository AdminContentRepository) {
	t.Helper()
	list, err := repository.ListPostRevisions(ctx, " EN ", " POST-1 ", 0, 0)
	if err != nil || list.Total != 1 || list.Page != 1 || list.Size != 1 || len(list.Items) != 1 {
		t.Fatalf("ListPostRevisions() = %#v, %v", list, err)
	}
	if item := list.Items[0]; item.Locale != "en" || item.PostID != "post-1" || item.CategoryID != "gaming" || len(item.TopicIDs) != 2 || item.TopicNames[0] != "Topic one" {
		t.Fatalf("revision was not normalized: %#v", item)
	}

	revision, err := repository.FindPostRevisionByID(ctx, "EN", "POST-1", " revision-1 ")
	if err != nil || revision == nil || revision.ID != "revision-1" || revision.RevisionNumber != 4 {
		t.Fatalf("FindPostRevisionByID() = %#v, %v", revision, err)
	}
	revision, err = repository.FindPostRevisionByID(ctx, "en", "post-1", "missing")
	if err != nil || revision != nil {
		t.Fatalf("FindPostRevisionByID(missing) = %#v, %v", revision, err)
	}
}

func assertPostRevisionCreation(ctx context.Context, t *testing.T, repository AdminContentRepository, now time.Time) {
	t.Helper()
	record := domain.AdminContentPostRecord{
		Locale: "EN", ID: "POST-1", Title: " Title ", Summary: " Summary ", Content: "body",
		ContentMode: " MARKDOWN ", Thumbnail: " /thumbnail.webp ", Source: " BLOG ",
		CategoryID: " GAMING ", CategoryName: " Gaming ", TopicIDs: []string{"TOPIC-1"},
		TopicNames: []string{" Topic one "}, RevisionCount: 4, Status: domain.AdminContentPostStatusPublished,
	}
	created, err := repository.CreatePostRevision(ctx, record, 0, time.Time{})
	if err != nil || created == nil || created.ID == "" || created.RevisionNumber != 5 || created.CreatedAt.IsZero() {
		t.Fatalf("CreatePostRevision(defaults) = %#v, %v", created, err)
	}
	created, err = repository.CreatePostRevision(ctx, record, 2, now)
	if err != nil || created == nil || created.RevisionNumber != 2 || !created.CreatedAt.Equal(now) {
		t.Fatalf("CreatePostRevision(explicit values) = %#v, %v", created, err)
	}
}

func assertPostRevisionRestore(ctx context.Context, t *testing.T, repository AdminContentRepository, now time.Time) {
	t.Helper()
	stamp := &domain.AdminContentPostRevisionStamp{Number: 5, CreatedAt: now}
	restored, err := repository.RestorePostRevision(ctx, domain.AdminContentPostRevisionRecord{
		Locale: " EN ", PostID: " POST-1 ", Title: " Restored title ", Summary: " Restored summary ",
		Content: "Restored content", ContentMode: " MARKDOWN ", Thumbnail: " /restored.webp ",
		CategoryID: " GAMING ", CategoryName: " Gaming ", TopicIDs: []string{"TOPIC-1", " ", "TOPIC-2"},
		TopicNames: []string{" Topic one "}, Status: "scheduled", ScheduledAt: now.Add(time.Hour),
		ContentUpdatedAt: now.Add(-time.Hour),
	}, stamp, now)
	if err != nil || restored == nil || restored.Title != "Restored title" || restored.RevisionCount != 5 || restored.Status != "scheduled" {
		t.Fatalf("RestorePostRevision() = %#v, %v", restored, err)
	}

	empty, err := repository.ListPostRevisions(ctx, "en", "post-1", 3, 20)
	if err != nil || empty.Total != 0 || empty.Page != 1 || empty.Size != 20 || empty.Items == nil {
		t.Fatalf("ListPostRevisions(empty) = %#v, %v", empty, err)
	}
	if _, err := repository.RestorePostRevision(ctx, domain.AdminContentPostRevisionRecord{Locale: "en", PostID: "post-1"}, nil, now); !errors.Is(err, ErrAdminContentPostNotFound) {
		t.Fatalf("RestorePostRevision(missing) error = %v", err)
	}
}

func TestAdminContentPostRevisionRepositoryUnavailablePaths(t *testing.T) {
	resetPostRepositoryState()
	t.Cleanup(resetPostRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewAdminContentRepository()
	ctx := context.Background()
	if _, err := repository.ListPostRevisions(ctx, "en", "post-1", 1, 10); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("ListPostRevisions() error = %v", err)
	}
	if _, err := repository.FindPostRevisionByID(ctx, "en", "post-1", "revision-1"); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("FindPostRevisionByID() error = %v", err)
	}
	if _, err := repository.CreatePostRevision(ctx, domain.AdminContentPostRecord{ID: "post-1"}, 1, time.Time{}); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("CreatePostRevision() error = %v", err)
	}
	if _, err := repository.RestorePostRevision(ctx, domain.AdminContentPostRevisionRecord{PostID: "post-1"}, nil, time.Time{}); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("RestorePostRevision() error = %v", err)
	}
}

func TestAdminContentPostRevisionRepositoryPropagatesMongoErrors(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("propagates mongo errors", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockPostClient(mt)

		mongoError := bson.D{
			{Key: "ok", Value: int32(0)},
			{Key: "errmsg", Value: "mock mongo failure"},
			{Key: "code", Value: int32(123)},
		}
		mt.AddMockResponses(
			mongoError,
			mockCountDocumentsResponse("blog_test."+postRevisionsCollectionName, 1),
			mongoError,
			mockCountDocumentsResponse("blog_test."+postRevisionsCollectionName, 1),
			mockFindResponse("blog_test."+postRevisionsCollectionName, bson.D{{Key: "revisionNumber", Value: "invalid"}}),
			mongoError,
			mongoError,
			mongoError,
		)

		repository := NewAdminContentRepository()
		ctx := context.Background()
		if _, err := repository.ListPostRevisions(ctx, "en", "post-1", 1, 10); err == nil {
			t.Fatal("ListPostRevisions(count failure) error = nil")
		}
		if _, err := repository.ListPostRevisions(ctx, "en", "post-1", 1, 10); err == nil {
			t.Fatal("ListPostRevisions(find failure) error = nil")
		}
		if _, err := repository.ListPostRevisions(ctx, "en", "post-1", 1, 10); err == nil {
			t.Fatal("ListPostRevisions(decode failure) error = nil")
		}
		if _, err := repository.FindPostRevisionByID(ctx, "en", "post-1", "revision-1"); err == nil {
			t.Fatal("FindPostRevisionByID() error = nil")
		}
		if _, err := repository.CreatePostRevision(ctx, domain.AdminContentPostRecord{ID: "post-1"}, 1, time.Time{}); err == nil {
			t.Fatal("CreatePostRevision() error = nil")
		}
		if _, err := repository.RestorePostRevision(ctx, domain.AdminContentPostRevisionRecord{PostID: "post-1"}, nil, time.Time{}); err == nil {
			t.Fatal("RestorePostRevision() error = nil")
		}
	})
}
