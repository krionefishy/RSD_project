#!/usr/bin/env python3
"""Generate a timesheet schedule xlsx for one demo location (upload-ready)."""

from __future__ import annotations

import calendar
import sys
from datetime import date
from pathlib import Path

from openpyxl import load_workbook

TEMPLATE = Path(__file__).resolve().parents[1] / ".." / "Downloads/shablon_grafika_1_tochka-2.xlsx"
if not TEMPLATE.exists():
    TEMPLATE = Path("/Users/dmitrii/Downloads/shablon_grafika_1_tochka-2.xlsx")

OUTPUT_DIR = Path(__file__).resolve().parent / "output"

MONTH_NAMES_RU = {
    1: "Январь",
    2: "Февраль",
    3: "Март",
    4: "Апрель",
    5: "Май",
    6: "Июнь",
    7: "Июль",
    8: "Август",
    9: "Сентябрь",
    10: "Октябрь",
    11: "Ноябрь",
    12: "Декабрь",
}

DAY_NAMES_RU = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"]

# Точка 1 — сотрудники из seed_demo
LOCATION = {
    "name": "Точка 1",
    "code": "POINT-1",
    "address": "Москва, ул. Первая, 10",
    "hours": "05:00-22:00",
    "s1": "05:00-13:30",
    "s2": "13:30-22:00",
}

EMPLOYEES = [
    ("seller_anna_001", "Смирнова А.А."),
    ("seller_kirill_001", "Захаров К.К."),
]

def _shift_for_day(day_index: int, employee_index: int) -> str:
    if day_index % 7 == 6:
        return "В"
    if employee_index == 0:
        return "С1" if day_index % 2 == 0 else "С2"
    return "С2" if day_index % 2 == 0 else "С1"


def generate(year: int, month: int, output_path: Path) -> None:
    if not TEMPLATE.exists():
        raise FileNotFoundError(f"Template not found: {TEMPLATE}")

    wb = load_workbook(TEMPLATE)
    ws = wb["График"] if "График" in wb.sheetnames else wb.active

    ws["B1"] = LOCATION["name"]
    ws["B2"] = LOCATION["code"]
    ws["B3"] = LOCATION["address"]
    ws["B4"] = f"{MONTH_NAMES_RU[month]} {year}"
    ws["F1"] = LOCATION["hours"]
    ws["F2"] = LOCATION["s1"]
    ws["F3"] = LOCATION["s2"]
    ws["F4"] = "В"
    ws["F5"] = "О/Б"

    header_row = 7
    name_row = 8
    data_start_row = 9

    for col_offset, (code, name) in enumerate(EMPLOYEES):
        col = 3 + col_offset  # C=3
        ws.cell(row=header_row, column=col, value=code)
        ws.cell(row=name_row, column=col, value=name)

    # Очистить лишние колонки сотрудников из шаблона
    max_col = 12
    for col in range(3 + len(EMPLOYEES), max_col):
        for row in range(header_row, data_start_row + 31):
            ws.cell(row=row, column=col, value="")

    days_in_month = calendar.monthrange(year, month)[1]
    for day in range(1, days_in_month + 1):
        row = data_start_row + day - 1
        work_date = date(year, month, day)
        weekday = DAY_NAMES_RU[work_date.weekday()]
        ws.cell(row=row, column=1, value=work_date.isoformat())
        ws.cell(row=row, column=2, value=weekday)
        for employee_index in range(len(EMPLOYEES)):
            ws.cell(row=row, column=3 + employee_index, value=_shift_for_day(day - 1, employee_index))

    # Очистить хвост шаблона (лишние дни)
    template_days = 31
    for extra_day in range(days_in_month + 1, template_days + 1):
        row = data_start_row + extra_day - 1
        for col in range(1, max_col):
            ws.cell(row=row, column=col, value="")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(output_path)


def main() -> None:
    year = int(sys.argv[1]) if len(sys.argv) > 1 else 2026
    month = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    output = OUTPUT_DIR / f"grafik_{LOCATION['code']}_{year}-{month:02d}.xlsx"
    generate(year, month, output)
    print(output)


if __name__ == "__main__":
    main()
