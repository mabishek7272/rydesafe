import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const comms = {
  /**
   * Send an email using Resend
   */
  async sendEmail({
    to,
    subject,
    text,
    html,
  }: {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
  }) {
    if (!resend) {
      console.warn('RESEND_API_KEY not found. Skipping email send.');
      return { error: 'API Key missing' };
    }

    try {
      const data = await resend.emails.send({
        from: 'TrackBuddy <notifications@trackbuddy.app>',
        to,
        subject,
        text,
        html: html || text,
      });
      return { data };
    } catch (error) {
      console.error('Error sending email:', error);
      return { error };
    }
  },

  /**
   * Send a WhatsApp message (Placeholder for Twilio/Meta API)
   */
  async sendWhatsApp({
    to,
    message,
  }: {
    to: string;
    message: string;
  }) {
    console.log(`[WHATSAPP] To: ${to}, Message: ${message}`);
    // Implementation for Twilio/Meta API would go here
    return { success: true };
  },

  /**
   * Send an SMS (Placeholder)
   */
  async sendSMS({
    to,
    message,
  }: {
    to: string;
    message: string;
  }) {
    console.log(`[SMS] To: ${to}, Message: ${message}`);
    return { success: true };
  },

  /**
   * Trigger a notification for a trip event
   */
  async notifyTripEvent(type: 'PICKED_UP' | 'DROPPED_OFF' | 'DELAYED', data: any) {
    const { studentName, parentEmail, parentPhone, location, time } = data;

    const messages = {
      PICKED_UP: `${studentName} has been picked up at ${time}.`,
      DROPPED_OFF: `${studentName} has been safely dropped off at ${time}.`,
      DELAYED: `Notice: The bus for ${studentName} is running late. Current location: ${location}.`,
    };

    const msg = messages[type];

    // Send Email
    if (parentEmail) {
      await this.sendEmail({
        to: parentEmail,
        subject: `TrackBuddy Update: ${type.replace('_', ' ')}`,
        text: msg,
      });
    }

    // Send WhatsApp/SMS if phone available
    if (parentPhone) {
      await this.sendWhatsApp({ to: parentPhone, message: msg });
    }
  }
};
