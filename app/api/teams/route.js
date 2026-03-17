import { NextResponse } from 'next/server';
import { getTeams } from '@/lib/sheets';

export async function GET() {
    try {
        const teams = await getTeams();
        return NextResponse.json({ success: true, teams });
    } catch (error) {
        console.error('Error fetching teams:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
