package admingraphql

import (
	"context"
	"strings"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/graphql/admin/model"
	"suaybsimsek.com/blog-api/pkg/apperrors"
)

// ErrorMessages is the resolver for the errorMessages field.
func (*adminQueryResolver) ErrorMessages(
	ctx context.Context,
	filter *model.AdminErrorMessageFilterInput,
) (*model.AdminErrorMessageListPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	resolvedFilter := domain.AdminErrorMessageFilter{}
	if filter != nil {
		if filter.Locale != nil {
			resolvedFilter.Locale = normalizeAdminLocalePointer(filter.Locale)
		}
		if filter.Code != nil {
			resolvedFilter.Code = strings.TrimSpace(*filter.Code)
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

	payload, err := listAdminErrorMessagesFn(ctx, adminUser, resolvedFilter)
	if err != nil {
		return nil, err
	}

	return mapAdminErrorMessageListPayload(payload), nil
}

// ErrorMessageAuditLogs is the resolver for the errorMessageAuditLogs field.
func (*adminQueryResolver) ErrorMessageAuditLogs(
	ctx context.Context,
	limit *int,
) ([]*model.AdminErrorMessageAuditLog, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	resolvedLimit := 0
	if limit != nil {
		resolvedLimit = *limit
	}

	records, err := listAdminErrorMessageAuditLogsFn(ctx, adminUser, resolvedLimit)
	if err != nil {
		return nil, err
	}

	return mapAdminAuditLogs(records), nil
}

// CreateErrorMessage is the resolver for the createErrorMessage field.
func (*adminMutationResolver) CreateErrorMessage(
	ctx context.Context,
	input model.AdminCreateErrorMessageInput,
) (*model.AdminErrorMessage, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}
	if input.Key == nil {
		return nil, apperrors.BadRequest("error message key is required")
	}

	saved, err := createAdminErrorMessageFn(
		ctx,
		adminUser,
		mapAdminErrorMessageKey(*input.Key),
		input.Message,
	)
	if err != nil {
		return nil, err
	}

	return mapAdminErrorMessage(saved), nil
}

// UpdateErrorMessage is the resolver for the updateErrorMessage field.
func (*adminMutationResolver) UpdateErrorMessage(
	ctx context.Context,
	input model.AdminUpdateErrorMessageInput,
) (*model.AdminErrorMessage, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}
	if input.Key == nil {
		return nil, apperrors.BadRequest("error message key is required")
	}

	updated, err := updateAdminErrorMessageFn(
		ctx,
		adminUser,
		mapAdminErrorMessageKey(*input.Key),
		input.Message,
	)
	if err != nil {
		return nil, err
	}

	return mapAdminErrorMessage(updated), nil
}

// DeleteErrorMessage is the resolver for the deleteErrorMessage field.
func (*adminMutationResolver) DeleteErrorMessage(
	ctx context.Context,
	input model.AdminErrorMessageKeyInput,
) (*model.AdminDeletePayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	if err := deleteAdminErrorMessageFn(ctx, adminUser, mapAdminErrorMessageKey(input)); err != nil {
		return nil, err
	}

	return &model.AdminDeletePayload{Success: true}, nil
}
