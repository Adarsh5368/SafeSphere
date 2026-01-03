import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const cognitoClient = new CognitoIdentityProviderClient({});

interface AppSyncEvent {
  info?: {
    fieldName?: string;
  };
  identity?: {
    sub?: string;
    username?: string;
  };
  arguments?: Record<string, unknown>;
}

// Validation functions
function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
}

function validateUserType(userType: string): void {
  if (!["PARENT", "CHILD"].includes(userType)) {
    throw new Error("Invalid user type. Must be PARENT or CHILD");
  }
}

function validatePhone(phone?: string | null): void {
  if (phone && phone.length < 10) {
    throw new Error("Invalid phone number");
  }
}

// Helper function to generate random password for child accounts
function generateRandomPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Ensure at least one of each required character type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
  password += "0123456789"[Math.floor(Math.random() * 10)]; // number
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special char
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Helper function to generate family code
function generateFamilyCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Create User Function
async function createUser(event: AppSyncEvent) {
  const args = event.arguments || {};
  const { email, name, userType, phone, profilePhoto } = args as {
    email: string;
    name: string;
    userType: string;
    phone?: string;
    profilePhoto?: string;
  };
  
  try {
    // Validation
    validateEmail(email);
    validateUserType(userType);
    if (phone) validatePhone(phone);

    // Generate user ID and family code (for parents)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const familyCode = userType === 'PARENT' ? generateFamilyCode() : undefined;
    
    // Create user in Cognito
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: process.env.AMPLIFY_AUTH_USERPOOL_ID,
      Username: email,
      TemporaryPassword: generateRandomPassword(),
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
        { Name: 'custom:userType', Value: userType },
        ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
        ...(profilePhoto ? [{ Name: 'picture', Value: profilePhoto }] : []),
        ...(familyCode ? [{ Name: 'custom:familyCode', Value: familyCode }] : []),
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email for now
    });

    await cognitoClient.send(createUserCommand);

    // Create user record in DynamoDB
    const userRecord = {
      id: userId,
      email,
      name,
      userType,
      parentId: userType === 'CHILD' ? undefined : null,
      childIds: userType === 'PARENT' ? [] : undefined,
      familyCode,
      phone: phone || null,
      trustedContacts: userType === 'PARENT' ? [] : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: userId, // For authorization
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Item: userRecord,
      })
    );

    return {
      success: true,
      data: {
        user: userRecord,
        message: "User created successfully",
      },
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Update User Function
async function updateUser(event: AppSyncEvent) {
  const args = event.arguments || {};
  const { id, name, phone, profilePhoto, childIds } = args as {
    id: string;
    name?: string;
    phone?: string;
    profilePhoto?: string;
    childIds?: string[];
  };
  
  let currentUserId: string | undefined;
  if (event.identity && "sub" in event.identity) {
    currentUserId = event.identity.sub;
  }

  if (!currentUserId) {
    throw new Error("Unauthorized");
  }

  // Verify user can only update their own profile
  if (id !== currentUserId) {
    return {
      success: false,
      error: 'Unauthorized: Can only update your own profile',
    };
  }

  try {
    // Get current user data
    const userResult = await docClient.send(
      new GetCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Key: { id },
      })
    );

    if (!userResult.Item) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Validate phone if provided
    if (phone) {
      validatePhone(phone);
    }

    // Prepare update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    if (name) {
      updateExpressions.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = name;
    }

    if (phone !== undefined) {
      updateExpressions.push('phone = :phone');
      expressionAttributeValues[':phone'] = phone;
    }

    if (profilePhoto !== undefined) {
      updateExpressions.push('profilePhoto = :profilePhoto');
      expressionAttributeValues[':profilePhoto'] = profilePhoto;
    }

    if (childIds && userResult.Item.userType === 'PARENT') {
      updateExpressions.push('childIds = :childIds');
      expressionAttributeValues[':childIds'] = childIds;
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    // Update DynamoDB record
    await docClient.send(
      new UpdateCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    // Update Cognito attributes if needed
    const cognitoUpdates = [];
    if (name) cognitoUpdates.push({ Name: 'name', Value: name });
    if (phone) cognitoUpdates.push({ Name: 'phone_number', Value: phone });
    if (profilePhoto) cognitoUpdates.push({ Name: 'picture', Value: profilePhoto });

    if (cognitoUpdates.length > 0) {
      await cognitoClient.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: process.env.AMPLIFY_AUTH_USERPOOL_ID,
          Username: userResult.Item.email,
          UserAttributes: cognitoUpdates,
        })
      );
    }

    return {
      success: true,
      data: {
        id,
        message: "User updated successfully",
      },
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Create Child User Function
async function createChildUser(event: AppSyncEvent) {
  const args = event.arguments || {};
  const { name, parentId, parentEmail, age } = args as {
    name: string;
    parentId: string;
    parentEmail: string;
    age?: number;
  };
  
  let currentUserId: string | undefined;
  if (event.identity && "sub" in event.identity) {
    currentUserId = event.identity.sub;
  }

  if (!currentUserId || currentUserId !== parentId) {
    throw new Error("Unauthorized: Can only create children for your own account");
  }

  try {
    // Verify parent exists and is actually a parent
    const parentResult = await docClient.send(
      new GetCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Key: { id: parentId },
      })
    );

    if (!parentResult.Item || parentResult.Item.userType !== 'PARENT') {
      return {
        success: false,
        error: 'Invalid parent or user is not a parent',
      };
    }

    // Generate email for child
    const emailParts = parentEmail.split('@');
    const childEmail = `${emailParts[0]}.child.${Date.now()}@${emailParts[1]}`;
    
    // Generate credentials for child
    const tempPassword = generateRandomPassword();
    const childId = `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create child in Cognito
    const createChildCommand = new AdminCreateUserCommand({
      UserPoolId: process.env.AMPLIFY_AUTH_USERPOOL_ID,
      Username: childEmail,
      TemporaryPassword: tempPassword,
      UserAttributes: [
        { Name: 'email', Value: childEmail },
        { Name: 'name', Value: name },
        { Name: 'custom:userType', Value: 'CHILD' },
        { Name: 'custom:parentId', Value: parentId },
        { Name: 'custom:familyCode', Value: parentResult.Item.familyCode },
        ...(age ? [{ Name: 'custom:age', Value: age.toString() }] : []),
      ],
      MessageAction: 'SUPPRESS',
    });

    await cognitoClient.send(createChildCommand);

    // Create child record in DynamoDB
    const childRecord = {
      id: childId,
      email: childEmail,
      name,
      userType: 'CHILD',
      parentId,
      familyCode: parentResult.Item.familyCode,
      age: age || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: parentId, // Parent owns child records
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Item: childRecord,
      })
    );

    // Update parent's childIds
    const currentChildIds = parentResult.Item.childIds || [];
    await docClient.send(
      new UpdateCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Key: { id: parentId },
        UpdateExpression: 'SET childIds = :childIds, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':childIds': [...currentChildIds, childId],
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    return {
      success: true,
      data: {
        user: childRecord,
        credentials: {
          email: childEmail,
          password: tempPassword,
        },
        message: "Child user created successfully",
      },
    };
  } catch (error) {
    console.error('Error creating child user:', error);
    return {
      success: false,
      error: `Failed to create child user: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Deactivate Child Function
async function deactivateChild(event: AppSyncEvent) {
  const args = event.arguments || {};
  const { childId } = args as { childId: string };
  
  let parentId: string | undefined;
  if (event.identity && "sub" in event.identity) {
    parentId = event.identity.sub;
  }

  if (!parentId) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify child exists and belongs to this parent
    const childResult = await docClient.send(
      new GetCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Key: { id: childId },
      })
    );

    if (!childResult.Item || childResult.Item.parentId !== parentId) {
      return {
        success: false,
        error: 'Child not found or not your child',
      };
    }

    // Deactivate child in DynamoDB
    await docClient.send(
      new UpdateCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Key: { id: childId },
        UpdateExpression: 'SET isActive = :isActive, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':isActive': false,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    // TODO: Disable child in Cognito as well
    // This would require additional Cognito operations

    return {
      success: true,
      data: {
        id: childId,
        isActive: false,
        message: "Child deactivated successfully",
      },
    };
  } catch (error) {
    console.error('Error deactivating child:', error);
    return {
      success: false,
      error: `Failed to deactivate child: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Get User With Children Function
async function getUserWithChildren(event: AppSyncEvent) {
  const args = event.arguments || {};
  const { userId } = args as { userId: string };
  
  let currentUserId: string | undefined;
  if (event.identity && "sub" in event.identity) {
    currentUserId = event.identity.sub;
  }

  // Verify user can only get their own data
  if (userId !== currentUserId) {
    return {
      success: false,
      error: 'Unauthorized: Can only access your own data',
    };
  }

  try {
    // Get user data
    const userResult = await docClient.send(
      new GetCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Key: { id: userId },
      })
    );

    if (!userResult.Item) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const user = userResult.Item;
    let children = [];

    // If user is a parent, fetch children data
    if (user.userType === 'PARENT' && user.childIds && user.childIds.length > 0) {
      const childPromises = user.childIds.map((childId: string) =>
        docClient.send(
          new GetCommand({
            TableName: process.env.USER_TABLE_NAME!,
            Key: { id: childId },
          })
        )
      );

      const childResults = await Promise.all(childPromises);
      children = childResults
        .map(result => result.Item)
        .filter(child => child && child.isActive !== false);
    }

    return {
      success: true,
      data: {
        user,
        children,
        message: "User data retrieved successfully",
      },
    };
  } catch (error) {
    console.error('Error getting user with children:', error);
    return {
      success: false,
      error: `Failed to get user data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Export a single handler that routes to specific functions based on the field name
export const handler = async (event: AppSyncEvent) => {
  console.log('User management handler called:', JSON.stringify(event, null, 2));

  try {
    const fieldName = event.info?.fieldName;

    switch (fieldName) {
      case 'registerUser':
        return await createUser(event);
      case 'updateUserProfile':
        return await updateUser(event);
      case 'createChildUser':
        return await createChildUser(event);
      case 'deactivateChild':
        return await deactivateChild(event);
      case 'getUserWithChildren':
        return await getUserWithChildren(event);
      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (error) {
    console.error('Handler error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};