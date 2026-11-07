package admingraphql

import (
	"context"
	"errors"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/graphql/admin/model"
	appscalars "suaybsimsek.com/blog-api/pkg/graphql/scalars"
)

func TestAdminContentPostRevisionResolvers(t *testing.T) {
	originalList := listAdminContentPostRevisionsFn
	originalRestore := restoreAdminContentPostRevisionFn
	t.Cleanup(func() {
		listAdminContentPostRevisionsFn = originalList
		restoreAdminContentPostRevisionFn = originalRestore
	})

	adminUser := &domain.AdminUser{ID: "admin-1"}
	ctx := WithAdminUser(context.Background(), adminUser)
	query := &adminQueryResolver{Resolver: &Resolver{}}
	mutation := &adminMutationResolver{Resolver: &Resolver{}}

	listErr := errors.New("revision list failed")
	listAdminContentPostRevisionsFn = func(_ context.Context, user *domain.AdminUser, locale, postID string, page, size *int) (*domain.AdminContentPostRevisionListResult, error) {
		if user != adminUser || locale != "tr" || postID != "post-1" || page == nil || *page != 2 || size == nil || *size != 5 {
			t.Fatalf("unexpected revision list arguments: %#v %q %q %v %v", user, locale, postID, page, size)
		}
		return &domain.AdminContentPostRevisionListResult{
			Items: []domain.AdminContentPostRevisionRecord{{
				ID: "revision-1", Locale: "tr", PostID: postID, RevisionNumber: 3,
				Title: "Revision", Content: "Body", ContentMode: "markdown",
				PublishedDate: "2026-11-06", Status: domain.AdminContentPostStatusDraft,
			}},
			Total: 1, Page: 2, Size: 5,
		}, nil
	}

	page, size := 2, 5
	result, err := query.ContentPostRevisions(ctx, model.AdminContentEntityKeyInput{Locale: appscalars.Locale("TR"), ID: " post-1 "}, &page, &size)
	if err != nil || result == nil || result.Total != 1 || len(result.Items) != 1 {
		t.Fatalf("ContentPostRevisions() = %#v, %v", result, err)
	}
	if result.Items[0].ID != "revision-1" || result.Items[0].Locale != "tr" || result.Items[0].RevisionNumber != 3 || result.Items[0].Status != model.AdminContentPostStatusDraft {
		t.Fatalf("unexpected mapped revision: %#v", result.Items[0])
	}

	listAdminContentPostRevisionsFn = func(context.Context, *domain.AdminUser, string, string, *int, *int) (*domain.AdminContentPostRevisionListResult, error) {
		return nil, listErr
	}
	if _, err := query.ContentPostRevisions(ctx, model.AdminContentEntityKeyInput{}, nil, nil); !errors.Is(err, listErr) {
		t.Fatalf("ContentPostRevisions() error = %v, want %v", err, listErr)
	}
	if _, err := query.ContentPostRevisions(context.Background(), model.AdminContentEntityKeyInput{}, nil, nil); err == nil {
		t.Fatal("ContentPostRevisions() expected admin authentication error")
	}

	restoreErr := errors.New("revision restore failed")
	called := false
	restoreAdminContentPostRevisionFn = func(_ context.Context, user *domain.AdminUser, locale, postID, revisionID string) (*domain.AdminContentPostRecord, error) {
		called = true
		if user != adminUser || locale != "tr" || postID != "post-1" || revisionID != "revision-1" {
			t.Fatalf("unexpected revision restore arguments: %#v %q %q %q", user, locale, postID, revisionID)
		}
		return &domain.AdminContentPostRecord{Locale: locale, ID: postID, Title: "Restored", PublishedDate: "2026-11-06", Status: domain.AdminContentPostStatusPublished}, nil
	}
	restored, err := mutation.RestoreContentPostRevision(ctx, model.AdminRestoreContentPostRevisionInput{
		Locale: "TR", PostID: " post-1 ", RevisionID: " revision-1 ",
	})
	if err != nil || !called || restored == nil || restored.Title != "Restored" {
		t.Fatalf("RestoreContentPostRevision() = %#v, %v; called=%v", restored, err, called)
	}
	restoreAdminContentPostRevisionFn = func(context.Context, *domain.AdminUser, string, string, string) (*domain.AdminContentPostRecord, error) {
		return nil, restoreErr
	}
	if _, err := mutation.RestoreContentPostRevision(ctx, model.AdminRestoreContentPostRevisionInput{}); !errors.Is(err, restoreErr) {
		t.Fatalf("RestoreContentPostRevision() error = %v, want %v", err, restoreErr)
	}
	if _, err := mutation.RestoreContentPostRevision(context.Background(), model.AdminRestoreContentPostRevisionInput{}); err == nil {
		t.Fatal("RestoreContentPostRevision() expected admin authentication error")
	}
}

func TestAdminMediaLibraryResolver(t *testing.T) {
	originalList := listAdminMediaLibraryFn
	t.Cleanup(func() { listAdminMediaLibraryFn = originalList })

	adminUser := &domain.AdminUser{ID: "admin-1"}
	ctx := WithAdminUser(context.Background(), adminUser)
	queryResolver := &adminQueryResolver{Resolver: &Resolver{}}
	queryText := "  logo  "
	kind := model.AdminMediaLibraryItemKindUploaded
	sort := model.AdminMediaLibrarySortName
	page, size := 3, 12
	listErr := errors.New("media list failed")
	listAdminMediaLibraryFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminMediaLibraryFilter) (*domain.AdminMediaLibraryListPayload, error) {
		if user != adminUser || filter.Query != "logo" || filter.Kind != "UPLOADED" || filter.Sort != "NAME" || filter.Page != page || filter.Size != size {
			t.Fatalf("unexpected media library filter: %#v", filter)
		}
		return &domain.AdminMediaLibraryListPayload{
			Items: []domain.AdminMediaLibraryItem{{ID: "asset-1", Kind: " uploaded ", Name: " logo.png ", Value: " /logo.png ", PreviewURL: " /preview.png ", ContentType: "image/png", Width: 640, Height: 480, SizeBytes: 123, UsageCount: 2}},
			Total: 1, Page: page, Size: size,
		}, nil
	}
	result, err := queryResolver.MediaLibrary(ctx, &model.AdminMediaLibraryFilterInput{
		Query: &queryText, Kind: &kind, Sort: &sort, Page: &page, Size: &size,
	})
	if err != nil || result == nil || result.Total != 1 || result.Page != page || len(result.Items) != 1 {
		t.Fatalf("MediaLibrary() = %#v, %v", result, err)
	}
	item := result.Items[0]
	if item.ID != "asset-1" || item.Kind != model.AdminMediaLibraryItemKindUploaded || item.Name != "logo.png" || item.ContentType == nil || *item.ContentType != "image/png" {
		t.Fatalf("unexpected mapped media item: %#v", item)
	}

	listAdminMediaLibraryFn = func(_ context.Context, _ *domain.AdminUser, filter domain.AdminMediaLibraryFilter) (*domain.AdminMediaLibraryListPayload, error) {
		if filter != (domain.AdminMediaLibraryFilter{}) {
			t.Fatalf("nil filter should map to zero values, got %#v", filter)
		}
		return &domain.AdminMediaLibraryListPayload{}, nil
	}
	empty, err := queryResolver.MediaLibrary(ctx, nil)
	if err != nil || empty == nil || empty.Items == nil || len(empty.Items) != 0 {
		t.Fatalf("MediaLibrary(nil) = %#v, %v", empty, err)
	}
	listAdminMediaLibraryFn = func(context.Context, *domain.AdminUser, domain.AdminMediaLibraryFilter) (*domain.AdminMediaLibraryListPayload, error) {
		return nil, listErr
	}
	if _, err := queryResolver.MediaLibrary(ctx, nil); !errors.Is(err, listErr) {
		t.Fatalf("MediaLibrary() error = %v, want %v", err, listErr)
	}
	if _, err := queryResolver.MediaLibrary(context.Background(), nil); err == nil {
		t.Fatal("MediaLibrary() expected admin authentication error")
	}
}

type adminMediaAssetResolverFixture struct {
	adminUser *domain.AdminUser
	ctx       context.Context
	mutation  *adminMutationResolver
	input     model.AdminUploadMediaAssetInput
	asset     *domain.AdminMediaLibraryItem
	err       error
}

func newAdminMediaAssetResolverFixture(t *testing.T) adminMediaAssetResolverFixture {
	t.Helper()
	originalUpload := uploadAdminMediaAssetFn
	originalReplace := replaceAdminMediaAssetFn
	originalDelete := deleteAdminMediaAssetFn
	t.Cleanup(func() {
		uploadAdminMediaAssetFn = originalUpload
		replaceAdminMediaAssetFn = originalReplace
		deleteAdminMediaAssetFn = originalDelete
	})

	adminUser := &domain.AdminUser{ID: "admin-1"}
	return adminMediaAssetResolverFixture{
		adminUser: adminUser,
		ctx:       WithAdminUser(context.Background(), adminUser),
		mutation:  &adminMutationResolver{Resolver: &Resolver{}},
		input:     model.AdminUploadMediaAssetInput{FileName: " image.png ", DataURL: " data:image/png;base64,AA== "},
		asset:     &domain.AdminMediaLibraryItem{ID: "asset-1", Kind: "UPLOADED", Name: "image.png", CreatedAt: time.Now()},
		err:       errors.New("media mutation failed"),
	}
}

func TestAdminMediaAssetUploadResolver(t *testing.T) {
	fixture := newAdminMediaAssetResolverFixture(t)
	uploadAdminMediaAssetFn = func(_ context.Context, user *domain.AdminUser, got domain.AdminMediaUploadInput) (*domain.AdminMediaLibraryItem, error) {
		if user != fixture.adminUser || got.FileName != "image.png" || got.DataURL != "data:image/png;base64,AA==" {
			t.Fatalf("unexpected upload arguments: %#v %#v", user, got)
		}
		return fixture.asset, nil
	}
	if got, err := fixture.mutation.UploadMediaAsset(fixture.ctx, fixture.input); err != nil || got == nil || got.ID != fixture.asset.ID {
		t.Fatalf("UploadMediaAsset() = %#v, %v", got, err)
	}
	uploadAdminMediaAssetFn = func(context.Context, *domain.AdminUser, domain.AdminMediaUploadInput) (*domain.AdminMediaLibraryItem, error) {
		return nil, fixture.err
	}
	if _, err := fixture.mutation.UploadMediaAsset(fixture.ctx, fixture.input); !errors.Is(err, fixture.err) {
		t.Fatalf("UploadMediaAsset() error = %v, want %v", err, fixture.err)
	}
	if _, err := fixture.mutation.UploadMediaAsset(context.Background(), fixture.input); err == nil {
		t.Fatal("UploadMediaAsset() expected admin authentication error")
	}
}

func TestAdminMediaAssetReplaceResolver(t *testing.T) {
	fixture := newAdminMediaAssetResolverFixture(t)
	replaceAdminMediaAssetFn = func(_ context.Context, user *domain.AdminUser, id string, got domain.AdminMediaUploadInput) (*domain.AdminMediaLibraryItem, error) {
		if user != fixture.adminUser || id != "asset-1" || got.FileName != "image.png" || got.DataURL != "data:image/png;base64,AA==" {
			t.Fatalf("unexpected replace arguments: %#v %q %#v", user, id, got)
		}
		return fixture.asset, nil
	}
	if got, err := fixture.mutation.ReplaceMediaAsset(fixture.ctx, " asset-1 ", fixture.input); err != nil || got == nil || got.ID != fixture.asset.ID {
		t.Fatalf("ReplaceMediaAsset() = %#v, %v", got, err)
	}
	replaceAdminMediaAssetFn = func(context.Context, *domain.AdminUser, string, domain.AdminMediaUploadInput) (*domain.AdminMediaLibraryItem, error) {
		return nil, fixture.err
	}
	if _, err := fixture.mutation.ReplaceMediaAsset(fixture.ctx, "asset-1", fixture.input); !errors.Is(err, fixture.err) {
		t.Fatalf("ReplaceMediaAsset() error = %v, want %v", err, fixture.err)
	}
	if _, err := fixture.mutation.ReplaceMediaAsset(context.Background(), "asset-1", fixture.input); err == nil {
		t.Fatal("ReplaceMediaAsset() expected admin authentication error")
	}
}

func TestAdminMediaAssetDeleteResolver(t *testing.T) {
	fixture := newAdminMediaAssetResolverFixture(t)
	deleteAdminMediaAssetFn = func(_ context.Context, user *domain.AdminUser, id string) error {
		if user != fixture.adminUser || id != "asset-1" {
			t.Fatalf("unexpected delete arguments: %#v %q", user, id)
		}
		return nil
	}
	if got, err := fixture.mutation.DeleteMediaAsset(fixture.ctx, " asset-1 "); err != nil || got == nil || !got.Success {
		t.Fatalf("DeleteMediaAsset() = %#v, %v", got, err)
	}
	deleteAdminMediaAssetFn = func(context.Context, *domain.AdminUser, string) error { return fixture.err }
	if _, err := fixture.mutation.DeleteMediaAsset(fixture.ctx, "asset-1"); !errors.Is(err, fixture.err) {
		t.Fatalf("DeleteMediaAsset() error = %v, want %v", err, fixture.err)
	}
	if _, err := fixture.mutation.DeleteMediaAsset(context.Background(), "asset-1"); err == nil {
		t.Fatal("DeleteMediaAsset() expected admin authentication error")
	}
}

func TestAdminContentAndMediaMappingNilAndReferenceCases(t *testing.T) {
	if got := mapAdminContentPostRevisionListPayload(nil); got == nil || got.Items == nil || got.Total != 0 || got.Page != 1 {
		t.Fatalf("nil revision payload mapping = %#v", got)
	}
	if mapAdminContentPostRevision(nil) != nil {
		t.Fatal("nil revision should map to nil")
	}
	if got := mapAdminMediaLibraryItems(nil); got == nil || len(got) != 0 {
		t.Fatalf("empty media mapping = %#v", got)
	}
	if mapAdminMediaLibraryItem(nil) != nil {
		t.Fatal("nil media item should map to nil")
	}
	reference := mapAdminMediaLibraryItem(&domain.AdminMediaLibraryItem{ID: " reference-1 ", Kind: "unknown", Name: " ref ", Value: " /image.png ", PreviewURL: " /preview.png "})
	if reference.ID != "reference-1" || reference.Kind != model.AdminMediaLibraryItemKindReference || reference.Name != "ref" || reference.Value != "/image.png" {
		t.Fatalf("unexpected reference mapping: %#v", reference)
	}
}
