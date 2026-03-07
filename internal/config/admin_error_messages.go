package config

import (
	"bufio"
	_ "embed"
	"errors"
	"fmt"
	"os"
	"strings"
)

const (
	adminErrorCatalogDefaultLocale = "en"
)

//go:embed admin_error_messages.properties
var embeddedAdminErrorMessages string

func LoadEmbeddedAdminErrorCatalog() (map[string]map[string]string, error) {
	return ParseAdminErrorCatalogProperties(embeddedAdminErrorMessages)
}

func LoadAdminErrorCatalogFromFile(path string) (map[string]map[string]string, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read admin error properties: %w", err)
	}
	return ParseAdminErrorCatalogProperties(string(raw))
}

func ParseAdminErrorCatalogProperties(raw string) (map[string]map[string]string, error) {
	catalog := map[string]map[string]string{}
	scanner := bufio.NewScanner(strings.NewReader(raw))
	lineNumber := 0

	for scanner.Scan() {
		lineNumber++
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, ";") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid admin error properties line %d", lineNumber)
		}

		key := strings.TrimSpace(parts[0])
		message := strings.TrimSpace(parts[1])
		if key == "" || message == "" {
			return nil, fmt.Errorf("invalid admin error properties line %d", lineNumber)
		}

		keyParts := strings.SplitN(key, ".", 2)
		if len(keyParts) != 2 {
			return nil, fmt.Errorf("invalid admin error key %q", key)
		}

		locale := strings.TrimSpace(strings.ToLower(keyParts[0]))
		code := strings.TrimSpace(strings.ToUpper(keyParts[1]))
		if locale == "" || code == "" {
			return nil, fmt.Errorf("invalid admin error key %q", key)
		}

		localeCatalog, exists := catalog[locale]
		if !exists {
			localeCatalog = map[string]string{}
			catalog[locale] = localeCatalog
		}
		localeCatalog[code] = message
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("scan admin error properties: %w", err)
	}
	if len(catalog) == 0 {
		return nil, errors.New("admin error properties is empty")
	}
	if _, exists := catalog[adminErrorCatalogDefaultLocale]; !exists {
		return nil, fmt.Errorf("admin error properties missing default locale %q", adminErrorCatalogDefaultLocale)
	}

	return catalog, nil
}
