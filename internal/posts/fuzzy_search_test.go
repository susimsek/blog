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

func buildPostWithFields(id string, title string, summary string, searchText string, publishedAt time.Time) postRecord {
	return postRecord{
		ID:          id,
		Title:       title,
		Summary:     summary,
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

func TestApplyFuzzySearchOnlyChecksSearchText(t *testing.T) {
	posts := []postRecord{
		buildPostWithFields(
			"title-matches-only",
			"Spring Boot configuration",
			"Guide for service setup",
			"docker compose nginx deployment",
			time.Date(2026, 2, 5, 0, 0, 0, 0, time.UTC),
		),
		buildPostWithFields(
			"search-text-matches",
			"Cloud deployment",
			"Java article",
			"spring boot configuration tips production",
			time.Date(2026, 2, 6, 0, 0, 0, 0, time.UTC),
		),
	}

	results := applyFuzzySearch(posts, "spring config", "desc")
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
	if results[0].ID != "search-text-matches" {
		t.Fatalf("expected search-text-matches result, got %s", results[0].ID)
	}
}

func TestApplyFuzzySearchIgnoresTopicNames(t *testing.T) {
	post := buildPostWithFields(
		"topic-only-match",
		"Deployment notes",
		"Post about delivery",
		"deployment notes delivery",
		time.Date(2026, 2, 7, 0, 0, 0, 0, time.UTC),
	)
	post.Topics = []topicRecord{
		{ID: "k8s", Name: "Kubernetes"},
	}

	results := applyFuzzySearch([]postRecord{post}, "kubernetes", "desc")
	if len(results) != 0 {
		t.Fatalf("expected no results when only topic matches, got %d", len(results))
	}
}
