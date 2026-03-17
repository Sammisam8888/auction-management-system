'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice, formatPurse } from '@/lib/constants';

function getRoleClass(role) {
    const r = (role || '').toLowerCase();
    if (r.includes('bat')) return 'batsman';
    if (r.includes('bowl')) return 'bowler';
    return 'all-rounder';
}

function getTeamColorClass(teamName) {
    const name = (teamName || '').toUpperCase().trim();
    if (name.includes('TEAM A')) return 'team-a';
    if (name.includes('TEAM B')) return 'team-b';
    if (name.includes('TEAM C')) return 'team-c';
    if (name.includes('TEAM D')) return 'team-d';
    return '';
}

export default function StatisticsPage() {
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        async function fetchData() {
            try {
                const [playersRes, teamsRes] = await Promise.all([
                    fetch('/api/players'),
                    fetch('/api/teams'),
                ]);
                const playersData = await playersRes.json();
                const teamsData = await teamsRes.json();

                if (playersData.success) setPlayers(playersData.players);
                if (teamsData.success) setTeams(teamsData.teams);
            } catch (err) {
                console.error('Error fetching statistics:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // ── Computed stats ──
    const soldPlayers = players.filter(p => p.status === 'SOLD');

    // Highest budget player (highest sold price)
    const highestBudgetPlayer = soldPlayers.length
        ? soldPlayers.reduce((max, p) => (Number(p.soldPrice) > Number(max.soldPrice) ? p : max), soldPlayers[0])
        : null;

    // Highest bid per role
    const getHighestByRole = (keyword) => {
        const filtered = soldPlayers.filter(p => (p.role || '').toLowerCase().includes(keyword));
        if (!filtered.length) return null;
        return filtered.reduce((max, p) => (Number(p.soldPrice) > Number(max.soldPrice) ? p : max), filtered[0]);
    };

    const highestAllRounder = getHighestByRole('all');
    const highestBatsman = getHighestByRole('bat');
    const highestBowler = getHighestByRole('bowl');

    // Team rosters
    const getTeamRoster = (teamName) =>
        players.filter(p => p.status === 'SOLD' && (p.soldTeam || '').toUpperCase().trim() === (teamName || '').toUpperCase().trim());

    if (loading) {
        return (
            <div className="stats-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="stats-page">
            {/* Header */}
            <div className="stats-header">
                <Link href="/" className="stats-back">← Back</Link>
                <h1 className="stats-title">KPL 2026 — Statistics</h1>
                <div style={{ width: 80 }}></div>
            </div>

            {/* Tabs */}
            <div className="stats-tabs">
                {[
                    { key: 'general', label: '🏆 General Stats' },
                    { key: 'players', label: '🏏 Player Stats' },
                    { key: 'teams', label: '👥 Team Stats' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`stats-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="stats-content">

                {/* ═══════ GENERAL STATS ═══════ */}
                {activeTab === 'general' && (
                    <div className="stats-general" key="general">
                        {/* Highest Budget Player */}
                        <div className="stats-highlight-section">
                            <h2 className="stats-section-title">👑 Highest Budget Player</h2>
                            {highestBudgetPlayer ? (
                                <div className="stats-highlight-card crown">
                                    <div className="highlight-rank">💰</div>
                                    <div className="highlight-info">
                                        <div className="highlight-name">{highestBudgetPlayer.name}</div>
                                        <div className="highlight-meta">
                                            <span className={`role-chip ${getRoleClass(highestBudgetPlayer.role)}`}>
                                                {highestBudgetPlayer.role}
                                            </span>
                                            <span className="type-chip">{highestBudgetPlayer.playerType}</span>
                                        </div>
                                    </div>
                                    <div className="highlight-price-section">
                                        <div className="highlight-sold-price">{formatPrice(highestBudgetPlayer.soldPrice)}</div>
                                        <div className="highlight-team">Purchased by <strong>{highestBudgetPlayer.soldTeam}</strong></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="stats-empty">No players sold yet</div>
                            )}
                        </div>

                        {/* Role-wise highest bids */}
                        <div className="stats-highlight-section">
                            <h2 className="stats-section-title">🎯 Highest Bid by Role</h2>
                            <div className="stats-role-grid">
                                {/* All Rounder */}
                                <div className="stats-role-card all-rounder">
                                    <div className="role-card-header">
                                        <span className="role-card-icon">🌟</span>
                                        <span className="role-card-label">All Rounder</span>
                                    </div>
                                    {highestAllRounder ? (
                                        <div className="role-card-body">
                                            <div className="role-card-name">{highestAllRounder.name}</div>
                                            <div className="role-card-price">{formatPrice(highestAllRounder.soldPrice)}</div>
                                            <div className="role-card-team">{highestAllRounder.soldTeam}</div>
                                        </div>
                                    ) : (
                                        <div className="role-card-empty">No data</div>
                                    )}
                                </div>

                                {/* Batsman */}
                                <div className="stats-role-card batsman">
                                    <div className="role-card-header">
                                        <span className="role-card-icon">🏏</span>
                                        <span className="role-card-label">Batsman</span>
                                    </div>
                                    {highestBatsman ? (
                                        <div className="role-card-body">
                                            <div className="role-card-name">{highestBatsman.name}</div>
                                            <div className="role-card-price">{formatPrice(highestBatsman.soldPrice)}</div>
                                            <div className="role-card-team">{highestBatsman.soldTeam}</div>
                                        </div>
                                    ) : (
                                        <div className="role-card-empty">No data</div>
                                    )}
                                </div>

                                {/* Bowler */}
                                <div className="stats-role-card bowler">
                                    <div className="role-card-header">
                                        <span className="role-card-icon">🎳</span>
                                        <span className="role-card-label">Bowler</span>
                                    </div>
                                    {highestBowler ? (
                                        <div className="role-card-body">
                                            <div className="role-card-name">{highestBowler.name}</div>
                                            <div className="role-card-price">{formatPrice(highestBowler.soldPrice)}</div>
                                            <div className="role-card-team">{highestBowler.soldTeam}</div>
                                        </div>
                                    ) : (
                                        <div className="role-card-empty">No data</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ PLAYER STATS ═══════ */}
                {activeTab === 'players' && (
                    <div className="stats-players" key="players">
                        <div className="stats-table-wrapper">
                            <table className="stats-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Type</th>
                                        <th>Base Price</th>
                                        <th>Sold Price</th>
                                        <th>Team</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((player, idx) => (
                                        <tr key={player.serialNumber} className={`status-row ${(player.status || '').toLowerCase()}`}>
                                            <td className="col-serial">{idx + 1}</td>
                                            <td className="col-name">{player.name}</td>
                                            <td>
                                                <span className={`role-chip ${getRoleClass(player.role)}`}>
                                                    {player.role || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`type-chip ${(player.playerType || '').toLowerCase().includes('foreign') ? 'foreign' : 'domestic'}`}>
                                                    {(player.playerType || 'Domestic').replace(/\s*\(.*\)/, '')}
                                                </span>
                                            </td>
                                            <td className="col-price">{formatPrice(player.basePrice)}</td>
                                            <td className="col-price">{player.status === 'SOLD' ? formatPrice(player.soldPrice) : '—'}</td>
                                            <td className="col-team">{player.soldTeam || '—'}</td>
                                            <td>
                                                <span className={`status-badge ${(player.status || 'pending').toLowerCase()}`}>
                                                    {player.status || 'PENDING'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ═══════ TEAM STATS ═══════ */}
                {activeTab === 'teams' && (
                    <div className="stats-teams" key="teams">
                        <div className="team-roster-grid">
                            {teams.map(team => {
                                const roster = getTeamRoster(team.teamName);
                                return (
                                    <div key={team.teamName} className={`team-roster-card ${getTeamColorClass(team.teamName)}`}>
                                        <div className="roster-header">
                                            <h3 className="roster-team-name">{team.teamName}</h3>
                                            <span className="roster-count">{roster.length} players</span>
                                        </div>

                                        {/* Roster Table */}
                                        <div className="roster-list">
                                            {roster.length > 0 ? (
                                                <table className="roster-table">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Player</th>
                                                            <th>Role</th>
                                                            <th>Type</th>
                                                            <th>Sold Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {roster.map((p, i) => (
                                                            <tr key={p.serialNumber}>
                                                                <td>{i + 1}</td>
                                                                <td className="col-name">{p.name}</td>
                                                                <td>
                                                                    <span className={`role-chip small ${getRoleClass(p.role)}`}>
                                                                        {p.role || '—'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className={`type-chip small ${(p.playerType || '').toLowerCase().includes('foreign') ? 'foreign' : 'domestic'}`}>
                                                                        {(p.playerType || 'Domestic').replace(/\s*\(.*\)/, '')}
                                                                    </span>
                                                                </td>
                                                                <td className="col-price">{formatPrice(p.soldPrice)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="roster-empty">No players purchased yet</div>
                                            )}
                                        </div>

                                        {/* Team Summary */}
                                        <div className="roster-summary">
                                            <div className="roster-stat">
                                                <span className="roster-stat-label">🏠 Domestic</span>
                                                <span className="roster-stat-value">{team.domesticCount || 0}</span>
                                            </div>
                                            <div className="roster-stat">
                                                <span className="roster-stat-label">✈️ Foreign</span>
                                                <span className="roster-stat-value">{team.foreignCount || 0}</span>
                                            </div>
                                            <div className="roster-stat purse">
                                                <span className="roster-stat-label">💰 Purse Left</span>
                                                <span className="roster-stat-value">{formatPurse(team.purseRemaining)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
