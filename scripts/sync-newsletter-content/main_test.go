package main

import "testing"

func TestResolveLegacyThumbnailLocalPath(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		siteURL   string
		thumbnail string
		wantPath  string
		wantOK    bool
	}{
		{
			name:      "relative root path",
			siteURL:   "https://suaybsimsek.com",
			thumbnail: "/images/example.webp",
			wantPath:  "public/images/example.webp",
			wantOK:    true,
		},
		{
			name:      "same site absolute url",
			siteURL:   "https://suaybsimsek.com",
			thumbnail: "https://suaybsimsek.com/images/example.webp",
			wantPath:  "public/images/example.webp",
			wantOK:    true,
		},
		{
			name:      "different host",
			siteURL:   "https://suaybsimsek.com",
			thumbnail: "https://cdn.example.com/images/example.webp",
			wantPath:  "",
			wantOK:    false,
		},
		{
			name:      "non path value",
			siteURL:   "https://suaybsimsek.com",
			thumbnail: "images/example.webp",
			wantPath:  "",
			wantOK:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			gotPath, gotOK := resolveLegacyThumbnailLocalPath(tt.siteURL, tt.thumbnail)
			if gotOK != tt.wantOK {
				t.Fatalf("resolveLegacyThumbnailLocalPath() ok = %v, want %v", gotOK, tt.wantOK)
			}
			if gotPath != tt.wantPath {
				t.Fatalf("resolveLegacyThumbnailLocalPath() path = %q, want %q", gotPath, tt.wantPath)
			}
		})
	}
}

func TestDetectMediaContentType(t *testing.T) {
	t.Parallel()

	if got := detectMediaContentType("image.webp", []byte("RIFFxxxxWEBPVP8 ")); got != "image/webp" {
		t.Fatalf("detectMediaContentType(webp) = %q", got)
	}
	if got := detectMediaContentType("image.png", []byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'}); got != "image/png" {
		t.Fatalf("detectMediaContentType(png) = %q", got)
	}
	if got := detectMediaContentType("image.bin", []byte("plain text")); got != "" {
		t.Fatalf("detectMediaContentType(unknown) = %q", got)
	}
}
