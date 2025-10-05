package handler

import (
	"errors"
	"fmt"
	"github.com/K1la/comment-tree/internal/api/response"
	"github.com/K1la/comment-tree/internal/repository"

	"github.com/google/uuid"
	"github.com/wb-go/wbf/ginext"
	"github.com/wb-go/wbf/zlog"
	"net/http"
	"strconv"
)

func (h *Handler) GetCommentList(c *ginext.Context) {
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

	comments, err := h.service.GetCommentsByParentID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrCommentNotFound) {
			zlog.Logger.Error().Err(err).Msg("comment not found")
			response.Fail(c.Writer, http.StatusNotFound, fmt.Errorf("comment not found"))
		}

		zlog.Logger.Error().Err(err).Msg("failed to get comments")
		response.Internal(c.Writer, fmt.Errorf("failed to get comments"))
		return
	}

	response.JSON(c.Writer, http.StatusOK, comments)
}

// Comments with pagination, sorting, and optional search.
func (h *Handler) GetCommentTree(c *ginext.Context) {
	parentIDStr := c.Query("parent")
	var parentID *uuid.UUID
	if parentIDStr != "" {
		id, err := uuid.Parse(parentIDStr)
		if err != nil {
			zlog.Logger.Error().Err(err).Msg("failed to parse parent id")
			response.Fail(c.Writer, http.StatusBadRequest, fmt.Errorf("invalid parent id"))
			return
		}
		parentID = &id
	}

	search := c.Query("search")
	zlog.Logger.Debug().Str("search", search).Msg("search param")
	sort := c.DefaultQuery("sort", "created_at_asc")

	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}
	zlog.Logger.Debug().Str("parentID", parentIDStr).Str("search", search).Str("sort", sort).Int("limit", limit).Int("offset", offset).Msg("query params")

	comments, err := h.service.GetComments(c.Request.Context(), parentID, search, sort, limit, offset)
	if err != nil {
		if errors.Is(err, repository.ErrCommentNotFound) {
			zlog.Logger.Error().Err(err).Msg("comment not found")
			//response.Fail(c.Writer, http.StatusNotFound, fmt.Errorf("no comments found"))
			response.JSON(c.Writer, http.StatusAccepted, comments)
			return
		}

		zlog.Logger.Error().Err(err).Msg("failed to get comments")
		response.Internal(c.Writer, fmt.Errorf("failed to get comments"))
		return
	}
	zlog.Logger.Debug().Interface("comments", comments).Msg("get comments")
	response.OK(c.Writer, comments)
	//response.JSON(c.Writer, http.StatusOK, comments)
}
