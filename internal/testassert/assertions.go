package testassert

import (
	"strings"
	"testing"
)

// Equal fails the test when got does not equal want.
func Equal[T comparable](t testing.TB, got, want T, label string) {
	t.Helper()
	if got != want {
		t.Fatalf("%s = %#v, want %#v", label, got, want)
	}
}

// True fails the test when condition is false.
func True(t testing.TB, condition bool, label string) {
	t.Helper()
	if !condition {
		t.Fatal(label)
	}
}

// NoError fails the test when err is non-nil.
func NoError(t testing.TB, err error, operation string) {
	t.Helper()
	if err != nil {
		t.Fatalf("%s: %v", operation, err)
	}
}

// ErrorContains fails the test unless err includes the expected text.
func ErrorContains(t testing.TB, err error, expected string) {
	t.Helper()
	if err == nil || !strings.Contains(err.Error(), expected) {
		t.Fatalf("error = %v, want it to contain %q", err, expected)
	}
}

// NotNil fails the test when value is nil.
func NotNil[T any](t testing.TB, value *T, label string) {
	t.Helper()
	if value == nil {
		t.Fatal(label)
	}
}
