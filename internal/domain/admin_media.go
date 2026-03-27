package domain

import "time"

type AdminMediaLibraryFilter struct {
	Query string
	Kind  string
	Page  int
	Size  int
}

type AdminMediaLibraryListPayload struct {
	Items []AdminMediaLibraryItem
	Total int
	Page  int
	Size  int
}

type AdminMediaAssetRecord struct {
	ID          string
	Name        string
	ContentType string
	Digest      string
	SizeBytes   int
	Width       int
	Height      int
	Data        []byte
	CreatedBy   string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type AdminMediaLibraryItem struct {
	ID          string
	Kind        string
	Name        string
	Value       string
	PreviewURL  string
	ContentType string
	Width       int
	Height      int
	SizeBytes   int
	UsageCount  int
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type AdminMediaUploadInput struct {
	FileName string
	DataURL  string
}
