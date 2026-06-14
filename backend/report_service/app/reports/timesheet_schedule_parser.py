import re
import zipfile
from datetime import date, datetime, timedelta
from decimal import Decimal
from io import BytesIO
from xml.etree import ElementTree as ET

from app.reports.domain import (
    ShiftCode,
    TimesheetScheduleEntry,
    TimesheetScheduleParseError,
    TimesheetSchedulePayload,
)

NS_MAIN = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
NS_REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
NS_PACKAGE_REL = "{http://schemas.openxmlformats.org/package/2006/relationships}"

SUPPORTED_CODES = {"С1", "С2", "В", "О/Б"}
TIME_INTERVAL_RE = re.compile(r"^\d{2}:\d{2}-\d{2}:\d{2}$")


class TimesheetScheduleParserError(ValueError):
    pass


def parse_timesheet_schedule_payload(filename: str, content: bytes) -> TimesheetSchedulePayload:
    workbook = _read_xlsx(content)
    sheet_name = "График" if "График" in workbook else next(iter(workbook), None)
    if sheet_name is None:
        raise TimesheetScheduleParserError("Workbook has no worksheets")

    rows = workbook[sheet_name]
    if not rows:
        raise TimesheetScheduleParserError("Worksheet is empty")

    point_name = _cell(rows, 0, 1) or ""
    point_identifier = _cell(rows, 1, 1) or ""
    period = _cell(rows, 3, 1)
    if not point_name or not point_identifier:
        raise TimesheetScheduleParserError(
            "Point header must contain name in B1 and identifier in B2"
        )

    shifts = _read_shifts(rows)
    header_index = _find_schedule_header(rows)
    employee_codes = rows[header_index][2:]
    employee_names = rows[header_index + 1][2:] if len(rows) > header_index + 1 else []

    employee_columns: list[tuple[int, str, str]] = []
    for offset, code in enumerate(employee_codes, start=2):
        if not code:
            continue
        name = employee_names[offset - 2] if offset - 2 < len(employee_names) else ""
        employee_columns.append((offset, code, name))

    if not employee_columns:
        raise TimesheetScheduleParserError("No employee columns found in schedule matrix")

    entries: list[TimesheetScheduleEntry] = []
    errors: list[TimesheetScheduleParseError] = []

    for row_index in range(header_index + 2, len(rows)):
        row = rows[row_index]
        raw_date = row[0] if row else None
        work_date = _normalize_date(raw_date)
        if work_date is None:
            continue

        daily_shift_counts = {"С1": 0, "С2": 0}
        for col_index, employee_code, employee_name in employee_columns:
            value = _normalize_code(row[col_index] if col_index < len(row) else None)
            if not value:
                continue
            column_name = _column_name(col_index + 1)

            if TIME_INTERVAL_RE.match(value):
                errors.append(
                    TimesheetScheduleParseError(
                        row=row_index + 1,
                        column=column_name,
                        message="Explicit time intervals are not supported; use С1, С2, В or О/Б",
                    )
                )
                continue
            if value not in SUPPORTED_CODES:
                errors.append(
                    TimesheetScheduleParseError(
                        row=row_index + 1,
                        column=column_name,
                        message=f"Unsupported schedule code: {value}",
                    )
                )
                continue

            shift = shifts.get(value)
            if value in daily_shift_counts:
                daily_shift_counts[value] += 1
            if value in {"С1", "С2"} and shift is None:
                errors.append(
                    TimesheetScheduleParseError(
                        row=row_index + 1,
                        column=column_name,
                        message=f"Shift {value} has no time interval in point header",
                    )
                )
                continue
            starts_at = shift["starts_at"] if shift else None
            ends_at = shift["ends_at"] if shift else None
            entries.append(
                TimesheetScheduleEntry(
                    work_date=work_date,
                    employee_code=employee_code,
                    employee_name=employee_name,
                    shift_code=ShiftCode(value),
                    starts_at=starts_at,
                    ends_at=ends_at,
                    worked_hours=_worked_hours(starts_at, ends_at),
                )
            )

        for shift_code, count in daily_shift_counts.items():
            if count > 1:
                errors.append(
                    TimesheetScheduleParseError(
                        row=row_index + 1,
                        column=None,
                        message=f"Only one employee per point can work {shift_code} on one date",
                    )
                )

    return TimesheetSchedulePayload(
        filename=filename,
        size_bytes=len(content),
        point_identifier=point_identifier,
        point_name=point_name,
        period=period,
        shifts=shifts,
        entries=entries,
        errors=errors,
    )


def _read_xlsx(content: bytes) -> dict[str, list[list[str | None]]]:
    with zipfile.ZipFile(BytesIO(content)) as archive:
        shared_strings = _read_shared_strings(archive)
        workbook_root = ET.fromstring(archive.read("xl/workbook.xml"))
        rels_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        rel_targets = {
            rel.attrib["Id"]: rel.attrib["Target"]
            for rel in rels_root.findall(f"{NS_PACKAGE_REL}Relationship")
        }
        result = {}
        sheets = workbook_root.find(f"{NS_MAIN}sheets")
        if sheets is None:
            return result
        for sheet in sheets.findall(f"{NS_MAIN}sheet"):
            name = sheet.attrib["name"]
            rel_id = sheet.attrib[f"{NS_REL}id"]
            target = rel_targets[rel_id].lstrip("/")
            path = target if target.startswith("xl/") else f"xl/{target}"
            result[name] = _read_sheet(archive, path, shared_strings)
        return result


def _read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    values = []
    for si in root.findall(f"{NS_MAIN}si"):
        parts = [node.text or "" for node in si.iter(f"{NS_MAIN}t")]
        values.append("".join(parts))
    return values


def _read_sheet(
    archive: zipfile.ZipFile,
    path: str,
    shared_strings: list[str],
) -> list[list[str | None]]:
    root = ET.fromstring(archive.read(path))
    rows: list[list[str | None]] = []
    sheet_data = root.find(f"{NS_MAIN}sheetData")
    if sheet_data is None:
        return rows

    for row_node in sheet_data.findall(f"{NS_MAIN}row"):
        row_index = int(row_node.attrib["r"]) - 1
        while len(rows) <= row_index:
            rows.append([])
        row = rows[row_index]
        for cell in row_node.findall(f"{NS_MAIN}c"):
            ref = cell.attrib.get("r", "")
            col_index = _column_index(ref)
            while len(row) <= col_index:
                row.append(None)
            row[col_index] = _cell_value(cell, shared_strings)
    return rows


def _cell_value(cell: ET.Element, shared_strings: list[str]) -> str | None:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        text = cell.find(f"{NS_MAIN}is/{NS_MAIN}t")
        return _clean(text.text if text is not None else None)

    value = cell.find(f"{NS_MAIN}v")
    if value is None or value.text is None:
        return None
    if cell_type == "s":
        return _clean(shared_strings[int(value.text)])
    return _clean(value.text)


def _read_shifts(rows: list[list[str | None]]) -> dict[str, dict[str, str]]:
    shifts: dict[str, dict[str, str]] = {}
    for row in rows[:8]:
        for index, cell in enumerate(row):
            code = _normalize_code(cell)
            if code in {"С1", "С2"} and index + 1 < len(row):
                interval = _clean(row[index + 1])
                if interval and "-" in interval:
                    starts_at, ends_at = [part.strip() for part in interval.split("-", 1)]
                    shifts[code] = {"starts_at": starts_at, "ends_at": ends_at}
    return shifts


def _find_schedule_header(rows: list[list[str | None]]) -> int:
    for index, row in enumerate(rows):
        if _normalize_code(row[0] if len(row) > 0 else None) == "ДАТА" and (
            _normalize_code(row[1] if len(row) > 1 else None) == "ДЕНЬ"
        ):
            return index
    raise TimesheetScheduleParserError("Schedule header row with Дата/День was not found")


def _normalize_date(value: str | None) -> str | None:
    value = _clean(value)
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%d.%m.%Y"):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            pass
    try:
        serial = int(float(value))
    except ValueError:
        return None
    return (date(1899, 12, 30) + timedelta(days=serial)).isoformat()


def _normalize_code(value: str | None) -> str:
    return (_clean(value) or "").replace("C", "С").upper()


def _worked_hours(starts_at: str | None, ends_at: str | None) -> Decimal:
    if starts_at is None or ends_at is None:
        return Decimal("0")
    start = _parse_time(starts_at)
    end = _parse_time(ends_at)
    minutes = end - start
    if minutes < 0:
        minutes += 24 * 60
    return (Decimal(minutes) / Decimal(60)).quantize(Decimal("0.01"))


def _parse_time(value: str) -> int:
    normalized = "00:00" if value == "24:00" else value
    parsed = datetime.strptime(normalized, "%H:%M")
    if value == "24:00":
        return 24 * 60
    return parsed.hour * 60 + parsed.minute


def _cell(rows: list[list[str | None]], row: int, col: int) -> str | None:
    if row >= len(rows) or col >= len(rows[row]):
        return None
    return _clean(rows[row][col])


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned or None


def _column_index(cell_ref: str) -> int:
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    value = 0
    for ch in letters:
        value = value * 26 + (ord(ch.upper()) - ord("A") + 1)
    return value - 1


def _column_name(index: int) -> str:
    result = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result
