package handler

import (
	"errors"
	"fmt"
	"github.com/K1la/comment-tree/internal/api/response"
	"github.com/K1la/comment-tree/internal/model"
	"github.com/K1la/comment-tree/internal/repository"
	"github.com/google/uuid"
	"github.com/wb-go/wbf/ginext"
	"github.com/wb-go/wbf/zlog"
	"net/http"
)

func (h *Handler) CreateComment(c *ginext.Context) {
	var req CreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		zlog.Logger.Error().Err(err).Msg("failed to decode request body")
		response.BadRequest(c.Writer, fmt.Errorf("decode req body error: %s", err.Error()))
		return
	}

	zlog.Logger.Debug().Msgf("json decode req: %+v", req)

	var parentID *uuid.UUID
	if req.ParentID == nil {
		parentID = nil
	} else {
		parentID = req.ParentID
	}

	comm := model.Comment{
		ParentID: parentID,
		Content:  req.Content,
	}

	zlog.Logger.Debug().Msgf("create comment: %+v", comm)

	res, err := h.service.CreateComment(c.Request.Context(), &comm)
	if err != nil {
		zlog.Logger.Error().Err(err).Msg("create comment error")
		response.BadRequest(c.Writer, fmt.Errorf("create comment error: %s", err.Error()))
		return
	}

	zlog.Logger.Debug().Msgf("create comment success: %+v", res)

	response.Created(c.Writer, res)
}

func (h *Handler) DeleteComment(c *ginext.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		zlog.Logger.Warn().Msg("parent id is required")
		response.BadRequest(c.Writer, fmt.Errorf("parent id is required"))
		return
	}
	id, err := uuid.Parse(idStr)
	if err != nil {
		zlog.Logger.Error().Err(err).Msg("failed to parse parent id")
		response.BadRequest(c.Writer, fmt.Errorf("invalid parent id"))
		return
	}

	err = h.service.DeleteComment(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrCommentNotFound) {
			zlog.Logger.Error().Err(err).Msg("comment not found")
			response.Fail(c.Writer, http.StatusNotFound, err)
			return
		}

		zlog.Logger.Error().Err(err).Msg("failed to delete comment")
		response.Internal(c.Writer, err)
		return
	}

	response.OK(c.Writer, "comment deleted")
}
