import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

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
export const restaurants = createTable("restaurants", {
  id: varchar("id", {length: 255})
  .notNull()
  .primaryKey()
  .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", {length: 255 }).notNull(),
  address: text("address").notNull(),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  rating: integer("rating").notNull(),
  totalRatings: integer("total_ratings"),
  phoneNumber: varchar("phone_number", {length: 255}),
  priceLevel: varchar("price_level", {length: 255}).notNull(),
  website: text("website"),
  openingHours: text("openingHours"), // need to combine opening hours list into single string
  wheelchairAccessible: boolean("wheelchair_accessible"),
  vegetarianFriendly: boolean("vegetarian_friendly"),
  
  eventID: varchar("event_id", {length: 255})
    .notNull()
    .references(() => events.id)
})

export const restaurantReviews = createTable("restaurant_reviews", {
  id: varchar("id", {length: 255})
  .notNull()
  .primaryKey()
  .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", {length: 255}).notNull(),
  review: text("review").notNull(),
  rating: integer("rating").notNull(),
  restaurantID : varchar("restaurant_id", {length: 255})
    .notNull()
    .references(() => restaurants.id)
})

export const restaurantTypes = createTable("restaurant_types", {
  id: varchar("id", {length:255})
  .notNull()
  .primaryKey()
  .$defaultFn(() => crypto.randomUUID()),
  type: varchar("type", {length: 255}).notNull(),
  restaurantID: varchar("restaurant_id", {length:255})
    .notNull()
    .references(() => restaurants.id)
})