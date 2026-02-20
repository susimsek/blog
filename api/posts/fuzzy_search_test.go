package handler

import (
	"testing"
	"time"
)

func buildPost(id string, searchText string, publishedAt time.Time) postRecord {
	return postRecord{
		ID:          id,
		SearchText:  searchText,
		PublishedAt: publishedAt,
		Source:      "blog",
	}
}

func TestApplyFuzzySearchFiltersIrrelevantResults(t *testing.T) {
	posts := []postRecord{
		buildPost("spring-config", "spring boot configuration properties kotlin java", time.Date(2026, 2, 4, 0, 0, 0, 0, time.UTC)),
		buildPost("docker", "docker compose nginx kubernetes deployment", time.Date(2026, 1, 10, 0, 0, 0, 0, time.UTC)),
		buildPost("medium", "writing workflow medium newsletter audience", time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC)),
	}

	results := applyFuzzySearch(posts, "spring confi", "desc")
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}

	if results[0].ID != "spring-config" {
		t.Fatalf("expected spring-config result, got %s", results[0].ID)
	}
}

func TestApplyFuzzySearchRejectsSingleCharacterQuery(t *testing.T) {
	posts := []postRecord{
		buildPost("spring-config", "spring boot configuration properties kotlin java", time.Date(2026, 2, 4, 0, 0, 0, 0, time.UTC)),
	}

	results := applyFuzzySearch(posts, "s", "desc")
	if len(results) != 0 {
		t.Fatalf("expected no results for single-character query, got %d", len(results))
	}
}

func TestFuzzyTokenDistanceDoesNotTreatContainedSingleRuneAsStrongMatch(t *testing.T) {
	distance := fuzzyTokenDistance("spring", "s")
	if distance <= fuseScoreThreshold {
		t.Fatalf("expected distance above threshold, got %.4f", distance)
	}
}

func TestNormalizeSearchValueHandlesTurkishCaseAndMarks(t *testing.T) {
	normalized := normalizeSearchValue("IĞDIR ışık")
	if normalized != "igdir isik" {
		t.Fatalf("unexpected normalization: %q", normalized)
	}
}

