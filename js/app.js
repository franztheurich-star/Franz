const state={agents:[],clusters:{},tasks:[],selected:null,query:'',department:'',task:'',promptCache:{},requestToken:0};
const $=id=>document.getElementById(id);
const list=value=>Array.isArray(value)?value.filter(Boolean):[];
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const text=value=>Array.isArray(value)?value.join(' '):String(value??'');
const normalize=value=>text(value).toLowerCase();
const flat=value=>{if(Array.isArray(value))return value.map(flat).join(' ');if(value&&typeof value==='object')return Object.values(value).map(flat).join(' ');return String(value??'')};
const searchable=agent=>normalize([agent,agent.promptAvailability,agent.promptSource].map(flat));
const taskAgents={strategie:['wilhelm','max','elena','maximilian','branda'],kampagne:['nick','vera','mateo','antonia','berta','branda'],content:['samuel','klara','carl','alex'],daten:['lukas','leo'],kunde:['thomas','karla','karl'],betrieb:['helga','berta','branda','wilhelm']};
function validate(data){const errors=[],agents=Array.isArray(data?.agents)?data.agents:[],ids=agents.map(a=>a.id),seen=[];if(agents.length!==20)errors.push(`Erwartet: 20 Agenten, gefunden: ${agents.length}.`);if(new Set(ids).size!==ids.length)errors.push('Agenten-IDs sind nicht eindeutig.');if(Object.keys(data?.clusters||{}).length!==6)errors.push('Erwartet: sechs Themencluster.');for(const a of agents){for(const f of ['id','name','role','department','cluster','shortDescription'])if(!a[f])errors.push(`Pflichtfeld fehlt bei ${a.name||a.id||'unbekannt'}: ${f}.`);if(!data.clusters?.[a.cluster])errors.push(`Ungültiger Cluster bei ${a.name||a.id}.`);if(a.promptFile&&!a.promptAvailability)errors.push(`Promptstatus fehlt bei ${a.name}.`)}for(const [cluster,idsInCluster] of Object.entries(data?.clusters||{})){for(const id of idsInCluster){if(!ids.includes(id))errors.push(`Cluster ${cluster} verweist auf unbekannte ID ${id}.`);if(seen.includes(id))errors.push(`Agent ${id} erscheint mehrfach in der Landkarte.`);seen.push(id)}}if(seen.length!==agents.length)errors.push('Nicht jeder Agent ist genau einem Cluster zugeordnet.');return errors;}
function showError(errors){$('appStatus').innerHTML=`<div class="panel error-box"><strong>Die Bibliothek konnte nicht vollständig geladen werden.</strong><ul>${errors.map(esc).map(x=>`<li>${x}</li>`).join('')}</ul></div>`;}
function status(textValue,kind=''){const node=$('appStatus');node.className=`status-message ${kind}`;node.textContent=textValue||'';}
function taskReason(agent){if(!state.task)return '';const task=state.tasks.find(x=>x.id===state.task);return task&&taskAgents[state.task]?.includes(agent.id)?`Vorschlag für „${task.title}“ – redaktionelle Orientierung.`:'';}
function matches(agent){const q=normalize(state.query);const queryOk=!q||searchable(agent).includes(q);const depOk=!state.department||agent.department===state.department;const taskOk=!state.task||taskAgents[state.task]?.includes(agent.id);return queryOk&&depOk&&taskOk;}
function badge(label,kind=''){return `<span class="badge ${kind}">${esc(label)}</span>`;}
function renderStats(){
  $('agentCount').textContent=state.agents.length;
  $('promptCount').textContent=state.agents.filter(a=>a.promptFile).length;
  $('configCount').textContent=state.agents.filter(a=>list(a.configurationSkills).length||list(a.configurationIntegrations).length||list(a.screenshotEvidence).length).length;
  $('clusterCount').textContent=Object.keys(state.clusters).length;
}
function renderTasks(){
  $('taskGrid').innerHTML=state.tasks.map(task=>`<button class="task-card ${state.task===task.id?'active':''}" data-task="${esc(task.id)}" type="button"><strong>${esc(task.title)}</strong><span>${esc(task.text)}</span></button>`).join('');
  document.querySelectorAll('[data-task]').forEach(button=>button.addEventListener('click',()=>{state.task=state.task===button.dataset.task?'':button.dataset.task;renderTasks();renderAll();}));
}
function renderMap(){
  const entries=Object.entries(state.clusters);
  $('mapGrid').innerHTML=entries.map(([cluster,ids])=>`<section class="map-cluster"><div class="cluster-head"><h3>${esc(cluster)}</h3><span>${ids.length}</span></div><div class="map-agents">${ids.map(id=>{const a=state.agents.find(x=>x.id===id);return a?`<button class="map-agent ${state.selected===a.id?'active':''}" data-select="${esc(a.id)}" type="button"><span class="avatar small">${esc(a.initials||a.name.slice(0,1))}</span><span><strong>${esc(a.name)}</strong><small>${esc(a.role)}</small></span></button>`:''}).join('')}</div></section>`).join('');
  document.querySelectorAll('[data-select]').forEach(button=>button.addEventListener('click',()=>selectAgent(button.dataset.select)));
}
function renderFilters(){
  const departments=[...new Set(state.agents.map(a=>a.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));
  $('departmentFilter').innerHTML='<option value="">Alle Fachbereiche</option>'+departments.map(d=>`<option value="${esc(d)}" ${state.department===d?'selected':''}>${esc(d)}</option>`).join('');
  const filters=[];if(state.query)filters.push(`Suche: ${state.query}`);if(state.department)filters.push(`Fachbereich: ${state.department}`);if(state.task){const t=state.tasks.find(x=>x.id===state.task);if(t)filters.push(`Aufgabe: ${t.title}`)}
  $('activeFilters').innerHTML=filters.map(f=>`<span class="active-filter">${esc(f)}</span>`).join('');
}
function renderCards(){
  const visible=state.agents.filter(matches);
  $('resultStatus').innerHTML=`<strong>${visible.length}</strong> von ${state.agents.length} Agenten`;
  $('cards').innerHTML=visible.length?visible.map(a=>`<article class="agent-card ${state.selected===a.id?'active':''}"><button class="card-main" data-select="${esc(a.id)}" type="button"><span class="avatar">${esc(a.initials||a.name.slice(0,1))}</span><span class="card-copy"><strong>${esc(a.name)}</strong><span>${esc(a.role)}</span><small>${esc(a.shortDescription)}</small></span></button><div class="card-badges">${badge(a.status||'Status nicht angegeben','status')}${a.promptFile?badge('Prompt verfügbar','prompt'):badge('Prompt nicht verfügbar','muted')}${taskReason(a)?badge('Aufgabenvorschlag','task'):''}</div></article>`).join(''):'<div class="empty-results">Keine Agenten passen zu deiner Auswahl.</div>';
  document.querySelectorAll('[data-select]').forEach(button=>button.addEventListener('click',()=>selectAgent(button.dataset.select)));
}
function section(title,value,meta=''){if(!value||!text(value).trim())return '';return `<section class="detail-section"><div class="detail-label">${esc(title)}</div><div class="detail-value">${esc(text(value))}</div>${meta?`<div class="provenance">${esc(meta)}</div>`:''}</section>`;}
function listSection(title,values,meta=''){const items=list(values);if(!items.length)return '';return `<section class="detail-section"><div class="detail-label">${esc(title)}</div><ul class="detail-list">${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>${meta?`<div class="provenance">${esc(meta)}</div>`:''}</section>`;}
function evidence(title,values,source){return listSection(title,values,source||'Konfigurationsangabe aus dem bereitgestellten Profil.');}
function promptSection(agent){const available=!!agent.promptFile;return `<section class="detail-section prompt-section"><div class="prompt-heading"><div><div class="detail-label">Vollständiger Prompt</div><p class="prompt-note">${esc(agent.promptAvailability||'Promptstatus nicht angegeben.')}</p></div><button id="copyPrompt" class="copy-button" type="button" disabled>Prompt kopieren</button></div><div id="promptState" class="prompt-state">${available?'Prompt wird geladen …':'Für diesen Agenten ist kein separater Prompt in den bereitgestellten Unterlagen verfügbar.'}</div><textarea id="promptBox" class="prompt-box" readonly aria-label="Vollständiger Prompt von ${esc(agent.name)}" ${available?'':'disabled'}></textarea><div class="provenance">${esc(agent.promptSource||'Promptquelle nicht angegeben.')} · Öffentliche Fassung</div></section>`;}
function renderDetail(){
  const agent=state.agents.find(a=>a.id===state.selected);
  if(!agent){$('detailContent').className='empty';$('detailContent').innerHTML='Wähle einen Agenten aus der Landkarte oder dem Katalog.';return;}
  $('detailContent').className='';
  const configSource=agent.configurationSource||agent.provenance||'Angaben aus bereitgestellten Agentenunterlagen.';
  $('detailContent').innerHTML=`<div class="detail-top"><div class="avatar">${esc(agent.initials||agent.name.slice(0,1))}</div><h2 id="detailTitle" tabindex="-1">${esc(agent.name)}</h2><p class="role">${esc(agent.role)}</p><div class="detail-badges">${badge(agent.status||'Status nicht angegeben','status')}${badge(agent.department,'department')}${agent.promptFile?badge('Prompt verfügbar','prompt'):badge('Prompt nicht verfügbar','muted')}</div></div><div class="detail-body">${section('Fachbereich & Cluster',`${agent.department} · ${agent.cluster}`,configSource)}${section('Kurzbeschreibung',agent.shortDescription)}${section('Zweck & Ziel',agent.goal)}${section('Tonalität & Arbeitsweise',agent.tone)}${listSection('Typische Aufgaben',agent.useCases)}${listSection('Zielgruppe',agent.audience)}${listSection('Geeignete Eingaben',agent.inputs)}${listSection('Erwartete Ergebnisse',agent.outputs)}${listSection('Grenzen & Ausschlüsse',agent.limits||agent.limitations)}${listSection('Nicht geeignet für',agent.notFor)}${listSection('Befugnisse / Zuständigkeit',agent.authority)}${evidence('Skills',agent.skills||agent.configurationSkills,agent.configurationSkills?.length?'Aus Konfiguration gelesen.':'Nicht verfügbar.')}${evidence('Integrationen',agent.integrations||agent.configurationIntegrations,agent.configurationIntegrations?.length?'Aus Konfiguration gelesen.':'Nicht verfügbar.')}${evidence('Aktionen',agent.actions||agent.configurationActions,agent.configurationActions?.length?'Aus Konfiguration gelesen.':'Nicht verfügbar.')}${evidence('Wissensquellen & relevante Dateien',agent.informationSources||agent.files)}${evidence('Vorlagen',agent.templates)}${evidence('Zugeordnete Subagenten',agent.subagents)}${listSection('Offene Punkte',agent.openPoints,'Als offen bzw. nicht abschließend dokumentiert gekennzeichnet.')}${promptSection(agent)}</div>`;
  loadPrompt(agent);
  requestAnimationFrame(()=>{const title=$('detailTitle');if(title)title.focus();});
}
async function loadPrompt(agent){
  const token=++state.requestToken;
  const box=$('promptBox'),stateNode=$('promptState'),copy=$('copyPrompt');
  if(!box||!stateNode)return;
  if(!agent.promptFile)return;
  if(state.promptCache[agent.id]){setPrompt(agent,state.promptCache[agent.id]);return;}
  try{
    const response=await fetch(agent.promptFile,{cache:'no-store'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const prompt=await response.text();
    if(token!==state.requestToken||state.selected!==agent.id)return;
    state.promptCache[agent.id]=prompt;setPrompt(agent,prompt);
  }catch(error){
    if(token!==state.requestToken||state.selected!==agent.id)return;
    stateNode.className='prompt-state error';stateNode.textContent='Der Prompt konnte nicht geladen werden. Die Detaildaten bleiben verfügbar.';box.value='';if(copy)copy.disabled=true;
  }
}
function setPrompt(agent,prompt){
  const box=$('promptBox'),stateNode=$('promptState'),copy=$('copyPrompt');if(!box||!stateNode)return;box.value=prompt;stateNode.className='prompt-state success';stateNode.textContent='Prompt geladen.';if(copy){copy.disabled=false;copy.onclick=async()=>{try{await navigator.clipboard.writeText(prompt);copy.textContent='Kopiert';setTimeout(()=>copy.textContent='Prompt kopieren',1600);}catch(error){box.focus();box.select();document.execCommand('copy');copy.textContent='Kopiert';setTimeout(()=>copy.textContent='Prompt kopieren',1600);}};}}
function selectAgent(id){if(!state.agents.some(a=>a.id===id))return;state.selected=id;renderMap();renderCards();renderDetail();if(window.innerWidth<980)$('detailPanel').scrollIntoView({behavior:'smooth',block:'start'});}
function renderAll(){renderFilters();renderCards();renderMap();renderDetail();}
function reset(){state.query='';state.department='';state.task='';$('searchInput').value='';renderTasks();renderAll();}
async function init(){
  try{
    const response=await fetch('data/agents.json',{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();const errors=validate(data);if(errors.length)throw new Error(errors.join(' '));state.agents=data.agents;state.clusters=data.clusters;state.tasks=data.tasks||[];renderStats();renderTasks();renderAll();status('');
    $('searchInput').addEventListener('input',event=>{state.query=event.target.value;renderAll();});
    $('departmentFilter').addEventListener('change',event=>{state.department=event.target.value;renderAll();});
    $('resetButton').addEventListener('click',reset);
    $('mapToggle').addEventListener('click',()=>{const grid=$('mapGrid'),button=$('mapToggle'),collapsed=grid.classList.toggle('collapsed');button.setAttribute('aria-expanded',String(!collapsed));button.textContent=collapsed?'Landkarte ausklappen':'Landkarte einklappen';});
  }catch(error){showError([error.message||'Unbekannter Ladefehler.']);}
}
init();
