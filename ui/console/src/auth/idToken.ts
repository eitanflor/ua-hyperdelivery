import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalInstance } from "./msalConfig";

// Default `openid profile` scopes are enough - the backend validates the ID token itself
// (audience = this app's own client id), no custom "Expose an API" scope is needed.
const ID_TOKEN_SCOPES = ["openid", "profile"];

/** Silently refreshes the signed-in user's ID token for calling authenticated backend routes. */
export async function getIdToken(): Promise<string> {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (!account) throw new Error("No signed-in account.");

  try {
    const result = await msalInstance.acquireTokenSilent({ scopes: ID_TOKEN_SCOPES, account });
    return result.idToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Kicks off a redirect to re-authenticate; the in-flight request still fails this time.
      void msalInstance.acquireTokenRedirect({ scopes: ID_TOKEN_SCOPES, account });
    }
    throw error;
  }
}
