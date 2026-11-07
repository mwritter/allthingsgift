package server

import (
	"errors"
	"log"
	"net/http"

	"github.com/mwritter/allthingsgift/services/api/internal/auth"
	"github.com/mwritter/allthingsgift/services/api/internal/exchanges"
)

// serviceError is the HTTP status and client message for a domain sentinel.
// An empty msg means the caller must pass that sentinel via withMessage,
// because the wording depends on the route.
type serviceError struct {
	err    error
	status int
	msg    string
}

var serviceErrors = []serviceError{
	{auth.ErrInvalidEmail, http.StatusBadRequest, "invalid email"},
	{auth.ErrInvalidCode, http.StatusBadRequest, "That code is invalid or has expired."},
	{auth.ErrUnauthorized, http.StatusUnauthorized, "unauthorized"},
	{exchanges.ErrNotFound, http.StatusNotFound, "exchange not found"},
	{exchanges.ErrInvalidName, http.StatusBadRequest, "Give your exchange a name"},
	{exchanges.ErrInvalidDate, http.StatusBadRequest, "Pick an exchange date"},
	{exchanges.ErrInvalidBudget, http.StatusBadRequest, "Budget must be zero or more"},
	{exchanges.ErrInvalidEmail, http.StatusBadRequest, "Enter an email address"},
	{exchanges.ErrAlreadyJoined, http.StatusConflict, "This person has already joined"},
	{exchanges.ErrInviteNotFound, http.StatusNotFound, "invite not found"},
	{exchanges.ErrInviteDeclined, http.StatusConflict, "This person already declined"},
	{exchanges.ErrInviteRevoked, http.StatusBadRequest, "invite is revoked"},
	{exchanges.ErrForbidden, http.StatusForbidden, ""},
	{exchanges.ErrInviteSelf, http.StatusBadRequest, ""},
}

// errorText overrides the client message for one sentinel on a single route.
type errorText struct {
	err error
	msg string
}

func withMessage(err error, msg string) errorText {
	return errorText{err: err, msg: msg}
}

// writeServiceError writes the JSON error for err and returns true.
// A nil err returns false so the handler can continue. Unknown errors are
// logged and returned as 500 using fallback for both the log line and the
// client message. overrides replace the default message for that route.
func writeServiceError(w http.ResponseWriter, err error, fallback string, overrides ...errorText) bool {
	if err == nil {
		return false
	}
	for _, override := range overrides {
		if errors.Is(err, override.err) {
			writeError(w, statusFor(override.err), override.msg)
			return true
		}
	}
	for _, known := range serviceErrors {
		if known.msg == "" || !errors.Is(err, known.err) {
			continue
		}
		writeError(w, known.status, known.msg)
		return true
	}
	log.Printf("%s: %v", fallback, err)
	writeError(w, http.StatusInternalServerError, fallback)
	return true
}

func statusFor(err error) int {
	for _, known := range serviceErrors {
		if known.err == err {
			return known.status
		}
	}
	return http.StatusInternalServerError
}
