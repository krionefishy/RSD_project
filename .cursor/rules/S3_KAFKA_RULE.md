# S3 через Kafka

## Жесткое правило

Все загрузки в S3 и все удаления из S3 выполняются только через Kafka-события. Напрямую к S3
можно ходить только за GET объекта или GET-ссылкой.

HTTP handlers, use cases, сервисы домена и микросервисы не вызывают `s3_client.put_object`,
`s3_client.delete_object`, `delete_objects` или другие S3 mutation-методы напрямую. Единственное
место, где разрешены реальные S3 upload/delete-запросы, - Kafka consumer, подписанный на
конкретный S3 topic.

Единственный прямой доступ к S3 из бизнес-кода - GET-сценарий: скачать объект или выдать
presigned GET-ссылку на объект. Прямые `PUT`, `DELETE`, `HEAD`, `LIST`, проверки существования
файла и обходы bucket/prefix из use case/API запрещены. Если такая проверка кажется нужной, ее
нужно заменить бизнесовым состоянием в БД или отдельным асинхронным процессом.

## Почему так

S3 upload/delete - внешний сетевой side effect. Для пользовательского HTTP-запроса нам не нужен
результат этого side effect:

- если файл есть, delete eventually удалит его;
- если publish прошел, upload eventually загрузит файл;
- пользовательский запрос не должен ждать долгий S3 round-trip;
- временная деградация S3 не должна ломать бизнесовую транзакцию;
- повторная обработка delete безопасна, потому что удаление отсутствующего объекта считается
нормальным итогом;
- повторный upload по тому же ключу должен быть идемпотентным и перезаписывать тот же объект.

## Правильный поток upload

1. Use case валидирует права, входные данные и размер файла.
2. Use case детерминированно формирует будущий `s3_file_key`.
3. Use case записывает бизнесовую БД или БД микросервиса с этим `s3_file_key`.
4. Use case публикует Kafka-событие в предметный topic.
5. HTTP-ответ возвращается без ожидания S3.
6. Отдельный Kafka consumer получает событие и вызывает `s3_client.put_object`.

## Правильный поток delete

1. Use case находит запись в БД и сохраняет текущий `s3_file_key` в локальную переменную.
2. Use case удаляет или обновляет запись в БД.
3. После успешного commit use case публикует Kafka-событие delete.
4. HTTP-ответ возвращается без ожидания S3.
5. Отдельный Kafka consumer получает событие и вызывает `s3_client.delete_object`.

Delete должен быть best-effort и идемпотентным. Если файла уже нет, это не бизнесовая ошибка.

## Topics

Имена topics должны быть предметными:

```text
storage.s3.<domain>.<action>
```

Примеры:

```text
storage.s3.avatar.upload
storage.s3.material_attachment.upload
storage.s3.material_attachment.delete
storage.s3.timesheet.upload
storage.s3.timesheet_schedule.upload
```

Не использовать один общий topic вроде `s3.file.save.requested` для всех доменов. Под каждое
действие нужен отдельный consumer, даже если внутри он вызывает общий helper.

## Payload upload

```json
{
  "key": "timesheets/20260613153000_schedule.xlsx",
  "content_base64": "...",
  "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "metadata": {
    "location_id": "123"
  },
  "original_filename": "schedule.xlsx"
}
```

## Payload delete

```json
{
  "key": "materials/10/manual.pdf",
  "metadata": {
    "material_id": "10",
    "attachment_id": "55"
  }
}
```

## Правила реализации

- `s3_file_key` создается до publish и сохраняется в БД.
- Kafka publish не должен ждать результата S3.
- Consumer логирует ошибки и offset; бизнесовый request уже завершен.
- В payload не передаются секреты S3.
- `content_base64` допустим для текущих небольших файлов. Для больших файлов нужно отдельное
  решение: staging storage, chunking или прямой presigned upload с отдельным подтверждением.
- В тестах use case проверяется через опубликованное Kafka-событие, а не через mock S3 upload.
- Поиск нарушений:

```bash
rg -n "await .*s3_client\\.(put_object|delete_object)|\\.put_object\\(|\\.delete_object\\(" backend/app backend/report_service/app backend/shared
```

В норме совпадения должны быть только внутри `backend/shared/kafka_streams/subscribers/`.
