package handler

import (
	"math"
	"sort"
	"strings"
	"unicode"
	"unicode/utf8"

	"golang.org/x/text/unicode/norm"
)

const (
	fuseLocationDistance = 120
)

type fuseScoringOptions struct {
	threshold      float64
	minTokenLength int
	expectedLoc    int
	locationDist   int
	ignoreLocation bool
}

type scoredPost struct {
	Post  postRecord
	Score float64
}

var defaultFuseScoringOptions = fuseScoringOptions{
	threshold:      fuseScoreThreshold,
	minTokenLength: fuseMinMatchCharLength,
	expectedLoc:    0,
	locationDist:   fuseLocationDistance,
	ignoreLocation: false,
}

func applyFuzzySearch(posts []postRecord, query string, sortOrder string) []postRecord {
	queryTokens := tokenizeSearchValueWithMin(query, defaultFuseScoringOptions.minTokenLength)
	if len(queryTokens) == 0 {
		return []postRecord{}
	}

	normalizedQuery := normalizeSearchValue(query)
	if normalizedQuery == "" {
		return []postRecord{}
	}

	scored := make([]scoredPost, 0, len(posts))
	for _, post := range posts {
		score, ok := scorePostWithFuse(post, normalizedQuery, queryTokens, defaultFuseScoringOptions)
		if !ok || score > defaultFuseScoringOptions.threshold {
			continue
		}
		scored = append(scored, scoredPost{
			Post:  post,
			Score: score,
		})
	}

	sort.Slice(scored, func(left int, right int) bool {
		if scored[left].Score != scored[right].Score {
			return scored[left].Score < scored[right].Score
		}

		leftPublishedAt := scored[left].Post.PublishedAt
		rightPublishedAt := scored[right].Post.PublishedAt
		if !leftPublishedAt.Equal(rightPublishedAt) {
			if sortOrder == "asc" {
				return leftPublishedAt.Before(rightPublishedAt)
			}
			return leftPublishedAt.After(rightPublishedAt)
		}

		return scored[left].Post.ID < scored[right].Post.ID
	})

	filtered := make([]postRecord, 0, len(scored))
	for _, candidate := range scored {
		filtered = append(filtered, candidate.Post)
	}
	return filtered
}

func scorePostWithFuse(
	post postRecord,
	normalizedQuery string,
	queryTokens []string,
	options fuseScoringOptions,
) (float64, bool) {
	score, matched := scoreFuseField(post.SearchText, normalizedQuery, queryTokens, options)
	if !matched {
		return 1, false
	}
	return score, true
}

func scoreFuseField(
	fieldValue string,
	normalizedQuery string,
	queryTokens []string,
	options fuseScoringOptions,
) (float64, bool) {
	normalizedField := normalizeSearchValue(fieldValue)
	if normalizedField == "" {
		return 1, false
	}

	fieldTokens := tokenizeSearchValueWithMin(fieldValue, options.minTokenLength)
	if len(fieldTokens) == 0 {
		return 1, false
	}

	totalDistance := 0.0
	for _, queryToken := range queryTokens {
		bestTokenDistance := 1.0
		for _, fieldToken := range fieldTokens {
			distance := fuzzyTokenDistance(queryToken, fieldToken)
			if distance < bestTokenDistance {
				bestTokenDistance = distance
			}
			if bestTokenDistance == 0 {
				break
			}
		}

		if bestTokenDistance > options.threshold {
			return 1, false
		}
		totalDistance += bestTokenDistance
	}

	score := totalDistance / float64(len(queryTokens))
	locationScore, hasLocation := computeFuseLocationScore(normalizedQuery, normalizedField, options)
	if hasLocation {
		score = (score * 0.75) + (locationScore * 0.25)
	}

	if strings.Contains(normalizedField, normalizedQuery) {
		score *= 0.72
	}

	return clampFuseScore(score), true
}

func computeFuseLocationScore(normalizedQuery string, normalizedField string, options fuseScoringOptions) (float64, bool) {
	currentLocation := runeIndex(normalizedField, normalizedQuery)
	if currentLocation < 0 {
		return 1, false
	}

	return computeFuseBitapScore(
		normalizedQuery,
		0,
		currentLocation,
		options.expectedLoc,
		options.locationDist,
		options.ignoreLocation,
	), true
}

func computeFuseBitapScore(
	pattern string,
	errors int,
	currentLocation int,
	expectedLocation int,
	distance int,
	ignoreLocation bool,
) float64 {
	patternLength := len([]rune(pattern))
	if patternLength == 0 {
		return 1
	}

	accuracy := float64(errors) / float64(patternLength)
	if ignoreLocation {
		return clampFuseScore(accuracy)
	}

	proximity := math.Abs(float64(expectedLocation - currentLocation))
	if distance <= 0 {
		if proximity > 0 {
			return 1
		}
		return clampFuseScore(accuracy)
	}

	return clampFuseScore(accuracy + (proximity / float64(distance)))
}

func runeIndex(value string, query string) int {
	byteIndex := strings.Index(value, query)
	if byteIndex < 0 {
		return -1
	}
	return utf8.RuneCountInString(value[:byteIndex])
}

func tokenizeSearchValue(value string) []string {
	return tokenizeSearchValueWithMin(value, fuseMinMatchCharLength)
}

func tokenizeSearchValueWithMin(value string, minTokenLength int) []string {
	normalized := normalizeSearchValue(value)
	if normalized == "" {
		return nil
	}

	tokens := strings.FieldsFunc(normalized, func(char rune) bool {
		return !unicode.IsLetter(char) && !unicode.IsDigit(char)
	})
	if len(tokens) == 0 {
		return nil
	}

	seen := make(map[string]struct{}, len(tokens))
	result := make([]string, 0, len(tokens))
	for _, token := range tokens {
		if token == "" {
			continue
		}
		if len([]rune(token)) < minTokenLength {
			continue
		}
		if _, exists := seen[token]; exists {
			continue
		}
		seen[token] = struct{}{}
		result = append(result, token)
	}
	return result
}

func normalizeSearchValue(value string) string {
	normalized := strings.ToLowerSpecial(unicode.TurkishCase, strings.TrimSpace(value))
	if normalized == "" {
		return ""
	}

	normalized = strings.ReplaceAll(normalized, "ı", "i")
	decomposed := norm.NFKD.String(normalized)

	builder := strings.Builder{}
	builder.Grow(len(decomposed))

	previousWasSpace := false
	for _, char := range decomposed {
		if unicode.Is(unicode.Mn, char) {
			continue
		}
		if unicode.IsLetter(char) || unicode.IsDigit(char) {
			builder.WriteRune(char)
			previousWasSpace = false
			continue
		}
		if !previousWasSpace {
			builder.WriteRune(' ')
			previousWasSpace = true
		}
	}

	return strings.TrimSpace(builder.String())
}

func fuzzyTokenDistance(queryToken string, candidateToken string) float64 {
	if queryToken == candidateToken {
		return 0
	}

	if strings.Contains(candidateToken, queryToken) {
		queryLength := len([]rune(queryToken))
		candidateLength := len([]rune(candidateToken))
		if queryLength <= 0 || candidateLength <= 0 {
			return 1
		}
		if queryLength <= 2 && !strings.HasPrefix(candidateToken, queryToken) {
			return 1
		}

		extraLengthRatio := float64(candidateLength-queryLength) / float64(candidateLength)
		if extraLengthRatio < 0 {
			extraLengthRatio = 0
		}
		if extraLengthRatio > 1 {
			extraLengthRatio = 1
		}

		return extraLengthRatio * 0.2
	}

	queryLength := len([]rune(queryToken))
	candidateLength := len([]rune(candidateToken))
	if queryLength == 0 || candidateLength == 0 {
		return 1
	}

	distance := levenshteinDistance(queryToken, candidateToken)
	maxLength := maxInt(queryLength, candidateLength)
	return clampFuseScore(float64(distance) / float64(maxLength))
}

func levenshteinDistance(left string, right string) int {
	leftRunes := []rune(left)
	rightRunes := []rune(right)

	if len(leftRunes) == 0 {
		return len(rightRunes)
	}
	if len(rightRunes) == 0 {
		return len(leftRunes)
	}

	previous := make([]int, len(rightRunes)+1)
	for j := 0; j <= len(rightRunes); j++ {
		previous[j] = j
	}

	for i := 1; i <= len(leftRunes); i++ {
		current := make([]int, len(rightRunes)+1)
		current[0] = i
		for j := 1; j <= len(rightRunes); j++ {
			cost := 0
			if leftRunes[i-1] != rightRunes[j-1] {
				cost = 1
			}

			insertCost := current[j-1] + 1
			deleteCost := previous[j] + 1
			replaceCost := previous[j-1] + cost
			current[j] = minInt(insertCost, deleteCost, replaceCost)
		}
		previous = current
	}

	return previous[len(rightRunes)]
}

func minInt(values ...int) int {
	if len(values) == 0 {
		return 0
	}
	result := values[0]
	for _, value := range values[1:] {
		if value < result {
			result = value
		}
	}
	return result
}

func maxInt(left int, right int) int {
	if left > right {
		return left
	}
	return right
}

func clampFuseScore(value float64) float64 {
	if value < 0 {
		return 0
	}
	if value > 1 {
		return 1
	}
	return value
}
