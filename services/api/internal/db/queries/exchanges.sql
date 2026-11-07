-- Exchange IDs from the URL are compared as text so a malformed ID reads as
-- "not found" instead of a uuid parse error.

-- name: ListExchangesForUser :many
SELECT
    e.id,
    e.organizer_id,
    e.name,
    e.exchange_description,
    COALESCE(to_char(e.exchange_date, 'YYYY-MM-DD'), '')::text AS exchange_date,
    e.exchange_budget_cents,
    e.state
FROM exchanges e
JOIN exchange_members mine
    ON mine.exchange_id = e.id AND mine.user_id = sqlc.arg(user_id)
ORDER BY e.created_at DESC;

-- name: GetUserExchangeInvites :many
-- Pending invites only: accepted, declined, and revoked are all unset.
SELECT
    e.id,
    e.organizer_id,
    e.name,
    e.exchange_description,
    COALESCE(to_char(e.exchange_date, 'YYYY-MM-DD'), '')::text AS exchange_date,
    e.exchange_budget_cents,
    e.state,
    u.display_name AS organizer_name,
    u.email AS organizer_email
FROM exchanges e
JOIN exchange_invites invite
    ON invite.exchange_id = e.id
JOIN users invitee
    ON lower(invitee.email) = lower(invite.email)
JOIN users u
    ON u.id = e.organizer_id
WHERE invitee.id = sqlc.arg(user_id)
    AND invite.accepted_at IS NULL
    AND invite.declined_at IS NULL
    AND invite.revoked_at IS NULL
    AND invite.requested_at IS NULL
ORDER BY invite.created_at;

-- name: GetExchangeForUser :one
SELECT
    e.id,
    e.organizer_id,
    e.name,
    e.exchange_description,
    COALESCE(to_char(e.exchange_date, 'YYYY-MM-DD'), '')::text AS exchange_date,
    e.exchange_budget_cents,
    e.state
FROM exchanges e
JOIN exchange_members mine
    ON mine.exchange_id = e.id AND mine.user_id = sqlc.arg(user_id)
WHERE e.id::text = sqlc.arg(exchange_id)::text;

-- name: GetExchangeOrganizerID :one
SELECT organizer_id FROM exchanges WHERE id::text = sqlc.arg(exchange_id)::text;

-- name: GetExchangeJoinPreview :one
-- Enough for someone holding a join link to recognize the exchange.
-- budget, members stay off this read.
SELECT
    e.name,
    COALESCE(to_char(e.exchange_date, 'YYYY-MM-DD'), '')::text AS exchange_date,
    e.exchange_description,
    u.display_name AS organizer_name,
    u.email AS organizer_email
FROM exchanges e
JOIN users u ON u.id = e.organizer_id
WHERE e.id::text = sqlc.arg(exchange_id)::text;

-- name: ListMembersForExchanges :many
SELECT m.exchange_id, u.id AS user_id, u.email, u.display_name
FROM exchange_members m
JOIN users u ON u.id = m.user_id
WHERE m.exchange_id::text = ANY(sqlc.arg(exchange_ids)::text[])
ORDER BY m.created_at, lower(u.email);

-- name: InsertExchange :one
INSERT INTO exchanges (
    organizer_id, name, exchange_date, state, invite_token,
    exchange_description, exchange_budget_cents
)
VALUES (
    sqlc.arg(organizer_id),
    sqlc.arg(name),
    (sqlc.arg(exchange_date)::text)::date,
    sqlc.arg(state),
    sqlc.arg(invite_token),
    sqlc.arg(description),
    sqlc.narg(budget_cents)
)
RETURNING id;

-- name: InsertExchangeMember :exec
INSERT INTO exchange_members (exchange_id, user_id)
VALUES (sqlc.arg(exchange_id), sqlc.arg(user_id));

-- name: InsertExchangeMemberByEmail :execrows
-- Inserts the account for this email. Zero rows means that account does not exist.
INSERT INTO exchange_members (exchange_id, user_id)
SELECT sqlc.arg(exchange_id)::uuid, u.id
FROM users u
WHERE lower(u.email) = sqlc.arg(email);

-- name: InsertExchangeInvite :exec
INSERT INTO exchange_invites (exchange_id, email)
VALUES (sqlc.arg(exchange_id), sqlc.arg(email));

-- name: InsertExchangeInviteRequested :exec
-- First request records requested_at. A repeat for the same exchange and email
-- is a no-op so the original timestamp stays put. The id is matched as text so
-- a malformed id inserts nothing instead of raising a uuid error.
INSERT INTO exchange_invites (exchange_id, email, requested_at)
SELECT e.id, sqlc.arg(email), now()
FROM exchanges e
WHERE e.id::text = sqlc.arg(exchange_id)::text
ON CONFLICT (exchange_id, lower(email)) DO NOTHING;

-- name: UpdateExchange :execrows
UPDATE exchanges
SET name = sqlc.arg(name),
    exchange_description = sqlc.arg(description),
    exchange_date = (sqlc.arg(exchange_date)::text)::date,
    exchange_budget_cents = sqlc.narg(budget_cents),
    updated_at = now()
WHERE id::text = sqlc.arg(id)::text AND organizer_id = sqlc.arg(organizer_id);

-- name: ListInviteStates :many
SELECT
    lower(email)::text AS email,
    (accepted_at IS NOT NULL)::bool AS accepted,
    (declined_at IS NOT NULL)::bool AS declined,
    (revoked_at IS NOT NULL)::bool AS revoked,
    (requested_at IS NOT NULL)::bool AS requested
FROM exchange_invites
WHERE exchange_id::text = sqlc.arg(exchange_id)::text;

-- name: GetInviteState :one
SELECT
    lower(email)::text AS email,
    (accepted_at IS NOT NULL)::bool AS accepted,
    (declined_at IS NOT NULL)::bool AS declined,
    (revoked_at IS NOT NULL)::bool AS revoked,
    (requested_at IS NOT NULL)::bool AS requested
FROM exchange_invites
WHERE exchange_id::text = sqlc.arg(exchange_id)::text
    AND lower(email) = sqlc.arg(email);

-- name: ReopenInvite :exec
UPDATE exchange_invites
SET declined_at = NULL,
    revoked_at = NULL
WHERE exchange_id::text = sqlc.arg(exchange_id)::text
    AND lower(email) = sqlc.arg(email)
    AND accepted_at IS NULL;

-- name: RevokeInvite :execrows
-- Organizer revoked invite
UPDATE exchange_invites
SET accepted_at = NULL,
    revoked_at = now()
WHERE exchange_id::text = sqlc.arg(exchange_id)::text
    AND lower(email) = sqlc.arg(email)
    AND declined_at IS NULL
    AND revoked_at IS NULL;

-- name: AcceptInvite :execrows
-- Users can only accept an invite that is not set yet
UPDATE exchange_invites
SET accepted_at = now()
WHERE exchange_id::text = sqlc.arg(exchange_id)::text
    AND lower(email) = sqlc.arg(email)
    AND accepted_at IS NULL
    AND declined_at IS NULL
    AND revoked_at IS NULL
    AND requested_at IS NULL;

-- name: AcceptRequestedInvite :execrows
-- Organizer can only accept requested invites
UPDATE exchange_invites
SET accepted_at = now()
WHERE exchange_id::text = sqlc.arg(exchange_id)::text
    AND lower(email) = sqlc.arg(email)
    AND accepted_at IS NULL
    AND declined_at IS NULL
    AND revoked_at IS NULL
    AND requested_at IS NOT NULL;

-- name: DeclineInvite :execrows
-- User can decline an invite, Organizers revoke
UPDATE exchange_invites
SET declined_at = now()
WHERE exchange_id::text = sqlc.arg(exchange_id)::text
    AND lower(email) = sqlc.arg(email)
    AND accepted_at IS NULL
    AND declined_at IS NULL
    AND revoked_at IS NULL;

-- name: GetUserIDByEmail :one
SELECT id FROM users WHERE lower(email) = sqlc.arg(email);

-- name: DeleteMemberAssignments :exec
DELETE FROM assignments
WHERE exchange_id::text = sqlc.arg(exchange_id)::text
    AND (giver_id = sqlc.arg(user_id) OR recipient_id = sqlc.arg(user_id));

-- name: DeleteExchangeMember :exec
DELETE FROM exchange_members
WHERE exchange_id::text = sqlc.arg(exchange_id)::text
    AND user_id = sqlc.arg(user_id);

-- name: DeleteExchange :execrows
DELETE FROM exchanges
WHERE id::text = sqlc.arg(id)::text AND organizer_id = sqlc.arg(organizer_id);
