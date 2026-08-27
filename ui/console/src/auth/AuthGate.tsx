import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import type { ReactNode } from "react";

function SignInScreen() {
  const { instance } = useMsal();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <img src="/ua-logo.png" alt="Under Armour" className="h-16 w-16 object-contain" />
      <div>
        <p className="text-lg font-semibold text-ua-black">Hyperdelivery Console</p>
        <p className="mt-1 text-sm text-ua-steel">Sign in with your Under Armour account.</p>
      </div>
      <button
        className="rounded-lg bg-ua-red px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-ua-red-dark hover:shadow-md active:scale-[0.98]"
        onClick={() => void instance.loginRedirect()}
      >
        Sign in with Microsoft
      </button>
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
