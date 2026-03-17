// KPL Auction Constants

export const SHEET_IDS = {
  PLAYERS: process.env.PLAYERS_SHEET_ID,
  TEAMS: process.env.TEAMS_SHEET_ID,
};

export const SHEET_NAMES = {
  PLAYERS: 'players_list',
  TEAMS: 'teams',
};

// Column mappings (0-indexed for Google Sheets API)
// Players: Timestamp, Email, player_name, regd_no, ph_no, branch, Room Number, role, rating, player_photo, player_type, base_price, sold_team, sold_price, round, status
export const PLAYER_COLUMNS = {
  TIMESTAMP: 0,
  EMAIL: 1,
  NAME: 2,
  REGD_NO: 3,
  PHONE: 4,
  BRANCH: 5,
  ROOM: 6,
  ROLE: 7,
  RATING: 8,
  PHOTO: 9,
  PLAYER_TYPE: 10,
  BASE_PRICE: 11,
  SOLD_TEAM: 12,
  SOLD_PRICE: 13,
  ROUND: 14,
  STATUS: 15,
};

// Teams: Timestamp, team_name, playing_owner_name, regdno_playing_owner, branch_playing_owner, room_number, phno_playing_owner, nonplaying_owner_name, nonplaying_owner_phno, confirm_price, bidding_process, email, score, purse_remaining, domestic_players_count, foreign_players_count, total_players_count
export const TEAM_COLUMNS = {
  TIMESTAMP: 0,
  TEAM_NAME: 1,
  PLAYING_OWNER: 2,
  REGD_NO: 3,
  BRANCH: 4,
  ROOM: 5,
  PHONE: 6,
  NON_PLAYING_OWNER: 7,
  NON_PLAYING_OWNER_PHONE: 8,
  CONFIRM_PRICE: 9,
  BIDDING_PROCESS: 10,
  EMAIL: 11,
  SCORE: 12,
  PURSE_REMAINING: 13,
  DOMESTIC_COUNT: 14,
  FOREIGN_COUNT: 15,
  TOTAL_COUNT: 16,
};

// Auction rules (all prices in crore)
export const AUCTION_RULES = {
  INITIAL_PURSE: 125,           // 125 crore
  BASE_PRICE_DOMESTIC: 0.5,     // 0.5 crore (50 lakh)
  BASE_PRICE_PREMIUM: 2,        // 2 crore
  MAX_FOREIGN_PLAYERS: 5,
  MIN_SQUAD_SIZE: 13,
  MAX_SQUAD_SIZE: 16,
  MAX_ROUNDS: 3,
};

// Bid increment rules (in crore)
export const BID_INCREMENTS = [
  { maxPrice: 1, increment: 0.1 },      // up to 1Cr: +10L
  { maxPrice: 3, increment: 0.25 },     // 1Cr - 3Cr: +25L
  { maxPrice: Infinity, increment: 0.5 }, // 3Cr+: +50L
];

// Status values
export const PLAYER_STATUS = {
  PENDING: 'PENDING',
  SOLD: 'SOLD',
  UNSOLD: 'UNSOLD',
};

// Team colors for UI
export const TEAM_COLORS = {
  'TEAM A': { primary: '#e63946', gradient: 'linear-gradient(135deg, #e63946, #a8201a)', glow: 'rgba(230, 57, 70, 0.3)' },
  'TEAM B': { primary: '#457b9d', gradient: 'linear-gradient(135deg, #457b9d, #1d3557)', glow: 'rgba(69, 123, 157, 0.3)' },
  'TEAM C': { primary: '#2a9d8f', gradient: 'linear-gradient(135deg, #2a9d8f, #264653)', glow: 'rgba(42, 157, 143, 0.3)' },
  'TEAM D': { primary: '#e9c46a', gradient: 'linear-gradient(135deg, #e9c46a, #f4a261)', glow: 'rgba(233, 196, 106, 0.3)' },
};

// Convert Google Drive URL to direct image URL
export function convertDriveUrl(url) {
  if (!url) return '/placeholder-player.png';

  // Handle various Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://lh3.googleusercontent.com/d/${match[1]}=s400`;
    }
  }

  return url;
}

// Format price for display (all values in crore)
export function formatPrice(crore) {
  if (crore === undefined || crore === null || crore === '') return '—';
  const num = Number(crore);
  if (isNaN(num)) return '—';
  if (num % 1 === 0) return `₹${num} Cr`;
  return `₹${num} Cr`;
}

// Format purse (in crore)
export function formatPurse(crore) {
  if (crore === undefined || crore === null || crore === '') return '₹125 Cr';
  const num = Number(crore);
  return `₹${num % 1 === 0 ? num : num.toFixed(2)} Cr`;
}
