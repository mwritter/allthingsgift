package server

import (
	"context"
	"net/http"

	"github.com/mwritter/allthingsgift/services/api/internal/auth"
)

type userContextKey struct{}

func WithUser(ctx context.Context, user *auth.User) context.Context {
	return context.WithValue(ctx, userContextKey{}, user)
}

func UserFromContext(ctx context.Context) *auth.User {
	user, _ := ctx.Value(userContextKey{}).(*auth.User)
	return user
}

// currentUser returns the user placed on the request by requireAuth.
func currentUser(r *http.Request) *auth.User {
	user := UserFromContext(r.Context())
	if user == nil {
		panic("currentUser called without requireAuth")
	}
	return user
}
