from typing import Literal
from pydantic import BaseModel

class Reaction(BaseModel):
    support_id: str
    kind: Literal["vertical", "horizontal", "moment"]
    value: float

class BeamResult(BaseModel):
    reactions: list[Reaction]
    x: list[float]
    N: list[float] # normal forces
    V: list[float] # shear forces
    M: list[float] # bending moments

