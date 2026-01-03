import { defineFunction } from "@aws-amplify/backend";
export const notificationDispatcher = defineFunction({
  name: "notification-dispatcher",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  memoryMB: 256,
});
