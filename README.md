# CommentTree

Современный сервис древовидных комментариев с веб‑интерфейсом, полнотекстовым поиском и каскадным удалением.

- Backend: Go (Gin via `github.com/wb-go/wbf/ginext`), PostgreSQL
- Frontend: Чистый HTML/CSS/JS (модульная архитектура)
- Контейнеризация: Docker/Docker Compose, миграции через Goose

## Быстрый старт

### Запуск в Docker
```bash
docker compose up --build
```



## Архитектура проекта

```
internal/
  api/
    handler/      # HTTP‑хендлеры (POST/GET/DELETE)
    response/     # Обёртки JSON‑ответов (Success/Error)
    router/       # Маршрутизация Gin
    server/       # Инициализация сервера
  config/         # Загрузка конфигурации
  model/          # Доменные модели (Comment)
  repository/     # Доступ к БД (PostgreSQL)
  service/        # Бизнес‑логика (тонкая над репозиторием)
web/
  index.html      # UI
  styles/         # Стили
  js/             # Модули фронтенда: api-client, app, model, renderer, modal
migrations/       # Goose‑миграции
```

- `internal/api/router/router.go` — регистрирует REST‑роуты и отдаёт статику из `web/`.
- `internal/api/handler/*` — принимает запросы, валидирует входные данные, вызывает сервис.
- `internal/service/*` — проксирует в репозиторий, слой для бизнес‑правил.
- `internal/repository/*` — SQL и доступ к PostgreSQL.
- `web/js/*` — SPA‑логика рендера дерева, поиск, пагинация, модалки.

## Схема БД
Таблица `comments` (см. `migrations/20251004165058_create_comments_table.sql`):

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `parent_id UUID NULL` — родитель (null для корневых)
- `content TEXT NOT NULL`
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

Индексы:
- `parent_id`, `created_at`, `updated_at`
- GIN индекс полнотекстового поиска по `content` с конфигурацией `russian`

Триггер для авто‑обновления `updated_at` при UPDATE.

## API
Базовый URL: `http://localhost:8080`

### Форматы ответов
- Успех:
```json
{"result": <payload>}
```
- Ошибка:
```json
{"message": "описание ошибки"}
```

### Создать комментарий
POST `/api/comments`

Body:
```json
{
  "content": "string",
  "parent_id": "uuid|null"
}
```

Успех 201:
```json
{
  "result": {
    "id": "uuid",
    "parent_id": "uuid|null",
    "content": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

Ошибки: 400 (валидация), 500.

### Получить список комментариев (дерево/лента)
GET `/api/comments`

Query params:
- `parent` — UUID родителя (необязательно). Если задан, фильтрует по поддереву родителя.
- `search` — строка поиска. Поддерживается полнотекстовый поиск и частичные совпадения (`ILIKE %...%`). Для UUID планируется поиск по `id` (если передан корректный UUID).
- `sort` — `created_at_desc` (по умолчанию), `created_at_asc`, `updated_at_desc`, `updated_at_asc`
- `limit` — по умолчанию 10
- `offset` — по умолчанию 0

Успех 200:
```json
{
  "result": [
    {
      "id": "uuid",
      "parent_id": "uuid|null",
      "content": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

Пустой результат может вернуться как 202 или 200 (в текущей реализации `GetCommentTree` при отсутствии результатов отвечает 202 с пустым массивом, см. `internal/api/handler/get.go`). Рекомендуется унифицировать под 200 с `result: []`.

Ошибки: 400 (невалидный `parent`), 500.

### Получить поддерево по ID
GET `/api/comments/:id`

Возвращает узел‑родителя и всех его потомков (рекурсивно).

Успех 200:
```json
{
  "result": [ { "id": "uuid", "parent_id": null, ... }, { "id": "uuid", "parent_id": "...", ... } ]
}
```

Ошибки: 400 (невалидный UUID), 404 (если такого комментария нет), 500.

### Удалить комментарий (и все вложенные)
DELETE `/api/comments/:id`

Успех 200:
```json
{"result": "comment deleted"}
```

Ошибки: 400 (невалидный UUID), 404 (не найден), 500.

## Поиск
- Полнотекстовый поиск по `content` (PostgreSQL `to_tsvector('russian', content) @@ plainto_tsquery('russian', $1)`).
- Частичные совпадения: `content ILIKE '%query%'`.
- Можно комбинировать с `parent`, `sort`, `limit/offset`.

## Фронтенд (web)
- Кнопка “Показать все” очищает поиск и загружает первые N комментариев.
- Поиск отправляет `search=...` в `/api/comments`.
- Комментарии визуализируются древовидно, вложенные `parent_id` рендерятся как ответы.
- Удаление подтверждается модальным окном и каскадно удаляет ответы.

## Конфигурация
- Переменные окружения читаются Docker Compose’ом и в Go (`internal/repository/repository.go` собирает DSN).
- Пример переменных: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `GOOSE_*`, `REDIS_PASSWORD`.

## Сборка
Dockerfile — многоступенчатая сборка:
- `golang:1.24.2-alpine` → билд бинарника `comment-tree`
- `alpine:3.20` → минимальный рантайм образ
