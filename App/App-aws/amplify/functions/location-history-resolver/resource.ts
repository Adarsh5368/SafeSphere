import { defineFunction } from "@aws-amplify/backend";

export const locationHistoryResolver = defineFunction({
  name: "location-history-resolver", 
  entry: "./handler.ts",
  timeoutSeconds: 30,
  memoryMB: 256,
});