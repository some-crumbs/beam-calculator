from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .results import BeamResult
from .models import Beam
from .solver import solve

app = FastAPI(title="beam-calculator")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/solve", response_model=BeamResult)
def post_solve(beam: Beam) -> BeamResult:
    try:
        return solve(beam)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))