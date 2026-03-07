package domain

import "time"

type AdminAvatarVariant struct {
	Size        int
	ContentType string
	Data        []byte
}

type AdminAvatarSource struct {
	ContentType string
	Data        []byte
}

type AdminAvatarRecord struct {
	UserID    string
	Digest    string
	Version   int64
	Source    AdminAvatarSource
	Variants  []AdminAvatarVariant
	UpdatedAt time.Time
}
