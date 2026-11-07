package service

import (
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
)

func TestNormalizeAdminContentPostLifecycle(t *testing.T) {
	future := time.Now().UTC().Add(time.Hour)
	past := time.Now().UTC().Add(-time.Hour)

	tests := []struct {
		name      string
		input     domain.AdminContentPostMetadataInput
		before    domain.AdminContentPostRecord
		wantState string
		wantTime  time.Time
		wantError bool
	}{
		{name: "keeps draft", before: domain.AdminContentPostRecord{Status: " DRAFT "}, wantState: domain.AdminContentPostStatusDraft},
		{name: "keeps published", before: domain.AdminContentPostRecord{Status: domain.AdminContentPostStatusPublished}, wantState: domain.AdminContentPostStatusPublished},
		{name: "scheduled future", input: domain.AdminContentPostMetadataInput{Status: stringPointer(domain.AdminContentPostStatusScheduled), ScheduledAt: &future}, wantState: domain.AdminContentPostStatusScheduled, wantTime: future},
		{name: "scheduled requires a date", input: domain.AdminContentPostMetadataInput{Status: stringPointer(domain.AdminContentPostStatusScheduled)}, wantError: true},
		{name: "scheduled date must be future", input: domain.AdminContentPostMetadataInput{Status: stringPointer(domain.AdminContentPostStatusScheduled), ScheduledAt: &past}, wantError: true},
		{name: "unknown status defaults to published", input: domain.AdminContentPostMetadataInput{Status: stringPointer("invalid")}, wantState: domain.AdminContentPostStatusPublished},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			status, scheduledAt, err := normalizeAdminContentPostLifecycle(test.input, test.before)
			if (err != nil) != test.wantError {
				t.Fatalf("normalizeAdminContentPostLifecycle() error = %v, wantError %t", err, test.wantError)
			}
			if test.wantError {
				return
			}
			if status != test.wantState || !scheduledAt.Equal(test.wantTime) {
				t.Fatalf("normalizeAdminContentPostLifecycle() = (%q, %v), want (%q, %v)", status, scheduledAt, test.wantState, test.wantTime)
			}
		})
	}
}

func TestNormalizeAdminContentPostStatusDefaultsUnknownToPublished(t *testing.T) {
	if got := normalizeAdminContentPostStatus("  dRaFt "); got != domain.AdminContentPostStatusDraft {
		t.Fatalf("draft status = %q", got)
	}
	if got := normalizeAdminContentPostStatus("scheduled"); got != domain.AdminContentPostStatusScheduled {
		t.Fatalf("scheduled status = %q", got)
	}
	if got := normalizeAdminContentPostStatus("unknown"); got != domain.AdminContentPostStatusPublished {
		t.Fatalf("unknown status = %q", got)
	}
}

func TestAdminContentMetadataChanged(t *testing.T) {
	date := time.Date(2026, time.January, 2, 3, 4, 5, 0, time.UTC)
	before := domain.AdminContentPostRecord{
		Title: "Title", Summary: "Summary", Thumbnail: "/image.webp", PublishedDate: "2026-01-01",
		UpdatedDate: "2026-01-02", Status: domain.AdminContentPostStatusDraft, ScheduledAt: date,
		CategoryID: "games", TopicIDs: []string{"sports", "anime"},
	}
	unchanged := domain.AdminContentPostMetadataFields{
		Title: " Title ", Summary: " Summary ", Thumbnail: " /image.webp ", PublishedDate: "2026-01-01",
		UpdatedDate: "2026-01-02", Status: " draft ", ScheduledAt: date,
	}
	if adminContentMetadataChanged(before, unchanged, " GAMES ", []string{" SPORTS ", "ANIME"}) {
		t.Fatal("equivalent trimmed and case-insensitive metadata should be unchanged")
	}

	tests := []struct {
		name     string
		fields   domain.AdminContentPostMetadataFields
		category string
		topics   []string
	}{
		{name: "title", fields: changedPostFields(unchanged, func(fields *domain.AdminContentPostMetadataFields) { fields.Title = "Other" })},
		{name: "summary", fields: changedPostFields(unchanged, func(fields *domain.AdminContentPostMetadataFields) { fields.Summary = "Other" })},
		{name: "thumbnail", fields: changedPostFields(unchanged, func(fields *domain.AdminContentPostMetadataFields) { fields.Thumbnail = "Other" })},
		{name: "published date", fields: changedPostFields(unchanged, func(fields *domain.AdminContentPostMetadataFields) { fields.PublishedDate = "2026-02-01" })},
		{name: "updated date", fields: changedPostFields(unchanged, func(fields *domain.AdminContentPostMetadataFields) { fields.UpdatedDate = "2026-02-02" })},
		{name: "status", fields: changedPostFields(unchanged, func(fields *domain.AdminContentPostMetadataFields) {
			fields.Status = domain.AdminContentPostStatusPublished
		})},
		{name: "schedule", fields: changedPostFields(unchanged, func(fields *domain.AdminContentPostMetadataFields) { fields.ScheduledAt = date.Add(time.Minute) })},
		{name: "category", fields: unchanged, category: "other"},
		{name: "topic count", fields: unchanged, topics: []string{"sports"}},
		{name: "topic value", fields: unchanged, topics: []string{"sports", "games"}},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			category := test.category
			if category == "" {
				category = "games"
			}
			topics := test.topics
			if topics == nil {
				topics = []string{"sports", "anime"}
			}
			if !adminContentMetadataChanged(before, test.fields, category, topics) {
				t.Fatal("expected metadata difference")
			}
		})
	}
}

func changedPostFields(
	fields domain.AdminContentPostMetadataFields,
	change func(*domain.AdminContentPostMetadataFields),
) domain.AdminContentPostMetadataFields {
	change(&fields)
	return fields
}

func stringPointer(value string) *string {
	return &value
}
