import type { ReactNode } from "react";
import { useProjectsStore, type ViewMode } from "../store/useProjectsStore";
import { useTheme, type ThemeMode } from "../store/useTheme";
import { ROLES, usePreferences, type Role } from "../store/usePreferences";
import { cn } from "../lib/cn";

interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
}

const DETAIL: Option<ViewMode>[] = [
  {
    value: "pm",
    label: "Simple",
    description: "Plain-language progress and the finished documents. Right for most people.",
  },
  {
    value: "developer",
    label: "Detailed",
    description: "Adds every tool call, the raw JSON as documents are written, and token counts.",
  },
];

const THEMES: Option<ThemeMode>[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Match my computer" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t border-line-subtle py-6 first:border-0 md:grid-cols-[14rem_1fr]">
      <div>
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-fg-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** Native radios styled as cards - keyboard and screen-reader behavior for free. */
function Choices<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  columns = 1,
}: {
  name: string;
  legend: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: 1 | 2 | 3;
}) {
  return (
    <fieldset
      className={cn(
        "grid gap-2",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3",
      )}
    >
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex cursor-pointer gap-3 rounded-md border px-3 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
            value === option.value
              ? "border-accent bg-accent-bg"
              : "border-line-subtle bg-surface hover:border-line-strong",
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-0.5 size-3.5 shrink-0 accent-[var(--color-accent)] focus-visible:outline-none"
          />
          <span>
            <span className="block text-sm text-fg">{option.label}</span>
            {option.description && (
              <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">
                {option.description}
              </span>
            )}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/** Per-person settings. Everything here is a display preference kept in this browser -
 * nothing on this page changes what anyone is allowed to do. */
export function Settings() {
  const viewMode = useProjectsStore((s) => s.viewMode);
  const setViewMode = useProjectsStore((s) => s.setViewMode);
  const theme = useTheme((s) => s.mode);
  const setTheme = useTheme((s) => s.setMode);
  const role = usePreferences((s) => s.role);
  const setRole = usePreferences((s) => s.setRole);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <h1 className="stencil text-2xl tracking-tight text-fg">Settings</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Saved in this browser. They change what you see, not what anyone can do.
        </p>

        <div className="mt-6">
          <Section
            title="Detail level"
            description="How much of the crew's working you see while they work and in their documents."
          >
            <Choices
              name="detail"
              legend="Detail level"
              options={DETAIL}
              value={viewMode}
              onChange={setViewMode}
              columns={2}
            />
          </Section>

          <Section title="Appearance" description="The console's color theme.">
            <Choices
              name="theme"
              legend="Appearance"
              options={THEMES}
              value={theme}
              onChange={setTheme}
              columns={3}
            />
          </Section>

          <Section
            title="What you mostly do here"
            description="Decides what Home shows first. Choosing Developer also switches the detail level to Detailed."
          >
            <Choices<Role>
              name="role"
              legend="What you mostly do here"
              options={ROLES.map((r) => ({ value: r.value, label: r.prompt, description: r.label }))}
              value={role}
              onChange={setRole}
              columns={2}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
