import { eq } from "drizzle-orm";

import { db } from "@/db";
import { participants, rooms } from "@/db/schema";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { visitorId, username, preferredLanguage, email } = await req.json();

    // Look up room by dailyRoomName (the short nanoid slug)
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.dailyRoomName, roomId),
    });

    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Upsert participant
    const participantId = `${visitorId}_${room.id}`;

    await db
      .insert(participants)
      .values({
        id: participantId,
        visitorId,
        roomId: room.id,
        username,
        preferredLanguage: preferredLanguage || "en",
        email: email || null,
      })
      .onConflictDoUpdate({
        target: participants.id,
        set: {
          username,
          preferredLanguage: preferredLanguage || "en",
          email: email || null,
          joinedAt: new Date(),
        },
      });

    // Generate Daily.co meeting token using dailyRoomName
    const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: room.dailyRoomName,
          user_name: username,
          user_id: visitorId,
          exp: Math.floor(Date.now() / 1000) + 3600 * 2, // 2 hours
          permissions: {
            canAdmin: ["transcription"],
          },
        },
      }),
    });

    if (!tokenRes.ok) {
      const error = await tokenRes.text();
      console.error("Daily.co token error:", error);
      return Response.json(
        { error: "Failed to generate meeting token" },
        { status: 500 }
      );
    }

    const { token } = await tokenRes.json();

    return Response.json({
      token,
      roomUrl: room.dailyRoomUrl,
      dailyRoomName: room.dailyRoomName,
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return Response.json({ error: "Failed to join room" }, { status: 500 });
  }
}
