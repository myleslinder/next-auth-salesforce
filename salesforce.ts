import type { Profile } from "next-auth";
import { AuthInstance, Config, SchemaName } from "./types";
import salesforceAuth from "./auth";
import {
  buildAuthHeaders,
  getObjectQueryFields,
  getQueryObjectName,
  mapToClient,
  objectNameToFields,
  prepareSchema,
} from "./utils";

export default class SalesforceClient {
  private config: Config;
  private authInstance: AuthInstance;
  constructor(config: Config) {
    // error handling
    this.config = config;
    this.config.objectNames = prepareSchema(config.objectNames);
    this.auth();
  }

  public async createUser(profile: Profile) {
    return this.create("User", {
      Name: profile.name,
      Email__c: profile.email,
      Image__c: profile.image,
      EmailVerified__c: profile.emailVerified?.toISOString() ?? null,
    });
  }

  public async getUser(id: string) {
    return this.get("User", id);
  }

  public async getUserByEmail(email: string) {
    const field = objectNameToFields.User.find(
      (fieldObj) => fieldObj.client === "email"
    ).sf;
    return this.search(
      `User`,
      `SELECT ${getObjectQueryFields("User", ", ")} FROM ${getQueryObjectName(
        "User"
      )} WHERE ${field} = '${email}'`
    );
  }

  async deleteUser(userId: string) {
    return this.delete("User", userId);
  }

  private async auth() {
    this.authInstance = await salesforceAuth(this.config);
  }

  private async update(
    object: SchemaName,
    body: any,
    id: string | undefined | null
  ) {
    const endpoint = `${
      this.authInstance.instance_url
    }/services/data/v52.0/sobjects/${getQueryObjectName(object)}/${id ?? ""}`;
    const res = await fetch(endpoint, {
      method: "POST",
      // change this to be hanging off the authInstance
      headers: buildAuthHeaders(this.authInstance.access_token),
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return { id, ...body };
  }
  private async create(object: SchemaName, body: any) {
    // error handling generic for this and update
    return this.update(object, body, null);
  }
  private async get(object: SchemaName, id: string) {
    const url = new URL(
      `/services/data/v52.0/sobjects/${getQueryObjectName(object)}/${id}`,
      this.authInstance.instance_url
    );
    url.searchParams.append("fields", getObjectQueryFields(object));
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: buildAuthHeaders(this.authInstance.access_token),
    });
    const json = await res.json();
    return mapToClient(object, json);
  }

  private async search(object: SchemaName, soqlQuery: string) {
    const url = new URL(
      `services/data/v52.0/query/`,
      this.authInstance.instance_url
    );
    url.searchParams.append("q", soqlQuery);
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: buildAuthHeaders(this.authInstance.access_token),
    });
    const json = await res.json();
    if (!json.records || json.records.length === 0) {
      return null;
    }
    return mapToClient(object, json.records[0]);
  }

  private async delete(object: SchemaName, id: string) {
    const url = new URL(
      `/services/data/v52.0/sobjects/${getQueryObjectName(object)}/${id}`,
      this.authInstance.instance_url
    );
    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers: buildAuthHeaders(this.authInstance.access_token),
    });
    // needs a potential mapping
    return res.json();
  }
}
