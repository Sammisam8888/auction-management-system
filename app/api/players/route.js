import { NextResponse } from 'next/server';
import { getPlayers } from '@/lib/sheets';
import { convertDriveUrl } from '@/lib/constants';

export async function GET() {
    try {
        const players = await getPlayers();

        // Transform photo URLs for frontend
        const transformedPlayers = players.map(player => ({
            ...player,
            photoUrl: convertDriveUrl(player.photo),
        }));

        return NextResponse.json({ success: true, players: transformedPlayers });
    } catch (error) {
        console.error('Error fetching players:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
