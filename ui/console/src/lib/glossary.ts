/** The in-product glossary. Kept to the definitions in docs/design/vocabulary.md, so the
 * console and the docs never explain the same word two ways. */
export interface GlossaryEntry {
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  { term: "Project", definition: "One idea traveling from request to demo." },
  {
    term: "The line",
    definition: "The four stages every project goes through, with an approval between each.",
  },
  { term: "Stage", definition: "One step on the line, worked by one crew member." },
  {
    term: "Crew",
    definition: "The four AI teammates - Scout, Coach, Ref and Host - each doing one job.",
  },
  {
    term: "Gate",
    definition:
      "A stop where a person reviews the work and approves it or sends it back. Nothing moves past a gate without a person.",
  },
  {
    term: "Approve",
    definition: "Say the work is good enough for the next stage. Recorded with your name.",
  },
  {
    term: "Send back",
    definition: "Return the work to the crew member with notes on what to change.",
  },
  { term: "Undo", definition: "Take back a decision within a few seconds, before it is sent." },
  {
    term: "Requirements brief",
    definition: "What needs to be built, each point tied to where it came from.",
  },
  { term: "Build plan", definition: "How it will be built and in what order." },
  {
    term: "Quality report",
    definition: "What was built, checked against the requirements, worst problems first.",
  },
  { term: "Demo script", definition: "The walkthrough and sample data for showing it working." },
  {
    term: "Completeness",
    definition:
      "How much of what a stage needs is covered. 100% means nothing required is missing.",
  },
  { term: "Gap", definition: "Something required that is still missing." },
  { term: "Open question", definition: "Something the crew needs a person to answer." },
  {
    term: "Source",
    definition: "Where a requirement came from - a document, an answer, or a reference.",
  },
  { term: "Acceptance criterion", definition: "How we will know a requirement is met." },
  {
    term: "Build task",
    definition: "One piece of the build plan, small enough to hand to a developer or Copilot.",
  },
  { term: "Finding", definition: "Something the quality review flagged." },
  { term: "Copilot", definition: "GitHub's coding assistant, which writes code from build tasks." },
  {
    term: "Workspace notes",
    definition:
      "Standing information every crew member should know - repositories, databases, conventions.",
  },
  {
    term: "FSD",
    definition:
      "Functional specification document - the written description of what a system should do.",
  },
];

const BY_TERM = new Map(GLOSSARY.map((entry) => [entry.term.toLowerCase(), entry.definition]));

export function define(term: string): string | undefined {
  return BY_TERM.get(term.toLowerCase());
}
