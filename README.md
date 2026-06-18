# RSD

Корпоративная система обучения, HR-учёта и продаж: обучение, тестирование, рейтинги, отчёты, кадровые процессы.

## Роли

| Роль | Описание |
|---|---|
| `super_admin` | Суперадминистратор — управление root-администраторами |
| `root_admin` | Админ ПО — управление аккаунтами и ролями |
| `admin_staff` | Админ персонала — сотрудники, точки, графики |
| `admin_education` | Админ обучения — курсы, тесты, отчёты |
| `admin_sales` | Админ продаж |
| `manager` | Менеджер блока — рейтинги, прогресс обучения |
| `seller` | Продавец — обучение, тесты, рейтинги |

---

## Домены

| Домен | Стек |
|---|---|
| `rsdobin.ru` | Продакшен (`prod` ветка) |
| `rsdobin.online` | Демо (`demo1-partial-mock` ветка) |

---

## Быстрый старт — деплой на сервер с нуля

### 1. Требования на сервере

```bash
# Docker
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# just
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to /usr/local/bin

# git (обычно уже есть)
apt-get install -y git
```

### 2. Клонировать репозиторий

```bash
git clone git@github.com:krionefishy/RSD_project.git /opt/rsd
cd /opt/rsd
```

### 3. Выбрать ветку

```bash
# Продакшен (rsdobin.ru + rsdobin.online — оба работают вместе)
git checkout prod

# Или только демо-ветка
git checkout demo1-partial-mock
```

### 4. Сгенерировать секреты для прода

Создаёт `backend/shared/settings/config.production.yaml` с рандомными JWT-секретами.
Для демо этого делать не нужно — используется `config.docker.yaml` из репо.

```bash
just deploy-secrets
```

> Сохрани вывод команды — там будут JWT-секреты. Повторная генерация создаст новые ключи и разлогинит всех пользователей.

### 5. Настроить DNS

В личном кабинете регистратора прописать A-записи:

```
rsdobin.ru    A  →  <IP сервера>
rsdobin.online A  →  <IP сервера>
```

Подождать 5–30 минут и проверить:

```bash
dig rsdobin.ru +short      # должен вернуть IP сервера
dig rsdobin.online +short   # то же
```

### 6. Создать Docker-сеть для gateway

```bash
just gateway-network
```

### 7. Получить SSL-сертификаты (Let's Encrypt)

```bash
# Запустить HTTP-only gateway для прохождения ACME challenge
just gateway-init

# Получить сертификат для rsdobin.ru
just gateway-certonly-prod

# Получить сертификат для rsdobin.online
just gateway-certonly-demo

# Остановить временный HTTP gateway и запустить полноценный с HTTPS
just gateway-ssl-activate
```

Сертификаты сохраняются в `deploy/certbot/conf/` и действуют 90 дней.
Для продления: `just gateway-renew`.

### 8. Запустить все стеки одной командой

```bash
just all
```

Команда последовательно:
1. Создаёт `rsd_gateway` Docker-сеть (если нет)
2. Собирает и поднимает **prod** стек (`rsdobin.ru`) — ждёт healthy
3. Собирает и поднимает **demo** стек (`rsdobin.online`) — ждёт healthy
4. Заливает демо-данные в prod

После этого оба домена доступны по HTTPS.

---

## Управление стеками

### Запустить только прод или только демо

```bash
just prod    # остановит всё → поднимет prod → зальёт данные
just demo1   # остановит всё → поднимет demo1
```

### Статус и логи

```bash
# Прод
just deploy-prod-status
just deploy-prod-logs              # все сервисы
just deploy-prod-logs backend      # только backend
just deploy-prod-logs nginx        # только nginx

# Демо
just deploy-demo1-status
just deploy-demo1-logs
just deploy-demo1-logs backend

# Gateway
just gateway-status
just gateway-logs
```

### Остановить

```bash
just deploy-down-all   # остановить prod + demo (gateway остаётся)
just gateway-down      # остановить gateway
```

### Пересобрать после обновления кода

```bash
git pull origin prod   # обновить код
just all               # пересобрать и перезапустить
```

Или только один стек:

```bash
just deploy-prod-rebuild    # пересобрать prod без остановки demo
just deploy-demo1-rebuild   # пересобрать demo без остановки prod
```

---

## Конфигурация

| Файл | Где используется | Описание |
|---|---|---|
| `backend/shared/settings/config.production.yaml` | Прод | Генерируется `just deploy-secrets`. **Не коммитится.** |
| `backend/shared/settings/config.docker.yaml` | Демо | В репо, дев-секреты. Не менять. |
| `backend/shared/settings/config.demo.yaml` | Локальный запуск demo1 | В репо. |
| `backend/shared/settings/config.test.yaml` | CI / тесты | В репо. |
| `deploy/certbot/conf/` | Gateway | SSL-сертификаты Let's Encrypt. Не коммитятся. |

---

## Локальная разработка

### Запуск инфраструктуры

```bash
just infra-up      # Postgres + Redis + Kafka + MinIO
just db-migrate    # применить миграции
```

### Запуск backend

```bash
just install       # установить зависимости (нужно один раз)
just backend       # backend с hot-reload на :8000
```

### Demo 1 полностью локально (одна команда)

```bash
just demo1-local
```

Поднимает инфру, мигрирует БД, сидирует данные, запускает backend и UI.

### Тесты

```bash
just test                    # все тесты
just test-k "test_name"      # конкретный тест по имени
just test-cov                # с coverage-отчётом
```

### Полный список команд

```bash
just          # или just --list
```

---

## Архитектура

```
Интернет :80/:443
    ↓
Gateway Nginx (rsd-gateway)
    ├── rsdobin.ru    → rsd-prod-nginx   → frontend / backend / report_service
    └── rsdobin.online → rsd-demo1-nginx → frontend_demos / backend / report_service

Docker-сети:
  rsd_gateway      — shared, соединяет gateway с nginx обоих стеков
  rsd-prod-proxy   — prod: nginx ↔ frontend ↔ backend
  rsd-prod-internal — prod: backend ↔ db ↔ redis ↔ kafka ↔ minio ↔ report_service
  rsd-demo1-proxy  — demo: аналогично
  rsd-demo1-internal — demo: аналогично
```

### Сервисы prod/demo стека

| Сервис | Описание |
|---|---|
| `nginx` | Внутренний роутер: `/api/v1/` → backend, `/` → frontend |
| `frontend` | React PWA (Vite → nginx) |
| `backend` | FastAPI — основной бэкенд |
| `report_service` | FastAPI — микросервис отчётов, XLSX-генерация |
| `db` | PostgreSQL 15 — основная БД (primary) |
| `db_replica` | PostgreSQL 15 — реплика для отчётов (read-only) |
| `report_db` | PostgreSQL 15 — БД микросервиса отчётов |
| `redis` | Redis 7 — кэш и очереди |
| `kafka` | Apache Kafka — события S3-загрузок |
| `minio` | MinIO — S3-совместимое хранилище файлов |
