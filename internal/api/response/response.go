package response

import (
	"encoding/json"
	"net/http"

	"github.com/wb-go/wbf/zlog"
)

type Success struct {
	Result interface{} `json:"result"`
}

type Error struct {
	Message string `json:"message"`
}

func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		zlog.Logger.Error().Err(err).Interface("data", data).Msg("failed to encode JSON response")
	}
}

func Created(w http.ResponseWriter, result interface{}) {
	JSON(w, http.StatusCreated, Success{Result: result})
}

func OK(w http.ResponseWriter, result interface{}) {
	JSON(w, http.StatusOK, Success{Result: result})
}

func Internal(w http.ResponseWriter, err error) {
	JSON(w, http.StatusInternalServerError, Error{Message: err.Error()})
}

func BadRequest(w http.ResponseWriter, err error) {
	JSON(w, http.StatusBadRequest, Error{Message: err.Error()})
}

func Fail(w http.ResponseWriter, status int, err error) {
	JSON(w, status, Error{Message: err.Error()})
}
