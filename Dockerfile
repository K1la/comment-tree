FROM golang:1.24.2-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o comment-tree ./cmd/comment-tree

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /app/comment-tree ./comment-tree
COPY --from=builder /app/env ./env
COPY --from=builder /app/.env ./.env
COPY --from=builder /app/web ./web
EXPOSE 8080
CMD ["./comment-tree"]

