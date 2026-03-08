package admingraphql

import (
	"context"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/vektah/gqlparser/v2/ast"
)

func (ec *executionContext) unmarshalInputDateTime(_ context.Context, value any) (time.Time, error) {
	_ = ec
	return graphql.UnmarshalTime(value)
}

func (ec *executionContext) _DateTime(_ context.Context, _ ast.SelectionSet, value *time.Time) graphql.Marshaler {
	_ = ec
	if value == nil {
		return graphql.Null
	}

	return graphql.MarshalTime(value.UTC())
}
