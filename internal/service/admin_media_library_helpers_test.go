package service

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/color"
	"image/png"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"suaybsimsek.com/blog-api/internal/domain"
)

func TestDecodeAdminMediaDataURL(t *testing.T) {
	imageData := tinyPNGBytes(t)
	encoded := base64.StdEncoding.EncodeToString(imageData)
	tooLarge := base64.StdEncoding.EncodeToString(make([]byte, maxAdminMediaAssetBytes+1))

	tests := []struct {
		name        string
		value       string
		contentType string
		wantErr     bool
	}{
		{name: "empty", value: " ", wantErr: true},
		{name: "missing comma", value: "data:image/png;base64", wantErr: true},
		{name: "unsupported image type", value: "data:image/gif;base64," + encoded, wantErr: true},
		{name: "invalid base64", value: "data:image/png;base64,%%%", wantErr: true},
		{name: "empty decoded image", value: "data:image/png;base64,", wantErr: true},
		{name: "payload too large", value: "data:image/png;base64," + tooLarge, wantErr: true},
		{name: "invalid image bytes", value: "data:image/png;base64," + base64.StdEncoding.EncodeToString([]byte("not an image")), wantErr: true},
		{name: "png", value: "data:image/png;base64," + encoded, contentType: "image/png"},
		{name: "jpeg aliases", value: "data:image/jpg;base64," + encoded, contentType: "image/jpeg"},
		{name: "jpeg", value: "data:image/jpeg;base64," + encoded, contentType: "image/jpeg"},
		{name: "webp", value: "data:image/webp;base64," + encoded, contentType: "image/webp"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			payload, err := decodeAdminMediaDataURL(test.value)
			if (err != nil) != test.wantErr {
				t.Fatalf("decodeAdminMediaDataURL() error = %v, wantErr %t", err, test.wantErr)
			}
			if test.wantErr {
				return
			}
			if payload.ContentType != test.contentType || !bytes.Equal(payload.Data, imageData) || payload.Width != 1 || payload.Height != 1 {
				t.Fatalf("unexpected decoded payload: %#v", payload)
			}
		})
	}
}

func TestNormalizeAdminMediaAssetNameAndDefaultName(t *testing.T) {
	if got := normalizeAdminMediaAssetName(" ../images/photo.webp "); got != "photo.webp" {
		t.Fatalf("normalized asset name = %q", got)
	}
	if got := normalizeAdminMediaAssetName("/ "); got != "" {
		t.Fatalf("empty path asset name = %q", got)
	}
	if got := normalizeAdminMediaAssetName(strings.Repeat("x", maxAdminMediaAssetNameLength+20)); len(got) != maxAdminMediaAssetNameLength {
		t.Fatalf("long asset name length = %d", len(got))
	}

	for contentType, want := range map[string]string{
		" IMAGE/PNG ": "media-image.png",
		"image/jpeg":  "media-image.jpg",
		"image/webp":  "media-image.webp",
		"image/gif":   "media-image",
	} {
		if got := defaultAdminMediaAssetName(contentType); got != want {
			t.Errorf("default name for %q = %q, want %q", contentType, got, want)
		}
	}
}

func TestResolveAdminMediaFileMetadata(t *testing.T) {
	publicRoot := t.TempDir()
	imagePath := filepath.Join(publicRoot, "media", "tiny.png")
	if err := os.MkdirAll(filepath.Dir(imagePath), 0o755); err != nil {
		t.Fatal(err)
	}
	imageData := tinyPNGBytes(t)
	if err := os.WriteFile(imagePath, imageData, 0o600); err != nil {
		t.Fatal(err)
	}

	metadata, err := resolveAdminMediaFileMetadata(domain.AdminMediaLibraryItem{PreviewURL: "/media/tiny.png"}, publicRoot, "")
	if err != nil || metadata == nil || metadata.Width != 1 || metadata.Height != 1 || metadata.SizeBytes != len(imageData) {
		t.Fatalf("metadata from preview URL = %#v, %v", metadata, err)
	}

	metadata, err = resolveAdminMediaFileMetadata(domain.AdminMediaLibraryItem{
		PreviewURL: "relative/missing.png", Value: "https://example.com/media/tiny.png",
	}, publicRoot, "https://example.com")
	if err != nil || metadata == nil || metadata.Width != 1 {
		t.Fatalf("metadata from fallback URL = %#v, %v", metadata, err)
	}

	metadata, err = resolveAdminMediaFileMetadata(domain.AdminMediaLibraryItem{PreviewURL: "/missing.png"}, publicRoot, "")
	if !os.IsNotExist(err) || metadata != nil {
		t.Fatalf("missing file metadata = %#v, %v", metadata, err)
	}

	metadata, err = resolveAdminMediaFileMetadata(domain.AdminMediaLibraryItem{PreviewURL: "/media"}, publicRoot, "")
	if err != nil || metadata != nil {
		t.Fatalf("directory metadata = %#v, %v", metadata, err)
	}

	textPath := filepath.Join(publicRoot, "not-image.bin")
	if err := os.WriteFile(textPath, []byte("asset"), 0o600); err != nil {
		t.Fatal(err)
	}
	metadata, err = resolveAdminMediaFileMetadata(domain.AdminMediaLibraryItem{PreviewURL: "/not-image.bin"}, publicRoot, "")
	if err != nil || metadata == nil || metadata.SizeBytes != len("asset") || metadata.Width != 0 || metadata.Height != 0 {
		t.Fatalf("non-image file metadata = %#v, %v", metadata, err)
	}
}

func TestResolveAdminMediaPublicFilePathAndSameSiteURL(t *testing.T) {
	publicRoot := t.TempDir()
	tests := []struct {
		name    string
		value   string
		siteURL string
		wantOK  bool
	}{
		{name: "empty", value: ""},
		{name: "relative", value: "image.png"},
		{name: "path root", value: "/"},
		{name: "media endpoint", value: "/api/media/item-1"},
		{name: "path traversal stays under public root", value: "/../../outside.png", wantOK: true},
		{name: "foreign host", value: "https://other.example/image.png", siteURL: "https://example.com"},
		{name: "same site", value: "https://EXAMPLE.com/image.png", siteURL: "https://example.com", wantOK: true},
		{name: "local path", value: "/images/picture.png", wantOK: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			resolved, ok := resolveAdminMediaPublicFilePath(test.value, publicRoot, test.siteURL)
			if ok != test.wantOK {
				t.Fatalf("resolveAdminMediaPublicFilePath() = (%q, %t), want ok %t", resolved, ok, test.wantOK)
			}
		})
	}

	if isAdminMediaSameSiteURL(nil, "https://example.com") {
		t.Fatal("nil URL must not be same-site")
	}
	parsed, err := url.Parse("https://example.com/image.png")
	if err != nil {
		t.Fatal(err)
	}
	if isAdminMediaSameSiteURL(parsed, " ") || isAdminMediaSameSiteURL(parsed, "://bad") {
		t.Fatal("blank and malformed site URLs must not match")
	}
	if !isAdminMediaSameSiteURL(parsed, "https://EXAMPLE.com") {
		t.Fatal("host matching should be case-insensitive")
	}
}

func tinyPNGBytes(t *testing.T) []byte {
	t.Helper()
	imageData := image.NewRGBA(image.Rect(0, 0, 1, 1))
	imageData.Set(0, 0, color.RGBA{R: 255, A: 255})
	var buffer bytes.Buffer
	if err := png.Encode(&buffer, imageData); err != nil {
		t.Fatal(err)
	}
	return buffer.Bytes()
}
