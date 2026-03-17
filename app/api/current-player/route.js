import { NextResponse } from 'next/server';

// Server-side in-memory store for current auction state
// This persists as long as the dev server is running
let currentState = {
  playerSerialNumber: null,
  loadedAt: null,
};

// GET - Display page polls this to know which player to show
export async function GET() {
  return NextResponse.json({ success: true, ...currentState });
}

// POST - Scorekeeper sets the current player being auctioned
export async function POST(request) {
  try {
    const body = await request.json();
    const { playerSerialNumber } = body;

    currentState = {
      playerSerialNumber: playerSerialNumber ?? null,
      loadedAt: Date.now(),
    };

    return NextResponse.json({ success: true, ...currentState });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
