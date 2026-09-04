"""Units that write the same file have to ship as one pull request."""

from core.delivery import plan_delivery
from core.domain.blueprint import FileTouchpoint, UnitOfWork
from tools.delivery import plan_delivery as plan_delivery_tool


def _unit(unit_id: str, *paths: str, depends_on: list[str] | None = None) -> UnitOfWork:
    return UnitOfWork(
        id=unit_id,
        title=unit_id,
        description="d",
        depends_on=depends_on or [],
        files=[FileTouchpoint(path=path, change="modify", purpose="p") for path in paths],
    )


def test_no_units_plans_nothing() -> None:
    assert plan_delivery([]) == []


def test_units_touching_one_file_become_one_pull_request() -> None:
    # the shape that produced four incompatible pull requests against one schema change
    units = [
        _unit("U1", "backend/schemas/history.py"),
        _unit("U2", "backend/schemas/history.py", "backend/services/history.py"),
        _unit("U3", "frontend/historyStore.ts", "backend/services/history.py"),
        _unit("U4", "frontend/historyStore.ts"),
    ]

    groups = plan_delivery(units)

    assert len(groups) == 1
    assert groups[0].unit_ids == ["U1", "U2", "U3", "U4"]
    assert groups[0].depends_on == []


def test_units_touching_nothing_in_common_stay_separate() -> None:
    groups = plan_delivery([_unit("U1", "a.py"), _unit("U2", "b.py")])

    assert [g.unit_ids for g in groups] == [["U1"], ["U2"]]
    assert all(g.depends_on == [] for g in groups)


def test_a_dependency_without_shared_files_orders_two_groups() -> None:
    groups = plan_delivery([_unit("U1", "a.py", depends_on=["U2"]), _unit("U2", "b.py")])

    assert [g.unit_ids for g in groups] == [["U2"], ["U1"]]
    assert groups[1].depends_on == [groups[0].id]


def test_a_group_lists_every_file_its_units_touch() -> None:
    groups = plan_delivery([_unit("U1", "b.py", "a.py"), _unit("U2", "b.py")])

    assert groups[0].files == ["a.py", "b.py"]


def test_groups_that_depend_on_each_other_are_merged() -> None:
    # U1 needs U2, U4 needs U3, and the file map crosses the two pairs - neither group
    # can be built first, so they are one pull request
    units = [
        _unit("U1", "a.py", depends_on=["U2"]),
        _unit("U2", "b.py"),
        _unit("U3", "a.py"),
        _unit("U4", "b.py", depends_on=["U3"]),
    ]

    groups = plan_delivery(units)

    assert len(groups) == 1
    assert sorted(groups[0].unit_ids) == ["U1", "U2", "U3", "U4"]


def test_a_chain_of_dependencies_comes_back_in_build_order() -> None:
    units = [
        _unit("U3", "c.py", depends_on=["U2"]),
        _unit("U1", "a.py"),
        _unit("U2", "b.py", depends_on=["U1"]),
    ]

    groups = plan_delivery(units)

    assert [g.unit_ids for g in groups] == [["U1"], ["U2"], ["U3"]]
    assert [g.depends_on for g in groups] == [[], ["D1"], ["D2"]]


def test_a_dependency_on_an_unknown_unit_is_ignored_rather_than_crashing() -> None:
    groups = plan_delivery([_unit("U1", "a.py", depends_on=["nope"])])

    assert [g.unit_ids for g in groups] == [["U1"]]
    assert groups[0].depends_on == []


def test_the_tool_reports_how_many_pull_requests_the_plan_implies() -> None:
    result = plan_delivery_tool(
        [
            {"id": "U1", "title": "t", "description": "d", "files": [_touchpoint("a.py")]},
            {"id": "U2", "title": "t", "description": "d", "files": [_touchpoint("a.py")]},
        ]
    )

    assert result["pull_requests"] == 1
    assert result["issues"] == []
    assert result["groups"][0]["unit_ids"] == ["U1", "U2"]


def test_the_tool_reports_units_it_cannot_read() -> None:
    result = plan_delivery_tool([{"title": "no id"}])

    assert result["groups"] == []
    assert result["issues"]


def _touchpoint(path: str) -> dict[str, str]:
    return {"path": path, "change": "modify", "purpose": "p"}
