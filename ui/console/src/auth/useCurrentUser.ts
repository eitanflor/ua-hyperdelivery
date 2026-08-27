import { useMsal } from "@azure/msal-react";

export interface CurrentUser {
  name: string;
  email: string;
}

/** The signed-in user's identity from the MSAL ID token, or null before login completes. */
export function useCurrentUser(): CurrentUser | null {
  const { accounts } = useMsal();
  const account = accounts[0];
  if (!account) return null;
  return { name: account.name ?? account.username, email: account.username };
}
