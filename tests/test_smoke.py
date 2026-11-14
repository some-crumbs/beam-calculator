from beam.models import Beam, PointLoad
from beam.results import BeamResult, Reaction

def test_beam_parses_from_json():
    beam = Beam.model_validate({
        "length": 6, "units": "SI",
        "supports": [{"type": "pinned", "pos_x": 0}, {"type": "roller", "pos_x": 6}],
        "loads": [{"type": "point", "pos_x": 3, "force": 1000}],
    })
    assert isinstance(beam.loads[0], PointLoad)
    assert beam.supports[0].reaction_count == 2

def test_result_model():
    result = BeamResult(
        reactions=[Reaction(support_id="s1", kind="vertical", value=500)],
        x=[0, 1, 2],
        N=[0, 0, 0],
        V=[500, 500, 500],
        M=[0, 250, 500]
    )
    assert result.reactions[0].kind == "vertical"
    assert result.V[1] == 500

