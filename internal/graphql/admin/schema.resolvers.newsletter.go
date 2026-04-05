package admingraphql

import (
	"context"
	"strings"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/graphql/admin/model"
)

// NewsletterSubscribers is the resolver for the newsletterSubscribers field.
func (*adminQueryResolver) NewsletterSubscribers(
	ctx context.Context,
	filter *model.AdminNewsletterSubscriberFilterInput,
) (*model.AdminNewsletterSubscriberListPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	resolvedFilter := domain.AdminNewsletterSubscriberFilter{}
	if filter != nil {
		if filter.Locale != nil {
			resolvedFilter.Locale = normalizeAdminLocalePointer(filter.Locale)
		}
		if filter.Status != nil {
			resolvedFilter.Status = mapAdminNewsletterStatusInput(*filter.Status)
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

	payload, err := listAdminNewsletterSubscribersFn(ctx, adminUser, resolvedFilter)
	if err != nil {
		return nil, err
	}

	return mapAdminNewsletterSubscriberListPayload(payload), nil
}

// NewsletterCampaigns is the resolver for the newsletterCampaigns field.
func (*adminQueryResolver) NewsletterCampaigns(
	ctx context.Context,
	filter *model.AdminNewsletterCampaignFilterInput,
) (*model.AdminNewsletterCampaignListPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	resolvedFilter := domain.AdminNewsletterCampaignFilter{}
	if filter != nil {
		if filter.Locale != nil {
			resolvedFilter.Locale = normalizeAdminLocalePointer(filter.Locale)
		}
		if filter.Status != nil {
			resolvedFilter.Status = mapAdminNewsletterCampaignStatusInput(*filter.Status)
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

	payload, err := listAdminNewsletterCampaignsFn(ctx, adminUser, resolvedFilter)
	if err != nil {
		return nil, err
	}

	return mapAdminNewsletterCampaignListPayload(payload), nil
}

// NewsletterCampaignFailures is the resolver for the newsletterCampaignFailures field.
func (*adminQueryResolver) NewsletterCampaignFailures(
	ctx context.Context,
	filter model.AdminNewsletterDeliveryFailureFilterInput,
) (*model.AdminNewsletterDeliveryFailureListPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	resolvedFilter := domain.AdminNewsletterDeliveryFailureFilter{
		Locale:  normalizeAdminLocale(filter.Locale),
		ItemKey: strings.TrimSpace(filter.ItemKey),
	}
	if filter.Page != nil {
		resolvedFilter.Page = filter.Page
	}
	if filter.Size != nil {
		resolvedFilter.Size = filter.Size
	}

	payload, err := listAdminNewsletterDeliveryFailuresFn(ctx, adminUser, resolvedFilter)
	if err != nil {
		return nil, err
	}

	return mapAdminNewsletterDeliveryFailureListPayload(payload), nil
}

// UpdateNewsletterSubscriberStatus is the resolver for the updateNewsletterSubscriberStatus field.
func (*adminMutationResolver) UpdateNewsletterSubscriberStatus(
	ctx context.Context,
	input model.AdminUpdateNewsletterSubscriberStatusInput,
) (*model.AdminNewsletterSubscriber, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	updated, err := updateAdminNewsletterSubscriberStatusFn(
		ctx,
		adminUser,
		string(input.Email),
		mapAdminNewsletterStatusInput(input.Status),
	)
	if err != nil {
		return nil, err
	}

	return mapAdminNewsletterSubscriber(updated), nil
}

// DeleteNewsletterSubscriber is the resolver for the deleteNewsletterSubscriber field.
func (*adminMutationResolver) DeleteNewsletterSubscriber(
	ctx context.Context,
	input model.AdminDeleteNewsletterSubscriberInput,
) (*model.AdminDeletePayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	if err := deleteAdminNewsletterSubscriberFn(ctx, adminUser, string(input.Email)); err != nil {
		return nil, err
	}

	return &model.AdminDeletePayload{Success: true}, nil
}

// TriggerNewsletterDispatch is the resolver for the triggerNewsletterDispatch field.
func (*adminMutationResolver) TriggerNewsletterDispatch(
	ctx context.Context,
) (*model.AdminNewsletterDispatchPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	payload, err := triggerAdminNewsletterDispatchFn(ctx, adminUser)
	if err != nil {
		return nil, err
	}

	return mapAdminNewsletterDispatchPayload(payload), nil
}

// SendTestNewsletter is the resolver for the sendTestNewsletter field.
func (*adminMutationResolver) SendTestNewsletter(
	ctx context.Context,
	input model.AdminSendTestNewsletterInput,
) (*model.AdminNewsletterTestSendPayload, error) {
	adminUser, err := requireAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	payload, err := sendAdminNewsletterTestEmailFn(
		ctx,
		adminUser,
		string(input.Email),
		normalizeAdminLocale(input.Locale),
		input.ItemKey,
	)
	if err != nil {
		return nil, err
	}

	return mapAdminNewsletterTestSendPayload(payload), nil
}
