import { nanoid } from "nanoid";

export function generateRoomId() {
  return nanoid(10);
}

export function generateTranscriptId() {
  return nanoid(12);
}
