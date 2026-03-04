package domain

import "time"

type AdminUser struct {
	ID       string
	Username string
	Email    string
	Roles    []string
}

type AdminUserRecord struct {
	AdminUser
	PasswordHash    string
	PasswordVersion int64
}

type AdminRefreshTokenRecord struct {
	JTI        string
	UserID     string
	TokenHash  string
	Persistent bool
	ExpiresAt  time.Time
	CreatedAt  time.Time
	RotatedAt  *time.Time
	RevokedAt  *time.Time
	ReplacedBy string
}
