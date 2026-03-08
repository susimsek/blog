package domain

import "time"

type AdminErrorMessageKey struct {
	Scope  string
	Locale string
	Code   string
}

type AdminErrorMessageDraftRecord struct {
	AdminErrorMessageKey
	Message   string
	UpdatedBy string
	UpdatedAt time.Time
}

type AdminErrorMessageView struct {
	AdminErrorMessageKey
	Message   string
	UpdatedAt time.Time
}

type AdminErrorMessageFilter struct {
	Locale string
	Code   string
	Query  string
}

type AdminErrorMessageListResult struct {
	Items []AdminErrorMessageView
	Total int
}

type AdminAuditLogRecord struct {
	ID          string
	ActorID     string
	ActorEmail  string
	Action      string
	Resource    string
	Scope       string
	Locale      string
	Code        string
	BeforeValue string
	AfterValue  string
	Status      string
	FailureCode string
	RequestID   string
	RemoteIP    string
	CountryCode string
	UserAgent   string
	CreatedAt   time.Time
}
