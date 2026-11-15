from __future__ import annotations
import numpy as np # pyright: ignore[reportMissingImports]
from pytest import approx, raises # pyright: ignore[reportMissingImports]
from beam.models import Beam
from beam.results import BeamResult
from beam.solver import solve

def make_beam(supports, loads, length=6, hinges=()):
    return Beam(length=length, units="SI", supports=supports, loads=loads, hinges=list(hinges))

def simply_supported(loads):
    return make_beam([{"type": "pinned", "pos_x": 0}, {"type": "roller", "pos_x": 6}], loads)

def value_at(xs, ys, x):
    """Wartość wykresu w punkcie siatki najbliższym x."""
    return ys[int(np.argmin(np.abs(np.array(xs) - x)))]

def test_internal_forces():                    # M_max = PL/4
    beam = make_beam(
        supports=[{"type": "pinned", "pos_x": 0}, {"type": "roller", "pos_x": 6}],
        loads=[{"type": "point", "pos_x": 3, "force": 1000}]
    )
    result = solve(beam)
    assert len(result.x) == len(result.M) == len(result.V) == len(result.N)

def test_point_load_mid():                      # M_max = PL/4
    b = simply_supported([{"type": "point", "pos_x": 3, "force": 1000}])
    r = solve(b)
    assert value_at(r.x, r.V, 2) == approx(500)
    assert value_at(r.x, r.V, 4) == approx(-500)
    assert max(r.M) == approx(1500)
    assert r.M[0] == approx(0, abs=1e-6) and r.M[-1] == approx(0, abs=1e-6)

def test_uniform_load():                        # M_max = qL²/8
    b = simply_supported([{"type": "uniform", "start_x": 0, "end_x": 6, "q": 10}])
    r = solve(b)
    assert max(r.M) == approx(10 * 6**2 / 8, rel=1e-4)

def test_cantilever():                          # M(0) = −P·L
    b = make_beam([{"type": "fixed", "pos_x": 0}], [{"type": "point", "pos_x": 4, "force": 100}], length=4)
    r = solve(b)
    assert value_at(r.x, r.M, 1e-9) == approx(-400)

def test_gerber_hinge_moment_zero():            # M w przegubie = 0
    b = make_beam([{"type": "fixed", "pos_x": 0}, {"type": "roller", "pos_x": 5}],
                  [{"type": "uniform", "start_x": 0, "end_x": 5, "q": 10}], length=5, hinges=[{"pos_x": 2}])
    r = solve(b)
    assert value_at(r.x, r.M, 2) == approx(0, abs=1e-6)

def test_force_angled_45():
    b = simply_supported([{"type": "point", "pos_x": 3, "force": 1000, "angle": -45}])
    r = solve(b)
    h = 1000 / 2**0.5
    assert r.reactions[0].value == approx(-h, abs=1e-9)
    assert value_at(r.x, r.N, 1.5) == approx(h)
    assert value_at(r.x, r.N, 4.5) == approx(0, abs=1e-9)

def test_fixed_and_roller():
    b = make_beam(
        [{"type": "fixed", "pos_x": 0}, {"type": "roller", "pos_x": 6}],
        loads=[]
    )
    with raises(ValueError):
        solve(b)

def test_vertical_load_gives_exact_zero_N():
    b = simply_supported([{"type": "point", "pos_x": 3, "force": 1000}])
    r = solve(b)
    assert all(n == 0.0 for n in r.N)              # dokładnie zero, nie approx
    assert r.reactions[0].value == 0.0             # reakcja pozioma też
