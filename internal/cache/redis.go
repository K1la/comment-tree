package cache

import (
	"context"
	"os"
	"time"

	"github.com/K1la/comment-tree/internal/config"

	"github.com/wb-go/wbf/redis"
)

type Redis struct {
	client *redis.Client
}

func New(cfg config.Redis) *Redis {
	password := os.Getenv("REDIS_PASSWORD")

	client := redis.New(
		cfg.Host+":"+cfg.Port,
		password,
		0,
	)

	return &Redis{
		client: client,
	}
}

func (r *Redis) Get(key string) (string, error) {
	return r.client.Get(context.Background(), key)
}

func (r *Redis) Set(key string, val any) error {
	return r.client.SetEX(context.Background(), key, val, 24*time.Hour).Err()
}

func (r *Redis) Delete(key string) error {
	return r.client.Del(context.Background(), key).Err()
}
