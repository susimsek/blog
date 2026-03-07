package domain

import "time"

type ErrorMessageRecord struct {
	Scope     string
	Locale    string
	Code      string
	Message   string
	UpdatedAt time.Time
}
