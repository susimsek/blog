package admingraphql

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestDateTimeScalarHelpers(t *testing.T) {
	ec := &executionContext{}
	value, err := ec.unmarshalInputDateTime(context.Background(), "2026-03-21T10:30:00Z")
	if err != nil {
		t.Fatalf("unmarshalInputDateTime returned error: %v", err)
	}
	if value.UTC().Format(time.RFC3339) != "2026-03-21T10:30:00Z" {
		t.Fatalf("unexpected unmarshalled value: %v", value)
	}

	if ec._DateTime(context.Background(), nil, nil) == nil {
		t.Fatal("expected nil DateTime scalar to marshal as graphql null")
	}

	target := time.Date(2026, time.March, 21, 13, 0, 0, 0, time.FixedZone("TR", 3*60*60))
	marshaler := ec._DateTime(context.Background(), nil, &target)
	var builder strings.Builder
	marshaler.MarshalGQL(&builder)

	var encoded string
	if err := json.Unmarshal([]byte(builder.String()), &encoded); err != nil {
		t.Fatalf("failed to decode marshalled DateTime: %v", err)
	}
	if encoded != "2026-03-21T10:00:00Z" {
		t.Fatalf("unexpected marshalled DateTime value: %q", encoded)
	}
}
