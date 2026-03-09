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
