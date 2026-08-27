"""G4 artifact: the demo package Showroom assembles once Review is clear."""

from pydantic import BaseModel


class TalkTrackSection(BaseModel):
    """What to say while demonstrating one requirement."""

    requirement_id: str
    narration: str


class DemoDataSeed(BaseModel):
    """Realistic seed data so the demo shows the real thing, not an empty shell."""

    entity: str
    description: str


class DemoPackage(BaseModel):
    """G4 output contract: a demo package ready to present against the FSD."""

    title: str
    summary: str
    demo_data: list[DemoDataSeed]
    talk_track: list[TalkTrackSection]
