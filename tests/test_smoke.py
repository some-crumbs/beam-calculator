from beam.models import Beam, PointLoad

def test_beam_parses_from_json():
    beam = Beam.model_validate({
        "length": 6, "units": "SI",
        "supports": [{"type": "pinned", "pos_x": 0}, {"type": "roller", "pos_x": 6}],
        "loads": [{"type": "point", "pos_x": 3, "force": 1000}],
    })
    assert isinstance(beam.loads[0], PointLoad)
    assert beam.supports[0].reaction_count == 2