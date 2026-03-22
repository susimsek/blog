package graphql

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWithPublicRequestContextWithoutReaderSessionFallsBackGracefully(t *testing.T) {
	ctx, err := WithPublicRequestContext(context.Background(), nil)
	if err != nil {
		t.Fatalf("WithPublicRequestContext(nil) returned error: %v", err)
	}
	if getReaderUser(ctx) != nil {
		t.Fatal("expected no reader user when request is nil")
	}

	requestWithoutCookie := httptest.NewRequest(http.MethodGet, "/", nil)
	ctx, err = WithPublicRequestContext(context.Background(), requestWithoutCookie)
	if err != nil {
		t.Fatalf("WithPublicRequestContext without cookie returned error: %v", err)
	}
	if getReaderUser(ctx) != nil {
		t.Fatal("expected no reader user without access cookie")
	}

	requestWithBlankCookie := httptest.NewRequest(http.MethodGet, "/", nil)
	requestWithBlankCookie.AddCookie(&http.Cookie{Name: "reader_access", Value: ""})
	ctx, err = WithPublicRequestContext(context.Background(), requestWithBlankCookie)
	if err != nil {
		t.Fatalf("WithPublicRequestContext with blank cookie returned error: %v", err)
	}
	if getReaderUser(ctx) != nil {
		t.Fatal("expected blank cookie not to resolve a reader user")
	}
	if getReaderUser(nil) != nil {
		t.Fatal("expected nil reader user from nil context")
	}
}
