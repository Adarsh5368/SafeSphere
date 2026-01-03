import { defineFunction } from "@aws-amplify/backend";
export const geofenceEvaluator = defineFunction({
  name: "geofence-evaluator",
  entry: "./handler.ts",
  timeoutSeconds: 60,
  memoryMB: 512,
});
