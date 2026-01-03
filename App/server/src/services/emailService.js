import nodemailer from "nodemailer";
import twilio from "twilio";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import dotenv from "dotenv";
import config from "../config/config.js";

// Load environment variables
dotenv.config();

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.twilioClient = null;
    this.snsClient = null;
    this.smsProvider = config.SMS_PROVIDER || "twilio";
    this.initializeServices();
  }

  async initializeServices() {
    await this.initEmailTransporter();
    this.initTwilioClient();
    this.initSNSClient();
  }

  async initEmailTransporter() {
    try {
      // Check if email credentials are configured
      if (!config.SMTP_EMAIL || !config.SMTP_PASSWORD) {
        this.createMockEmailTransporter();
        return;
      }

      this.emailTransporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: {
          user: config.SMTP_EMAIL,
          pass: config.SMTP_PASSWORD,
        },
      });

      // Verify connection
      await this.emailTransporter.verify();
    } catch (error) {
      this.createMockEmailTransporter();
    }
  }

  initTwilioClient() {
    try {
      if (
        !config.TWILIO_ACCOUNT_SID ||
        !config.TWILIO_AUTH_TOKEN ||
        !config.TWILIO_PHONE_NUMBER
      ) {
        this.createMockTwilioClient();
        return;
      }

      this.twilioClient = twilio(
        config.TWILIO_ACCOUNT_SID,
        config.TWILIO_AUTH_TOKEN
      );
    } catch (error) {
      this.createMockTwilioClient();
    }
  }

  initSNSClient() {
    try {
      if (!config.AWS_ACCESS_KEY_ID || !config.AWS_SECRET_ACCESS_KEY) {
        this.createMockSNSClient();
        return;
      }

      this.snsClient = new SNSClient({
        region: config.AWS_REGION,
        credentials: {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        },
      });
    } catch (error) {
      this.createMockSNSClient();
    }
  }

  createMockEmailTransporter() {
    this.emailTransporter = {
      sendMail: async (options) => {
        return { messageId: "mock-email-" + Date.now() };
      },
      verify: async () => true,
    };
  }

  createMockTwilioClient() {
    this.twilioClient = {
      messages: {
        create: async (options) => {
          return {
            sid: "mock-sms-" + Date.now(),
            status: "sent",
            to: options.to,
          };
        },
      },
    };
  }

  createMockSNSClient() {
    this.snsClient = {
      send: async (command) => {
        return {
          MessageId: "mock-sns-" + Date.now(),
          $metadata: { httpStatusCode: 200 },
        };
      },
    };
  }

  // Send SMS using configured provider
  async sendSMS(phoneNumber, message) {
    try {
      if (this.smsProvider === "sns") {
        return await this.sendSMSViaSNS(phoneNumber, message);
      } else {
        return await this.sendSMSViaTwilio(phoneNumber, message);
      }
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  async sendSMSViaTwilio(phoneNumber, message) {
    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: config.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        to: result.to,
        provider: "twilio",
      };
    } catch (error) {
      throw error;
    }
  }

  async sendSMSViaSNS(phoneNumber, message) {
    try {
      // AWS SNS requires E.164 format (e.g., +919971316247)
      // Ensure phone number starts with +
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber}`;

      const command = new PublishCommand({
        PhoneNumber: formattedPhone,
        Message: message,
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: "Transactional",
          },
        },
      });

      const result = await this.snsClient.send(command);

      return {
        success: true,
        messageId: result.MessageId,
        status: "sent",
        to: formattedPhone,
        provider: "aws-sns",
      };
    } catch (error) {
      throw error;
    }
  } // Send panic alert to multiple recipients
  async sendPanicAlert(child, parent, trustedContacts, location, message) {
    const notifications = [];

    // Professional and caring panic alert message
    const alertMessage = `URGENT ALERT - Safe Sphere
${
  child.name
} has triggered an emergency alert and may need immediate assistance.

Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
Time: ${new Date().toLocaleString()}
Message: ${message || "No additional message"}

Please check on ${
      child.name
    } as soon as possible. If you cannot reach them, consider contacting local authorities.`;

    // Notify parent via SMS
    if (parent.phone) {
      try {
        const result = await this.sendSMS(parent.phone, alertMessage);
        notifications.push({
          type: "parent",
          recipient: parent.phone,
          status: "success",
          method: "sms",
          result,
        });
      } catch (error) {
        notifications.push({
          type: "parent",
          recipient: parent.phone,
          status: "failed",
          method: "sms",
          error: error.message,
        });
      }
    }

    // Notify parent via email as backup
    if (parent.email) {
      try {
        await this.sendPanicAlertEmail(child, parent.email, location, message);
        notifications.push({
          type: "parent",
          recipient: parent.email,
          status: "success",
          method: "email",
        });
      } catch (error) {
        notifications.push({
          type: "parent",
          recipient: parent.email,
          status: "failed",
          method: "email",
          error: error.message,
        });
      }
    }

    // Notify trusted contacts
    for (const contact of trustedContacts) {
      if (contact.phone) {
        try {
          const result = await this.sendSMS(contact.phone, alertMessage);
          notifications.push({
            type: "trusted_contact",
            recipient: contact.phone,
            status: "success",
            method: "sms",
            result,
          });
        } catch (error) {
          notifications.push({
            type: "trusted_contact",
            recipient: contact.phone,
            status: "failed",
            method: "sms",
            error: error.message,
          });
        }
      }
    }

    return notifications;
  }

  // Send geofence alert
  async sendGeofenceAlert(child, parent, geofence, alertType, location) {
    const action = alertType === "GEOFENCE_ENTRY" ? "entered" : "left";

    // Professional geofence alert message
    const message = `Safe Sphere Location Update

${child.name} has ${action} the designated area "${geofence.name}".

Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
Time: ${new Date().toLocaleString()}

This is an automated notification to keep you informed of your family's whereabouts.`;

    if (parent.phone) {
      try {
        return await this.sendSMS(parent.phone, message);
      } catch (error) {
        throw error;
      }
    }
  }

  // Send panic alert email
  async sendPanicAlertEmail(child, parentEmail, location, message) {
    const subject = `URGENT: Emergency Alert from ${child.name}`;

    const text = `URGENT ALERT - Safe Sphere

${
  child.name
} has triggered an emergency alert and may need immediate assistance.

Details:
- Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
- Time: ${new Date().toLocaleString()}
- Message: ${message || "No additional message"}

Please check on ${
      child.name
    } as soon as possible. If you cannot reach them, consider contacting local authorities.

View on map: https://www.google.com/maps?q=${location.latitude},${
      location.longitude
    }`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">URGENT: Emergency Alert</h1>
        </div>
        
        <div style="background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; line-height: 1.6; color: #111827;">
            <strong>${
              child.name
            }</strong> has triggered an emergency alert and may need immediate assistance.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 10px 0; color: #374151;"><strong>Location:</strong> ${location.latitude.toFixed(
              6
            )}, ${location.longitude.toFixed(6)}</p>
            <p style="margin: 10px 0; color: #374151;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 10px 0; color: #374151;"><strong>Message:</strong> ${
              message || "No additional message"
            }</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #111827;">
            Please check on ${
              child.name
            } as soon as possible. If you cannot reach them, consider contacting local authorities.
          </p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://www.google.com/maps?q=${location.latitude},${
      location.longitude
    }" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Location on Map
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
          
          <p style="font-size: 14px; color: #6b7280; margin: 0;">
            This is an automated alert from Safe Sphere. For support, please contact our team.
          </p>
        </div>
      </div>
    `;

    await this.emailTransporter.sendMail({
      from: config.SMTP_EMAIL,
      to: parentEmail,
      subject: subject,
      text: text,
      html: html,
    });
  }

  // Send welcome email
  async sendWelcomeEmail(user, password = null) {
    try {
      const isChild = user.userType === 'CHILD';
      const subject = `Welcome to Safe Sphere, ${user.name}`;

      const text = `Welcome to Safe Sphere

Dear ${user.name},

Your ${user.userType.toLowerCase()} account has been successfully created. We're glad to have you as part of the Safe Sphere family.

Account Details:
- Email: ${user.email}
${
  isChild && password
    ? `- Temporary Password: ${password}\n\nFor your security, please change your password after your first login.`
    : ""
}

Safe Sphere helps families stay connected and informed about their loved ones' safety. ${
        isChild
          ? "Your parent or guardian can now track your location and receive alerts if needed."
          : "You can now add children to your account and set up safety zones."
      }

Thank you for choosing Safe Sphere to help keep your family safe.

Best regards,
The Safe Sphere Team`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Safe Sphere</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; line-height: 1.6; color: #111827;">
              Dear <strong>${user.name}</strong>,
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Your ${user.userType.toLowerCase()} account has been successfully created. We're glad to have you as part of the Safe Sphere family.
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #111827;">Account Details</h3>
              <p style="margin: 10px 0; color: #374151;"><strong>Email:</strong> ${
                user.email
              }</p>
              ${
                isChild && password
                  ? `
                <p style="margin: 10px 0; color: #374151;"><strong>Temporary Password:</strong> <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${password}</code></p>
                <p style="margin: 10px 0; color: #dc2626; font-size: 14px;">
                  <strong>Important:</strong> For your security, please change your password after your first login.
                </p>
              `
                  : ""
              }
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Safe Sphere helps families stay connected and informed about their loved ones' safety. 
              ${
                isChild
                  ? "Your parent or guardian can now track your location and receive alerts if needed."
                  : "You can now add children to your account and set up safety zones."
              }
            </p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${config.APP_URL || "http://localhost:3000"}" 
                 style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Get Started
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
            
            <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">
              Thank you for choosing Safe Sphere to help keep your family safe.
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              Best regards,<br>
              <strong>The Safe Sphere Team</strong>
            </p>
          </div>
        </div>
      `;

      await this.emailTransporter.sendMail({
        from: `Safe Sphere <${config.SMTP_EMAIL}>`,
        to: user.email,
        subject: subject,
        text: text,
        html: html,
      });
    } catch (error) {
      // Email sending failed silently
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
