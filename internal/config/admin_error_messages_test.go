package config

import "testing"

func TestParseAdminErrorCatalogProperties(t *testing.T) {
	t.Parallel()

	catalog, err := ParseAdminErrorCatalogProperties(`
en.INVALID_CREDENTIALS=Invalid email or password.
tr.INVALID_CREDENTIALS=E-posta veya parola hatalı.
`)
	if err != nil {
		t.Fatalf("ParseAdminErrorCatalogProperties() error = %v", err)
	}

	if catalog["en"]["INVALID_CREDENTIALS"] != "Invalid email or password." {
		t.Fatalf("en message = %q", catalog["en"]["INVALID_CREDENTIALS"])
	}
	if catalog["tr"]["INVALID_CREDENTIALS"] != "E-posta veya parola hatalı." {
		t.Fatalf("tr message = %q", catalog["tr"]["INVALID_CREDENTIALS"])
	}
}

func TestParseAdminErrorCatalogPropertiesRequiresDefaultLocale(t *testing.T) {
	t.Parallel()

	_, err := ParseAdminErrorCatalogProperties(`
tr.INVALID_CREDENTIALS=E-posta veya parola hatalı.
`)
	if err == nil {
		t.Fatalf("expected error for missing default locale")
	}
}
