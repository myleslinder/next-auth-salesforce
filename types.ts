export type AuthInstance = {
  access_token: string;
  scope: string;
  instance_url: string;
  id: string;
  token_type: string;
};

export type Config = {
  connectedAppKey: string;
  username: string;
  isSandbox: boolean;
  privateKey: string;
  objectNames: SchemaNames | undefined | null;
};

export type SchemaName = "Account" | "Session" | "User" | "VerificationRequest";

interface SchemaNames {
  Account: string | undefined;
  Session: string | undefined;
  User: string | undefined;
  VerificationRequest: string | undefined;
}
