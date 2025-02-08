import { relations, sql } from "drizzle-orm";
import {
  index,
  decimal,
  json,
  integer,
  numeric,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";
import { PlaceDetails } from "~/constants/types";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `tartanhacks_${name}`);

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const events = createTable("event", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: timestamp("date", { mode: "date", withTimezone: true }).notNull(),
  startTime: varchar("start_time", { length: 10 }).notNull(),
  endTime: varchar("end_time", { length: 10 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  priceRanges: text("price_ranges").notNull(),
  cuisineTypes: text("cuisine_types").notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  hostId: varchar("host_id", { length: 255 })
    .notNull()
    .references(() => users.id),
});

export type HostEvent = typeof events.$inferSelect;

export const eventResponses = createTable("event_response", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: varchar("event_id", { length: 255 })
    .notNull()
    .references(() => events.id),
  name: varchar("name", {length: 255 }).notNull().default('No Name'),
  email: varchar("email", { length: 255 }).notNull(),
  dietaryRestrictions: text("dietary_restrictions").notNull(),
  preferredCuisines: text("preferred_cuisines").notNull(),
  antiPreferredCuisines: text("anti_preferred_cuisines").notNull(),
  acceptablePriceRanges: text("acceptable_price_ranges").notNull(),
  comments: text("comments"),
  rankedCuisines: text("ranked_cuisines").notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
});

export const places = createTable("place", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: varchar("event_id", { length: 255 })
    .notNull()
    .references(() => events.id),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  rating: decimal("rating", { precision: 3, scale: 1 }),
  totalRatings: integer("total_ratings"),
  priceLevel: integer("price_level"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  website: varchar("website", { length: 255 }),
  placeId: varchar("place_id", { length: 255 }).notNull(),
  types: json("types").$type<string[]>(),
  cuisineTypes: json("cuisine_types").$type<string[]>(),
  features: json("features").$type<{
    wheelchair_accessible: boolean;
    serves_vegetarian: boolean;
    delivery: boolean;
    dine_in: boolean;
    takeout: boolean;
  }>(),
  openingHours: json("opening_hours").$type<string[]>(),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
});

export const placeReviews = createTable("place_review", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  placeId: varchar("place_id", { length: 255 })
    .notNull()
    .references(() => places.id),
  name: varchar("name", { length: 255 }),
  text: text("text"),
  rating: varchar("rating", { length: 10 }),
  publishTime: timestamp("publish_time", {
    mode: "date",
    withTimezone: true,
  }),
  relativePublishTime: varchar("relative_publish_time", { length: 255 }),
  authorName: varchar("author_name", { length: 255 }),
  authorPhotoUrl: varchar("author_photo_url", { length: 255 }),
  authorUrl: varchar("author_url", { length: 255 }),
});

export const apiLogs = createTable("api_log", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  timestamp: timestamp("timestamp", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
    event_id: varchar("event_id", { length: 255 })
    .references(() => events.id),
  request: json("request").$type<{
    area?: string;
    radius?: string;
    [key: string]: unknown;
  }>(),
  response: json("response").$type<{
    uniquePlaces?: number;
    savedToDb?: {
      totalPlaces: number;
      savedPlaces: number;
      savedReviews: number;
      error?: unknown;
    };
    error?: unknown;
    [key: string]: unknown;
  }>(),
  duration: integer("duration").notNull(),
  error: text("error"),
  status: integer("status").notNull().default(200),
});
export const rankedPlaces = createTable("ranked_places", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  event_id: varchar("event_id", { length: 255 })
    .notNull()
    .references(() => events.id),
  place_details: json("place_details").$type<PlaceDetails>(),
  score: numeric("score", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const preferences = createTable("", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", {length: 255 })
    .notNull()
    .references(() => users.id),
  priceRanges: text("price_ranges").notNull(),
  cuisineTypes: text("cuisine_types").notNull(),
  rankedCuisines: text("ranked_cuisines").notNull(),
})

export const preferencesRelations = relations(preferences, ({ one }) => ({
  user: one(users, { fields: [preferences.userId], references: [users.id] }),
}));

export const rankedPlacesRelations = relations(rankedPlaces, ({ one }) => ({
  event: one(events, {
    fields: [rankedPlaces.event_id],
    references: [events.id],
  }),
}));

export const placesRelations = relations(places, ({ one, many }) => ({
  event: one(events, {
    fields: [places.eventId],
    references: [events.id],
  }),
  reviews: many(placeReviews),
}));

export const placeReviewsRelations = relations(placeReviews, ({ one }) => ({
  place: one(places, {
    fields: [placeReviews.placeId],
    references: [places.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  host: one(users, {
    fields: [events.hostId],
    references: [users.id],
  }),
  places: many(places),
  apiLogs: many(apiLogs),
  rankedPlaces: many(rankedPlaces),
  responses: many(eventResponses),
}));

export const eventResponsesRelations = relations(eventResponses, ({ one }) => ({
  event: one(events, {
    fields: [eventResponses.eventId],
    references: [events.id],
  }),
}));

export const apiLogsRelations = relations(apiLogs, ({ one }) => ({
  event: one(events, {
    fields: [apiLogs.event_id],
    references: [events.id],
  }),
}));
