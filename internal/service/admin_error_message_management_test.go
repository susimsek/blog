package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/pkg/httpapi"
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
	if stub.err != nil {
		return nil, stub.err
	}
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

func TestListAdminErrorMessageAuditLogsReturnsRecentRecords(t *testing.T) {
	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminAuditLogRepo = previousAuditRepo
	})

	now := time.Date(2026, time.March, 22, 12, 0, 0, 0, time.UTC)
	adminAuditLogRepo = &adminErrorMessageManagementAuditStub{
		records: []domain.AdminAuditLogRecord{
			{ID: "audit-1", Resource: adminErrorMessageAuditResource, Action: "error_message_updated", CreatedAt: now},
			{ID: "audit-2", Resource: adminErrorMessageAuditResource, Action: "error_message_deleted", CreatedAt: now.Add(-time.Minute)},
		},
	}

	records, err := ListAdminErrorMessageAuditLogs(context.Background(), &domain.AdminUser{ID: "admin-1"}, 1)
	if err != nil {
		t.Fatalf("ListAdminErrorMessageAuditLogs returned error: %v", err)
	}
	if len(records) != 1 || records[0].ID != "audit-1" {
		t.Fatalf("unexpected records: %#v", records)
	}
}

func TestSaveAdminErrorMessagesPersistsRecordsAndInvalidatesCache(t *testing.T) {
	previousRepository := adminErrorMessageRepository
	t.Cleanup(func() {
		adminErrorMessageRepository = previousRepository
	})

	repo := newAdminErrorMessageManagementStubRepository(nil)
	adminErrorMessageRepository = repo

	if err := SaveAdminErrorMessages(context.Background(), []domain.ErrorMessageRecord{
		{
			Scope:   adminErrorMessageScope,
			Locale:  "en",
			Code:    "ADMIN_SAVED",
			Message: "Saved message",
		},
	}); err != nil {
		t.Fatalf("SaveAdminErrorMessages returned error: %v", err)
	}

	record, exists := repo.records[adminErrorMessageStubKey(adminErrorMessageScope, "en", "ADMIN_SAVED")]
	if !exists || record.Message != "Saved message" {
		t.Fatalf("unexpected persisted record: %#v", record)
	}

	if err := SaveAdminErrorMessages(context.Background(), nil); err != nil {
		t.Fatalf("SaveAdminErrorMessages(nil) returned error: %v", err)
	}
}

func TestNormalizeAdminErrorMessageKeyAndAuditHelpers(t *testing.T) {
	key, err := normalizeAdminErrorMessageKey(domain.AdminErrorMessageKey{
		Scope:  " ",
		Locale: " EN ",
		Code:   " admin_test ",
	})
	if err != nil {
		t.Fatalf("normalizeAdminErrorMessageKey returned error: %v", err)
	}
	if key.Scope != adminErrorMessageScope || key.Locale != "en" || key.Code != "ADMIN_TEST" {
		t.Fatalf("unexpected normalized key: %#v", key)
	}

	if _, err := normalizeAdminErrorMessageKey(domain.AdminErrorMessageKey{
		Scope:  "reader",
		Locale: "en",
		Code:   "ADMIN_TEST",
	}); err == nil {
		t.Fatal("expected invalid scope error")
	}

	if _, err := normalizeAdminErrorMessageKey(domain.AdminErrorMessageKey{
		Locale: "de",
		Code:   "ADMIN_TEST",
	}); err == nil {
		t.Fatal("expected invalid locale error")
	}

	if _, err := normalizeAdminErrorMessageKey(domain.AdminErrorMessageKey{
		Locale: "en",
		Code:   "bad-code",
	}); err == nil {
		t.Fatal("expected invalid code error")
	}

	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminAuditLogRepo = previousAuditRepo
	})

	audit := &adminErrorMessageManagementAuditStub{}
	adminAuditLogRepo = audit
	traceCtx := httpapi.WithRequestTrace(httpapi.WithRequestID(context.Background(), "req-1"), httpapi.RequestTrace{
		RemoteIP:    "203.0.113.10",
		CountryCode: "tr",
		UserAgent:   "Mozilla/5.0",
	})

	err = createAdminErrorMessageAuditLog(
		traceCtx,
		&domain.AdminUser{ID: "admin-1", Email: "admin@example.com"},
		"error_message_updated",
		domain.AdminErrorMessageKey{Scope: adminErrorMessageScope, Locale: "en", Code: "ADMIN_TEST"},
		"before",
		"after",
		adminAuditStatusSuccess,
		"",
	)
	if err != nil {
		t.Fatalf("createAdminErrorMessageAuditLog returned error: %v", err)
	}
	if len(audit.records) != 1 || audit.records[0].RequestID != "req-1" || audit.records[0].CountryCode != "TR" || audit.records[0].RemoteIP != "203.0.113.10" {
		t.Fatalf("unexpected audit records: %#v", audit.records)
	}
}

func TestAdminErrorMessageManagementErrorPaths(t *testing.T) {
	previousRepository := adminErrorMessageRepository
	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminErrorMessageRepository = previousRepository
		adminAuditLogRepo = previousAuditRepo
	})

	t.Run("requires admin authentication", func(t *testing.T) {
		key := domain.AdminErrorMessageKey{Locale: "en", Code: "ADMIN_TEST"}

		if _, err := ListAdminErrorMessages(context.Background(), nil, domain.AdminErrorMessageFilter{}); err == nil || err.Error() != "admin authentication required" {
			t.Fatalf("expected auth error for list, got %v", err)
		}
		if _, err := CreateAdminErrorMessage(context.Background(), nil, key, "value"); err == nil || err.Error() != "admin authentication required" {
			t.Fatalf("expected auth error for create, got %v", err)
		}
		if _, err := UpdateAdminErrorMessage(context.Background(), nil, key, "value"); err == nil || err.Error() != "admin authentication required" {
			t.Fatalf("expected auth error for update, got %v", err)
		}
		if err := DeleteAdminErrorMessage(context.Background(), nil, key); err == nil || err.Error() != "admin authentication required" {
			t.Fatalf("expected auth error for delete, got %v", err)
		}
		if _, err := ListAdminErrorMessageAuditLogs(context.Background(), nil, 5); err == nil || err.Error() != "admin authentication required" {
			t.Fatalf("expected auth error for audit logs, got %v", err)
		}
		if err := createAdminErrorMessageAuditLog(context.Background(), nil, "action", key, "", "", adminAuditStatusSuccess, ""); err == nil || err.Error() != "admin authentication required" {
			t.Fatalf("expected auth error for audit create, got %v", err)
		}
	})

	t.Run("maps repository failures", func(t *testing.T) {
		repo := newAdminErrorMessageManagementStubRepository(nil)
		repo.listErr = errors.New("list down")
		adminErrorMessageRepository = repo

		if _, err := ListAdminErrorMessages(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminErrorMessageFilter{}); err == nil || !strings.Contains(err.Error(), "failed to load admin error messages") {
			t.Fatalf("expected list error, got %v", err)
		}

		audit := &adminErrorMessageManagementAuditStub{err: errors.New("audit list down")}
		adminAuditLogRepo = audit
		if _, err := ListAdminErrorMessageAuditLogs(context.Background(), &domain.AdminUser{ID: "admin-1"}, 1); err == nil || !strings.Contains(err.Error(), "failed to load admin audit logs") {
			t.Fatalf("expected audit list error, got %v", err)
		}
	})

	t.Run("validates create update and delete payloads", func(t *testing.T) {
		repo := newAdminErrorMessageManagementStubRepository([]domain.ErrorMessageRecord{
			{Scope: adminErrorMessageScope, Locale: "en", Code: "ADMIN_EXISTS", Message: "Existing"},
		})
		adminErrorMessageRepository = repo
		adminAuditLogRepo = &adminErrorMessageManagementAuditStub{}
		admin := &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}

		if _, err := CreateAdminErrorMessage(context.Background(), admin, domain.AdminErrorMessageKey{Locale: "en", Code: "ADMIN_NEW"}, " "); err == nil || err.Error() != "error message is required" {
			t.Fatalf("expected create required message error, got %v", err)
		}
		if _, err := CreateAdminErrorMessage(context.Background(), admin, domain.AdminErrorMessageKey{Locale: "en", Code: "ADMIN_TOO_LONG"}, strings.Repeat("a", adminErrorMessageMaxLength+1)); err == nil || err.Error() != "error message is too long" {
			t.Fatalf("expected create too long error, got %v", err)
		}
		if _, err := CreateAdminErrorMessage(context.Background(), admin, domain.AdminErrorMessageKey{Locale: "en", Code: "ADMIN_EXISTS"}, "New value"); err == nil || err.Error() != "admin error message already exists" {
			t.Fatalf("expected duplicate create error, got %v", err)
		}

		if _, err := UpdateAdminErrorMessage(context.Background(), admin, domain.AdminErrorMessageKey{Locale: "en", Code: "ADMIN_MISSING"}, "Updated"); err == nil || err.Error() != "admin error message not found" {
			t.Fatalf("expected update missing error, got %v", err)
		}
		if _, err := UpdateAdminErrorMessage(context.Background(), admin, domain.AdminErrorMessageKey{Locale: "en", Code: "ADMIN_EXISTS"}, strings.Repeat("b", adminErrorMessageMaxLength+1)); err == nil || err.Error() != "error message is too long" {
			t.Fatalf("expected update too long error, got %v", err)
		}

		if err := DeleteAdminErrorMessage(context.Background(), admin, domain.AdminErrorMessageKey{Locale: "en", Code: "ADMIN_MISSING"}); err == nil || err.Error() != "admin error message not found" {
			t.Fatalf("expected delete missing error, got %v", err)
		}
	})

	t.Run("maps write failures", func(t *testing.T) {
		admin := &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}

		repo := newAdminErrorMessageManagementStubRepository(nil)
		repo.upsertErr = errors.New("upsert failed")
		adminErrorMessageRepository = repo
		adminAuditLogRepo = &adminErrorMessageManagementAuditStub{}
		if _, err := CreateAdminErrorMessage(context.Background(), admin, domain.AdminErrorMessageKey{Locale: "en", Code: "ADMIN_CREATE_FAIL"}, "Value"); err == nil || !strings.Contains(err.Error(), "failed to persist admin error message") {
			t.Fatalf("expected create persist error, got %v", err)
		}

		repo = newAdminErrorMessageManagementStubRepository([]domain.ErrorMessageRecord{
			{Scope: adminErrorMessageScope, Locale: "en", Code: "ADMIN_UPDATE_FAIL", Message: "Old"},
		})
		repo.upsertErr = errors.New("upsert failed")
		adminErrorMessageRepository = repo
		if _, err := UpdateAdminErrorMessage(context.Background(), admin, domain.AdminErrorMessageKey{Locale: "en", Code: "ADMIN_UPDATE_FAIL"}, "New"); err == nil || !strings.Contains(err.Error(), "failed to persist admin error message") {
			t.Fatalf("expected update persist error, got %v", err)
		}

		repo = newAdminErrorMessageManagementStubRepository([]domain.ErrorMessageRecord{
			{Scope: adminErrorMessageScope, Locale: "en", Code: "ADMIN_DELETE_FAIL", Message: "Old"},
		})
		repo.deleteErr = errors.New("delete failed")
		adminErrorMessageRepository = repo
		if err := DeleteAdminErrorMessage(context.Background(), admin, domain.AdminErrorMessageKey{Locale: "en", Code: "ADMIN_DELETE_FAIL"}); err == nil || !strings.Contains(err.Error(), "failed to delete admin error message") {
			t.Fatalf("expected delete failure, got %v", err)
		}

		adminAuditLogRepo = &adminErrorMessageManagementAuditStub{err: errors.New("audit failed")}
		adminErrorMessageRepository = newAdminErrorMessageManagementStubRepository([]domain.ErrorMessageRecord{
			{Scope: adminErrorMessageScope, Locale: "en", Code: "ADMIN_DELETE_MISSING", Message: "Old"},
		})
		if err := createAdminErrorMessageAuditLog(context.Background(), admin, "action", domain.AdminErrorMessageKey{Locale: "en", Code: "ADMIN_TEST"}, "", "", adminAuditStatusSuccess, ""); err == nil || !strings.Contains(err.Error(), "failed to persist admin audit log") {
			t.Fatalf("expected audit create failure, got %v", err)
		}
	})
}

func TestAdminErrorMessageHelpersMapAndFilterRecords(t *testing.T) {
	record := mapAdminErrorMessageRecord(domain.ErrorMessageRecord{
		Scope:   " ",
		Locale:  " EN ",
		Code:    " admin_test ",
		Message: " value ",
	})
	if record.Scope != adminErrorMessageScope || record.Locale != "en" || record.Code != "ADMIN_TEST" || record.Message != "value" {
		t.Fatalf("unexpected mapped record: %#v", record)
	}

	if matchesAdminErrorMessageFilter(record, "tr", "", "") {
		t.Fatal("expected locale filter mismatch")
	}
	if !matchesAdminErrorMessageFilter(record, "en", "ADMIN_TEST", "value") {
		t.Fatal("expected record to match full filter")
	}

	previousRepository := adminErrorMessageRepository
	t.Cleanup(func() {
		adminErrorMessageRepository = previousRepository
	})

	adminErrorMessageRepository = newAdminErrorMessageManagementStubRepository([]domain.ErrorMessageRecord{
		{Scope: adminErrorMessageScope, Locale: "en", Code: "ADMIN_TEST", Message: "Stored"},
	})
	value, err := loadCurrentAdminErrorMessageValue(context.Background(), domain.AdminErrorMessageKey{
		Scope:  adminErrorMessageScope,
		Locale: "en",
		Code:   "ADMIN_TEST",
	})
	if err != nil || value != "Stored" {
		t.Fatalf("unexpected current value: %q err=%v", value, err)
	}

	adminErrorMessageRepository = &adminErrorMessageManagementStubRepository{listErr: errors.New("list failed")}
	if _, err := loadCurrentAdminErrorMessageValue(context.Background(), domain.AdminErrorMessageKey{
		Scope:  adminErrorMessageScope,
		Locale: "en",
		Code:   "ADMIN_TEST",
	}); err == nil || !strings.Contains(err.Error(), "failed to load admin error messages") {
		t.Fatalf("expected load current value error, got %v", err)
	}
}
