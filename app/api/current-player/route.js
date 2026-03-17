import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID = process.env.PLAYERS_SHEET_ID;
const CACHE_RANGE = 'cache!B1'; // B1 holds the current player serial number (A1 is the header "current_player_id")

function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// GET - Display page polls this to know which player to show
export async function GET() {
  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: CACHE_RANGE,
    });

    const value = response.data.values?.[0]?.[0] || '';
    const playerSerialNumber = value ? Number(value) : null;

    return NextResponse.json({
      success: true,
      playerSerialNumber: playerSerialNumber || null,
    });
  } catch (error) {
    console.error('Cache read error:', error.message);
    return NextResponse.json(
      { success: false, playerSerialNumber: null, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Scorekeeper sets the current player being auctioned
export async function POST(request) {
  try {
    const body = await request.json();
    const { playerSerialNumber } = body;
    const value = playerSerialNumber != null ? String(playerSerialNumber) : '';

    const sheets = getSheets();
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: CACHE_RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]],
      },
    });

    return NextResponse.json({
      success: true,
      playerSerialNumber: playerSerialNumber ?? null,
    });
  } catch (error) {
    console.error('Cache write error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
