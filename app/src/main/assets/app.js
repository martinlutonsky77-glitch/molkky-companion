const UPDATE_CONFIG = {
  owner: "martinlutonsky77-glitch",
  repo: "molkky-companion",
  currentVersion: "1.7.5"
};


const THEME_KEY = "molkky.theme.v1";
const APP_SETTINGS_KEY = "molkky.settings.v2";
const ACTIVE_GAME_KEY = "molkky.activeGame.v1";

const DEFAULT_SETTINGS = {
  themeMode: localStorage.getItem(THEME_KEY) || "light",
  accent: "#3f6f35",
  targetScore: 50,
  missLimit: 3,
  bustEnabled: true,
  bustReset: 25,
  defaultEntryMode: localStorage.getItem("molkky.entryMode") || "pins",
  autoAdvance: true,
  vibration: true,
  sound: false
};

function readSettings(){
  try { return {...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(APP_SETTINGS_KEY)||"{}"))}; }
  catch { return {...DEFAULT_SETTINGS}; }
}
let appSettings = readSettings();
let theme = "light";

const PORTRAITS_API = window.MolkkyPortraits;
const PORTRAIT_COUNT = PORTRAITS_API?.PORTRAITS?.length || 30;

function stableIndex(id, n=PORTRAIT_COUNT){
  let h=0;
  for(const ch of String(id||"")) h=((h*31)+ch.charCodeAt(0))>>>0;
  return h%n;
}
function avatarIndexFor(p){
  const saved = players?.find?.(x => x.id === p?.id);
  const idx = Number(saved?.avatarIndex ?? p?.avatarIndex);
  return Number.isInteger(idx) ? ((idx % PORTRAIT_COUNT)+PORTRAIT_COUNT)%PORTRAIT_COUNT : stableIndex(p?.id);
}
function portraitMarkup(p, extraClass=""){
  const idx=avatarIndexFor(p);
  const portrait=PORTRAITS_API?.PORTRAITS?.[idx];
  if(!portrait) return `<span class="player-avatar ${extraClass}" aria-hidden="true"></span>`;
  const svg=PORTRAITS_API.renderPortrait(portrait,{size:96,className:"portrait-svg",title:p?.name||portrait.name});
  return `<span class="player-avatar ${extraClass}" aria-hidden="true">${svg}</span>`;
}
function avatarMarkup(p, extraClass=""){ return portraitMarkup(p,extraClass); }
function playerIdentity(p, subtitle=""){
  return `<div class="player-identity">${avatarMarkup(p)}<div class="player-copy"><div class="player-name">${esc(p.name)}</div>${subtitle?`<small>${subtitle}</small>`:""}</div></div>`;
}

/* Mölkky pin geometry:
   standard diameter 5.5 cm, high side 15 cm, low side 9.5 cm, 45° cut.
   SVG silhouette follows those proportions instead of faking a cylinder lid. */
function molkkyPinSvg(n){
  return `<svg class="molkky-pin-svg" viewBox="0 0 72 112" role="img" aria-label="Kuželka ${n}">
    <defs>
      <linearGradient id="woodBody${n}" x1="0" x2="1">
        <stop offset="0" stop-color="#8d5425"/>
        <stop offset=".18" stop-color="#bd7836"/>
        <stop offset=".43" stop-color="#edbe70"/>
        <stop offset=".57" stop-color="#f4d18a"/>
        <stop offset=".78" stop-color="#c67d37"/>
        <stop offset="1" stop-color="#7c461d"/>
      </linearGradient>
      <linearGradient id="cutFace${n}" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stop-color="#d39a52"/>
        <stop offset=".48" stop-color="#f3d493"/>
        <stop offset="1" stop-color="#c27c39"/>
      </linearGradient>
      <filter id="pinShadow${n}" x="-40%" y="-30%" width="180%" height="180%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000" flood-opacity=".22"/>
      </filter>
    </defs>
    <g filter="url(#pinShadow${n})">
      <!-- body silhouette: lower cut edge at left, higher cut edge at right -->
      <path d="M13 48 L59 16 L59 98 Q58 105 50 108 L22 108 Q14 105 13 98 Z"
            fill="url(#woodBody${n})" stroke="#75431d" stroke-width="1.2"/>
      <!-- subtle birch grain -->
      <path d="M21 51C18 69 21 86 20 101M31 39C29 61 33 82 31 105M44 29C42 48 46 73 44 104M54 21C52 45 56 70 54 99"
            fill="none" stroke="#855126" stroke-opacity=".22" stroke-width="1.3"/>
      <path d="M18 47 C25 34 48 15 59 16 C53 28 27 53 13 48 Z"
            fill="url(#cutFace${n})" stroke="#75431d" stroke-width="1.2"/>
      <path d="M21 44C31 38 40 29 50 21M27 46C38 38 45 30 55 21"
            fill="none" stroke="#9d6630" stroke-opacity=".28" stroke-width="1"/>
      <text x="36" y="36" text-anchor="middle" dominant-baseline="middle"
            transform="rotate(-27 36 36)"
            font-family="system-ui,-apple-system,'Segoe UI',sans-serif"
            font-size="${n>=10?19:22}" font-weight="900" fill="#27170d">${n}</text>
    </g>
  </svg>`;
}

function applyAccent(color){
  const safe = /^#[0-9a-fA-F]{6}$/.test(color||"") ? color : "#3f6f35";
  appSettings.accent = safe;
  document.documentElement.style.setProperty("--primary", safe);
  document.documentElement.style.setProperty("--primary-2", safe);
}
function physicalThemeFor(mode){
  if(mode === "system") return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  return mode === "dark" ? "dark" : "light";
}
function applyTheme(next){
  theme = next === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  const icon=$("themeToggleIcon"); if(icon) icon.textContent = theme === "dark" ? "☀" : "☾";
  const meta=document.querySelector('meta[name="theme-color"]'); if(meta) meta.setAttribute('content', theme === "dark" ? '#0c120d' : '#f6f1e7');
}
function applyThemeMode(mode, saveIt=true){
  appSettings.themeMode = ["light","dark","system"].includes(mode) ? mode : "light";
  if(saveIt) saveAppSettings(false);
  applyTheme(physicalThemeFor(appSettings.themeMode));
  updateSettingsControls();
}
function toggleTheme(){
  const explicit = theme === "dark" ? "light" : "dark";
  appSettings.themeMode = explicit;
  saveAppSettings(false);
  applyTheme(explicit);
  updateSettingsControls();
}
function saveAppSettings(rerender=true){
  localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings));
  localStorage.setItem(THEME_KEY, appSettings.themeMode === "system" ? physicalThemeFor("system") : appSettings.themeMode);
  localStorage.setItem("molkky.entryMode", appSettings.defaultEntryMode);
  applyAccent(appSettings.accent);
  if(rerender && document.getElementById("settingsView")?.classList.contains("active")) renderSettings();
}
function gameFeedback(kind="throw"){
  if(appSettings.vibration && navigator.vibrate){
    navigator.vibrate(kind==="win" ? [70,45,100] : kind==="miss" ? [50,35,50] : 28);
  }
  if(appSettings.sound){
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(Ctx){
        const ctx=new Ctx(), osc=ctx.createOscillator(), gain=ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value=kind==="win"?740:kind==="miss"?180:430;
        gain.gain.setValueAtTime(.055,ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);
        osc.start(); osc.stop(ctx.currentTime+.12);
      }
    }catch(e){}
  }
}
function persistActiveGame(){
  if(game) localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(game));
}
function clearActiveGame(){ localStorage.removeItem(ACTIVE_GAME_KEY); }
function getSavedActiveGame(){
  try{
    const g=JSON.parse(localStorage.getItem(ACTIVE_GAME_KEY)||"null");
    return g && Array.isArray(g.players) && g.players.length>=2 ? g : null;
  }catch{return null;}
}
function restoreActiveGame(){
  const saved=getSavedActiveGame();
  if(!saved) return;
  game=saved;
  rematchPlayerIds=game.players.map(p=>p.id);
  setupMode=game.mode||"single";
  selectedPins.clear(); selectedPoints=null;
  entryMode=appSettings.defaultEntryMode;
  renderGame(); showView("gameView");
}

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
const views = ["homeView","setupView","gameView","statsView","settingsView","gameOverView"];

function load(key, fallback){
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function showView(id){
  views.forEach(v => $(v).classList.toggle("active", v === id));
  if(id === "homeView") renderHome();
  if(id === "statsView") renderStats();
  if(id === "settingsView") renderSettings();
}

function updateSettingsControls(){
  document.querySelectorAll("[data-theme-mode]").forEach(b=>b.classList.toggle("active", b.dataset.themeMode===appSettings.themeMode));
  document.querySelectorAll("[data-entry-default]").forEach(b=>b.classList.toggle("active", b.dataset.entryDefault===appSettings.defaultEntryMode));
  document.querySelectorAll("[data-accent]").forEach(b=>b.classList.toggle("active", b.dataset.accent.toLowerCase()===String(appSettings.accent).toLowerCase()));
}
function renderSettings(){
  $("targetScoreSetting").value=appSettings.targetScore;
  $("missLimitSetting").value=appSettings.missLimit;
  $("bustEnabledSetting").checked=!!appSettings.bustEnabled;
  appSettings.bustReset=Math.min(Math.max(0,Number(appSettings.bustReset)||25),Math.max(0,(Number(appSettings.targetScore)||50)-1));
  $("bustResetSetting").max=Math.max(0,(Number(appSettings.targetScore)||50)-1);
  $("bustResetSetting").value=appSettings.bustReset;
  $("bustResetRow").classList.toggle("setting-disabled",!appSettings.bustEnabled);
  $("autoAdvanceSetting").checked=!!appSettings.autoAdvance;
  $("vibrationSetting").checked=!!appSettings.vibration;
  $("soundSetting").checked=!!appSettings.sound;
  $("appVersionText").textContent=`v${UPDATE_CONFIG.currentVersion} (build 14)`;
  $("avatarSettingsList").innerHTML = players.length ? players.map(p=>`
    <div class="avatar-setting-row">
      ${playerIdentity(p)}
      <div class="avatar-controls">
        <button class="mini" data-avatar-prev="${p.id}" aria-label="Předchozí avatar">‹</button>
        <button class="secondary avatar-change" data-avatar-next="${p.id}">Jiný vzhled</button>
        <button class="mini" data-avatar-next="${p.id}" aria-label="Další avatar">›</button>
      </div>
    </div>`).join("") : `<div class="muted">Nejdřív vytvoř hráče.</div>`;

  document.querySelectorAll("[data-avatar-next]").forEach(b=>b.onclick=()=>changeAvatar(b.dataset.avatarNext,1));
  document.querySelectorAll("[data-avatar-prev]").forEach(b=>b.onclick=()=>changeAvatar(b.dataset.avatarPrev,-1));
  updateSettingsControls();
}
function changeAvatar(id, delta){
  const p=players.find(x=>x.id===id); if(!p) return;
  p.avatarIndex=(avatarIndexFor(p)+delta+PORTRAIT_COUNT)%PORTRAIT_COUNT;
  save(STORAGE.players,players);
  renderSettings();
}
function esc(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function addPlayer(name){
  name = name.trim();
  if(!name) return;
  const p = { id: crypto.randomUUID(), name, avatarIndex: Math.floor(Math.random()*PORTRAIT_COUNT) };
  players.push(p);
  save(STORAGE.players, players);
  return p;
}
function deletePlayer(id){
  const saved=getSavedActiveGame();
  if(saved?.players?.some(p=>p.id===id)){
    alert("Hráče nelze smazat, protože je v rozehrané hře.");
    return;
  }
  if(tournament?.gameIds?.length && tournament.playerIds?.includes(id)){
    alert("Hráče nelze smazat během rozehrané turnajové noci.");
    return;
  }
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
  if(tournament && (!Array.isArray(tournament.gameIds) || tournament.gameIds.length===0)){
    tournament=null;
    save("molkky.tournament.v1", null);
  }
  $("tournamentNightBtn").textContent = tournament ? `Pokračovat v turnajové noci (${tournament.gameIds.length} her)` : "Turnajová noc";
  $("restoreGameBtn").classList.toggle("hidden", !getSavedActiveGame());
  $("playerList").innerHTML = players.length ? players.map(p => `
    <div class="player-row player-tile">
      ${playerIdentity(p, `Profil hráče`)}
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
  const ml=Math.max(0,Number(appSettings.missLimit)||0);
  $("missRuleLabel").textContent = ml>0 ? `${ml} minutí = vyřazení` : "Vyřazení za minutí vypnuto";
  $("missRuleHelp").textContent = ml>0 ? "Limit po sobě jdoucích hodů bez bodu." : "Hráč se za minutí nevyřazuje.";
  $("threeMissRule").checked = ml>0;
  $("setupModeTag").textContent = setupMode === "tournament" ? "Turnajová noc" : "Jedna hra";
  $("setupTitle").textContent = setupMode === "tournament" ? "Pořadí pro turnajovou hru" : "Vyber a seřaď hráče";

  const ordered = pendingSetupIds.map(id => players.find(p => p.id === id)).filter(Boolean);
  $("orderedPlayers").innerHTML = ordered.length ? ordered.map((p,i)=>`
    <div class="order-row" draggable="true" data-order-id="${p.id}">
      <span class="drag-handle" title="Přetáhnout">☰</span>
      ${playerIdentity(p)}
      <button class="mini" data-up="${p.id}" ${i===0?"disabled":""}>↑</button>
      <button class="mini" data-down="${p.id}" ${i===ordered.length-1?"disabled":""}>↓</button>
      <button class="remove-order" data-remove-order="${p.id}" title="Odebrat">×</button>
    </div>`).join("") : `<div class="muted">Vyber alespoň dva hráče.</div>`;

  const remaining = players.filter(p => !pendingSetupIds.includes(p.id));
  $("setupPlayers").innerHTML = remaining.length ? remaining.map(p => `
    <button class="setup-pool-btn" data-add-order="${p.id}">
      ${playerIdentity(p)}<span>+ Přidat</span>
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
  if(tournament && Array.isArray(tournament.gameIds) && tournament.gameIds.length > 0){
    startSetup("tournament", tournament.playerIds);
    return;
  }
  tournament = null;
  save("molkky.tournament.v1", null);
  const ids = players.slice(0,Math.min(players.length,4)).map(p=>p.id);
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
    targetScore: Math.max(20, Number(appSettings.targetScore)||50),
    missLimit: $("threeMissRule").checked ? Math.max(1, Number(appSettings.missLimit)||3) : 0,
    threeMissRule: $("threeMissRule").checked,
    bustEnabled: !!appSettings.bustEnabled,
    bustReset: Math.min(Math.max(0, Number(appSettings.bustReset)||25), Math.max(0,(Math.max(20,Number(appSettings.targetScore)||50))-1)),
    autoAdvance: !!appSettings.autoAdvance,
    awaitingNext: false,
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
  persistActiveGame();
}
function activePlayers(){ return game.players.filter(p => !p.eliminated); }
function currentPlayer(){ return game.players[game.turnIndex]; }

function renderPins(){
  $("pinsGrid").innerHTML = Array.from({length:12},(_,i)=>i+1).map(n =>
    `<button class="pin ${selectedPins.has(n)?"selected":""}" data-pin="${n}" aria-label="Kuželka ${n}">${molkkyPinSvg(n)}</button>`
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
  game.targetScore = Number(game.targetScore)||50;
  game.missLimit = Number(game.missLimit ?? (game.threeMissRule?3:0))||0;
  game.bustReset = Math.min(Number(game.bustReset ?? 25), Math.max(0,game.targetScore-1));
  game.bustEnabled = game.bustEnabled !== false;
  game.autoAdvance = game.autoAdvance !== false;
  if(currentPlayer()?.eliminated && !game.awaitingNext) moveToNextPlayer();
  const p = currentPlayer();
  $("gameRound").textContent = `Kolo ${game.round}`;
  $("currentPlayerName").textContent = p.name;
  $("currentPlayerBadge").innerHTML = avatarMarkup(p, "hero-avatar");
  $("currentScore").textContent = p.score;
  $("scoreTargetText").textContent = `/ ${game.targetScore}`;
  $("targetHint").textContent = p.score < game.targetScore ? `Potřebuješ ${game.targetScore-p.score} bodů` : "Na hraně";
  $("missesHint").textContent = game.missLimit>0 ? `Minutí: ${p.consecutiveMisses}/${game.missLimit}` : "Minutí bez vyřazení";
  renderPins();
  renderPoints();
  setEntryMode(entryMode);
  renderSelection();
  renderStandings("liveStandings", true);
  $("undoBtn").disabled = game.snapshots.length === 0;
  $("nextPlayerBtn").classList.toggle("hidden", !game.awaitingNext);
  const lock=!!game.awaitingNext;
  $("confirmThrowBtn").disabled=lock;
  $("missBtn").disabled=lock;
  document.querySelectorAll("[data-pin],[data-points]").forEach(b=>b.disabled=lock);
  if(lock) $("targetHint").textContent="Hod zapsán. Pokračuj na dalšího hráče.";
}
function renderStandings(targetId, live=false){
  const sorted = [...game.players].sort((a,b)=> {
    if(a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    return b.score - a.score;
  });
  $(targetId).innerHTML = sorted.map(p => `
    <div class="standing-row ${live && currentPlayer()?.id===p.id?"active":""} ${p.eliminated?"eliminated":""}">
      ${playerIdentity(p, p.eliminated?"Vyřazen":`${p.throws} hodů · ${p.consecutiveMisses} minutí`)}
      <div class="standing-score">${p.score}</div>
    </div>`).join("");
}

function snapshot(){
  game.snapshots.push(JSON.stringify({
    round: game.round, turnIndex: game.turnIndex, totalTurns: game.totalTurns, awaitingNext: game.awaitingNext,
    players: game.players
  }));
  if(game.snapshots.length > 100) game.snapshots.shift();
}
function restoreLast(){
  if(!game?.snapshots.length) return;
  const prev = JSON.parse(game.snapshots.pop());
  game.round = prev.round; game.turnIndex = prev.turnIndex; game.totalTurns = prev.totalTurns;
  game.awaitingNext = !!prev.awaitingNext;
  game.players = prev.players;
  selectedPins.clear();
  selectedPoints = null;
  renderGame();
  persistActiveGame();
}
function submitThrow(forceMiss=false){
  if(!game || game.awaitingNext) return;
  snapshot();
  const p = currentPlayer();
  const points = forceMiss ? 0 : calcThrowPoints();

  p.throws++;
  game.totalTurns++;

  if(points === 0){
    p.consecutiveMisses++;
    if(game.missLimit > 0 && p.consecutiveMisses >= game.missLimit) p.eliminated = true;
    gameFeedback("miss");
  } else {
    p.scoringThrows++;
    p.pointsScored += points;
    p.consecutiveMisses = 0;
    const newScore = p.score + points;
    if(game.bustEnabled && newScore > game.targetScore){
      p.score = game.bustReset;
      p.busts++;
    } else {
      p.score = newScore;
    }
    gameFeedback("throw");
  }

  selectedPins.clear();
  selectedPoints = null;

  if((p.score === game.targetScore || (!game.bustEnabled && p.score >= game.targetScore)) && !p.eliminated){
    finishGame(p);
    return;
  }
  if(activePlayers().length === 1){
    finishGame(activePlayers()[0], true);
    return;
  }

  if(game.autoAdvance){
    moveToNextPlayer();
  } else {
    game.awaitingNext=true;
  }
  renderGame();
  persistActiveGame();
}
function continueToNextPlayer(){
  if(!game) return;
  game.awaitingNext=false;
  moveToNextPlayer();
  renderGame();
  persistActiveGame();
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
  clearActiveGame();
  gameFeedback("win");
  $("winnerSummary").textContent = byElimination
    ? `Vyhrává jako poslední hráč ve hře.`
    : `${game.targetScore} bodů za ${winner.throws} hodů.`;
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
$("themeToggleBtn").onclick = toggleTheme;
$("restoreGameBtn").onclick = restoreActiveGame;
$("nextPlayerBtn").onclick = continueToNextPlayer;
$("settingsCheckUpdateBtn").onclick = checkForUpdate;
$("navStats").onclick = () => showView("statsView");
$("navSettings").onclick = () => showView("settingsView");
$("rematchBtn").onclick = () => { setupMode="single"; startSetup("single", rematchPlayerIds); };
$("nextTournamentGameBtn").onclick = () => {
  if(!tournament) return;
  startSetup("tournament", tournament.playerIds);
};
$("endTournamentBtn").onclick = endTournamentNight;
$("quitGameBtn").onclick = () => {
  if(confirm("Opravdu ukončit rozehranou hru?")){
    game = null;
    clearActiveGame();
    showView("homeView");
  }
};
document.querySelectorAll(".back-home").forEach(b => b.onclick = () => showView("homeView"));
$("clearHistoryBtn").onclick = () => {
  if(confirm("Smazat celou historii her?")){
    history = [];
    save(STORAGE.history, history);
    tournament = null;
    save("molkky.tournament.v1", null);
    renderHome();
  }
};

document.querySelectorAll("[data-theme-mode]").forEach(b=>b.onclick=()=>applyThemeMode(b.dataset.themeMode));
document.querySelectorAll("[data-entry-default]").forEach(b=>b.onclick=()=>{
  appSettings.defaultEntryMode=b.dataset.entryDefault;
  entryMode=appSettings.defaultEntryMode;
  saveAppSettings();
});
document.querySelectorAll("[data-accent]").forEach(b=>b.onclick=()=>{
  appSettings.accent=b.dataset.accent;
  saveAppSettings();
});
$("targetScoreSetting").onchange=()=>{
  appSettings.targetScore=Math.min(100,Math.max(20,Number($("targetScoreSetting").value)||50));
  appSettings.bustReset=Math.min(appSettings.bustReset,appSettings.targetScore-1);
  saveAppSettings();
};
$("missLimitSetting").onchange=()=>{appSettings.missLimit=Math.min(9,Math.max(0,Number($("missLimitSetting").value)||0));saveAppSettings();};
$("bustEnabledSetting").onchange=()=>{appSettings.bustEnabled=$("bustEnabledSetting").checked;saveAppSettings();};
$("bustResetSetting").onchange=()=>{
  appSettings.bustReset=Math.min(Math.max(0,Number($("bustResetSetting").value)||25),appSettings.targetScore-1);
  saveAppSettings();
};
$("autoAdvanceSetting").onchange=()=>{appSettings.autoAdvance=$("autoAdvanceSetting").checked;saveAppSettings();};
$("vibrationSetting").onchange=()=>{appSettings.vibration=$("vibrationSetting").checked;saveAppSettings();};
$("soundSetting").onchange=()=>{appSettings.sound=$("soundSetting").checked;saveAppSettings();};

if(window.matchMedia){
  const mq=window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemTheme=()=>{if(appSettings.themeMode==="system") applyTheme(physicalThemeFor("system"));};
  if(mq.addEventListener) mq.addEventListener("change",onSystemTheme); else if(mq.addListener) mq.addListener(onSystemTheme);
}
applyAccent(appSettings.accent);
applyTheme(physicalThemeFor(appSettings.themeMode));
renderHome();
showView("homeView");

if("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}
