package repository

import "time"

type adminContentPostDocument struct {
	Locale        string    `bson:"locale"`
	ID            string    `bson:"id"`
	Title         string    `bson:"title"`
	Summary       string    `bson:"summary"`
	Content       string    `bson:"content"`
	ContentMode   string    `bson:"contentMode"`
	Thumbnail     string    `bson:"thumbnail"`
	Source        string    `bson:"source"`
	PublishedAt   time.Time `bson:"publishedAt"`
	PublishedDate string    `bson:"publishedDate"`
	UpdatedDate   string    `bson:"updatedDate"`
	Category      *struct {
		ID   string `bson:"id"`
		Name string `bson:"name"`
	} `bson:"category"`
	Topics []struct {
		ID   string `bson:"id"`
		Name string `bson:"name"`
	} `bson:"topics"`
	TopicIDs         []string  `bson:"topicIds"`
	ReadingTimeMin   int       `bson:"readingTimeMin"`
	Status           string    `bson:"status"`
	ScheduledAt      time.Time `bson:"scheduledAt"`
	ContentUpdatedAt time.Time `bson:"contentUpdatedAt"`
	UpdatedAt        time.Time `bson:"updatedAt"`
	RevisionCount    int       `bson:"revisionCount"`
	LatestRevisionAt time.Time `bson:"latestRevisionAt"`
}

type adminContentPostRevisionDocument struct {
	ID             string `bson:"id"`
	Locale         string `bson:"locale"`
	PostID         string `bson:"postId"`
	RevisionNumber int    `bson:"revisionNumber"`
	Title          string `bson:"title"`
	Summary        string `bson:"summary"`
	Content        string `bson:"content"`
	ContentMode    string `bson:"contentMode"`
	Thumbnail      string `bson:"thumbnail"`
	Source         string `bson:"source"`
	PublishedDate  string `bson:"publishedDate"`
	UpdatedDate    string `bson:"updatedDate"`
	Category       *struct {
		ID   string `bson:"id"`
		Name string `bson:"name"`
	} `bson:"category"`
	Topics []struct {
		ID   string `bson:"id"`
		Name string `bson:"name"`
	} `bson:"topics"`
	TopicIDs         []string  `bson:"topicIds"`
	ReadingTimeMin   int       `bson:"readingTimeMin"`
	Status           string    `bson:"status"`
	ScheduledAt      time.Time `bson:"scheduledAt"`
	ContentUpdatedAt time.Time `bson:"contentUpdatedAt"`
	UpdatedAt        time.Time `bson:"updatedAt"`
	CreatedAt        time.Time `bson:"createdAt"`
}

type adminContentPostGroupAggregateDocument struct {
	ID       string                     `bson:"id"`
	Source   string                     `bson:"source"`
	Variants []adminContentPostDocument `bson:"variants"`
}

type adminContentTopicAggregateVariantDocument struct {
	Locale    string    `bson:"locale"`
	ID        string    `bson:"id"`
	Name      string    `bson:"name"`
	Color     string    `bson:"color"`
	Link      string    `bson:"link"`
	UpdatedAt time.Time `bson:"updatedAt"`
}

type adminContentTopicGroupAggregateDocument struct {
	ID       string                                      `bson:"id"`
	Variants []adminContentTopicAggregateVariantDocument `bson:"variants"`
}

type adminContentCategoryAggregateVariantDocument struct {
	Locale    string    `bson:"locale"`
	ID        string    `bson:"id"`
	Name      string    `bson:"name"`
	Color     string    `bson:"color"`
	Icon      string    `bson:"icon"`
	Link      string    `bson:"link"`
	UpdatedAt time.Time `bson:"updatedAt"`
}

type adminContentCategoryGroupAggregateDocument struct {
	ID       string                                         `bson:"id"`
	Variants []adminContentCategoryAggregateVariantDocument `bson:"variants"`
}
