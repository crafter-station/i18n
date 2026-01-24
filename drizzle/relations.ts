import { relations } from "drizzle-orm/relations";
import { rooms, participants, transcripts } from "./schema";

export const participantsRelations = relations(participants, ({one}) => ({
	room: one(rooms, {
		fields: [participants.roomId],
		references: [rooms.id]
	}),
}));

export const roomsRelations = relations(rooms, ({many}) => ({
	participants: many(participants),
	transcripts: many(transcripts),
}));

export const transcriptsRelations = relations(transcripts, ({one}) => ({
	room: one(rooms, {
		fields: [transcripts.roomId],
		references: [rooms.id]
	}),
}));