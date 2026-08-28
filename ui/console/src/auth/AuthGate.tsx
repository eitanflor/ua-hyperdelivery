import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import type { ReactNode } from "react";
import { Button } from "../components/ui/Button";

function SignInScreen() {
  const { instance } = useMsal();

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-5 bg-canvas px-6 text-center">
      <img src="/ua-logo.png" alt="Under Armour" className="size-14 object-contain" />
      <div>
        <h1 className="stencil text-lg tracking-tight text-fg">Hyperdelivery</h1>
        <p className="mt-1 text-2xs tracking-wide text-fg-subtle uppercase">The AI app factory</p>
        <p className="mt-3 text-xs text-fg-muted">Sign in with your Under Armour account.</p>
      </div>
      <Button variant="primary" size="lg" onClick={() => void instance.loginRedirect()}>
        Sign in with Microsoft
      </Button>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthenticatedTemplate>{children}</AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <SignInScreen />
      </UnauthenticatedTemplate>
    </>
  );
}
