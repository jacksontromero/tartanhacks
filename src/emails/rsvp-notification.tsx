// src/emails/rsvp-notification.tsx
import {
  Html,
  Body,
  Container,
  Text,
  Button,
  Heading,
} from '@react-email/components';

interface RSVPNotificationEmailProps {
  hostName: string;
  eventName: string;
  eventDate: string;
}

export const RSVPNotificationEmail = ({
  hostName,
  eventName,
  eventDate,
}: RSVPNotificationEmailProps) => {


  return (
    <Html>
      <Body>
        <Container>
          <Heading>New RSVP Update</Heading>
          <Text>Hi{hostName === '' ? '!' : ` ${hostName}!` },</Text>
          <Text>
            A new guest has responded with their preferences for your event "{eventName}" on {eventDate}. Check out your dashboard for updates to the restaurant options!
          </Text>
          <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/events`}>
            View Event Dashboard
          </Button>
        </Container>
      </Body>
    </Html>
  );
};