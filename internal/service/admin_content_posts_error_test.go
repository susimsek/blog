package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
)

type adminContentPostErrorCase struct {
	name       string
	repository adminContentStubRepository
	run        func() error
}

func TestAdminContentPostOperationsRejectInvalidRequests(t *testing.T) {
	admin := &domain.AdminUser{ID: "admin-1"}
	ctx := context.Background()
	postID := "alpha-post"
	tooLongContent := string(make([]byte, adminContentBodyMaxLength+1))

	cases := []adminContentPostErrorCase{
		{name: "list requires authentication", run: func() error { _, err := ListAdminContentPosts(ctx, nil, domain.AdminContentPostFilter{}); return err }},
		{name: "list rejects unsupported locale", run: func() error {
			_, err := ListAdminContentPosts(ctx, admin, domain.AdminContentPostFilter{Locale: "fr"})
			return err
		}},
		{name: "list rejects unsupported preferred locale", run: func() error {
			_, err := ListAdminContentPosts(ctx, admin, domain.AdminContentPostFilter{PreferredLocale: "fr"})
			return err
		}},
		{name: "list rejects unsupported source", run: func() error {
			_, err := ListAdminContentPosts(ctx, admin, domain.AdminContentPostFilter{Source: "other"})
			return err
		}},
		{name: "list rejects invalid category id", run: func() error {
			_, err := ListAdminContentPosts(ctx, admin, domain.AdminContentPostFilter{CategoryID: "bad id"})
			return err
		}},
		{name: "list rejects invalid topic id", run: func() error {
			_, err := ListAdminContentPosts(ctx, admin, domain.AdminContentPostFilter{TopicID: "bad id"})
			return err
		}},
		{
			name: "list maps repository error",
			repository: adminContentStubRepository{listPostGroups: func(context.Context, domain.AdminContentPostFilter) (*domain.AdminContentPostListResult, error) {
				return nil, errors.New("list failed")
			}},
			run: func() error { _, err := ListAdminContentPosts(ctx, admin, domain.AdminContentPostFilter{}); return err },
		},
		{name: "get requires authentication", run: func() error { _, err := GetAdminContentPost(ctx, nil, "en", postID); return err }},
		{name: "get rejects unsupported locale", run: func() error { _, err := GetAdminContentPost(ctx, admin, "fr", postID); return err }},
		{name: "get rejects invalid post id", run: func() error { _, err := GetAdminContentPost(ctx, admin, "en", "bad id"); return err }},
		{name: "get rejects missing post", run: func() error { _, err := GetAdminContentPost(ctx, admin, "en", postID); return err }},
		{
			name: "get maps repository error",
			repository: adminContentStubRepository{findPostByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentPostRecord, error) {
				return nil, errors.New("load failed")
			}},
			run: func() error { _, err := GetAdminContentPost(ctx, admin, "en", postID); return err },
		},
		{name: "revision list requires authentication", run: func() error { _, err := ListAdminContentPostRevisions(ctx, nil, "en", postID, nil, nil); return err }},
		{name: "revision list rejects unsupported locale", run: func() error { _, err := ListAdminContentPostRevisions(ctx, admin, "fr", postID, nil, nil); return err }},
		{name: "revision list rejects invalid post id", run: func() error {
			_, err := ListAdminContentPostRevisions(ctx, admin, "en", "bad id", nil, nil)
			return err
		}},
		{
			name: "revision list maps repository error",
			repository: adminContentStubRepository{listPostRevisions: func(context.Context, string, string, int, int) (*domain.AdminContentPostRevisionListResult, error) {
				return nil, errors.New("revision list failed")
			}},
			run: func() error { _, err := ListAdminContentPostRevisions(ctx, admin, "en", postID, nil, nil); return err },
		},
		{name: "content update requires authentication", run: func() error {
			_, err := UpdateAdminContentPostContent(ctx, nil, domain.AdminContentPostContentInput{})
			return err
		}},
		{name: "content update rejects unsupported locale", run: func() error {
			_, err := UpdateAdminContentPostContent(ctx, admin, domain.AdminContentPostContentInput{Locale: "fr", ID: postID, Content: "body"})
			return err
		}},
		{name: "content update rejects invalid id", run: func() error {
			_, err := UpdateAdminContentPostContent(ctx, admin, domain.AdminContentPostContentInput{Locale: "en", ID: "bad id", Content: "body"})
			return err
		}},
		{name: "content update rejects empty body", run: func() error {
			_, err := UpdateAdminContentPostContent(ctx, admin, domain.AdminContentPostContentInput{Locale: "en", ID: postID})
			return err
		}},
		{name: "content update rejects oversized body", run: func() error {
			_, err := UpdateAdminContentPostContent(ctx, admin, domain.AdminContentPostContentInput{Locale: "en", ID: postID, Content: tooLongContent})
			return err
		}},
		{name: "content update rejects missing post", run: func() error {
			_, err := UpdateAdminContentPostContent(ctx, admin, domain.AdminContentPostContentInput{Locale: "en", ID: postID, Content: "body"})
			return err
		}},
		{
			name: "content update maps repository error",
			repository: adminContentStubRepository{findPostByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentPostRecord, error) {
				return nil, errors.New("load failed")
			}},
			run: func() error {
				_, err := UpdateAdminContentPostContent(ctx, admin, domain.AdminContentPostContentInput{Locale: "en", ID: postID, Content: "body"})
				return err
			},
		},
		{
			name:       "content update only accepts blog posts",
			repository: existingAdminContentPostRepository("medium"),
			run: func() error {
				_, err := UpdateAdminContentPostContent(ctx, admin, domain.AdminContentPostContentInput{Locale: "en", ID: postID, Content: "body"})
				return err
			},
		},
		{name: "restore requires authentication", run: func() error {
			_, err := RestoreAdminContentPostRevision(ctx, nil, "en", postID, "revision-1")
			return err
		}},
		{name: "restore rejects unsupported locale", run: func() error {
			_, err := RestoreAdminContentPostRevision(ctx, admin, "fr", postID, "revision-1")
			return err
		}},
		{name: "restore rejects invalid post id", run: func() error {
			_, err := RestoreAdminContentPostRevision(ctx, admin, "en", "bad id", "revision-1")
			return err
		}},
		{name: "restore requires revision id", run: func() error { _, err := RestoreAdminContentPostRevision(ctx, admin, "en", postID, " "); return err }},
		{name: "restore rejects missing post", run: func() error {
			_, err := RestoreAdminContentPostRevision(ctx, admin, "en", postID, "revision-1")
			return err
		}},
		{name: "delete requires authentication", run: func() error { return DeleteAdminContentPost(ctx, nil, "en", postID) }},
		{name: "delete rejects unsupported locale", run: func() error { return DeleteAdminContentPost(ctx, admin, "fr", postID) }},
		{name: "delete rejects invalid post id", run: func() error { return DeleteAdminContentPost(ctx, admin, "en", "bad id") }},
		{name: "delete rejects missing post", run: func() error { return DeleteAdminContentPost(ctx, admin, "en", postID) }},
	}
	assertAdminContentPostErrorCases(t, cases)
}

func TestAdminContentPostMetadataHandlesValidationAndRepositoryErrors(t *testing.T) {
	ctx := context.Background()
	admin := &domain.AdminUser{ID: "admin-1"}
	baseInput := domain.AdminContentPostMetadataInput{Locale: "en", ID: "alpha-post"}
	title := ""
	cases := []adminContentPostErrorCase{
		{name: "metadata requires authentication", run: func() error { _, err := UpdateAdminContentPostMetadata(ctx, nil, baseInput); return err }},
		{name: "metadata rejects unsupported locale", run: func() error {
			_, err := UpdateAdminContentPostMetadata(ctx, admin, domain.AdminContentPostMetadataInput{ID: "alpha-post"})
			return err
		}},
		{name: "metadata rejects invalid post id", run: func() error {
			_, err := UpdateAdminContentPostMetadata(ctx, admin, domain.AdminContentPostMetadataInput{Locale: "en", ID: "bad id"})
			return err
		}},
		{name: "metadata rejects missing post", run: func() error { _, err := UpdateAdminContentPostMetadata(ctx, admin, baseInput); return err }},
		{
			name: "metadata maps post lookup error",
			repository: adminContentStubRepository{findPostByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentPostRecord, error) {
				return nil, errors.New("load failed")
			}},
			run: func() error { _, err := UpdateAdminContentPostMetadata(ctx, admin, baseInput); return err },
		},
		{
			name:       "metadata validates title",
			repository: existingAdminContentPostRepository("blog"),
			run: func() error {
				input := baseInput
				input.Title = &title
				_, err := UpdateAdminContentPostMetadata(ctx, admin, input)
				return err
			},
		},
		{
			name:       "metadata rejects invalid category id",
			repository: existingAdminContentPostRepository("blog"),
			run: func() error {
				input := baseInput
				input.CategoryID = "bad id"
				_, err := UpdateAdminContentPostMetadata(ctx, admin, input)
				return err
			},
		},
		{
			name: "metadata maps category lookup error",
			repository: adminContentStubRepository{
				findPostByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentPostRecord, error) {
					return &domain.AdminContentPostRecord{ID: "alpha-post", Title: "Alpha"}, nil
				},
				findCategoryByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentCategoryRecord, error) {
					return nil, errors.New("category lookup failed")
				},
			},
			run: func() error {
				_, err := UpdateAdminContentPostMetadata(ctx, admin, domain.AdminContentPostMetadataInput{Locale: "en", ID: "alpha-post", CategoryID: "tech"})
				return err
			},
		},
		{
			name: "metadata maps topic lookup error",
			repository: adminContentStubRepository{
				findPostByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentPostRecord, error) {
					return &domain.AdminContentPostRecord{ID: "alpha-post", Title: "Alpha"}, nil
				},
				findTopicByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentTopicRecord, error) {
					return nil, errors.New("topic lookup failed")
				},
			},
			run: func() error {
				_, err := UpdateAdminContentPostMetadata(ctx, admin, domain.AdminContentPostMetadataInput{Locale: "en", ID: "alpha-post", TopicIDs: []string{"sports"}})
				return err
			},
		},
		{
			name: "metadata maps revision creation error",
			repository: adminContentStubRepository{
				findPostByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentPostRecord, error) {
					return &domain.AdminContentPostRecord{ID: "alpha-post", Title: "Alpha"}, nil
				},
				createPostRevision: func(context.Context, domain.AdminContentPostRecord, int, time.Time) (*domain.AdminContentPostRevisionRecord, error) {
					return nil, errors.New("revision create failed")
				},
			},
			run: func() error {
				input := baseInput
				input.Title = stringPointer("Changed")
				_, err := UpdateAdminContentPostMetadata(ctx, admin, input)
				return err
			},
		},
	}
	assertAdminContentPostErrorCases(t, cases)
}

func TestAdminContentPostRevisionAndDeleteRepositoryErrors(t *testing.T) {
	ctx := context.Background()
	admin := &domain.AdminUser{ID: "admin-1"}
	cases := []adminContentPostErrorCase{
		{
			name: "restore maps post lookup error",
			repository: adminContentStubRepository{findPostByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentPostRecord, error) {
				return nil, errors.New("post lookup failed")
			}},
			run: func() error {
				_, err := RestoreAdminContentPostRevision(ctx, admin, "en", "alpha-post", "revision-1")
				return err
			},
		},
		{
			name: "restore maps revision lookup error",
			repository: adminContentStubRepository{
				findPostByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentPostRecord, error) {
					return &domain.AdminContentPostRecord{ID: "alpha-post"}, nil
				},
				findPostRevisionByID: func(context.Context, string, string, string) (*domain.AdminContentPostRevisionRecord, error) {
					return nil, errors.New("revision lookup failed")
				},
			},
			run: func() error {
				_, err := RestoreAdminContentPostRevision(ctx, admin, "en", "alpha-post", "revision-1")
				return err
			},
		},
		{
			name: "restore maps revision creation error",
			repository: adminContentStubRepository{
				findPostByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentPostRecord, error) {
					return &domain.AdminContentPostRecord{ID: "alpha-post"}, nil
				},
				findPostRevisionByID: func(context.Context, string, string, string) (*domain.AdminContentPostRevisionRecord, error) {
					return &domain.AdminContentPostRevisionRecord{ID: "revision-1"}, nil
				},
				createPostRevision: func(context.Context, domain.AdminContentPostRecord, int, time.Time) (*domain.AdminContentPostRevisionRecord, error) {
					return nil, errors.New("revision create failed")
				},
			},
			run: func() error {
				_, err := RestoreAdminContentPostRevision(ctx, admin, "en", "alpha-post", "revision-1")
				return err
			},
		},
		{
			name: "delete maps post lookup error",
			repository: adminContentStubRepository{findPostByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentPostRecord, error) {
				return nil, errors.New("post lookup failed")
			}},
			run: func() error { return DeleteAdminContentPost(ctx, admin, "en", "alpha-post") },
		},
		{
			name: "delete maps repository error",
			repository: adminContentStubRepository{
				findPostByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentPostRecord, error) {
					return &domain.AdminContentPostRecord{ID: "alpha-post"}, nil
				},
				deletePostByLocaleAndID: func(context.Context, string, string) (bool, error) {
					return false, errors.New("delete failed")
				},
			},
			run: func() error { return DeleteAdminContentPost(ctx, admin, "en", "alpha-post") },
		},
		{
			name: "delete rejects stale record",
			repository: adminContentStubRepository{
				findPostByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentPostRecord, error) {
					return &domain.AdminContentPostRecord{ID: "alpha-post"}, nil
				},
				deletePostByLocaleAndID: func(context.Context, string, string) (bool, error) { return false, nil },
			},
			run: func() error { return DeleteAdminContentPost(ctx, admin, "en", "alpha-post") },
		},
	}
	assertAdminContentPostErrorCases(t, cases)
}

func existingAdminContentPostRepository(source string) adminContentStubRepository {
	return adminContentStubRepository{
		findPostByLocaleAndID: func(_ context.Context, locale, postID string) (*domain.AdminContentPostRecord, error) {
			return &domain.AdminContentPostRecord{Locale: locale, ID: postID, Title: "Alpha", Content: "body", Source: source}, nil
		},
	}
}

func assertAdminContentPostErrorCases(t *testing.T, cases []adminContentPostErrorCase) {
	t.Helper()
	previousRepository := adminContentRepository
	t.Cleanup(func() { adminContentRepository = previousRepository })
	for _, testCase := range cases {
		t.Run(testCase.name, func(t *testing.T) {
			adminContentRepository = testCase.repository
			if err := testCase.run(); err == nil {
				t.Fatal("expected operation to return an error")
			}
		})
	}
}
