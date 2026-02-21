package graph

import (
	"math"
	"sort"
	"strings"

	"suaybsimsek.com/blog-api/api/graphql/graph/model"
	postsapi "suaybsimsek.com/blog-api/internal/posts"
	topicsapi "suaybsimsek.com/blog-api/internal/topics"
)

func toOptionalString(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func toGraphQLInt(value int64) int {
	if value > math.MaxInt32 {
		return math.MaxInt32
	}
	if value < math.MinInt32 {
		return math.MinInt32
	}
	return int(value)
}

func mapEngagement(likes map[string]int64, hits map[string]int64) []*model.PostEngagement {
	if len(likes) == 0 && len(hits) == 0 {
		return []*model.PostEngagement{}
	}

	keySet := make(map[string]struct{}, len(likes)+len(hits))
	for key := range likes {
		if strings.TrimSpace(key) == "" {
			continue
		}
		keySet[key] = struct{}{}
	}
	for key := range hits {
		if strings.TrimSpace(key) == "" {
			continue
		}
		keySet[key] = struct{}{}
	}

	keys := make([]string, 0, len(keySet))
	for key := range keySet {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	engagement := make([]*model.PostEngagement, 0, len(keys))
	for _, key := range keys {
		engagement = append(engagement, &model.PostEngagement{
			PostID: key,
			Likes:  toGraphQLInt(likes[key]),
			Hits:   toGraphQLInt(hits[key]),
		})
	}

	return engagement
}

func mapTopicsFromPostTopics(topics []postsapi.TopicRecord) []*model.Topic {
	if len(topics) == 0 {
		return []*model.Topic{}
	}

	result := make([]*model.Topic, 0, len(topics))
	for _, topic := range topics {
		id := strings.TrimSpace(topic.ID)
		name := strings.TrimSpace(topic.Name)
		color := strings.TrimSpace(topic.Color)
		if id == "" || name == "" || color == "" {
			continue
		}

		result = append(result, &model.Topic{
			ID:    id,
			Name:  name,
			Color: color,
			Link:  toOptionalString(derefString(topic.Link)),
		})
	}

	return result
}

func mapTopicsFromTopicRecords(topics []topicsapi.TopicRecord) []*model.Topic {
	if len(topics) == 0 {
		return []*model.Topic{}
	}

	result := make([]*model.Topic, 0, len(topics))
	for _, topic := range topics {
		id := strings.TrimSpace(topic.ID)
		name := strings.TrimSpace(topic.Name)
		color := strings.TrimSpace(topic.Color)
		if id == "" || name == "" || color == "" {
			continue
		}

		result = append(result, &model.Topic{
			ID:    id,
			Name:  name,
			Color: color,
			Link:  toOptionalString(derefString(topic.Link)),
		})
	}

	return result
}

func mapPosts(posts []postsapi.PostRecord) []*model.Post {
	if len(posts) == 0 {
		return []*model.Post{}
	}

	result := make([]*model.Post, 0, len(posts))
	for _, post := range posts {
		id := strings.TrimSpace(post.ID)
		title := strings.TrimSpace(post.Title)
		publishedDate := strings.TrimSpace(post.PublishedDate)
		summary := strings.TrimSpace(post.Summary)
		searchText := strings.TrimSpace(post.SearchText)
		if id == "" || title == "" || publishedDate == "" || summary == "" || searchText == "" {
			continue
		}

		readingTime := post.ReadingTimeMin
		if readingTime <= 0 {
			readingTime = 1
		}

		result = append(result, &model.Post{
			ID:            id,
			Slug:          id,
			Title:         title,
			PublishedDate: publishedDate,
			UpdatedDate:   toOptionalString(derefString(post.UpdatedDate)),
			Summary:       summary,
			SearchText:    searchText,
			Thumbnail:     toOptionalString(derefString(post.Thumbnail)),
			Topics:        mapTopicsFromPostTopics(post.Topics),
			ReadingTime:   readingTime,
			Source:        toOptionalString(post.Source),
			URL:           toOptionalString(derefString(post.Link)),
		})
	}

	return result
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func mapSortOrder(value *model.SortOrder) string {
	if value == nil {
		return ""
	}

	switch *value {
	case model.SortOrderAsc:
		return "asc"
	default:
		return "desc"
	}
}

func mapSourceFilter(value *model.PostSourceFilter) string {
	if value == nil {
		return ""
	}

	switch *value {
	case model.PostSourceFilterBlog:
		return "blog"
	case model.PostSourceFilterMedium:
		return "medium"
	default:
		return "all"
	}
}

func mapReadingTime(value *model.ReadingTimeRange) string {
	if value == nil {
		return ""
	}

	switch *value {
	case model.ReadingTimeRangeMin3Max7:
		return "3-7"
	case model.ReadingTimeRangeMin8Max12:
		return "8-12"
	case model.ReadingTimeRangeMin15Plus:
		return "15+"
	default:
		return "any"
	}
}
