package domain

import "time"

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
	PublishedAt      time.Time
	ContentUpdatedAt time.Time
	UpdatedAt        time.Time
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
	CategoryID    string
	TopicIDs      []string
}

type AdminContentPostMetadataFields struct {
	Title         string
	Summary       string
	Thumbnail     string
	PublishedDate string
	UpdatedDate   string
}

type AdminContentPostContentInput struct {
	Locale  string
	ID      string
	Content string
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
