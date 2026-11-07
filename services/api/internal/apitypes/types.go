// Package apitypes holds the JSON request and response shapes of the HTTP API.
// TypeScript types in packages/types are generated from this package with
// tygo (`pnpm types:generate`); edit here, not in the generated file.
package apitypes

type ErrorResponse struct {
	Error string `json:"error"`
}

type StatusResponse struct {
	Status string `json:"status"`
}

type User struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
}

type MagicLinkRequest struct {
	Email string `json:"email"`
	// Next is an optional same-app path to open after the email link is used.
	Next string `json:"next,omitempty"`
}

type VerifyLoginCodeRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

type ExchangeState string

const (
	ExchangeStateDraft     ExchangeState = "draft"
	ExchangeStateOpen      ExchangeState = "open"
	ExchangeStateActive    ExchangeState = "active"
	ExchangeStateCompleted ExchangeState = "completed"
)

// ExchangeMember is a user who has joined an exchange. DisplayName is empty
// until the user sets one.
type ExchangeMember struct {
	UserID      string `json:"userId"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
	IsOrganizer bool   `json:"isOrganizer"`
}

type Exchange struct {
	ID          string `json:"id"`
	OrganizerID string `json:"organizerId"`
	Name        string `json:"name"`
	Description string `json:"description"`
	// Calendar date, YYYY-MM-DD.
	ExchangeDate string           `json:"exchangeDate"`
	BudgetCents  *int             `json:"budgetCents" tstype:"number | null"`
	State        ExchangeState    `json:"state"`
	Members      []ExchangeMember `json:"members"`
}

// ExchangeJoinPreview is the only exchange detail a signed-in person can see
// from a join link before the organizer approves them.
type ExchangeJoinPreview struct {
	Name                string `json:"name"`
	ExchangeDate        string `json:"exchangeDate"`
	ExchangeDescription string `json:"description"`
	OrganizerName       string `json:"organizerName"`
	OrganizerEmail      string `json:"organizerEmail"`
}

type ExchangeInviteStatus string

const (
	ExchangeInviteStatusPending   ExchangeInviteStatus = "pending"
	ExchangeInviteStatusAccepted  ExchangeInviteStatus = "accepted"
	ExchangeInviteStatusDeclined  ExchangeInviteStatus = "declined"
	ExchangeInviteStatusRevoked   ExchangeInviteStatus = "revoked"
	ExchangeInviteStatusRequested ExchangeInviteStatus = "requested"
)

type UserExchangeInvites struct {
	ID          string `json:"id"`
	OrganizerID string `json:"organizerId"`
	Name        string `json:"name"`
	Description string `json:"description"`
	// Calendar date, YYYY-MM-DD.
	ExchangeDate         string           `json:"exchangeDate"`
	BudgetCents          *int             `json:"budgetCents" tstype:"number | null"`
	State                ExchangeState    `json:"state"`
	Members              []ExchangeMember `json:"members"`
	InviteID             string           `json:"inviteId"`
	OrganizerEmail       string           `json:"organizerEmail"`
	OrganizerDisplayName string           `json:"organizerDisplayName"`
}

type ListUserExchangeInvite struct {
	Invites []UserExchangeInvites `json:"invites"`
}

// ExchangeInvite is one invite on an exchange. Accepted and declined are the
// invitee's response. Revoked is the organizer withdrawing a pending invite.
type ExchangeInvite struct {
	Email  string               `json:"email"`
	Status ExchangeInviteStatus `json:"status"`
}

// ListExchangeInvitesResponse holds every invite for an exchange. Only the
// organizer may read them.
type ListExchangeInvitesResponse struct {
	Invites []ExchangeInvite `json:"invites"`
}

type CreateExchangeRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	// Calendar date, YYYY-MM-DD.
	ExchangeDate string `json:"exchangeDate"`
	BudgetCents  *int   `json:"budgetCents" tstype:"number | null"`
}

type UpdateExchangeRequest = CreateExchangeRequest

// ExchangeInviteRequest adds or revokes one invite.
type ExchangeInviteRequest struct {
	Email string `json:"email"`
}

type ListExchangesResponse struct {
	Exchanges []Exchange `json:"exchanges"`
}

// Invite is a pending invite for the logged-in user's email.
type Invite struct {
	ExchangeID   string `json:"exchangeId"`
	ExchangeName string `json:"exchangeName"`
	// Calendar date, YYYY-MM-DD.
	ExchangeDate   string `json:"exchangeDate"`
	OrganizerName  string `json:"organizerName"`
	OrganizerEmail string `json:"organizerEmail"`
	InvitedAt      string `json:"invitedAt"`
}

type ListInvitesResponse struct {
	Invites []Invite `json:"invites"`
}
