import {
  Html,
  Body,
  Container,
  Text,
  Button,
  Heading,
} from '@react-email/components';

interface FinalRestaurantEmailProps {
  guestName: string;
  eventName: string;
  eventDate: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantWebsite?: string;
}

export const FinalRestaurantEmail = ({
  guestName,
  eventName,
  eventDate,
  restaurantName,
  restaurantAddress,
  restaurantWebsite,
}: FinalRestaurantEmailProps) => {
  return (
    <Html>
      <Body>
        <Container>
          <Heading>Restaurant Selected for {eventName}!</Heading>
          <Text>Hi{guestName === '' ? '!' : ` ${guestName}!`}</Text>
          <Text>
            The restaurant has been selected for {eventName} on {eventDate}.
          </Text>
          <Text>
            We'll be dining at {restaurantName}, located at {restaurantAddress}.
          </Text>
          {restaurantWebsite && (
            <Button href={restaurantWebsite}>
              View Restaurant Website
            </Button>
          )}
        </Container>
      </Body>
    </Html>
  );
};
