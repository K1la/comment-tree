package handler

import (
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type Handler struct {
	service ServiceI
	valid   *validator.Validate
}

func New(s ServiceI, v *validator.Validate) *Handler {
	return &Handler{service: s, valid: v}
}

type CreateRequest struct {
	ParentID *uuid.UUID `json:"parent_id"`
	Content  string     `json:"content" binding:"required,min=1,max=800"`
}
