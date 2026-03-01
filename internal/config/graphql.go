package config

const (
	DefaultGraphQLPublicPath     = "/graphql"
	DefaultGraphQLQueryCacheSize = 1000
	DefaultGraphQLAPQCacheSize   = 100
)

type GraphQLConfig struct {
	PublicPath           string
	GraphiQLEnabled      bool
	IntrospectionEnabled bool
	QueryCacheSize       int
	APQCacheSize         int
}

func ResolveGraphQLConfig() GraphQLConfig {
	graphiQLEnabled := resolveBoolEnv("GRAPHIQL_ENABLED", false)
	introspectionEnabled := graphiQLEnabled
	if value, ok := resolveOptionalBoolEnv("GRAPHQL_INTROSPECTION_ENABLED"); ok {
		introspectionEnabled = value
	}

	return GraphQLConfig{
		PublicPath:           DefaultGraphQLPublicPath,
		GraphiQLEnabled:      graphiQLEnabled,
		IntrospectionEnabled: introspectionEnabled,
		QueryCacheSize:       DefaultGraphQLQueryCacheSize,
		APQCacheSize:         DefaultGraphQLAPQCacheSize,
	}
}
