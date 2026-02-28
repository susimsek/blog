package graphqlapi

import (
	"os"
	"strings"
)

const publicGraphQLPath = "/graphql"

func IsGraphiQLEnabled() bool {
	return resolveBoolEnv("GRAPHIQL_ENABLED", false)
}

func IsGraphQLIntrospectionEnabled() bool {
	if value, ok := resolveOptionalBoolEnv("GRAPHQL_INTROSPECTION_ENABLED"); ok {
		return value
	}

	return IsGraphiQLEnabled()
}

func resolveOptionalBoolEnv(name string) (bool, bool) {
	rawValue := strings.TrimSpace(getenv(name))
	if rawValue == "" {
		return false, false
	}

	switch strings.ToLower(rawValue) {
	case "1", "true", "yes", "on":
		return true, true
	case "0", "false", "no", "off":
		return false, true
	default:
		return false, false
	}
}

func resolveBoolEnv(name string, fallback bool) bool {
	if value, ok := resolveOptionalBoolEnv(name); ok {
		return value
	}

	return fallback
}

var getenv = os.Getenv
