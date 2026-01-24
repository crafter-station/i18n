import { db } from "@/db";
import { rooms } from "@/db/schema";
import { generateRoomId } from "@/lib/nanoid";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name } = body as { name?: string };

    const roomId = generateRoomId();
    const roomName = name || `Call ${roomId.slice(0, 4)}`;

    // Create Daily.co room
    const dailyRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomId,
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

    // Insert into database
    await db.insert(rooms).values({
      id: roomId,
      name: roomName,
      dailyRoomUrl: dailyData.url,
      dailyRoomName: dailyData.name,
    });

    return Response.json({
      roomId,
      url: dailyData.url,
      name: roomName,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return Response.json({ error: "Failed to create room" }, { status: 500 });
  }
}
