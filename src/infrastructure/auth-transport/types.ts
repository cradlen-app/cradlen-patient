/** Token pair returned by the backend patient-auth endpoints. */
export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};
