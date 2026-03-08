package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
)

type adminErrorMessageManagementStubRepository struct {
	records   map[string]domain.ErrorMessageRecord
	listErr   error
	upsertErr error
	deleteErr error
}

func newAdminErrorMessageManagementStubRepository(seed []domain.ErrorMessageRecord) *adminErrorMessageManagementStubRepository {
	records := make(map[string]domain.ErrorMessageRecord, len(seed))
	for _, record := range seed {
		records[adminErrorMessageStubKey(record.Scope, record.Locale, record.Code)] = record
	}

	return &adminErrorMessageManagementStubRepository{
		records: records,
	}
}

func (stub *adminErrorMessageManagementStubRepository) ListByScope(
	_ context.Context,
	scope string,
) ([]domain.ErrorMessageRecord, error) {
	if stub.listErr != nil {
		return nil, stub.listErr
	}

	items := make([]domain.ErrorMessageRecord, 0, len(stub.records))
	for _, record := range stub.records {
		if record.Scope == scope {
			items = append(items, record)
		}
	}
	return items, nil
}

func (stub *adminErrorMessageManagementStubRepository) UpsertMany(
	_ context.Context,
	records []domain.ErrorMessageRecord,
) error {
	if stub.upsertErr != nil {
		return stub.upsertErr
	}

	for _, record := range records {
		stub.records[adminErrorMessageStubKey(record.Scope, record.Locale, record.Code)] = record
	}
	return nil
}

func (stub *adminErrorMessageManagementStubRepository) DeleteByKey(
	_ context.Context,
	scope,
	locale,
	code string,
) (bool, error) {
	if stub.deleteErr != nil {
		return false, stub.deleteErr
	}

	key := adminErrorMessageStubKey(scope, locale, code)
	if _, exists := stub.records[key]; !exists {
		return false, nil
	}

	delete(stub.records, key)
	return true, nil
}

type adminErrorMessageManagementAuditStub struct {
	records []domain.AdminAuditLogRecord
	err     error
}

func (stub *adminErrorMessageManagementAuditStub) Create(_ context.Context, record domain.AdminAuditLogRecord) error {
	if stub.err != nil {
		return stub.err
	}

	stub.records = append(stub.records, record)
	return nil
}

func (stub *adminErrorMessageManagementAuditStub) ListRecentByResource(
	_ context.Context,
	_ string,
	limit int,
) ([]domain.AdminAuditLogRecord, error) {
	if limit <= 0 || limit >= len(stub.records) {
		return append([]domain.AdminAuditLogRecord(nil), stub.records...), nil
	}
	return append([]domain.AdminAuditLogRecord(nil), stub.records[:limit]...), nil
}

func adminErrorMessageStubKey(scope, locale, code string) string {
	return scope + "|" + locale + "|" + code
}

func TestListAdminErrorMessagesAppliesFilterAndPagination(t *testing.T) {
	previousRepository := adminErrorMessageRepository
	t.Cleanup(func() {
		adminErrorMessageRepository = previousRepository
	})

	adminErrorMessageRepository = newAdminErrorMessageManagementStubRepository([]domain.ErrorMessageRecord{
		{Scope: adminErrorMessageScope, Locale: "en", Code: "ADMIN_AUTH_REQUIRED", Message: "Your session expired."},
		{Scope: adminErrorMessageScope, Locale: "en", Code: "ADMIN_AVATAR_INVALID", Message: "Invalid avatar file."},
		{Scope: adminErrorMessageScope, Locale: "en", Code: "ADMIN_AVATAR_TOO_LARGE", Message: "Avatar is too large."},
		{Scope: adminErrorMessageScope, Locale: "tr", Code: "ADMIN_AVATAR_INVALID", Message: "Geçersiz görsel."},
	})

	page := 2
	size := 1
	result, err := ListAdminErrorMessages(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		domain.AdminErrorMessageFilter{
			Locale: "en",
			Query:  "avatar",
			Page:   &page,
			Size:   &size,
		},
	)
	if err != nil {
		t.Fatalf("ListAdminErrorMessages returned error: %v", err)
	}

	if result.Total != 2 {
		t.Fatalf("expected total 2, got %d", result.Total)
	}
	if result.Page != 2 {
		t.Fatalf("expected page 2, got %d", result.Page)
	}
	if result.Size != 1 {
		t.Fatalf("expected size 1, got %d", result.Size)
	}
	if len(result.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(result.Items))
	}
	if result.Items[0].Code != "ADMIN_AVATAR_TOO_LARGE" {
		t.Fatalf("expected ADMIN_AVATAR_TOO_LARGE, got %s", result.Items[0].Code)
	}
}

func TestCreateAdminErrorMessagePersistsAndAudits(t *testing.T) {
	previousRepository := adminErrorMessageRepository
	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminErrorMessageRepository = previousRepository
		adminAuditLogRepo = previousAuditRepo
	})

	repo := newAdminErrorMessageManagementStubRepository(nil)
	audit := &adminErrorMessageManagementAuditStub{}
	adminErrorMessageRepository = repo
	adminAuditLogRepo = audit

	saved, err := CreateAdminErrorMessage(
		context.Background(),
		&domain.AdminUser{
			ID:    "admin-1",
			Email: "admin@example.com",
		},
		domain.AdminErrorMessageKey{
			Scope:  adminErrorMessageScope,
			Locale: "en",
			Code:   "ADMIN_NEW_ERROR",
		},
		"New admin message",
	)
	if err != nil {
		t.Fatalf("CreateAdminErrorMessage returned error: %v", err)
	}

	if saved == nil || saved.Message != "New admin message" {
		t.Fatalf("unexpected saved payload: %#v", saved)
	}

	record, exists := repo.records[adminErrorMessageStubKey(adminErrorMessageScope, "en", "ADMIN_NEW_ERROR")]
	if !exists {
		t.Fatalf("expected record to be persisted")
	}
	if record.Message != "New admin message" {
		t.Fatalf("expected persisted message to match, got %q", record.Message)
	}

	if len(audit.records) != 1 {
		t.Fatalf("expected 1 audit record, got %d", len(audit.records))
	}
	if audit.records[0].Action != "error_message_created" {
		t.Fatalf("expected create audit action, got %q", audit.records[0].Action)
	}
}

func TestUpdateAdminErrorMessagePersistsAndAudits(t *testing.T) {
	previousRepository := adminErrorMessageRepository
	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminErrorMessageRepository = previousRepository
		adminAuditLogRepo = previousAuditRepo
	})

	repo := newAdminErrorMessageManagementStubRepository([]domain.ErrorMessageRecord{
		{
			Scope:     adminErrorMessageScope,
			Locale:    "en",
			Code:      "ADMIN_UPDATE_ME",
			Message:   "Old value",
			UpdatedAt: time.Now().UTC().Add(-1 * time.Hour),
		},
	})
	audit := &adminErrorMessageManagementAuditStub{}
	adminErrorMessageRepository = repo
	adminAuditLogRepo = audit

	updated, err := UpdateAdminErrorMessage(
		context.Background(),
		&domain.AdminUser{
			ID:    "admin-1",
			Email: "admin@example.com",
		},
		domain.AdminErrorMessageKey{
			Scope:  adminErrorMessageScope,
			Locale: "en",
			Code:   "ADMIN_UPDATE_ME",
		},
		"Updated value",
	)
	if err != nil {
		t.Fatalf("UpdateAdminErrorMessage returned error: %v", err)
	}

	if updated == nil || updated.Message != "Updated value" {
		t.Fatalf("unexpected updated payload: %#v", updated)
	}

	record := repo.records[adminErrorMessageStubKey(adminErrorMessageScope, "en", "ADMIN_UPDATE_ME")]
	if record.Message != "Updated value" {
		t.Fatalf("expected persisted message to match, got %q", record.Message)
	}

	if len(audit.records) != 1 {
		t.Fatalf("expected 1 audit record, got %d", len(audit.records))
	}
	if audit.records[0].Action != "error_message_updated" {
		t.Fatalf("expected update audit action, got %q", audit.records[0].Action)
	}
	if audit.records[0].BeforeValue != "Old value" {
		t.Fatalf("expected before value to be tracked, got %q", audit.records[0].BeforeValue)
	}
}

func TestDeleteAdminErrorMessageRemovesAndAudits(t *testing.T) {
	previousRepository := adminErrorMessageRepository
	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminErrorMessageRepository = previousRepository
		adminAuditLogRepo = previousAuditRepo
	})

	repo := newAdminErrorMessageManagementStubRepository([]domain.ErrorMessageRecord{
		{
			Scope:   adminErrorMessageScope,
			Locale:  "tr",
			Code:    "ADMIN_DELETE_ME",
			Message: "Silinecek",
		},
	})
	audit := &adminErrorMessageManagementAuditStub{}
	adminErrorMessageRepository = repo
	adminAuditLogRepo = audit

	err := DeleteAdminErrorMessage(
		context.Background(),
		&domain.AdminUser{
			ID:    "admin-1",
			Email: "admin@example.com",
		},
		domain.AdminErrorMessageKey{
			Scope:  adminErrorMessageScope,
			Locale: "tr",
			Code:   "ADMIN_DELETE_ME",
		},
	)
	if err != nil {
		t.Fatalf("DeleteAdminErrorMessage returned error: %v", err)
	}

	if _, exists := repo.records[adminErrorMessageStubKey(adminErrorMessageScope, "tr", "ADMIN_DELETE_ME")]; exists {
		t.Fatalf("expected message to be removed")
	}

	if len(audit.records) != 1 {
		t.Fatalf("expected 1 audit record, got %d", len(audit.records))
	}
	if audit.records[0].Action != "error_message_deleted" {
		t.Fatalf("expected delete audit action, got %q", audit.records[0].Action)
	}
}

func TestCreateAdminErrorMessageReturnsInternalOnAuditFailure(t *testing.T) {
	previousRepository := adminErrorMessageRepository
	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminErrorMessageRepository = previousRepository
		adminAuditLogRepo = previousAuditRepo
	})

	repo := newAdminErrorMessageManagementStubRepository(nil)
	audit := &adminErrorMessageManagementAuditStub{
		err: errors.New("audit failed"),
	}
	adminErrorMessageRepository = repo
	adminAuditLogRepo = audit

	_, err := CreateAdminErrorMessage(
		context.Background(),
		&domain.AdminUser{
			ID:    "admin-1",
			Email: "admin@example.com",
		},
		domain.AdminErrorMessageKey{
			Scope:  adminErrorMessageScope,
			Locale: "en",
			Code:   "ADMIN_AUDIT_ERROR",
		},
		"Value",
	)
	if err == nil {
		t.Fatalf("expected error")
	}
}
