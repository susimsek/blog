package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
)

type adminNewsletterManagementStubRepository struct {
	items        []domain.AdminNewsletterSubscriberRecord
	campaigns    []domain.AdminNewsletterCampaignRecord
	failures     []domain.AdminNewsletterDeliveryFailureRecord
	listErr      error
	campaignsErr error
	failuresErr  error
	updateErr    error
	deleteErr    error
}

func (stub *adminNewsletterManagementStubRepository) ListSubscribers(
	_ context.Context,
	filter domain.AdminNewsletterSubscriberFilter,
	page int,
	size int,
) (*domain.AdminNewsletterSubscriberListResult, error) {
	if stub.listErr != nil {
		return nil, stub.listErr
	}

	filtered := make([]domain.AdminNewsletterSubscriberRecord, 0, len(stub.items))
	for _, item := range stub.items {
		if filter.Locale != "" && item.Locale != filter.Locale {
			continue
		}
		if filter.Status != "" && item.Status != filter.Status {
			continue
		}
		filtered = append(filtered, item)
	}

	return &domain.AdminNewsletterSubscriberListResult{
		Items: filtered,
		Total: len(filtered),
		Page:  page,
		Size:  size,
	}, nil
}

func (stub *adminNewsletterManagementStubRepository) ListCampaigns(
	_ context.Context,
	filter domain.AdminNewsletterCampaignFilter,
	page int,
	size int,
) (*domain.AdminNewsletterCampaignListResult, error) {
	if stub.campaignsErr != nil {
		return nil, stub.campaignsErr
	}

	filtered := make([]domain.AdminNewsletterCampaignRecord, 0, len(stub.campaigns))
	for _, item := range stub.campaigns {
		if filter.Locale != "" && item.Locale != filter.Locale {
			continue
		}
		if filter.Status != "" && item.Status != filter.Status {
			continue
		}
		filtered = append(filtered, item)
	}

	return &domain.AdminNewsletterCampaignListResult{
		Items: filtered,
		Total: len(filtered),
		Page:  page,
		Size:  size,
	}, nil
}

func (stub *adminNewsletterManagementStubRepository) ListDeliveryFailures(
	_ context.Context,
	filter domain.AdminNewsletterDeliveryFailureFilter,
	page int,
	size int,
) (*domain.AdminNewsletterDeliveryFailureListResult, error) {
	if stub.failuresErr != nil {
		return nil, stub.failuresErr
	}

	filtered := make([]domain.AdminNewsletterDeliveryFailureRecord, 0, len(stub.failures))
	for _, item := range stub.failures {
		if filter.Locale != "" && item.Locale != filter.Locale {
			continue
		}
		if filter.ItemKey != "" && item.ItemKey != filter.ItemKey {
			continue
		}
		filtered = append(filtered, item)
	}

	return &domain.AdminNewsletterDeliveryFailureListResult{
		Items: filtered,
		Total: len(filtered),
		Page:  page,
		Size:  size,
	}, nil
}

func (stub *adminNewsletterManagementStubRepository) UpdateSubscriberStatusByEmail(
	_ context.Context,
	email string,
	status string,
	now time.Time,
) (*domain.AdminNewsletterSubscriberRecord, error) {
	if stub.updateErr != nil {
		return nil, stub.updateErr
	}

	for index, item := range stub.items {
		if item.Email != email {
			continue
		}
		item.Status = status
		item.UpdatedAt = now
		stub.items[index] = item
		return &item, nil
	}

	return nil, repository.ErrAdminNewsletterSubscriberNotFound
}

func (stub *adminNewsletterManagementStubRepository) DeleteSubscriberByEmail(
	_ context.Context,
	email string,
) (bool, error) {
	if stub.deleteErr != nil {
		return false, stub.deleteErr
	}

	next := make([]domain.AdminNewsletterSubscriberRecord, 0, len(stub.items))
	deleted := false
	for _, item := range stub.items {
		if item.Email == email {
			deleted = true
			continue
		}
		next = append(next, item)
	}
	stub.items = next

	return deleted, nil
}

func TestListAdminNewsletterSubscribersFiltersByLocaleAndStatus(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		items: []domain.AdminNewsletterSubscriberRecord{
			{Email: "active-en@example.com", Locale: "en", Status: adminNewsletterStatusActive},
			{Email: "pending-en@example.com", Locale: "en", Status: adminNewsletterStatusPending},
			{Email: "active-tr@example.com", Locale: "tr", Status: adminNewsletterStatusActive},
		},
	}

	page := 1
	size := 10
	result, err := ListAdminNewsletterSubscribers(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		domain.AdminNewsletterSubscriberFilter{
			Locale: "en",
			Status: adminNewsletterStatusActive,
			Page:   &page,
			Size:   &size,
		},
	)
	if err != nil {
		t.Fatalf("ListAdminNewsletterSubscribers returned error: %v", err)
	}

	if result.Total != 1 {
		t.Fatalf("expected total 1, got %d", result.Total)
	}
	if len(result.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(result.Items))
	}
	if result.Items[0].Email != "active-en@example.com" {
		t.Fatalf("unexpected subscriber: %s", result.Items[0].Email)
	}
}

func TestUpdateAdminNewsletterSubscriberStatusUpdatesRecord(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		items: []domain.AdminNewsletterSubscriberRecord{
			{Email: "member@example.com", Locale: "en", Status: adminNewsletterStatusPending},
		},
	}

	updated, err := UpdateAdminNewsletterSubscriberStatus(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		"member@example.com",
		adminNewsletterStatusActive,
	)
	if err != nil {
		t.Fatalf("UpdateAdminNewsletterSubscriberStatus returned error: %v", err)
	}

	if updated == nil || updated.Status != adminNewsletterStatusActive {
		t.Fatalf("expected updated status %q, got %#v", adminNewsletterStatusActive, updated)
	}
}

func TestListAdminNewsletterCampaignsFiltersByLocale(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		campaigns: []domain.AdminNewsletterCampaignRecord{
			{Locale: "en", ItemKey: "en-post", Title: "English post", Status: "sent"},
			{Locale: "tr", ItemKey: "tr-post", Title: "Turkish post", Status: "partial"},
		},
	}

	page := 1
	size := 5
	result, err := ListAdminNewsletterCampaigns(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		domain.AdminNewsletterCampaignFilter{
			Locale: "tr",
			Page:   &page,
			Size:   &size,
		},
	)
	if err != nil {
		t.Fatalf("ListAdminNewsletterCampaigns returned error: %v", err)
	}

	if result.Total != 1 {
		t.Fatalf("expected total 1, got %d", result.Total)
	}
	if len(result.Items) != 1 || result.Items[0].ItemKey != "tr-post" {
		t.Fatalf("unexpected campaign payload: %#v", result.Items)
	}
}

func TestListAdminNewsletterDeliveryFailuresRequiresCampaignIdentity(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{}

	_, err := ListAdminNewsletterDeliveryFailures(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		domain.AdminNewsletterDeliveryFailureFilter{},
	)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestDeleteAdminNewsletterSubscriberReturnsBadRequestWhenMissing(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		items: []domain.AdminNewsletterSubscriberRecord{},
	}

	err := DeleteAdminNewsletterSubscriber(context.Background(), &domain.AdminUser{ID: "admin-1"}, "missing@example.com")
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestListAdminNewsletterSubscribersReturnsServiceUnavailable(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		listErr: repository.ErrAdminNewsletterRepositoryUnavailable,
	}

	_, err := ListAdminNewsletterSubscribers(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		domain.AdminNewsletterSubscriberFilter{},
	)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestUpdateAdminNewsletterSubscriberStatusReturnsInternalOnRepoError(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		updateErr: errors.New("db down"),
	}

	_, err := UpdateAdminNewsletterSubscriberStatus(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		"member@example.com",
		adminNewsletterStatusActive,
	)
	if err == nil {
		t.Fatal("expected error")
	}
}
