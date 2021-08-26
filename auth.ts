import jwt from "jsonwebtoken";
import { AuthInstance, Config } from "./types";

// break this out into its own simple repo/package so can use it in both things
export default async function salesforceAuth({
  connectedAppKey,
  username,
  privateKey,
  isSandbox = false,
}: Config): Promise<AuthInstance> {
  const loginUrl = `https://${isSandbox ? "test" : "login"}.salesforce.com`;

  // doesn't it suck that the jwt is valid for 2 days but we're going to be
  // creating a new one on each request
  const jwtParams = {
    iss: connectedAppKey,
    prn: username,
    aud: loginUrl,
    exp: Math.floor(Date.now() / 1000) + 60 * 2,
  };

  const token = jwt.sign(jwtParams, privateKey, {
    algorithm: "RS256",
  });

  const token_url = new URL("/services/oauth2/token", loginUrl);
  token_url.searchParams.append(
    "grant_type",
    "urn:ietf:params:oauth:grant-type:jwt-bearer"
  );
  token_url.searchParams.append("assertion", token);

  const sfRes = await fetch(token_url.toString(), {
    method: "POST",
  });
  return sfRes.json();
}
