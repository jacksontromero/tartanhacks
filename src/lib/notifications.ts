// src/lib/notifications.ts
import { resend } from './emails';
import { RSVPNotificationEmail } from '../emails/rsvp-notification';
import { FinalRestaurantEmail } from '../emails/final-restaurant-notification';

interface SendRSVPNotificationParams {
  eventTitle: string;
  eventDate: Date;
  hostName: string;
  hostEmail: string;
}

export interface SendFinalRestaurantNotificationParams {
  guestEmail: string;
  guestName: string;
  eventName: string;
  eventDate: Date;
  restaurantName: string;
  restaurantAddress: string;
  restaurantWebsite?: string;
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

export async function sendFinalRestaurantNotification({
  guestEmail,
  guestName,
  eventName,
  eventDate,
  restaurantName,
  restaurantAddress,
  restaurantWebsite,
}: SendFinalRestaurantNotificationParams) {
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
      to: guestEmail,
      subject: `Restaurant Selected for ${eventName}`,
      react: FinalRestaurantEmail({
        guestName: guestName || '',
        eventName,
        eventDate: formattedDate,
        restaurantName,
        restaurantAddress,
        restaurantWebsite,
      }),
    });

  } catch (error) {
    console.error('Failed to send final restaurant notification:', error);
    throw error;
  }
}
