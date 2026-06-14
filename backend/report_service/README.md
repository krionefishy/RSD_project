# report_service

Микросервис отчетов отвечает за хранение metadata загруженных файлов, отправку S3 upload/delete через Kafka и парсинг файлов.

## Табель-графики

Endpoint:

```text
POST /api/v1/reports/timesheet-schedules/parse
Content-Type: multipart/form-data
Authorization: Bearer <service-jwt>
```

Поля формы:

- `file` - `.xlsx`;
- `point_identifier` - идентификатор точки;
- `point_name` - название точки;
- `period_from`, `period_to` - границы периода.

В БД report service хранится только информация о файле:

- `source_filename`;
- `file_extension`;
- `content_type`;
- `size_bytes`;
- `s3_file_key`;
- `uploaded_at`;
- `parse_status` enum: `pending`, `processing`, `completed`, `failed`.

На выход основному приложению возвращаются бизнесовые строки расписания:

```text
point_identifier
employee_code
employee_name
work_date
shift_code
starts_at
ends_at
worked_hours
```

В строках расписания нет `status`, `source_upload_id`, `report_job_id` или `s3_file_key`.

`shift_code` enum:

```text
С1
С2
В
О/Б
```

Для `С1`/`С2` `starts_at`, `ends_at` и `worked_hours` считаются из расшифровки смен в файле. Для `В` и `О/Б` время пустое, `worked_hours = 0`.

## S3

S3 upload/delete выполняются только через Kafka topics `storage.s3.<domain>.<action>`.

Для табель-графика используется:

```text
storage.s3.timesheet_schedule.upload
```

Прямой доступ к S3 из бизнес-кода допустим только для GET/presigned GET.
