package newsletter

import "strings"

func BuildFaviconURL(siteURL string) string {
	base := strings.TrimSpace(siteURL)
	if base == "" || base == "/" {
		return "/favicon.ico"
	}
	return strings.TrimRight(base, "/") + "/favicon.ico"
}
