package admingraphql

import (
	"context"
	"strings"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/graphql/admin/model"
)

// Comments is the resolver for the comments field.
func (*adminQueryResolver) Comments(
	ctx context.Context,
	filter *model.AdminCommentFilterInput,
) (*model.AdminCommentListPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	resolvedFilter := domain.AdminCommentFilter{}
	if filter != nil {
		if filter.Status != nil {
			resolvedFilter.Status = mapAdminCommentStatusInput(*filter.Status)
		}
		if filter.PostID != nil {
			resolvedFilter.PostID = strings.TrimSpace(*filter.PostID)
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

	payload, err := listAdminCommentsFn(ctx, adminUser, resolvedFilter)
	if err != nil {
		return nil, err
	}

	return mapAdminCommentListPayload(payload), nil
}

// UpdateCommentStatus is the resolver for the updateCommentStatus field.
func (*adminMutationResolver) UpdateCommentStatus(
	ctx context.Context,
	input model.AdminUpdateCommentStatusInput,
) (*model.AdminComment, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	updated, err := updateAdminCommentStatusFn(
		ctx,
		adminUser,
		strings.TrimSpace(input.CommentID),
		mapAdminCommentStatusInput(input.Status),
	)
	if err != nil {
		return nil, err
	}

	return mapAdminComment(updated), nil
}

// DeleteComment is the resolver for the deleteComment field.
func (*adminMutationResolver) DeleteComment(
	ctx context.Context,
	input model.AdminDeleteCommentInput,
) (*model.AdminDeletePayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	if err := deleteAdminCommentFn(ctx, adminUser, strings.TrimSpace(input.CommentID)); err != nil {
		return nil, err
	}

	return &model.AdminDeletePayload{Success: true}, nil
}

// BulkUpdateCommentStatus is the resolver for the bulkUpdateCommentStatus field.
func (*adminMutationResolver) BulkUpdateCommentStatus(
	ctx context.Context,
	input model.AdminBulkUpdateCommentStatusInput,
) (*model.AdminBulkCommentMutationPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	commentIDs := make([]string, 0, len(input.CommentIds))
	for _, commentID := range input.CommentIds {
		commentIDs = append(commentIDs, strings.TrimSpace(commentID))
	}

	successCount, err := bulkUpdateAdminCommentStatusFn(
		ctx,
		adminUser,
		commentIDs,
		mapAdminCommentStatusInput(input.Status),
	)
	if err != nil {
		return nil, err
	}

	return &model.AdminBulkCommentMutationPayload{SuccessCount: successCount}, nil
}

// BulkDeleteComments is the resolver for the bulkDeleteComments field.
func (*adminMutationResolver) BulkDeleteComments(
	ctx context.Context,
	input model.AdminBulkDeleteCommentsInput,
) (*model.AdminBulkCommentMutationPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	commentIDs := make([]string, 0, len(input.CommentIds))
	for _, commentID := range input.CommentIds {
		commentIDs = append(commentIDs, strings.TrimSpace(commentID))
	}

	successCount, err := bulkDeleteAdminCommentsFn(ctx, adminUser, commentIDs)
	if err != nil {
		return nil, err
	}

	return &model.AdminBulkCommentMutationPayload{SuccessCount: successCount}, nil
}
