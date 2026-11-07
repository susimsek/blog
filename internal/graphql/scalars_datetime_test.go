package graphql

import (
	"bytes"
	"context"
	"strings"
	"testing"
	"time"
)

func TestDateTimeScalarUnmarshal(t *testing.T) {
	resolver := &executionContext{}
	want := time.Date(2026, time.November, 7, 8, 9, 10, 0, time.UTC)

	got, err := resolver.unmarshalInputDateTime(context.Background(), want.Format(time.RFC3339Nano))
	if err != nil || !got.Equal(want) {
		t.Fatalf("unmarshalInputDateTime() = %v, %v; want %v", got, err, want)
	}
	if _, err := resolver.unmarshalInputDateTime(context.Background(), 42); err == nil {
		t.Fatal("unmarshalInputDateTime() expected a type error")
	}
}

func TestDateTimeScalarMarshal(t *testing.T) {
	resolver := &executionContext{}
	if resolver._DateTime(context.Background(), nil, nil) == nil {
		t.Fatal("nil DateTime should return the GraphQL null marshaler")
	}

	localTime := time.Date(2026, time.November, 7, 11, 9, 10, 0, time.FixedZone("TR", 3*60*60))
	marshaler := resolver._DateTime(context.Background(), nil, &localTime)
	var output bytes.Buffer
	marshaler.MarshalGQL(&output)
	if !strings.Contains(output.String(), "2026-11-07T08:09:10Z") {
		t.Fatalf("DateTime output = %q, want UTC-normalized timestamp", output.String())
	}
}
