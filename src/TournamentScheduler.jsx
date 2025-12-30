import React, { useState, useEffect, useMemo } from 'react';

// --- CONSTANTS & CONFIGURATION ---
const CONFIG = {
  pools: [
    { name: 'A', teams: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'] },
    { name: 'B', teams: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'] }
  ],
  courts: 3, // K Courts
  slotDuration: 8, // Minutes
  startTime: "09:00",
  maxSlots: 15 // Tighter cap
};

// Distinct colors for Time Slots (Graph Coloring Visualization)
const SLOT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98FB98', 
  '#DDA0DD', '#F0E68C', '#87CEFA', '#FFB6C1', '#C0C0C0',
  '#FFD700', '#ADFF2F', '#FF00FF', '#00CED1', '#FF4500'
];

// --- CSS STYLES (Vanilla) ---
const STYLES = `
  .ts-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #333;
    background-color: #f9fafb;
    min-height: 100vh;
    padding: 20px;
    box-sizing: border-box;
    width: 100vw;
    position: absolute;
    top: 0;
    left: 0;
  }
  .ts-wrapper {
    width: 100%;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .ts-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .ts-header {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .ts-header-logo {
    width: 180px;
    height: auto;
    flex-shrink: 0;
    margin-right: -120px;
  }
  .ts-header-content {
    flex: 1;
  }
  .ts-header h1 {
    color: #1e40af;
    margin: 0 0 8px 0;
    font-size: 24px;
  }
  .ts-header h2 {
    color: #1e40af;
    margin: 0 0 8px 0;
    font-size: 18px;
  }
  .ts-header p {
    color: #6b7280;
    margin: 0;
  }
  /* Metric Grid */
  .ts-metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  .ts-metric-card {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 16px;
    background: white;
  }
  .ts-metric-card.alert {
    background-color: #fef2f2;
    border-color: #fca5a5;
  }
  .ts-metric-label {
    font-size: 12px;
    text-transform: uppercase;
    color: #6b7280;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .ts-metric-value {
    font-size: 24px;
    font-weight: bold;
    color: #111;
  }
  .ts-metric-value.alert { color: #b91c1c; }
  
  /* Controls */
  .ts-controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }
  .ts-control-group {
    background: #f3f4f6;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ts-label-small {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    padding-left: 8px;
  }
  .ts-btn {
    border: none;
    background: transparent;
    padding: 6px 12px;
    font-size: 13px;
    border-radius: 4px;
    cursor: pointer;
    color: #4b5563;
  }
  .ts-btn:hover { background: rgba(0,0,0,0.05); }
  .ts-btn.active {
    background: white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    color: #1e40af;
    font-weight: 600;
  }
  
  /* Graph */
  .ts-graph-wrapper {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    display: flex;
    justify-content: center;
    padding: 20px;
    overflow: hidden;
  }

  /* Table */
  .ts-table-wrapper {
    overflow-x: auto;
  }
  .ts-table {
    width: 100%;
    min-width: 400px;
    border-collapse: collapse;
    font-size: 12px;
  }
  .ts-table th, .ts-table td {
    border: 1px solid #e5e7eb;
    padding: 8px;
    text-align: center;
  }
  .ts-table th {
    background: #f3f4f6;
    font-weight: 600;
  }
  /* Sticky Time Column */
  .ts-table th:first-child, .ts-table td:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    background: #fff;
    border-right: 2px solid #e5e7eb;
    text-align: left;
    font-family: monospace;
    font-weight: 600;
  }
  .ts-table th:first-child { background: #f3f4f6; }
  
  .ts-cell-idle {
    background-color: #fef2f2; /* Light red for idle penalty */
  }
  .ts-match-pill {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: bold;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .ts-match-pill:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  }
  .pill-pool-a { background: #dbeafe; color: #1e3a8a; border: 1px solid #bfdbfe; }
  .pill-pool-b { background: #dcfce7; color: #14532d; border: 1px solid #bbf7d0; }
  
  .ts-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 8px;
  }
  .ts-note {
    font-size: 12px;
    color: #6b7280;
    margin-top: 12px;
    font-style: italic;
  }
  .ts-helper-text {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 16px;
  }
  
  /* Side-by-side layout for graph and table */
  .ts-side-by-side {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  
  @media (max-width: 1200px) {
    .ts-side-by-side {
      grid-template-columns: 1fr;
    }
  }
`;

// --- HELPER: Time Formatting ---
const formatTime = (slotIndex) => {
  const totalMinutes = slotIndex * CONFIG.slotDuration;
  const hours = 9 + Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// --- ALGORITHM IMPLEMENTATION (PART D) ---

/**
 * Generates all round-robin matches for the given pools.
 */
const generateMatches = () => {
  let matches = [];
  let matchId = 1;
  CONFIG.pools.forEach(pool => {
    for (let i = 0; i < pool.teams.length; i++) {
      for (let j = i + 1; j < pool.teams.length; j++) {
        matches.push({
          id: matchId++,
          pool: pool.name,
          team1: pool.teams[i],
          team2: pool.teams[j],
          label: `${pool.teams[i]} vs ${pool.teams[j]}`
        });
      }
    }
  });
  return matches;
};

/**
 * Builds the conflict graph.
 * Nodes = Matches
 * Edges = Two matches share a team (cannot be played simultaneously).
 */
const buildConflictGraph = (matches) => {
  const adjacencyList = new Map();
  const degrees = new Map();

  // Initialize
  matches.forEach(m => {
    adjacencyList.set(m.id, []);
    degrees.set(m.id, 0);
  });

  // Build Edges
  for (let i = 0; i < matches.length; i++) {
    for (let j = i + 1; j < matches.length; j++) {
      const m1 = matches[i];
      const m2 = matches[j];

      // Two matches conflict if they share ANY team
      if (m1.team1 === m2.team1 || m1.team1 === m2.team2 || 
          m1.team2 === m2.team1 || m1.team2 === m2.team2) {
        
        adjacencyList.get(m1.id).push(m2.id);
        adjacencyList.get(m2.id).push(m1.id);
        
        degrees.set(m1.id, degrees.get(m1.id) + 1);
        degrees.set(m2.id, degrees.get(m2.id) + 1);
      }
    }
  }
  return { adjacencyList, degrees };
};

/**
 * MAIN HEURISTIC FUNCTION
 * This implements the Constructive Heuristic using Greedy Graph Coloring logic.
 */
const scheduleTournament = () => {
  const allMatches = generateMatches();
  const { adjacencyList, degrees } = buildConflictGraph(allMatches);

  // --- HEURISTIC STEP: SORTING (IMPROVED) ---
  // Step 1: Separate matches by pool
  const matchesA = allMatches.filter(m => m.pool === 'A');
  const matchesB = allMatches.filter(m => m.pool === 'B');
  
  // Step 2: Interleave them (A, B, A, B...) to prevent "Fatigue Walls"
  // This is a heuristic optimization to ensure court capacity is balanced.
  const interleavedMatches = [];
  const maxLen = Math.max(matchesA.length, matchesB.length);
  for (let i = 0; i < maxLen; i++) {
    if (matchesA[i]) interleavedMatches.push(matchesA[i]);
    if (matchesB[i]) interleavedMatches.push(matchesB[i]);
  }

  // Step 3: Primary Sort by Degree (Descending) still applies if degrees differ,
  // but since they are round-robin (uniform degree), the order largely respects the interleave.
  const sortedMatches = interleavedMatches.sort((a, b) => {
    const degDiff = degrees.get(b.id) - degrees.get(a.id);
    // If degrees are equal, preserve interleaved order (don't return 0 if indices differ)
    return degDiff; 
  });

  // State for the schedule: array of slots, each slot has array of courts
  // schedule[timeSlot][courtIndex] = matchObject | null
  const schedule = []; 
  
  // Track which slot each match was assigned to (for Graph Coloring visual)
  const matchSlotMap = new Map();

  // Helper to track when teams played last (for fatigue/rest constraints)
  // map: teamName -> array of timeSlots played
  const teamHistory = new Map();
  CONFIG.pools.forEach(p => p.teams.forEach(t => teamHistory.set(t, [])));

  // --- SCHEDULING LOOP ---
  const unschedulable = [];

  for (const match of sortedMatches) {
    let assigned = false;

    // Try to find the earliest valid time slot 't'
    for (let t = 0; t < CONFIG.maxSlots; t++) {
      // Ensure schedule array exists for this slot
      if (!schedule[t]) schedule[t] = Array(CONFIG.courts).fill(null);

      // Check Hard Constraint: Court Capacity
      // Are there empty courts at this slot?
      const emptyCourtIndex = schedule[t].findIndex(c => c === null);
      if (emptyCourtIndex === -1) continue; // Slot full

      // Check Hard Constraint: Team Clash
      // Is either team already playing in this slot?
      const team1Busy = schedule[t].some(m => m && (m.team1 === match.team1 || m.team2 === match.team1));
      const team2Busy = schedule[t].some(m => m && (m.team1 === match.team2 || m.team2 === match.team2));
      if (team1Busy || team2Busy) continue;

      // --- CONSTRAINT ENFORCEMENT (PART D) ---
      
      // 1. SOFT CONSTRAINT: FATIGUE
      // "A team should not play more than two consecutive matches."
      // Check: Did team play at t-1 AND t-2?
      const t1History = teamHistory.get(match.team1);
      const t2History = teamHistory.get(match.team2);
      
      const team1Fatigued = t1History.includes(t - 1) && t1History.includes(t - 2);
      const team2Fatigued = t2History.includes(t - 1) && t2History.includes(t - 2);

      if (team1Fatigued || team2Fatigued) {
        // Skip this slot to enforce fatigue constraint
        continue; 
      }

      // 2. SOFT CONSTRAINT: REST (BOREDOM)
      // "A team should not rest more than two consecutive slots."
      // This is harder to enforce strictly in a forward-greedy pass without backtracking.
      // However, by picking the *earliest* possible 't', we naturally minimize rest gaps.
      // We accept the slot if it's valid, relying on the greedy nature to compress the schedule.
      
      // --- ASSIGNMENT ---
      schedule[t][emptyCourtIndex] = match;
      matchSlotMap.set(match.id, t);
      teamHistory.get(match.team1).push(t);
      teamHistory.get(match.team2).push(t);
      assigned = true;
      break;
    }

    if (!assigned) {
      unschedulable.push(match);
    }
  }

  return { schedule, unschedulable, allMatches, adjacencyList, matchSlotMap };
};

/**
 * CALCULATE QUALITY SCORE (PART D)
 */
const calculateMetrics = (schedule, totalMatchesCount) => {
  let penalty = 0;
  let matchesScheduled = 0;
  let lastActiveSlotPerCourt = Array(CONFIG.courts).fill(-1);

  // 1. Determine the last active slot for each court
  for (let k = 0; k < CONFIG.courts; k++) {
    for (let t = schedule.length - 1; t >= 0; t--) {
      if (schedule[t] && schedule[t][k] !== null) {
        lastActiveSlotPerCourt[k] = t;
        break;
      }
    }
  }

  // --- PENALTY CALCULATION (PART D) ---
  // "A high penalty is applied if a court remains unused during a time slot 
  // (except after its final match)."
  const PENALTY_COST = 10; // Arbitrary "High" value

  for (let k = 0; k < CONFIG.courts; k++) {
    // Only iterate up to the last active slot for this specific court
    const limit = lastActiveSlotPerCourt[k];
    if (limit === -1) continue; // Court never used

    for (let t = 0; t < limit; t++) {
      if (!schedule[t] || schedule[t][k] === null) {
        penalty += PENALTY_COST;
      } else {
        matchesScheduled++;
      }
    }
    // Count the last match itself
    matchesScheduled++;
  }

  // --- EVALUATION FUNCTION (PART D) ---
  // Assesses solution quality based on minimizing penalty (idle time).
  // Lower score is better.
  return {
    totalPenalty: penalty,
    scheduledCount: matchesScheduled,
    completeness: `${matchesScheduled}/${totalMatchesCount}`,
    efficiency: matchesScheduled > 0 ? ((matchesScheduled / (matchesScheduled + (penalty/PENALTY_COST))) * 100).toFixed(1) + '%' : '0%'
  };
};

// --- COMPONENT UI ---

const TournamentScheduler = () => {
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [selectedPool, setSelectedPool] = useState('ALL');
  const [graphColorMode, setGraphColorMode] = useState('SLOT'); // 'POOL' or 'SLOT'
  const [selectedMatchId, setSelectedMatchId] = useState(null); // For highlighting

  useEffect(() => {
    // Run the algorithm on mount
    const result = scheduleTournament();
    setData(result);
    setMetrics(calculateMetrics(result.schedule, result.allMatches.length));
  }, []);

  if (!data) return <div style={{padding:'20px'}}>Loading Algorithm...</div>;

  return (
    <div className="ts-container">
      {/* Inject CSS Styles */}
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="ts-wrapper">
        
        {/* HEADER */}
        <header className="ts-card ts-header">
          <img 
            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhbp6027ByoM41hzxICC0-wqqgHqXJE0Ogu5ANps-V7P-AgpoV_60BXQw5LJimZ2r4qdLcXPwuMl8CfqJsnJWvlbBOYmvG1E6IPcDhYjuvpy3nPK-nmWUNtP7eFku1JK7Yn3JsMyrjqvRo/s400/UKM.png"
            alt="UKM Logo"
            className="ts-header-logo"
          />
          <div className="ts-header-content">
            <h1>P1: Constructive Heuristic (Greedy Graph-Based)</h1>
            <h2>{CONFIG.pools.length} Pools | {CONFIG.courts} Courts</h2>
            <p><br/></p>
            <p><b>P154051</b> AHMAD ZOFRAN BIN MAIMUN AQSHA LUBIS</p>
            <p><b>P154914</b> ANANTHA SAHTHIYAN </p>
          </div>
        </header>

        {/* METRICS PANEL (PART D & E-iv) */}
        <div className="ts-metrics-grid">
          <MetricCard label="Matches Scheduled" value={metrics?.completeness} />
          <MetricCard label="Total Penalty Score" value={metrics?.totalPenalty} isAlert={metrics?.totalPenalty > 0} />
          <MetricCard label="Court Efficiency" value={metrics?.efficiency} />
          <MetricCard label="Max Time Slots" value={data.schedule.length} />
        </div>

        {/* SIDE-BY-SIDE LAYOUT: GRAPH AND TABLE */}
        <div className="ts-side-by-side">
          
          {/* SECTION E (i): CONFLICT GRAPH */}
          <section className="ts-card">
            <div className="ts-controls">
              <h2 style={{margin:0, fontSize:'18px', color:'#111'}}>E) I) Conflict Graph</h2>
              <div style={{display:'flex', gap:'16px'}}>
                {/* Pool Filter */}
                <div className="ts-control-group">
                   <span className="ts-label-small">Filter:</span>
                   <button onClick={() => setSelectedPool('ALL')} className={`ts-btn ${selectedPool === 'ALL' ? 'active' : ''}`}>All</button>
                   <button onClick={() => setSelectedPool('A')} className={`ts-btn ${selectedPool === 'A' ? 'active' : ''}`}>Pool A</button>
                   <button onClick={() => setSelectedPool('B')} className={`ts-btn ${selectedPool === 'B' ? 'active' : ''}`}>Pool B</button>
                </div>
                
                {/* Color Mode Toggle */}
                <div className="ts-control-group">
                   <span className="ts-label-small">Color by:</span>
                   <button onClick={() => setGraphColorMode('POOL')} className={`ts-btn ${graphColorMode === 'POOL' ? 'active' : ''}`}>Pool</button>
                   <button onClick={() => setGraphColorMode('SLOT')} className={`ts-btn ${graphColorMode === 'SLOT' ? 'active' : ''}`}>Time Slot</button>
                </div>
              </div>
            </div>
            
            <p className="ts-helper-text">
              Nodes = Matches. Lines = Conflicts. Click on any node to highlight in table!<br/>
              {/* {graphColorMode === 'SLOT' ? (
                <span style={{color: '#7c3aed', fontWeight:'500'}}>Visualization of Graph Coloring.</span>
              ) : (
                <span>Standard view showing Pool A (Blue) and Pool B (Green).</span>
              )} */}
            </p>
            
            <div className="ts-graph-wrapper">
              <ConflictGraphVisualizer 
                matches={data.allMatches} 
                adjacencyList={data.adjacencyList} 
                matchSlotMap={data.matchSlotMap}
                filterPool={selectedPool}
                colorMode={graphColorMode}
                selectedMatchId={selectedMatchId}
                onMatchClick={setSelectedMatchId}
              />
            </div>
          </section>

          {/* SECTION E (iii): TIMETABLE / GANTT CHART */}
          <section className="ts-card ts-table-wrapper">
            <h2 style={{marginTop:0, marginBottom:'12px', fontSize:'18px'}}>E) III) Tournament Timetable</h2>
            
            <table className="ts-table">
              <thead>
                <tr>
                  <th>Time</th>
                  {Array.from({ length: CONFIG.courts }).map((_, i) => (
                    <th key={i}>Court {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.schedule.map((courts, tIndex) => (
                  <tr key={tIndex}>
                    <td>
                      <div style={{display:'flex', alignItems:'center'}}>
                        {/* Color indicator for Graph Coloring correlation */}
                        <span className="ts-dot" style={{ backgroundColor: SLOT_COLORS[tIndex % SLOT_COLORS.length] }}></span>
                        {formatTime(tIndex)}
                      </div>
                    </td>
                    {courts.map((match, cIndex) => {
                      const isEmpty = match === null;
                      const isSelected = match && match.id === selectedMatchId;
                      return (
                        <td 
                          key={cIndex} 
                          className={isEmpty ? 'ts-cell-idle' : ''}
                          style={isSelected ? {backgroundColor: '#fef08a'} : {}}
                        >
                          {match ? (
                            <div 
                              className={`ts-match-pill ${match.pool === 'A' ? 'pill-pool-a' : 'pill-pool-b'}`}
                              style={isSelected ? {cursor: 'pointer', fontWeight: 'bold'} : {cursor: 'pointer'}}
                              onClick={() => setSelectedMatchId(match.id === selectedMatchId ? null : match.id)}
                            >
                              {match.label}
                            </div>
                          ) : (
                            <span style={{color:'#9ca3af', fontStyle:'italic', fontSize:'12px'}}>Idle</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ts-note">
              * Shaded cells indicate idle time which may contribute to the penalty score. <br/>
              * Colored dots next to Time correspond to the "Time Slot" colors in the Graph View.
            </div>
          </section>
          
        </div>

      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const MetricCard = ({ label, value, isAlert }) => (
  <div className={`ts-metric-card ${isAlert ? 'alert' : ''}`}>
    <div className="ts-metric-label">{label}</div>
    <div className={`ts-metric-value ${isAlert ? 'alert' : ''}`}>{value}</div>
  </div>
);

// A Simple SVG Visualizer for the Graph
const ConflictGraphVisualizer = ({ matches, adjacencyList, matchSlotMap, filterPool, colorMode, selectedMatchId, onMatchClick }) => {
  const width = 600;
  const height = 450;
  const radius = 180;

  // Filter matches based on selection
  const visibleMatches = useMemo(() => {
    if (filterPool === 'ALL') return matches;
    return matches.filter(m => m.pool === filterPool);
  }, [matches, filterPool]);

  // Calculate node positions (Circular Layout)
  const nodes = useMemo(() => {
    return visibleMatches.map((match, index) => {
      // Split circle: Pool A left, Pool B right
      const angle = (index / visibleMatches.length) * 2 * Math.PI;
      const x = width / 2 + radius * Math.cos(angle);
      const y = height / 2 + radius * Math.sin(angle);
      
      // Determine Color
      let fillColor = '#E5E7EB'; // Default
      let strokeColor = '#9CA3AF';

      if (colorMode === 'POOL') {
         fillColor = match.pool === 'A' ? '#DBEAFE' : '#DCFCE7';
         strokeColor = match.pool === 'A' ? '#1E40AF' : '#166534';
      } else if (colorMode === 'SLOT') {
         const slot = matchSlotMap.get(match.id);
         if (slot !== undefined) {
            fillColor = SLOT_COLORS[slot % SLOT_COLORS.length];
            strokeColor = '#555';
         }
      }

      return { ...match, x, y, fillColor, strokeColor };
    });
  }, [visibleMatches, colorMode, matchSlotMap]);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{maxWidth:'100%'}}>
      {/* Draw Edges */}
      {nodes.map((node) => {
        const neighbors = adjacencyList.get(node.id) || [];
        return neighbors.map(neighborId => {
          const targetNode = nodes.find(n => n.id === neighborId);
          if (!targetNode || node.id > targetNode.id) return null; // Avoid duplicate lines
          return (
            <line 
              key={`${node.id}-${targetNode.id}`}
              x1={node.x} y1={node.y}
              x2={targetNode.x} y2={targetNode.y}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        });
      })}

      {/* Draw Nodes */}
      {nodes.map((node) => {
        const isSelected = node.id === selectedMatchId;
        return (
          <g 
            key={node.id} 
            transform={`translate(${node.x},${node.y})`}
            onClick={() => onMatchClick(node.id === selectedMatchId ? null : node.id)}
            style={{cursor: 'pointer'}}
          >
            <circle 
              r="18" 
              fill={node.fillColor} 
              stroke={isSelected ? '#000' : node.strokeColor} 
              strokeWidth={isSelected ? '3' : '2'}
              style={{transition: 'stroke 0.3s ease, strokeWidth 0.3s ease'}}
            />
            <text 
              textAnchor="middle" 
              dy=".3em" 
              fontSize="10" 
              fontWeight="bold"
              fill="#374151"
              style={{pointerEvents:'none'}}
            >
              {node.id}
            </text>
            <title>{node.label} (Slot: {matchSlotMap.get(node.id)})</title>
          </g>
        );
      })}
    </svg>
  );
};

export default TournamentScheduler;