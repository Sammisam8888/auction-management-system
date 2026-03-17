import { NextResponse } from 'next/server';
import { getPlayers, getTeams, markPlayerSold, markPlayerUnsold, updateTeamStats } from '@/lib/sheets';
import { AUCTION_RULES, PLAYER_STATUS } from '@/lib/constants';

export async function POST(request) {
    try {
        const body = await request.json();
        const { action, playerSerialNumber, soldTeam, soldPrice, round = 1 } = body;

        // Fetch current data
        const [players, teams] = await Promise.all([getPlayers(), getTeams()]);

        // Find the player
        const player = players.find(p => p.serialNumber === playerSerialNumber);
        if (!player) {
            return NextResponse.json(
                { success: false, error: `Player #${playerSerialNumber} not found` },
                { status: 404 }
            );
        }

        if (player.status === PLAYER_STATUS.SOLD) {
            return NextResponse.json(
                { success: false, error: `Player ${player.name} is already sold to ${player.soldTeam}` },
                { status: 400 }
            );
        }

        // ==================== MARK UNSOLD ====================
        if (action === 'UNSOLD') {
            await markPlayerUnsold(player.rowIndex, round);
            return NextResponse.json({
                success: true,
                message: `${player.name} marked as UNSOLD in Round ${round}`,
                player: { ...player, status: PLAYER_STATUS.UNSOLD, round },
            });
        }

        // ==================== SELL PLAYER ====================
        if (action === 'SELL') {
            if (!soldTeam || !soldPrice) {
                return NextResponse.json(
                    { success: false, error: 'Team and price are required for selling' },
                    { status: 400 }
                );
            }

            const priceInCrore = Number(soldPrice);

            // Find the team
            const team = teams.find(t => t.teamName.toUpperCase() === soldTeam.toUpperCase());
            if (!team) {
                return NextResponse.json(
                    { success: false, error: `Team "${soldTeam}" not found` },
                    { status: 404 }
                );
            }

            const currentPurse = Number(team.purseRemaining) || AUCTION_RULES.INITIAL_PURSE;
            const currentDomestic = Number(team.domesticCount) || 0;
            const currentForeign = Number(team.foreignCount) || 0;
            const currentTotal = Number(team.totalCount) || 0;

            const isForeign = player.playerType?.toLowerCase().includes('foreign');

            // ---- Validation ----

            // Check purse
            if (priceInCrore > currentPurse) {
                return NextResponse.json(
                    { success: false, error: `Insufficient purse! ${soldTeam} has ₹${currentPurse} Cr but price is ₹${priceInCrore} Cr` },
                    { status: 400 }
                );
            }

            // Check foreign player limit
            if (isForeign && currentForeign >= AUCTION_RULES.MAX_FOREIGN_PLAYERS) {
                return NextResponse.json(
                    { success: false, error: `${soldTeam} already has ${AUCTION_RULES.MAX_FOREIGN_PLAYERS} foreign players (maximum reached)` },
                    { status: 400 }
                );
            }

            // Check squad size
            if (currentTotal >= AUCTION_RULES.MAX_SQUAD_SIZE) {
                return NextResponse.json(
                    { success: false, error: `${soldTeam} already has ${AUCTION_RULES.MAX_SQUAD_SIZE} players (maximum squad size reached)` },
                    { status: 400 }
                );
            }

            // ---- Execute sale ----

            // Update player row
            await markPlayerSold(player.rowIndex, soldTeam, priceInCrore, round);

            // Update team stats
            const newPurse = (currentPurse - priceInCrore).toFixed(2);
            const newDomestic = isForeign ? currentDomestic : currentDomestic + 1;
            const newForeign = isForeign ? currentForeign + 1 : currentForeign;
            const newTotal = currentTotal + 1;

            await updateTeamStats(team.rowIndex, newPurse, newDomestic, newForeign, newTotal);

            return NextResponse.json({
                success: true,
                message: `${player.name} SOLD to ${soldTeam} for ₹${priceInCrore} Cr`,
                player: { ...player, status: PLAYER_STATUS.SOLD, soldTeam, soldPrice: priceInCrore, round },
                team: {
                    ...team,
                    purseRemaining: newPurse,
                    domesticCount: String(newDomestic),
                    foreignCount: String(newForeign),
                    totalCount: String(newTotal),
                },
            });
        }

        return NextResponse.json(
            { success: false, error: `Unknown action: ${action}` },
            { status: 400 }
        );
    } catch (error) {
        console.error('Auction error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
