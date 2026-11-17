import pytest
from pydantic import ValidationError
from beam.models import Beam, PointLoad, UniformLoad, AxialLoad

def ul(a=2, b=8, q=10):
    return UniformLoad(start_x=a, end_x=b, q=q)

def test_point_load_down():
    assert PointLoad(pos_x=1, force=1000).components() == pytest.approx((0, -1000), abs=1e-9)

def test_uniform_resultant_and_centroid():
    assert ul().resultant() == pytest.approx(60)    # 10 N/m · 6 m
    assert ul().centroid() == pytest.approx(5)      # midpoint of [2, 8]

def test_clip_inside():
    part = ul().clip(0, 5)
    assert (part.start_x, part.end_x, part.q) == (2, 5, 10)

def test_clip_outside():
    assert ul().clip(9, 10) is None

@pytest.mark.parametrize("a, b", [(5, 2), (3, 3)])
def test_uniform_bad_range(a, b):
    with pytest.raises(ValidationError):
        ul(a, b)

def test_axial_requires_n():
    with pytest.raises(ValidationError):
        AxialLoad(start_x=0, end_x=1)

@pytest.mark.parametrize("supports, hinges, n", [
    ([("pinned", 0), ("roller", 6)], [], 0),   # simply supported
    ([("fixed", 0)], [], 0),                   # cantilever
    ([("fixed", 0), ("roller", 6)], [], 1),    # statically indeterminate
    ([("fixed", 0), ("roller", 6)], [3], 0),   # Gerber beam
    ([("roller", 0), ("roller", 6)], [], -1),  # mechanism
])
def test_indeterminacy(supports, hinges, n):
    beam = Beam(length=6, units="SI",
                supports=[{"type": t, "pos_x": x} for t, x in supports],
                hinges=[{"pos_x": x} for x in hinges])
    assert beam.indeterminacy == n

def test_fixed_support_only_at_ends():
    b = Beam(length=6, units="SI", supports=[{"type": "fixed", "pos_x": 0}], loads=[])
    b = Beam(length=6, units="SI", supports=[{"type": "fixed", "pos_x": 6}], loads=[])
    with pytest.raises(ValidationError, match="Fixed"):
        b = Beam(length=6, units="SI", supports=[{"type": "fixed", "pos_x": 3}], loads=[])
