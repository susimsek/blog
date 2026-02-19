# Newsletter Package Layout

This package keeps newsletter behavior in a small set of focused modules:

- `config.go`: environment parsing and validated runtime config
- `mailer.go`: SMTP HTML mail sender (single implementation for all handlers)
- `content.go`: locale-aware email/page content + email template rendering
- `status_page.go`: reusable HTML status page renderer for confirm/unsubscribe flows
- `unsubscribe_token.go`: signed unsubscribe token create/verify
- `templates/*.html.tmpl`: shared email + status page templates

## Handler contract

Handlers under `api/*` should:

1. Resolve env/config from `pkg/newsletter/config.go`.
2. Build content using `pkg/newsletter/content.go`.
3. Send via `pkg/newsletter/mailer.go`.
4. Render user-facing status pages via `pkg/newsletter/status_page.go`.

This keeps handlers thin and easier to maintain.
