package service

import (
	"context"
	"github.com/K1la/comment-tree/internal/model"
	"github.com/google/uuid"
)

func (s *Service) CreateComment(ctx context.Context, comment *model.Comment) (*model.Comment, error) {
	return s.repo.CreateComment(ctx, comment)
}

func (s *Service) GetCommentsByParentID(ctx context.Context, parentID uuid.UUID) ([]model.Comment, error) {
	return s.repo.GetCommentsByParentID(ctx, parentID)
}

func (s *Service) GetComments(ctx context.Context, parentID *uuid.UUID, search, sort string, limit, offset int) ([]model.Comment, error) {
	return s.repo.GetComments(ctx, parentID, search, sort, limit, offset)
}

func (s *Service) DeleteComment(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteComment(ctx, id)
}
