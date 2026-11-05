-- +goose Up
-- Revoked is the organizer's response, distinct from the invitee accepting or declining.
ALTER TABLE exchange_invites
    ADD COLUMN revoked_at TIMESTAMPTZ;

ALTER TABLE exchange_invites
    DROP CONSTRAINT exchange_invites_single_response_check;

ALTER TABLE exchange_invites
    ADD CONSTRAINT exchange_invites_single_response_check CHECK (
        (accepted_at IS NOT NULL)::int
        + (declined_at IS NOT NULL)::int
        + (revoked_at IS NOT NULL)::int <= 1
    );

-- +goose Down
ALTER TABLE exchange_invites
    DROP CONSTRAINT exchange_invites_single_response_check;

ALTER TABLE exchange_invites
    ADD CONSTRAINT exchange_invites_single_response_check CHECK (
        accepted_at IS NULL OR declined_at IS NULL
    );

ALTER TABLE exchange_invites
    DROP COLUMN revoked_at;
