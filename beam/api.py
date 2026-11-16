from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from .results import BeamResult
from .models import Beam
from .solver import solve

app = FastAPI(title="beam-calculator")

@app.post("/solve", response_model=BeamResult)
def post_solve(beam: Beam) -> BeamResult:
    try:
        return solve(beam)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")