package server

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mwritter/giftexchanger/services/api/internal/apitypes"
	"github.com/mwritter/giftexchanger/services/api/internal/exchanges"
)

func (s *Server) getExchanges(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)

	result, err := s.exchanges.GetExchanges(r.Context(), user.ID)
	if writeServiceError(w, err, "could not list exchanges") {
		return
	}

	writeJSON(w, http.StatusOK, apitypes.ListExchangesResponse{
		Exchanges: result,
	})
}

func (s *Server) getExchange(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)

	result, err := s.exchanges.GetExchangeById(r.Context(), user.ID, chi.URLParam(r, "exchangeID"))
	if writeServiceError(w, err, "could not get exchange") {
		return
	}

	writeJSON(w, http.StatusOK, result)
}

func (s *Server) getUserExchangeInvites(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)

	result, err := s.exchanges.GetUserExchangeInvites(r.Context(), user.ID)
	if writeServiceError(w, err, "could not list invites") {
		return
	}

	writeJSON(w, http.StatusOK, apitypes.ListUserExchangeInvite{
		Invites: result,
	})
}

func (s *Server) getExchangeInvites(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)

	result, err := s.exchanges.GetExchangeInvites(r.Context(), user.ID, chi.URLParam(r, "exchangeID"))
	if writeServiceError(w, err, "could not list invites",
		withMessage(exchanges.ErrForbidden, "only the organizer can see invites"),
	) {
		return
	}

	writeJSON(w, http.StatusOK, apitypes.ListExchangeInvitesResponse{
		Invites: result,
	})
}

func (s *Server) createExchange(w http.ResponseWriter, r *http.Request) {
	var req apitypes.CreateExchangeRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	user := currentUser(r)
	result, err := s.exchanges.CreateExchange(r.Context(), user.ID, req)
	if writeServiceError(w, err, "could not create exchange") {
		return
	}

	writeJSON(w, http.StatusCreated, result)
}

func (s *Server) updateExchange(w http.ResponseWriter, r *http.Request) {
	var req apitypes.UpdateExchangeRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	user := currentUser(r)
	result, err := s.exchanges.UpdateExchange(r.Context(), chi.URLParam(r, "exchangeID"), user.ID, req)
	if writeServiceError(w, err, "could not update exchange") {
		return
	}

	writeJSON(w, http.StatusOK, result)
}

func (s *Server) deleteExchange(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)

	err := s.exchanges.DeleteExchange(r.Context(), chi.URLParam(r, "exchangeID"), user.ID)
	if writeServiceError(w, err, "could not delete exchange") {
		return
	}

	writeJSON(w, http.StatusOK, apitypes.StatusResponse{Status: "ok"})
}

func (s *Server) addExchangeInvite(w http.ResponseWriter, r *http.Request) {
	var req apitypes.ExchangeInviteRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	user := currentUser(r)
	invite, created, err := s.exchanges.AddExchangeInvite(r.Context(), user.ID, user.Email, chi.URLParam(r, "exchangeID"), req.Email)
	if writeServiceError(w, err, "could not add invite",
		withMessage(exchanges.ErrForbidden, "only the organizer can invite people"),
		withMessage(exchanges.ErrInviteSelf, "You can't invite yourself"),
	) {
		return
	}

	status := http.StatusOK
	if created {
		status = http.StatusCreated
	}
	writeJSON(w, status, invite)
}

func (s *Server) revokeExchangeInvite(w http.ResponseWriter, r *http.Request) {
	var req apitypes.ExchangeInviteRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	user := currentUser(r)
	invite, err := s.exchanges.RevokeExchangeInvite(r.Context(), user.ID, user.Email, chi.URLParam(r, "exchangeID"), req.Email)
	if writeServiceError(w, err, "could not revoke invite",
		withMessage(exchanges.ErrForbidden, "only the organizer can revoke invites"),
		withMessage(exchanges.ErrInviteSelf, "You can't remove yourself"),
	) {
		return
	}

	writeJSON(w, http.StatusOK, invite)
}

func (s *Server) acceptExchangeInvite(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)

	err := s.exchanges.UserSetExchangeInvite(r.Context(), chi.URLParam(r, "exchangeID"), user.ID, user.Email, true)

	if writeServiceError(w, err, "could not accept invite",
		withMessage(exchanges.ErrAlreadyJoined, "You have already joined"),
		withMessage(exchanges.ErrInviteDeclined, "You already declined this invite"),
	) {
		return
	}

	writeJSON(w, http.StatusOK, nil)
}
func (s *Server) declineExchangeInvite(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)

	err := s.exchanges.UserSetExchangeInvite(r.Context(), chi.URLParam(r, "exchangeID"), user.ID, user.Email, false)

	if writeServiceError(w, err, "could not decline invite",
		withMessage(exchanges.ErrAlreadyJoined, "You have already joined"),
		withMessage(exchanges.ErrInviteDeclined, "You already declined this invite"),
	) {
		return
	}

	writeJSON(w, http.StatusOK, nil)

}
