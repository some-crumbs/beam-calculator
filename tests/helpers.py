"""Shared helpers for tests."""
import numpy as np
from beam.models import Beam


def make_beam(supports, loads, length=6, hinges=()):
    return Beam(length=length, units="SI", supports=supports, loads=loads, hinges=list(hinges))


def simply_supported(loads):
    """Pinned support at x=0 and roller at x=6, beam length 6."""
    return make_beam([{"type": "pinned", "pos_x": 0}, {"type": "roller", "pos_x": 6}], loads)


def value_at(xs, ys, x):
    """Plot value at the grid point nearest to x."""
    return ys[int(np.argmin(np.abs(np.array(xs) - x)))]


def values(reactions):
    return [r.value for r in reactions]
