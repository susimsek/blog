package config

import "testing"

func TestResolveGraphQLConfig(t *testing.T) {
	t.Run("uses defaults", func(t *testing.T) {
		cfg := ResolveGraphQLConfig()

		if cfg.PublicPath != DefaultGraphQLPublicPath {
			t.Fatalf("PublicPath = %q", cfg.PublicPath)
		}
		if cfg.GraphiQLEnabled {
			t.Fatal("GraphiQLEnabled should default to false")
		}
		if cfg.IntrospectionEnabled {
			t.Fatal("IntrospectionEnabled should default to false")
		}
		if cfg.QueryCacheSize != DefaultGraphQLQueryCacheSize {
			t.Fatalf("QueryCacheSize = %d", cfg.QueryCacheSize)
		}
		if cfg.APQCacheSize != DefaultGraphQLAPQCacheSize {
			t.Fatalf("APQCacheSize = %d", cfg.APQCacheSize)
		}
	})

	t.Run("inherits introspection from graphiql when explicit flag is absent", func(t *testing.T) {
		t.Setenv("GRAPHIQL_ENABLED", "true")

		cfg := ResolveGraphQLConfig()
		if !cfg.GraphiQLEnabled {
			t.Fatal("GraphiQLEnabled should be true")
		}
		if !cfg.IntrospectionEnabled {
			t.Fatal("IntrospectionEnabled should inherit GraphiQL flag")
		}
	})

	t.Run("prefers explicit introspection flag", func(t *testing.T) {
		t.Setenv("GRAPHIQL_ENABLED", "true")
		t.Setenv("GRAPHQL_INTROSPECTION_ENABLED", "false")

		cfg := ResolveGraphQLConfig()
		if cfg.IntrospectionEnabled {
			t.Fatal("IntrospectionEnabled should use explicit env value")
		}
	})
}
