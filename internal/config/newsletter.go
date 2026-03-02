package config

import "time"

const (
	DefaultNewsletterMaxRecipientsPerRun = 200
	DefaultNewsletterMaxItemAgeHours     = 24 * 7
	DefaultUnsubscribeTokenTTLHours      = 24 * 365
)

type NewsletterConfig struct {
	SiteURL             string
	CronSecret          string
	UnsubscribeSecret   string
	MaxRecipientsPerRun int
	MaxItemAge          time.Duration
	UnsubscribeTokenTTL time.Duration
}

func ResolveNewsletterConfig() (NewsletterConfig, error) {
	siteURL, err := ResolveSiteURL()
	if err != nil {
		return NewsletterConfig{}, err
	}

	cronSecret, err := ResolveCronSecret()
	if err != nil {
		return NewsletterConfig{}, err
	}

	unsubscribeSecret, err := ResolveUnsubscribeSecret()
	if err != nil {
		return NewsletterConfig{}, err
	}

	return NewsletterConfig{
		SiteURL:             siteURL,
		CronSecret:          cronSecret,
		UnsubscribeSecret:   unsubscribeSecret,
		MaxRecipientsPerRun: ResolvePositiveIntEnv("NEWSLETTER_MAX_RECIPIENTS_PER_RUN", DefaultNewsletterMaxRecipientsPerRun),
		MaxItemAge:          time.Duration(ResolvePositiveIntEnv("NEWSLETTER_MAX_ITEM_AGE_HOURS", DefaultNewsletterMaxItemAgeHours)) * time.Hour,
		UnsubscribeTokenTTL: time.Duration(ResolvePositiveIntEnv("NEWSLETTER_UNSUBSCRIBE_TOKEN_TTL_HOURS", DefaultUnsubscribeTokenTTLHours)) * time.Hour,
	}, nil
}
