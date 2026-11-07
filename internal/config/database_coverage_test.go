package config

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestLoadAdminErrorCatalogSources(t *testing.T) {
	embedded, err := LoadEmbeddedAdminErrorCatalog()
	if err != nil || len(embedded[adminErrorCatalogDefaultLocale]) == 0 {
		t.Fatalf("LoadEmbeddedAdminErrorCatalog() = %#v, %v", embedded, err)
	}

	filePath := filepath.Join(t.TempDir(), "admin-errors.properties")
	if err := os.WriteFile(filePath, []byte("en.ONE=First\ntr.ONE=Bir\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	fromFile, err := LoadAdminErrorCatalogFromFile(filePath)
	if err != nil || fromFile["en"]["ONE"] != "First" || fromFile["tr"]["ONE"] != "Bir" {
		t.Fatalf("LoadAdminErrorCatalogFromFile() = %#v, %v", fromFile, err)
	}

	if _, err := LoadAdminErrorCatalogFromFile(filepath.Join(t.TempDir(), "missing.properties")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("missing catalog error = %v", err)
	}
}

func TestResolveDatabaseConfigMissingVariables(t *testing.T) {
	t.Run("missing URI", func(t *testing.T) {
		t.Setenv("MONGODB_URI", " ")
		t.Setenv("MONGODB_DATABASE", "blog")
		if _, err := ResolveDatabaseConfig(); err == nil {
			t.Fatal("expected an error for an empty MongoDB URI")
		}
	})

	t.Run("missing database name", func(t *testing.T) {
		t.Setenv("MONGODB_URI", "mongodb://localhost:27017")
		t.Setenv("MONGODB_DATABASE", " ")
		if _, err := ResolveDatabaseConfig(); err == nil {
			t.Fatal("expected an error for an empty MongoDB database name")
		}
	})
}

func TestNewMongoClientValidatesOptionsWithoutConnecting(t *testing.T) {
	client, err := NewMongoClient(DatabaseConfig{URI: "mongodb://localhost:27017"}, "")
	if err != nil {
		t.Fatalf("NewMongoClient() error = %v", err)
	}
	if err := client.Disconnect(t.Context()); err != nil {
		t.Fatalf("Disconnect() error = %v", err)
	}

	if _, err := NewMongoClient(DatabaseConfig{URI: "not-a-mongodb-uri"}, "blog"); err == nil {
		t.Fatal("expected invalid MongoDB URI to fail")
	}
}
