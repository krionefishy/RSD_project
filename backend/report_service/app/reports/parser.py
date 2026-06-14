from app.reports.domain import ParsedReportPayload


def parse_report_payload(filename: str, content: bytes) -> ParsedReportPayload:
    return ParsedReportPayload(
        filename=filename,
        size_bytes=len(content),
    )
