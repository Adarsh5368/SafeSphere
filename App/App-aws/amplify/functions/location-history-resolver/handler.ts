import type { Schema } from "../../data/resource";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

type Handler = Schema["getLocationHistory"]["functionHandler"];

export const handler: Handler = async (event) => {
  const { userId, startTime, endTime } = event.arguments;
  
  let requesterId: string | undefined;
  if (event.identity && "sub" in event.identity) {
    requesterId = event.identity.sub;
  }

  if (!requesterId) {
    throw new Error("Unauthorized");
  }

  // Check if requester has permission to access this user's location history
  let hasAccess = false;
  
  // Case 1: User requesting their own history
  if (requesterId === userId) {
    hasAccess = true;
  } else {
    // Case 2: Parent requesting child's history
    try {
      const targetUserResult = await docClient.send(
        new GetCommand({
          TableName: process.env.USER_TABLE_NAME!,
          Key: { id: userId },
        })
      );

      const targetUser = targetUserResult.Item;
      
      // Check if the target user is a child of the requester
      if (targetUser?.parentId === requesterId && targetUser?.userType === 'CHILD') {
        hasAccess = true;
      }
    } catch (error) {
      console.error(`Error validating access to user ${userId}:`, error);
    }
  }

  if (!hasAccess) {
    throw new Error("Forbidden: You don't have permission to access this location history");
  }

  // Get location history for the specified time range
  try {
    const locationResult = await docClient.send(
      new QueryCommand({
        TableName: process.env.LOCATION_TABLE_NAME!,
        IndexName: "locationsByUser",
        KeyConditionExpression: "userId = :userId AND #timestamp BETWEEN :startTime AND :endTime",
        ExpressionAttributeNames: {
          "#timestamp": "timestamp"
        },
        ExpressionAttributeValues: {
          ":userId": userId,
          ":startTime": startTime,
          ":endTime": endTime,
        },
        ScanIndexForward: false, // Latest first
        Limit: 500, // Reasonable limit to prevent large responses
      })
    );

    const locations = (locationResult.Items || []).map(location => ({
      id: location.id,
      userId: location.userId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || null,
      timestamp: location.timestamp,
      speed: location.speed || null,
      heading: location.heading || null,
      owner: location.owner || undefined,
      createdAt: location.createdAt || new Date().toISOString(),
      updatedAt: location.updatedAt || new Date().toISOString(),
    }));

    return locations;
  } catch (error) {
    console.error(`Error fetching location history for user ${userId}:`, error);
    throw new Error("Failed to retrieve location history");
  }
};