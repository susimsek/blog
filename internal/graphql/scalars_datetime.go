package graphql

import (
	"context"
	"time"

	gql "github.com/99designs/gqlgen/graphql"
	"github.com/vektah/gqlparser/v2/ast"
)

func (ec *executionContext) unmarshalInputDateTime(_ context.Context, value any) (time.Time, error) {
	_ = ec
	return gql.UnmarshalTime(value)
}

func (ec *executionContext) _DateTime(_ context.Context, _ ast.SelectionSet, value *time.Time) gql.Marshaler {
	_ = ec
	if value == nil {
		return gql.Null
	}

	return gql.MarshalTime(value.UTC())
}
