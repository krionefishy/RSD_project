# Configuration (`backend/shared/settings/`)

Единый YAML для backend и микросервисов. Путь задаётся через `CONFIG_PATH`.

| Файл | Назначение |
|------|------------|
| `config.yaml.example` | Полный шаблон |
| `config.test.yaml` | pytest |
| `config.demo.yaml` | Demo seed |
| `config.docker.yaml` | Docker Compose (вшит в образ) |

Локально:

```bash
cp backend/shared/settings/config.yaml.example backend/shared/settings/config.yaml
CONFIG_PATH=backend/shared/settings/config.yaml just dev
```

Продакшен: `just deploy-secrets` → `backend/shared/settings/config.production.yaml`.
