import pytest


@pytest.mark.smoke
@pytest.mark.skip(reason="Deferred until P0-2: real timesheet import is implemented")
def test_upload_timesheet_results_visible_in_views() -> None:
    pass
