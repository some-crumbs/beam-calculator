"""Modele danych belki. Jednostki: SI [m, N, N/m, N·m].

Konwencja znaków:
- oś x w prawo od lewego końca belki, oś y w górę
- PointLoad.angle: kąt od osi +x, przeciwnie do zegara; siła w dół = -90°
- UniformLoad.q: dodatnie = obciążenie w dół
- AxialLoad.n: dodatnie = w prawo (wzdłuż +x)
- momenty (skupione i reakcje): dodatnie przeciwnie do zegara
"""

from __future__ import annotations

from uuid import uuid4
from typing import Literal, Annotated, Union
from pydantic import BaseModel, Field, model_validator # pyright: ignore[reportMissingImports]

import math

# TODO: dodać DistributedLoad.

def _new_id() -> str:
    return uuid4().hex[:8]

class BaseModelWithID(BaseModel):
    id: str = Field(default_factory=_new_id)

    def span(self) -> tuple[float, float]:
        """Return the span of the element as a tuple (start, end)."""
        raise NotImplementedError("Subclasses must implement the span method.")

class LoadBase(BaseModelWithID):
    def effect(self, x0: float, left_of: float = math.inf) -> tuple[float, float, float]:
        """Calculate the effect of the load at position x0, considering only loads to the left of left_of."""
        raise NotImplementedError("Subclasses must implement the effect method.")


# -supports and hinges-

class Support(BaseModelWithID):
    pos_x: float = Field(ge=0, description="Position of the support along the beam.")
    type: Literal["fixed", "roller", "pinned"]  # 'fixed', 'roller', 'pinned'

    @property
    def reaction_count(self) -> int:
        """Return the number of reactions based on the support type."""
        if self.type == 'fixed':
            return len(self.reaction_kinds)
        elif self.type == 'roller':
            return len(self.reaction_kinds)
        elif self.type == 'pinned':
            return len(self.reaction_kinds)
        else:
            raise ValueError(f"Unknown support type: {self.type}")

    @property
    def reaction_kinds(self) -> list[str]:
        return {"fixed": ["horizontal", "vertical", "moment"],
                "pinned": ["horizontal", "vertical"],
                "roller": ["vertical"]}[self.type]

    def span(self) -> tuple[float, float]:
        """Return the span of the support as a tuple (start, end)."""
        return (self.pos_x, self.pos_x)

class Hinge(BaseModelWithID):
    pos_x: float = Field(ge=0, description="Position of the hinge along the beam.")

    def span(self) -> tuple[float, float]:
        """Return the span of the hinge as a tuple (start, end)."""
        return (self.pos_x, self.pos_x)

# -loads-

class PointLoad(LoadBase):
    type: Literal["point"] = "point"
    pos_x: float = Field(ge=0, description="Position of the point load along the beam.")
    force: float = Field(..., description="Magnitude of the point load.")
    angle: float = Field(-90.0, description="Angle of the point load in degrees.")

    def effect(self, x0: float, left_of: float = math.inf) -> tuple[float, float, float]:
        if self.pos_x < left_of:
            fx, fy = self.components()
            M = fy * (self.pos_x - x0)
            return (fx, fy, M)
        else:
            return (0.0, 0.0, 0.0)

    def components(self) -> tuple[float, float]:
        """Return the horizontal and vertical components of the point load."""
        rad = math.radians(self.angle)
        fx = self.force * math.cos(rad)
        fy = self.force * math.sin(rad)
        return (fx, fy)

    def span(self) -> tuple[float, float]:
        """Return the span of the point load as a tuple (start, end)."""
        return (self.pos_x, self.pos_x)

class UniformLoad(LoadBase):
    type: Literal["uniform"] = "uniform"
    start_x: float = Field(ge=0, description="Start position of the uniform load along the beam.")
    end_x: float = Field(ge=0, description="End position of the uniform load along the beam.")
    q: float = Field(..., description="Magnitude of the uniform load.")

    @model_validator(mode="after")
    def _check_position(self) -> UniformLoad:
        """Ensure that start_x is less than end_x."""
        if self.start_x >= self.end_x:
            raise ValueError("start_x must be less than end_x")
        return self

    def effect(self, x0: float, left_of: float = math.inf) -> tuple[float, float, float]:
        part = self.clip(0, left_of)
        if part is None:
            return (0.0, 0.0, 0.0)
        fy = -part.resultant()
        M = fy * (part.centroid() - x0)
        return (0.0, fy, M)

    def resultant(self) -> float:
        """Return the resultant force of the uniform load."""
        return self.q * (self.end_x - self.start_x)

    def centroid(self) -> float:
        return (self.start_x + self.end_x) / 2

    def clip(self, a: float, b: float) -> UniformLoad | None:
        lo, hi = max(a, self.start_x), min(b, self.end_x)
        if lo >= hi:
            return None
        return UniformLoad(id=self.id, start_x=lo, end_x=hi, q=self.q)

    def span(self) -> tuple[float, float]:
        """Return the span of the uniform load as a tuple (start, end)."""
        return (self.start_x, self.end_x)

class AxialLoad(LoadBase):
    type: Literal["axial"] = "axial"
    start_x: float = Field(ge=0, description="Start position of the axial load along the beam.")
    end_x: float = Field(ge=0, description="End position of the axial load along the beam.")
    n: float = Field(..., description="intensity of the axial load (force per unit length).")

    @model_validator(mode="after")
    def _check_position(self) -> AxialLoad:
        """Ensure that start_x is less than end_x."""
        if self.start_x >= self.end_x:
            raise ValueError("start_x must be less than end_x")
        return self

    def effect(self, x0: float, left_of: float = math.inf) -> tuple[float, float, float]:
        hi = min(self.end_x, left_of)
        if hi > self.start_x:
            return ((self.n*(hi - self.start_x)), 0.0, 0.0)
        return (0.0, 0.0, 0.0)

    def span(self) -> tuple[float, float]:
        """Return the span of the axial load as a tuple (start, end)."""
        return (self.start_x, self.end_x)

class PointMoment(LoadBase):
    type: Literal["moment"] = "moment"
    pos_x: float = Field(ge=0, description="Position of the point moment along the beam.")
    moment: float = Field(..., description="Magnitude of the point moment.")

    def effect(self, x0: float, left_of: float = math.inf) -> tuple[float, float, float]:
        if self.pos_x < left_of:
            return (0.0, 0.0, self.moment)
        return (0.0, 0.0, 0.0)

    def span(self) -> tuple[float, float]:
        """Return the span of the point moment as a tuple (start, end)."""
        return (self.pos_x, self.pos_x)

Load = Annotated[Union[PointLoad, UniformLoad, AxialLoad, PointMoment], Field(discriminator="type")]

# -beam-

class Beam(BaseModel):
    length: float = Field(gt=0, description="Length of the beam.")
    units: Literal["SI", "Imperial"] = Field(..., description="Unit system for the beam.")
    supports: list[Support] = Field(..., description="List of supports for the beam.")
    hinges: list[Hinge] = Field(default_factory=list, description="List of hinges for the beam.")
    loads: list[Load] = Field(default_factory=list, description="List of loads applied to the beam.")

    @model_validator(mode="after")
    def _check_geometry(self) -> Beam:
        elements = [*self.supports, *self.hinges, *self.loads]
        for el in elements:
            if el.span()[1] > self.length:
                raise ValueError(f"Element {el.id} wychodzi poza belkę")
        ids = [el.id for el in elements]
        if len(ids) != len(set(ids)):
            raise ValueError("Zduplikowane id elementów")
        return self

    @property
    def indeterminacy(self) -> int:
        """Calculate the degree of indeterminacy of the beam."""
        total_reactions = sum(support.reaction_count for support in self.supports)
        total_equations = 3  # For a planar beam, we have 3 equilibrium equations
        return total_reactions - total_equations - len(self.hinges)  # Each hinge reduces the indeterminacy by 1

