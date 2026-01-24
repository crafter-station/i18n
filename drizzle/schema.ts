import { pgTable, unique, uuid, text, timestamp, foreignKey, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clerkId: text("clerk_id").notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_clerk_id_unique").on(table.clerkId),
]);

export const rooms = pgTable("rooms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dailyRoomName: text("daily_room_name").notNull(),
	dailyRoomUrl: text("daily_room_url").notNull(),
	createdByFingerprint: text("created_by_fingerprint").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => [
	unique("rooms_daily_room_name_unique").on(table.dailyRoomName),
]);

export const participants = pgTable("participants", {
	id: text().primaryKey().notNull(),
	visitorId: text("visitor_id").notNull(),
	roomId: uuid("room_id").notNull(),
	username: text().notNull(),
	preferredLanguage: text("preferred_language").default('en').notNull(),
	email: text(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
	leftAt: timestamp("left_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.id],
			name: "participants_room_id_rooms_id_fk"
		}).onDelete("cascade"),
]);

export const transcripts = pgTable("transcripts", {
	id: text().primaryKey().notNull(),
	roomId: uuid("room_id").notNull(),
	participantId: text("participant_id").notNull(),
	speakerName: text("speaker_name"),
	originalText: text("original_text").notNull(),
	originalLanguage: text("original_language").notNull(),
	translatedTexts: jsonb("translated_texts"),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.id],
			name: "transcripts_room_id_rooms_id_fk"
		}).onDelete("cascade"),
]);
