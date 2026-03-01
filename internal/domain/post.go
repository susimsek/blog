package domain

import "time"

type PostTopic struct {
	ID    string  `json:"id" bson:"id"`
	Name  string  `json:"name" bson:"name"`
	Color string  `json:"color" bson:"color"`
	Link  *string `json:"link,omitempty" bson:"link,omitempty"`
}

type PostCategory struct {
	ID    string `json:"id" bson:"id"`
	Name  string `json:"name" bson:"name"`
	Color string `json:"color" bson:"color"`
	Icon  string `json:"icon,omitempty" bson:"icon,omitempty"`
}

type PostRecord struct {
	ID             string        `json:"id" bson:"id"`
	Title          string        `json:"title" bson:"title"`
	Category       *PostCategory `json:"category,omitempty" bson:"category,omitempty"`
	PublishedDate  string        `json:"publishedDate" bson:"publishedDate"`
	UpdatedDate    *string       `json:"updatedDate,omitempty" bson:"updatedDate,omitempty"`
	Summary        string        `json:"summary" bson:"summary"`
	SearchText     string        `json:"searchText" bson:"searchText"`
	Thumbnail      *string       `json:"thumbnail" bson:"thumbnail,omitempty"`
	Topics         []PostTopic   `json:"topics,omitempty" bson:"topics,omitempty"`
	TopicIDs       []string      `json:"-" bson:"topicIds,omitempty"`
	ReadingTimeMin int           `json:"readingTimeMin" bson:"readingTimeMin"`
	Source         string        `json:"source,omitempty" bson:"source,omitempty"`
	Link           *string       `json:"link,omitempty" bson:"link,omitempty"`
	PublishedAt    time.Time     `json:"-" bson:"publishedAt,omitempty"`
}

type PostContentResponse struct {
	Status string `json:"status"`

	Locale string `json:"locale,omitempty"`

	Posts []PostRecord `json:"posts,omitempty"`
	Total int          `json:"total,omitempty"`
	Page  int          `json:"page,omitempty"`
	Size  int          `json:"size,omitempty"`
	Sort  string       `json:"sort,omitempty"`

	PostID        string           `json:"postId,omitempty"`
	Likes         int64            `json:"likes,omitempty"`
	LikesByPostID map[string]int64 `json:"likesByPostId,omitempty"`
	Hits          int64            `json:"hits,omitempty"`
	HitsByPostID  map[string]int64 `json:"hitsByPostId,omitempty"`
}
