package httpapi

import (
	"context"
	"log/slog"
	"strings"

	"suaybsimsek.com/blog-api/pkg/apperrors"
)

func LogError(ctx context.Context, message string, err error, attrs ...any) {
	appErr := apperrors.From(err)
	if appErr == nil {
		return
	}

	resolvedMessage := strings.TrimSpace(message)
	if resolvedMessage == "" {
		resolvedMessage = "request failed"
	}

	logAttrs := make([]any, 0, len(attrs)+12)
	if requestID := RequestIDFromContext(ctx); requestID != "" {
		logAttrs = append(logAttrs, "request_id", requestID)
	}
	if trace, ok := RequestTraceFromContext(ctx); ok {
		logAttrs = append(logAttrs,
			"trace", slog.GroupValue(
				slog.String("method", trace.Method),
				slog.String("path", trace.Path),
				slog.String("remote_ip", trace.RemoteIP),
				slog.String("user_agent", trace.UserAgent),
			),
		)
	}

	logAttrs = append(logAttrs,
		"error_code", appErr.Code,
		"http_status", appErr.HTTPStatus,
		"error_message", appErr.Message,
	)
	if appErr.Cause != nil {
		logAttrs = append(logAttrs, "cause", appErr.Cause.Error())
	}
	logAttrs = append(logAttrs, attrs...)

	if appErr.HTTPStatus >= 500 {
		slog.ErrorContext(ctx, resolvedMessage, logAttrs...)
		return
	}

	slog.WarnContext(ctx, resolvedMessage, logAttrs...)
}
