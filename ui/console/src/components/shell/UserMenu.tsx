import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useMsal } from "@azure/msal-react";
import {
  CaretDownIcon,
  CheckIcon,
  DesktopIcon,
  GearSixIcon,
  MoonIcon,
  SignOutIcon,
  SunIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { useCurrentUser } from "../../auth/useCurrentUser";
import { useTheme, type ThemeMode } from "../../store/useTheme";
import { displayName, initials } from "../../lib/people";
import { cn } from "../../lib/cn";

const THEMES: { value: ThemeMode; label: string; icon: ReactNode }[] = [
  { value: "light", label: "Light", icon: <SunIcon className="size-4" /> },
  { value: "dark", label: "Dark", icon: <MoonIcon className="size-4" /> },
  { value: "system", label: "System", icon: <DesktopIcon className="size-4" /> },
];

const ITEM = cn(
  "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-fg-muted",
  "outline-none select-none data-[highlighted]:bg-sunken data-[highlighted]:text-fg",
);

/** Identity, theme and sign-out, top right. Identity belongs at the edge of the chrome,
 * not competing with the wordmark in the project list. */
export function UserMenu() {
  const user = useCurrentUser();
  const { instance } = useMsal();
  const mode = useTheme((s) => s.mode);
  const setMode = useTheme((s) => s.setMode);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-full pr-1.5 pl-1 transition-colors hover:bg-sunken"
          aria-label={`Account: ${displayName(user.name)}`}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-2xs font-semibold text-fg-on-accent">
            {initials(user.name)}
          </span>
          <CaretDownIcon className="size-3 text-fg-subtle" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-60 animate-pop rounded-md border border-line bg-overlay p-1 shadow-overlay"
        >
          <div className="px-2 py-2">
            <p className="truncate text-xs font-medium text-fg">{displayName(user.name)}</p>
            <p className="truncate text-2xs text-fg-subtle">{user.email}</p>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-line-subtle" />

          <DropdownMenu.Label className="px-2 py-1 text-2xs font-medium text-fg-subtle">
            Appearance
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as ThemeMode)}
          >
            {THEMES.map((theme) => (
              <DropdownMenu.RadioItem key={theme.value} value={theme.value} className={ITEM}>
                {theme.icon}
                {theme.label}
                {mode === theme.value && <CheckIcon className="ml-auto size-3.5 text-accent-text" />}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>

          <DropdownMenu.Separator className="my-1 h-px bg-line-subtle" />

          <DropdownMenu.Item className={ITEM} onSelect={() => void navigate("/settings")}>
            <GearSixIcon className="size-4" />
            Settings
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={ITEM}
            onSelect={() => void instance.logoutRedirect()}
          >
            <SignOutIcon className="size-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
