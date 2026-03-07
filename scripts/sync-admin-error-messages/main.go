package main

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
)

const (
	adminErrorMessageScope         = "admin_graphql"
	adminErrorPropertiesFilePath   = "internal/config/admin_error_messages.properties"
	adminErrorDefaultLocaleMissing = "missing locale entries in properties"
)

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer func() {
		_ = file.Close()
	}()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		if key == "" {
			continue
		}
		if _, exists := os.LookupEnv(key); exists {
			continue
		}
		_ = os.Setenv(key, value)
	}
}

func main() {
	loadDotEnv(filepath.Join(".", ".env.local"))

	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()

	now := time.Now().UTC()
	records, err := buildRecords(now)
	if err != nil {
		failf("build records: %v", err)
	}
	if len(records) == 0 {
		failf("no records to sync")
	}

	repo := repository.NewErrorMessageRepository()
	if err := repo.UpsertMany(ctx, records); err != nil {
		failf("upsert admin error messages: %v", err)
	}

	fmt.Printf("synced %d admin error messages into scope %q\n", len(records), adminErrorMessageScope)
}

func buildRecords(now time.Time) ([]domain.ErrorMessageRecord, error) {
	catalog, err := appconfig.LoadAdminErrorCatalogFromFile(filepath.Join(".", adminErrorPropertiesFilePath))
	if err != nil {
		return nil, fmt.Errorf("load properties %s: %w", adminErrorPropertiesFilePath, err)
	}

	locales := make([]string, 0, len(catalog))
	for locale := range catalog {
		locales = append(locales, strings.TrimSpace(strings.ToLower(locale)))
	}
	slices.Sort(locales)

	records := make([]domain.ErrorMessageRecord, 0)
	for _, locale := range locales {
		localeCatalog := catalog[locale]
		if len(localeCatalog) == 0 {
			return nil, fmt.Errorf("%s: %s", adminErrorDefaultLocaleMissing, locale)
		}

		codes := make([]string, 0, len(localeCatalog))
		for code := range localeCatalog {
			codes = append(codes, strings.TrimSpace(strings.ToUpper(code)))
		}
		slices.Sort(codes)

		for _, code := range codes {
			message := strings.TrimSpace(localeCatalog[code])
			if message == "" {
				return nil, fmt.Errorf("empty message for code %s locale %s", code, locale)
			}

			records = append(records, domain.ErrorMessageRecord{
				Scope:     adminErrorMessageScope,
				Locale:    locale,
				Code:      code,
				Message:   message,
				UpdatedAt: now,
			})
		}
	}

	return records, nil
}

func failf(format string, args ...any) {
	_, _ = fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
