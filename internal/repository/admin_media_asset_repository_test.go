package repository

import (
	"reflect"
	"testing"

	"go.mongodb.org/mongo-driver/bson"
)

func TestBuildAdminMediaLibrarySortDocument(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		sortKey  string
		expected bson.D
	}{
		{
			name:    "recent by default",
			sortKey: "",
			expected: bson.D{
				{Key: "updatedAt", Value: -1},
				{Key: "usageCount", Value: -1},
				{Key: "sortName", Value: 1},
			},
		},
		{
			name:    "name ascending",
			sortKey: adminMediaLibrarySortName,
			expected: bson.D{
				{Key: "sortName", Value: 1},
				{Key: "updatedAt", Value: -1},
				{Key: "usageCount", Value: -1},
			},
		},
		{
			name:    "size descending",
			sortKey: adminMediaLibrarySortSize,
			expected: bson.D{
				{Key: "sizeBytes", Value: -1},
				{Key: "updatedAt", Value: -1},
				{Key: "sortName", Value: 1},
			},
		},
		{
			name:    "usage descending",
			sortKey: adminMediaLibrarySortUsage,
			expected: bson.D{
				{Key: "usageCount", Value: -1},
				{Key: "updatedAt", Value: -1},
				{Key: "sortName", Value: 1},
			},
		},
		{
			name:    "unknown falls back to recent",
			sortKey: "unknown",
			expected: bson.D{
				{Key: "updatedAt", Value: -1},
				{Key: "usageCount", Value: -1},
				{Key: "sortName", Value: 1},
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			actual := buildAdminMediaLibrarySortDocument(test.sortKey)
			if !reflect.DeepEqual(actual, test.expected) {
				t.Fatalf("expected %#v, got %#v", test.expected, actual)
			}
		})
	}
}
