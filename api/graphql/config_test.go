package handler

import "testing"

func TestResolveBoolEnv(t *testing.T) {
	originalGetenv := getenv
	t.Cleanup(func() {
		getenv = originalGetenv
	})

	tests := []struct {
		name     string
		envValue string
		fallback bool
		want     bool
	}{
		{name: "defaults to fallback", envValue: "", fallback: true, want: true},
		{name: "parses true", envValue: "true", fallback: false, want: true},
		{name: "parses false", envValue: "false", fallback: true, want: false},
		{name: "parses on", envValue: "on", fallback: false, want: true},
		{name: "invalid value falls back", envValue: "maybe", fallback: true, want: true},
	}

	for _, testCase := range tests {
		t.Run(testCase.name, func(t *testing.T) {
			getenv = func(_ string) string {
				return testCase.envValue
			}

			if got := resolveBoolEnv("TEST_ENV", testCase.fallback); got != testCase.want {
				t.Fatalf("resolveBoolEnv() = %v, want %v", got, testCase.want)
			}
		})
	}
}

func TestIsGraphQLIntrospectionEnabled(t *testing.T) {
	originalGetenv := getenv
	t.Cleanup(func() {
		getenv = originalGetenv
	})

	t.Run("inherits GraphiQL flag when explicit introspection flag is absent", func(t *testing.T) {
		getenv = func(name string) string {
			if name == "GRAPHIQL_ENABLED" {
				return "true"
			}
			return ""
		}

		if !IsGraphQLIntrospectionEnabled() {
			t.Fatal("expected introspection to be enabled when GraphiQL is enabled")
		}
	})

	t.Run("prefers explicit introspection flag", func(t *testing.T) {
		getenv = func(name string) string {
			switch name {
			case "GRAPHIQL_ENABLED":
				return "true"
			case "GRAPHQL_INTROSPECTION_ENABLED":
				return "false"
			default:
				return ""
			}
		}

		if IsGraphQLIntrospectionEnabled() {
			t.Fatal("expected explicit introspection flag to override GraphiQL flag")
		}
	})
}
