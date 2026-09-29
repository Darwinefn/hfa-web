
(function(){
  const params=new URLSearchParams(location.search),view=params.get('view')||'estadisticas';
  const labels={torneos:'Torneos',comunidad:'Comunidad',equipos:'Equipos',jugadores:'Jugadores',estadisticas:'EstadÃ­sticas',partidos:'Partidos',album:'Ãlbum de cromos',cuenta:'Cuenta',buzon:'BuzÃ³n',admin:'Panel de administraciÃ³n'};
  const descriptions={torneos:'Crea y selecciona la competiciÃ³n cuyos partidos, clasificaciÃ³n y estadÃ­sticas quieres consultar.',comunidad:'Consulta palmarÃ©s, noticias y los perfiles de jugadores y equipos que forman la asociaciÃ³n.',equipos:'Consulta los equipos registrados y la divisiÃ³n a la que pertenece cada uno.',jugadores:'Busca jugadores de tu equipo y envÃ­ales ofertas de contrato.',estadisticas:'Consulta los datos destacados de jugadores y equipos en cada divisiÃ³n.',partidos:'Revisa la agenda de encuentros y los resultados registrados por la asociaciÃ³n.',album:'Completa tu colecciÃ³n con los jugadores que aparecen en las actas de los partidos.',cuenta:'Inicia sesiÃ³n o crea tu cuenta para acceder a las funciones de la asociaciÃ³n.',buzon:'Revisa, firma o rechaza tus ofertas de contrato.',admin:'Gestiona divisiones, equipos, partidos y actas desde el Ã¡rea privada.'};
  const countryOptions=[['es','ðŸ‡ªðŸ‡¸','EspaÃ±a'],['mx','ðŸ‡²ðŸ‡½','MÃ©xico'],['ar','ðŸ‡¦ðŸ‡·','Argentina'],['co','ðŸ‡¨ðŸ‡´','Colombia'],['pe','ðŸ‡µðŸ‡ª','PerÃº'],['cl','ðŸ‡¨ðŸ‡±','Chile'],['uy','ðŸ‡ºðŸ‡¾','Uruguay'],['ec','ðŸ‡ªðŸ‡¨','Ecuador'],['ve','ðŸ‡»ðŸ‡ª','Venezuela'],['bo','ðŸ‡§ðŸ‡´','Bolivia'],['py','ðŸ‡µðŸ‡¾','Paraguay'],['br','ðŸ‡§ðŸ‡·','Brasil'],['us','ðŸ‡ºðŸ‡¸','Estados Unidos'],['ca','ðŸ‡¨ðŸ‡¦','CanadÃ¡'],['fr','ðŸ‡«ðŸ‡·','Francia'],['it','ðŸ‡®ðŸ‡¹','Italia'],['de','ðŸ‡©ðŸ‡ª','Alemania'],['pt','ðŸ‡µðŸ‡¹','Portugal'],['gb','ðŸ‡¬ðŸ‡§','Reino Unido'],['ru','ðŸ‡·ðŸ‡º','Rusia'],['jp','ðŸ‡¯ðŸ‡µ','JapÃ³n'],['kr','ðŸ‡°ðŸ‡·','Corea del Sur'],['cn','ðŸ‡¨ðŸ‡³','China'],['au','ðŸ‡¦ðŸ‡º','Australia']];
  const state={teams:[],matches:[],competition:'CompeticiÃ³n AFH',sponsors:[],offers:[],tournaments:[],palmares:[],news:[]};
  let accounts=[];
  let authMode='login';
  let session=null;
  let activeTournamentId='default';
  let statsDivision='all';
  let statsCategory='goals';
  let playerSearch='';
  let playerCountrySearch='';
  let playerPositionFilter='all';
  let playerGrlFilter='all';
  let playerFreeAgentFilter='all';
  async function getJSON(key,fallback){let remoteValue;try{if(window.storage){const result=await window.storage.get(key,true);if(result&&result.value!==undefined&&result.value!==null)remoteValue=JSON.parse(result.value)}}catch(error){}try{const localValue=localStorage.getItem('hfa:'+key);if(localValue)return JSON.parse(localValue)}catch(error){}return remoteValue===undefined?fallback:remoteValue}
  async function setJSON(key,value){try{if(window.storage){await window.storage.set(key,JSON.stringify(value),true);return}}catch(error){}try{localStorage.setItem('hfa:'+key,JSON.stringify(value))}catch(error){}}
  async function hashPassword(text){try{const buffer=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(buffer)).map(byte=>byte.toString(16).padStart(2,'0')).join('')}catch(error){return text}}
  function notificationMarkup(){const pending=state.offers.filter(offer=>offer.player.toLowerCase()===session.username.toLowerCase()&&offer.status==='pendiente').length;return '<div class="notification-wrap"><button class="nav-notification" id="sectionNotification" title="Notificaciones">ðŸ””'+(pending?' '+pending:'')+'</button><div class="notification-panel" id="sectionNotificationPanel"><div class="notification-head">Notificaciones recientes</div><button class="notification-item" type="button" data-notification-target="seccion.html?view=partidos">âš½ <p>Novedades de partidos y juegos de la competiciÃ³n.</p></button><button class="notification-item" type="button" data-notification-target="seccion.html?view=estadisticas">ðŸ·ï¸ <p>Nuevas ofertas y promociones de la asociaciÃ³n.</p></button>'+(pending?'<button class="notification-item" type="button" data-notification-target="seccion.html?view=buzon">ðŸ“„ <p>Tienes '+pending+' oferta(s) de contrato pendiente(s).</p></button>':'')+'</div></div>'}
  function nav(){let links=session?[['afh-liga.html','Inicio',''],['seccion.html?view=comunidad','Comunidad','comunidad'],['clasificacion.html','ClasificaciÃ³n','clasificacion'],['seccion.html?view=torneos','Torneos','torneos'],['seccion.html?view=estadisticas','EstadÃ­sticas','estadisticas'],['seccion.html?view=partidos','Partidos','partidos'],['seccion.html?view=album','Ãlbum','album'],['seccion.html?view=cuenta','Cuenta','cuenta'],['seccion.html?view=buzon','BuzÃ³n','buzon'],['seccion.html?view=admin','Admin','admin']]:[['afh-liga.html','Inicio','']];if(!session||!['admin','arbitro'].includes(session.role))links=links.filter(item=>item[2]!=='admin');const isCommunityPage=view==='comunidad';const menu=links.map(item=>{
    if(item[1]==='Comunidad'){
      return '<div class="community-nav-wrap '+(isCommunityPage?'open':'')+'"><button class="community-nav-trigger '+(isCommunityPage?'active ':'')+'" type="button" data-community-menu>Comunidad</button><div class="community-nav-menu"><a href="seccion.html?view=comunidad&sub=palmares">PalmarÃ©s</a><a href="seccion.html?view=comunidad&sub=noticias">Noticias</a><a href="seccion.html?view=comunidad&sub=equipos">Equipos</a><a href="seccion.html?view=comunidad&sub=jugadores">Jugadores</a></div></div>';
    }
    return '<a class="'+(item[2]===view?'active ':'')+(item[1]==='Admin'?'admin-link':'')+'" href="'+item[0]+'">'+item[1]+'</a>';
  }).join('');const user=session?notificationMarkup()+'<a class="nav-profile" href="seccion.html?view=cuenta"><img class="mini-avatar" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(session.username)+'&size=s&direction=2&head_direction=2&gesture=sml&action=std" alt=""><span>'+session.username+'</span></a><button class="tab-btn" id="logoutButton">Salir</button>':'<a href="seccion.html?view=cuenta">Iniciar sesiÃ³n</a>';document.getElementById('nav').innerHTML=menu+user}
  function team(id){return state.teams.find(item=>item.id===id)}
  function divisionLabel(value){const normalized=String(value||'').replace(/D$/i,'');return ['1','2','3','4'].includes(normalized)?normalized+'D':String(value||'â€”')}
  function matchTeam(match, side){
    const id=side==='A'?match?.teamAId:match?.teamBId;
    const name=side==='A'?match?.home:match?.away;
    return state.teams.find(item=>item.id===id)||state.teams.find(item=>item.name?.toLowerCase()===String(name||'').trim().toLowerCase());
  }
  function normalizeMatches(){
    let changed=false;
    state.matches.forEach(match=>{
      const home=matchTeam(match,'A'),away=matchTeam(match,'B');
      if(home&&match.teamAId!==home.id){match.teamAId=home.id;changed=true}
      if(away&&match.teamBId!==away.id){match.teamBId=away.id;changed=true}
    });
    return changed;
  }
  function playerName(player){return typeof player==='string'?player:String(player?.name||player?.username||'').trim()}
  function registeredPlayerNames(teamId){
    const teamRecord = state.teams.find(item => item.id === teamId);
    return new Set((teamRecord?.players || []).map(player => player.toLowerCase()));
  }
  function matchRegisteredPlayerNames(match){
    const names = new Set();
    for (const player of (matchTeam(match,'A')?.players || [])) names.add(playerName(player).toLowerCase());
    for (const player of (matchTeam(match,'B')?.players || [])) names.add(playerName(player).toLowerCase());
    return names;
  }
  function teamForm(teamRecord){
    const result={played:0,points:0,goalsFor:0,goalsAgainst:0};
    if(!teamRecord)return result;
    state.matches.filter(item=>item.finished).forEach(item=>{
      const home=matchTeam(item,'A'),away=matchTeam(item,'B');
      if(home?.id!==teamRecord.id&&away?.id!==teamRecord.id)return;
      const homeScore=Number(item.scoreA)||0,awayScore=Number(item.scoreB)||0;
      result.played++;
      if(home?.id===teamRecord.id){result.goalsFor+=homeScore;result.goalsAgainst+=awayScore;if(homeScore>awayScore)result.points+=3;else if(homeScore===awayScore)result.points++}
      else{result.goalsFor+=awayScore;result.goalsAgainst+=homeScore;if(awayScore>homeScore)result.points+=3;else if(awayScore===homeScore)result.points++}
    });
    return result;
  }
  function matchPrediction(match, teamA, teamB){
    const formA=teamForm(teamA),formB=teamForm(teamB);
    const strengthA=(formA.played?formA.points/formA.played:1.2)+0.25;
    const strengthB=(formB.played?formB.points/formB.played:1.2);
    const draw=0.65,total=strengthA+strengthB+draw;
    const home=Math.round(strengthA/total*100),away=Math.round(strengthB/total*100),drawPct=Math.max(0,100-home-away);
    const expectedA=Math.max(.4,formA.played?formA.goalsFor/formA.played:1.2)+.25;
    const expectedB=Math.max(.4,formB.played?formB.goalsFor/formB.played:1.1);
    let hit='';
    if(match.finished){const favorite=home>=away&&home>=drawPct?'home':away>=drawPct?'away':'draw';const actual=Number(match.scoreA)>Number(match.scoreB)?'home':Number(match.scoreB)>Number(match.scoreA)?'away':'draw';hit=favorite===actual?'Acertada':'Fallada'}
    return {home,draw:drawPct,away,low:(expectedA+expectedB-0.8).toFixed(1),high:(expectedA+expectedB+1.8).toFixed(1),hit};
  }
  function activeTournament(){return state.tournaments.find(item=>item.id===activeTournamentId)||state.tournaments[0]}
  function getSeasonLabel(){
    const tournament=activeTournament();
    const parts=[];
    const name=tournament?.name && String(tournament.name).trim();
    const season=tournament?.season && String(tournament.season).trim();
    if(name) parts.push(name);
    if(season) parts.push(season);
    if(parts.length) return parts.join(' Â· ');
    const fallback=state.competition && String(state.competition).trim();
    return fallback || 'Temporada actual';
  }
  function toPlayerKey(value){return String(value||'').trim().toLowerCase();}
  function playerTeamName(playerName){
    const key=toPlayerKey(playerName);
    const team=state.teams.find(item=>(item.players||[]).some(player=>toPlayerKey(player)===key));
    return team ? team.name : '';
  }
  function buildActaStats(divisionFilter='all', category='goals'){
    const stats=new Map();
    const addEntry=(player,field,amount=1)=>{
      const name=String(player||'').trim();
      if(!name)return;
      const current=stats.get(name)||{name,team:playerTeamName(name),goals:0,assists:0,mvps:0,mentions:0,general:0};
      current[field]+=amount;
      current.general=current.goals + current.assists + current.mvps + current.mentions;
      stats.set(name,current);
    };

    const matches=state.matches.filter(match=>{
      if(!match.finished) return false;
      if(match.tournamentId && activeTournamentId && match.tournamentId!==activeTournamentId) return false;
      if(divisionFilter!=='all'){
        const matchDivision=String(match.division||team(match.teamAId)?.division||team(match.teamBId)?.division||'');
        if(matchDivision!==String(divisionFilter)) return false;
      }
      return true;
    });

    matches.forEach(match=>{
      (match.goals||[]).forEach(goal=>{
        if(goal.player) addEntry(goal.player,'goals',1);
        if(goal.assist) addEntry(goal.assist,'assists',1);
      });
      (match.mentions||[]).forEach(name=>addEntry(name,'mentions',1));
      if(match.mvp) addEntry(match.mvp,'mvps',1);
    });

    const sortable=Array.from(stats.values()).map(item=>({
      ...item,
      value: item[category] ?? item.general ?? 0,
      goals: item.goals || 0,
      assists: item.assists || 0,
      mvps: item.mvps || 0,
      mentions: item.mentions || 0,
      general: item.general || 0
    })).sort((a,b)=> (b.value||0) - (a.value||0) || a.name.localeCompare(b.name));

    return sortable;
  }
  function torneos(){return '<div class="panel-grid">'+(state.tournaments.length?state.tournaments.map(item=>'<button class="panel-card" style="text-align:left;border:0;color:inherit" data-select-tournament="'+item.id+'"><div class="panel-label">'+(item.id===activeTournamentId?'Torneo activo':'Torneo')+'</div><div class="match-name">'+item.name+'</div><div class="muted">'+(item.season||'Temporada abierta')+'</div></button>').join(''):'<div class="empty">TodavÃ­a no hay torneos creados.</div>')+'</div><div class="notice" style="margin-top:18px">El torneo activo sincroniza los partidos, la clasificaciÃ³n y las estadÃ­sticas.</div>'}
  function content(){const el=document.getElementById('content');if(view==='torneos')el.innerHTML=torneos();else if(view==='comunidad')el.innerHTML=comunidad();else if(view==='equipos')el.innerHTML=teams();else if(view==='jugadores')el.innerHTML=playersSection();else if(view==='partidos')el.innerHTML=matches();else if(view==='album')el.innerHTML=album();else if(view==='cuenta')el.innerHTML=account();else if(view==='admin'){el.innerHTML=admin();if(session?.role==='admin'&&!document.getElementById('newTeamCrest')){const crestInput=document.createElement('input');crestInput.type='hidden';crestInput.id='newTeamCrest';const crestFile=document.createElement('input');crestFile.type='file';crestFile.accept='image/*';crestFile.className='input';crestFile.id='newTeamCrestFile';crestFile.title='Subir escudo desde el PC';crestFile.addEventListener('change',function(){const file=crestFile.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{crestInput.value=reader.result};reader.readAsDataURL(file)});document.getElementById('addTeam')?.before(crestFile);document.getElementById('addTeam')?.before(crestInput);const matchCard=document.getElementById('createMatch')?.closest('.content-card');if(matchCard){matchCard.insertAdjacentHTML('beforebegin',ownerManagement());matchCard.insertAdjacentHTML('afterend',adminMatchList())}}setupAdminSections()}else el.innerHTML=stats()}
  function teamProfile(item){const players=item.players||[];const crest=item.crest?'<img class="team-crest-image" src="'+item.crest+'" alt="Escudo de '+item.name+'">':'';return '<div class="content-card" style="margin-top:18px">'+crest+'<div class="admin-title" style="display:inline-block">'+item.name+'</div><div class="muted">Jugadores de '+divisionLabel(item.division)+'</div><div class="panel-grid" style="margin-top:14px">'+(players.length?players.map(player=>'<div class="panel-card"><img class="profile-avatar" style="width:64px;height:82px" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(player)+'&size=m&direction=2&head_direction=2&gesture=sml&action=std" alt="Keko de '+player+'"><div class="match-name" style="margin-top:8px">'+player+'</div></div>').join(''):'<div class="empty">Este equipo todavÃ­a no tiene jugadores registrados.</div>')+'</div></div>'}
  function teams(){return '<div class="panel-grid">'+['1','2','3','4'].map(division=>{const list=state.teams.filter(item=>String(item.division||'')===division);return '<div class="panel-card"><div class="panel-label">'+divisionLabel(division)+'</div>'+(list.length?list.map(item=>'<button class="match-row" style="width:100%;text-align:left;border:0;color:inherit" data-team-id="'+item.id+'">'+(item.crest?'<img class="team-crest-image" src="'+item.crest+'" alt="">':'')+'<span class="match-name">'+item.name+'</span><span class="tag">Ver jugadores</span></button>').join(''):'<div class="empty">TodavÃ­a no hay equipos en esta divisiÃ³n.</div>')+'</div>'}).join('')+'</div><div id="teamDetail"></div>'}
  function normalizePlayerAccount(account){
    const username=String(account?.username || account?.name || '').trim();
    if(!username) return null;
    const rawPositions=Array.isArray(account?.position)?account.position:[account?.position].filter(Boolean);
    const position=rawPositions.flatMap(value=>String(value).split(/[,;/|]+/)).map(value=>value.trim().toUpperCase()).filter(Boolean).map(value=>value==='PORTERO'||value==='POR'?'GK':value==='MEDIO'||value==='CENTROCAMPISTA'?'MED':value==='EXTREMO'||value==='EXTREMO/BANDA'?'BANDA':value);
    const country=String(account?.country || account?.pais || '').trim();
    return {
      username,
      role: account?.role || 'pendiente',
      position,
      division: account?.division || '',
      country,
      enabledDivisions: Array.isArray(account?.enabledDivisions)?account.enabledDivisions:[]
    };
  }
  function playersSection(){
    const assignedNames=new Set(state.teams.flatMap(item=>item.players||[]).map(player=>String(player).toLowerCase()));
    const rosterPlayers=state.teams.flatMap(item=>item.players||[]).map(player=>typeof player==='string'?player:playerName(player));
    const uniqueAccounts=new Map();
    [...rosterPlayers.map(username=>({username,role:'pendiente'})), ...accounts.filter(Boolean)]
      .map(normalizePlayerAccount)
      .filter(Boolean)
      .filter(account=>!['admin','arbitro'].includes(String(account.role||'').toLowerCase()))
      .forEach(account=>{
        const key=toPlayerKey(account.username);
        if(!key) return;
        uniqueAccounts.set(key, account);
      });
    const allPlayers=[...uniqueAccounts.values()];
    const filtered=allPlayers.filter(account=>{
      const positions=Array.isArray(account.position)?account.position:[account.position].filter(Boolean),grl=calculateGRL(account.username),free=!assignedNames.has(account.username.toLowerCase());
      const countryName=(account.country ? (countryOptions.find(([code])=>code===account.country)?.[2] || '') : '').toLowerCase();
      return account.username.toLowerCase().includes(playerSearch.toLowerCase())&&(playerPositionFilter==='all'||positions.includes(playerPositionFilter))&&(playerGrlFilter==='all'||(playerGrlFilter==='80+'?grl>=80:playerGrlFilter==='70-79'?grl>=70&&grl<80:grl<70))&&(playerFreeAgentFilter==='all'||(playerFreeAgentFilter==='free'?free:!free))&&(playerCountrySearch===''||countryName.includes(playerCountrySearch.toLowerCase()));
    });
    const positionButtons=['all','MED','NEUTRO','BANDA','GK'].map(item=>'<button class="player-filter '+(playerPositionFilter===item?'active':'')+'" type="button" data-player-position="'+item+'">'+(item==='all'?'Todas':item)+'</button>').join('');
    const cards=filtered.length?filtered.map(account=>{const positions=Array.isArray(account.position)?account.position:[account.position].filter(Boolean);return '<button class="player-directory-card" type="button" data-player-profile="'+profileText(account.username)+'" aria-label="Ver perfil de '+profileText(account.username)+'"><img class="player-directory-avatar" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(account.username)+'&size=m&headonly=1&direction=2&head_direction=2&gesture=sml&action=std" alt="Cara de '+profileText(account.username)+'"><span class="player-directory-copy"><span class="player-directory-name">'+profileText(account.username)+'</span><span class="player-directory-position">'+(positions.join(' Â· ')||'Sin posiciÃ³n')+'</span></span><strong class="player-directory-grl">GRL '+calculateGRL(account.username)+'</strong></button>'}).join(''):'<div class="empty">No hay jugadores con esos filtros.</div>';
    const countryOptionsMarkup=countryOptions.map(([code,emoji,label])=>'<option value="'+code+'" '+(playerCountrySearch===code?'selected':'')+'>'+emoji+' '+label+'</option>').join('');
    return '<div class="players-directory"><div class="players-directory-head"><span class="players-count">'+filtered.length+' jugadores</span></div><div class="players-filters"><input class="input" id="playerDirectorySearch" value="'+profileText(playerSearch)+'" placeholder="Buscar jugador..."><select class="input" id="playerDirectoryCountrySearch"><option value="">Todos los paÃ­ses</option>'+countryOptionsMarkup+'</select><select class="input" id="playerDirectoryGrl"><option value="all">GRL Â· Todos</option><option value="80+" '+(playerGrlFilter==='80+'?'selected':'')+'>GRL Â· 80+</option><option value="70-79" '+(playerGrlFilter==='70-79'?'selected':'')+'>GRL Â· 70-79</option><option value="under70" '+(playerGrlFilter==='under70'?'selected':'')+'>GRL Â· Menos de 70</option></select><select class="input" id="playerDirectoryFree"><option value="all">Estado Â· Todos</option><option value="free" '+(playerFreeAgentFilter==='free'?'selected':'')+'>Agente libre</option><option value="team" '+(playerFreeAgentFilter==='team'?'selected':'')+'>Con equipo</option></select></div><div class="players-filter-buttons"><span class="panel-label">PosiciÃ³n</span>'+positionButtons+'</div><div class="players-grid">'+cards+'</div><div id="playerDetail"></div></div>';
  }
  function renderPlayersDirectory(){
    const container=document.querySelector('.players-directory');
    if(!container)return;
    const assignedNames=new Set(state.teams.flatMap(item=>item.players||[]).map(player=>String(player).toLowerCase()));
    const rosterPlayers=state.teams.flatMap(item=>item.players||[]).map(player=>typeof player==='string'?player:playerName(player));
    const uniqueAccounts=new Map();
    [...rosterPlayers.map(username=>({username,role:'pendiente'})), ...accounts.filter(Boolean)]
      .map(normalizePlayerAccount)
      .filter(Boolean)
      .filter(account=>!['admin','arbitro'].includes(String(account.role||'').toLowerCase()))
      .forEach(account=>{
        const key=toPlayerKey(account.username);
        if(!key) return;
        uniqueAccounts.set(key, account);
      });
    const allPlayers=[...uniqueAccounts.values()];
    const filtered=allPlayers.filter(account=>{
      const positions=Array.isArray(account.position)?account.position:[account.position].filter(Boolean),grl=calculateGRL(account.username),free=!assignedNames.has(String(account.username).toLowerCase());
      const countryName=(account.country ? (countryOptions.find(([code])=>code===account.country)?.[2] || '') : '').toLowerCase();
      return String(account.username).toLowerCase().includes(playerSearch.toLowerCase())&&(playerPositionFilter==='all'||positions.includes(playerPositionFilter))&&(playerGrlFilter==='all'||(playerGrlFilter==='80+'?grl>=80:playerGrlFilter==='70-79'?grl>=70&&grl<80:grl<70))&&(playerFreeAgentFilter==='all'||(playerFreeAgentFilter==='free'?free:!free))&&(playerCountrySearch===''||countryName.includes(playerCountrySearch.toLowerCase()));
    });
    const cards=filtered.length?filtered.map(account=>{const positions=Array.isArray(account.position)?account.position:[account.position].filter(Boolean);return '<button class="player-directory-card" type="button" data-player-profile="'+profileText(account.username)+'" aria-label="Ver perfil de '+profileText(account.username)+'"><img class="player-directory-avatar" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(account.username)+'&size=m&headonly=1&direction=2&head_direction=2&gesture=sml&action=std" alt="Cara de '+profileText(account.username)+'"><span class="player-directory-copy"><span class="player-directory-name">'+profileText(account.username)+'</span><span class="player-directory-position">'+(positions.join(' Â· ')||'Sin posiciÃ³n')+'</span></span><strong class="player-directory-grl">GRL '+calculateGRL(account.username)+'</strong></button>'}).join(''):'<div class="empty">No hay jugadores con esos filtros.</div>';
    const count=container.querySelector('.players-count');if(count)count.textContent=filtered.length+' jugadores';
    const grid=container.querySelector('.players-grid');if(grid)grid.innerHTML=cards;
    const buttons=container.querySelectorAll('.player-filter');buttons.forEach(button=>button.classList.toggle('active',button.dataset.playerPosition===playerPositionFilter));
  }
  function playerCards(players){return players.length?players.map(player=>'<div class="panel-card"><img class="profile-avatar" style="width:64px;height:82px" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(player)+'&size=m&direction=2&head_direction=2&gesture=sml&action=std" alt="Keko de '+player+'"><div class="match-name" style="margin-top:8px">'+player+'</div><button class="btn btn-primary" data-send-offer="'+player+'" style="margin-top:10px">Enviar oferta</button></div>').join(''):'<div class="empty">No hay jugadores registrados en tu equipo.</div>'}
  function matchRoundLabel(value){const numeric=Number(value);if(Number.isFinite(numeric)&&numeric>0)return 'J'+numeric;const found=String(value||'').match(/\d+/);return 'J'+(found?Number(found[0]):1)}
  let publicMatchTournament='all',publicMatchDivision='all',publicMatchRound='all';
  function matches(){
    if(normalizeMatches())setJSON('matches',state.matches);
    const tournaments=state.tournaments||[],availableRounds=[...new Set(state.matches.map(match=>Number(match.round)||1))].sort((a,b)=>a-b);
    const filteredMatches=state.matches.filter(match=>{const homeTeam=matchTeam(match,'A'),awayTeam=matchTeam(match,'B'),division=String(match.division||homeTeam?.division||awayTeam?.division||'');return (publicMatchTournament==='all'||String(match.tournamentId||'')===publicMatchTournament)&&(publicMatchDivision==='all'||division===publicMatchDivision)&&(publicMatchRound==='all'||String(Number(match.round)||1)===publicMatchRound)});
    const rows=filteredMatches.map(match=>{
      const a=matchTeam(match,'A'), b=matchTeam(match,'B');
        const home=match.home||a?.name||'Local', away=match.away||b?.name||'Visitante';
      const validPlayers=matchRegisteredPlayerNames(match);
      const players=[...new Set([...(match.players||[]).map(playerName),...(a?.players||[]).map(playerName),...(b?.players||[]).map(playerName),...(match.lineupA||[]).map(playerName),...(match.lineupB||[]).map(playerName)].filter(Boolean))].filter(player=>validPlayers.has(player.toLowerCase()));
      const attendance=match.attendance||{};
      const presentPlayers=players.filter(player=>attendance[player]);
      const pendingPlayers=players.filter(player=>!attendance[player]);
      const crest=(item)=>item?.crest?'<img class="fixture-crest" src="'+item.crest+'" alt="Escudo de '+item.name+'">':'<span class="fixture-crest fixture-crest-fallback">'+(item?.name||'?').slice(0,2).toUpperCase()+'</span>';
      const goalsA=(match.goals||[]).filter(goal=>goal.side==='A');
      const goalsB=(match.goals||[]).filter(goal=>goal.side==='B');
      const score=match.finished?((match.scoreA??0)+' - '+(match.scoreB??0)):'VS';
      const prediction=matchPrediction(match,a,b);
      const scorerList=(goals)=>goals.length?goals.map(goal=>'<div class="fixture-scorer">âš½ '+goal.player+' <small>'+goal.minute+"'</small></div>").join(''):'<div class="fixture-scorer muted">Sin goles registrados</div>';
      const fieldHTML=match.finished&&selectedActaMatchId!==match.id?'<div class="closed-field"><div class="closed-field-title">CÃ©sped Â· AlineaciÃ³n inicial publicada</div>'+actaField(match)+'</div>':'';
      const chronicleHTML=match.finished?'<div class="match-chronicle"><h3>CrÃ³nica del partido</h3>'+matchChronicle(match)+'</div>':'';
      const awardsHTML=match.finished?'<div class="match-awards"><h3>Premios</h3>'+matchAwards(match)+'</div>':'';
      const presentHTML='<div class="attendance-panel attendance-confirmed"><b>ðŸ‘¥ Han confirmado asistencia ('+presentPlayers.length+')</b>'+(presentPlayers.length?presentPlayers.map(player=>'<div class="attendance-row"><span><img class="mini-avatar" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(player)+'&size=s&direction=2&head_direction=2&gesture=sml&action=std" alt=""> '+player+' Â· '+attendance[player]+'</span><span class="confirmed-badge">âœ“ Confirmado</span></div>').join(''):'<div class="muted">TodavÃ­a no hay confirmaciones.</div>')+'</div>';
      const rosterColumn=(item,side)=>{const roster=(item?.players||[]).map(playerName).filter(Boolean);return '<div class="roster-column"><div class="roster-team-name">'+crest(item)+'<strong>'+profileText(item?.name|| (side==='A'?home:away))+'</strong></div>'+(roster.length?roster.map(player=>{const canConfirm=session&&session.username.toLowerCase()===player.toLowerCase();return '<div class="attendance-row"><span><img class="mini-avatar" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(player)+'&size=s&direction=2&head_direction=2&gesture=sml&action=std" alt=""> '+profileText(player)+'</span>'+(canConfirm?'<button class="btn btn-primary btn-sm" data-present-match="'+match.id+'" data-present-player="'+player+'">Presente</button>':'')}</div>'}).join(''):'<div class="muted">Sin jugadores registrados.</div>')+'</div>'};
      const pendingHTML='<div class="attendance-panel attendance-rosters"><b>ðŸ‘¥ Plantillas</b><div class="rosters-grid">'+rosterColumn(a,'A')+rosterColumn(b,'B')+'</div></div>';
      const canEdit=session&&['admin','arbitro'].includes(session.role);
      const predictionHTML='<div class="fixture-prediction"><div class="fixture-prediction-title"><span>ðŸ“Š PredicciÃ³n</span>'+(prediction.hit?'<small class="'+(prediction.hit==='Acertada'?'prediction-hit':'prediction-miss')+'">'+(prediction.hit==='Acertada'?'âœ“ Acertada':'âœ• Fallada')+'</small>':'')+'</div><div class="prediction-line"><span>'+home+'</span><div class="prediction-track"><div class="prediction-fill" style="width:'+prediction.home+'%"></div></div><b>'+prediction.home+'%</b></div><div class="prediction-line"><span>Empate</span><div class="prediction-track"><div class="prediction-fill draw" style="width:'+prediction.draw+'%"></div></div><b>'+prediction.draw+'%</b></div><div class="prediction-line"><span>'+away+'</span><div class="prediction-track"><div class="prediction-fill away" style="width:'+prediction.away+'%"></div></div><b>'+prediction.away+'%</b></div><div class="prediction-note">Goles esperados: '+prediction.low+' - '+prediction.high+'</div></div>';
      const actaEditor=canEdit&&selectedActaMatchId===match.id?'<div class="inline-acta">'+actaMenu(match)+'<input class="input" id="mvpInput" placeholder="MVP del partido" value="'+(match.mvp||'')+'"><textarea class="input" id="actaText" placeholder="Observaciones del acta">'+(match.acta||'')+'</textarea><div class="form-hint" id="saveActaHint"></div><div class="fixture-actions"><button class="btn btn-ghost btn-sm" type="button" data-save-acta="'+match.id+'">GUARDAR CAMBIOS</button><button class="btn btn-primary btn-sm finalize-acta-btn" type="button" data-finalize-acta="'+match.id+'">FINALIZAR ACTA</button></div></div>':'';
      const manageActaButton=canEdit? (selectedActaMatchId===match.id ? '' : '<button class="btn btn-primary btn-sm" data-open-acta="'+match.id+'">EDITAR ACTA</button>') : '<span class="muted">'+(match.finished?'Resultado registrado':'Encuentro pendiente')+'</span>';
      const roundLabel=matchRoundLabel(match.round);
      const tournamentName=state.tournaments.find(item=>String(item.id)===String(match.tournamentId))?.name||'CompeticiÃ³n AFH';
      return '<article class="fixture-card public-match-card"><div class="fixture-head"><span class="fixture-competition">'+profileText(tournamentName)+'</span><span class="fixture-division">'+(match.division?'D'+match.division:'AFH')+' Â· '+roundLabel+' Â· Jornada '+(Number(match.round)||1)+'</span><span class="fixture-date">'+(match.date||'Sin fecha')+' Â· '+(match.time||'')+'</span></div><div class="fixture-score"><div class="fixture-team">'+crest(a)+'<strong>'+home+'</strong><small>LOCAL</small><div class="fixture-scorers">'+scorerList(goalsA)+'</div></div><div class="fixture-result">'+score+'<small>'+((match.finished?'Finalizado':'Programado'))+'</small></div><div class="fixture-team">'+crest(b)+'<strong>'+away+'</strong><small>VISITANTE</small><div class="fixture-scorers">'+scorerList(goalsB)+'</div></div></div>'+predictionHTML+'<div class="fixture-actions">'+manageActaButton+'</div>'+fieldHTML+chronicleHTML+awardsHTML+'<div class="public-match-panels">'+presentHTML+pendingHTML+'</div>'+actaEditor+'</article>';
    }).join('');
    const tournamentOptions='<option value="all">Todos los torneos</option>'+tournaments.map(item=>'<option value="'+item.id+'" '+(publicMatchTournament===item.id?'selected':'')+'>'+profileText(item.name)+'</option>').join('');
    const divisionOptions='<option value="all">Todas las divisiones</option>'+['1','2','3','4'].map(value=>'<option value="'+value+'" '+(publicMatchDivision===value?'selected':'')+'>DivisiÃ³n '+value+'</option>').join('');
    const roundOptions='<option value="all">Todas las jornadas</option>'+availableRounds.map(value=>'<option value="'+value+'" '+(publicMatchRound===String(value)?'selected':'')+'>'+matchRoundLabel(value)+' Â· Jornada '+value+'</option>').join('');
    const roundButtons='<button class="public-match-round '+(publicMatchRound==='all'?'active':'')+'" data-public-round="all">Todas</button>'+availableRounds.map(value=>'<button class="public-match-round '+(publicMatchRound===String(value)?'active':'')+'" data-public-round="'+value+'">'+matchRoundLabel(value)+'</button>').join('');
    return '<div class="public-match-toolbar"><select class="input" id="publicMatchTournament">'+tournamentOptions+'</select><select class="input" id="publicMatchDivision">'+divisionOptions+'</select><select class="input" id="publicMatchRound">'+roundOptions+'</select></div><div class="public-match-rounds">'+roundButtons+'</div><div class="public-match-heading">Partidos y jornadas</div><div class="fixtures-list">'+(rows||'<div class="empty">No hay partidos para este torneo, divisiÃ³n y jornada.</div>')+'</div>';
  }
  function stats(division='all',category='goals'){
    const statsRows=buildActaStats(division, category);
    const podiumData=statsRows.slice(0,3).map((player,index)=>({
      rank:index+1,
      name:player.name,
      team:player.team,
      avatar:'https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(player.name)+'&size=m&headonly=1&direction=2&head_direction=2&gesture=sml&action=std',
      value: player[category] || 0,
      card:index===0?'first':index===1?'second':'third'
    }));
    while(podiumData.length<3){podiumData.push({rank:podiumData.length+1,name:'',team:'',avatar:'',value:0,card:podiumData.length===0?'first':podiumData.length===1?'second':'third'});}

    const tableRows = Array.from({length:10},(_,index)=>{
      const player = statsRows[index+3] || {name:'',team:'',goals:0,assists:0,mvps:0,mentions:0,general:0};
      return {
        rank:index+4,
        name:player.name || '',
        team:player.team || '',
        goals:player.goals || 0,
        assists:player.assists || 0,
        mvps:player.mvps || 0,
        mentions:player.mentions || 0,
        general:player.general || 0
      };
    });

    const labelMap={goals:'Goles',assists:'Asistencias',mvps:'MVPs',mentions:'Menciones',general:'General'};
    const podiumMeta = (player) => {
      const parts=[];
      if(player.goals) parts.push('<b>'+player.goals+'</b> G');
      if(player.assists) parts.push('<b>'+player.assists+'</b> A');
      if(player.mvps) parts.push('<b>'+player.mvps+'</b> MVP');
      if(player.mentions) parts.push('<b>'+player.mentions+'</b> MEN');
      return parts.length ? parts.slice(0,3).join(' â€¢ ') : '';
    };
    const renderPodium = podiumData.map(player => {
      const metricValue = player.name ? (player.value ?? 0) : 0;
      const metricLabel = player.name ? (labelMap[category] || 'General') : '';
      const meta = player.name ? podiumMeta(player) : '';
      return `
        <div class="stat-podium-card ${player.card}">
          <div class="stat-podium-rank">${player.rank}</div>
          ${player.name ? '<img class="stat-podium-avatar" src="'+player.avatar+'" alt="'+player.name+'">' : '<div class="stat-podium-avatar stat-podium-avatar-empty" aria-label="Jugador sin datos"></div>'}
          <div class="stat-podium-name">${player.name || ''}</div>
          <div class="stat-podium-team">${player.team || ''}</div>
          <div class="stat-podium-total">${metricValue}${metricLabel ? '<span>'+metricLabel+'</span>' : ''}</div>
          ${meta ? '<div class="stat-podium-meta">'+meta+'</div>' : ''}
        </div>
      `;
    }).join('');

    const renderRows = tableRows.map(player => `
      <div class="stats-leader-row">
        <span class="stats-leader-rank">${player.rank}</span>
        <div class="stats-leader-player">
          ${player.name ? '<img class="stats-leader-avatar" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(player.name)+'&size=m&headonly=1&direction=2&head_direction=2&gesture=sml&action=std" alt="'+player.name+'">' : '<div class="stats-leader-avatar stats-leader-avatar-empty" aria-label="Jugador sin datos"></div>'}
          <div class="stats-leader-meta">
            <div class="stats-leader-name">${player.name || ''}</div>
            <div class="stats-leader-team">${player.team || ''}</div>
          </div>
        </div>
        <div class="stats-leader-metrics">
          <span class="metric-goals">${player.goals}<small>G</small></span>
          <span class="metric-assists">${player.assists}<small>A</small></span>
          <span class="metric-mvps">${player.mvps}<small>â­</small></span>
          <span class="metric-mentions">${player.mentions}<small>MEN</small></span>
          <span class="metric-general">${player.general}<small>GEN</small></span>
        </div>
      </div>
    `).join('');

    const divisionButtons=['all','1','2','3','4'].map(value=>`<button class="stats-filter ${division===value?'active':''}" type="button" data-stats-division="${value}">${value==='all'?'Todos':value+'D'}</button>`).join('');
    const categoryButtons=[
      {key:'goals',label:'âš½ Goles'},
      {key:'assists',label:'ðŸ…° Asistencias'},
      {key:'mvps',label:'ðŸ† MVPs'},
      {key:'mentions',label:'â­ Menciones'},
      {key:'general',label:'ðŸ“Š General'}
    ].map(item=>`<button class="stats-category ${category===item.key?'active':''}" type="button" data-stats-category="${item.key}">${item.label} <b>${statsRows.reduce((sum,player)=>sum+(player[item.key]||0),0)}</b></button>`).join('');

    return '<div class="stats-shell"><div class="stats-toolbar"><div class="stats-filter-row"><span class="stats-filter-label">DivisiÃ³n</span>'+divisionButtons+'</div><div class="stats-filter-row"><span class="stats-filter-label">Temporada</span><button class="stats-season active" type="button">'+getSeasonLabel()+'</button></div></div><div class="stats-category-row">'+categoryButtons+'</div><div class="stats-content"><div class="stats-podium">'+renderPodium+'</div><div class="stats-leader-list">'+renderRows+'</div></div></div>';
  }
  function profileStatsFor(username){
    const key=toPlayerKey(username),result={goals:0,assists:0,mvps:0,mentions:0,matches:0,seasons:new Map()};
    const ensureSeason=match=>{const tournament=state.tournaments.find(item=>item.id===match.tournamentId)||activeTournament();const season=tournament?.season||tournament?.name||'Temporada actual';if(!result.seasons.has(season))result.seasons.set(season,{season,score:0,max:0});return result.seasons.get(season)};
    state.matches.filter(match=>match.finished&&(!match.tournamentId||match.tournamentId===activeTournamentId)).forEach(match=>{
      const names=new Set([...(match.lineupA||[]),...(match.lineupB||[])].map(playerName).filter(Boolean).map(toPlayerKey));
      const involved=names.has(key)||(match.goals||[]).some(item=>toPlayerKey(item.player)===key||toPlayerKey(item.assist)===key)||(match.mvp&&toPlayerKey(match.mvp)===key);
      if(involved)result.matches++;
      (match.goals||[]).forEach(item=>{if(toPlayerKey(item.player)===key)result.goals++;if(toPlayerKey(item.assist)===key)result.assists++});
      if(toPlayerKey(match.mvp)===key)result.mvps++;
      (match.mentions||[]).forEach(item=>{if(toPlayerKey(item)===key)result.mentions++});
      if(involved){const season=ensureSeason(match);season.score+=Number(toPlayerKey(match.mvp)===key)+((match.goals||[]).filter(item=>toPlayerKey(item.player)===key).length)+((match.goals||[]).filter(item=>toPlayerKey(item.assist)===key).length);season.max+=3}
    });
    return result;
  }
  function calculateGRL(username){
    const stats=profileStatsFor(username);
    const contribution=(stats.goals*6)+(stats.assists*4)+(stats.mvps*8)+(stats.mentions*2)+Math.min(stats.matches,20);
    return Math.min(99,Math.max(50,40+contribution));
  }
  function offerEligibility(playerName,ownerName=session?.username){
    const owned=state.teams.find(item=>item.ownerUsername===ownerName),account=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(playerName));
    if(!owned)return {ok:false,message:'Solo los dueÃ±os de equipo pueden enviar ofertas.'};
    const enabled=Array.isArray(account?.enabledDivisions)?account.enabledDivisions:(account?.division?[String(account.division)]:[]);
    if(!enabled.includes(String(owned.division)))return {ok:false,message:'Este jugador no tiene habilitada la divisiÃ³n '+divisionLabel(owned.division)+' para tu equipo.'};
    return {ok:true,team:owned,account};
  }
  function profileTeamHistory(username){
    const key=toPlayerKey(username),teamIds=new Set();
    state.teams.forEach(item=>{if((item.players||[]).some(player=>toPlayerKey(player)===key))teamIds.add(item.id)});
    state.matches.forEach(match=>{if([...(match.lineupA||[]),...(match.lineupB||[])].some(player=>toPlayerKey(playerName(player))===key)){if(match.teamAId)teamIds.add(match.teamAId);if(match.teamBId)teamIds.add(match.teamBId)}});
    return [...teamIds].map(id=>{const teamRecord=team(id),form=teamForm(teamRecord);return teamRecord?{...teamRecord,form}:null}).filter(Boolean);
  }
  function profileCommentsFor(username){return getJSON('profileComments',[]).then(items=>items.filter(item=>toPlayerKey(item.target)===toPlayerKey(username)))}
  function profileText(value){return String(value||'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]))}
  function closeContractModal(){document.querySelector('.contract-modal-backdrop')?.remove()}
  function showSignedContract(offer){
    const offerTeam=team(offer.teamId),owner=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(offer.ownerUsername));
    const backdrop=document.createElement('div');backdrop.className='contract-modal-backdrop';backdrop.innerHTML='<div class="signed-contract-paper" role="dialog" aria-modal="true"><div class="signed-contract-head"><img class="signed-contract-crest" src="EDITABLE_HF.png" alt="Escudo HFA"><h2>CONTRATO DE FICHAJE</h2><small>HABBO FÃšTBOL ASOCIACIÃ“N</small></div><div class="signed-contract-body"><strong>Equipo:</strong> '+profileText(offerTeam?.name||'Equipo')+'\n<strong>Jugador:</strong> '+profileText(offer.player)+'\n\n'+profileText(offer.message||offer.terms||'Contrato aceptado por ambas partes.')+'\n\nContrato firmado y registrado automÃ¡ticamente en la asociaciÃ³n.</div><div class="signed-contract-signatures"><div class="signed-contract-signature"><img src="'+(offer.signature||'')+'" alt="Firma del dueÃ±o"><span>Firma del dueÃ±o Â· '+profileText(owner?.username||offer.ownerUsername)+'</span></div><div class="signed-contract-signature"><img src="'+(offer.playerSignature||'')+'" alt="Firma del jugador"><span>Firma del jugador Â· '+profileText(offer.player)+'</span></div></div><button class="signed-contract-close" type="button" data-signed-contract-close>CERRAR</button></div>';
    document.body.append(backdrop);
  }
  function openOfferComposer(playerName){
    const owned=state.teams.find(item=>item.ownerUsername===session?.username);if(!owned)return;
    const backdrop=document.createElement('div');backdrop.className='contract-modal-backdrop';backdrop.innerHTML='<div class="contract-modal" role="dialog" aria-modal="true"><h2>OFERTA DE CONTRATO</h2><div class="muted">'+profileText(owned.name)+' Â· para '+profileText(playerName)+'</div><textarea class="input" data-offer-message maxlength="1000" placeholder="Escribe un texto para el jugador..." style="min-height:110px;margin-top:16px;resize:vertical"></textarea><label class="signature-label">Firma del dueÃ±o</label><canvas class="signature-pad" width="560" height="150"></canvas><div class="contract-modal-actions"><button type="button" data-offer-close>CANCELAR</button><button type="button" class="accept-contract" data-offer-send="'+profileText(playerName)+'">ENVIAR</button></div></div>';
    document.body.append(backdrop);const canvas=backdrop.querySelector('.signature-pad'),context=canvas.getContext('2d');context.strokeStyle='#34e88f';context.lineWidth=2;context.lineCap='round';let drawing=false;const point=event=>{const rect=canvas.getBoundingClientRect(),source=event.touches?.[0]||event;return {x:(source.clientX-rect.left)*canvas.width/rect.width,y:(source.clientY-rect.top)*canvas.height/rect.height}};canvas.addEventListener('pointerdown',event=>{drawing=true;const p=point(event);context.beginPath();context.moveTo(p.x,p.y)});canvas.addEventListener('pointermove',event=>{if(!drawing)return;const p=point(event);context.lineTo(p.x,p.y);context.stroke()});canvas.addEventListener('pointerup',()=>drawing=false);canvas.addEventListener('pointerleave',()=>drawing=false);
  }
  function openContractModal(offer){
    const offerTeam=team(offer.teamId),owner=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(offer.ownerUsername)),message=offer.message||offer.terms||'El dueÃ±o del equipo te invita a formar parte de su plantilla.';
    const backdrop=document.createElement('div');backdrop.className='contract-modal-backdrop';backdrop.innerHTML='<div class="contract-modal" role="dialog" aria-modal="true"><h2>CONTRATO - '+profileText(offerTeam?.name||'Equipo')+'</h2><p>'+profileText(message)+'</p><div class="muted">Enviado por '+profileText(owner?.username||offer.ownerUsername||'DueÃ±o del equipo')+'</div><label class="signature-label">Firma del jugador</label><canvas class="signature-pad" width="560" height="150"></canvas><div class="contract-modal-actions"><button type="button" data-contract-close>CERRAR</button><button type="button" data-contract-reject="'+offer.id+'">RECHAZAR</button><button type="button" class="accept-contract" data-contract-accept="'+offer.id+'">ACEPTAR Y FIRMAR</button></div></div>';
    document.body.append(backdrop);const canvas=backdrop.querySelector('.signature-pad'),context=canvas.getContext('2d');context.strokeStyle='#34e88f';context.lineWidth=2;context.lineCap='round';let drawing=false;const point=event=>{const rect=canvas.getBoundingClientRect(),source=event.touches?.[0]||event;return {x:(source.clientX-rect.left)*canvas.width/rect.width,y:(source.clientY-rect.top)*canvas.height/rect.height}};canvas.addEventListener('pointerdown',event=>{drawing=true;const p=point(event);context.beginPath();context.moveTo(p.x,p.y)});canvas.addEventListener('pointermove',event=>{if(!drawing)return;const p=point(event);context.lineTo(p.x,p.y);context.stroke()});canvas.addEventListener('pointerup',()=>drawing=false);canvas.addEventListener('pointerleave',()=>drawing=false);
  }
  function renderProfileComments(comments,list){
    if(!list)return;
    const visible=comments.filter(item=>!item.hidden||item.author===session.username),renderItem=(item,isReply)=>{const reactions=item.reactions||{},liked=Array.isArray(reactions.like)&&reactions.like.includes(session.username),date=item.createdAt?new Date(item.createdAt).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}):'';return '<div class="comment-item '+(isReply?'reply ':'')+(item.hidden?'comment-hidden':'')+'"><div class="comment-author"><img class="comment-avatar" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(item.author)+'&size=s&direction=2&head_direction=2&gesture=sml&action=std" alt="Keko de '+profileText(item.author)+'"><strong>'+profileText(item.author)+'</strong><span class="comment-date">'+date+'</span></div><p>'+(item.hidden?'Comentario oculto':profileText(item.text))+'</p><div class="comment-actions-row">'+(!item.hidden?'<button type="button" data-comment-react="'+item.id+'">'+(liked?'â™¥':'â™¡')+' '+((reactions.like||[]).length)+' <span class="comment-action-label">Reaccionar</span></button><button type="button" data-comment-reply="'+item.id+'">â†© Responder</button>':'')+((item.author===session.username||session.role==='admin')?'<button type="button" data-comment-hide="'+item.id+'">'+(item.hidden?'Mostrar':'Ocultar')+'</button><button type="button" data-comment-delete="'+item.id+'">Eliminar</button>':'')+'</div></div>'};
    const topLevel=visible.filter(item=>!item.parentId);list.innerHTML=topLevel.length?topLevel.map(item=>renderItem(item,false)+visible.filter(reply=>reply.parentId===item.id).map(reply=>renderItem(reply,true)).join('')).join(''):'<div class="muted">Sin comentarios registrados.</div>';
  }
  async function hydrateProfile(){
    if(!session)return;
    const account=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(session.username))||{};
    const playerStats=profileStatsFor(session.username);
    const values={Goles:playerStats.goals,Asistencias:playerStats.assists,MVPs:playerStats.mvps,Partidos:playerStats.matches,'Pases clave':playerStats.assists,PuntuaciÃ³n:playerStats.goals+playerStats.assists+playerStats.mvps,'Rendimiento':playerStats.goals+playerStats.assists+playerStats.mvps+playerStats.mentions};
    document.querySelectorAll('.profile-metric-card,.profile-mini-metric').forEach(card=>{const label=card.querySelector('span')?.textContent.trim();if(label&&values[label]!==undefined)card.querySelector('strong').textContent=values[label]});
    const score=document.querySelector('.profile-total-score');if(score)score.textContent=calculateGRL(session.username);
    const position=document.querySelector('.profile-country');
    const countryEntry=countryOptions.find(([code])=>code===account.country) || [];
    const countryValue = countryEntry.length ? countryEntry[1] + ' ' + countryEntry[2] : 'PaÃ­s no registrado';
    const positions=Array.isArray(account.position)?account.position:[account.position].filter(Boolean);
    const enabledDivisions=Array.isArray(account.enabledDivisions)?account.enabledDivisions:(account.division?[String(account.division)]:[]);
    const userTeam=state.teams.find(item=>(item.players||[]).some(player=>player.toLowerCase()===session.username.toLowerCase()));
    if(position)position.textContent = countryValue + (userTeam ? ' Â· ' + userTeam.name : '');
    const positionsNode=document.querySelector('.profile-meta-item[data-kind="positions"] strong');
    if(positionsNode)positionsNode.textContent=positions.length?positions.join(' Â· '):'Sin registrar';
    const divisionsNode=document.querySelector('.profile-meta-item[data-kind="divisions"] strong');
    if(divisionsNode)divisionsNode.textContent=enabledDivisions.length?enabledDivisions.map(item=>String(item)+'D').join(', '):'Ninguna';
    const analysis=document.querySelector('.profile-analysis');if(analysis){const seasons=[...playerStats.seasons.values()];analysis.innerHTML=seasons.length?'<div class="profile-season-list">'+seasons.map(item=>{const percent=item.max?Math.min(100,Math.round(item.score/item.max*100)):0;return '<div class="profile-season-row"><div class="profile-season-head"><span>'+item.season+'</span><b>'+percent+'%</b></div><div class="profile-progress"><span style="width:'+percent+'%"></span></div></div>'}).join('')+'</div>':'<div class="muted">AÃºn no hay partidos finalizados para mostrar progreso.</div>'}
    const history=document.querySelector('.profile-history');if(history){const teams=profileTeamHistory(session.username);history.innerHTML=teams.length?teams.map(item=>'<button class="history-item" type="button" data-profile-team="'+item.id+'"><span>'+item.name+'</span><b>D'+(item.division||'â€”')+' Â· Ver estadÃ­sticas</b></button>').join(''):'<div class="muted">TodavÃ­a no hay equipos registrados en tu historial.</div>'}
    document.querySelector('.comment-box')?.closest('.profile-panel')?.classList.add('comments-panel');
    const comments=await profileCommentsFor(session.username),list=document.querySelector('.comment-list');if(list){const visible=comments.filter(item=>!item.hidden||item.author===session.username);list.innerHTML=visible.length?visible.map(item=>{const reactions=item.reactions||{};const liked=Array.isArray(reactions.like)&&reactions.like.includes(session.username);return '<div class="comment-item '+(item.hidden?'comment-hidden':'')+'"><div class="comment-author"><img class="comment-avatar" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(item.author)+'&size=s&direction=2&head_direction=2&gesture=sml&action=std" alt="Keko de '+item.author+'"><strong>'+item.author+'</strong></div><p>'+(item.hidden?'Comentario oculto':item.text)+'</p><div class="comment-actions-row">'+(!item.hidden?'<button type="button" data-comment-react="'+item.id+'">'+(liked?'â™¥':'â™¡')+' '+((reactions.like||[]).length)+'</button>':'')+((item.author===session.username||session.role==='admin')?'<button type="button" data-comment-hide="'+item.id+'">'+(item.hidden?'Mostrar':'Ocultar')+'</button><button type="button" data-comment-delete="'+item.id+'">Eliminar</button>':'')+'</div></div>'}).join(''):'<div class="muted">Sin comentarios registrados.</div>'}
    renderProfileComments(comments,list);
    const commentPanel=document.querySelector('.comment-box')?.closest('.profile-panel');
    if(commentPanel&&!commentPanel.querySelector('.comment-composer')){
      const box=document.querySelector('.comment-box'),actions=commentPanel.querySelector('.comment-actions'),composer=document.createElement('div'),avatar=document.createElement('img'),main=document.createElement('div'),meta=document.createElement('div'),counter=document.createElement('span');
      composer.className='comment-composer';avatar.className='comment-composer-avatar';avatar.src='https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(session.username)+'&size=s&direction=2&head_direction=2&gesture=sml&action=std';avatar.alt='Keko de '+session.username;main.className='comment-composer-main';meta.className='comment-composer-meta';counter.textContent='0/1000';box.maxLength=1000;box.placeholder='Escribe un comentario sobre '+session.username+'...';actions.querySelector('button').textContent='Publicar';actions.querySelector('button').classList.add('comment-submit');meta.append(counter,actions);main.append(box,meta);composer.append(avatar,main);commentPanel.insertBefore(composer,commentPanel.querySelector('.comment-list'));box.addEventListener('input',()=>counter.textContent=box.value.length+'/1000');
    }
  }
  function prepareAccountForm(){
    if(view!=='cuenta'||session||authMode!=='register')return;
    if(document.getElementById('authPosition'))return;
    const position=document.createElement('input');position.type='hidden';position.id='authPosition';position.value='[]';
    const picker=document.createElement('div');picker.className='position-picker';picker.innerHTML=['MED','NEUTRO','BANDA','GK'].map(item=>'<button class="position-option" type="button" data-position="'+item+'">'+item+'</button>').join('');
    picker.addEventListener('click',event=>{const button=event.target.closest('[data-position]');if(!button)return;const selected=JSON.parse(position.value||'[]'),index=selected.indexOf(button.dataset.position);if(index===-1)selected.push(button.dataset.position);else selected.splice(index,1);position.value=JSON.stringify(selected);button.classList.toggle('active',index===-1)});
    document.getElementById('authSubmit')?.before(picker);document.getElementById('authSubmit')?.before(position);
  }
  function prepareAdminDivisions(){const positionSelect=document.getElementById('lineupPos');if(positionSelect)positionSelect.innerHTML='<option value="GK">GK</option><option value="BANDA">Banda</option><option value="MED">MED</option><option value="DEL">DEL</option>'}
  function communityRecordImage(url, alt){
    return url ? '<img class="community-record-image" src="'+profileText(url)+'" alt="'+profileText(alt)+'">' : '';
  }
  function comunidad(){
    const params=new URLSearchParams(location.search),sub=params.get('sub')||'palmares';
    if(sub==='palmares'){
      const palmares = state.palmares.map(item => '<article class="community-record">'+communityRecordImage(item.image,item.title)+'<div class="community-record-copy"><span class="community-pill">PalmarÃ©s Â· '+profileText(item.category)+'</span><h3>'+profileText(item.title)+'</h3><p>'+profileText(item.description||((item.team||'')+(item.player?' Â· '+item.player:'')))+'</p></div></article>').join('') || state.matches.filter(item => item.finished).slice(0,6).map(item => {
        const a = matchTeam(item,'A'), b = matchTeam(item,'B');
        return '<article class="community-news-item"><span class="community-pill">PalmarÃ©s</span><h3>' + (a?.name || item.home || 'Local') + ' vs ' + (b?.name || item.away || 'Visitante') + '</h3><p>' + ((item.scoreA ?? 0) + ' - ' + (item.scoreB ?? 0)) + '</p></article>';
      }).join('') || '<div class="empty">TodavÃ­a no hay partidos finalizados para mostrar palmarÃ©s.</div>';
      return '<div class="community-shell"><div class="community-grid"><div class="content-card"><div class="admin-title">PALMARÃ‰S</div>'+palmares+'</div></div></div>';
    }
    if(sub==='noticias'){
      const noticias = state.news.map(item => '<article class="community-record">'+communityRecordImage(item.image,item.title)+'<div class="community-record-copy"><span class="community-pill">Noticias</span><h3>'+profileText(item.title)+'</h3><p>'+profileText(item.description)+'</p></div></article>').join('') || '<div class="empty">TodavÃ­a no hay noticias publicadas.</div>';
      return '<div class="community-shell"><div class="community-grid"><div class="content-card"><div class="admin-title">NOTICIAS</div>'+noticias+'</div></div></div>';
    }
    if(sub==='equipos'){return '<div class="community-shell">'+teams()+'</div>'}
    if(sub==='jugadores'){return '<div class="community-shell">'+playersSection()+'</div>'}
    return '<div class="community-shell"><div class="community-grid"><div class="content-card"><div class="admin-title">MENÃš DE COMUNIDAD</div><div class="community-link-row"><a class="community-link-card" href="seccion.html?view=comunidad&sub=palmares">ðŸ† PalmarÃ©s</a><a class="community-link-card" href="seccion.html?view=comunidad&sub=noticias">ðŸ“° Noticias</a><a class="community-link-card" href="seccion.html?view=comunidad&sub=equipos">âš½ Equipos</a><a class="community-link-card" href="seccion.html?view=comunidad&sub=jugadores">ðŸ‘¥ Jugadores</a></div></div></div></div>';
  }
  function album(){return '<div class="panel-grid"><div class="panel-card"><div class="panel-label">Cromos conseguidos</div><div class="metric">0 / 0</div></div><div class="panel-card"><div class="panel-label">Jugadores disponibles</div><div class="metric">0</div></div><div class="panel-card"><div class="panel-label">Progreso</div><div class="metric">0%</div></div></div><div class="notice" style="margin-top:18px">Los cromos aparecerÃ¡n aquÃ­ cuando un Ã¡rbitro registre alineaciones en las actas de los partidos.</div>'}
  function profile(){
    const account=accounts.find(item=>item.username===session.username)||{};
    const userTeam=state.teams.find(item=>(item.players||[]).some(player=>player.toLowerCase()===session.username.toLowerCase()));
    const countryEntry=countryOptions.find(([code])=>code===account.country) || [];
    const countryLabel = countryEntry.length ? countryEntry[1] + ' ' + countryEntry[2] : 'PaÃ­s no registrado';
    const pendingOffers=state.offers.filter(offer=>offer.player.toLowerCase()===session.username.toLowerCase()&&offer.status==='pendiente');
    const avatarUrl='https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(session.username)+'&size=m&direction=2&head_direction=2&gesture=sml&action=std';
    const positions=Array.isArray(account.position)?account.position:[account.position].filter(Boolean);
    const enabledDivisions=Array.isArray(account.enabledDivisions)?account.enabledDivisions:(account.division?[String(account.division)]:[]);
    const profilePositions=positions.length?positions.join(' Â· '):'Sin registrar';
    const profileDivisions=enabledDivisions.length?enabledDivisions.map(item=>String(item)+'D').join(', '):'Ninguna';
    const offers='<div class="content-card mailbox-panel"><div class="mailbox-title"><span>ðŸ“œ</span> BUZÃ“N</div>'+(pendingOffers.length?pendingOffers.map(offer=>{const offerTeam=team(offer.teamId),currentAccount=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(session.username));return '<div class="contract-offer-row"><img class="contract-offer-avatar" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(session.username)+'&size=m&direction=2&head_direction=2&gesture=sml&action=std" alt="Keko de '+session.username+'"><div class="contract-offer-copy"><div class="contract-offer-title">ðŸ“„ Contrato Â· '+(offerTeam?.name||'equipo')+'</div><div class="contract-offer-terms">'+offer.terms+' Â· '+(Array.isArray(currentAccount?.position)?currentAccount.position.join(' Â· '):(currentAccount?.position||'PosiciÃ³n sin registrar'))+'</div></div><button class="btn btn-primary contract-offer-button" data-open-contract="'+offer.id+'">Ver contrato</button></div>'}).join(''):'<div class="muted" style="margin-top:12px">No tienes contratos pendientes.</div>')+'</div><button class="free-agent-block" type="button" data-free-agent><span><strong>AGENTE LIBRE</strong><small>Ver tu estado y tus contratos disponibles</small></span><b>â†’</b></button>';
    const roleLabel=account.role==='admin'?'Administrador':account.role==='arbitro'?'Ãrbitro':'Registrado';
    const profileStats=[
      {label:'Goles',value:'â€”',highlight:true},
      {label:'Asistencias',value:'â€”'},
      {label:'MVPs',value:'â€”'},
      {label:'Partidos',value:'â€”'}
    ];
    const profileTabs=['estadisticas','analisis','historial','premios','galardones','cartas','comentarios'].map((item,index)=>'<button class="profile-tab '+(index===0?'active':'')+'" type="button" data-profile-tab="'+item+'">'+({'estadisticas':'EstadÃ­sticas','analisis':'AnÃ¡lisis','historial':'Historial','premios':'Premios','galardones':'Galardones','cartas':'Cartas','comentarios':'Comentarios'}[item])+'</button>').join('');
    const statBlocks=['Goles','Asistencias','MVPs','Pases clave','PuntuaciÃ³n','Rendimiento'].map((item,index)=>'<div class="profile-mini-metric"><strong>'+(index===0||index===3?'â€”':'â€”')+'</strong><span>'+item+'</span></div>').join('');
    const historyItems=['Temporada','DivisiÃ³n','Ãšltimo partido','Racha'].map(item=>'<div class="history-item"><span>'+item+'</span><b>â€”</b></div>').join('');
    const badgeItems=['Liga','Eficiencia','Defensa','Pichichi'].map(item=>'<span class="badge-item">'+item+'</span>').join('');
    const cardItems=['Carta 01','Carta 02','Carta 03','Carta 04'].map((item,index)=>'<div class="card-item">'+item+'<small>'+(index%2?'Rare':'Normal')+'</small></div>').join('');
    const profileCountry = countryLabel + (userTeam ? ' Â· '+userTeam.name : '');
    return '<div class="profile-shell"><div class="profile-header-card"><div class="profile-avatar-wrap"><img class="profile-avatar" src="'+avatarUrl+'" alt="Keko de '+session.username+'"></div><div class="profile-header-copy"><div class="profile-name">'+session.username+'</div><div class="profile-country">'+profileCountry+'</div><div class="profile-meta-list"><div class="profile-meta-item" data-kind="positions"><span>Mis posiciones</span><strong>'+profilePositions+'</strong></div><div class="profile-meta-item" data-kind="divisions"><span>Divisiones habilitadas</span><strong>'+profileDivisions+'</strong></div></div><div class="profile-subtitle">Perfil</div></div><div class="profile-header-right"><div class="profile-total-score">â€”</div><div class="profile-chip-row"><span class="profile-chip">â€”</span><span class="profile-chip">â€”</span><span class="profile-chip">â€”</span><span class="profile-chip">â€”</span></div></div></div><div class="profile-tabs">'+profileTabs+'</div><div class="profile-layout"><div class="profile-main-column"><div class="profile-metrics">'+profileStats.map((item)=>'<div class="profile-metric-card '+(item.highlight?'highlight':'')+'"><strong>'+item.value+'</strong><span>'+item.label+'</span></div>').join('')+'</div><div class="profile-panel"><div class="profile-panel-head"><span>EstadÃ­sticas</span><button type="button">Ver todo</button></div><div class="profile-panel-grid">'+statBlocks+'</div></div><div class="profile-panel"><div class="profile-panel-head"><span>AnÃ¡lisis</span></div><div class="profile-analysis"><div class="analysis-line"><span>Rendimiento</span><b>â€”</b></div><div class="analysis-line"><span>PresiÃ³n</span><b>â€”</b></div><div class="analysis-line"><span>ParticipaciÃ³n</span><b>â€”</b></div></div></div><div class="profile-panel"><div class="profile-panel-head"><span>Historial</span></div><div class="profile-history">'+historyItems+'</div></div></div><div class="profile-side-column"><div class="profile-panel"><div class="profile-panel-head"><span>Premios</span></div><div class="badge-row">'+badgeItems+'</div></div><div class="profile-panel"><div class="profile-panel-head"><span>Galardones</span></div><div class="badge-row">'+badgeItems+'</div></div><div class="profile-panel"><div class="profile-panel-head"><span>Cartas</span></div><div class="profile-cards-grid">'+cardItems+'</div></div><div class="profile-panel"><div class="profile-panel-head"><span>Comentarios</span></div><textarea class="comment-box" placeholder="Escribe un comentario..."></textarea><div class="comment-actions"><button class="btn btn-primary" type="button">Enviar</button></div><div class="comment-list"><div class="comment-item"><strong>Entrenador</strong><p>Sin comentarios registrados.</p></div></div></div></div></div><div class="profile-summary"><div class="profile-summary-row"><div><span>Rol</span><b>'+roleLabel+'</b></div><div><span>Equipo</span><b>'+(userTeam?userTeam.name:'Sin equipo')+'</b></div><div><span>DivisiÃ³n</span><b>'+(userTeam?userTeam.division||'â€”':'â€”')+'</b></div><div><span>Partidos</span><b>'+(state.matches.length||'â€”')+'</b></div></div></div><div class="profile-activity"><div class="profile-activity-head"><span>Ãšltimo registro</span><span class="profile-activity-tag">â€”</span></div><div class="profile-activity-item"><img class="profile-mini-avatar" src="'+avatarUrl+'" alt=""><div class="profile-activity-copy"><div class="profile-activity-user">'+session.username+'</div><div class="profile-activity-time">Sin registro</div></div><span class="profile-activity-tag">â€”</span></div></div></div>'+offers;
  }
  function account(){
    if(session)return '<div class="account-layout"><div>'+profile()+'</div><div class="account-copy">Este es tu perfil de la asociaciÃ³n. Tu keko se carga desde el servicio pÃºblico de imÃ¡genes de Habbo.es y tus estadÃ­sticas muestran los datos disponibles en esta instalaciÃ³n.</div></div>';
    const register=authMode==='register';
    const countryMenu=register?'<div class="country-picker-wrap"><button class="btn btn-ghost" id="countryToggle" type="button">ðŸŒ PaÃ­s</button><div class="country-menu" id="countryMenu">'+countryOptions.map(([code,emoji,label])=>'<button type="button" class="country-option" data-country-code="'+code+'" data-country-label="'+label+'" data-country-emoji="'+emoji+'">'+emoji+' '+label+'</button>').join('')+'</div><input type="hidden" id="authCountry" value=""><div class="country-selected" id="countrySelected">Sin paÃ­s seleccionado</div></div>':'<div class="country-selected muted">Selecciona un paÃ­s al crear la cuenta.</div>';
    return '<div class="account-layout"><div class="content-card"><div class="tabs"><button class="tab-btn '+(!register?'active':'')+'" data-auth-mode="login">Iniciar sesiÃ³n</button><button class="tab-btn '+(register?'active':'')+'" data-auth-mode="register">Crear cuenta</button></div><div class="form"><input class="input" id="authUsername" autocomplete="username" placeholder="Nombre de usuario de Habbo.es"><input class="input" id="authPassword" autocomplete="new-password" type="password" placeholder="ContraseÃ±a">'+(register?'<input class="input" id="authPasswordConfirm" autocomplete="new-password" type="password" placeholder="Repite la contraseÃ±a">'+countryMenu:'')+'<button class="btn btn-primary" id="authSubmit">'+(register?'Crear cuenta':'Entrar')+'</button><div class="form-hint" id="authHint"></div></div><p class="account-note">Usa exactamente tu nombre de Habbo.es, sin espacios. Esta versiÃ³n valida y guarda la cuenta en la web; la verificaciÃ³n oficial de Habbo.es necesita una API o servidor autorizado.</p></div><div class="account-copy">'+(register?'Registra tu nombre de Habbo.es para crear tu cuenta de la asociaciÃ³n.':'Inicia sesiÃ³n con el nombre y la contraseÃ±a de tu cuenta de la asociaciÃ³n.')+' Los permisos de administrador y Ã¡rbitro se gestionan desde el panel privado.</div></div>';
  }
  function mailboxPage(){
    if(!session)return '<div class="notice">Inicia sesiÃ³n para consultar tu buzÃ³n de contratos.</div>';
    const pendingOffers=state.offers.filter(offer=>offer.player.toLowerCase()===session.username.toLowerCase()&&offer.status==='pendiente'),currentAccount=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(session.username));
    const rows=pendingOffers.length?pendingOffers.map(offer=>{const offerTeam=team(offer.teamId);return '<div class="contract-offer-row"><img class="contract-offer-avatar" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(session.username)+'&size=m&direction=2&head_direction=2&gesture=sml&action=std" alt="Keko de '+session.username+'"><div class="contract-offer-copy"><div class="contract-offer-title">ðŸ“„ Contrato Â· '+profileText(offerTeam?.name||'Equipo')+'</div><div class="contract-offer-terms">'+profileText(offer.message||offer.terms||'Oferta de contrato')+' Â· '+(Array.isArray(currentAccount?.position)?currentAccount.position.join(' Â· '):(currentAccount?.position||'PosiciÃ³n sin registrar'))+'</div></div><button class="btn btn-primary contract-offer-button" data-open-contract="'+offer.id+'">Ver contrato</button></div>'}).join(''):'<div class="muted" style="margin-top:12px">No tienes contratos pendientes.</div>';
    return '<div class="mailbox-page"><div class="content-card mailbox-panel mailbox-visible"><div class="mailbox-title"><span>ðŸ“œ</span> BUZÃ“N</div>'+rows+'</div><button class="free-agent-block mailbox-visible" type="button" data-free-agent><span><strong>AGENTE LIBRE</strong><small>Consulta tu estado y tus contratos disponibles</small></span><b>â†’</b></button></div>';
  }
  let selectedActaMatchId=null;
  let actaTab='goals';
  let matchDivision='1';
  let adminRound=1;
  function teamBelongsToDivision(item,division){
    const values=[item?.division,item?.divisionId,item?.div,item?.category].filter(value=>value!==undefined&&value!==null).map(value=>String(value).trim().toUpperCase());
    const target=String(division).trim().toUpperCase();
    return values.some(value=>value===target||value===`D${target}`||value===`DIVISION ${target}`||value===`DIVISIÃ“N ${target}`);
  }
  function teamsForMatchDivision(division){
    return state.teams.filter(item=>teamBelongsToDivision(item,division));
  }
  function actaPlayers(match){
    const validPlayers=matchRegisteredPlayerNames(match);
    const players=[...(matchTeam(match,'A')?.players||[]),...(matchTeam(match,'B')?.players||[])].map(playerName).filter(Boolean);
    const unique=[...new Map(players.filter(player=>validPlayers.has(player.toLowerCase())).map(player=>[player.toLowerCase(),player])).values()];
    const positionRank={GK:0,BANDA:1,MED:2};
    const positionOf=player=>{
      const account=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(player));
      const positions=(Array.isArray(account?.position)?account.position:[account?.position].filter(Boolean)).map(normalizeActaPosition);
      return positions.sort((a,b)=>(positionRank[a]??99)-(positionRank[b]??99))[0]||'MED';
    };
    return unique.sort((a,b)=>(positionRank[positionOf(a)]??99)-(positionRank[positionOf(b)]??99)||a.localeCompare(b,'es'));
  }
  function actaPlayerOptions(match){
    const players=actaPlayers(match);
    return players.length?players.map(player=>'<option value="'+player+'">'+player+'</option>').join(''):'<option value="">No hay jugadores registrados</option>';
  }
  function closeActaPlayerMenu(){document.querySelector('.acta-player-menu-backdrop')?.remove()}
  function normalizeActaPosition(value){
    const position=String(value||'').trim().toUpperCase();
    if(['GK','POR','PORTERO','ARQUERO'].includes(position))return 'GK';
    if(['BANDA','DEF','DEFENSA','EXTREMO','EXTREMO/BANDA','DEL','DELANTERO'].includes(position))return 'BANDA';
    if(['MED','MEDIO','CENTROCAMPISTA','NEUTRO'].includes(position))return 'MED';
    return position||'MED';
  }
  function openActaPlayerMenu(player,side){
    if(!session||!['admin','arbitro'].includes(session.role))return;
    closeActaPlayerMenu();
    const backdrop=document.createElement('div');backdrop.className='acta-player-menu-backdrop';backdrop.innerHTML='<div class="acta-player-menu" role="dialog" aria-modal="true"><h3>'+player+'</h3><p>Selecciona una acciÃ³n para aÃ±adirla al acta.</p><div class="acta-player-menu-actions"><button type="button" data-player-action="goal">âš½ Gol</button><button type="button" data-player-action="card">ðŸŸ¨ Tarjeta</button><button type="button" data-player-action="assist">ðŸ…° Asistencia</button><button type="button" data-player-action="sub">â†” Cambio</button><button type="button" data-player-action="mvp">ðŸ† MVP</button><button type="button" data-player-action="mention">â­ MenciÃ³n</button></div><button class="close-player-menu" type="button" data-close-player-menu>Cerrar</button></div>';
    backdrop.dataset.player=player;backdrop.dataset.side=side;document.body.appendChild(backdrop);
  }
  function renderPlayerActionStep(menu,action){
    const player=menu.dataset.player,match=state.matches.find(item=>item.id===selectedActaMatchId),players=match?actaPlayers(match):[],otherPlayers=players.filter(item=>item.toLowerCase()!==player.toLowerCase());
    let body='';
    if(action==='goal')body='<p>Indica el minuto y, si existe, quiÃ©n dio la asistencia.</p><input class="input" id="playerActionMinute" type="number" min="0" placeholder="Minuto del gol"><select class="input" id="playerActionAssist"><option value="">Sin asistencia</option>'+otherPlayers.map(item=>'<option value="'+item+'">'+item+'</option>').join('')+'</select><button class="btn btn-primary" data-confirm-player-action="goal">Guardar gol</button>';
    if(action==='card')body='<p>Selecciona el tipo de tarjeta y el minuto.</p><select class="input" id="playerActionCardType"><option value="amarilla">Amarilla</option><option value="roja">Roja</option></select><input class="input" id="playerActionMinute" type="number" min="0" placeholder="Minuto (opcional)"><button class="btn btn-primary" data-confirm-player-action="card">Guardar tarjeta</button>';
    if(action==='assist')body='<p>Selecciona el jugador que marcÃ³ el gol.</p><select class="input" id="playerActionScorer"><option value="">Selecciona jugador</option>'+otherPlayers.map(item=>'<option value="'+item+'">'+item+'</option>').join('')+'</select><input class="input" id="playerActionMinute" type="number" min="0" placeholder="Minuto de la jugada"><button class="btn btn-primary" data-confirm-player-action="assist">Guardar asistencia</button>';
    if(action==='sub')body='<p>Selecciona el jugador que entra al campo.</p><div class="acta-sub-player-list">'+otherPlayers.map(item=>'<button type="button" data-sub-entering="'+item+'">'+item+'</button>').join('')+'</div><button class="btn btn-primary" data-confirm-player-action="sub">Guardar cambio</button>';
    if(action==='mvp')body='<p>Â¿Confirmar a '+player+' como MVP del partido?</p><button class="btn btn-primary" data-confirm-player-action="mvp">Confirmar MVP</button>';
    if(action==='mention')body='<p>Â¿AÃ±adir a '+player+' entre las menciones del partido?</p><button class="btn btn-primary" data-confirm-player-action="mention">Confirmar menciÃ³n</button>';
    menu.querySelector('.acta-player-menu').innerHTML='<h3>'+player+'</h3>'+body+'<button class="close-player-menu" type="button" data-back-player-menu>Volver</button>';
  }
  function actaField(match){
    const teamA=matchTeam(match,'A'),teamB=matchTeam(match,'B');
    const lineupA=(match?.lineupA||[]).slice(0,4),lineupB=(match?.lineupB||[]).slice(0,4);
    const normalizePosition=normalizeActaPosition;
    const registeredPositions=name=>{const account=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(name));return (Array.isArray(account?.position)?account.position:[account?.position].filter(Boolean)).map(normalizePosition)};
    const playerPosition=item=>{const saved=normalizePosition(item.pos),registered=registeredPositions(playerName(item));return registered.includes(saved)?saved:(registered[0]||saved)};
    const playerMarkup=(player,side)=>{const name=playerName(player),position=playerPosition(player),tone=position==='BANDA'?'position-band':position==='MED'?'position-med':position==='GK'?'position-gk':'position-del';return '<button class="acta-field-player '+(side==='A'?'field-home':'field-away')+' '+tone+'" type="button" draggable="'+(canDrag?'true':'false')+'" data-drag-player="'+encodeURIComponent(name)+'" data-drag-side="'+side+'" data-acta-player="'+encodeURIComponent(name)+'" data-acta-side="'+side+'" data-acta-match="'+(match?.id||'')+'" title="Arrastra para cambiar a otra posiciÃ³n registrada"><img src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(name)+'&size=m&headonly=1&direction=2&head_direction=2&gesture=sml&action=std" alt="Cara de '+name+'"><span>'+name+'</span><small>'+position+'</small></button>'};
    const playersAt=(lineup,position)=>lineup.filter(item=>playerPosition(item)===position).sort((a,b)=>(Number(a.slot)||0)-(Number(b.slot)||0));
    const canDrag=session&&['admin','arbitro'].includes(session.role);
    const slot=(lineup,position,side,className,index=0)=>{const player=playersAt(lineup,position)[index];return '<div class="acta-slot '+className+'" data-drop-player-side="'+side+'" data-drop-position="'+position+'" data-drop-index="'+index+'" data-acta-match="'+(match?.id||'')+'">'+(player?playerMarkup(player,side):'<span class="field-empty">+</span>')+'</div>'};
    const lineup=(lineupData,side)=>'<div class="acta-team-lineup '+(side==='A'?'acta-team-home':'acta-team-away')+'">'+slot(lineupData,'GK',side,'slot-gk')+slot(lineupData,'BANDA',side,'slot-band-left',0)+slot(lineupData,'BANDA',side,'slot-band-right',1)+slot(lineupData,'MED',side,'slot-med',0)+'</div>';
    const roster=(teamRecord,side,lineupData)=>{const players=[...(teamRecord?.players||[])].map(playerName).filter(Boolean),positionRank={GK:0,BANDA:1,MED:2},positionOf=name=>{const account=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(name));const positions=(Array.isArray(account?.position)?account.position:[account?.position].filter(Boolean)).map(normalizeActaPosition);return positions.sort((a,b)=>(positionRank[a]??99)-(positionRank[b]??99))[0]||'MED'},orderedPlayers=players.sort((a,b)=>(positionRank[positionOf(a)]??99)-(positionRank[positionOf(b)]??99)||a.localeCompare(b,'es'));return '<div class="acta-roster-pool '+(side==='A'?'roster-home':'roster-away')+'"><strong>'+(teamRecord?.name||(side==='A'?'Local':'Visitante'))+'</strong><div class="acta-roster-players">'+(orderedPlayers.length?orderedPlayers.map(name=>{const position=positionOf(name);return '<div class="acta-roster-player '+(lineupData.some(item=>toPlayerKey(playerName(item))===toPlayerKey(name))?'is-starting':'')+'" draggable="'+(canDrag?'true':'false')+'" data-drag-player="'+encodeURIComponent(name)+'" data-drag-side="'+side+'" data-acta-roster-player="'+encodeURIComponent(name)+'" data-acta-roster-side="'+side+'" title="Pulsa para aÃ±adir una acciÃ³n al acta"><img src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(name)+'&size=m&headonly=1&direction=2&head_direction=2&gesture=sml&action=std"><span>'+name+'</span><b class="acta-roster-position">'+position+'</b>'+(canDrag?'<button type="button" class="place-player-btn" data-select-lineup-player="'+encodeURIComponent(name)+'" data-select-lineup-side="'+side+'">Colocar</button>':'')+'</div>'}).join(''):'<span class="muted">Sin jugadores</span>')+'</div></div>'};
    return '<div class="acta-lineup-board" data-acta-match="'+(match?.id||'')+'">'+roster(teamA,'A',lineupA)+roster(teamB,'B',lineupB)+'<div class="acta-field"><span class="acta-field-corner acta-field-corner-home">'+((teamA&&teamA.name)||'Local')+'</span><span class="acta-field-corner acta-field-corner-away">'+((teamB&&teamB.name)||'Visitante')+'</span><div class="acta-field-line"></div><div class="acta-pitch-rows">'+lineup(lineupA,'A')+lineup(lineupB,'B')+'</div></div></div>';
  }
  function matchChronicle(match){
    const events=[];
    (match?.goals||[]).forEach(item=>{
      events.push({minute:Number(item.minute)||0,side:item.side,text:item.player,type:item.ownGoal?'Gol en propia':'Gol',icon:'âš½',tone:item.ownGoal?'own':'goal'});
      if(item.assist)events.push({minute:Number(item.minute)||0,side:item.side,text:item.assist,type:'Asistencia',icon:'ðŸ…°',tone:'assist'});
    });
    (match?.cards||[]).forEach(item=>events.push({minute:Number(item.minute)||0,side:item.side,text:item.player,type:item.type==='roja'?'Tarjeta roja':'Tarjeta amarilla',icon:item.type==='roja'?'ðŸŸ¥':'ðŸŸ¨',tone:item.type==='roja'?'red':'yellow'}));
    (match?.subs||[]).forEach(item=>events.push({minute:Number(item.minute)||0,side:item.side,text:(item.out||'')+' â†’ '+(item.in||''),type:'Cambio',icon:'â†”',tone:'sub'}));
    const teamA=matchTeam(match,'A'),teamB=matchTeam(match,'B');
    const header='<div class="chronicle-teams"><span>'+((teamA&&teamA.name)||'Local')+'</span><span>'+((teamB&&teamB.name)||'Visitante')+'</span></div>';
    const rows=events.sort((a,b)=>a.minute-b.minute).map(item=>{
      const event='<div class="chronicle-event"><div class="chronicle-event-copy"><b>'+item.text+'</b><small>'+item.type+'</small></div><span class="event-icon '+item.tone+'">'+item.icon+'</span></div>';
      return `<div class="match-event"><div class="chronicle-side-left">${item.side==='A'?event:''}</div><span class="event-minute">${item.minute}'</span><div class="chronicle-side-right">${item.side==='B'?event:''}</div></div>`;
    }).join('');
    return header+(rows||'<div class="muted">Sin eventos registrados.</div>');
  }
  function matchAwards(match){
    const awards=[];
    if(match?.mvp)awards.push('<div class="match-award mvp"><b>MVP</b><span>'+match.mvp+'</span></div>');
    (match?.mentions||[]).forEach(name=>awards.push('<div class="match-award"><b>â˜…</b><span>'+name+'</span></div>'));
    return awards.join('')||'<div class="muted">Sin premios registrados.</div>';
  }
  function actaMenu(match){
    const goals=match?.goals||[],cards=match?.cards||[],mentions=match?.mentions||[],subs=match?.subs||[],players=actaPlayers(match);
    const playerManager=players.length?'':'<div class="admin-list">Este partido todavÃ­a no tiene jugadores registrados en las plantillas de sus equipos.</div>';
    const playerOptions=actaPlayerOptions(match);
    const content=actaTab==='goals'?'<select class="input" id="goalPlayer">'+playerOptions+'</select><select class="input" id="goalAssist"><option value="">Sin asistencia</option>'+playerOptions+'</select><input class="input" id="goalMinute" type="number" min="0" placeholder="Minuto del gol"><select class="input" id="goalSide"><option value="A">Local</option><option value="B">Visitante</option></select><button class="btn btn-primary" id="addGoal">AÃ±adir gol</button><div class="admin-list">'+(goals.length?goals.map(goal=>goal.minute+"' Â· "+goal.player+(goal.assist?' Â· Asistencia: '+goal.assist:'')+' Â· '+(goal.side==='B'?'Visitante':'Local')).join('<br>'):'TodavÃ­a no hay goles registrados.')+'</div>':actaTab==='cards'?'<select class="input" id="cardPlayer">'+playerOptions+'</select><select class="input" id="cardType"><option value="amarilla">Amarilla</option><option value="roja">Roja</option></select><input class="input" id="cardMinute" type="number" min="0" placeholder="Minuto (opcional)"><select class="input" id="cardSide"><option value="A">Local</option><option value="B">Visitante</option></select><button class="btn btn-primary" id="addCard">AÃ±adir tarjeta</button><div class="admin-list">'+(cards.length?cards.map(card=>(card.minute?card.minute+"' Â· ":'')+card.player+' Â· '+card.type).join('<br>'):'TodavÃ­a no hay tarjetas registradas.')+'</div>':actaTab==='subs'?'<input class="input" id="subMinute" type="number" min="0" placeholder="Minuto"><select class="input" id="subSide"><option value="A">Local</option><option value="B">Visitante</option></select><select class="input" id="subOut">'+playerOptions+'</select><select class="input" id="subIn">'+playerOptions+'</select><button class="btn btn-primary" id="addSub">AÃ±adir cambio</button><div class="admin-list">'+(subs.length?subs.map(sub=>sub.minute+"' Â· "+sub.out+' â†’ '+sub.in).join('<br>'):'TodavÃ­a no hay cambios registrados.')+'</div>':actaTab==='lineup'?'<select class="input" id="lineupPlayer">'+playerOptions+'</select><select class="input" id="lineupSide"><option value="A">Local</option><option value="B">Visitante</option></select><select class="input" id="lineupPos"><option value="GK">GK</option><option value="BANDA">Banda</option><option value="MED">Medio</option></select><button class="btn btn-primary" id="addLineup">AÃ±adir al campo</button><div class="admin-list">La alineaciÃ³n se muestra en el campo y solo admite jugadores de las plantillas.</div>': '<select class="input" id="mentionPlayer">'+playerOptions+'</select><button class="btn btn-primary" id="addMention">AÃ±adir menciÃ³n especial</button><div class="admin-list">'+(mentions.length?mentions.join('<br>'):'TodavÃ­a no hay menciones especiales.')+'</div>';
    return '<div class="tabs"><button class="tab-btn '+(actaTab==='goals'?'active':'')+'" data-acta-tab="goals">Goles</button><button class="tab-btn '+(actaTab==='cards'?'active':'')+'" data-acta-tab="cards">Tarjetas</button><button class="tab-btn '+(actaTab==='subs'?'active':'')+'" data-acta-tab="subs">Cambios</button><button class="tab-btn '+(actaTab==='lineup'?'active':'')+'" data-acta-tab="lineup">AlineaciÃ³n</button><button class="tab-btn '+(actaTab==='mentions'?'active':'')+'" data-acta-tab="mentions">Premios</button></div><div class="content-card">'+playerManager+content+(actaTab==='lineup'?'<div class="admin-list">MÃ¡ximo 4 jugadores por equipo: 1 GK, 2 BANDA y 1 MED.</div>':'')+actaField(match)+'</div>';
  }
  function dragMatchUI(){
    const teams=teamsForMatchDivision(matchDivision).map(item=>'<div class="drag-team" draggable="true" data-drag-team="'+item.id+'" data-team-name="'+item.name+'">'+(item.crest?'<img src="'+item.crest+'" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;margin-right:5px">':'')+item.name+'</div>').join('');
    const rounds=[...new Set(state.matches.filter(item=>String(item.division||'')===matchDivision).map(item=>Number(item.round)||1).concat([adminRound]))].sort((a,b)=>a-b);
    return '<div class="round-toolbar"><label class="muted">DivisiÃ³n</label><select class="input" id="matchDivision" style="max-width:170px"><option value="1" '+(matchDivision==='1'?'selected':'')+'>DivisiÃ³n 1</option><option value="2" '+(matchDivision==='2'?'selected':'')+'>DivisiÃ³n 2</option><option value="3" '+(matchDivision==='3'?'selected':'')+'>DivisiÃ³n 3</option><option value="4" '+(matchDivision==='4'?'selected':'')+'>DivisiÃ³n 4</option></select><button class="btn btn-ghost btn-sm" type="button" data-new-round>NUEVA JORNADA</button><button class="btn btn-primary btn-sm" type="button" data-generate-round>GENERAR JORNADAS</button></div><div class="round-toolbar">'+rounds.map(round=>'<button type="button" class="round-chip '+(Number(adminRound)===round?'active':'')+'" data-round-choice="'+round+'">J'+round+'</button>').join('')+'</div><div class="fixture-builder"><div class="fixture-builder-teams"><h4>Equipos de la divisiÃ³n '+matchDivision+' Â· arrastra a una zona</h4><div class="drag-pool">'+(teams||'<span class="empty">No hay equipos en esta divisiÃ³n. Crea o asigna al menos dos equipos antes de generar jornadas.</span>')+'</div></div><div class="fixture-builder-round"><h4>Jornada '+adminRound+'</h4><div class="fixture-drop-grid"><div class="drop-slot" data-drop-slot="home"><strong>Local</strong><span id="homeDropLabel">Suelta aquÃ­ el equipo local</span></div><span class="muted">VS</span><div class="drop-slot" data-drop-slot="away"><strong>Visitante</strong><span id="awayDropLabel">Suelta aquÃ­ el equipo visitante</span></div></div><div class="fixture-builder-fields"><input class="input" id="matchDate" type="date" aria-label="Fecha"><input class="input" id="matchTime" type="time" aria-label="Hora"><button class="btn btn-primary" id="createMatch" type="button">AÃ‘ADIR PARTIDO</button></div><input type="hidden" id="matchHome"><input type="hidden" id="matchAway"></div></div>';
  }
  function userManagement(){const roleName=role=>role==='admin'?'Administrador':role==='arbitro'?'Ãrbitro':role==='dueno'?'DueÃ±o de equipo':'Sin rol';const rows=accounts.length?accounts.map(account=>{const assigned=String(account.division||''),enabled=Array.isArray(account.enabledDivisions)?account.enabledDivisions:(assigned?[assigned]:[]);return '<div class="admin-player-row" data-admin-player="'+account.username.toLowerCase()+'"><div class="admin-player-head"><div><div class="match-name">'+account.username+'</div><div class="muted">Rol actual: '+roleName(account.role)+'</div></div><button class="btn btn-primary" data-save-user-role="'+account.username+'">Guardar cambios</button></div><select class="input admin-player-role" data-user-role="'+account.username+'"><option value="pendiente" '+(account.role==='pendiente'?'selected':'')+'>Sin rol</option><option value="arbitro" '+(account.role==='arbitro'?'selected':'')+'>Ãrbitro</option><option value="dueno" '+(account.role==='dueno'?'selected':'')+'>DueÃ±o de equipo</option><option value="admin" '+(account.role==='admin'?'selected':'')+'>Administrador</option></select><div class="admin-division-group"><span class="panel-label">AsignaciÃ³n deportiva</span><div class="admin-section-note">Elige la divisiÃ³n principal y las divisiones en las que el jugador puede participar.</div></div><div class="admin-division-group"><span class="panel-label">DivisiÃ³n principal</span><div class="admin-division-buttons">'+['1','2','3','4'].map(value=>'<button class="admin-division-button '+(assigned===value?'active':'')+'" type="button" data-user-division-choice="'+account.username+'" data-division="'+value+'">D'+value+'</button>').join('')+'</div></div><div class="admin-division-group"><span class="panel-label">Divisiones habilitadas <span class="muted">(puedes elegir varias)</span></span><div class="admin-division-buttons">'+['1','2','3','4'].map(value=>'<button class="admin-division-button '+(enabled.includes(value)?'active':'')+'" type="button" data-user-enabled-choice="'+account.username+'" data-division="'+value+'">D'+value+'</button>').join('')+'</div></div></div>'}).join(''):'<div class="empty">TodavÃ­a no hay usuarios registrados.</div>';return '<div class="content-card" id="userManagement"><div class="admin-title">Usuarios y roles</div><div class="admin-section-note">Administra el rol de cada cuenta y su acceso deportivo por divisiones.</div><input class="input" id="adminPlayerSearch" placeholder="Buscar usuario por nombre"><div class="admin-player-list">'+rows+'</div></div>'}
  function roleManagement(){const roleName=role=>role==='admin'?'Administrador':role==='arbitro'?'Ãrbitro':role==='dueno'?'DueÃ±o de equipo':'Sin rol';const rows=accounts.length?accounts.map(account=>'<div class="admin-player-row" data-admin-player="'+account.username.toLowerCase()+'"><div class="admin-player-head"><div><div class="match-name">'+account.username+'</div><div class="muted">Rol actual: '+roleName(account.role)+'</div></div><button class="btn btn-primary" data-save-user-role="'+account.username+'">Guardar cambios</button></div><select class="input admin-player-role" data-user-role="'+account.username+'"><option value="pendiente" '+(account.role==='pendiente'?'selected':'')+'>Sin rol</option><option value="arbitro" '+(account.role==='arbitro'?'selected':'')+'>Ãrbitro</option><option value="dueno" '+(account.role==='dueno'?'selected':'')+'>DueÃ±o de equipo</option><option value="admin" '+(account.role==='admin'?'selected':'')+'>Administrador</option></select></div>').join(''):'<div class="empty">TodavÃ­a no hay usuarios registrados.</div>';return '<div class="content-card" id="userManagement"><div class="admin-title">Usuarios y roles</div><div class="admin-section-note">Administra Ãºnicamente el rol de cada cuenta.</div><input class="input" id="adminPlayerSearch" placeholder="Buscar usuario por nombre"><div class="admin-player-list">'+rows+'</div></div>'}
  function divisionManagement(){const rows=accounts.length?accounts.map(account=>{const assigned=String(account.division||''),enabled=Array.isArray(account.enabledDivisions)?account.enabledDivisions:(assigned?[assigned]:[]);return '<div class="admin-player-row" data-admin-player="'+account.username.toLowerCase()+'"><div class="admin-player-head"><div><div class="match-name">'+account.username+'</div><div class="muted">AsignaciÃ³n deportiva</div></div><button class="btn btn-primary" data-save-user-division="'+account.username+'">Guardar divisiones</button></div><div class="admin-division-group"><span class="panel-label">DivisiÃ³n principal</span><div class="admin-division-buttons">'+['1','2','3','4'].map(value=>'<button class="admin-division-button '+(assigned===value?'active':'')+'" type="button" data-user-division-choice="'+account.username+'" data-division="'+value+'">D'+value+'</button>').join('')+'</div></div><div class="admin-division-group"><span class="panel-label">Divisiones habilitadas <span class="muted">(puedes elegir varias)</span></span><div class="admin-division-buttons">'+['1','2','3','4'].map(value=>'<button class="admin-division-button '+(enabled.includes(value)?'active':'')+'" type="button" data-user-enabled-choice="'+account.username+'" data-division="'+value+'">D'+value+'</button>').join('')+'</div></div></div>'}).join(''):'<div class="empty">TodavÃ­a no hay usuarios registrados.</div>';return '<div class="content-card" id="divisionManagement"><div class="admin-title">AsignaciÃ³n deportiva</div><div class="admin-section-note">Asigna la divisiÃ³n principal y habilita una o varias divisiones para cada jugador.</div><input class="input" id="adminDivisionSearch" placeholder="Buscar jugador por nombre"><div class="admin-player-list">'+rows+'</div></div>'}
  function communityAdmin(){
    const palmaresRows=state.palmares.map(item=>'<div class="match-row"><div><div class="match-name">'+profileText(item.title)+'</div><div class="muted">'+profileText(item.category)+' Â· '+profileText(item.team||item.player||'')+'</div></div><button class="btn" data-delete-palmares="'+item.id+'">Eliminar</button></div>').join('')||'<div class="empty">No hay reconocimientos agregados.</div>';
    const newsRows=state.news.map(item=>'<div class="match-row"><div><div class="match-name">'+profileText(item.title)+'</div><div class="muted">'+profileText(item.description)+'</div></div><button class="btn" data-delete-news="'+item.id+'">Eliminar</button></div>').join('')||'<div class="empty">No hay noticias agregadas.</div>';
    return '<div class="content-card"><div class="admin-title">PalmarÃ©s y reconocimientos</div><div class="admin-section-note">Agrega campeones de cada versiÃ³n, Balones de Oro y mejores MED o BANDAS.</div><div class="admin-community-form"><select class="input" id="palmaresCategory"><option>CampeÃ³n</option><option>BalÃ³n de Oro</option><option>Mejor MED</option><option>Mejor BANDA</option></select><input class="input" id="palmaresTitle" placeholder="TÃ­tulo o versiÃ³n (ej. VersiÃ³n 3)"><input class="input" id="palmaresTeam" placeholder="Equipo campeÃ³n"><input class="input" id="palmaresPlayer" placeholder="Jugador (premios individuales)"><input class="input wide" id="palmaresImage" type="url" placeholder="URL de imagen (opcional)"><textarea class="input wide" id="palmaresDescription" placeholder="DescripciÃ³n (opcional)"></textarea></div><button class="btn btn-primary" id="addPalmares">Agregar al palmarÃ©s</button><div class="admin-list">'+palmaresRows+'</div></div><div class="content-card"><div class="admin-title">Noticias</div><div class="admin-section-note">Las noticias publicadas aparecerÃ¡n tambiÃ©n en el inicio.</div><div class="admin-community-form"><input class="input" id="newsTitle" placeholder="Nombre de la noticia"><input class="input" id="newsImage" type="url" placeholder="URL de imagen"><input class="input" id="newsImageFile" type="file" accept="image/*"><textarea class="input wide" id="newsDescription" placeholder="DescripciÃ³n de la noticia"></textarea></div><button class="btn btn-primary" id="addNews">Publicar noticia</button><div class="admin-list">'+newsRows+'</div></div>';
  }
  function playerDivisionManagement(){const rows=accounts.length?accounts.map(account=>{const assigned=Array.isArray(account.assignedDivisions)?account.assignedDivisions:(account.division?[String(account.division)]:[]),enabled=Array.isArray(account.enabledDivisions)?account.enabledDivisions:assigned;return '<div class="admin-division-result" data-admin-player="'+account.username.toLowerCase()+'" style="display:none"><button class="admin-division-player" type="button" data-open-division-player="'+account.username+'"><span>'+account.username+'</span><small>Ver divisiones</small></button><div class="admin-division-menu" data-division-menu="'+account.username+'" style="display:none"><div class="admin-division-group"><span class="panel-label">Divisiones asignadas</span><div class="admin-division-buttons">'+['1','2','3','4'].map(value=>'<button class="admin-division-button '+(assigned.includes(value)?'active':'')+'" type="button" data-user-assigned-choice="'+account.username+'" data-division="'+value+'">'+value+'D</button>').join('')+'</div></div><div class="admin-division-group"><span class="panel-label">Divisiones habilitadas</span><div class="admin-division-buttons">'+['1','2','3','4'].map(value=>'<button class="admin-division-button '+(enabled.includes(value)?'active':'')+'" type="button" data-user-enabled-choice="'+account.username+'" data-division="'+value+'">'+value+'D</button>').join('')+'</div></div><button class="btn btn-primary" data-save-user-division="'+account.username+'">Guardar divisiones</button></div></div>'}).join(''):'<div class="empty">TodavÃ­a no hay usuarios registrados.</div>';return '<div class="content-card" id="divisionManagement"><div class="admin-title">Asignar divisiones a jugadores</div><div class="admin-section-note">Busca un jugador; despuÃ©s pulsa su nombre para abrir el menÃº de divisiones.</div><input class="input" id="adminDivisionSearch" placeholder="Buscar jugador por nombre"><div class="admin-division-results">'+rows+'</div></div>'}
  function rosterManagement(){
    const teamOptions=state.teams.length?state.teams.map(item=>'<option value="'+item.id+'">'+item.name+'</option>').join(''):'<option value="">No hay equipos</option>';
    const playerOptions=accounts.filter(account=>!['admin','arbitro'].includes(account.role)).map(account=>'<option value="'+account.username+'">'+account.username+'</option>').join('');
    const firstTeam=state.teams[0],players=firstTeam?.players||[];
    return '<div class="content-card" id="rosterManagement"><div class="admin-title">Plantillas de equipos</div><div class="admin-section-note">Selecciona un equipo y agrega jugadores registrados a su plantilla. Sus posiciones se mantienen sincronizadas con su cuenta.</div><select class="input" id="rosterTeam">'+teamOptions+'</select><div class="roster-admin-add"><select class="input" id="rosterPlayer"><option value="">Selecciona un jugador</option>'+playerOptions+'</select><button class="btn btn-primary" id="addRosterPlayer">AÃ‘ADIR JUGADOR</button></div><div class="admin-list" id="rosterPlayerList">'+(players.length?players.map(player=>'<div class="match-row"><span>'+player+'</span><button class="btn" type="button" data-remove-roster-player="'+encodeURIComponent(player)+'">Quitar</button></div>').join(''):'<div class="empty">Este equipo todavÃ­a no tiene jugadores.</div>')+'</div></div>';
  }
  function ownerManagement(){const teamOptions=state.teams.length?state.teams.map(item=>'<option value="'+item.id+'">'+item.name+'</option>').join(''):'<option value="">No hay equipos</option>';const ownerOptions=accounts.filter(item=>item.role==='dueno'||item.role==='pendiente').map(item=>'<option value="'+item.username+'">'+item.username+'</option>').join('');return playerDivisionManagement()+rosterManagement()+tournamentManagement()+'<div class="content-card" id="ownerManagement"><div class="admin-title">Asignar dueÃ±o de equipo</div><select class="input" id="ownerTeam">'+teamOptions+'</select><select class="input" id="ownerAccount"><option value="">Selecciona una cuenta</option>'+ownerOptions+'</select><button class="btn btn-primary" id="assignOwner">Asignar dueÃ±o</button><div class="admin-list">El dueÃ±o asignado verÃ¡ la secciÃ³n Jugadores.</div></div>'}
  function tournamentManagement(){const options=state.tournaments.map(item=>'<option value="'+item.id+'" '+(item.id===activeTournamentId?'selected':'')+'>'+item.name+'</option>').join('');return '<div class="content-card" id="tournamentManagement"><div class="admin-title">Torneos</div><select class="input" id="activeTournamentSelect">'+options+'</select><input class="input" id="newTournamentName" placeholder="Nombre del nuevo torneo"><input class="input" id="newTournamentSeason" placeholder="Temporada"><button class="btn btn-primary" id="createTournament">Crear torneo</button><button class="btn" id="saveActiveTournament">Usar torneo seleccionado</button></div>'}
  function adminMatchList(){
    const tournamentOptions='<option value="">Todas las temporadas</option>'+state.tournaments.map(item=>'<option value="'+item.id+'">'+profileText(item.name)+'</option>').join('');
    const divisionOptions='<option value="">DivisiÃ³n</option><option value="1">DivisiÃ³n 1</option><option value="2">DivisiÃ³n 2</option><option value="3">DivisiÃ³n 3</option><option value="4">DivisiÃ³n 4</option>';
    const roundOptions=[...new Set(state.matches.map(item=>Number(item.round)||1))].sort((a,b)=>a-b).map(round=>'<option value="'+round+'">J'+round+' Â· Jornada '+round+'</option>').join('');
    const rows=state.matches.length?state.matches.map(match=>{
      const home=match.home||team(match.teamAId)?.name||'Equipo A',away=match.away||team(match.teamBId)?.name||'Equipo B';
      const round=Number(match.round)||1;
      return '<tr data-admin-match-row="'+match.id+'" data-match-tournament="'+(match.tournamentId||'')+'" data-match-division="'+(match.division||'')+'" data-match-round="'+round+'"><td>'+profileText(home)+'</td><td>'+profileText(away)+'</td><td>'+(match.finished?((match.scoreA??0)+' - '+(match.scoreB??0)):'â€”')+'</td><td><span class="admin-match-status '+(match.finished?'finished':'scheduled')+'">'+(match.finished?'Finalizado':'Programado')+'</span></td><td>'+profileText(match.date||'â€”')+(match.time?' '+profileText(match.time):'')+'</td><td>J'+round+' Â· Jornada '+round+'</td><td>'+profileText(match.mvp||'â€”')+'</td><td class="admin-match-actions"><button class="admin-match-icon" type="button" data-open-acta="'+match.id+'" title="Registrar / editar resultado" aria-label="Registrar o editar resultado">âš½</button><button class="admin-match-icon edit" type="button" data-edit-match="'+match.id+'" title="Editar partido" aria-label="Editar partido">âœŽ</button><button class="admin-match-icon delete" type="button" data-delete-match="'+match.id+'" title="Eliminar partido" aria-label="Eliminar partido">ðŸ—‘</button></td></tr>';
    }).join(''):'<tr><td colspan="8"><div class="empty">No hay partidos creados.</div></td></tr>';
    return '<div class="content-card admin-match-card" id="adminMatchList"><div class="admin-match-heading"><div class="admin-title">âš½ GestiÃ³n de partidos</div><button class="btn btn-primary" type="button" data-new-admin-match>ï¼‹ NUEVO PARTIDO</button></div><div class="admin-match-filters"><select class="input" id="adminTournamentFilter">'+tournamentOptions+'</select><select class="input" id="adminDivisionFilter">'+divisionOptions+'</select><select class="input" id="adminRoundFilter"><option value="">Jornada</option>'+roundOptions+'</select></div><div class="admin-match-table-wrap"><table class="admin-match-table"><thead><tr><th>Local</th><th>Visitante</th><th>Resultado</th><th>Estado</th><th>Fecha</th><th>Jornada</th><th>MVP</th><th>Acciones</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }
  function setupAdminSections(){
    const tools=document.querySelector('.admin-tools');if(!tools||tools.closest('.admin-section-layout'))return;
    const cards=[...tools.querySelectorAll(':scope > .content-card')];
    const sectionNav=document.createElement('aside');sectionNav.className='admin-section-nav';sectionNav.innerHTML='<div class="admin-section-nav-title">CompeticiÃ³n</div><button type="button" class="active" data-admin-section="competition">â–¦ Jornadas y partidos</button><button type="button" data-admin-section="tournaments">â–£ Temporadas y torneos</button><div class="admin-section-nav-title">Plantilla</div><button type="button" data-admin-section="teams">â™Ÿ Equipos y jugadores</button><button type="button" data-admin-section="users">â™™ Usuarios y divisiones</button><div class="admin-section-nav-title">Comunidad</div><button type="button" data-admin-section="community">â˜… PalmarÃ©s y noticias</button><button type="button" data-admin-section="sponsors">âš‘ Patrocinadores</button><div class="admin-section-nav-title">Actas</div><button type="button" data-admin-section="acts">â–¤ Actas de partidos</button>';
    const sectionContent=document.createElement('main');sectionContent.className='admin-section-content';
    cards.forEach(card=>{const title=card.querySelector('.admin-title')?.textContent.toLowerCase()||'',id=card.id||'';let section='competition';if(id==='tournamentManagement'||title.includes('torneo'))section='tournaments';else if(id==='ownerManagement'||id==='divisionManagement'||id==='rosterManagement'||title.includes('equipo y jugadores')||title.includes('asignar dueÃ±o')||title.includes('plantillas'))section='teams';else if(id==='userManagement'||title.includes('usuarios'))section='users';else if(title.includes('palmarÃ©s')||title.includes('noticias'))section='community';else if(title.includes('sponsor'))section='sponsors';else if(title.includes('acta'))section='acts';card.dataset.adminSection=section;sectionContent.appendChild(card)});
    const layout=document.createElement('div');layout.className='admin-section-layout';layout.append(sectionNav,sectionContent);tools.replaceWith(layout);
    const refreshRoster=()=>{
      const teamId=document.getElementById('rosterTeam')?.value,selected=state.teams.find(item=>item.id===teamId),list=document.getElementById('rosterPlayerList');
      if(!list)return;
      const players=selected?.players||[];
      list.innerHTML=players.length?players.map(player=>'<div class="match-row"><span>'+player+'</span><button class="btn" type="button" data-remove-roster-player="'+encodeURIComponent(player)+'">Quitar</button></div>').join(''):'<div class="empty">Este equipo todavÃ­a no tiene jugadores.</div>';
    };
    layout.addEventListener('change',event=>{if(event.target.closest('#rosterTeam'))refreshRoster()});
    layout.addEventListener('change',event=>{
      if(!event.target.closest('#adminTournamentFilter')&&!event.target.closest('#adminDivisionFilter')&&!event.target.closest('#adminRoundFilter'))return;
      const tournament=document.getElementById('adminTournamentFilter')?.value||'',division=document.getElementById('adminDivisionFilter')?.value||'',round=document.getElementById('adminRoundFilter')?.value||'';
      document.querySelectorAll('[data-admin-match-row]').forEach(row=>{row.style.display=(!tournament||row.dataset.matchTournament===tournament)&&(!division||row.dataset.matchDivision===division)&&(!round||row.dataset.matchRound===round)?'':'none'});
    });
    layout.addEventListener('click',async event=>{
      const editMatchButton=event.target.closest('[data-edit-match]');
      if(editMatchButton){
        event.preventDefault();
        event.stopPropagation();
        selectedActaMatchId=editMatchButton.dataset.editMatch;
        actaTab='lineup';
        content();
        prepareAdminDivisions();
        const actsSection=document.querySelector('.admin-section-nav [data-admin-section="acts"]');
        if(actsSection){
          document.querySelectorAll('.admin-section-nav [data-admin-section]').forEach(button=>button.classList.toggle('active',button===actsSection));
          document.querySelectorAll('.admin-section-content>.content-card').forEach(card=>card.classList.toggle('admin-section-visible',card.dataset.adminSection==='acts'));
        }
        document.querySelector('.admin-section-content [data-acta-match]')?.scrollIntoView({behavior:'smooth',block:'start'});
        return;
      }
      const openActaButton=event.target.closest('[data-open-acta]');
      if(openActaButton){
        event.preventDefault();
        event.stopPropagation();
        selectedActaMatchId=openActaButton.dataset.openActa;
        actaTab='goals';
        content();
        prepareAdminDivisions();
        const actsSection=document.querySelector('.admin-section-nav [data-admin-section="acts"]');
        if(actsSection){
          document.querySelectorAll('.admin-section-nav [data-admin-section]').forEach(button=>button.classList.toggle('active',button===actsSection));
          document.querySelectorAll('.admin-section-content>.content-card').forEach(card=>card.classList.toggle('admin-section-visible',card.dataset.adminSection==='acts'));
        }
        return;
      }
      const deleteMatchButton=event.target.closest('[data-delete-match]');
      if(deleteMatchButton){
        event.preventDefault();
        event.stopPropagation();
        if(!session||session.role!=='admin')return;
        state.matches=state.matches.filter(match=>String(match.id)!==String(deleteMatchButton.dataset.deleteMatch));
        await setJSON('matches',state.matches);
        selectedActaMatchId=null;
        content();
        return;
      }
      const newAdminMatchButton=event.target.closest('[data-new-admin-match]');
      if(newAdminMatchButton){const builder=document.getElementById('adminMatchBuilder');if(builder){builder.classList.remove('admin-match-builder-hidden');builder.scrollIntoView({behavior:'smooth',block:'center'})}return}
      const addTeamButton=event.target.closest('#addTeam');
      if(addTeamButton){
        event.stopPropagation();
        const name=document.getElementById('newTeamName')?.value.trim(),division=document.getElementById('newTeamDivision')?.value||'1',players=(document.getElementById('newTeamPlayers')?.value||'').split(',').map(item=>item.trim()).filter(Boolean),crest=document.getElementById('newTeamCrest')?.value.trim()||'';
        if(!name){alert('Escribe el nombre del equipo.');return}
        if(state.teams.some(item=>item.name.toLowerCase()===name.toLowerCase())){alert('Ya existe un equipo con ese nombre.');return}
        state.teams.push({id:Date.now().toString(36),name,division,players,crest});await setJSON('teams',state.teams);content();return;
      }
      const addRosterButton=event.target.closest('#addRosterPlayer');
      if(addRosterButton){
        event.stopPropagation();
        const teamId=document.getElementById('rosterTeam')?.value,username=document.getElementById('rosterPlayer')?.value.trim(),selected=state.teams.find(item=>item.id===teamId);
        if(!selected||!username){alert('Selecciona un equipo y un jugador registrado.');return}
        const assigned=state.teams.some(item=>(item.players||[]).some(player=>player.toLowerCase()===username.toLowerCase()));
        if(assigned){alert('Ese jugador ya pertenece a otro equipo.');return}
        if(!accounts.some(account=>account.username.toLowerCase()===username.toLowerCase())){alert('Solo puedes agregar jugadores registrados.');return}
        selected.players=selected.players||[];selected.players.push(username);await setJSON('teams',state.teams);refreshRoster();return;
      }
      const removeRosterButton=event.target.closest('[data-remove-roster-player]');
      if(removeRosterButton){
        event.stopPropagation();
        const teamId=document.getElementById('rosterTeam')?.value,username=decodeURIComponent(removeRosterButton.dataset.removeRosterPlayer||''),selected=state.teams.find(item=>item.id===teamId);
        if(selected){selected.players=(selected.players||[]).filter(player=>player!==username);await setJSON('teams',state.teams);refreshRoster()}return;
      }
      const createTournamentButton=event.target.closest('#createTournament');
      if(createTournamentButton){
        event.stopPropagation();
        const name=document.getElementById('newTournamentName')?.value.trim(),season=document.getElementById('newTournamentSeason')?.value.trim();
        if(!name)return;
        const tournament={id:Date.now().toString(36),name,season};
        state.tournaments.push(tournament);activeTournamentId=tournament.id;
        await setJSON('tournaments',state.tournaments);localStorage.setItem('hfa:activeTournament',activeTournamentId);nav();content();
        return;
      }
      const createMatchButton=event.target.closest('#createMatch');
      if(createMatchButton){
        event.stopPropagation();
        const home=document.getElementById('matchHome')?.value.trim(),away=document.getElementById('matchAway')?.value.trim();
        if(!home||!away||home.toLowerCase()===away.toLowerCase()){alert('Selecciona un equipo local y uno visitante diferentes.');return}
        const homeTeam=state.teams.find(item=>item.name.toLowerCase()===home.toLowerCase()),awayTeam=state.teams.find(item=>item.name.toLowerCase()===away.toLowerCase());
        state.matches.push({id:Date.now().toString(36),teamAId:homeTeam?.id,teamBId:awayTeam?.id,home,away,date:document.getElementById('matchDate')?.value||'',time:document.getElementById('matchTime')?.value||'',round:adminRound,division:matchDivision,tournamentId:activeTournamentId,finished:false,acta:'',attendance:{}});
        await setJSON('matches',state.matches);content();
        return;
      }
      const newRoundButton=event.target.closest('[data-new-round]');
      if(newRoundButton){event.stopPropagation();adminRound=Math.max(0,...state.matches.filter(item=>String(item.division||'')===String(matchDivision)).map(item=>Number(item.round)||0))+1;content();return}
      const generateRoundButton=event.target.closest('[data-generate-round]');
      if(generateRoundButton){
        event.stopPropagation();
        const divisionTeams=teamsForMatchDivision(matchDivision);
        if(divisionTeams.length<2){alert('Necesitas al menos 2 equipos registrados en esta divisiÃ³n para generar jornadas.');return}
        const existingRounds=state.matches.filter(item=>String(item.division||team(item.teamAId)?.division||team(item.teamBId)?.division||'')===String(matchDivision)).map(item=>Number(item.round)||0);
        const firstRound=Math.max(0,...existingRounds)+1,generated=[],rotation=divisionTeams.map(item=>item);
        for(let roundIndex=0;roundIndex<Math.max(1,divisionTeams.length-1);roundIndex++){
          const round=firstRound+roundIndex;
          for(let index=0;index<Math.floor(rotation.length/2);index++){
            const home=rotation[index],away=rotation[rotation.length-1-index],local=(roundIndex+index)%2===0?home:away,visitor=local===home?away:home;
            const exists=state.matches.some(match=>String(match.division||'')===String(matchDivision)&&Number(match.round)===round&&((match.teamAId===local.id&&match.teamBId===visitor.id)||(match.teamAId===visitor.id&&match.teamBId===local.id)));
            if(!exists)generated.push({id:Date.now().toString(36)+roundIndex+'-'+index,teamAId:local.id,teamBId:visitor.id,home:local.name,away:visitor.name,date:'',time:'',round,division:matchDivision,tournamentId:activeTournamentId,finished:false,acta:'',attendance:{}});
          }
          rotation.splice(1,0,rotation.pop());
        }
        if(!generated.length){alert('Las jornadas de esta divisiÃ³n ya estÃ¡n generadas.');return}
        state.matches.push(...generated);adminRound=firstRound;await setJSON('matches',state.matches);content();return;
      }
    });
    const matchCard=document.getElementById('createMatch')?.closest('.content-card');
    if(matchCard){matchCard.id='adminMatchBuilder';matchCard.classList.remove('admin-match-builder-hidden')}
    const show=section=>{sectionNav.querySelectorAll('[data-admin-section]').forEach(button=>button.classList.toggle('active',button.dataset.adminSection===section));sectionContent.querySelectorAll('.content-card').forEach(card=>card.classList.toggle('admin-section-visible',card.dataset.adminSection===section))};
    show('competition');
  }
  function admin(){
    if(!session)return '<div class="notice">ðŸ”’ El panel de administraciÃ³n es privado. <a class="back" href="seccion.html?view=cuenta">Inicia sesiÃ³n</a> para continuar.</div>';
    if(session.role!=='admin'&&session.role!=='arbitro')return '<div class="notice">No tienes permisos para acceder al panel de actas. Los Ã¡rbitros pueden subir actas y los administradores gestionan toda la competiciÃ³n.</div>';
    const isAdmin=session.role==='admin';
    if(!selectedActaMatchId&&state.matches.length)selectedActaMatchId=state.matches[0].id;
    const selectedMatch=state.matches.find(match=>match.id===selectedActaMatchId)||state.matches[0];
    const matchOptions=state.matches.length?state.matches.map(match=>{const home=match.home||team(match.teamAId)?.name||'Equipo A',away=match.away||team(match.teamBId)?.name||'Equipo B';return '<option value="'+match.id+'">'+home+' vs '+away+'</option>'}).join(''):'<option value="">No hay partidos creados</option>';
      return '<div class="notice">SesiÃ³n: '+session.username+' Â· '+(isAdmin?'Administrador':'Ãrbitro')+' Â· CompeticiÃ³n: <b>'+state.competition+'</b></div><div class="admin-tools" style="margin-top:18px">'+(isAdmin?communityAdmin()+'<div class="content-card"><div class="admin-title">Nombre de competiciÃ³n</div><input class="input" id="competitionInput" value="'+state.competition+'" placeholder="Nombre de la competiciÃ³n"><button class="btn btn-primary" id="saveCompetition">Guardar competiciÃ³n</button></div><div class="content-card"><div class="admin-title">Agregar equipo y jugadores</div><input class="input" id="newTeamName" placeholder="Nombre del equipo"><select class="input" id="newTeamDivision"><option value="1">DivisiÃ³n 1</option><option value="2">DivisiÃ³n 2</option><option value="3">DivisiÃ³n 3</option><option value="4">DivisiÃ³n 4</option></select><input class="input" id="newTeamPlayers" placeholder="Jugadores separados por comas"><button class="btn btn-primary" id="addTeam">AÃ±adir equipo</button></div><div class="content-card"><div class="admin-title">Sponsors</div><div class="admin-list">Patrocinadores actuales: '+(state.sponsors.length?state.sponsors.join(', '):'ninguno')+'</div><input class="input" id="sponsorInput" placeholder="Nombre del sponsor"><button class="btn btn-primary" id="addSponsor">Agregar sponsor</button></div><div class="content-card"><div class="admin-title">Crear jornadas y partidos</div>'+dragMatchUI()+'<div class="admin-list">Partidos creados: '+state.matches.length+'</div></div>':'')+'<div class="content-card"><div class="admin-title">Subir acta</div><select class="input" id="actaMatch">'+matchOptions+'</select>'+actaMenu(selectedMatch)+'<input class="input" id="mvpInput" placeholder="MVP del partido"><textarea class="input" id="actaText" placeholder="Observaciones del acta"></textarea><div class="admin-list">Selecciona Goles, Tarjetas o Menciones especiales y pulsa sobre el jugador correspondiente.</div></div></div>';
  }
  document.addEventListener('click',async function(event){
    const publicRoundButton=event.target.closest('[data-public-round]');
    if(publicRoundButton){publicMatchRound=publicRoundButton.dataset.publicRound;content();return}
    const adminSectionButton=event.target.closest('[data-admin-section]');
    if(adminSectionButton){
      const layout=adminSectionButton.closest('.admin-section-layout'),section=adminSectionButton.dataset.adminSection;
      layout?.querySelectorAll('[data-admin-section]').forEach(button=>button.classList.toggle('active',button===adminSectionButton));
      layout?.querySelectorAll('.admin-section-content>.content-card').forEach(card=>card.classList.toggle('admin-section-visible',card.dataset.adminSection===section));
      return;
    }
    if(event.target.id==='sectionNotification'){document.getElementById('sectionNotificationPanel')?.classList.toggle('open');return}
    const communityTrigger=event.target.closest('[data-community-menu]');
    if(communityTrigger){
      const wrap=communityTrigger.closest('.community-nav-wrap');
      if(wrap){
        wrap.classList.toggle('open');
        communityTrigger.classList.toggle('active', wrap.classList.contains('open'));
      }
      return;
    }
    const communityMenuLink=event.target.closest('.community-nav-menu a');
    if(communityMenuLink){
      document.querySelectorAll('.community-nav-wrap').forEach(item=>{
        item.classList.remove('open');
        const btn=item.querySelector('[data-community-menu]');
        btn?.classList.remove('active');
      });
      return;
    }
    const selectLineupPlayer=event.target.closest('[data-select-lineup-player]');
    if(selectLineupPlayer){if(!session||!['admin','arbitro'].includes(session.role))return;document.querySelectorAll('.acta-roster-player.selected-for-pitch').forEach(item=>item.classList.remove('selected-for-pitch'));selectLineupPlayer.closest('.acta-roster-player')?.classList.add('selected-for-pitch');selectedLineupPlayer={name:decodeURIComponent(selectLineupPlayer.dataset.selectLineupPlayer),side:selectLineupPlayer.dataset.selectLineupSide};return}
    const rosterActionPlayer=event.target.closest('[data-acta-roster-player]');
    if(rosterActionPlayer&&!event.target.closest('[data-select-lineup-player]')){
      if(!session||!['admin','arbitro'].includes(session.role))return;
      selectedActaMatchId=rosterActionPlayer.closest('[data-acta-match]')?.dataset.actaMatch||selectedActaMatchId;
      openActaPlayerMenu(decodeURIComponent(rosterActionPlayer.dataset.actaRosterPlayer),rosterActionPlayer.dataset.actaRosterSide);
      return;
    }
    const rosterPlayer=event.target.closest('[data-drag-player]');
    if(rosterPlayer&&!event.target.closest('[data-acta-player]')){if(!session||!['admin','arbitro'].includes(session.role))return;document.querySelectorAll('.acta-roster-player.selected-for-pitch').forEach(item=>item.classList.remove('selected-for-pitch'));rosterPlayer.classList.add('selected-for-pitch');selectedLineupPlayer={name:decodeURIComponent(rosterPlayer.dataset.dragPlayer),side:rosterPlayer.dataset.dragSide};return}
    const emptyPitchSlot=event.target.closest('[data-drop-player-side]');
    if(emptyPitchSlot&&selectedLineupPlayer){if(!session||!['admin','arbitro'].includes(session.role))return;const placed=await placeLineupPlayer(selectedLineupPlayer.name,selectedLineupPlayer.side,emptyPitchSlot);if(placed)selectedLineupPlayer=null;return}
    const fieldPlayer=event.target.closest('[data-acta-player]');
    if(fieldPlayer){if(!session||!['admin','arbitro'].includes(session.role))return;selectedActaMatchId=fieldPlayer.dataset.actaMatch||selectedActaMatchId;openActaPlayerMenu(decodeURIComponent(fieldPlayer.dataset.actaPlayer),fieldPlayer.dataset.actaSide);return}
    if(event.target.closest('[data-close-player-menu]')||event.target.classList.contains('acta-player-menu-backdrop')){closeActaPlayerMenu();return}
    const backPlayerMenu=event.target.closest('[data-back-player-menu]');
    if(backPlayerMenu){const menu=backPlayerMenu.closest('.acta-player-menu-backdrop');if(menu)openActaPlayerMenu(menu.dataset.player,menu.dataset.side);return}
    const subEntering=event.target.closest('[data-sub-entering]');
    if(subEntering){subEntering.closest('.acta-player-menu').querySelectorAll('[data-sub-entering]').forEach(button=>button.classList.toggle('selected',button===subEntering));return}
    const confirmPlayerAction=event.target.closest('[data-confirm-player-action]');
    if(confirmPlayerAction){
      const menu=confirmPlayerAction.closest('.acta-player-menu-backdrop'),player=menu?.dataset.player,side=menu?.dataset.side,match=state.matches.find(item=>item.id===selectedActaMatchId),action=confirmPlayerAction.dataset.confirmPlayerAction;
      if(!match||!player)return;
      if(action==='goal'){const minute=menu.querySelector('#playerActionMinute')?.value.trim(),assist=menu.querySelector('#playerActionAssist')?.value||'';if(minute==='')return;match.goals=match.goals||[];match.goals.push({player,assist,minute,side})}
      if(action==='card'){const type=menu.querySelector('#playerActionCardType')?.value||'amarilla',minute=menu.querySelector('#playerActionMinute')?.value.trim()||'';match.cards=match.cards||[];match.cards.push({player,type,minute,side})}
      if(action==='assist'){const scorer=menu.querySelector('#playerActionScorer')?.value,minute=menu.querySelector('#playerActionMinute')?.value.trim();if(!scorer||minute==='')return;match.goals=match.goals||[];match.goals.push({player:scorer,assist:player,minute,side})}
      if(action==='sub'){const entering=menu.querySelector('[data-sub-entering].selected')?.dataset.subEntering;if(!entering)return;match.subs=match.subs||[];match.subs.push({minute:'',side,out:player,in:entering})}
      if(action==='mvp')match.mvp=player;
      if(action==='mention'){match.mentions=match.mentions||[];if(!match.mentions.includes(player))match.mentions.push(player)}
      await setJSON('matches',state.matches);closeActaPlayerMenu();content();return;
    }
    const playerAction=event.target.closest('[data-player-action]');
    if(playerAction){const menu=playerAction.closest('.acta-player-menu-backdrop');if(menu)renderPlayerActionStep(menu,playerAction.dataset.playerAction);return}
    const notification=event.target.closest('[data-notification-target]');
    if(notification){location.href=notification.dataset.notificationTarget;return}
    const countryButton=event.target.closest('#countryToggle');
    if(countryButton){document.getElementById('countryMenu')?.classList.toggle('open');return}
    const countryOption=event.target.closest('[data-country-code]');
    if(countryOption){const code=countryOption.dataset.countryCode,label=countryOption.dataset.countryLabel,emoji=countryOption.dataset.countryEmoji;const hidden=document.getElementById('authCountry');const selected=document.getElementById('countrySelected');if(hidden)hidden.value=code;if(selected)selected.textContent=emoji+' '+label;document.getElementById('countryMenu')?.classList.remove('open');return}
    if(!event.target.closest('.notification-wrap')&&!event.target.closest('.country-picker-wrap'))document.getElementById('sectionNotificationPanel')?.classList.remove('open');
    if(!event.target.closest('.community-nav-wrap')){
      document.querySelectorAll('.community-nav-wrap').forEach(item=>{
        item.classList.remove('open');
        const btn=item.querySelector('[data-community-menu]');
        btn?.classList.remove('active');
      });
    }
    if(!event.target.closest('.country-picker-wrap'))document.getElementById('countryMenu')?.classList.remove('open');
    const profileTeamButton=event.target.closest('[data-profile-team]');
    if(profileTeamButton){const history=profileTeamButton.closest('.profile-history'),existing=history?.querySelector('.profile-team-detail');if(existing&&existing.dataset.teamId===profileTeamButton.dataset.profileTeam){existing.remove();return}existing?.remove();const teamRecord=team(profileTeamButton.dataset.profileTeam),form=teamForm(teamRecord),matches=state.matches.filter(match=>match.finished&&(matchTeam(match,'A')?.id===teamRecord?.id||matchTeam(match,'B')?.id===teamRecord?.id)),wins=matches.filter(match=>{const home=matchTeam(match,'A')?.id===teamRecord?.id;return home?Number(match.scoreA)>Number(match.scoreB):Number(match.scoreB)>Number(match.scoreA)}).length;const detail=document.createElement('div');detail.className='profile-team-detail';detail.dataset.teamId=profileTeamButton.dataset.profileTeam;detail.innerHTML='<div class="profile-team-detail-head"><span>'+teamRecord.name+'</span><button type="button" data-close-team-stats>Cerrar</button></div><div class="profile-team-detail-grid"><span><b>'+form.played+'</b>Partidos</span><span><b>'+wins+'</b>Victorias</span><span><b>'+form.points+'</b>Puntos</span><span><b>'+form.goalsFor+'</b>Goles</span></div>';history?.appendChild(detail);return}
    if(event.target.closest('[data-close-team-stats]')){event.target.closest('.profile-team-detail')?.remove();return}
    const openContractButton=event.target.closest('[data-open-contract]');
    if(openContractButton){const offer=state.offers.find(item=>item.id===openContractButton.dataset.openContract&&item.player.toLowerCase()===session?.username.toLowerCase());if(offer)openContractModal(offer);return}
    if(event.target.closest('[data-offer-close]')){closeContractModal();return}
    const sendOfferButton=event.target.closest('[data-offer-send]');
    if(sendOfferButton){const modal=sendOfferButton.closest('.contract-modal'),canvas=modal?.querySelector('.signature-pad'),message=modal?.querySelector('[data-offer-message]')?.value.trim()||'',owned=state.teams.find(item=>item.ownerUsername===session?.username);if(!owned||!message||!canvas)return;if(!canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((value,index)=>index%4===3&&value>0))return;state.offers.push({id:Date.now().toString(36),teamId:owned.id,player:sendOfferButton.dataset.offerSend,ownerUsername:session.username,terms:message,message,signature:canvas.toDataURL('image/png'),sentAt:new Date().toISOString(),status:'pendiente'});await setJSON('offers',state.offers);closeContractModal();content();return}
    if(event.target.closest('[data-contract-close]')){closeContractModal();return}
    if(event.target.closest('[data-signed-contract-close]')){closeContractModal();return}
    const rejectContractButton=event.target.closest('[data-contract-reject]');
    if(rejectContractButton){const offer=state.offers.find(item=>item.id===rejectContractButton.dataset.contractReject&&item.player.toLowerCase()===session?.username.toLowerCase());if(offer){offer.status='rechazada';await setJSON('offers',state.offers);closeContractModal();content()}return}
    const acceptContractButton=event.target.closest('[data-contract-accept]');
    if(acceptContractButton){const offer=state.offers.find(item=>item.id===acceptContractButton.dataset.contractAccept&&item.player.toLowerCase()===session?.username.toLowerCase()),canvas=acceptContractButton.closest('.contract-modal')?.querySelector('.signature-pad');if(!offer)return;if(!canvas||!canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((value,index)=>index%4===3&&value>0)){return}offer.status='aceptada';offer.signedAt=new Date().toISOString();offer.playerSignature=canvas.toDataURL('image/png');const offerTeam=team(offer.teamId);if(offerTeam){offerTeam.players=offerTeam.players||[];if(!offerTeam.players.some(player=>player.toLowerCase()===session.username.toLowerCase()))offerTeam.players.push(session.username)}await setJSON('teams',state.teams);await setJSON('offers',state.offers);closeContractModal();content();showSignedContract(offer);return}
    if(event.target.closest('[data-free-agent]')){const offer=state.offers.find(item=>item.player.toLowerCase()===session?.username.toLowerCase()&&item.status==='pendiente');if(offer)openContractModal(offer);else document.querySelector('[data-profile-tab="historial"]')?.click();return}
    const reactionButton=event.target.closest('[data-comment-react]');
    if(reactionButton&&session){const comments=await getJSON('profileComments',[]),comment=comments.find(item=>item.id===reactionButton.dataset.commentReact);if(comment){comment.reactions=comment.reactions||{};comment.reactions.like=comment.reactions.like||[];const index=comment.reactions.like.indexOf(session.username);if(index===-1)comment.reactions.like.push(session.username);else comment.reactions.like.splice(index,1);await setJSON('profileComments',comments);await hydrateProfile()}return}
    const hideButton=event.target.closest('[data-comment-hide]');
    if(hideButton&&session){const comments=await getJSON('profileComments',[]),comment=comments.find(item=>item.id===hideButton.dataset.commentHide);if(comment&&(comment.author===session.username||session.role==='admin')){comment.hidden=!comment.hidden;await setJSON('profileComments',comments);await hydrateProfile()}return}
    const deleteButton=event.target.closest('[data-comment-delete]');
    if(deleteButton&&session){const comments=await getJSON('profileComments',[]),comment=comments.find(item=>item.id===deleteButton.dataset.commentDelete);if(comment&&(comment.author===session.username||session.role==='admin')){await setJSON('profileComments',comments.filter(item=>item.id!==comment.id));await hydrateProfile()}return}
    const replyButton=event.target.closest('[data-comment-reply]');
    if(replyButton){const item=replyButton.closest('.comment-item');if(item.querySelector('.comment-reply-box')){item.querySelector('.comment-reply-box').parentElement.remove();return}const form=document.createElement('div');form.className='comment-reply-form';form.innerHTML='<textarea class="comment-box comment-reply-box" maxlength="1000" placeholder="Escribe una respuesta..."></textarea><div class="comment-actions"><button class="btn btn-primary" type="button" data-comment-reply-submit="'+replyButton.dataset.commentReply+'">Responder</button></div>';item.append(form);return}
    const replySubmit=event.target.closest('[data-comment-reply-submit]');
    if(replySubmit&&session){const box=replySubmit.closest('.comment-reply-form')?.querySelector('textarea'),text=box?.value.trim();if(!text)return;const comments=await getJSON('profileComments',[]);comments.push({id:Date.now().toString(36),target:session.username,author:session.username,text,parentId:replySubmit.dataset.commentReply,createdAt:new Date().toISOString()});await setJSON('profileComments',comments);await hydrateProfile();return}
    const commentButton=event.target.closest('.comment-actions .btn');
    if(commentButton){
      if(!session)return;
      const box=commentButton.closest('.profile-panel')?.querySelector('.comment-box'),text=box?.value.trim();
      if(!text)return;
      const comments=await getJSON('profileComments',[]);comments.push({id:Date.now().toString(36),target:session.username,author:session.username,text,createdAt:new Date().toISOString()});await setJSON('profileComments',comments);box.value='';await hydrateProfile();return;
    }
    const profileTabButton=event.target.closest('[data-profile-tab]');
    if(profileTabButton){
      document.querySelectorAll('.profile-tab').forEach(button=>button.classList.toggle('active', button===profileTabButton));
      const layout=profileTabButton.closest('.profile-shell')?.querySelector('.profile-layout');
      const mainColumn=layout?.querySelector('.profile-main-column');
      const sideColumn=layout?.querySelector('.profile-side-column');
      const tabIndex=[...document.querySelectorAll('.profile-tab')].indexOf(profileTabButton);
      const mailbox=document.querySelector('.mailbox-panel'),freeAgent=document.querySelector('.free-agent-block');
      if(profileTabButton.dataset.profileTab==='buzon'){if(layout)layout.style.display='none';mailbox?.classList.add('mailbox-visible');freeAgent?.classList.add('mailbox-visible');return}
      mailbox?.classList.remove('mailbox-visible');freeAgent?.classList.remove('mailbox-visible');if(layout)layout.style.display='grid';
      if(layout&&mainColumn&&sideColumn){
        mainColumn.style.display=tabIndex<3?'block':'none';
        sideColumn.style.display=tabIndex>=3?'block':'none';
        layout.style.gridTemplateColumns=tabIndex===6?'1fr':'';
        const selectedMainIndex=tabIndex===0?0:tabIndex===1?2:3;
        [...mainColumn.children].forEach((child,index)=>child.style.display=index===selectedMainIndex?'block':'none');
        [...sideColumn.children].forEach((child,index)=>child.style.display=index===tabIndex-3?'block':'none');
      }
      return;
    }
    const statsButton=event.target.closest('[data-stats-division]');
    if(statsButton){statsDivision=statsButton.dataset.statsDivision;document.getElementById('content').innerHTML=stats(statsDivision,statsCategory);return}
    const statsCategoryButton=event.target.closest('[data-stats-category]');
    if(statsCategoryButton){statsCategory=statsCategoryButton.dataset.statsCategory;document.getElementById('content').innerHTML=stats(statsDivision,statsCategory);return}
    const playerPositionButton=event.target.closest('[data-player-position]');
    if(playerPositionButton){playerPositionFilter=playerPositionButton.dataset.playerPosition;content();return}
    const openDivisionPlayer=event.target.closest('[data-open-division-player]');
    if(openDivisionPlayer){const menu=openDivisionPlayer.closest('.admin-division-result')?.querySelector('[data-division-menu]');if(menu)menu.style.display=menu.style.display==='none'?'block':'none';return}
    const assignedChoiceButton=event.target.closest('[data-user-assigned-choice]');
    if(assignedChoiceButton){assignedChoiceButton.classList.toggle('active');return}
    const assignedDivisionButton=event.target.closest('[data-user-division-choice]');
    if(assignedDivisionButton){const row=assignedDivisionButton.closest('.admin-player-row');row?.querySelectorAll('[data-user-division-choice]').forEach(button=>button.classList.toggle('active',button===assignedDivisionButton));return}
    const enabledDivisionButton=event.target.closest('[data-user-enabled-choice]');
    if(enabledDivisionButton){enabledDivisionButton.classList.toggle('active');return}
    const teamButton=event.target.closest('[data-team-id]');
    if(teamButton){const detail=document.getElementById('teamDetail'),selectedTeam=team(teamButton.dataset.teamId);if(detail&&selectedTeam)detail.innerHTML=teamProfile(selectedTeam);return}
    const directOfferButton=event.target.closest('[data-send-offer]');
    if(directOfferButton){if(!session){alert('Inicia sesiÃ³n para enviar una oferta.');return}const eligibility=offerEligibility(directOfferButton.dataset.sendOffer);if(!eligibility.ok){alert(eligibility.message);return}if(state.offers.some(item=>item.player.toLowerCase()===directOfferButton.dataset.sendOffer.toLowerCase()&&item.teamId===eligibility.team.id&&item.status==='pendiente')){alert('Ya tienes una oferta pendiente para este jugador.');return}openOfferComposer(directOfferButton.dataset.sendOffer);return}
    const playerCard=event.target.closest('[data-player-profile]');
    if(playerCard){const account=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(playerCard.dataset.playerProfile)),assignedTeam=state.teams.find(item=>(item.players||[]).some(player=>toPlayerKey(player)===toPlayerKey(account?.username))),positions=Array.isArray(account?.position)?account.position:[account?.position].filter(Boolean),enabled=Array.isArray(account?.enabledDivisions)?account.enabledDivisions:(account?.division?[String(account.division)]:[]),detail=document.getElementById('playerDetail');if(detail&&account)detail.innerHTML='<div class="player-detail"><div class="player-detail-head"><img class="player-detail-avatar" src="https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(account.username)+'&size=m&direction=2&head_direction=2&gesture=sml&action=std" alt="Keko de '+account.username+'"><div><div class="player-detail-name">'+account.username+'</div><div class="player-detail-meta">GRL '+calculateGRL(account.username)+' Â· '+(positions.join(' Â· ')||'Sin posiciÃ³n')+' Â· DivisiÃ³n '+(account.division||'Sin asignar')+' Â· Habilitado: '+(enabled.join(', ')||'Ninguna')+' Â· '+(assignedTeam?assignedTeam.name:'Agente libre')+'</div></div></div><div class="player-detail-actions"><button class="btn btn-primary" data-send-offer="'+account.username+'">Mandar oferta</button></div></div>';detail.scrollIntoView({behavior:'smooth',block:'nearest'});return}
    if(event.target.id==='logoutButton'){
      session=null;
      localStorage.removeItem('hfa:session');
      nav();
      content();
      return;
    }
    if(event.target.closest('#saveCompetition')){
      const name=document.getElementById('competitionInput').value.trim();
      if(name){state.competition=name;await setJSON('competition',name);content()}
      return;
    }
    if(event.target.closest('#createTournament')){
      const name=document.getElementById('newTournamentName').value.trim(),season=document.getElementById('newTournamentSeason').value.trim();
      if(name){const tournament={id:Date.now().toString(36),name,season};state.tournaments.push(tournament);activeTournamentId=tournament.id;await setJSON('tournaments',state.tournaments);localStorage.setItem('hfa:activeTournament',activeTournamentId);nav();content()}
      return;
    }
    if(event.target.closest('#saveActiveTournament')){
      activeTournamentId=document.getElementById('activeTournamentSelect').value;localStorage.setItem('hfa:activeTournament',activeTournamentId);nav();content();return;
    }
    const tournamentButton=event.target.closest('[data-select-tournament]');
    if(tournamentButton){activeTournamentId=tournamentButton.dataset.selectTournament;localStorage.setItem('hfa:activeTournament',activeTournamentId);nav();content();return}
    if(event.target.closest('#assignOwner')){
      const selectedTeam=state.teams.find(item=>item.id===document.getElementById('ownerTeam').value);
      const username=document.getElementById('ownerAccount').value;
      const account=accounts.find(item=>item.username===username);
      if(selectedTeam&&account){selectedTeam.ownerUsername=username;account.role='dueno';await setJSON('teams',state.teams);await setJSON('accounts',accounts);content()}
      return;
    }
    const saveRoleButton=event.target.closest('[data-save-user-role]');
    if(saveRoleButton){
      const username=saveRoleButton.dataset.saveUserRole,roleSelect=document.querySelector('[data-user-role="'+CSS.escape(username)+'"]'),row=saveRoleButton.closest('.admin-player-row'),divisionButton=row?.querySelector('[data-user-division-choice].active'),account=accounts.find(item=>item.username===username);
      if(account&&roleSelect){account.role=roleSelect.value;account.division=divisionButton?.dataset.division||'';account.enabledDivisions=[...row.querySelectorAll('[data-user-enabled-choice].active')].map(button=>button.dataset.division);await setJSON('accounts',accounts);if(session?.username===username){session.role=account.role;localStorage.setItem('hfa:session',JSON.stringify(session));nav()}content();prepareAdminDivisions()}
      return;
    }
    const saveDivisionButton=event.target.closest('[data-save-user-division]');
    if(saveDivisionButton){
      const username=saveDivisionButton.dataset.saveUserDivision,row=saveDivisionButton.closest('.admin-division-result'),assigned=[...row.querySelectorAll('[data-user-assigned-choice].active')].map(button=>button.dataset.division),enabled=[...row.querySelectorAll('[data-user-enabled-choice].active')].map(button=>button.dataset.division),account=accounts.find(item=>item.username===username);
      if(account){account.assignedDivisions=assigned;account.division=assigned[0]||'';account.enabledDivisions=enabled;await setJSON('accounts',accounts);content()}
      return;
    }
    if(event.target.closest('#addSponsor')){
      const sponsor=document.getElementById('sponsorInput').value.trim();
      if(sponsor){state.sponsors.push(sponsor);await setJSON('sponsors',state.sponsors);content()}
      return;
    }
    if(event.target.closest('#addPalmares')&&session?.role==='admin'){
      const title=document.getElementById('palmaresTitle').value.trim(),category=document.getElementById('palmaresCategory').value;
      if(title){state.palmares.push({id:Date.now().toString(36),title,category,team:document.getElementById('palmaresTeam').value.trim(),player:document.getElementById('palmaresPlayer').value.trim(),image:document.getElementById('palmaresImage').value.trim(),description:document.getElementById('palmaresDescription').value.trim()});await setJSON('palmares',state.palmares);content()}
      return;
    }
    if(event.target.closest('#addNews')&&session?.role==='admin'){
      const title=document.getElementById('newsTitle').value.trim(),description=document.getElementById('newsDescription').value.trim();
      const imageInput=document.getElementById('newsImage'),fileInput=document.getElementById('newsImageFile'),file=fileInput?.files?.[0];
      if(title&&description){
        const saveNews=image=>{state.news.unshift({id:Date.now().toString(36),title,description,image,createdAt:Date.now()});setJSON('news',state.news).then(content)};
        if(file){const reader=new FileReader();reader.onload=()=>saveNews(String(reader.result||''));reader.readAsDataURL(file)}else saveNews(imageInput.value.trim());
      }
      return;
    }
    const deletePalmares=event.target.closest('[data-delete-palmares]');
    if(deletePalmares&&session?.role==='admin'){state.palmares=state.palmares.filter(item=>item.id!==deletePalmares.dataset.deletePalmares);await setJSON('palmares',state.palmares);content();return}
    const deleteNews=event.target.closest('[data-delete-news]');
    if(deleteNews&&session?.role==='admin'){state.news=state.news.filter(item=>item.id!==deleteNews.dataset.deleteNews);await setJSON('news',state.news);content();return}
    const deleteMatchButton=event.target.closest('[data-delete-match]');
    if(deleteMatchButton&&session?.role==='admin'){
      state.matches=state.matches.filter(match=>match.id!==deleteMatchButton.dataset.deleteMatch);
      await setJSON('matches',state.matches);selectedActaMatchId=null;content();return;
    }
    const acceptOfferButton=event.target.closest('[data-accept-offer]');
    if(acceptOfferButton){
      const offer=state.offers.find(item=>item.id===acceptOfferButton.dataset.acceptOffer&&item.player.toLowerCase()===session?.username.toLowerCase());
      if(offer){offer.status='aceptada';const offerTeam=team(offer.teamId);if(offerTeam){offerTeam.players=offerTeam.players||[];if(!offerTeam.players.some(player=>player.toLowerCase()===session.username.toLowerCase()))offerTeam.players.push(session.username);await setJSON('teams',state.teams)}await setJSON('offers',state.offers);content()}
      return;
    }
    const offerButton=event.target.closest('[data-send-offer]');
    if(offerButton){
      const owned=state.teams.find(item=>item.ownerUsername===session?.username);
      const terms=document.getElementById('contractTerms')?.value.trim()||'Contrato pendiente de condiciones';
      if(owned){state.offers.push({id:Date.now().toString(36),teamId:owned.id,player:offerButton.dataset.sendOffer,ownerUsername:session.username,terms,status:'pendiente'});await setJSON('offers',state.offers);offerButton.textContent='Oferta enviada';offerButton.disabled=true}
      return;
    }
    if(event.target.id==='sendOffer'){
      const player=document.getElementById('playerOfferSelect').value.trim();
      const selectedTeam=state.teams.find(item=>item.ownerUsername===session?.username)||(session?.role==='admin'?state.teams[0]:null);
      const assignedNames=new Set(state.teams.flatMap(item=>item.players||[]).map(name=>name.toLowerCase()));
      const knownPlayer=accounts.some(account=>account.username.toLowerCase()===player.toLowerCase())&&!assignedNames.has(player.toLowerCase());
      const hint=document.getElementById('offerHint');
      if(!player){hint.textContent='Selecciona un jugador registrado.';hint.classList.add('error');return}
      if(!selectedTeam){hint.textContent='No tienes un equipo asignado.';hint.classList.add('error');return}
      if(!knownPlayer){hint.textContent='Ese jugador no estÃ¡ registrado en las plantillas o actas.';hint.classList.add('error');return}
      state.offers.push({id:Date.now().toString(36),teamId:selectedTeam.id,player,ownerUsername:session.username,terms:document.getElementById('contractTerms').value.trim()||'Contrato pendiente de condiciones',status:'pendiente'});
      await setJSON('offers',state.offers);hint.classList.remove('error');hint.textContent='Oferta enviada correctamente a '+player+'.';return;
    }
    if(event.target.closest('#addTeam')){
      const name=document.getElementById('newTeamName').value.trim();
      const division=document.getElementById('newTeamDivision').value;
      const players=(document.getElementById('newTeamPlayers')?.value||'').split(',').map(item=>item.trim()).filter(Boolean);
      const crest=document.getElementById('newTeamCrest')?.value.trim()||'';
      if(name&&!state.teams.some(item=>item.name.toLowerCase()===name.toLowerCase())){state.teams.push({id:Date.now().toString(36),name,division,players,crest});await setJSON('teams',state.teams);content()}
      return;
    }
    const roundChoice=event.target.closest('[data-round-choice]');
    if(roundChoice){adminRound=Number(roundChoice.dataset.roundChoice)||1;content();return}
    if(event.target.closest('[data-new-round]')){adminRound=Math.max(0,...state.matches.filter(item=>String(item.division||'')===matchDivision).map(item=>Number(item.round)||0))+1;content();return}
    if(event.target.closest('[data-generate-round]')){
        const divisionTeams=teamsForMatchDivision(matchDivision);
      if(divisionTeams.length<2){alert('Necesitas al menos 2 equipos registrados en esta divisiÃ³n para generar jornadas.');return}
      const existingRounds=state.matches.filter(item=>String(item.division||team(item.teamAId)?.division||team(item.teamBId)?.division||'')===String(matchDivision)).map(item=>Number(item.round)||0);
      const firstRound=Math.max(0,...existingRounds)+1, roundsToGenerate=Math.max(1,divisionTeams.length-1);
      const generated=[];
      const rotation=divisionTeams.map(item=>item);
      for(let roundIndex=0;roundIndex<roundsToGenerate;roundIndex++){
        const round=firstRound+roundIndex;
        for(let index=0;index<Math.floor(rotation.length/2);index++){
          const home=rotation[index],away=rotation[rotation.length-1-index];
          if(!home||!away)continue;
          const local=(roundIndex+index)%2===0?home:away,visitor=local===home?away:home;
          const exists=state.matches.some(match=>String(match.division||'')===String(matchDivision)&&Number(match.round)===round&&((match.teamAId===local.id&&match.teamBId===visitor.id)||(match.teamAId===visitor.id&&match.teamBId===local.id)));
          const pending=generated.some(match=>Number(match.round)===round&&((match.teamAId===local.id&&match.teamBId===visitor.id)||(match.teamAId===visitor.id&&match.teamBId===local.id)));
          if(!exists&&!pending)generated.push({id:Date.now().toString(36)+roundIndex+'-'+index,teamAId:local.id,teamBId:visitor.id,home:local.name,away:visitor.name,date:'',time:'',round,division:matchDivision,tournamentId:activeTournamentId,finished:false,acta:'',attendance:{}});
        }
        rotation.splice(1,0,rotation.pop());
      }
      if(generated.length){state.matches.push(...generated);adminRound=firstRound;await setJSON('matches',state.matches);content()}else alert('Las jornadas de esta divisiÃ³n ya estÃ¡n generadas.');
      return;
    }
    if(event.target.closest('#createMatch')){
      const home=document.getElementById('matchHome').value.trim();
      const away=document.getElementById('matchAway').value.trim();
      const date=document.getElementById('matchDate').value.trim();
      const time=document.getElementById('matchTime')?.value||'';
      const round=document.getElementById('matchRound')?.value.trim()||'Jornada 1';
      const division=document.getElementById('matchDivision').value;
      if(home&&away&&home.toLowerCase()!==away.toLowerCase()){state.matches.push({id:Date.now().toString(36),home,away,date,time,round:adminRound,division,tournamentId:activeTournamentId,finished:false,acta:'',attendance:{}});await setJSON('matches',state.matches);content()}
      return;
    }
    const openActaButton=event.target.closest('[data-open-acta]');
    if(openActaButton){selectedActaMatchId=openActaButton.dataset.openActa;actaTab='goals';content();prepareAdminDivisions();return}
    const presentButton=event.target.closest('[data-present-match]');
    if(presentButton&&session){const match=state.matches.find(item=>item.id===presentButton.dataset.presentMatch),player=presentButton.dataset.presentPlayer,canConfirm=session.username.toLowerCase()===String(player||'').toLowerCase();const validPlayers=matchRegisteredPlayerNames(match);if(match&&player&&canConfirm&&validPlayers.has(player.toLowerCase())){match.attendance=match.attendance||{};match.attendance[player]=new Intl.DateTimeFormat([], {hour:'2-digit',minute:'2-digit'}).format(new Date());await setJSON('matches',state.matches);content()}return}
    const actaTabButton=event.target.closest('[data-acta-tab]');
    if(actaTabButton){actaTab=actaTabButton.dataset.actaTab;content();prepareAdminDivisions();return}
    if(event.target.id==='addActaPlayer')return;
    if(event.target.id==='addGoal'){
      if(!session||!['admin','arbitro'].includes(session.role))return;
      const match=state.matches.find(item=>item.id===selectedActaMatchId),player=document.getElementById('goalPlayer').value,assist=document.getElementById('goalAssist').value,minute=document.getElementById('goalMinute').value,side=document.getElementById('goalSide').value;
      if(match&&player&&minute!==''){match.goals=match.goals||[];match.goals.push({player,assist,minute,side});await setJSON('matches',state.matches);content()}
      return;
    }
    if(event.target.id==='addCard'){
      if(!session||!['admin','arbitro'].includes(session.role))return;
      const match=state.matches.find(item=>item.id===selectedActaMatchId),player=document.getElementById('cardPlayer').value,type=document.getElementById('cardType').value,minute=document.getElementById('cardMinute').value,side=document.getElementById('cardSide').value;
      if(match&&player){match.cards=match.cards||[];match.cards.push({player,type,minute,side});await setJSON('matches',state.matches);content()}
      return;
    }
    if(event.target.id==='addSub'){
      if(!session||!['admin','arbitro'].includes(session.role))return;
      const match=state.matches.find(item=>item.id===selectedActaMatchId),minute=document.getElementById('subMinute').value,side=document.getElementById('subSide').value,out=document.getElementById('subOut').value,entering=document.getElementById('subIn').value;
      if(match&&out&&entering){match.subs=match.subs||[];match.subs.push({minute,side,out,in:entering});await setJSON('matches',state.matches);content()}
      return;
    }
    if(event.target.id==='addLineup'){
      if(!session||!['admin','arbitro'].includes(session.role))return;
      const match=state.matches.find(item=>item.id===selectedActaMatchId),player=document.getElementById('lineupPlayer').value,side=document.getElementById('lineupSide').value,pos=normalizeActaPosition(document.getElementById('lineupPos').value),account=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(player)),registered=(Array.isArray(account?.position)?account.position:[account?.position].filter(Boolean)).map(normalizeActaPosition);
      const teamPlayers=side==='A'?(matchTeam(match,'A')?.players||[]):(matchTeam(match,'B')?.players||[]);
      if(match&&player&&teamPlayers.some(item=>toPlayerKey(playerName(item))===toPlayerKey(player))&&registered.includes(pos)){const key=side==='A'?'lineupA':'lineupB';match[key]=match[key]||[];if(match[key].length>=4)return;if(!match[key].some(item=>playerName(item).toLowerCase()===player.toLowerCase()))match[key].push({name:player,pos});await setJSON('matches',state.matches);content()}
      return;
    }
    if(event.target.id==='addMention'){
      if(!session||!['admin','arbitro'].includes(session.role))return;
      const match=state.matches.find(item=>item.id===selectedActaMatchId),player=document.getElementById('mentionPlayer').value;
      if(match&&player){match.mentions=match.mentions||[];match.mentions.push(player);await setJSON('matches',state.matches);content()}
      return;
    }
    const editActaButton=event.target.closest('[data-edit-acta]');
    if(editActaButton){const matchId=editActaButton.dataset.editActa;if(selectedActaMatchId===matchId){return}selectedActaMatchId=matchId;actaTab='goals';content();return}
    const saveActaButton=event.target.closest('[data-save-acta]');
    if(saveActaButton){
      if(!session||!['admin','arbitro'].includes(session.role))return;
      const match=state.matches.find(item=>item.id===saveActaButton.dataset.saveActa);
      if(match){
        match.mvp=document.getElementById('mvpInput')?.value.trim()||'';
        match.acta=document.getElementById('actaText')?.value.trim()||'';
        await setJSON('matches',state.matches);
        selectedActaMatchId=match.id;
        content();
      }
      return;
    }
    const deleteActaButton=event.target.closest('[data-delete-acta]');
    if(deleteActaButton){if(!session||!['admin','arbitro'].includes(session.role))return;if(!confirm('Â¿Eliminar todos los datos de esta acta?'))return;const match=state.matches.find(item=>item.id===deleteActaButton.dataset.deleteActa);if(match){match.goals=[];match.cards=[];match.subs=[];match.mentions=[];match.lineupA=[];match.lineupB=[];match.mvp='';match.acta='';match.scoreA=0;match.scoreB=0;match.finished=false;await setJSON('matches',state.matches);selectedActaMatchId=null;content()}return}
    const finalizeActaButton=event.target.closest('[data-finalize-acta]');
    if(finalizeActaButton){
      if(!session||!['admin','arbitro'].includes(session.role))return;
      const match=state.matches.find(item=>item.id===finalizeActaButton.dataset.finalizeActa);
      if(match){
        match.mvp=document.getElementById('mvpInput')?.value.trim()||match.mvp||'';
        match.acta=document.getElementById('actaText')?.value.trim()||match.acta||'';
        match.scoreA=(match.goals||[]).filter(goal=>goal.side==='A').length;
        match.scoreB=(match.goals||[]).filter(goal=>goal.side==='B').length;
        match.finished=true;
        await setJSON('matches',state.matches);
        selectedActaMatchId=null;
        content();
      }
      return;
    }
    const modeButton=event.target.closest('[data-auth-mode]');
    if(modeButton){authMode=modeButton.dataset.authMode;content();prepareAccountForm();return}
    if(event.target.id!=='authSubmit')return;
    const username=document.getElementById('authUsername').value.trim();
    const password=document.getElementById('authPassword').value;
    let position=[];try{position=JSON.parse(document.getElementById('authPosition')?.value||'[]')}catch(error){position=[]}
    const hint=document.getElementById('authHint');
    const validHabboName=/^[A-Za-z0-9._-]{3,25}$/;
    if(!validHabboName.test(username)){hint.textContent='Escribe un nombre de Habbo.es vÃ¡lido, de 3 a 25 caracteres y sin espacios.';hint.classList.add('error');return}
    if(password.length<6){hint.textContent='La contraseÃ±a debe tener al menos 6 caracteres.';hint.classList.add('error');return}
    if(authMode==='register'){
      const confirmation=document.getElementById('authPasswordConfirm').value;
      const country=document.getElementById('authCountry')?.value || '';
      if(password!==confirmation){hint.textContent='Las contraseÃ±as no coinciden.';hint.classList.add('error');return}
      if(!position.length){hint.textContent='Selecciona al menos una posiciÃ³n de juego.';hint.classList.add('error');return}
      if(!country){hint.textContent='Elige un paÃ­s para completar tu perfil.';hint.classList.add('error');return}
      if(accounts.some(account=>account.username.toLowerCase()===username.toLowerCase())){hint.textContent='Ese nombre ya estÃ¡ registrado. Inicia sesiÃ³n.';hint.classList.add('error');return}
      accounts.push({username,position,passHash:await hashPassword(password),role:accounts.length?'pendiente':'admin',country});
      await setJSON('accounts',accounts);
      hint.classList.remove('error');hint.textContent='Cuenta creada correctamente. Ya puedes iniciar sesiÃ³n.';authMode='login';content();return;
    }
    const accountRecord=accounts.find(account=>account.username.toLowerCase()===username.toLowerCase());
    if(!accountRecord||accountRecord.passHash!==await hashPassword(password)){hint.textContent='El nombre de usuario o la contraseÃ±a no son correctos.';hint.classList.add('error');return}
    session={username:accountRecord.username,role:accountRecord.role};
    try{localStorage.setItem('hfa:session',JSON.stringify(session))}catch(error){}
    location.href='afh-liga.html';
  });
  document.addEventListener('dragstart',function(event){
    if(!session||!['admin','arbitro'].includes(session.role))return;
    const player=event.target.closest('[data-drag-player]');
    if(player){const payload=JSON.stringify({name:decodeURIComponent(player.dataset.dragPlayer),side:player.dataset.dragSide});event.dataTransfer.setData('application/x-hfa-player',payload);event.dataTransfer.setData('text/plain',payload);event.dataTransfer.effectAllowed='move';return}
    const item=event.target.closest('[data-drag-team]');
    if(item)event.dataTransfer.setData('text/plain',item.dataset.teamName);
  });
  let selectedLineupPlayer=null;
  async function placeLineupPlayer(playerNameValue,playerSide,playerSlot){
    if(!session||!['admin','arbitro'].includes(session.role))return false;
    const board=playerSlot.closest('[data-acta-match]'),match=state.matches.find(item=>item.id===board?.dataset.actaMatch),side=playerSlot.dataset.dropPlayerSide,position=playerSlot.dataset.dropPosition,index=Number(playerSlot.dataset.dropIndex)||0;
    if(!match)return false;
    const account=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(playerNameValue)),registered=(Array.isArray(account?.position)?account.position:[account?.position].filter(Boolean)).map(normalizeActaPosition),allowed=registered.includes(normalizeActaPosition(position));
    if(!allowed||playerSide!==side)return false;
    const normalize=normalizeActaPosition;
    const sourceKey=playerSide==='A'?'lineupA':'lineupB';
    const targetKey=side==='A'?'lineupA':'lineupB';
    match[sourceKey]=match[sourceKey]||[];
    match[targetKey]=match[targetKey]||[];
    match[sourceKey]=match[sourceKey].filter(item=>playerName(item).toLowerCase()!==playerNameValue.toLowerCase());
    match[targetKey]=match[targetKey].filter(item=>playerName(item).toLowerCase()!==playerNameValue.toLowerCase());
    match[targetKey]=match[targetKey].filter(item=>!(normalize(item.pos)===position&&Number(item.slot||0)===index));
    match[targetKey].push({name:playerNameValue,pos:position,slot:index});
    await setJSON('matches',state.matches);content();return true;
  }
  document.addEventListener('dragover',function(event){
    const playerSlot=event.target.closest('[data-drop-player-side]');
    if(playerSlot){event.preventDefault();playerSlot.classList.add('drop-target');return}
    const slot=event.target.closest('[data-drop-slot]');
    if(slot){event.preventDefault();slot.classList.add('over')}
  });
  document.addEventListener('dragleave',function(event){
    const playerSlot=event.target.closest('[data-drop-player-side]');
    if(playerSlot)playerSlot.classList.remove('drop-target');
    const slot=event.target.closest('[data-drop-slot]');
    if(slot)slot.classList.remove('over');
  });
  document.addEventListener('drop',async function(event){
    if(!session||!['admin','arbitro'].includes(session.role))return;
    const playerSlot=event.target.closest('[data-drop-player-side]');
    if(playerSlot){
      event.preventDefault();playerSlot.classList.remove('drop-target');
      let payload;try{payload=JSON.parse(event.dataTransfer.getData('application/x-hfa-player')||event.dataTransfer.getData('text/plain'))}catch(error){payload=null}
      if(!payload)return;
      await placeLineupPlayer(payload.name,payload.side,playerSlot);return;
    }
    const slot=event.target.closest('[data-drop-slot]');
    if(!slot)return;
    event.preventDefault();slot.classList.remove('over');
    const teamName=event.dataTransfer.getData('text/plain');
    const input=document.getElementById(slot.dataset.dropSlot==='home'?'matchHome':'matchAway');
    const label=document.getElementById(slot.dataset.dropSlot==='home'?'homeDropLabel':'awayDropLabel');
    if(input&&label){input.value=teamName;label.textContent=teamName;slot.classList.add('has-team')}
  });
  document.addEventListener('change',function(event){
    if(event.target.id==='communityPageSelect'){const value=event.target.value; if(value) location.href='seccion.html?view=comunidad&sub='+encodeURIComponent(value); return}
    if(event.target.id==='publicMatchTournament'){publicMatchTournament=event.target.value;content();return}
    if(event.target.id==='publicMatchDivision'){publicMatchDivision=event.target.value;content();return}
    if(event.target.id==='publicMatchRound'){publicMatchRound=event.target.value;content();return}

    if(event.target.id==='actaMatch'){selectedActaMatchId=event.target.value;actaTab='goals';content();prepareAdminDivisions()}
    if(event.target.id==='lineupPlayer'){const account=accounts.find(item=>toPlayerKey(item.username)===toPlayerKey(event.target.value)),positions=(Array.isArray(account?.position)?account.position:[account?.position].filter(Boolean)).map(value=>value==='NEUTRO'?'MED':value),select=document.getElementById('lineupPos');if(select&&positions.length)select.innerHTML=positions.map(value=>'<option value="'+value+'">'+value+'</option>').join('')}
    if(event.target.id==='matchDivision'){matchDivision=event.target.value;content()}
    if(event.target.id==='adminTournamentFilter'||event.target.id==='adminRoundFilter'){
      const tournament=document.getElementById('adminTournamentFilter')?.value||'',round=document.getElementById('adminRoundFilter')?.value||'';
      document.querySelectorAll('[data-admin-match-row]').forEach(row=>{row.style.display=(!tournament||row.dataset.matchTournament===tournament)&&(!round||row.dataset.matchRound===round)?'':'none'});
    }
    if(event.target.id==='playerDirectoryGrl'){playerGrlFilter=event.target.value;renderPlayersDirectory()}
    if(event.target.id==='playerDirectoryFree'){playerFreeAgentFilter=event.target.value;renderPlayersDirectory()}
    if(event.target.id==='playerDirectoryCountrySearch'){playerCountrySearch=event.target.value;renderPlayersDirectory()}
  });
  document.addEventListener('input',function(event){
    if(event.target.id==='playerDirectorySearch'){playerSearch=event.target.value;renderPlayersDirectory();return}
    if(event.target.id==='adminPlayerSearch'){const query=event.target.value.toLowerCase();document.querySelectorAll('[data-admin-player]').forEach(row=>row.style.display=row.dataset.adminPlayer.includes(query)?'':'none');return}
    if(event.target.id==='adminDivisionSearch'){const query=event.target.value.toLowerCase().trim();document.querySelectorAll('#divisionManagement [data-admin-player]').forEach(row=>row.style.display=query&&row.dataset.adminPlayer.includes(query)?'':'none');return}
    if(event.target.id==='registeredPlayerSearch'){
      const query=event.target.value.toLowerCase();
      const assignedNames=new Set(state.teams.flatMap(item=>item.players||[]).map(player=>player.toLowerCase()));
      const players=accounts.filter(account=>account.role!=='admin'&&account.role!=='arbitro'&&!assignedNames.has(account.username.toLowerCase())).map(account=>account.username).filter(player=>player.toLowerCase().includes(query));
      document.getElementById('playerOfferSelect').innerHTML='<option value="">Selecciona un jugador</option>'+players.map(player=>'<option value="'+player+'">'+player+'</option>').join('');
      return;
    }
    if(event.target.id!=='playerSearch')return;
    const query=event.target.value.toLowerCase();
    const owned=session?.role==='admin'?state.teams:state.teams.filter(item=>item.ownerUsername===session?.username);
    const players=[...new Set(owned.flatMap(item=>item.players||[]))].filter(player=>player.toLowerCase().includes(query));
    document.getElementById('playerResults').innerHTML=playerCards(players);
  });
  function normalizeDivisionLabels(root){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(node=>{node.nodeValue=node.nodeValue.replace(/DIVISIÃ“N\s+([1-4])/gi,'$1D').replace(/DIVISION\s+([1-4])/gi,'$1D')})}
  function syncAttendanceAvatars(root){root.querySelectorAll('.attendance-row img.mini-avatar').forEach(image=>{try{const username=new URL(image.src).searchParams.get('user');if(username)image.src='https://www.habbo.es/habbo-imaging/avatarimage?user='+encodeURIComponent(username)+'&size=m&headonly=1&direction=2&head_direction=2&gesture=sml&action=std'}catch(error){}})}
  const divisionLabelObserver=new MutationObserver(()=>{normalizeDivisionLabels(document.body);syncAttendanceAvatars(document);});divisionLabelObserver.observe(document.body,{childList:true,subtree:true});
  const communitySubTitle = { palmares:'PalmarÃ©s', noticias:'Noticias', equipos:'Equipos', jugadores:'Jugadores' };
  const communitySubDescription = {
    palmares:'Consulta los resultados mÃ¡s destacados y los duelos clave de la asociaciÃ³n.',
    noticias:'Lee la actualidad y las novedades mÃ¡s importantes de la liga.',
    equipos:'Consulta cada equipo y su clasificaciÃ³n dentro de la comunidad.',
    jugadores:'Busca, filtra y revisa a cada jugador de la asociaciÃ³n.'
  };
  const activeTitle = view === 'comunidad' && params.get('sub') ? (communitySubTitle[params.get('sub')] || 'Comunidad') : (labels[view] || 'SecciÃ³n');
  const activeIntro = view === 'comunidad' && params.get('sub') ? (communitySubDescription[params.get('sub')] || descriptions[view] || '') : (descriptions[view] || '');
  document.title='HFA Â· '+activeTitle;document.getElementById('title').textContent=activeTitle;document.getElementById('intro').textContent='';nav();
  (async function init(){accounts=await getJSON('accounts',[]);state.teams=await getJSON('teams',[]);state.matches=await getJSON('matches',[]);state.competition=await getJSON('competition','CompeticiÃ³n AFH');state.sponsors=await getJSON('sponsors',[]);state.offers=await getJSON('offers',[]);state.palmares=await getJSON('palmares',[]);state.news=await getJSON('news',[]);state.tournaments=await getJSON('tournaments',[{id:'default',name:state.competition,season:'Temporada actual'}]);if(!state.tournaments.length)state.tournaments=[{id:'default',name:state.competition,season:'Temporada actual'}];try{activeTournamentId=localStorage.getItem('hfa:activeTournament')||state.tournaments[0].id;session=JSON.parse(localStorage.getItem('hfa:session')||'null')}catch(error){}nav();content();if(view==='buzon')document.getElementById('content').innerHTML=mailboxPage();prepareAccountForm();prepareAdminDivisions();if(session&&view==='cuenta'){await hydrateProfile();if(params.get('tab')==='buzon'){document.querySelector('.profile-layout')?.style.setProperty('display','none');document.querySelector('.mailbox-panel')?.classList.add('mailbox-visible');document.querySelector('.free-agent-block')?.classList.add('mailbox-visible')}}})();
})();

