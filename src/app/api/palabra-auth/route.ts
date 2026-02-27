import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    clientId: process.env.PALABRA_CLIENT_ID,
    clientSecret: process.env.PALABRA_CLIENT_SECRET,
  });
}
