package domain

import "time"

type CommentRecord struct {
	ID              string     `json:"id" bson:"id"`
	PostID          string     `json:"postId" bson:"postId"`
	PostTitle       string     `json:"postTitle,omitempty" bson:"postTitle,omitempty"`
	ParentID        *string    `json:"parentId,omitempty" bson:"parentId,omitempty"`
	AuthorName      string     `json:"authorName" bson:"authorName"`
	AuthorAvatarURL string     `json:"authorAvatarUrl,omitempty" bson:"authorAvatarUrl,omitempty"`
	AuthorEmail     string     `json:"authorEmail" bson:"authorEmail"`
	Content         string     `json:"content" bson:"content"`
	Status          string     `json:"status" bson:"status"`
	CreatedAt       time.Time  `json:"createdAt" bson:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt" bson:"updatedAt"`
	IPHash          string     `json:"-" bson:"ipHash,omitempty"`
	UserAgentHash   string     `json:"-" bson:"userAgentHash,omitempty"`
	ModeratedAt     *time.Time `json:"moderatedAt,omitempty" bson:"moderatedAt,omitempty"`
	ModerationNote  string     `json:"moderationNote,omitempty" bson:"moderationNote,omitempty"`
}

type CommentListResult struct {
	Status   string          `json:"status"`
	PostID   string          `json:"postId,omitempty"`
	Total    int             `json:"total,omitempty"`
	Comments []CommentRecord `json:"comments,omitempty"`
}

type CommentMutationResult struct {
	Status           string         `json:"status"`
	PostID           string         `json:"postId,omitempty"`
	Comment          *CommentRecord `json:"comment,omitempty"`
	ModerationStatus string         `json:"moderationStatus,omitempty"`
}

type AdminCommentFilter struct {
	Status string
	PostID string
	Query  string
	Page   *int
	Size   *int
}

type AdminCommentListResult struct {
	Items []CommentRecord `json:"items"`
	Total int             `json:"total"`
	Page  int             `json:"page"`
	Size  int             `json:"size"`
}
