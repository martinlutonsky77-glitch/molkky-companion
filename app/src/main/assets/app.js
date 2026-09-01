const UPDATE_CONFIG = {
  owner: "martinlutonsky77-glitch",
  repo: "molkky-companion",
  currentVersion: "1.4.0"
};

const STORAGE = {
  players: "molkky.players.v1",
  history: "molkky.history.v1"
};

let players = load(STORAGE.players, [
  { id: crypto.randomUUID(), name: "Martin" },
  { id: crypto.randomUUID(), name: "Petr" }
]);
let history = load(STORAGE.history, []);
let game = null;
let selectedPins = new Set();
let entryMode = localStorage.getItem("molkky.entryMode") || "pins";
let selectedPoints = null;
let pendingSetupIds = [];
let rematchPlayerIds = [];
let setupMode = "single";
let tournament = load("molkky.tournament.v1", null);
let lastFinishedRecord = null;

const $ = (id) => document.getElementById(id);
const views = ["homeView","setupView","gameView","statsView","gameOverView"];

function load(key, fallback){
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function showView(id){
  views.forEach(v => $(v).classList.toggle("active", v === id));
  if(id === "homeView") renderHome();
  if(id === "statsView") renderStats();
}
function esc(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function addPlayer(name){
  name = name.trim();
  if(!name) return;
  const p = { id: crypto.randomUUID(), name };
  players.push(p);
  save(STORAGE.players, players);
  return p;
}
function deletePlayer(id){
  players = players.filter(p => p.id !== id);
  save(STORAGE.players, players);
  renderHome();
}
function openPlayerDialog(context="home"){
  $("playerDialog").dataset.context = context;
  $("playerNameInput").value = "";
  $("playerDialog").showModal();
  setTimeout(() => $("playerNameInput").focus(), 30);
}

$("playerForm").addEventListener("submit", e => {
  e.preventDefault();
  const p = addPlayer($("playerNameInput").value);
  if(!p) return;
  $("playerDialog").close();
  if($("playerDialog").dataset.context === "setup"){
    pendingSetupIds.push(p.id);
    renderSetupPlayers();
  } else renderHome();
});


async function checkForUpdate(){
  const dlg=$("updateDialog"), msg=$("updateMessage"), btn=$("downloadUpdateBtn");
  btn.classList.add("hidden"); btn.onclick=null; dlg.showModal();
  if(UPDATE_CONFIG.owner.startsWith("DOPLN_")){
    msg.textContent="Aktualizace ještě není napojená na GitHub. Doplň GitHub uživatele do UPDATE_CONFIG.owner."; return;
  }
  msg.textContent="Kontroluji nejnovější verzi…";
  try{
    const api=`https://api.github.com/repos/${UPDATE_CONFIG.owner}/${UPDATE_CONFIG.repo}/releases/latest`;
    const r=await fetch(api,{headers:{"Accept":"application/vnd.github+json"}});
    if(!r.ok) throw new Error();
    const rel=await r.json();
    const latest=String(rel.tag_name||"").replace(/^v/i,"");
    const asset=(rel.assets||[]).find(a=>a.name.toLowerCase().endsWith(".apk"));
    if(compareVersions(latest,UPDATE_CONFIG.currentVersion)>0 && asset){
      msg.textContent=`K dispozici je verze ${latest}. Nainstalovaná verze je ${UPDATE_CONFIG.currentVersion}.`;
      btn.classList.remove("hidden"); btn.onclick=()=>{window.location.href=asset.browser_download_url;};
    } else msg.textContent=`Používáš aktuální verzi ${UPDATE_CONFIG.currentVersion}.`;
  }catch(e){ msg.textContent="Kontrolu aktualizace se nepodařilo provést."; }
}
function compareVersions(a,b){
  const pa=String(a).split('.').map(x=>parseInt(x)||0), pb=String(b).split('.').map(x=>parseInt(x)||0);
  for(let i=0;i<Math.max(pa.length,pb.length);i++){const x=pa[i]||0,y=pb[i]||0;if(x>y)return 1;if(x<y)return -1;}return 0;
}

function renderHome(){
  $("tournamentNightBtn").textContent = tournament ? `Pokračovat v turnajové noci (${tournament.gameIds.length} her)` : "Turnajová noc";
  $("playerList").innerHTML = players.length ? players.map(p => `
    <div class="player-row">
      <div class="player-name">${esc(p.name)}</div>
      <button class="ghost danger-text" data-del="${p.id}">Smazat</button>
    </div>`).join("") : `<div class="muted">Zatím žádní hráči.</div>`;

  document.querySelectorAll("[data-del]").forEach(b => b.onclick = () => deletePlayer(b.dataset.del));

  $("historyList").innerHTML = history.length ? history.slice(0,10).map(h => `
    <div class="history-row">
      <div>
        <div class="player-name">${esc(h.winnerName)}</div>
        <small>${new Date(h.endedAt).toLocaleString("cs-CZ")} · ${h.turns} hodů</small>
      </div>
      <div class="standing-score">${h.winnerScore}</div>
    </div>`).join("") : `<div class="muted">Historie je zatím prázdná.</div>`;
}

function startSetup(mode="single", ids=null){
  setupMode = mode;
  if(ids){
    pendingSetupIds = [...ids];
  } else if(tournament && mode === "tournament"){
    pendingSetupIds = [...tournament.playerIds];
  } else {
    pendingSetupIds = players.slice(0, Math.min(players.length, 4)).map(p => p.id);
  }
  renderSetupPlayers();
  showView("setupView");
}

function renderSetupPlayers(){
  $("setupModeTag").textContent = setupMode === "tournament" ? "Turnajová noc" : "Jedna hra";
  $("setupTitle").textContent = setupMode === "tournament" ? "Pořadí pro turnajovou hru" : "Vyber a seřaď hráče";

  const ordered = pendingSetupIds.map(id => players.find(p => p.id === id)).filter(Boolean);
  $("orderedPlayers").innerHTML = ordered.length ? ordered.map((p,i)=>`
    <div class="order-row" draggable="true" data-order-id="${p.id}">
      <span class="drag-handle" title="Přetáhnout">☰</span>
      <span class="player-name">${esc(p.name)}</span>
      <button class="mini" data-up="${p.id}" ${i===0?"disabled":""}>↑</button>
      <button class="mini" data-down="${p.id}" ${i===ordered.length-1?"disabled":""}>↓</button>
      <button class="remove-order" data-remove-order="${p.id}" title="Odebrat">×</button>
    </div>`).join("") : `<div class="muted">Vyber alespoň dva hráče.</div>`;

  const remaining = players.filter(p => !pendingSetupIds.includes(p.id));
  $("setupPlayers").innerHTML = remaining.length ? remaining.map(p => `
    <button class="setup-pool-btn" data-add-order="${p.id}">
      <span class="player-name">${esc(p.name)}</span><span>+ Přidat</span>
    </button>`).join("") : `<div class="muted">Všichni hráči jsou vybraní.</div>`;

  document.querySelectorAll("[data-add-order]").forEach(b => b.onclick = () => {
    pendingSetupIds.push(b.dataset.addOrder);
    renderSetupPlayers();
  });
  document.querySelectorAll("[data-remove-order]").forEach(b => b.onclick = () => {
    pendingSetupIds = pendingSetupIds.filter(id => id !== b.dataset.removeOrder);
    renderSetupPlayers();
  });
  document.querySelectorAll("[data-up]").forEach(b => b.onclick = () => {
    const i=pendingSetupIds.indexOf(b.dataset.up);
    if(i>0){ [pendingSetupIds[i-1],pendingSetupIds[i]]=[pendingSetupIds[i],pendingSetupIds[i-1]]; renderSetupPlayers(); }
  });
  document.querySelectorAll("[data-down]").forEach(b => b.onclick = () => {
    const i=pendingSetupIds.indexOf(b.dataset.down);
    if(i>=0 && i<pendingSetupIds.length-1){ [pendingSetupIds[i+1],pendingSetupIds[i]]=[pendingSetupIds[i],pendingSetupIds[i+1]]; renderSetupPlayers(); }
  });

  let draggedId = null;
  document.querySelectorAll("[data-order-id]").forEach(row => {
    row.addEventListener("dragstart", e => { draggedId=row.dataset.orderId; row.classList.add("dragging"); });
    row.addEventListener("dragend", e => row.classList.remove("dragging"));
    row.addEventListener("dragover", e => e.preventDefault());
    row.addEventListener("drop", e => {
      e.preventDefault();
      const targetId=row.dataset.orderId;
      if(!draggedId || draggedId===targetId) return;
      const from=pendingSetupIds.indexOf(draggedId), to=pendingSetupIds.indexOf(targetId);
      pendingSetupIds.splice(from,1);
      pendingSetupIds.splice(to,0,draggedId);
      renderSetupPlayers();
    });
    const handle=row.querySelector(".drag-handle");
    handle.addEventListener("touchstart", e => {
      draggedId=row.dataset.orderId;
      row.classList.add("dragging");
    }, {passive:true});
    handle.addEventListener("touchmove", e => {
      const t=e.touches[0];
      const el=document.elementFromPoint(t.clientX,t.clientY);
      const target=el?.closest?.("[data-order-id]");
      if(!target || !draggedId || target.dataset.orderId===draggedId) return;
      const from=pendingSetupIds.indexOf(draggedId), to=pendingSetupIds.indexOf(target.dataset.orderId);
      if(from<0 || to<0) return;
      pendingSetupIds.splice(from,1);
      pendingSetupIds.splice(to,0,draggedId);
      renderSetupPlayers();
    }, {passive:true});
    handle.addEventListener("touchend", () => row.classList.remove("dragging"), {passive:true});
  });
}

function reverseOrder(){
  pendingSetupIds.reverse();
  renderSetupPlayers();
}
function randomOrder(){
  for(let i=pendingSetupIds.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [pendingSetupIds[i],pendingSetupIds[j]]=[pendingSetupIds[j],pendingSetupIds[i]];
  }
  renderSetupPlayers();
}
function startTournamentNight(){
  setupMode = "tournament";
  if(tournament){
    startSetup("tournament", tournament.playerIds);
    return;
  }
  const {ratings}=buildRatings();
  const ids = players.slice(0,Math.min(players.length,4)).map(p=>p.id);
  tournament = {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    playerIds: ids,
    gameIds: [],
    startingRatings: Object.fromEntries(ids.map(id=>[id,ratings[id] ?? 1500]))
  };
  save("molkky.tournament.v1", tournament);
  startSetup("tournament", ids);
}
function ensureTournamentRoster(ids){
  if(setupMode !== "tournament") return;
  if(!tournament){
    const {ratings}=buildRatings();
    tournament={id:crypto.randomUUID(),startedAt:new Date().toISOString(),playerIds:[...ids],gameIds:[],startingRatings:{}};
    ids.forEach(id=>tournament.startingRatings[id]=ratings[id] ?? 1500);
  }
  tournament.playerIds=[...ids];
  const {ratings}=buildRatings();
  ids.forEach(id=>{
    if(tournament.startingRatings[id] == null) tournament.startingRatings[id]=ratings[id] ?? 1500;
  });
  save("molkky.tournament.v1", tournament);
}
function startGame(ids = pendingSetupIds){
  if(ids.length < 2){ alert("Vyber alespoň dva hráče."); return; }
  ensureTournamentRoster(ids);
  const roster = ids.map(id => players.find(p => p.id === id)).filter(Boolean);
  game = {
    mode: setupMode,
    startedAt: new Date().toISOString(),
    round: 1,
    turnIndex: 0,
    totalTurns: 0,
    threeMissRule: $("threeMissRule").checked,
    players: roster.map(p => ({
      id: p.id, name: p.name, score: 0, consecutiveMisses: 0,
      eliminated: false, throws: 0, scoringThrows: 0, pointsScored: 0, busts: 0
    })),
    snapshots: []
  };
  rematchPlayerIds = roster.map(p => p.id);
  selectedPins.clear();
  selectedPoints = null;
  renderGame();
  showView("gameView");
}
function activePlayers(){ return game.players.filter(p => !p.eliminated); }
function currentPlayer(){ return game.players[game.turnIndex]; }

function renderPins(){
  $("pinsGrid").innerHTML = Array.from({length:12},(_,i)=>i+1).map(n =>
    `<button class="pin ${selectedPins.has(n)?"selected":""}" data-pin="${n}">${n}</button>`
  ).join("");
  document.querySelectorAll("[data-pin]").forEach(b => b.onclick = () => {
    const n = Number(b.dataset.pin);
    selectedPins.has(n) ? selectedPins.delete(n) : selectedPins.add(n);
    renderPins();
    renderSelection();
  });
}
function calcThrowPoints(){
  if(entryMode === "points") return selectedPoints ?? 0;
  if(selectedPins.size === 0) return 0;
  if(selectedPins.size === 1) return [...selectedPins][0];
  return selectedPins.size;
}
function setEntryMode(mode){
  entryMode = mode;
  localStorage.setItem("molkky.entryMode", mode);
  $("pinsModeBtn").classList.toggle("active", mode === "pins");
  $("pointsModeBtn").classList.toggle("active", mode === "points");
  $("pinsEntry").classList.toggle("hidden", mode !== "pins");
  $("pointsEntry").classList.toggle("hidden", mode !== "points");
  renderSelection();
}
function renderPoints(){
  $("pointsGrid").innerHTML = Array.from({length:12},(_,i)=>i+1).map(n =>
    `<button class="point-btn ${selectedPoints===n?"selected":""}" data-points="${n}">${n}</button>`
  ).join("");
  document.querySelectorAll("[data-points]").forEach(b => b.onclick = () => {
    selectedPoints = Number(b.dataset.points);
    renderPoints();
    renderSelection();
  });
}
function renderSelection(){
  if(entryMode === "points"){
    $("selectionSummary").textContent = selectedPoints == null ? "Nic" : `${selectedPoints} b.`;
    return;
  }
  const pts = calcThrowPoints();
  $("selectionSummary").textContent = selectedPins.size === 0 ? "Nic" :
    `${[...selectedPins].sort((a,b)=>a-b).join(", ")} → ${pts} b.`;
}
function renderGame(){
  if(!game) return;
  if(currentPlayer()?.eliminated) moveToNextPlayer();
  const p = currentPlayer();
  $("gameRound").textContent = `Kolo ${game.round}`;
  $("currentPlayerName").textContent = p.name;
  $("currentScore").textContent = p.score;
  $("targetHint").textContent = p.score < 50 ? `Potřebuješ ${50-p.score} bodů` : "Na hraně";
  $("missesHint").textContent = game.threeMissRule ? `Minutí: ${p.consecutiveMisses}/3` : "";
  renderPins();
  renderPoints();
  setEntryMode(entryMode);
  renderSelection();
  renderStandings("liveStandings", true);
  $("undoBtn").disabled = game.snapshots.length === 0;
}
function renderStandings(targetId, live=false){
  const sorted = [...game.players].sort((a,b)=> {
    if(a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    return b.score - a.score;
  });
  $(targetId).innerHTML = sorted.map(p => `
    <div class="standing-row ${live && currentPlayer()?.id===p.id?"active":""} ${p.eliminated?"eliminated":""}">
      <div>
        <div class="player-name">${esc(p.name)}</div>
        <small>${p.eliminated?"Vyřazen":`${p.throws} hodů · ${p.consecutiveMisses} minutí`}</small>
      </div>
      <div class="standing-score">${p.score}</div>
    </div>`).join("");
}

function snapshot(){
  game.snapshots.push(JSON.stringify({
    round: game.round, turnIndex: game.turnIndex, totalTurns: game.totalTurns,
    players: game.players
  }));
  if(game.snapshots.length > 100) game.snapshots.shift();
}
function restoreLast(){
  if(!game?.snapshots.length) return;
  const prev = JSON.parse(game.snapshots.pop());
  game.round = prev.round; game.turnIndex = prev.turnIndex; game.totalTurns = prev.totalTurns;
  game.players = prev.players;
  selectedPins.clear();
  selectedPoints = null;
  renderGame();
}
function submitThrow(forceMiss=false){
  if(!game) return;
  snapshot();
  const p = currentPlayer();
  let points = forceMiss ? 0 : calcThrowPoints();

  p.throws++;
  game.totalTurns++;

  if(points === 0){
    p.consecutiveMisses++;
    if(game.threeMissRule && p.consecutiveMisses >= 3) p.eliminated = true;
  } else {
    p.scoringThrows++;
    p.pointsScored += points;
    p.consecutiveMisses = 0;
    const newScore = p.score + points;
    if(newScore > 50){
      p.score = 25;
      p.busts++;
    } else {
      p.score = newScore;
    }
  }

  selectedPins.clear();
  selectedPoints = null;

  if(p.score === 50 && !p.eliminated){
    finishGame(p);
    return;
  }
  if(activePlayers().length === 1){
    finishGame(activePlayers()[0], true);
    return;
  }

  moveToNextPlayer();
  renderGame();
}
function moveToNextPlayer(){
  const start = game.turnIndex;
  let wrapped = false;
  do {
    game.turnIndex++;
    if(game.turnIndex >= game.players.length){
      game.turnIndex = 0;
      game.round++;
      wrapped = true;
    }
  } while(game.players[game.turnIndex].eliminated && game.turnIndex !== start);
}

function finishGame(winner, byElimination=false){
  const record = {
    id: crypto.randomUUID(),
    endedAt: new Date().toISOString(),
    startedAt: game.startedAt,
    winnerId: winner.id,
    winnerName: winner.name,
    winnerScore: winner.score,
    turns: game.totalTurns,
    byElimination,
    players: game.players.map(p => ({...p}))
  };
  history.unshift(record);
  save(STORAGE.history, history);
  lastFinishedRecord = record;
  if(game.mode === "tournament" && tournament){
    tournament.gameIds.push(record.id);
    tournament.playerIds = game.players.map(p=>p.id);
    save("molkky.tournament.v1", tournament);
  }
  $("winnerName").textContent = winner.name;
  $("winnerSummary").textContent = byElimination
    ? `Vyhrává jako poslední hráč ve hře.`
    : `50 bodů za ${winner.throws} hodů.`;
  renderStandings("finalStandings");
  renderTournamentGameOver();
  showView("gameOverView");
}

function buildRatings(){
  const ratings = {};
  const names = {};
  for(const p of players){ ratings[p.id] = 1500; names[p.id] = p.name; }
  const chronological = [...history].reverse();
  for(const h of chronological){
    const ps = (h.players || []).map(p => ({...p}));
    if(ps.length < 2) continue;
    ps.forEach(p => { if(ratings[p.id] == null) ratings[p.id] = 1500; names[p.id] = p.name; });
    const rankScore = p => p.id === h.winnerId ? 100000 : (p.eliminated ? -1000 : 0) + (p.score || 0);
    const deltas = Object.fromEntries(ps.map(p => [p.id, 0]));
    const K = 24;
    for(let i=0;i<ps.length;i++){
      for(let j=i+1;j<ps.length;j++){
        const a=ps[i], b=ps[j];
        const ra=ratings[a.id], rb=ratings[b.id];
        const ea=1/(1+Math.pow(10,(rb-ra)/400));
        const eb=1-ea;
        const sa0=rankScore(a), sb0=rankScore(b);
        const sa=sa0>sb0?1:sa0<sb0?0:.5, sb=1-sa;
        const scale = 1/Math.max(1, ps.length-1);
        deltas[a.id] += K*(sa-ea)*scale;
        deltas[b.id] += K*(sb-eb)*scale;
      }
    }
    ps.forEach(p => ratings[p.id] = Math.round(ratings[p.id] + deltas[p.id]));
  }
  return {ratings,names};
}

function buildHeadToHead(){
  const pairs = {};
  for(const h of history){
    const ps = h.players || [];
    const rankScore = p => p.id === h.winnerId ? 100000 : (p.eliminated ? -1000 : 0) + (p.score || 0);
    for(let i=0;i<ps.length;i++){
      for(let j=i+1;j<ps.length;j++){
        const a=ps[i], b=ps[j];
        const ids=[a.id,b.id].sort();
        const key=ids.join('|');
        pairs[key] ??= {aId:ids[0],bId:ids[1],games:0,aWins:0,bWins:0,ties:0};
        const pair=pairs[key]; pair.games++;
        const sa=rankScore(a), sb=rankScore(b);
        if(sa===sb) pair.ties++;
        else {
          const winnerId = sa>sb ? a.id : b.id;
          if(winnerId===pair.aId) pair.aWins++; else pair.bWins++;
        }
      }
    }
  }
  return Object.values(pairs).sort((a,b)=>b.games-a.games);
}

function renderTournamentGameOver(){
  const active = !!(tournament && game && game.mode === "tournament");
  $("tournamentSummaryCard").classList.toggle("hidden", !active);
  $("nextTournamentGameBtn").classList.toggle("hidden", !active);
  $("endTournamentBtn").classList.toggle("hidden", !active);
  $("rematchBtn").classList.toggle("hidden", active);
  if(!active) return;

  const games = history.filter(h => tournament.gameIds.includes(h.id));
  $("nightGameCount").textContent = `${games.length} ${games.length===1?"hra":"her"}`;
  const {ratings}=buildRatings();
  const map={};
  tournament.playerIds.forEach(id=>{
    const p=players.find(x=>x.id===id);
    map[id]={id,name:p?.name||"Hráč",games:0,wins:0,throws:0,points:0};
  });
  games.forEach(h=>{
    (h.players||[]).forEach(p=>{
      map[p.id] ??= {id:p.id,name:p.name,games:0,wins:0,throws:0,points:0};
      map[p.id].games++;
      map[p.id].throws += p.throws||0;
      map[p.id].points += p.pointsScored||0;
      if(h.winnerId===p.id) map[p.id].wins++;
    });
  });
  const rows=Object.values(map).sort((a,b)=>b.wins-a.wins || (ratings[b.id]??1500)-(ratings[a.id]??1500));
  $("nightStandings").innerHTML = rows.map((s,i)=>{
    const start=tournament.startingRatings[s.id] ?? 1500;
    const now=ratings[s.id] ?? 1500;
    const delta=now-start;
    const avg=s.throws?(s.points/s.throws).toFixed(1):"0.0";
    return `<div class="standing-row">
      <div><div class="player-name">${i+1}. ${esc(s.name)}</div>
      <small>${s.wins} výher / ${s.games} her · ${avg} bodu/hod</small></div>
      <div><div class="standing-score">${now}</div><small class="night-delta ${delta>=0?"up":"down"}">${delta>=0?"+":""}${delta} ELO</small></div>
    </div>`;
  }).join("");
}
function endTournamentNight(){
  tournament=null;
  save("molkky.tournament.v1", null);
  setupMode="single";
  $("tournamentSummaryCard").classList.add("hidden");
  $("nextTournamentGameBtn").classList.add("hidden");
  $("endTournamentBtn").classList.add("hidden");
  $("rematchBtn").classList.remove("hidden");
  showView("homeView");
}
function renderStats(){
  if(!history.length){
    $("statsContent").innerHTML = `<div class="card"><div class="muted">Nejdřív odehraj alespoň jednu hru.</div></div>`;
    return;
  }
  const map = {};
  for(const h of history){
    for(const p of h.players){
      map[p.id] ??= {id:p.id,name:p.name,games:0,wins:0,throws:0,scoringThrows:0,points:0,busts:0};
      const s = map[p.id];
      s.name=p.name; s.games++; s.throws += p.throws; s.scoringThrows += p.scoringThrows; s.points += p.pointsScored; s.busts += p.busts;
      if(h.winnerId === p.id) s.wins++;
    }
  }
  const {ratings,names}=buildRatings();
  const rows = Object.values(map).sort((a,b)=>(ratings[b.id]||1500)-(ratings[a.id]||1500));
  let html = `<div class="card"><div class="section-head"><h3>ELO žebříček</h3><span class="tag">start 1500</span></div><div class="standings">`;
  html += rows.map((s,i)=>`<div class="standing-row"><div><div class="player-name">${i+1}. ${esc(s.name)}</div><small>${s.wins}/${s.games} výher · ${s.throws} hodů</small></div><div class="standing-score">${ratings[s.id]||1500}</div></div>`).join('');
  html += `</div></div>`;

  html += rows.map(s => {
    const winRate = s.games ? Math.round(s.wins/s.games*100) : 0;
    const avg = s.throws ? (s.points/s.throws).toFixed(1) : "0.0";
    const accuracy = s.throws ? Math.round(s.scoringThrows/s.throws*100) : 0;
    return `<div class="card">
      <div class="section-head"><h3>${esc(s.name)}</h3><span class="tag">ELO ${ratings[s.id]||1500}</span></div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${winRate}%</div><div class="stat-label">WIN RATE</div></div>
        <div class="stat-card"><div class="stat-value">${avg}</div><div class="stat-label">BODŮ / HOD</div></div>
        <div class="stat-card"><div class="stat-value">${accuracy}%</div><div class="stat-label">HODY S BODY</div></div>
        <div class="stat-card"><div class="stat-value">${s.busts}</div><div class="stat-label">BUST</div></div>
      </div>
    </div>`;
  }).join("");

  const h2h=buildHeadToHead();
  html += `<div class="card"><div class="section-head"><h3>Head to head</h3><span class="tag">vzájemné hry</span></div><div class="standings">`;
  html += h2h.length ? h2h.map(x=>{
    const an=names[x.aId]||'Hráč A', bn=names[x.bId]||'Hráč B';
    return `<div class="standing-row"><div><div class="player-name">${esc(an)} vs ${esc(bn)}</div><small>${x.games} společných her${x.ties?` · ${x.ties} remíz`:''}</small></div><div class="standing-score">${x.aWins}:${x.bWins}</div></div>`;
  }).join('') : `<div class="muted">Zatím žádná vzájemná data.</div>`;
  html += `</div></div>`;
  $("statsContent").innerHTML = html;
}

$("newGameBtn").onclick = () => startSetup("single");
$("tournamentNightBtn").onclick = startTournamentNight;
$("sameOrderBtn").onclick = () => renderSetupPlayers();
$("reverseOrderBtn").onclick = reverseOrder;
$("randomOrderBtn").onclick = randomOrder;
$("addPlayerBtn").onclick = () => openPlayerDialog("home");
$("addPlayerSetupBtn").onclick = () => openPlayerDialog("setup");
$("startGameBtn").onclick = () => startGame();
$("pinsModeBtn").onclick = () => setEntryMode("pins");
$("pointsModeBtn").onclick = () => setEntryMode("points");
$("confirmThrowBtn").onclick = () => submitThrow(false);
$("missBtn").onclick = () => submitThrow(true);
$("undoBtn").onclick = restoreLast;
$("checkUpdateBtn").onclick = checkForUpdate;
$("navStats").onclick = () => showView("statsView");
$("rematchBtn").onclick = () => { setupMode="single"; startSetup("single", rematchPlayerIds); };
$("nextTournamentGameBtn").onclick = () => {
  if(!tournament) return;
  startSetup("tournament", tournament.playerIds);
};
$("endTournamentBtn").onclick = endTournamentNight;
$("quitGameBtn").onclick = () => {
  if(confirm("Opravdu ukončit rozehranou hru?")){
    game = null;
    showView("homeView");
  }
};
document.querySelectorAll(".back-home").forEach(b => b.onclick = () => showView("homeView"));
$("clearHistoryBtn").onclick = () => {
  if(confirm("Smazat celou historii her?")){
    history = [];
    save(STORAGE.history, history);
    renderHome();
  }
};

renderHome();
showView("homeView");

if("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}
