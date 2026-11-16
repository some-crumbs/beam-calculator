# Static Beam Calculator

Calculator that solves static beams, shows graphs of bending moments, shear forces and normal forces.
- Backend: Python, Pydantic, FastAPI, NumPy
- Frontend: HTML, JS, CSS, Plotly

## Features
- Supported supports: fixed, pinned, roller;
- Supported loads: point, uniform, point moment, axial load;
- Supports hinges;
- Draws plots;
- Sign convention: docstring in models.py

## Usage
```bash 
uv sync 
uv run pytest 
uv run fastapi dev beam/api.py
```
- then open 127.0.0.1:8000

## Documentation
- under 127.0.0.1:8000/docs

