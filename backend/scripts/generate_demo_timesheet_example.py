"""Generate a demo timesheet .xlsx file compatible with the current parser.

Usage:
    python -m backend.scripts.generate_demo_timesheet_example
"""

from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font


OUTPUT_PATH = Path(__file__).resolve().parents[2] / "docs" / "demo" / "demo_timesheet_metro_july_2026.xlsx"


def build_demo_workbook() -> Workbook:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "График"

    sheet["A1"] = "Название точки"
    sheet["B1"] = "ТЦ Метрополис"
    sheet["A2"] = "Идентификатор точки"
    sheet["B2"] = "MSK-METRO"
    sheet["A4"] = "Период"
    sheet["B4"] = "01.07.2026-07.07.2026"
    sheet["A5"] = "С1"
    sheet["B5"] = "05:00-13:30"
    sheet["A6"] = "С2"
    sheet["B6"] = "13:30-22:00"

    sheet["A8"] = "Дата"
    sheet["B8"] = "День"
    sheet["C8"] = "seller_anna_001"
    sheet["D8"] = "seller_kirill_001"
    sheet["C9"] = "Иванова А."
    sheet["D9"] = "Захаров К."

    rows = [
        ("С1", "С2"),
        ("С2", "В"),
        ("В", "С1"),
        ("С1", "С2"),
        ("С1", "В"),
        ("В", "С2"),
        ("С2", "С1"),
    ]
    start = date(2026, 7, 1)
    day_names = ["Ср", "Чт", "Пт", "Сб", "Вс", "Пн", "Вт"]

    for index, (anna_shift, kirill_shift) in enumerate(rows, start=10):
        work_date = start + timedelta(days=index - 10)
        sheet[f"A{index}"] = work_date.strftime("%d.%m.%Y")
        sheet[f"B{index}"] = day_names[index - 10]
        sheet[f"C{index}"] = anna_shift
        sheet[f"D{index}"] = kirill_shift

    for cell in sheet["8:8"] + sheet["9:9"]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")

    sheet.column_dimensions["A"].width = 14
    sheet.column_dimensions["B"].width = 10
    sheet.column_dimensions["C"].width = 20
    sheet.column_dimensions["D"].width = 20
    return workbook


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    workbook = build_demo_workbook()
    workbook.save(OUTPUT_PATH)
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
