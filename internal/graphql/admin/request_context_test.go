package admingraphql

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"suaybsimsek.com/blog-api/internal/domain"
)

func TestAdminRequestContextHelpers(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/admin", nil)
	recorder := httptest.NewRecorder()

	ctx := withRequestContext(context.Background(), request, recorder)
	if getRequest(ctx) != request {
		t.Fatal("expected request to be stored in context")
	}
	if getResponseWriter(ctx) != recorder {
		t.Fatal("expected response writer to be stored in context")
	}
	if getRequest(nil) != nil || getResponseWriter(nil) != nil {
		t.Fatal("expected nil context helpers to return nil")
	}

	adminUser := &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}
	ctx = WithAdminUser(ctx, adminUser)
	if getAdminUser(ctx) != adminUser {
		t.Fatal("expected admin user to be stored in context")
	}
	resolvedAdminUser, err := requireAdminUser(ctx)
	if err != nil || resolvedAdminUser != adminUser {
		t.Fatalf("requireAdminUser result = %#v, err=%v", resolvedAdminUser, err)
	}

	if _, err := requireAdminUser(context.Background()); err == nil {
		t.Fatal("expected missing admin user to fail")
	}
	if WithAdminUser(nil, nil) != nil {
		t.Fatal("expected nil admin user helper to preserve nil context")
	}
	if getAdminUser(nil) != nil {
		t.Fatal("expected nil admin user from nil context")
	}
}

func TestWithAdminRequestContextWithoutSessionFallsBackGracefully(t *testing.T) {
	recorder := httptest.NewRecorder()

	ctx, err := WithAdminRequestContext(context.Background(), nil, recorder)
	if err != nil {
		t.Fatalf("WithAdminRequestContext(nil) returned error: %v", err)
	}
	if getResponseWriter(ctx) != recorder {
		t.Fatal("expected response writer to be preserved")
	}

	requestWithoutCookie := httptest.NewRequest(http.MethodGet, "/admin", nil)
	ctx, err = WithAdminRequestContext(context.Background(), requestWithoutCookie, recorder)
	if err != nil {
		t.Fatalf("WithAdminRequestContext without cookie returned error: %v", err)
	}
	if getRequest(ctx) != requestWithoutCookie || getAdminUser(ctx) != nil {
		t.Fatalf("unexpected request context result: request=%#v user=%#v", getRequest(ctx), getAdminUser(ctx))
	}

	requestWithBlankCookie := httptest.NewRequest(http.MethodGet, "/admin", nil)
	requestWithBlankCookie.AddCookie(&http.Cookie{Name: "admin_access", Value: ""})
	ctx, err = WithAdminRequestContext(context.Background(), requestWithBlankCookie, recorder)
	if err != nil {
		t.Fatalf("WithAdminRequestContext with blank cookie returned error: %v", err)
	}
	if getAdminUser(ctx) != nil {
		t.Fatal("expected blank session cookie not to resolve a user")
	}
}
