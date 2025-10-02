package router

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/K1la/comment-tree/internal/api/handler"
	"github.com/wb-go/wbf/ginext"
)

func New(handler *handler.Handler) *ginext.Engine {
	e := ginext.New()
	e.Use(ginext.Recovery(), ginext.Logger())

	// API routes first
	api := e.Group("/api/comments")
	{
		api.POST("/", handler.CreateComment)
		api.GET("/", handler.GetCommentTree) // use query params ?parent=&search=&limit=&offset
		api.GET("/:id", handler.GetCommentList)
		api.GET("/", handler.DeleteComment)
	}

	// Frontend: serve files from ./web without conflicting wildcard
	e.NoRoute(func(c *ginext.Context) {
		if c.Request.URL.Path == "/" {
			http.ServeFile(c.Writer, c.Request, "./web/index.html")
			return
		}
		safe := filepath.Clean("." + c.Request.URL.Path)
		filePath := filepath.Join("./web", safe)
		if fi, err := os.Stat(filePath); err == nil && !fi.IsDir() {
			http.ServeFile(c.Writer, c.Request, filePath)
			return
		}
		c.Status(http.StatusNotFound)
	})

	return e
}
