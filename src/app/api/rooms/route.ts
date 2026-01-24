import { db } from "@/db";
import { rooms } from "@/db/schema";
import { generateRoomId } from "@/lib/nanoid";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { visitorId } = body as { visitorId?: string };

    if (!visitorId) {
      return Response.json(
        { error: "visitorId is required" },
        { status: 400 }
      );
    }

    const dailyRoomName = generateRoomId();

    // Create Daily.co room
    const dailyRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: dailyRoomName,
        properties: {
          max_participants: 10,
          exp: Math.floor(Date.now() / 1000) + 3600 * 2, // 2 hours
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!dailyRes.ok) {
      const error = await dailyRes.text();
      console.error("Daily.co error:", error);
      return Response.json(
        { error: "Failed to create video room" },
        { status: 500 }
      );
    }

    const dailyData = await dailyRes.json();

    // Insert into database (id is auto-generated uuid)
    const [room] = await db
      .insert(rooms)
      .values({
        dailyRoomName: dailyData.name,
        dailyRoomUrl: dailyData.url,
        createdByFingerprint: visitorId,
        expiresAt: new Date(Date.now() + 3600 * 2 * 1000), // 2 hours
      })
      .returning();

    return Response.json({
      roomId: room.id,
      dailyRoomName: room.dailyRoomName,
      url: dailyData.url,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return Response.json({ error: "Failed to create room" }, { status: 500 });
  }
}
