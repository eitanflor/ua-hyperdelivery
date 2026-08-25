from pydantic import BaseModel


class TalkTrackSection(BaseModel):
    requirement_id: str
    narration: str


class DemoDataSeed(BaseModel):
    entity: str
    description: str


class DemoPackage(BaseModel):
    """G4 output contract: a demo package ready to present against the FSD."""

    title: str
    summary: str
    demo_data: list[DemoDataSeed]
    talk_track: list[TalkTrackSection]
