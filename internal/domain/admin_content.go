package domain

import "time"

type AdminContentPostFilter struct {
	Locale     string
	Source     string
	Query      string
	CategoryID string
	TopicID    string
	Page       *int
	Size       *int
}

type AdminContentTaxonomyFilter struct {
	Locale string
	Query  string
	Page   *int
	Size   *int
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
	ContentUpdatedAt time.Time
	UpdatedAt        time.Time
}

type AdminContentPostListResult struct {
	Items []AdminContentPostRecord
	Total int
	Page  int
	Size  int
}

type AdminContentTopicListResult struct {
	Items []AdminContentTopicRecord
	Total int
	Page  int
	Size  int
}

type AdminContentCategoryListResult struct {
	Items []AdminContentCategoryRecord
	Total int
	Page  int
	Size  int
}

type AdminContentPostMetadataInput struct {
	Locale     string
	ID         string
	CategoryID string
	TopicIDs   []string
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

type AdminContentCategoryRecord struct {
	Locale    string
	ID        string
	Name      string
	Color     string
	Icon      string
	Link      string
	UpdatedAt time.Time
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
