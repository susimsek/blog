package domain

import "time"

type AdminNewsletterSubscriberRecord struct {
	Email          string
	Locale         string
	Status         string
	Tags           []string
	FormName       string
	Source         string
	UpdatedAt      time.Time
	CreatedAt      time.Time
	ConfirmedAt    *time.Time
	UnsubscribedAt *time.Time
}

type AdminNewsletterSubscriberFilter struct {
	Locale string
	Status string
	Query  string
	Page   *int
	Size   *int
}

type AdminNewsletterSubscriberListResult struct {
	Items []AdminNewsletterSubscriberRecord
	Total int
	Page  int
	Size  int
}

type AdminNewsletterCampaignRecord struct {
	Locale      string
	ItemKey     string
	Title       string
	Summary     string
	Link        string
	PubDate     string
	RSSURL      string
	Status      string
	SentCount   int
	FailedCount int
	LastRunAt   time.Time
	UpdatedAt   time.Time
	CreatedAt   time.Time
}

type AdminNewsletterCampaignFilter struct {
	Locale string
	Status string
	Query  string
	Page   *int
	Size   *int
}

type AdminNewsletterCampaignListResult struct {
	Items []AdminNewsletterCampaignRecord
	Total int
	Page  int
	Size  int
}

type AdminNewsletterDeliveryFailureRecord struct {
	Locale        string
	ItemKey       string
	Email         string
	Status        string
	LastError     string
	LastAttemptAt time.Time
	UpdatedAt     time.Time
	CreatedAt     time.Time
}

type AdminNewsletterDeliveryFailureFilter struct {
	Locale  string
	ItemKey string
	Page    *int
	Size    *int
}

type AdminNewsletterDeliveryFailureListResult struct {
	Items []AdminNewsletterDeliveryFailureRecord
	Total int
	Page  int
	Size  int
}

type AdminNewsletterDispatchLocaleResult struct {
	Locale      string
	RSSURL      string
	ItemKey     string
	PostTitle   string
	SentCount   int
	FailedCount int
	Skipped     bool
	Reason      string
}

type AdminNewsletterDispatchResult struct {
	Success   bool
	Message   string
	Timestamp time.Time
	Results   []AdminNewsletterDispatchLocaleResult
}

type AdminNewsletterTestSendResult struct {
	Success   bool
	Message   string
	Timestamp time.Time
	Email     string
	Locale    string
	ItemKey   string
	PostTitle string
}
