import { SchemaName } from "./types";

export const buildAuthHeaders = (access_token: string) => ({
  Authorization: `Bearer ${access_token}`,
  "Content-Type": "application/json",
});

export const sentenceCase = (str: string) =>
  `${str[0].toUpperCase()}${str.slice(1)}`;

export const defaultSchema = {
  Account: "Auth_Account__c",
  Session: "Session__c",
  User: "User__c",
  VerificationRequest: "Verification_Request__c",
};

export const prepareSchema = (schema) => {
  return {
    ...defaultSchema,
    ...schema,
  };
};

export const getQueryObjectName = (object: SchemaName) => {};

export const objectNameToFields = {
  Account: [
    { sf: "Email", client: "email" },
    { sf: "Provider_Id__c", client: "providerId" },
  ],
  Session: [{ sf: "Email", client: "email" }],
  User: [{ sf: "Email", client: "email" }],
  VerificationRequest: [{ sf: "Email__c", client: "email" }],
};

export const getObjectQueryFields = (object: SchemaName, join = ",") =>
  objectNameToFields[object].map((obj) => obj.sf).join(join);

export const mapToClient = (object: SchemaName, record) => {
  return objectNameToFields[object].reduce((clientRecord, { sf, client }) => {
    clientRecord[client] = record[sf];
    return clientRecord;
  }, {});
};
