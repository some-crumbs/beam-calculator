from beam.solver import _load_points
from tests.helpers import simply_supported


def test_extra_point_element_adds_two_points():
    b1 = simply_supported([{"type": "point", "pos_x": 3, "force": 1000}])
    b2 = simply_supported([{"type": "point", "pos_x": 3, "force": 1000},
                           {"type": "moment", "pos_x": 2, "moment": 100}])
    assert len(_load_points(b2)) == len(_load_points(b1)) + 2
