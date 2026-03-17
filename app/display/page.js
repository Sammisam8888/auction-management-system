'use client';

import { useState, useEffect, useRef } from 'react';
import { formatPrice, formatPurse } from '@/lib/constants';

function getTeamClass(teamName) {
    const name = (teamName || '').toUpperCase().trim();
    if (name.includes('TEAM A')) return 'team-a';
    if (name.includes('TEAM B')) return 'team-b';
    if (name.includes('TEAM C')) return 'team-c';
    if (name.includes('TEAM D')) return 'team-d';
    return '';
}

function getRoleClass(role) {
    const r = (role || '').toLowerCase();
    if (r.includes('bat')) return 'batsman';
    if (r.includes('bowl')) return 'bowler';
    return 'all-rounder';
}

export default function DisplayPage() {
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const prevPlayerRef = useRef(null);
    const [playerKey, setPlayerKey] = useState(0);

    // Fetch data on mount + polling every 3s
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    async function fetchData() {
        try {
            const [teamsRes, playersRes] = await Promise.all([
                fetch('/api/teams'),
                fetch('/api/players'),
            ]);
            const teamsData = await teamsRes.json();
            const playersData = await playersRes.json();

            if (teamsData.success) setTeams(teamsData.teams);
            if (playersData.success) {
                setPlayers(playersData.players);

                // Find the current active/most recently actioned player
                const allPlayers = playersData.players;

                // Check if there's a currently loaded player (PENDING with some marker) 
                // or the most recently sold/unsold player
                const soldOrUnsold = allPlayers.filter(p => p.status === 'SOLD' || p.status === 'UNSOLD');
                const latestActioned = soldOrUnsold.length > 0 ? soldOrUnsold[soldOrUnsold.length - 1] : null;

                // Use localStorage to sync which player the scorekeeper is showing
                const displayedSerial = localStorage.getItem('kpl_current_player');
                if (displayedSerial) {
                    const displayPlayer = allPlayers.find(p => p.serialNumber === Number(displayedSerial));
                    if (displayPlayer) {
                        if (prevPlayerRef.current !== displayPlayer.serialNumber) {
                            setPlayerKey(k => k + 1);
                            prevPlayerRef.current = displayPlayer.serialNumber;
                        }
                        setCurrentPlayer(displayPlayer);
                    }
                } else if (latestActioned) {
                    setCurrentPlayer(latestActioned);
                }
            }
            setLoading(false);
        } catch (err) {
            console.error('Fetch error:', err);
        }
    }

    if (loading) {
        return (
            <div className="display-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="display-page">
            {/* Header */}
            <div className="display-header">
                <h1 className="display-title">Kratu Premier League 2026 — Auction</h1>
                <div className="live-badge">
                    <span className="live-dot"></span>
                    LIVE
                </div>
            </div>

            {/* Content */}
            <div className="display-content">
                {/* Left - Teams Panel */}
                <div className="teams-panel">
                    {teams.map((team, i) => (
                        <div key={team.teamName} className={`team-card ${getTeamClass(team.teamName)}`}>
                            <div className="team-card-name">{team.teamName}</div>
                            <div className="team-stats">
                                <div className="team-stat">
                                    <span className="team-stat-label">💰 Purse</span>
                                    <span className="team-stat-value purse">{formatPurse(team.purseRemaining)}</span>
                                </div>
                                <div className="team-stat">
                                    <span className="team-stat-label">🏠 Domestic</span>
                                    <span className="team-stat-value">{team.domesticCount || 0}</span>
                                </div>
                                <div className="team-stat">
                                    <span className="team-stat-label">✈️ Foreign</span>
                                    <span className="team-stat-value">{team.foreignCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right - Player Panel */}
                <div className="player-panel">
                    {currentPlayer ? (
                        <div className="player-display" key={playerKey}>
                            {/* Photo */}
                            <div className="player-photo-container">
                                {currentPlayer.photoUrl && currentPlayer.photoUrl !== '/placeholder-player.png' ? (
                                    <img
                                        src={currentPlayer.photoUrl}
                                        alt={currentPlayer.name}
                                        className="player-photo"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="player-photo-placeholder"
                                    style={{ display: currentPlayer.photoUrl && currentPlayer.photoUrl !== '/placeholder-player.png' ? 'none' : 'flex' }}
                                >
                                    {currentPlayer.name?.charAt(0) || '?'}
                                </div>
                            </div>

                            {/* Player type badge */}
                            <div className={`player-type-badge ${(currentPlayer.playerType || '').toLowerCase().includes('foreign') ? 'foreign' : 'domestic'}`}>
                                {(currentPlayer.playerType || 'Domestic').replace(/\s*\(.*\)/, '')}
                            </div>

                            {/* Name */}
                            <h2 className="player-name">{currentPlayer.name}</h2>

                            {/* Role */}
                            <span className={`player-role-badge ${getRoleClass(currentPlayer.role)}`}>
                                {currentPlayer.role || 'Player'}
                            </span>

                            {/* Info grid */}
                            <div className="player-info-grid">
                                <div className="player-info-item">
                                    <div className="player-info-label">Base Price</div>
                                    <div className="player-info-value">{formatPrice(currentPlayer.basePrice)}</div>
                                </div>
                                <div className="player-info-item">
                                    <div className="player-info-label">Rating</div>
                                    <div className="player-info-value rating">
                                        {currentPlayer.rating ? `${currentPlayer.rating}★` : '—'}
                                    </div>
                                </div>
                            </div>

                            {/* Sold/Unsold overlay */}
                            {currentPlayer.status === 'SOLD' && (
                                <div className="player-sold-overlay">
                                    <div className="player-sold-text">✅ SOLD!</div>
                                    <div className="player-sold-details">
                                        To <strong>{currentPlayer.soldTeam}</strong> for <strong>{formatPrice(currentPlayer.soldPrice)}</strong>
                                    </div>
                                </div>
                            )}
                            {currentPlayer.status === 'UNSOLD' && (
                                <div className="player-unsold-overlay">
                                    <div className="player-unsold-text">❌ UNSOLD</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="empty-player">
                            <div className="empty-player-icon">🏏</div>
                            <div className="empty-player-text">Waiting for Player</div>
                            <div className="empty-player-sub">Scorekeeper will load the next player</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
