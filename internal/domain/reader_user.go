package domain

import "time"

type ReaderUser struct {
	ID                string
	Name              string
	Email             string
	AvatarURL         string
	LastLoginProvider string
	GoogleSubject     string
	GoogleEmail       string
	GoogleLinkedAt    *time.Time
	GithubSubject     string
	GithubEmail       string
	GithubLinkedAt    *time.Time
}

type ReaderUserRecord struct {
	ReaderUser
	SessionVersion int64
}

type ReaderRefreshTokenRecord struct {
	JTI         string
	UserID      string
	TokenHash   string
	Persistent  bool
	UserAgent   string
	RemoteIP    string
	CountryCode string
	LastSeenAt  time.Time
	ExpiresAt   time.Time
	CreatedAt   time.Time
	RotatedAt   *time.Time
	RevokedAt   *time.Time
	ReplacedBy  string
}
