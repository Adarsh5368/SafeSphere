import type { Schema } from "../../data/resource";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

// Validation functions
function validateCoordinates(latitude: number, longitude: number): void {
  if (latitude < -90 || latitude > 90) {
    throw new Error("Invalid latitude: must be between -90 and 90");
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error("Invalid longitude: must be between -180 and 180");
  }
}

function isValidPhoneNumber(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

// Rate limiting function
async function checkRateLimit(userId: string): Promise<void> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  
  try {
    const recentAlertsResult = await docClient.send(
      new QueryCommand({
        TableName: process.env.ALERT_TABLE_NAME!,
        KeyConditionExpression: "userId = :userId",
        FilterExpression: "#type = :panicType AND #timestamp > :oneMinuteAgo",
        ExpressionAttributeNames: {
          "#type": "type",
          "#timestamp": "timestamp"
        },
        ExpressionAttributeValues: {
          ":userId": userId,
          ":panicType": "PANIC",
          ":oneMinuteAgo": oneMinuteAgo,
        },
        ScanIndexForward: false,
        Limit: 1,
      })
    );

    if (recentAlertsResult.Items && recentAlertsResult.Items.length > 0) {
      throw new Error("Rate limit exceeded: Please wait before sending another panic alert");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Rate limit exceeded")) {
      throw error;
    }
    // If there's an error checking rate limit, log it but don't block the panic alert
    console.error("Error checking rate limit:", error);
  }
}

type Handler = Schema["triggerPanic"]["functionHandler"];

export const handler: Handler = async (event) => {
  const { latitude, longitude, message } = event.arguments;

  // Safe identity extraction
  let userId: string | undefined;
  if (event.identity && "sub" in event.identity) userId = event.identity.sub;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Input validation
  validateCoordinates(latitude, longitude);
  
  // Rate limiting - prevent spam panic alerts
  await checkRateLimit(userId);

  // ---- 1. Get child user ----
  const userResult = await docClient.send(
    new GetCommand({
      TableName: process.env.USER_TABLE_NAME,
      Key: { id: userId },
    })
  );

  const user = userResult.Item;
  const parentId = user?.parentId;

  if (!parentId) {
    throw new Error("Parent not found");
  }

  // ---- 2. Get parent user ----
  const parentResult = await docClient.send(
    new GetCommand({
      TableName: process.env.USER_TABLE_NAME,
      Key: { id: parentId },
    })
  );

  const parent = parentResult.Item;

  // trustedContacts is already JSON (no need to parse)
  const trustedContacts = parent?.trustedContacts || [];

  // ---- 3. Create alert ----
  const alert = {
    id: `panic-${userId}-${Date.now()}`,
    userId,
    parentId,
    type: "PANIC" as const,
    location: { latitude, longitude },
    geofenceId: undefined,
    geofenceName: undefined,
    message: message || "Emergency! Child needs help!",
    isRead: false,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: process.env.ALERT_TABLE_NAME,
      Item: alert,
    })
  );

  // ---- 4. Build SNS message ----
  const notificationMessage = `🚨 PANIC ALERT 🚨
${user?.name || "Child"} triggered a panic alert!
Location: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})
Message: ${message || "Emergency! Child needs help!"}`;

  // ---- 5. Notify parent ----
  if (parent?.phone && isValidPhoneNumber(parent.phone)) {
    try {
      await snsClient.send(
        new PublishCommand({
          PhoneNumber: parent.phone,
          Message: notificationMessage,
        })
      );
    } catch (error) {
      console.error(`Failed to send SMS to parent ${parent.phone}:`, error);
    }
  } else if (parent?.phone) {
    console.error(`Invalid phone number format for parent: ${parent.phone}`);
  }

  // ---- 6. Notify trusted contacts ----
  const validContacts = Array.isArray(trustedContacts) ? trustedContacts : [];
  for (const contact of validContacts) {
    if (contact?.phone && typeof contact.phone === 'string' && isValidPhoneNumber(contact.phone)) {
      try {
        await snsClient.send(
          new PublishCommand({
            PhoneNumber: contact.phone,
            Message: notificationMessage,
          })
        );
      } catch (error) {
        console.error(`Failed to send SMS to trusted contact ${contact.phone}:`, error);
      }
    } else if (contact?.phone) {
      console.error(`Invalid phone number format for trusted contact: ${contact.phone}`);
    }
  }

  return alert;
};
