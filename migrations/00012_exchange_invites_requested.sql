-- +goose Up
-- Requested is the a user requesting to join an exchange from a join link.
ALTER TABLE exchange_invites
    ADD COLUMN requested_at TIMESTAMPTZ;


-- +goose Down
ALTER TABLE exchange_invites
    DROP COLUMN requested_at;