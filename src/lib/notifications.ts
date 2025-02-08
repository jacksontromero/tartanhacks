// src/lib/notifications.ts
import { resend } from './emails';
import { RSVPNotificationEmail } from '../emails/rsvp-notification';

interface SendRSVPNotificationParams {
  eventTitle: string;
  eventDate: Date;
  hostName: string;
  hostEmail: string;
}

export async function sendRSVPNotification({
  eventTitle, 
  eventDate,
  hostName,
  hostEmail,

}: SendRSVPNotificationParams) {

  try {
    // Format date
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Send email
    await resend.emails.send({
      from: 'no-reply@host-table.co',
      to: hostEmail,
      subject: `New RSVP for ${eventTitle}`,
      react: RSVPNotificationEmail({
        hostName: hostName || '',
        eventName: eventTitle,
        eventDate: formattedDate,
      }),
    });

  } catch (error) {
    console.error('Failed to send RSVP notification:', error);
    throw error;
  }
}
