import { LogLevel, PublicClientApplication, type Configuration } from "@azure/msal-browser";

const entraTenantId = import.meta.env.VITE_ENTRA_TENANT_ID ?? "";
const entraClientId = import.meta.env.VITE_ENTRA_CLIENT_ID ?? "";

// No client secret and no custom API scope - the backend validates the ID token directly
// (audience = this app's own client id) via api/auth.py, see getIdToken() in idToken.ts.
export const msalConfig: Configuration = {
  auth: {
    clientId: entraClientId,
    authority: `https://login.microsoftonline.com/${entraTenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error(message);
      },
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
