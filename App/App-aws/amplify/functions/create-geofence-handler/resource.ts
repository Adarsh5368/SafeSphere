import { defineFunction } from "@aws-amplify/backend";

export const createGeofenceHandler = defineFunction({
  name: "create-geofence-handler",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  memoryMB: 256,
});