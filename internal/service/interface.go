package service

import (
	"context"
	"github.com/K1la/comment-tree/internal/model"
	"github.com/google/uuid"
)

type RepositoryI interface {
	CreateComment(context.Context, *model.Comment) (*model.Comment, error)
	GetCommentsByParentID(context.Context, uuid.UUID) ([]model.Comment, error)
	GetComments(ctx context.Context, parentID *uuid.UUID, search, sort string, limit, offset int) ([]model.Comment, error)
	DeleteComment(ctx context.Context, id uuid.UUID) error
}
