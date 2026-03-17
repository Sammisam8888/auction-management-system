import { google } from 'googleapis';
import { SHEET_IDS, SHEET_NAMES, PLAYER_COLUMNS, TEAM_COLUMNS, PLAYER_STATUS } from './constants';

// Create authenticated Google Sheets client
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

// ==================== READ OPERATIONS ====================

export async function getPlayers() {
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_IDS.PLAYERS,
    range: `${SHEET_NAMES.PLAYERS}!A1:P200`,
  });

  const rows = response.data.values || [];
  if (rows.length <= 1) return []; // Only header row or empty

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return dataRows.map((row, index) => ({
    serialNumber: index + 1,
    rowIndex: index + 2, // 1-indexed, +1 for header
    name: row[PLAYER_COLUMNS.NAME] || '',
    regdNo: row[PLAYER_COLUMNS.REGD_NO] || '',
    phone: row[PLAYER_COLUMNS.PHONE] || '',
    branch: row[PLAYER_COLUMNS.BRANCH] || '',
    room: row[PLAYER_COLUMNS.ROOM] || '',
    role: row[PLAYER_COLUMNS.ROLE] || '',
    rating: row[PLAYER_COLUMNS.RATING] || '',
    photo: row[PLAYER_COLUMNS.PHOTO] || '',
    playerType: row[PLAYER_COLUMNS.PLAYER_TYPE] || 'Domestic',
    basePrice: row[PLAYER_COLUMNS.BASE_PRICE] || '',
    soldTeam: row[PLAYER_COLUMNS.SOLD_TEAM] || '',
    soldPrice: row[PLAYER_COLUMNS.SOLD_PRICE] || '',
    round: row[PLAYER_COLUMNS.ROUND] || '1',
    status: row[PLAYER_COLUMNS.STATUS] || PLAYER_STATUS.PENDING,
  }));
}

export async function getTeams() {
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_IDS.TEAMS,
    range: `${SHEET_NAMES.TEAMS}!A1:Q10`,
  });

  const rows = response.data.values || [];
  if (rows.length <= 1) return [];

  const dataRows = rows.slice(1);

  return dataRows.map((row, index) => ({
    rowIndex: index + 2,
    teamName: row[TEAM_COLUMNS.TEAM_NAME] || '',
    playingOwner: row[TEAM_COLUMNS.PLAYING_OWNER] || '',
    nonPlayingOwner: row[TEAM_COLUMNS.NON_PLAYING_OWNER] || '',
    purseRemaining: row[TEAM_COLUMNS.PURSE_REMAINING] || '125',
    domesticCount: row[TEAM_COLUMNS.DOMESTIC_COUNT] || '0',
    foreignCount: row[TEAM_COLUMNS.FOREIGN_COUNT] || '0',
    totalCount: row[TEAM_COLUMNS.TOTAL_COUNT] || '0',
  }));
}

// ==================== WRITE OPERATIONS ====================

// Column letters for player sheet writes
const PLAYER_COL_LETTERS = {
  SOLD_TEAM: 'M',
  SOLD_PRICE: 'N',
  ROUND: 'O',
  STATUS: 'P',
};

// Column letters for team sheet writes
const TEAM_COL_LETTERS = {
  PURSE_REMAINING: 'N',
  DOMESTIC_COUNT: 'O',
  FOREIGN_COUNT: 'P',
  TOTAL_COUNT: 'Q',
};

export async function markPlayerSold(playerRowIndex, soldTeam, soldPrice, round) {
  const sheets = getSheets();
  
  // Update player row: sold_team, sold_price, round, status
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_IDS.PLAYERS,
    range: `${SHEET_NAMES.PLAYERS}!${PLAYER_COL_LETTERS.SOLD_TEAM}${playerRowIndex}:${PLAYER_COL_LETTERS.STATUS}${playerRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[soldTeam, soldPrice, round, PLAYER_STATUS.SOLD]],
    },
  });
}

export async function markPlayerUnsold(playerRowIndex, round) {
  const sheets = getSheets();
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_IDS.PLAYERS,
    range: `${SHEET_NAMES.PLAYERS}!${PLAYER_COL_LETTERS.SOLD_TEAM}${playerRowIndex}:${PLAYER_COL_LETTERS.STATUS}${playerRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['', '', round, PLAYER_STATUS.UNSOLD]],
    },
  });
}

export async function updateTeamStats(teamRowIndex, purseRemaining, domesticCount, foreignCount, totalCount) {
  const sheets = getSheets();
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_IDS.TEAMS,
    range: `${SHEET_NAMES.TEAMS}!${TEAM_COL_LETTERS.PURSE_REMAINING}${teamRowIndex}:${TEAM_COL_LETTERS.TOTAL_COUNT}${teamRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[purseRemaining, domesticCount, foreignCount, totalCount]],
    },
  });
}
