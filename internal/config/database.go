package config

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	DefaultMongoConnectTimeout         = 10 * time.Second
	DefaultMongoServerSelectionTimeout = 10 * time.Second
)

type DatabaseConfig struct {
	URI                    string
	Name                   string
	ConnectTimeout         time.Duration
	ServerSelectionTimeout time.Duration
}

func ResolveDatabaseConfig() (DatabaseConfig, error) {
	uri, err := requiredEnv("MONGODB_URI")
	if err != nil {
		return DatabaseConfig{}, err
	}

	name, err := requiredEnv("MONGODB_DATABASE")
	if err != nil {
		return DatabaseConfig{}, err
	}

	return DatabaseConfig{
		URI:                    uri,
		Name:                   name,
		ConnectTimeout:         DefaultMongoConnectTimeout,
		ServerSelectionTimeout: DefaultMongoServerSelectionTimeout,
	}, nil
}

func BuildMongoClientOptions(cfg DatabaseConfig, appName string) *options.ClientOptions {
	clientOptions := options.Client().
		ApplyURI(cfg.URI).
		SetConnectTimeout(cfg.ConnectTimeout).
		SetServerSelectionTimeout(cfg.ServerSelectionTimeout)

	if appName != "" {
		clientOptions.SetAppName(appName)
	}

	return clientOptions
}

func NewMongoClient(ctx context.Context, cfg DatabaseConfig, appName string) (*mongo.Client, error) {
	return mongo.Connect(ctx, BuildMongoClientOptions(cfg, appName))
}

func ResolveDatabaseName() (string, error) {
	cfg, err := ResolveDatabaseConfig()
	if err != nil {
		return "", err
	}

	return cfg.Name, nil
}

func ResolveMongoURI() (string, error) {
	cfg, err := ResolveDatabaseConfig()
	if err != nil {
		return "", err
	}

	return cfg.URI, nil
}
