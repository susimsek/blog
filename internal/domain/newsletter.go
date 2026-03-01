package domain

import "time"

type NewsletterPendingSubscription struct {
	Email                 string
	Locale                string
	Tags                  []string
	FormName              string
	Source                string
	UpdatedAt             time.Time
	IPHash                string
	UserAgent             string
	ConfirmTokenHash      string
	ConfirmTokenExpiresAt time.Time
	ConfirmRequestedAt    time.Time
	CreatedAt             *time.Time
}
