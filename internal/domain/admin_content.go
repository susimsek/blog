package domain

import "time"

const (
	AdminContentPostStatusDraft     = "draft"
	AdminContentPostStatusScheduled = "scheduled"
	AdminContentPostStatusPublished = "published"
)

type AdminContentPostFilter struct {
	Locale          string
	PreferredLocale string
	Source          string
	Query           string
	CategoryID      string
	TopicID         string
	Page            *int
	Size            *int
}

type AdminContentTaxonomyFilter struct {
	Locale          string
	PreferredLocale string
	Query           string
	Page            *int
	Size            *int
}

type AdminContentPostRecord struct {
	Locale           string
	ID               string
	Title            string
	Summary          string
	Content          string
	ContentMode      string
	Thumbnail        string
	Source           string
	PublishedDate    string
	UpdatedDate      string
	CategoryID       string
	CategoryName     string
	TopicIDs         []string
	TopicNames       []string
	ReadingTimeMin   int
	Status           string
	ScheduledAt      time.Time
	PublishedAt      time.Time
	ContentUpdatedAt time.Time
	UpdatedAt        time.Time
	RevisionCount    int
	LatestRevisionAt time.Time
	ViewCount        int64
	LikeCount        int64
	CommentCount     int64
}

type AdminContentPostGroupRecord struct {
	ID        string
	Source    string
	Preferred AdminContentPostRecord
	EN        *AdminContentPostRecord
	TR        *AdminContentPostRecord
}

type AdminContentPostListResult struct {
	Items []AdminContentPostGroupRecord
	Total int
	Page  int
	Size  int
}

type AdminContentTopicListResult struct {
	Items []AdminContentTopicGroupRecord
	Total int
	Page  int
	Size  int
}

type AdminContentCategoryListResult struct {
	Items []AdminContentCategoryGroupRecord
	Total int
	Page  int
	Size  int
}

type AdminContentPostMetadataInput struct {
	Locale        string
	ID            string
	Title         *string
	Summary       *string
	Thumbnail     *string
	PublishedDate *string
	UpdatedDate   *string
	Status        *string
	ScheduledAt   *time.Time
	CategoryID    string
	TopicIDs      []string
}

type AdminContentPostMetadataFields struct {
	Title         string
	Summary       string
	Thumbnail     string
	PublishedDate string
	UpdatedDate   string
	Status        string
	ScheduledAt   time.Time
}

type AdminContentPostContentInput struct {
	Locale  string
	ID      string
	Content string
}

type AdminContentPostRevisionStamp struct {
	Number    int
	CreatedAt time.Time
}

type AdminContentPostRevisionRecord struct {
	ID               string
	Locale           string
	PostID           string
	RevisionNumber   int
	Title            string
	Summary          string
	Content          string
	ContentMode      string
	Thumbnail        string
	Source           string
	PublishedDate    string
	UpdatedDate      string
	CategoryID       string
	CategoryName     string
	TopicIDs         []string
	TopicNames       []string
	ReadingTimeMin   int
	Status           string
	ScheduledAt      time.Time
	CreatedAt        time.Time
	ContentUpdatedAt time.Time
	UpdatedAt        time.Time
}

type AdminContentPostRevisionListResult struct {
	Items []AdminContentPostRevisionRecord
	Total int
	Page  int
	Size  int
}

type AdminContentTopicRecord struct {
	Locale    string
	ID        string
	Name      string
	Color     string
	Link      string
	UpdatedAt time.Time
}

type AdminContentTopicGroupRecord struct {
	ID        string
	Preferred AdminContentTopicRecord
	EN        *AdminContentTopicRecord
	TR        *AdminContentTopicRecord
}

type AdminContentCategoryRecord struct {
	Locale    string
	ID        string
	Name      string
	Color     string
	Icon      string
	Link      string
	UpdatedAt time.Time
}

type AdminContentCategoryGroupRecord struct {
	ID        string
	Preferred AdminContentCategoryRecord
	EN        *AdminContentCategoryRecord
	TR        *AdminContentCategoryRecord
}

type AdminContentTopicInput struct {
	Locale string
	ID     string
	Name   string
	Color  string
	Link   string
}

type AdminContentCategoryInput struct {
	Locale string
	ID     string
	Name   string
	Color  string
	Icon   string
	Link   string
}
