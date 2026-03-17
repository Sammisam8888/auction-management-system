'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice, formatPurse, AUCTION_RULES } from '@/lib/constants';

function getTeamClass(teamName) {
  const name = (teamName || '').toUpperCase().trim();
  if (name.includes('TEAM A')) return 'team-a';
  if (name.includes('TEAM B')) return 'team-b';
  if (name.includes('TEAM C')) return 'team-c';
  if (name.includes('TEAM D')) return 'team-d';
  return '';
}

export default function ScorekeeperPage() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auction state
  const [serialInput, setSerialInput] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [activityLog, setActivityLog] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null); // { type: 'SELL' | 'UNSOLD' }
  const [toasts, setToasts] = useState([]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/players'),
      ]);
      const teamsData = await teamsRes.json();
      const playersData = await playersRes.json();

      if (teamsData.success) setTeams(teamsData.teams);
      if (playersData.success) setPlayers(playersData.players);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      addToast('Failed to fetch data', 'error');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toast system
  function addToast(message, type = 'info') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }

  // Load player by serial number
  function loadPlayer() {
    const serial = Number(serialInput);
    if (!serial || serial < 1) {
      addToast('Enter a valid serial number', 'error');
      return;
    }

    const player = players.find(p => p.serialNumber === serial);
    if (!player) {
      addToast(`Player #${serial} not found`, 'error');
      return;
    }

    if (player.status === 'SOLD') {
      addToast(`${player.name} is already SOLD to ${player.soldTeam}`, 'error');
      return;
    }

    setCurrentPlayer(player);
    setSelectedTeam('');
    setPriceInput(player.basePrice || '0.5');
    
    // Broadcast to display page via server-side API (works across devices)
    fetch('/api/current-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerSerialNumber: serial }),
    }).catch(err => console.error('Failed to sync current player:', err));

    addToast(`Loaded: ${player.name} (#${serial})`, 'info');
  }

  // Handle sell
  async function handleSell() {
    if (!currentPlayer || !selectedTeam || !priceInput) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/auction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SELL',
          playerSerialNumber: currentPlayer.serialNumber,
          soldTeam: selectedTeam,
          soldPrice: Number(priceInput),
          round: currentRound,
        }),
      });

      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        setActivityLog(prev => [{
          type: 'sold',
          text: `${currentPlayer.name} → ${selectedTeam} for ${formatPrice(priceInput)}`,
          time: new Date().toLocaleTimeString(),
        }, ...prev].slice(0, 10));

        // Reset & refresh
        setCurrentPlayer(null);
        setSelectedTeam('');
        setPriceInput('');
        setSerialInput('');
        setShowConfirm(null);
        await fetchData();
      } else {
        addToast(data.error, 'error');
        setShowConfirm(null);
      }
    } catch (err) {
      addToast('Network error: ' + err.message, 'error');
      setShowConfirm(null);
    }
    setSubmitting(false);
  }

  // Handle unsold
  async function handleUnsold() {
    if (!currentPlayer) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/auction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UNSOLD',
          playerSerialNumber: currentPlayer.serialNumber,
          round: currentRound,
        }),
      });

      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        setActivityLog(prev => [{
          type: 'unsold',
          text: `${currentPlayer.name} — UNSOLD (Round ${currentRound})`,
          time: new Date().toLocaleTimeString(),
        }, ...prev].slice(0, 10));

        setCurrentPlayer(null);
        setSelectedTeam('');
        setPriceInput('');
        setSerialInput('');
        setShowConfirm(null);
        await fetchData();
      } else {
        addToast(data.error, 'error');
        setShowConfirm(null);
      }
    } catch (err) {
      addToast('Network error: ' + err.message, 'error');
      setShowConfirm(null);
    }
    setSubmitting(false);
  }

  // Calculate purse after sale preview
  function getPurseAfter(teamName) {
    const team = teams.find(t => t.teamName.toUpperCase() === teamName.toUpperCase());
    if (!team || !priceInput) return null;
    const current = Number(team.purseRemaining) || 125;
    const priceInCrore = Number(priceInput);
    return (current - priceInCrore).toFixed(2);
  }

  // Check if team can buy this player
  function canTeamBuy(team) {
    if (!currentPlayer) return true;
    const isForeign = (currentPlayer.playerType || '').toLowerCase().includes('foreign');
    const foreignCount = Number(team.foreignCount) || 0;
    const totalCount = Number(team.totalCount) || 0;

    if (isForeign && foreignCount >= AUCTION_RULES.MAX_FOREIGN_PLAYERS) return false;
    if (totalCount >= AUCTION_RULES.MAX_SQUAD_SIZE) return false;
    return true;
  }

  // Stats for round filtering
  const unsoldInCurrentRound = players.filter(p => p.status === 'UNSOLD' && Number(p.round) === currentRound);
  const pendingPlayers = players.filter(p => p.status === 'PENDING');
  const soldPlayers = players.filter(p => p.status === 'SOLD');

  if (loading) {
    return (
      <div className="scorekeeper-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="scorekeeper-page">
      {/* Header */}
      <div className="scorekeeper-header">
        <h1 className="scorekeeper-title">⚡ KPL Scorekeeper</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            📋 {pendingPlayers.length} pending · ✅ {soldPlayers.length} sold · ❌ {unsoldInCurrentRound.length} unsold
          </div>
          <div className="round-indicator">
            🔄 Round {currentRound}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="scorekeeper-grid">
        {/* Left Column */}
        <div className="scorekeeper-left">
          {/* Player Loader */}
          <div className="panel">
            <div className="panel-title">📋 Load Player</div>
            <div className="player-loader">
              <input
                type="number"
                className="serial-input"
                placeholder="Serial #"
                value={serialInput}
                onChange={e => setSerialInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadPlayer()}
                min="1"
              />
              <button className="load-btn" onClick={loadPlayer}>
                Load
              </button>
            </div>

            {/* Player Preview */}
            {currentPlayer && (
              <div className="sk-player-preview">
                {currentPlayer.photoUrl && currentPlayer.photoUrl !== '/placeholder-player.png' ? (
                  <img
                    src={currentPlayer.photoUrl}
                    alt={currentPlayer.name}
                    className="sk-player-photo"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="sk-player-photo-placeholder"
                  style={{ display: currentPlayer.photoUrl && currentPlayer.photoUrl !== '/placeholder-player.png' ? 'none' : 'flex' }}
                >
                  {currentPlayer.name?.charAt(0)}
                </div>
                <div className="sk-player-info">
                  <div className="sk-player-name">{currentPlayer.name}</div>
                  <div className="sk-player-meta">
                    <span>🏏 {currentPlayer.role}</span>
                    <span>⭐ {currentPlayer.rating || '—'}</span>
                    <span>💰 {formatPrice(currentPlayer.basePrice)}</span>
                    <span className={`player-type-badge ${(currentPlayer.playerType || '').toLowerCase().includes('foreign') ? 'foreign' : 'domestic'}`}>
                      {(currentPlayer.playerType || 'Domestic').replace(/\s*\(.*\)/, '')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Team Selection + Price + Actions */}
          <div className="panel">
            <div className="panel-title">🎯 Auction Result</div>

            {/* Team buttons */}
            <div className="team-buttons">
              {teams.map(team => {
                const canBuy = canTeamBuy(team);
                return (
                  <button
                    key={team.teamName}
                    className={`team-select-btn ${getTeamClass(team.teamName)} ${selectedTeam === team.teamName ? 'selected' : ''} ${!canBuy ? 'disabled' : ''}`}
                    onClick={() => canBuy && setSelectedTeam(team.teamName)}
                    disabled={!currentPlayer || !canBuy}
                  >
                    <div className="team-btn-name">{team.teamName}</div>
                    <div className="team-btn-stats">
                      {formatPurse(team.purseRemaining)} · {team.totalCount || 0} players
                      {!canBuy && ' (LIMIT)'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Price input */}
            <div className="price-section">
              <div className="price-input-group">
                <input
                  type="number"
                  className="price-input"
                  placeholder="Price"
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  disabled={!currentPlayer}
                  min="1"
                />
                <span className="price-unit">Crores</span>
              </div>
              {selectedTeam && priceInput && (
                <div className="price-preview">
                  {selectedTeam} purse after sale: <strong>{formatPurse(getPurseAfter(selectedTeam))}</strong>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="action-buttons">
              <button
                className="action-btn sell"
                disabled={!currentPlayer || !selectedTeam || !priceInput || submitting}
                onClick={() => setShowConfirm({ type: 'SELL' })}
              >
                ✅ Confirm Sale
              </button>
              <button
                className="action-btn unsold"
                disabled={!currentPlayer || submitting}
                onClick={() => setShowConfirm({ type: 'UNSOLD' })}
              >
                ❌ Unsold
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="scorekeeper-right">
          {/* Round Controls */}
          <div className="panel">
            <div className="panel-title">🔄 Round Controls</div>
            <div className="round-controls">
              {[1, 2, 3].map(r => (
                <button
                  key={r}
                  className={`round-btn ${currentRound === r ? 'active' : ''}`}
                  onClick={() => setCurrentRound(r)}
                >
                  Round {r}
                  {r > 1 && (
                    <span style={{ display: 'block', fontSize: '0.7rem', marginTop: '2px', opacity: 0.7 }}>
                      {players.filter(p => p.status === 'UNSOLD' && Number(p.round) === r - 1).length} unsold
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Teams Overview */}
          <div className="panel">
            <div className="panel-title">📊 Teams Overview</div>
            <div className="teams-mini">
              {teams.map(team => (
                <div key={team.teamName} className="team-mini-card">
                  <div className="team-mini-name" style={{ color: getTeamColor(team.teamName) }}>
                    {team.teamName}
                  </div>
                  <div className="team-mini-stat">
                    <span>💰 Purse</span>
                    <span style={{ color: 'var(--gold)' }}>{formatPurse(team.purseRemaining)}</span>
                  </div>
                  <div className="team-mini-stat">
                    <span>🏠 Domestic</span>
                    <span>{team.domesticCount || 0}</span>
                  </div>
                  <div className="team-mini-stat">
                    <span>✈️ Foreign</span>
                    <span>{team.foreignCount || 0} / {AUCTION_RULES.MAX_FOREIGN_PLAYERS}</span>
                  </div>
                  <div className="team-mini-stat">
                    <span>👥 Total</span>
                    <span>{team.totalCount || 0} / {AUCTION_RULES.MAX_SQUAD_SIZE}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="panel">
            <div className="panel-title">📝 Recent Activity</div>
            <div className="activity-log">
              {activityLog.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                  No activity yet. Load a player and start the auction!
                </div>
              ) : (
                activityLog.map((item, i) => (
                  <div key={i} className="activity-item">
                    <div className={`activity-icon ${item.type}`}>
                      {item.type === 'sold' ? '✅' : '❌'}
                    </div>
                    <div className="activity-text" dangerouslySetInnerHTML={{ __html: item.text }}></div>
                    <div className="activity-time">{item.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            {showConfirm.type === 'SELL' ? (
              <>
                <div className="confirm-title">Confirm Sale</div>
                <div className="confirm-body">
                  Sell <strong>{currentPlayer?.name}</strong> to <strong>{selectedTeam}</strong> for <strong>{formatPrice(priceInput)}</strong>?
                </div>
                <div className="confirm-actions">
                  <button className="confirm-btn cancel" onClick={() => setShowConfirm(null)}>Cancel</button>
                  <button className="confirm-btn confirm" onClick={handleSell} disabled={submitting}>
                    {submitting ? 'Processing...' : 'Confirm Sale'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="confirm-title">Mark Unsold</div>
                <div className="confirm-body">
                  Mark <strong>{currentPlayer?.name}</strong> as <strong>UNSOLD</strong> in Round {currentRound}?
                </div>
                <div className="confirm-actions">
                  <button className="confirm-btn cancel" onClick={() => setShowConfirm(null)}>Cancel</button>
                  <button className="confirm-btn confirm" onClick={handleUnsold} disabled={submitting}>
                    {submitting ? 'Processing...' : 'Mark Unsold'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function getTeamColor(teamName) {
  const name = (teamName || '').toUpperCase().trim();
  if (name.includes('TEAM A')) return '#e63946';
  if (name.includes('TEAM B')) return '#457b9d';
  if (name.includes('TEAM C')) return '#2a9d8f';
  if (name.includes('TEAM D')) return '#e9c46a';
  return '#fff';
}
