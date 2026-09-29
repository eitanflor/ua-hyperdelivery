import * as Dialog from "@radix-ui/react-dialog";
import { LockSimpleIcon, XIcon } from "@phosphor-icons/react";
import { AGENT_STATIONS, PIPELINE, STATION_META } from "../../lib/pipeline";
import { GLOSSARY } from "../../lib/glossary";
import { Artwork } from "../art/Artwork";
import { IsoLine } from "../art/IsoLine";
import { CrewCard } from "../crew/CrewCard";
import { IconButton } from "../ui/IconButton";

/** Help that is always one click away, not only on the first screen: how the line works
 * and what its words mean. A side panel rather than a page, so reading it never loses the
 * place in a project. */
export function HelpPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const gates = PIPELINE.filter((station) => STATION_META[station].kind === "gate");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-fade bg-fg/25" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(28rem,100vw)] animate-fade flex-col border-l border-line bg-overlay shadow-overlay">
          <div className="flex h-14 shrink-0 items-center border-b border-line-subtle px-4">
            <Dialog.Title className="text-sm font-semibold text-fg">How Hyperdelivery works</Dialog.Title>
            <Dialog.Close asChild>
              <IconButton label="Close help" size="sm" icon={<XIcon className="size-4" />} className="ml-auto" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            The stages, the crew, the approval gates, and a glossary of the words the console uses.
          </Dialog.Description>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <p className="text-sm leading-relaxed text-fg-muted">
              You describe what you need. Four AI crew members take it from idea to demo, one
              stage each. Between stages the work stops at a gate until a person approves it.
            </p>
            <Artwork id="a1-line" fallback={<IsoLine overview className="mt-4" />} className="mt-4 block h-auto w-full" />

            <h3 className="mt-6 mb-2 text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
              The crew
            </h3>
            <div className="flex flex-col gap-2">
              {AGENT_STATIONS.map((station) => (
                <CrewCard key={station} agent={STATION_META[station].agent!} />
              ))}
            </div>

            <h3 className="mt-6 mb-2 text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
              The gates
            </h3>
            <ul className="flex flex-col gap-1.5">
              {gates.map((gate) => (
                <li key={gate} className="flex items-center gap-2 text-sm text-fg">
                  <LockSimpleIcon weight="fill" className="size-4 shrink-0 text-accent-text" />
                  {STATION_META[gate].full}
                </li>
              ))}
            </ul>

            <h3 className="mt-6 mb-2 text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
              Glossary
            </h3>
            <dl className="divide-y divide-line-subtle">
              {GLOSSARY.map((entry) => (
                <div key={entry.term} className="py-2">
                  <dt className="text-sm font-medium text-fg">{entry.term}</dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-fg-muted">{entry.definition}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
