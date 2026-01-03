import type { Schema } from "../../data/resource";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

type Handler = Schema["getChildrenLocations"]["functionHandler"];

export const handler: Handler = async (event) => {
  const { childIds } = event.arguments;
  
  let parentId: string | undefined;
  if (event.identity && "sub" in event.identity) {
    parentId = event.identity.sub;
  }

  if (!parentId) {
    throw new Error("Unauthorized");
  }

  // Validate that the requesting user is a parent of these children
  const validChildIds: string[] = [];
  
  for (const childId of childIds) {
    // Handle nullable childId
    if (!childId) continue;
    
    try {
      const userResult = await docClient.send(
        new GetCommand({
          TableName: process.env.USER_TABLE_NAME!,
          Key: { id: childId },
        })
      );

      const child = userResult.Item;
      
      // Check if this child belongs to the requesting parent
      if (child?.parentId === parentId && child?.userType === 'CHILD') {
        validChildIds.push(childId);
      } else {
        console.warn(`Parent ${parentId} attempted to access child ${childId} without permission`);
      }
    } catch (error) {
      console.error(`Error validating child ${childId}:`, error);
    }
  }

  if (validChildIds.length === 0) {
    return [];
  }

  // Get latest locations for validated children
  const locations = [];
  
  for (const childId of validChildIds) {
    try {
      const locationResult = await docClient.send(
        new QueryCommand({
          TableName: process.env.LOCATION_TABLE_NAME!,
          IndexName: "locationsByUser",
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": childId,
          },
          ScanIndexForward: false, // Latest first
          Limit: 1, // Only get most recent
        })
      );

      if (locationResult.Items && locationResult.Items.length > 0) {
        const location = locationResult.Items[0];
        // Ensure the location has all required fields for the schema
        const formattedLocation = {
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
        };
        locations.push(formattedLocation);
      }
    } catch (error) {
      console.error(`Error fetching location for child ${childId}:`, error);
    }
  }

  return locations;
};