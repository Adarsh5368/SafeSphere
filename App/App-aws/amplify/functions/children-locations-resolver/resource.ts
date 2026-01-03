import { defineFunction } from "@aws-amplify/backend";

export const childrenLocationsResolver = defineFunction({
  name: "children-locations-resolver",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  memoryMB: 256,
});