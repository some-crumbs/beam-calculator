from fastapi.testclient import TestClient
from beam.api import app

client = TestClient(app)

BEAM = {
    "length": 6, "units": "SI",
    "supports": [{"type": "pinned", "pos_x": 0}, {"type": "roller", "pos_x": 6}],
    "loads": [{"type": "point", "pos_x": 3, "force": 1000}],
}

def test_solve_ok():
    r = client.post("/solve", json=BEAM)
    assert r.status_code == 200
    data = r.json()
    assert [x["kind"] for x in data["reactions"]] == ["horizontal", "vertical", "vertical"]
    assert max(data["M"]) == 1500

def test_invalid_data_422():                     # invalid support type → Pydantic
    bad = {**BEAM, "supports": [{"type": "magic", "pos_x": 0}]}
    assert client.post("/solve", json=bad).status_code == 422

def test_indeterminate_400():                    # ValueError from solver → HTTPException
    bad = {**BEAM, "supports": [{"type": "fixed", "pos_x": 0}, {"type": "roller", "pos_x": 6}]}
    r = client.post("/solve", json=bad)
    assert r.status_code == 400
    assert "indeterminate" in r.json()["detail"]