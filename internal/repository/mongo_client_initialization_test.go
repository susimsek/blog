package repository

import (
	"context"
	"testing"

	"go.mongodb.org/mongo-driver/v2/mongo"
)

type mongoClientInitializationCase struct {
	name  string
	reset func()
	get   func() (*mongo.Client, error)
}

type mongoClientInitializationSettings struct {
	name     string
	uri      string
	database string
	wantErr  bool
}

func TestRepositoryMongoClientInitialization(t *testing.T) {
	clients := []mongoClientInitializationCase{
		{name: "admin users", reset: resetAdminRepositoryState, get: getAdminMongoClient},
		{name: "admin avatars", reset: resetAdminAvatarRepositoryState, get: getAdminAvatarMongoClient},
		{name: "admin refresh tokens", reset: resetAdminRefreshTokenRepositoryState, get: getAdminRefreshTokenMongoClient},
		{name: "error messages", reset: resetErrorMessageRepositoryState, get: getErrorMessageMongoClient},
		{name: "newsletter", reset: resetNewsletterRepositoryState, get: getNewsletterMongoClient},
	}

	for _, clientCase := range clients {
		t.Run(clientCase.name, func(t *testing.T) { testMongoClientInitialization(t, clientCase) })
	}
}

func testMongoClientInitialization(t *testing.T, clientCase mongoClientInitializationCase) {
	t.Helper()
	settingsCases := []mongoClientInitializationSettings{
		{name: "missing settings", database: "blog_test", wantErr: true},
		{name: "invalid URI", uri: "invalid-uri", database: "blog_test", wantErr: true},
		{name: "valid settings", uri: "mongodb://localhost:27017", database: "blog_test"},
	}
	for _, settings := range settingsCases {
		t.Run(settings.name, func(t *testing.T) {
			assertMongoClientInitialization(t, clientCase, settings)
		})
	}
}

func assertMongoClientInitialization(t *testing.T, clientCase mongoClientInitializationCase, settings mongoClientInitializationSettings) {
	t.Helper()
	clientCase.reset()
	t.Cleanup(clientCase.reset)
	t.Setenv("MONGODB_URI", settings.uri)
	t.Setenv("MONGODB_DATABASE", settings.database)

	client, err := clientCase.get()
	if (err != nil) != settings.wantErr {
		t.Fatalf("getMongoClient() error = %v, wantErr %t", err, settings.wantErr)
	}
	if settings.wantErr {
		return
	}
	if client == nil {
		t.Fatal("getMongoClient() returned a nil client")
	}
	t.Cleanup(func() { disconnectTestMongoClient(t, client) })
}

func disconnectTestMongoClient(t *testing.T, client *mongo.Client) {
	t.Helper()
	if err := client.Disconnect(context.Background()); err != nil {
		t.Errorf("disconnect MongoDB client: %v", err)
	}
}
