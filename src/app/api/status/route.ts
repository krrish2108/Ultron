import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/`);
    
    if (!response.ok) {
      return NextResponse.json({ error: `Backend returned ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[STATUS API ERROR]", error);
    return NextResponse.json({ error: "Backend is not reachable" }, { status: 503 });
  }
}
