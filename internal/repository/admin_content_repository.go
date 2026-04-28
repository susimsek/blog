package repository

import (
	"context"
	"errors"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
)

var (
	ErrAdminContentRepositoryUnavailable = errors.New("admin content repository unavailable")
	ErrAdminContentPostNotFound          = errors.New("admin content post not found")
	ErrAdminContentTopicNotFound         = errors.New("admin content topic not found")
	ErrAdminContentCategoryNotFound      = errors.New("admin content category not found")
)

const adminContentRepositoryUnavailableFormat = "%w: %v"

const (
	adminContentLocaleEN        = "en"
	adminContentLocaleTR        = "tr"
	mongoStageLimit             = "$limit"
	mongoStageMatch             = "$match"
	mongoStageProject           = "$project"
	mongoStageGroup             = "$group"
	mongoFieldSource            = "$source"
	mongoFieldFirst             = "$first"
	mongoFieldLocale            = "$locale"
	mongoFieldUpdatedAt         = "$updatedAt"
	mongoTrNameField            = "$trName"
	mongoEnNameField            = "$enName"
	adminContentCategoryIDField = "category.id"
)

type AdminContentRepository interface {
	ListPostGroups(ctx context.Context, filter domain.AdminContentPostFilter) (*domain.AdminContentPostListResult, error)
	ListAllPosts(ctx context.Context, filter domain.AdminContentPostFilter) ([]domain.AdminContentPostRecord, error)
	FindPostByLocaleAndID(ctx context.Context, locale, postID string) (*domain.AdminContentPostRecord, error)
	ListPostRevisions(
		ctx context.Context,
		locale string,
		postID string,
		page int,
		size int,
	) (*domain.AdminContentPostRevisionListResult, error)
	FindPostRevisionByID(ctx context.Context, locale, postID, revisionID string) (*domain.AdminContentPostRevisionRecord, error)
	CreatePostRevision(
		ctx context.Context,
		record domain.AdminContentPostRecord,
		revisionNumber int,
		now time.Time,
	) (*domain.AdminContentPostRevisionRecord, error)
	UpdatePostMetadata(
		ctx context.Context,
		locale string,
		postID string,
		fields domain.AdminContentPostMetadataFields,
		category *domain.AdminContentCategoryRecord,
		topics []domain.AdminContentTopicRecord,
		revisionStamp *domain.AdminContentPostRevisionStamp,
		now time.Time,
	) (*domain.AdminContentPostRecord, error)
	UpdatePostContent(
		ctx context.Context,
		locale string,
		postID string,
		content string,
		revisionStamp *domain.AdminContentPostRevisionStamp,
		now time.Time,
	) (*domain.AdminContentPostRecord, error)
	RestorePostRevision(
		ctx context.Context,
		revision domain.AdminContentPostRevisionRecord,
		revisionStamp *domain.AdminContentPostRevisionStamp,
		now time.Time,
	) (*domain.AdminContentPostRecord, error)
	DeletePostByLocaleAndID(ctx context.Context, locale, postID string) (bool, error)
	ListTopics(ctx context.Context, locale, query string) ([]domain.AdminContentTopicRecord, error)
	ListTopicGroups(ctx context.Context, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentTopicListResult, error)
	ListAllTopics(ctx context.Context, filter domain.AdminContentTaxonomyFilter) ([]domain.AdminContentTopicRecord, error)
	FindTopicByLocaleAndID(ctx context.Context, locale, topicID string) (*domain.AdminContentTopicRecord, error)
	UpsertTopic(ctx context.Context, record domain.AdminContentTopicRecord, now time.Time) (*domain.AdminContentTopicRecord, error)
	DeleteTopicByLocaleAndID(ctx context.Context, locale, topicID string) (bool, error)
	SyncTopicOnPosts(ctx context.Context, record domain.AdminContentTopicRecord, now time.Time) error
	RemoveTopicFromPosts(ctx context.Context, locale, topicID string, now time.Time) error
	ListCategories(ctx context.Context, locale string) ([]domain.AdminContentCategoryRecord, error)
	ListCategoryGroups(ctx context.Context, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentCategoryListResult, error)
	ListAllCategories(ctx context.Context, filter domain.AdminContentTaxonomyFilter) ([]domain.AdminContentCategoryRecord, error)
	FindCategoryByLocaleAndID(ctx context.Context, locale, categoryID string) (*domain.AdminContentCategoryRecord, error)
	UpsertCategory(
		ctx context.Context,
		record domain.AdminContentCategoryRecord,
		now time.Time,
	) (*domain.AdminContentCategoryRecord, error)
	DeleteCategoryByLocaleAndID(ctx context.Context, locale, categoryID string) (bool, error)
	SyncCategoryOnPosts(ctx context.Context, record domain.AdminContentCategoryRecord, now time.Time) error
	ClearCategoryFromPosts(ctx context.Context, locale, categoryID string, now time.Time) error
}

type adminContentMongoRepository struct{}

func NewAdminContentRepository() AdminContentRepository { return &adminContentMongoRepository{} }
