package service

import (
	"context"
	"strings"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
)

func TestListAdminContentTaxonomiesReturnsRepositoryResults(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
	})

	adminContentRepository = adminContentStubRepository{
		listTopics: func(_ context.Context, locale, query string) ([]domain.AdminContentTopicRecord, error) {
			if locale != "en" || query != "alpha" {
				t.Fatalf("ListTopics args = %q %q", locale, query)
			}
			return []domain.AdminContentTopicRecord{{Locale: locale, ID: "alpha-topic", Name: "Alpha Topic"}}, nil
		},
		listTopicGroups: func(_ context.Context, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentTopicListResult, error) {
			if filter.PreferredLocale != "tr" {
				t.Fatalf("preferred locale = %q", filter.PreferredLocale)
			}
			return &domain.AdminContentTopicListResult{
				Items: []domain.AdminContentTopicGroupRecord{{ID: "alpha-topic"}},
				Total: 1,
				Page:  1,
				Size:  20,
			}, nil
		},
		listCategories: func(_ context.Context, locale string) ([]domain.AdminContentCategoryRecord, error) {
			return []domain.AdminContentCategoryRecord{{Locale: locale, ID: "alpha-category", Name: "Alpha Category"}}, nil
		},
		listCategoryGroups: func(_ context.Context, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentCategoryListResult, error) {
			return &domain.AdminContentCategoryListResult{
				Items: []domain.AdminContentCategoryGroupRecord{{ID: "alpha-category"}},
				Total: 1,
				Page:  1,
				Size:  20,
			}, nil
		},
	}

	topics, err := ListAdminContentTopics(context.Background(), &domain.AdminUser{ID: "admin-1"}, "en", "alpha")
	if err != nil || len(topics) != 1 {
		t.Fatalf("ListAdminContentTopics result = %#v, err=%v", topics, err)
	}

	topicsPage, err := ListAdminContentTopicsPage(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminContentTaxonomyFilter{
		PreferredLocale: "tr",
	})
	if err != nil || topicsPage == nil || topicsPage.Total != 1 {
		t.Fatalf("ListAdminContentTopicsPage result = %#v, err=%v", topicsPage, err)
	}

	categories, err := ListAdminContentCategories(context.Background(), &domain.AdminUser{ID: "admin-1"}, "tr")
	if err != nil || len(categories) != 1 {
		t.Fatalf("ListAdminContentCategories result = %#v, err=%v", categories, err)
	}

	categoriesPage, err := ListAdminContentCategoriesPage(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminContentTaxonomyFilter{})
	if err != nil || categoriesPage == nil || categoriesPage.Total != 1 {
		t.Fatalf("ListAdminContentCategoriesPage result = %#v, err=%v", categoriesPage, err)
	}
}

func TestAdminContentTopicWorkflowsPersistAndAudit(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
		adminAuditLogRepo = previousAuditRepo
	})

	audit := &adminErrorMessageManagementAuditStub{}
	adminAuditLogRepo = audit
	topics := map[string]domain.AdminContentTopicRecord{}
	topicKey := func(locale, id string) string { return locale + "|" + id }
	syncCalls := 0
	removeCalls := 0

	adminContentRepository = adminContentStubRepository{
		findTopicByLocaleAndID: func(_ context.Context, locale, topicID string) (*domain.AdminContentTopicRecord, error) {
			record, ok := topics[topicKey(locale, topicID)]
			if !ok {
				return nil, nil
			}
			copyRecord := record
			return &copyRecord, nil
		},
		upsertTopic: func(_ context.Context, record domain.AdminContentTopicRecord, now time.Time) (*domain.AdminContentTopicRecord, error) {
			record.UpdatedAt = now
			topics[topicKey(record.Locale, record.ID)] = record
			copyRecord := record
			return &copyRecord, nil
		},
		deleteTopicByLocaleAndID: func(_ context.Context, locale, topicID string) (bool, error) {
			delete(topics, topicKey(locale, topicID))
			return true, nil
		},
		syncTopicOnPosts: func(_ context.Context, record domain.AdminContentTopicRecord, now time.Time) error {
			if record.ID == "" || now.IsZero() {
				t.Fatalf("unexpected sync topic call: %#v %v", record, now)
			}
			syncCalls++
			return nil
		},
		removeTopicFromPosts: func(_ context.Context, locale, topicID string, now time.Time) error {
			if locale != "en" || topicID != "alpha-topic" || now.IsZero() {
				t.Fatalf("unexpected remove topic call: %q %q %v", locale, topicID, now)
			}
			removeCalls++
			return nil
		},
	}

	created, err := CreateAdminContentTopic(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, domain.AdminContentTopicInput{
		Locale: "en",
		ID:     "alpha-topic",
		Name:   "Alpha Topic",
		Color:  "#112233",
		Link:   "https://example.com/topics/alpha",
	})
	if err != nil || created == nil || created.Name != "Alpha Topic" {
		t.Fatalf("CreateAdminContentTopic result = %#v, err=%v", created, err)
	}

	updated, err := UpdateAdminContentTopic(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, domain.AdminContentTopicInput{
		Locale: "en",
		ID:     "alpha-topic",
		Name:   "Alpha Topic Updated",
		Color:  "#445566",
		Link:   "https://example.com/topics/alpha-updated",
	})
	if err != nil || updated == nil || updated.Name != "Alpha Topic Updated" {
		t.Fatalf("UpdateAdminContentTopic result = %#v, err=%v", updated, err)
	}

	if err := DeleteAdminContentTopic(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, "en", "alpha-topic"); err != nil {
		t.Fatalf("DeleteAdminContentTopic returned error: %v", err)
	}

	if syncCalls != 2 || removeCalls != 1 {
		t.Fatalf("unexpected topic sync calls: sync=%d remove=%d", syncCalls, removeCalls)
	}
	if len(audit.records) != 3 || audit.records[0].Action != "content_topic_created" || audit.records[1].Action != "content_topic_updated" || audit.records[2].Action != "content_topic_deleted" {
		t.Fatalf("unexpected audit records: %#v", audit.records)
	}
}

func TestAdminContentCategoryWorkflowsPersistAndAudit(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
		adminAuditLogRepo = previousAuditRepo
	})

	audit := &adminErrorMessageManagementAuditStub{}
	adminAuditLogRepo = audit
	categories := map[string]domain.AdminContentCategoryRecord{}
	categoryKey := func(locale, id string) string { return locale + "|" + id }
	syncCalls := 0
	clearCalls := 0

	adminContentRepository = adminContentStubRepository{
		findCategoryByLocaleAndID: func(_ context.Context, locale, categoryID string) (*domain.AdminContentCategoryRecord, error) {
			record, ok := categories[categoryKey(locale, categoryID)]
			if !ok {
				return nil, nil
			}
			copyRecord := record
			return &copyRecord, nil
		},
		upsertCategory: func(_ context.Context, record domain.AdminContentCategoryRecord, now time.Time) (*domain.AdminContentCategoryRecord, error) {
			record.UpdatedAt = now
			categories[categoryKey(record.Locale, record.ID)] = record
			copyRecord := record
			return &copyRecord, nil
		},
		deleteCategoryByLocaleAndID: func(_ context.Context, locale, categoryID string) (bool, error) {
			delete(categories, categoryKey(locale, categoryID))
			return true, nil
		},
		syncCategoryOnPosts: func(_ context.Context, record domain.AdminContentCategoryRecord, now time.Time) error {
			if record.ID == "" || now.IsZero() {
				t.Fatalf("unexpected sync category call: %#v %v", record, now)
			}
			syncCalls++
			return nil
		},
		clearCategoryFromPosts: func(_ context.Context, locale, categoryID string, now time.Time) error {
			if locale != "en" || categoryID != "alpha-category" || now.IsZero() {
				t.Fatalf("unexpected clear category call: %q %q %v", locale, categoryID, now)
			}
			clearCalls++
			return nil
		},
	}

	created, err := CreateAdminContentCategory(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, domain.AdminContentCategoryInput{
		Locale: "en",
		ID:     "alpha-category",
		Name:   "Alpha Category",
		Color:  "#112233",
		Icon:   "tag",
		Link:   "https://example.com/categories/alpha",
	})
	if err != nil || created == nil || created.Name != "Alpha Category" {
		t.Fatalf("CreateAdminContentCategory result = %#v, err=%v", created, err)
	}

	updated, err := UpdateAdminContentCategory(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, domain.AdminContentCategoryInput{
		Locale: "en",
		ID:     "alpha-category",
		Name:   "Alpha Category Updated",
		Color:  "#445566",
		Icon:   "folder",
		Link:   "https://example.com/categories/alpha-updated",
	})
	if err != nil || updated == nil || updated.Name != "Alpha Category Updated" {
		t.Fatalf("UpdateAdminContentCategory result = %#v, err=%v", updated, err)
	}

	if err := DeleteAdminContentCategory(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, "en", "alpha-category"); err != nil {
		t.Fatalf("DeleteAdminContentCategory returned error: %v", err)
	}

	if syncCalls != 2 || clearCalls != 1 {
		t.Fatalf("unexpected category sync calls: sync=%d clear=%d", syncCalls, clearCalls)
	}
	if len(audit.records) != 3 || audit.records[0].Action != "content_category_created" || audit.records[1].Action != "content_category_updated" || audit.records[2].Action != "content_category_deleted" {
		t.Fatalf("unexpected audit records: %#v", audit.records)
	}
}

func TestAdminContentTopicAndCategorySyncFailures(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
	})

	adminUser := &domain.AdminUser{ID: "admin-1"}

	t.Run("topic sync failure", func(t *testing.T) {
		adminContentRepository = adminContentStubRepository{
			findTopicByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentTopicRecord, error) {
				return nil, nil
			},
			upsertTopic: func(_ context.Context, record domain.AdminContentTopicRecord, now time.Time) (*domain.AdminContentTopicRecord, error) {
				record.UpdatedAt = now
				return &record, nil
			},
			syncTopicOnPosts: func(context.Context, domain.AdminContentTopicRecord, time.Time) error {
				return repository.ErrAdminContentRepositoryUnavailable
			},
		}

		_, err := CreateAdminContentTopic(context.Background(), adminUser, domain.AdminContentTopicInput{
			Locale: "en",
			ID:     "alpha-topic",
			Name:   "Alpha Topic",
			Color:  "#112233",
		})
		if err == nil || !strings.Contains(err.Error(), "admin content management is unavailable") {
			t.Fatalf("expected topic sync failure mapping, got %v", err)
		}
	})

	t.Run("category sync failure", func(t *testing.T) {
		adminContentRepository = adminContentStubRepository{
			findCategoryByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentCategoryRecord, error) {
				return nil, nil
			},
			upsertCategory: func(_ context.Context, record domain.AdminContentCategoryRecord, now time.Time) (*domain.AdminContentCategoryRecord, error) {
				record.UpdatedAt = now
				return &record, nil
			},
			syncCategoryOnPosts: func(context.Context, domain.AdminContentCategoryRecord, time.Time) error {
				return repository.ErrAdminContentRepositoryUnavailable
			},
		}

		_, err := CreateAdminContentCategory(context.Background(), adminUser, domain.AdminContentCategoryInput{
			Locale: "en",
			ID:     "alpha-category",
			Name:   "Alpha Category",
			Color:  "#112233",
		})
		if err == nil || !strings.Contains(err.Error(), "admin content management is unavailable") {
			t.Fatalf("expected category sync failure mapping, got %v", err)
		}
	})
}

func TestNormalizeAdminContentTopicInputSanitizesValues(t *testing.T) {
	record, err := normalizeAdminContentTopicInput(domain.AdminContentTopicInput{
		Locale: " EN ",
		ID:     " Alpha-Topic ",
		Name:   " Alpha Topic ",
		Color:  " #00FF00 ",
		Link:   " https://example.com/topics/alpha ",
	})
	if err != nil {
		t.Fatalf("normalizeAdminContentTopicInput returned error: %v", err)
	}

	if record.Locale != "en" || record.ID != "alpha-topic" || record.Name != "Alpha Topic" || record.Color != "#00ff00" {
		t.Fatalf("unexpected record: %#v", record)
	}
	if record.Link != "https://example.com/topics/alpha" {
		t.Fatalf("unexpected link: %q", record.Link)
	}
}

func TestNormalizeAdminContentCategoryInputRejectsLongIcon(t *testing.T) {
	_, err := normalizeAdminContentCategoryInput(domain.AdminContentCategoryInput{
		Locale: "en",
		ID:     "alpha-category",
		Name:   "Alpha Category",
		Color:  "#abcdef",
		Icon:   string(make([]byte, adminContentIconMaxLength+1)),
	})
	if err == nil {
		t.Fatal("expected icon length validation error")
	}
}
