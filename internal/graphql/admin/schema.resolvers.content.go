package admingraphql

import (
	"context"
	"strings"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/graphql/admin/model"
	appscalars "suaybsimsek.com/blog-api/pkg/graphql/scalars"
)

// ContentPostRevisions is the resolver for the contentPostRevisions field.
func (*adminQueryResolver) ContentPostRevisions(
	ctx context.Context,
	input model.AdminContentEntityKeyInput,
	page *int,
	size *int,
) (*model.AdminContentPostRevisionListPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	payload, err := listAdminContentPostRevisionsFn(
		ctx,
		adminUser,
		normalizeAdminLocale(input.Locale),
		strings.TrimSpace(input.ID),
		page,
		size,
	)
	if err != nil {
		return nil, err
	}

	return mapAdminContentPostRevisionListPayload(payload), nil
}

// ContentPosts is the resolver for the contentPosts field.
func (*adminQueryResolver) ContentPosts( // NOSONAR
	ctx context.Context,
	filter *model.AdminContentPostFilterInput,
) (*model.AdminContentPostListPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	resolvedFilter := domain.AdminContentPostFilter{}
	if filter != nil {
		if filter.Locale != nil {
			resolvedFilter.Locale = normalizeAdminLocalePointer(filter.Locale)
		}
		if filter.PreferredLocale != nil {
			resolvedFilter.PreferredLocale = normalizeAdminLocalePointer(filter.PreferredLocale)
		}
		if filter.Source != nil {
			resolvedFilter.Source = mapAdminContentSourceInput(*filter.Source)
		}
		if filter.Query != nil {
			resolvedFilter.Query = strings.TrimSpace(*filter.Query)
		}
		if filter.CategoryID != nil {
			resolvedFilter.CategoryID = strings.TrimSpace(*filter.CategoryID)
		}
		if filter.TopicID != nil {
			resolvedFilter.TopicID = strings.TrimSpace(*filter.TopicID)
		}
		if filter.Page != nil {
			resolvedFilter.Page = filter.Page
		}
		if filter.Size != nil {
			resolvedFilter.Size = filter.Size
		}
	}

	payload, err := listAdminContentPostsFn(ctx, adminUser, resolvedFilter)
	if err != nil {
		return nil, err
	}

	return mapAdminContentPostListPayload(payload), nil
}

// ContentPost is the resolver for the contentPost field.
func (*adminQueryResolver) ContentPost(
	ctx context.Context,
	input model.AdminContentEntityKeyInput,
) (*model.AdminContentPost, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	record, err := getAdminContentPostFn(
		ctx,
		adminUser,
		normalizeAdminLocale(input.Locale),
		strings.TrimSpace(input.ID),
	)
	if err != nil {
		return nil, err
	}

	return mapAdminContentPost(record), nil
}

// ContentTopicsPage is the resolver for the contentTopicsPage field.
func (*adminQueryResolver) ContentTopicsPage(
	ctx context.Context,
	filter *model.AdminContentTaxonomyFilterInput,
) (*model.AdminContentTopicListPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	resolvedFilter := domain.AdminContentTaxonomyFilter{}
	if filter != nil {
		if filter.Locale != nil {
			resolvedFilter.Locale = normalizeAdminLocalePointer(filter.Locale)
		}
		if filter.PreferredLocale != nil {
			resolvedFilter.PreferredLocale = normalizeAdminLocalePointer(filter.PreferredLocale)
		}
		if filter.Query != nil {
			resolvedFilter.Query = strings.TrimSpace(*filter.Query)
		}
		if filter.Page != nil {
			resolvedFilter.Page = filter.Page
		}
		if filter.Size != nil {
			resolvedFilter.Size = filter.Size
		}
	}

	payload, err := listAdminContentTopicsPageFn(ctx, adminUser, resolvedFilter)
	if err != nil {
		return nil, err
	}

	return mapAdminContentTopicListPayload(payload), nil
}

// ContentCategoriesPage is the resolver for the contentCategoriesPage field.
func (*adminQueryResolver) ContentCategoriesPage(
	ctx context.Context,
	filter *model.AdminContentTaxonomyFilterInput,
) (*model.AdminContentCategoryListPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	resolvedFilter := domain.AdminContentTaxonomyFilter{}
	if filter != nil {
		if filter.Locale != nil {
			resolvedFilter.Locale = normalizeAdminLocalePointer(filter.Locale)
		}
		if filter.PreferredLocale != nil {
			resolvedFilter.PreferredLocale = normalizeAdminLocalePointer(filter.PreferredLocale)
		}
		if filter.Query != nil {
			resolvedFilter.Query = strings.TrimSpace(*filter.Query)
		}
		if filter.Page != nil {
			resolvedFilter.Page = filter.Page
		}
		if filter.Size != nil {
			resolvedFilter.Size = filter.Size
		}
	}

	payload, err := listAdminContentCategoriesPageFn(ctx, adminUser, resolvedFilter)
	if err != nil {
		return nil, err
	}

	return mapAdminContentCategoryListPayload(payload), nil
}

// ContentTopics is the resolver for the contentTopics field.
func (*adminQueryResolver) ContentTopics(
	ctx context.Context,
	locale *appscalars.Locale,
	query *string,
) ([]*model.AdminContentTopic, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	resolvedLocale := normalizeAdminLocalePointer(locale)

	resolvedQuery := ""
	if query != nil {
		resolvedQuery = strings.TrimSpace(*query)
	}

	records, err := listAdminContentTopicsFn(ctx, adminUser, resolvedLocale, resolvedQuery)
	if err != nil {
		return nil, err
	}

	return mapAdminContentTopics(records), nil
}

// ContentCategories is the resolver for the contentCategories field.
func (*adminQueryResolver) ContentCategories(
	ctx context.Context,
	locale *appscalars.Locale,
) ([]*model.AdminContentCategory, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	resolvedLocale := normalizeAdminLocalePointer(locale)

	records, err := listAdminContentCategoriesFn(ctx, adminUser, resolvedLocale)
	if err != nil {
		return nil, err
	}

	return mapAdminContentCategories(records), nil
}

// MediaLibrary is the resolver for the mediaLibrary field.
func (*adminQueryResolver) MediaLibrary(
	ctx context.Context,
	filter *model.AdminMediaLibraryFilterInput,
) (*model.AdminMediaLibraryListPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	resolvedFilter := domain.AdminMediaLibraryFilter{}
	if filter != nil {
		if filter.Query != nil {
			resolvedFilter.Query = strings.TrimSpace(*filter.Query)
		}
		if filter.Kind != nil {
			resolvedFilter.Kind = strings.TrimSpace(filter.Kind.String())
		}
		if filter.Sort != nil {
			resolvedFilter.Sort = strings.TrimSpace(filter.Sort.String())
		}
		if filter.Page != nil {
			resolvedFilter.Page = *filter.Page
		}
		if filter.Size != nil {
			resolvedFilter.Size = *filter.Size
		}
	}

	records, err := listAdminMediaLibraryFn(ctx, adminUser, resolvedFilter)
	if err != nil {
		return nil, err
	}

	return &model.AdminMediaLibraryListPayload{
		Items: mapAdminMediaLibraryItems(records.Items),
		Total: records.Total,
		Page:  records.Page,
		Size:  records.Size,
	}, nil
}

// UpdateContentPostMetadata is the resolver for the updateContentPostMetadata field.
func (*adminMutationResolver) UpdateContentPostMetadata(
	ctx context.Context,
	input model.AdminUpdateContentPostMetadataInput,
) (*model.AdminContentPost, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	updated, err := updateAdminContentPostMetadataFn(ctx, adminUser, domain.AdminContentPostMetadataInput{
		Locale:        normalizeAdminLocale(input.Locale),
		ID:            strings.TrimSpace(input.ID),
		Title:         toOptionalTrimmedInputString(input.Title),
		Summary:       toOptionalTrimmedInputString(input.Summary),
		Thumbnail:     toOptionalTrimmedInputString(input.Thumbnail),
		PublishedDate: datePointerToStringPointer(input.PublishedDate),
		UpdatedDate:   datePointerToStringPointer(input.UpdatedDate),
		Status:        mapAdminContentPostStatusInput(input.Status),
		ScheduledAt:   input.ScheduledAt,
		CategoryID:    strings.TrimSpace(stringPointerValue(input.CategoryID)),
		TopicIDs:      mapAdminContentTopicIDs(input.TopicIds),
	})
	if err != nil {
		return nil, err
	}

	return mapAdminContentPost(updated), nil
}

// UpdateContentPostContent is the resolver for the updateContentPostContent field.
func (*adminMutationResolver) UpdateContentPostContent(
	ctx context.Context,
	input model.AdminUpdateContentPostContentInput,
) (*model.AdminContentPost, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	updated, err := updateAdminContentPostContentFn(ctx, adminUser, domain.AdminContentPostContentInput{
		Locale:  normalizeAdminLocale(input.Locale),
		ID:      strings.TrimSpace(input.ID),
		Content: input.Content,
	})
	if err != nil {
		return nil, err
	}

	return mapAdminContentPost(updated), nil
}

// RestoreContentPostRevision is the resolver for the restoreContentPostRevision field.
func (*adminMutationResolver) RestoreContentPostRevision(
	ctx context.Context,
	input model.AdminRestoreContentPostRevisionInput,
) (*model.AdminContentPost, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	updated, err := restoreAdminContentPostRevisionFn(
		ctx,
		adminUser,
		normalizeAdminLocale(input.Locale),
		strings.TrimSpace(input.PostID),
		strings.TrimSpace(input.RevisionID),
	)
	if err != nil {
		return nil, err
	}

	return mapAdminContentPost(updated), nil
}

// UploadMediaAsset is the resolver for the uploadMediaAsset field.
func (*adminMutationResolver) UploadMediaAsset(
	ctx context.Context,
	input model.AdminUploadMediaAssetInput,
) (*model.AdminMediaLibraryItem, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	record, err := uploadAdminMediaAssetFn(ctx, adminUser, domain.AdminMediaUploadInput{
		FileName: strings.TrimSpace(input.FileName),
		DataURL:  strings.TrimSpace(input.DataURL),
	})
	if err != nil {
		return nil, err
	}

	return mapAdminMediaLibraryItem(record), nil
}

// DeleteMediaAsset is the resolver for the deleteMediaAsset field.
func (*adminMutationResolver) DeleteMediaAsset(ctx context.Context, id string) (*model.AdminDeletePayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	if err := deleteAdminMediaAssetFn(ctx, adminUser, strings.TrimSpace(id)); err != nil {
		return nil, err
	}

	return &model.AdminDeletePayload{Success: true}, nil
}

// DeleteContentPost is the resolver for the deleteContentPost field.
func (*adminMutationResolver) DeleteContentPost(
	ctx context.Context,
	input model.AdminContentEntityKeyInput,
) (*model.AdminDeletePayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	if err := deleteAdminContentPostFn(
		ctx,
		adminUser,
		normalizeAdminLocale(input.Locale),
		strings.TrimSpace(input.ID),
	); err != nil {
		return nil, err
	}

	return &model.AdminDeletePayload{Success: true}, nil
}

// CreateContentTopic is the resolver for the createContentTopic field.
func (*adminMutationResolver) CreateContentTopic(
	ctx context.Context,
	input model.AdminContentTopicInput,
) (*model.AdminContentTopic, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	saved, err := createAdminContentTopicFn(ctx, adminUser, mapAdminContentTopicInput(input))
	if err != nil {
		return nil, err
	}

	return mapAdminContentTopic(saved), nil
}

// UpdateContentTopic is the resolver for the updateContentTopic field.
func (*adminMutationResolver) UpdateContentTopic(
	ctx context.Context,
	input model.AdminContentTopicInput,
) (*model.AdminContentTopic, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	saved, err := updateAdminContentTopicFn(ctx, adminUser, mapAdminContentTopicInput(input))
	if err != nil {
		return nil, err
	}

	return mapAdminContentTopic(saved), nil
}

// DeleteContentTopic is the resolver for the deleteContentTopic field.
func (*adminMutationResolver) DeleteContentTopic(
	ctx context.Context,
	input model.AdminContentEntityKeyInput,
) (*model.AdminDeletePayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	if err := deleteAdminContentTopicFn(
		ctx,
		adminUser,
		normalizeAdminLocale(input.Locale),
		strings.TrimSpace(input.ID),
	); err != nil {
		return nil, err
	}

	return &model.AdminDeletePayload{Success: true}, nil
}

// CreateContentCategory is the resolver for the createContentCategory field.
func (*adminMutationResolver) CreateContentCategory(
	ctx context.Context,
	input model.AdminContentCategoryInput,
) (*model.AdminContentCategory, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	saved, err := createAdminContentCategoryFn(ctx, adminUser, mapAdminContentCategoryInput(input))
	if err != nil {
		return nil, err
	}

	return mapAdminContentCategory(saved), nil
}

// UpdateContentCategory is the resolver for the updateContentCategory field.
func (*adminMutationResolver) UpdateContentCategory(
	ctx context.Context,
	input model.AdminContentCategoryInput,
) (*model.AdminContentCategory, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	saved, err := updateAdminContentCategoryFn(ctx, adminUser, mapAdminContentCategoryInput(input))
	if err != nil {
		return nil, err
	}

	return mapAdminContentCategory(saved), nil
}

// DeleteContentCategory is the resolver for the deleteContentCategory field.
func (*adminMutationResolver) DeleteContentCategory(
	ctx context.Context,
	input model.AdminContentEntityKeyInput,
) (*model.AdminDeletePayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	if err := deleteAdminContentCategoryFn(
		ctx,
		adminUser,
		normalizeAdminLocale(input.Locale),
		strings.TrimSpace(input.ID),
	); err != nil {
		return nil, err
	}

	return &model.AdminDeletePayload{Success: true}, nil
}
