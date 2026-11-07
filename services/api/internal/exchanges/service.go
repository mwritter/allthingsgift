package exchanges

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"slices"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mwritter/allthingsgift/services/api/internal/apitypes"
	"github.com/mwritter/allthingsgift/services/api/internal/auth"
	"github.com/mwritter/allthingsgift/services/api/internal/db"
	"github.com/mwritter/allthingsgift/services/api/internal/mailer"
)

var (
	ErrInvalidName    = errors.New("invalid name")
	ErrInvalidDate    = errors.New("invalid date")
	ErrInvalidBudget  = errors.New("invalid budget")
	ErrInvalidEmail   = errors.New("invalid email")
	ErrInviteSelf     = errors.New("cannot invite yourself")
	ErrInviteRevoked  = errors.New("invite revoked")
	ErrAlreadyJoined  = errors.New("already joined")
	ErrInviteDeclined = errors.New("invite declined")
	ErrInviteNotFound = errors.New("invite not found")
	ErrNotFound       = errors.New("exchange not found")
	ErrForbidden      = errors.New("not the organizer")
)

type Service struct {
	pool    *pgxpool.Pool
	queries *db.Queries
	mailer  mailer.Mailer
	baseURL string
}

func NewService(pool *pgxpool.Pool, mailer mailer.Mailer, baseURL string) *Service {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if baseURL == "" {
		baseURL = "http://localhost:3000"
	}
	return &Service{pool: pool, queries: db.New(pool), mailer: mailer, baseURL: baseURL}
}

func (s *Service) GetExchanges(ctx context.Context, userID string) ([]apitypes.Exchange, error) {
	rows, err := s.queries.ListExchangesForUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list exchanges: %w", err)
	}

	exchanges := make([]apitypes.Exchange, 0, len(rows))
	ids := make([]string, 0, len(rows))
	for _, row := range rows {
		exchanges = append(exchanges, exchangeFromRow(db.GetExchangeForUserRow(row)))
		ids = append(ids, row.ID)
	}

	byExchange, err := s.membersByExchange(ctx, ids)
	if err != nil {
		return nil, err
	}
	for i := range exchanges {
		exchanges[i].Members = withOrganizer(byExchange[exchanges[i].ID], exchanges[i].OrganizerID)
	}
	return exchanges, nil
}

func (s *Service) GetExchangeById(ctx context.Context, userID string, exchangeID string) (apitypes.Exchange, error) {
	row, err := s.queries.GetExchangeForUser(ctx, db.GetExchangeForUserParams{
		UserID:     userID,
		ExchangeID: exchangeID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return apitypes.Exchange{}, ErrNotFound
	}
	if err != nil {
		return apitypes.Exchange{}, fmt.Errorf("get exchange: %w", err)
	}
	ex := exchangeFromRow(row)

	byExchange, err := s.membersByExchange(ctx, []string{ex.ID})
	if err != nil {
		return apitypes.Exchange{}, err
	}
	ex.Members = withOrganizer(byExchange[ex.ID], ex.OrganizerID)
	return ex, nil
}

func (s *Service) GetExchangeJoinPreview(ctx context.Context, userID, exchangeID string) (apitypes.ExchangeJoinPreview, error) {
	_, err := s.queries.GetExchangeForUser(ctx, db.GetExchangeForUserParams{
		UserID:     userID,
		ExchangeID: exchangeID,
	})
	if err == nil {
		return apitypes.ExchangeJoinPreview{}, ErrAlreadyJoined
	}
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return apitypes.ExchangeJoinPreview{}, fmt.Errorf("get exchange membership: %w", err)
	}

	row, err := s.queries.GetExchangeJoinPreview(ctx, exchangeID)
	if errors.Is(err, pgx.ErrNoRows) {
		return apitypes.ExchangeJoinPreview{}, ErrNotFound
	}
	if err != nil {
		return apitypes.ExchangeJoinPreview{}, fmt.Errorf("get exchange preview: %w", err)
	}
	return apitypes.ExchangeJoinPreview{
		Name:                row.Name,
		ExchangeDate:        row.ExchangeDate,
		ExchangeDescription: row.ExchangeDescription,
		OrganizerName:       row.OrganizerName,
		OrganizerEmail:      row.OrganizerEmail,
	}, nil
}

// GetUserExchangeInvites returns pending invites for the logged-in user.
func (s *Service) GetUserExchangeInvites(ctx context.Context, userID string) ([]apitypes.UserExchangeInvites, error) {
	rows, err := s.queries.GetUserExchangeInvites(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list user invites: %w", err)
	}

	invites := make([]apitypes.UserExchangeInvites, 0, len(rows))
	for _, row := range rows {
		invites = append(invites, apitypes.UserExchangeInvites{
			ID:                   row.ID,
			OrganizerID:          row.OrganizerID,
			Name:                 row.Name,
			Description:          row.ExchangeDescription,
			ExchangeDate:         row.ExchangeDate,
			BudgetCents:          intPtr(row.ExchangeBudgetCents),
			State:                apitypes.ExchangeState(row.State),
			OrganizerEmail:       row.OrganizerEmail,
			OrganizerDisplayName: row.OrganizerName,
		})
	}
	return invites, nil
}

// GetExchangeInvites returns every invite for an exchange, with its status.
// Only the organizer may read them, so members get ErrForbidden rather than an
// empty list.
func (s *Service) GetExchangeInvites(ctx context.Context, userID, exchangeID string) ([]apitypes.ExchangeInvite, error) {
	if err := s.requireOrganizer(ctx, userID, exchangeID); err != nil {
		return nil, err
	}

	rows, err := s.queries.ListInviteStates(ctx, exchangeID)
	if err != nil {
		return nil, fmt.Errorf("list invites: %w", err)
	}

	invites := make([]apitypes.ExchangeInvite, 0, len(rows))
	for _, row := range rows {
		invites = append(invites, apitypes.ExchangeInvite{
			Email:  row.Email,
			Status: inviteStatus(row.Accepted, row.Declined, row.Requested, row.Revoked),
		})
	}
	slices.SortFunc(invites, func(a, b apitypes.ExchangeInvite) int {
		return strings.Compare(a.Email, b.Email)
	})
	return invites, nil
}

func inviteStatus(accepted, declined, requested, revoked bool) apitypes.ExchangeInviteStatus {
	switch {
	// Requested combos first
	case accepted && requested:
		return apitypes.ExchangeInviteStatus(fmt.Sprintf("%s-%s", apitypes.ExchangeInviteStatusRequested, apitypes.ExchangeInviteStatusAccepted))
	case revoked && requested:
		return apitypes.ExchangeInviteStatus(fmt.Sprintf("%s-%s", apitypes.ExchangeInviteStatusRequested, apitypes.ExchangeInviteStatusRevoked))
	// Non combos
	case accepted:
		return apitypes.ExchangeInviteStatusAccepted
	case declined:
		return apitypes.ExchangeInviteStatusDeclined
	case requested:
		return apitypes.ExchangeInviteStatusRequested
	case revoked:
		return apitypes.ExchangeInviteStatusRevoked
	default:
		return apitypes.ExchangeInviteStatusPending
	}
}

func (s *Service) requireOrganizer(ctx context.Context, userID, exchangeID string) error {
	organizerID, err := s.queries.GetExchangeOrganizerID(ctx, exchangeID)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("get exchange organizer: %w", err)
	}
	if organizerID != userID {
		return ErrForbidden
	}
	return nil
}

// AddExchangeInvite creates a pending invite and emails it. Inviting someone
// who declined or whose invite was revoked reopens that invite. The bool is
// true when a new email was sent.
func (s *Service) AddExchangeInvite(ctx context.Context, userID, userEmail, exchangeID, rawEmail string) (apitypes.ExchangeInvite, bool, error) {
	if err := s.requireOrganizer(ctx, userID, exchangeID); err != nil {
		return apitypes.ExchangeInvite{}, false, err
	}

	userEmail, _ = auth.NormalizeEmail(userEmail)
	email, err := auth.NormalizeEmail(rawEmail)
	if err != nil {
		return apitypes.ExchangeInvite{}, false, ErrInvalidEmail
	}
	if email == userEmail {
		return apitypes.ExchangeInvite{}, false, ErrInviteSelf
	}

	exchange, err := s.GetExchangeById(ctx, userID, exchangeID)
	if err != nil {
		return apitypes.ExchangeInvite{}, false, err
	}

	pending := apitypes.ExchangeInvite{
		Email:  email,
		Status: apitypes.ExchangeInviteStatusPending,
	}
	state, err := s.queries.GetInviteState(ctx, db.GetInviteStateParams{
		ExchangeID: exchangeID,
		Email:      email,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		if err := s.queries.InsertExchangeInvite(ctx, db.InsertExchangeInviteParams{
			ExchangeID: exchangeID,
			Email:      email,
		}); err != nil {
			return apitypes.ExchangeInvite{}, false, fmt.Errorf("insert invite: %w", err)
		}
		s.sendInvite(ctx, email, exchange.Name)
		return pending, true, nil
	}
	if err != nil {
		return apitypes.ExchangeInvite{}, false, fmt.Errorf("get invite: %w", err)
	}
	if state.Accepted {
		return apitypes.ExchangeInvite{}, false, ErrAlreadyJoined
	}
	if !state.Declined && !state.Revoked {
		return pending, false, nil
	}

	if err := s.queries.ReopenInvite(ctx, db.ReopenInviteParams{
		ExchangeID: exchangeID,
		Email:      email,
	}); err != nil {
		return apitypes.ExchangeInvite{}, false, fmt.Errorf("reopen invite: %w", err)
	}
	s.sendInvite(ctx, email, exchange.Name)
	return pending, true, nil
}

// RevokeExchangeInvite marks a pending or accepted invite as revoked. The invite
// row stays. An accepted invite also drops that person's membership. A declined
// invite keeps the invitee's response.
func (s *Service) RevokeExchangeInvite(ctx context.Context, userID, organizerEmail, exchangeID, rawEmail string) (apitypes.ExchangeInvite, error) {
	if err := s.requireOrganizer(ctx, userID, exchangeID); err != nil {
		return apitypes.ExchangeInvite{}, err
	}

	organizerEmail, _ = auth.NormalizeEmail(organizerEmail)
	email, err := auth.NormalizeEmail(rawEmail)
	if err != nil {
		return apitypes.ExchangeInvite{}, ErrInvalidEmail
	}
	if email == organizerEmail {
		return apitypes.ExchangeInvite{}, ErrInviteSelf
	}

	revoked := apitypes.ExchangeInvite{
		Email:  email,
		Status: apitypes.ExchangeInviteStatusRevoked,
	}
	state, err := s.queries.GetInviteState(ctx, db.GetInviteStateParams{
		ExchangeID: exchangeID,
		Email:      email,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return apitypes.ExchangeInvite{}, ErrInviteNotFound
	}
	if err != nil {
		return apitypes.ExchangeInvite{}, fmt.Errorf("get invite: %w", err)
	}
	if state.Declined {
		return apitypes.ExchangeInvite{}, ErrInviteDeclined
	}
	if state.Revoked {
		return revoked, nil
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return apitypes.ExchangeInvite{}, fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx)
	q := s.queries.WithTx(tx)

	updated, err := q.RevokeInvite(ctx, db.RevokeInviteParams{
		ExchangeID: exchangeID,
		Email:      email,
	})
	if err != nil {
		return apitypes.ExchangeInvite{}, fmt.Errorf("revoke invite: %w", err)
	}
	if updated == 0 {
		return apitypes.ExchangeInvite{}, ErrInviteNotFound
	}
	if state.Accepted {
		if err := removeMember(ctx, q, exchangeID, email); err != nil {
			return apitypes.ExchangeInvite{}, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return apitypes.ExchangeInvite{}, fmt.Errorf("commit: %w", err)
	}
	return revoked, nil
}

func (s *Service) AcceptRequestedInvite(ctx context.Context, exchangeID, userID, requestedEmail string) error {
	if err := s.requireOrganizer(ctx, userID, exchangeID); err != nil {
		return err
	}

	email, err := auth.NormalizeEmail(requestedEmail)
	if err != nil {
		return ErrInvalidEmail
	}

	state, err := s.queries.GetInviteState(ctx, db.GetInviteStateParams{
		ExchangeID: exchangeID,
		Email:      email,
	})

	if errors.Is(err, pgx.ErrNoRows) {
		return ErrInviteNotFound
	}

	if err != nil {
		return fmt.Errorf("get invite: %w", err)
	}

	if state.Accepted {
		return ErrAlreadyJoined
	}

	if state.Declined {
		return ErrInviteDeclined
	}

	if state.Revoked {
		return ErrInviteRevoked
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx)
	q := s.queries.WithTx(tx)

	updated, err := q.AcceptRequestedInvite(ctx, db.AcceptRequestedInviteParams{
		ExchangeID: exchangeID,
		Email:      email,
	})
	if err != nil {
		return fmt.Errorf("accept invite: %w", err)
	}
	if updated == 0 {
		return ErrInviteNotFound
	}
	added, err := q.InsertExchangeMemberByEmail(ctx, db.InsertExchangeMemberByEmailParams{
		ExchangeID: exchangeID,
		Email:      email,
	})
	if err != nil {
		return fmt.Errorf("add member: %w", err)
	}
	if added == 0 {
		return fmt.Errorf("add member: no account for this email")
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit: %w", err)
	}
	return nil
}

func (s *Service) UserSetExchangeInvite(ctx context.Context, exchangeID, userID, userEmail string, accepted bool) error {
	email, err := auth.NormalizeEmail(userEmail)
	if err != nil {
		return ErrInvalidEmail
	}

	state, err := s.queries.GetInviteState(ctx, db.GetInviteStateParams{
		ExchangeID: exchangeID,
		Email:      email,
	})

	if errors.Is(err, pgx.ErrNoRows) {
		return ErrInviteNotFound
	}

	if err != nil {
		return fmt.Errorf("get invite: %w", err)
	}

	if state.Accepted {
		return ErrAlreadyJoined
	}

	if state.Declined {
		return ErrInviteDeclined
	}

	if state.Revoked {
		return ErrInviteRevoked
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx)
	q := s.queries.WithTx(tx)

	if accepted {
		updated, err := q.AcceptInvite(ctx, db.AcceptInviteParams{
			ExchangeID: exchangeID,
			Email:      email,
		})
		if err != nil {
			return fmt.Errorf("accept invite: %w", err)
		}
		if updated == 0 {
			return ErrInviteNotFound
		}
		if err := q.InsertExchangeMember(ctx, db.InsertExchangeMemberParams{
			ExchangeID: exchangeID,
			UserID:     userID,
		}); err != nil {
			return fmt.Errorf("add member: %w", err)
		}
	} else {
		updated, err := q.DeclineInvite(ctx, db.DeclineInviteParams{
			ExchangeID: exchangeID,
			Email:      email,
		})
		if err != nil {
			return fmt.Errorf("decline invite: %w", err)
		}
		if updated == 0 {
			return ErrInviteNotFound
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit: %w", err)
	}
	return nil
}

func (s *Service) UserRequestExchangeInvite(ctx context.Context, exchangeID, userID, rawEmail string) error {
	email, err := auth.NormalizeEmail(rawEmail)
	if err != nil {
		return ErrInvalidEmail
	}

	organizerID, err := s.queries.GetExchangeOrganizerID(ctx, exchangeID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("get exchange: %w", err)
	}
	if err == nil && organizerID == userID {
		return ErrInviteSelf
	}

	state, err := s.queries.GetInviteState(ctx, db.GetInviteStateParams{
		ExchangeID: exchangeID,
		Email:      email,
	})
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("get invite: %w", err)
	}
	if err == nil && state.Accepted {
		return ErrAlreadyJoined
	}

	if err = s.queries.InsertExchangeInviteRequested(ctx, db.InsertExchangeInviteRequestedParams{
		ExchangeID: exchangeID,
		Email:      email,
	}); err != nil {
		return fmt.Errorf("insert invite request: %w", err)
	}

	return nil
}

func removeMember(ctx context.Context, q *db.Queries, exchangeID, email string) error {
	memberID, err := q.GetUserIDByEmail(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("get member: %w", err)
	}
	if err := q.DeleteMemberAssignments(ctx, db.DeleteMemberAssignmentsParams{
		ExchangeID: exchangeID,
		UserID:     memberID,
	}); err != nil {
		return fmt.Errorf("delete assignments: %w", err)
	}
	if err := q.DeleteExchangeMember(ctx, db.DeleteExchangeMemberParams{
		ExchangeID: exchangeID,
		UserID:     memberID,
	}); err != nil {
		return fmt.Errorf("delete member: %w", err)
	}
	return nil
}

func (s *Service) sendInvite(ctx context.Context, email, exchangeName string) {
	inviteURL := s.baseURL + "/dashboard"
	if err := s.mailer.SendInvite(ctx, email, exchangeName, inviteURL); err != nil {
		log.Printf("send invite to %s: %v", email, err)
	}
}

// membersByExchange looks up the members of several exchanges at once so that
// listing exchanges stays a fixed number of queries. IsOrganizer is left to the
// caller, which knows the organizer of each exchange.
func (s *Service) membersByExchange(ctx context.Context, exchangeIDs []string) (map[string][]apitypes.ExchangeMember, error) {
	byExchange := map[string][]apitypes.ExchangeMember{}
	if len(exchangeIDs) == 0 {
		return byExchange, nil
	}

	rows, err := s.queries.ListMembersForExchanges(ctx, exchangeIDs)
	if err != nil {
		return nil, fmt.Errorf("list members: %w", err)
	}
	for _, row := range rows {
		byExchange[row.ExchangeID] = append(byExchange[row.ExchangeID], apitypes.ExchangeMember{
			UserID:      row.UserID,
			Email:       row.Email,
			DisplayName: row.DisplayName,
		})
	}
	return byExchange, nil
}

// exchangeFromRow leaves Members unset; callers fill it from membersByExchange.
func exchangeFromRow(row db.GetExchangeForUserRow) apitypes.Exchange {
	return apitypes.Exchange{
		ID:           row.ID,
		OrganizerID:  row.OrganizerID,
		Name:         row.Name,
		Description:  row.ExchangeDescription,
		ExchangeDate: row.ExchangeDate,
		BudgetCents:  intPtr(row.ExchangeBudgetCents),
		State:        apitypes.ExchangeState(row.State),
	}
}

func intPtr(v *int32) *int {
	if v == nil {
		return nil
	}
	n := int(*v)
	return &n
}

func int32Ptr(v *int) *int32 {
	if v == nil {
		return nil
	}
	n := int32(*v)
	return &n
}

// withOrganizer flags the organizer and guarantees a non-nil slice so the field
// serializes as [] rather than null.
func withOrganizer(members []apitypes.ExchangeMember, organizerID string) []apitypes.ExchangeMember {
	flagged := make([]apitypes.ExchangeMember, 0, len(members))
	for _, member := range members {
		member.IsOrganizer = member.UserID == organizerID
		flagged = append(flagged, member)
	}
	return flagged
}

func (s *Service) CreateExchange(ctx context.Context, organizerID string, req apitypes.CreateExchangeRequest) (apitypes.Exchange, error) {
	name := strings.TrimSpace(req.Name)
	if len([]rune(name)) < 2 {
		return apitypes.Exchange{}, ErrInvalidName
	}
	description := strings.TrimSpace(req.Description)
	date, err := time.Parse("2006-01-02", strings.TrimSpace(req.ExchangeDate))
	if err != nil {
		return apitypes.Exchange{}, ErrInvalidDate
	}
	if req.BudgetCents != nil && *req.BudgetCents < 0 {
		return apitypes.Exchange{}, ErrInvalidBudget
	}

	token, err := newInviteToken()
	if err != nil {
		return apitypes.Exchange{}, fmt.Errorf("generate invite token: %w", err)
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return apitypes.Exchange{}, fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx)
	q := s.queries.WithTx(tx)

	id, err := q.InsertExchange(ctx, db.InsertExchangeParams{
		OrganizerID:  organizerID,
		Name:         name,
		ExchangeDate: date.Format("2006-01-02"),
		State:        string(apitypes.ExchangeStateDraft),
		InviteToken:  token,
		Description:  description,
		BudgetCents:  int32Ptr(req.BudgetCents),
	})
	if err != nil {
		return apitypes.Exchange{}, fmt.Errorf("insert exchange: %w", err)
	}

	if err := q.InsertExchangeMember(ctx, db.InsertExchangeMemberParams{
		ExchangeID: id,
		UserID:     organizerID,
	}); err != nil {
		return apitypes.Exchange{}, fmt.Errorf("insert organizer membership: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return apitypes.Exchange{}, fmt.Errorf("commit: %w", err)
	}

	return s.GetExchangeById(ctx, organizerID, id)
}

func (s *Service) UpdateExchange(ctx context.Context, exchangeID, organizerID string, req apitypes.UpdateExchangeRequest) (apitypes.Exchange, error) {
	name := strings.TrimSpace(req.Name)
	if len([]rune(name)) < 2 {
		return apitypes.Exchange{}, ErrInvalidName
	}
	description := strings.TrimSpace(req.Description)
	date, err := time.Parse("2006-01-02", strings.TrimSpace(req.ExchangeDate))
	if err != nil {
		return apitypes.Exchange{}, ErrInvalidDate
	}
	if req.BudgetCents != nil && *req.BudgetCents < 0 {
		return apitypes.Exchange{}, ErrInvalidBudget
	}

	updated, err := s.queries.UpdateExchange(ctx, db.UpdateExchangeParams{
		ID:           exchangeID,
		OrganizerID:  organizerID,
		Name:         name,
		Description:  description,
		ExchangeDate: date.Format("2006-01-02"),
		BudgetCents:  int32Ptr(req.BudgetCents),
	})
	if err != nil {
		return apitypes.Exchange{}, fmt.Errorf("update exchange: %w", err)
	}
	if updated == 0 {
		return apitypes.Exchange{}, ErrNotFound
	}

	return s.GetExchangeById(ctx, organizerID, exchangeID)
}

func (s *Service) DeleteExchange(ctx context.Context, exchangeID, userID string) error {
	deleted, err := s.queries.DeleteExchange(ctx, db.DeleteExchangeParams{
		ID:          exchangeID,
		OrganizerID: userID,
	})
	if err != nil {
		return fmt.Errorf("delete exchange: %w", err)
	}
	if deleted == 0 {
		return ErrNotFound
	}
	return nil
}

func newInviteToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
