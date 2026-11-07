package config

import "testing"

func TestResolveGraphQLConfig(t *testing.T) {
	t.Run("uses defaults", func(t *testing.T) {
		cfg := ResolveGraphQLConfig()
		assertDefaultGraphQLConfig(t, cfg)
	})

	t.Run("inherits introspection from graphiql when explicit flag is absent", func(t *testing.T) {
		t.Setenv("GRAPHIQL_ENABLED", "true")

		cfg := ResolveGraphQLConfig()
		assertGraphQLConfigEnabled(t, cfg, true, true)
	})

	t.Run("prefers explicit introspection flag", func(t *testing.T) {
		t.Setenv("GRAPHIQL_ENABLED", "true")
		t.Setenv("GRAPHQL_INTROSPECTION_ENABLED", "false")

		cfg := ResolveGraphQLConfig()
		assertGraphQLConfigEnabled(t, cfg, true, false)
	})
}

func assertDefaultGraphQLConfig(t *testing.T, cfg GraphQLConfig) {
	t.Helper()
	if cfg.PublicPath != DefaultGraphQLPublicPath {
		t.Fatalf("PublicPath = %q", cfg.PublicPath)
	}
	if cfg.GraphiQLEnabled || cfg.IntrospectionEnabled {
		t.Fatalf("GraphiQL and introspection should default to false: %#v", cfg)
	}
	if cfg.QueryCacheSize != DefaultGraphQLQueryCacheSize {
		t.Fatalf("QueryCacheSize = %d", cfg.QueryCacheSize)
	}
	if cfg.APQCacheSize != DefaultGraphQLAPQCacheSize {
		t.Fatalf("APQCacheSize = %d", cfg.APQCacheSize)
	}
}

func assertGraphQLConfigEnabled(t *testing.T, cfg GraphQLConfig, graphiql, introspection bool) {
	t.Helper()
	if cfg.GraphiQLEnabled != graphiql || cfg.IntrospectionEnabled != introspection {
		t.Fatalf("GraphiQL/introspection = %t/%t", cfg.GraphiQLEnabled, cfg.IntrospectionEnabled)
	}
}
