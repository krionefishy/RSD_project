"""Generate weekly demo timesheet files for all seed locations.

Usage:
    python backend/scripts/generate_seed_timesheet_files.py
"""

from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill, Side, Border


OUTPUT_DIR = Path(__file__).resolve().parents[2] / "docs" / "demo" / "timesheets"
START_DATE = date(2026, 7, 1)
DAY_NAMES = ["Ср", "Чт", "Пт", "Сб", "Вс", "Пн", "Вт"]
HEADER_FILL = PatternFill("solid", fgColor="E8F5E9")
THIN_BORDER = Border(
    left=Side(style="thin", color="D9E2EC"),
    right=Side(style="thin", color="D9E2EC"),
    top=Side(style="thin", color="D9E2EC"),
    bottom=Side(style="thin", color="D9E2EC"),
)


FILES = [
    {
        "filename": "timesheet_point_1_2026-07-01_2026-07-07.xlsx",
        "point_name": "Точка 1",
        "point_code": "POINT-1",
        "shift_1": "05:00-13:30",
        "shift_2": "13:30-22:00",
        "employees": [
            {"code": "seller_anna_001", "name": "Смирнова А.", "shifts": ["С1", "С2", "В", "С1", "С1", "В", "С2"]},
            {"code": "seller_kirill_001", "name": "Захаров К.", "shifts": ["С2", "В", "С1", "С2", "В", "С2", "С1"]},
        ],
    },
    {
        "filename": "timesheet_point_2_2026-07-01_2026-07-07.xlsx",
        "point_name": "Точка 2",
        "point_code": "POINT-2",
        "shift_1": "05:00-13:30",
        "shift_2": "13:30-22:00",
        "employees": [
            {"code": "seller_maria_001", "name": "Петрова М.", "shifts": ["С1", "В", "С2", "С1", "С2", "В", "С1"]},
            {"code": "seller_ivan_001", "name": "Козлов И.", "shifts": ["С2", "С1", "В", "С2", "В", "С1", "С2"]},
        ],
    },
    {
        "filename": "timesheet_point_3_2026-07-01_2026-07-07.xlsx",
        "point_name": "Точка 3",
        "point_code": "POINT-3",
        "shift_1": "05:00-13:30",
        "shift_2": "13:30-22:00",
        "employees": [
            {"code": "seller_denis_001", "name": "Лукин Д.", "shifts": ["С1", "С2", "В", "С1", "В", "С2", "С1"]},
        ],
    },
    {
        "filename": "timesheet_point_4_2026-07-01_2026-07-07.xlsx",
        "point_name": "Точка 4",
        "point_code": "POINT-4",
        "shift_1": "06:00-14:00",
        "shift_2": "14:00-22:00",
        "employees": [
            {"code": "seller_svetlana_001", "name": "Морозова С.", "shifts": ["С1", "В", "С2", "С1", "С2", "В", "С1"]},
            {"code": "seller_olga_001", "name": "Крылова О.", "shifts": ["С2", "С1", "В", "С2", "В", "С2", "С2"]},
        ],
    },
]


def build_workbook(spec: dict) -> Workbook:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "График"
    sheet.sheet_view.showGridLines = False

    sheet["A1"] = "Название точки"
    sheet["B1"] = spec["point_name"]
    sheet["A2"] = "Идентификатор точки"
    sheet["B2"] = spec["point_code"]
    sheet["A4"] = "Период"
    sheet["B4"] = "01.07.2026-07.07.2026"
    sheet["A5"] = "С1"
    sheet["B5"] = spec["shift_1"]
    sheet["A6"] = "С2"
    sheet["B6"] = spec["shift_2"]

    sheet["A8"] = "Дата"
    sheet["B8"] = "День"

    for index, employee in enumerate(spec["employees"], start=3):
        sheet.cell(row=8, column=index, value=employee["code"])
        sheet.cell(row=9, column=index, value=employee["name"])

    for offset in range(7):
        row = 10 + offset
        work_date = START_DATE + timedelta(days=offset)
        sheet.cell(row=row, column=1, value=work_date.strftime("%d.%m.%Y"))
        sheet.cell(row=row, column=2, value=DAY_NAMES[offset])
        for employee_index, employee in enumerate(spec["employees"], start=3):
            sheet.cell(row=row, column=employee_index, value=employee["shifts"][offset])

    for row in (8, 9):
        for col in range(1, len(spec["employees"]) + 3):
            cell = sheet.cell(row=row, column=col)
            cell.font = Font(bold=True, color="1E293B")
            cell.fill = HEADER_FILL
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = THIN_BORDER

    for row in range(8, 17):
        for col in range(1, len(spec["employees"]) + 3):
            sheet.cell(row=row, column=col).border = THIN_BORDER

    for row in range(1, 7):
        for col in range(1, 3):
            sheet.cell(row=row, column=col).border = THIN_BORDER
        sheet.cell(row=row, column=1).font = Font(bold=True, color="1E293B")

    sheet.freeze_panes = "A10"
    sheet.column_dimensions["A"].width = 14
    sheet.column_dimensions["B"].width = 10
    for index in range(len(spec["employees"])):
        sheet.column_dimensions[chr(ord("C") + index)].width = 22

    return workbook


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for spec in FILES:
        workbook = build_workbook(spec)
        workbook.save(OUTPUT_DIR / spec["filename"])
    print(OUTPUT_DIR)


if __name__ == "__main__":
    main()
