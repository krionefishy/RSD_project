"""add orm check constraints

Revision ID: c7e8f9a1b2d3
Revises: a021ca5c7e72
Create Date: 2026-05-24 12:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "c7e8f9a1b2d3"
down_revision: str | None = "a021ca5c7e72"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # users
    op.create_check_constraint(
        "ck_users_role_valid",
        "users",
        "role IN ('super_admin', 'root_admin', 'admin_staff', 'admin_education', 'admin_sales', 'manager', 'seller')",
    )

    # locations
    op.create_check_constraint(
        "ck_block_members_status_valid",
        "block_members",
        "status IN ('primary', 'reserve')",
    )

    # personnel
    op.create_check_constraint(
        "ck_employee_compensations_base_salary_non_negative",
        "employee_compensations",
        "base_salary >= 0",
    )
    op.create_check_constraint(
        "ck_employee_compensations_hourly_rate_non_negative",
        "employee_compensations",
        "hourly_rate >= 0",
    )
    op.create_check_constraint(
        "ck_employee_compensations_night_rate_non_negative",
        "employee_compensations",
        "night_hourly_rate IS NULL OR night_hourly_rate >= 0",
    )
    op.create_check_constraint(
        "ck_activity_codes_entry_type_valid",
        "activity_codes",
        "entry_type IN ('work', 'absence', 'day_off')",
    )
    op.create_check_constraint(
        "ck_activity_codes_default_hours_non_negative",
        "activity_codes",
        "default_hours IS NULL OR default_hours >= 0",
    )
    op.create_check_constraint(
        "ck_employee_time_entries_hours_non_negative",
        "employee_time_entries",
        "hours >= 0",
    )
    op.create_check_constraint(
        "ck_employee_time_entries_shift_type_valid",
        "employee_time_entries",
        "shift_type IN ('day', 'night', 'none')",
    )
    op.create_check_constraint(
        "ck_employee_earning_events_type_valid",
        "employee_earning_events",
        "earning_type IN ('salary', 'hourly', 'bonus', 'manual')",
    )
    op.create_check_constraint(
        "ck_employee_earning_events_amount_non_negative",
        "employee_earning_events",
        "amount >= 0",
    )
    op.create_check_constraint(
        "ck_employee_earning_events_source_type_valid",
        "employee_earning_events",
        "source_type IS NULL OR source_type IN ('time_entry', 'sales_plan_bonus', 'manual')",
    )
    op.create_check_constraint(
        "ck_employee_earning_events_source_id_requires_type",
        "employee_earning_events",
        "(source_type IS NULL AND source_id IS NULL) OR (source_type IS NOT NULL)",
    )
    op.create_check_constraint(
        "ck_employee_earning_totals_year_valid",
        "employee_earning_totals",
        "year >= 2000",
    )
    op.create_check_constraint(
        "ck_employee_earning_totals_month_valid",
        "employee_earning_totals",
        "month BETWEEN 1 AND 12",
    )
    op.create_check_constraint(
        "ck_employee_earning_totals_salary_non_negative",
        "employee_earning_totals",
        "salary_amount >= 0",
    )
    op.create_check_constraint(
        "ck_employee_earning_totals_hourly_non_negative",
        "employee_earning_totals",
        "hourly_amount >= 0",
    )
    op.create_check_constraint(
        "ck_employee_earning_totals_bonus_non_negative",
        "employee_earning_totals",
        "bonus_amount >= 0",
    )
    op.create_check_constraint(
        "ck_employee_earning_totals_total_non_negative",
        "employee_earning_totals",
        "total_amount >= 0",
    )

    # knowledge base
    op.create_check_constraint(
        "ck_courses_rating_points_non_negative",
        "courses",
        "rating_points >= 0",
    )
    op.create_check_constraint(
        "ck_courses_mrp_non_negative",
        "courses",
        "mrp >= 0",
    )
    op.create_check_constraint(
        "ck_course_users_points_non_negative",
        "course_users",
        "user_points_by_course >= 0",
    )
    op.create_check_constraint(
        "ck_user_course_tests_attempt_positive",
        "user_course_tests",
        "attempt_number > 0",
    )
    op.create_check_constraint(
        "ck_user_course_tests_score_non_negative",
        "user_course_tests",
        "score IS NULL OR score >= 0",
    )
    op.create_check_constraint(
        "ck_user_course_tests_max_score_non_negative",
        "user_course_tests",
        "max_score IS NULL OR max_score >= 0",
    )
    op.create_check_constraint(
        "ck_user_course_tests_score_lte_max",
        "user_course_tests",
        "score IS NULL OR max_score IS NULL OR score <= max_score",
    )
    op.create_check_constraint(
        "ck_tests_time_limit_positive",
        "tests",
        "time_limit_minutes IS NULL OR time_limit_minutes > 0",
    )
    op.create_check_constraint(
        "ck_tests_pass_score_percent_valid",
        "tests",
        "pass_score_percent BETWEEN 0 AND 100",
    )
    op.create_check_constraint(
        "ck_test_tasks_points_positive",
        "test_tasks",
        "points > 0",
    )
    op.create_check_constraint(
        "ck_test_tasks_correct_variant_non_negative",
        "test_tasks",
        "correct_variant >= 0",
    )
    op.create_check_constraint(
        "ck_test_task_assignments_order_non_negative",
        "test_task_assignments",
        '"order" >= 0',
    )

    # sellings
    op.create_check_constraint(
        "ck_employee_sales_plans_period_order",
        "employee_sales_plans",
        "date_from <= date_to",
    )
    op.create_check_constraint(
        "ck_employee_sales_plans_target_quantity_non_negative",
        "employee_sales_plans",
        "target_quantity >= 0",
    )
    op.create_check_constraint(
        "ck_location_sales_plans_target_quantity_non_negative",
        "location_sales_plans",
        "target_quantity >= 0",
    )
    op.create_check_constraint(
        "ck_employee_plan_bonus_rules_from_non_negative",
        "employee_plan_bonus_rules",
        "from_quantity >= 0",
    )
    op.create_check_constraint(
        "ck_employee_plan_bonus_rules_to_gt_from",
        "employee_plan_bonus_rules",
        "to_quantity IS NULL OR to_quantity > from_quantity",
    )
    op.create_check_constraint(
        "ck_employee_plan_bonus_rules_bonus_non_negative",
        "employee_plan_bonus_rules",
        "bonus_per_unit >= 0",
    )
    op.create_check_constraint(
        "ck_sales_import_batches_status_valid",
        "sales_import_batches",
        "status IN ('uploaded', 'processed', 'failed')",
    )
    op.create_check_constraint(
        "ck_sales_import_batches_period_order",
        "sales_import_batches",
        "period_from IS NULL OR period_to IS NULL OR period_from <= period_to",
    )
    op.create_check_constraint(
        "ck_sales_import_batches_receipts_count_non_negative",
        "sales_import_batches",
        "receipts_count >= 0",
    )
    op.create_check_constraint(
        "ck_sales_import_batches_lines_count_non_negative",
        "sales_import_batches",
        "lines_count >= 0",
    )
    op.create_check_constraint(
        "ck_sales_receipts_operation_type_valid",
        "sales_receipts",
        "operation_type IN ('sale', 'return', 'correction')",
    )
    op.create_check_constraint(
        "ck_sales_receipts_total_amount_non_negative",
        "sales_receipts",
        "total_amount >= 0",
    )
    op.create_check_constraint(
        "ck_sales_receipts_total_discount_non_negative",
        "sales_receipts",
        "total_discount >= 0",
    )
    op.create_check_constraint(
        "ck_sales_facts_operation_type_valid",
        "sales_facts",
        "operation_type IN ('sale', 'return', 'correction')",
    )
    op.create_check_constraint(
        "ck_sales_facts_quantity_non_negative",
        "sales_facts",
        "quantity >= 0",
    )
    op.create_check_constraint(
        "ck_sales_facts_gross_amount_non_negative",
        "sales_facts",
        "gross_amount >= 0",
    )
    op.create_check_constraint(
        "ck_sales_facts_discount_amount_non_negative",
        "sales_facts",
        "discount_amount >= 0",
    )
    op.create_check_constraint(
        "ck_sales_facts_net_amount_non_negative",
        "sales_facts",
        "net_amount >= 0",
    )
    op.create_check_constraint(
        "ck_employee_daily_sales_aggregates_quantity_non_negative",
        "employee_daily_sales_aggregates",
        "quantity >= 0",
    )
    op.create_check_constraint(
        "ck_employee_daily_sales_aggregates_net_amount_non_negative",
        "employee_daily_sales_aggregates",
        "net_amount >= 0",
    )
    op.create_check_constraint(
        "ck_employee_daily_sales_aggregates_receipts_count_non_negative",
        "employee_daily_sales_aggregates",
        "receipts_count >= 0",
    )
    op.create_check_constraint(
        "ck_location_daily_sales_aggregates_quantity_non_negative",
        "location_daily_sales_aggregates",
        "quantity >= 0",
    )
    op.create_check_constraint(
        "ck_location_daily_sales_aggregates_net_amount_non_negative",
        "location_daily_sales_aggregates",
        "net_amount >= 0",
    )
    op.create_check_constraint(
        "ck_location_daily_sales_aggregates_receipts_count_non_negative",
        "location_daily_sales_aggregates",
        "receipts_count >= 0",
    )

    # reports
    op.create_check_constraint(
        "ck_rating_snapshots_rating_type_valid",
        "rating_snapshots",
        "rating_type IN ('sales', 'learning')",
    )
    op.create_check_constraint(
        "ck_rating_snapshots_scope_type_valid",
        "rating_snapshots",
        "scope_type IN ('network', 'block', 'location')",
    )
    op.create_check_constraint(
        "ck_rating_snapshots_period_type_valid",
        "rating_snapshots",
        "period_type IN ('day', 'week', 'month', 'custom')",
    )
    op.create_check_constraint(
        "ck_rating_snapshots_period_order",
        "rating_snapshots",
        "period_from <= period_to",
    )
    op.create_check_constraint(
        "ck_rating_snapshots_scope_id_matches_scope_type",
        "rating_snapshots",
        "(scope_type = 'network' AND scope_id IS NULL) OR (scope_type <> 'network' AND scope_id IS NOT NULL)",
    )
    op.create_check_constraint(
        "ck_rating_snapshot_items_rank_positive",
        "rating_snapshot_items",
        "rank > 0",
    )
    op.create_check_constraint(
        "ck_report_exports_scope_type_valid",
        "report_exports",
        "scope_type IN ('network', 'block', 'location', 'user')",
    )
    op.create_check_constraint(
        "ck_report_exports_period_order",
        "report_exports",
        "period_from <= period_to",
    )
    op.create_check_constraint(
        "ck_report_exports_format_valid",
        "report_exports",
        "format IN ('xlsx', 'csv', 'pdf')",
    )
    op.create_check_constraint(
        "ck_report_exports_status_valid",
        "report_exports",
        "status IN ('pending', 'processing', 'completed', 'failed')",
    )
    op.create_check_constraint(
        "ck_report_exports_scope_id_matches_scope_type",
        "report_exports",
        "(scope_type = 'network' AND scope_id IS NULL) OR (scope_type <> 'network' AND scope_id IS NOT NULL)",
    )
    op.create_check_constraint(
        "ck_report_exports_completed_has_file",
        "report_exports",
        "(status = 'completed' AND s3_file_key IS NOT NULL) OR status <> 'completed'",
    )


def downgrade() -> None:
    # reports
    op.drop_constraint("ck_report_exports_completed_has_file", "report_exports", type_="check")
    op.drop_constraint("ck_report_exports_scope_id_matches_scope_type", "report_exports", type_="check")
    op.drop_constraint("ck_report_exports_status_valid", "report_exports", type_="check")
    op.drop_constraint("ck_report_exports_format_valid", "report_exports", type_="check")
    op.drop_constraint("ck_report_exports_period_order", "report_exports", type_="check")
    op.drop_constraint("ck_report_exports_scope_type_valid", "report_exports", type_="check")
    op.drop_constraint("ck_rating_snapshot_items_rank_positive", "rating_snapshot_items", type_="check")
    op.drop_constraint("ck_rating_snapshots_scope_id_matches_scope_type", "rating_snapshots", type_="check")
    op.drop_constraint("ck_rating_snapshots_period_order", "rating_snapshots", type_="check")
    op.drop_constraint("ck_rating_snapshots_period_type_valid", "rating_snapshots", type_="check")
    op.drop_constraint("ck_rating_snapshots_scope_type_valid", "rating_snapshots", type_="check")
    op.drop_constraint("ck_rating_snapshots_rating_type_valid", "rating_snapshots", type_="check")

    # sellings
    op.drop_constraint(
        "ck_location_daily_sales_aggregates_receipts_count_non_negative",
        "location_daily_sales_aggregates",
        type_="check",
    )
    op.drop_constraint(
        "ck_location_daily_sales_aggregates_net_amount_non_negative",
        "location_daily_sales_aggregates",
        type_="check",
    )
    op.drop_constraint(
        "ck_location_daily_sales_aggregates_quantity_non_negative",
        "location_daily_sales_aggregates",
        type_="check",
    )
    op.drop_constraint(
        "ck_employee_daily_sales_aggregates_receipts_count_non_negative",
        "employee_daily_sales_aggregates",
        type_="check",
    )
    op.drop_constraint(
        "ck_employee_daily_sales_aggregates_net_amount_non_negative",
        "employee_daily_sales_aggregates",
        type_="check",
    )
    op.drop_constraint(
        "ck_employee_daily_sales_aggregates_quantity_non_negative",
        "employee_daily_sales_aggregates",
        type_="check",
    )
    op.drop_constraint("ck_sales_facts_net_amount_non_negative", "sales_facts", type_="check")
    op.drop_constraint("ck_sales_facts_discount_amount_non_negative", "sales_facts", type_="check")
    op.drop_constraint("ck_sales_facts_gross_amount_non_negative", "sales_facts", type_="check")
    op.drop_constraint("ck_sales_facts_quantity_non_negative", "sales_facts", type_="check")
    op.drop_constraint("ck_sales_facts_operation_type_valid", "sales_facts", type_="check")
    op.drop_constraint("ck_sales_receipts_total_discount_non_negative", "sales_receipts", type_="check")
    op.drop_constraint("ck_sales_receipts_total_amount_non_negative", "sales_receipts", type_="check")
    op.drop_constraint("ck_sales_receipts_operation_type_valid", "sales_receipts", type_="check")
    op.drop_constraint("ck_sales_import_batches_lines_count_non_negative", "sales_import_batches", type_="check")
    op.drop_constraint("ck_sales_import_batches_receipts_count_non_negative", "sales_import_batches", type_="check")
    op.drop_constraint("ck_sales_import_batches_period_order", "sales_import_batches", type_="check")
    op.drop_constraint("ck_sales_import_batches_status_valid", "sales_import_batches", type_="check")
    op.drop_constraint("ck_employee_plan_bonus_rules_bonus_non_negative", "employee_plan_bonus_rules", type_="check")
    op.drop_constraint("ck_employee_plan_bonus_rules_to_gt_from", "employee_plan_bonus_rules", type_="check")
    op.drop_constraint("ck_employee_plan_bonus_rules_from_non_negative", "employee_plan_bonus_rules", type_="check")
    op.drop_constraint("ck_location_sales_plans_target_quantity_non_negative", "location_sales_plans", type_="check")
    op.drop_constraint("ck_employee_sales_plans_target_quantity_non_negative", "employee_sales_plans", type_="check")
    op.drop_constraint("ck_employee_sales_plans_period_order", "employee_sales_plans", type_="check")

    # knowledge base
    op.drop_constraint("ck_test_task_assignments_order_non_negative", "test_task_assignments", type_="check")
    op.drop_constraint("ck_test_tasks_correct_variant_non_negative", "test_tasks", type_="check")
    op.drop_constraint("ck_test_tasks_points_positive", "test_tasks", type_="check")
    op.drop_constraint("ck_tests_pass_score_percent_valid", "tests", type_="check")
    op.drop_constraint("ck_tests_time_limit_positive", "tests", type_="check")
    op.drop_constraint("ck_user_course_tests_score_lte_max", "user_course_tests", type_="check")
    op.drop_constraint("ck_user_course_tests_max_score_non_negative", "user_course_tests", type_="check")
    op.drop_constraint("ck_user_course_tests_score_non_negative", "user_course_tests", type_="check")
    op.drop_constraint("ck_user_course_tests_attempt_positive", "user_course_tests", type_="check")
    op.drop_constraint("ck_course_users_points_non_negative", "course_users", type_="check")
    op.drop_constraint("ck_courses_mrp_non_negative", "courses", type_="check")
    op.drop_constraint("ck_courses_rating_points_non_negative", "courses", type_="check")

    # personnel
    op.drop_constraint("ck_employee_earning_totals_total_non_negative", "employee_earning_totals", type_="check")
    op.drop_constraint("ck_employee_earning_totals_bonus_non_negative", "employee_earning_totals", type_="check")
    op.drop_constraint("ck_employee_earning_totals_hourly_non_negative", "employee_earning_totals", type_="check")
    op.drop_constraint("ck_employee_earning_totals_salary_non_negative", "employee_earning_totals", type_="check")
    op.drop_constraint("ck_employee_earning_totals_month_valid", "employee_earning_totals", type_="check")
    op.drop_constraint("ck_employee_earning_totals_year_valid", "employee_earning_totals", type_="check")
    op.drop_constraint(
        "ck_employee_earning_events_source_id_requires_type",
        "employee_earning_events",
        type_="check",
    )
    op.drop_constraint("ck_employee_earning_events_source_type_valid", "employee_earning_events", type_="check")
    op.drop_constraint("ck_employee_earning_events_amount_non_negative", "employee_earning_events", type_="check")
    op.drop_constraint("ck_employee_earning_events_type_valid", "employee_earning_events", type_="check")
    op.drop_constraint("ck_employee_time_entries_shift_type_valid", "employee_time_entries", type_="check")
    op.drop_constraint("ck_employee_time_entries_hours_non_negative", "employee_time_entries", type_="check")
    op.drop_constraint("ck_activity_codes_default_hours_non_negative", "activity_codes", type_="check")
    op.drop_constraint("ck_activity_codes_entry_type_valid", "activity_codes", type_="check")
    op.drop_constraint(
        "ck_employee_compensations_night_rate_non_negative",
        "employee_compensations",
        type_="check",
    )
    op.drop_constraint(
        "ck_employee_compensations_hourly_rate_non_negative",
        "employee_compensations",
        type_="check",
    )
    op.drop_constraint(
        "ck_employee_compensations_base_salary_non_negative",
        "employee_compensations",
        type_="check",
    )

    # locations
    op.drop_constraint("ck_block_members_status_valid", "block_members", type_="check")

    # users
    op.drop_constraint("ck_users_role_valid", "users", type_="check")
