package domain

import "time"

type AdminUser struct {
	ID                    string
	Name                  string
	Username              string
	AvatarURL             string
	AvatarDigest          string
	AvatarVersion         int64
	Email                 string
	PendingEmail          string
	PendingEmailExpiresAt *time.Time
	GoogleSubject         string
	GoogleEmail           string
	GoogleLinkedAt        *time.Time
	GithubSubject         string
	GithubEmail           string
	GithubLinkedAt        *time.Time
	Roles                 []string
}

type AdminUserRecord struct {
	AdminUser
	PasswordHash       string
	PasswordVersion    int64
	PendingEmailChange *AdminPendingEmailChange
}

type AdminPendingEmailChange struct {
	NewEmail    string
	TokenHash   string
	Locale      string
	RequestedAt time.Time
	ExpiresAt   time.Time
}

type AdminRefreshTokenRecord struct {
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

type AdminSessionRecord struct {
	ID          string
	UserAgent   string
	RemoteIP    string
	CountryCode string
	LastSeenAt  time.Time
	CreatedAt   time.Time
	ExpiresAt   time.Time
	Persistent  bool
}
