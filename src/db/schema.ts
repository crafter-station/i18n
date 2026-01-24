import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Rooms table
export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(), // nanoid(10)
  name: text("name").notNull(),
  dailyRoomUrl: text("daily_room_url"),
  dailyRoomName: text("daily_room_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

// Participants table
export const participants = pgTable("participants", {
  id: text("id").primaryKey(), // visitorId + roomId
  visitorId: text("visitor_id").notNull(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  email: text("email"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
});

// Transcripts table
export const transcripts = pgTable("transcripts", {
  id: text("id").primaryKey(), // nanoid(12)
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  participantId: text("participant_id").notNull(),
  speakerName: text("speaker_name"),
  originalText: text("original_text").notNull(),
  originalLanguage: text("original_language").notNull(),
  translatedTexts: jsonb("translated_texts").$type<Record<string, string>>(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Relations
export const roomsRelations = relations(rooms, ({ many }) => ({
  participants: many(participants),
  transcripts: many(transcripts),
}));

export const participantsRelations = relations(participants, ({ one }) => ({
  room: one(rooms, {
    fields: [participants.roomId],
    references: [rooms.id],
  }),
}));

export const transcriptsRelations = relations(transcripts, ({ one }) => ({
  room: one(rooms, {
    fields: [transcripts.roomId],
    references: [rooms.id],
  }),
}));

// Types
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type Transcript = typeof transcripts.$inferSelect;
export type NewTranscript = typeof transcripts.$inferInsert;
