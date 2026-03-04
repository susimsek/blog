package domain

type AdminDashboard struct {
	TotalPosts       int
	TotalSubscribers int
	TopViewedPosts   []AdminDashboardPostMetric
	TopLikedPosts    []AdminDashboardPostMetric
	ContentHealth    AdminDashboardContentHealth
}

type AdminDashboardPostMetric struct {
	PostID        string
	Title         string
	Locale        string
	PublishedDate string
	Hits          int64
	Likes         int64
}

type AdminDashboardContentHealth struct {
	LocalePairCoverage  int
	MissingTranslations int
	MissingThumbnails   int
	LatestUpdatedPosts  []AdminDashboardUpdatedPost
	DominantCategory    *AdminDashboardCategory
}

type AdminDashboardUpdatedPost struct {
	ID       string
	Title    string
	Date     string
	Category string
}

type AdminDashboardCategory struct {
	ID    string
	Name  string
	Count int
}
