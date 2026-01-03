import { defineFunction } from "@aws-amplify/backend";
export const panicHandler = defineFunction({
  name: "panic-handler",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  memoryMB: 512,
});
