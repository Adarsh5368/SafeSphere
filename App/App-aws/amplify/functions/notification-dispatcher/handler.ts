import { DynamoDBStreamEvent } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const snsClient = new SNSClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event: DynamoDBStreamEvent) => {
  try {
    if (!process.env.USER_TABLE_NAME) {
      throw new Error('USER_TABLE_NAME environment variable not set');
    }

    for (const record of event.Records) {
      if (record.eventName !== 'INSERT') continue;

      const alert = record.dynamodb?.NewImage;
      if (!alert) continue;

      const parentId = alert.parentId?.S;
      const alertType = alert.type?.S;
      const message = alert.message?.S;

      if (!parentId || !alertType) continue;

      // Get parent details
      const parentResult = await docClient.send(
        new GetCommand({
          TableName: process.env.USER_TABLE_NAME,
          Key: { id: parentId },
        })
      );

      const parent = parentResult.Item;

      if (!parent?.phone) {
        console.log(`No phone number for parent ${parentId}`);
        continue;
      }

      // Send SMS notification with error handling
      try {
        await snsClient.send(
          new PublishCommand({
            PhoneNumber: parent.phone,
            Message: `CareNest Alert: ${message}`,
          })
        );
        console.log(`SMS sent successfully to ${parent.phone}`);
      } catch (smsError) {
        console.error(`Failed to send SMS to ${parent.phone}:`, smsError);
      }
    }
  } catch (error) {
    console.error('Notification dispatcher error:', error);
    throw error;
  }
};
