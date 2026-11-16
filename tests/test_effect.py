import beam.solver as solver
from beam.models import PointLoad, UniformLoad, AxialLoad, PointMoment
from pytest import approx

def test_total_effect_point_load():
    load = PointLoad(pos_x=3, force=1000)
    fx, fy, m = solver.total_effect([load], x0=0)
    assert approx(fx, abs=1e-9) == 0.0
    assert approx(fy, abs=1e-6) == -1000.0
    assert approx(m, abs=1e-6) == -3000.0  # Moment at x0=0 due to point load at x=3

def test_total_effect_point_load_left_of():
    load = PointLoad(pos_x=3, force=1000)
    fx, fy, m = solver.total_effect([load], x0=0, left_of=2)
    assert approx(fx, abs=1e-9) == 0.0
    assert approx(fy, abs=1e-6) == 0.0
    assert approx(m, abs=1e-6) == 0.0  # Load is to the right of left_of=2, so no effect

def test_total_effect_uniform_load():
    load = UniformLoad(start_x=2, end_x=8, q=10)
    fx, fy, m = solver.total_effect([load], x0=0)
    assert approx(fx, abs=1e-9) == 0.0
    assert approx(fy, abs=1e-6) == -60.0  # Resultant of uniform load: q * (end_x - start_x) = -10 * 6 = -60
    assert approx(m, abs=1e-6) == -300.0  # Moment at x0=0 due to uniform load: fy * (centroid - x0) = -60 * 5 = -300

def test_total_effect_uniform_load_left_of():
    load = UniformLoad(start_x=2, end_x=8, q=10)
    fx, fy, m = solver.total_effect([load], x0=5, left_of=5)
    assert approx(fx, abs=1e-9) == 0.0
    assert approx(fy, abs=1e-6) == -30.0  # Resultant of clipped uniform load: q * (left_of - start_x) = -10 * 3 = -30
    assert approx(m, abs=1e-6) == 45.0   # Moment at x0=5 due to clipped uniform load: fy * (centroid - x0) = -30 * (3.5 - 5) = 45

def test_total_effect_multiple_loads():
    point_load = PointLoad(pos_x=3, force=1000)
    uniform_load = UniformLoad(start_x=2, end_x=8, q=10)
    fx, fy, m = solver.total_effect([point_load, uniform_load], x0=0)
    assert approx(fx, abs=1e-9) == 0.0
    assert approx(fy, abs=1e-6) == -1060.0  # Total vertical force: -1000 (point) + -60 (uniform)
    assert approx(m, abs=1e-6) == -3300.0   # Total moment at x0=0: -3000 (point) + -300 (uniform)

def test_total_effect_moment_only():
    moment = PointMoment(pos_x=1, moment=500)
    fx, fy, m = solver.total_effect([moment], x0=0, left_of=4)
    assert approx(fx, abs=1e-9) == 0.0
    assert approx(fy, abs=1e-9) == 0.0
    assert approx(m, abs=1e-9) == 500.0  # Moment at x0=0 due to point moment at x=1

def test_total_effect_axial_load():
    axial_load = AxialLoad(start_x=0, end_x=4, n=100)
    fx, fy, m = solver.total_effect([axial_load], x0=0, left_of=3)
    assert approx(fx, abs=1e-9) == 300.0  # Total axial force: n * (end_x - start_x) = 100 * 3 = 300
    assert approx(fy, abs=1e-9) == 0.0
    assert approx(m, abs=1e-9) == 0.0     # No moment contribution from axial load