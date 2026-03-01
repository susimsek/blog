package newsletter

import "testing"

func TestBuildFaviconURL(t *testing.T) {
	testCases := []struct {
		name    string
		siteURL string
		want    string
	}{
		{name: "empty", siteURL: "", want: "/favicon.ico"},
		{name: "root", siteURL: "/", want: "/favicon.ico"},
		{name: "trimmed", siteURL: " https://example.com/ ", want: "https://example.com/favicon.ico"},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			if got := BuildFaviconURL(testCase.siteURL); got != testCase.want {
				t.Fatalf("BuildFaviconURL(%q) = %q, want %q", testCase.siteURL, got, testCase.want)
			}
		})
	}
}
