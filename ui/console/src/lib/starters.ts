import type { Icon } from "@phosphor-icons/react";
import {
  ArrowsLeftRightIcon,
  ChartBarIcon,
  FileTextIcon,
  LightbulbIcon,
} from "@phosphor-icons/react";

export type StarterId = "idea" | "fsd" | "report" | "data";

export interface Starter {
  id: StarterId;
  label: string;
  description: string;
  icon: Icon;
  /** First line of the message Scout receives, so it knows what kind of ask this is. */
  lead: string;
  /** Examples shown as placeholders - realistic, so people see the expected shape. */
  examples: { problem: string; users: string; data: string; success: string };
}

/** The ways people usually arrive. Each one frames the brief builder for that kind of ask;
 * none of them changes what the line does with it. */
export const STARTERS: Starter[] = [
  {
    id: "idea",
    label: "I have an idea",
    description: "Describe it in plain words. Scout asks about anything missing.",
    icon: LightbulbIcon,
    lead: "I have an idea for something we should build.",
    examples: {
      problem: "Merchandisers rebuild the seasonal line plan in spreadsheets every week.",
      users: "Merchandising planners and their managers.",
      data: "Line plans in SharePoint, product attributes in PLM.",
      success: "A line plan is drafted, reviewed and published in one place.",
    },
  },
  {
    id: "fsd",
    label: "I have an FSD or spec",
    description: "Attach it. Scout reads it and pins down every requirement.",
    icon: FileTextIcon,
    lead: "I have a functional spec for this.",
    examples: {
      problem: "The attached FSD covers the allocation rules for new stores.",
      users: "Allocation analysts.",
      data: "Store clusters and sales history in Snowflake.",
      success: "New stores open with allocations that match the rules in the FSD.",
    },
  },
  {
    id: "report",
    label: "I need a report or dashboard",
    description: "Say who reads it and what decision it should help.",
    icon: ChartBarIcon,
    lead: "I need a report or dashboard.",
    examples: {
      problem: "Regional leads cannot see weekly sell-through by category.",
      users: "Regional sales leads, every Monday.",
      data: "Weekly sales and inventory in Snowflake.",
      success: "Leads spot slow categories in under a minute.",
    },
  },
  {
    id: "data",
    label: "I need data moved between systems",
    description: "Name the systems and how fresh the data needs to be.",
    icon: ArrowsLeftRightIcon,
    lead: "I need data moved between two systems.",
    examples: {
      problem: "Returns data reaches finance three days late.",
      users: "Finance analysts reconciling returns.",
      data: "Returns in the order system, the finance ledger in Snowflake.",
      success: "Returns land in the ledger the same day.",
    },
  },
];

export function starterById(id: string | null | undefined): Starter | undefined {
  return STARTERS.find((starter) => starter.id === id);
}
