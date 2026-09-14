const state={agents:[],clusters:{},tasks:[],selected:null,query:'',department:'',task:''};
const $=id=>document.getElementById(id);
const list=value=>Array.isArray(value)?value.filter(Boolean):[];
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const searchable=agent=>[agent.name,agent.role,agent.department,agent.shortDescription,...list(agent.useCases),...list(agent.outputs),...list(agent.skills)].join(' ').toLowerCase();

function validate(data){
  const errors=[];
  const agents=Array.isArray(data?.agents)?data.agents:[];
  const ids=agents.map(agent=>agent.id);
  const seen=[];
  if(agents.length!==20) errors.push(`Erwartet: 20 Agenten, gefunden: ${agents.length}.`);
  if(new Set(ids).size!==ids.length) errors.push('Agenten-IDs sind nicht eindeutig.');
  if(Object.keys(data?.clusters||{}).length!==6) errors.push('Erwartet: sechs Themencluster.');
  for(const agent of agents){
    for(const field of ['id','name','role','department','cluster','shortDescription']) if(!agent[field]) errors.push(`Pflichtfeld fehlt bei ${agent.name||agent.id||'unbekannt'}: ${field}.`);
    if(!data.clusters?.[agent.cluster]) errors.push(`Ungültiger Cluster bei ${agent.name||agent.id}.`);
  }
  for(const [cluster,clusterIds] of Object.entries(data?.clusters||{})){
    for(const id of clusterIds){
      if(!ids.includes(id)) errors.push(`Cluster ${cluster} verweist auf unbekannte ID ${id}.`);
      if(seen.includes(id)) errors.push(`Agent ${id} erscheint mehrfach in der Landkarte.`);
      seen.push(id);
    }
  }
  if(seen.length!==agents.length) errors.push('Nicht jeder Agent ist genau einem Cluster zugeordnet.');
  return errors;
}

function showError(errors){
  $('appStatus').innerHTML=`<div class="panel error-box"><strong>Die Bibliothek konnte nicht vollständig geladen werden.</strong><p>${errors.map(esc).join('<br>')}</p><button class="secondary-button" type="button" onclick="location.reload()">Erneut versuchen</button></div>`;
  $('main').setAttribute('aria-busy','false');
}

function renderTasks(){
  $('taskGrid').innerHTML=state.tasks.map(task=>`<button class="task-button${state.task===task.id?' active':''}" type="button" data-task="${esc(task.id)}" aria-pressed="${state.task===task.id}"><strong>${esc(task.title)}</strong><span>${esc(task.text)}</span></button>`).join('');
  $('taskGrid').querySelectorAll('[data-task]').forEach(button=>button.addEventListener('click',()=>{state.task=state.task===button.dataset.task?'':button.dataset.task;renderAll();}));
}

function renderMap(){
  $('mapGrid').innerHTML=Object.entries(state.clusters).map(([cluster,ids])=>`<div class="map-group"><div class="map-group-head">${esc(cluster)}<small>${ids.length} Agenten</small></div><div class="map-nodes">${ids.map(id=>{const agent=state.agents.find(item=>item.id===id);return agent?`<button class="map-node${state.selected===agent.id?' active':''}" type="button" data-agent="${esc(agent.id)}" aria-label="Profil von ${esc(agent.name)} öffnen">${esc(agent.name)}</button>`:'';}).join('')}</div></div>`).join('');
  $('mapGrid').querySelectorAll('[data-agent]').forEach(button=>button.addEventListener('click',()=>selectAgent(button.dataset.agent,true)));
}

function renderFilter(){
  const departments=[...new Set(state.agents.map(agent=>agent.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));
  $('departmentFilter').innerHTML='<option value="">Alle Fachbereiche</option>'+departments.map(department=>`<option value="${esc(department)}">${esc(department)}</option>`).join('');
  $('departmentFilter').value=state.department;
}

function taskMatches(agent){
  if(!state.task) return true;
  const keywords={
    strategie:['strategie','positionierung','initiative','angebot','prozess'],
    kampagne:['kampagne','kreativ','launch'],
    content:['content','copy','social','redaktion','text'],
    daten:['daten','analyst','crm','pipeline','funnel','paid media'],
    kunde:['kunde','research','gespräch','perspektive'],
    betrieb:['agent','onboarding','qualität','marke','recht','compliance']
  }[state.task]||[];
  return keywords.some(keyword=>searchable(agent).includes(keyword));
}

function matches(agent){
  if(state.department&&agent.department!==state.department) return false;
  if(!taskMatches(agent)) return false;
  return !state.query||searchable(agent).includes(state.query.toLowerCase());
}

function matchReason(agent){
  if(state.task){
    const task=state.tasks.find(item=>item.id===state.task);
    return task?`Vorschlag für die Aufgabe „${task.title}“ – redaktionelle Orientierung.`:'';
  }
  if(state.query){
    const query=state.query.toLowerCase();
    if(agent.role.toLowerCase().includes(query)) return 'Treffer in der Rollenbeschreibung.';
    if(agent.department.toLowerCase().includes(query)) return 'Treffer im Fachbereich.';
    if(list(agent.useCases).some(item=>item.toLowerCase().includes(query))) return 'Treffer in typischen Aufgaben.';
    return 'Treffer in der öffentlichen Agentenbeschreibung.';
  }
  return '';
}

function renderCards(){
  const visible=state.agents.filter(matches);
  $('resultStatus').innerHTML=`<strong>${visible.length}</strong> von ${state.agents.length} Agenten angezeigt${state.query?` · Suche: „${esc(state.query)}“`:''}${state.task?` · Aufgabe: „${esc(state.tasks.find(item=>item.id===state.task)?.title||'')}“`:''}`;
  $('cards').innerHTML=visible.length?visible.map(agent=>`<button class="card-button" type="button" data-agent="${esc(agent.id)}" aria-selected="${state.selected===agent.id}"><span class="card-row"><span class="avatar">${esc(agent.initials)}</span><span class="card-main"><span class="card-name">${esc(agent.name)}</span><span class="card-role">${esc(agent.role)}</span></span><span class="card-dept">${esc(agent.department)}</span></span><span class="card-desc">${esc(agent.shortDescription)}</span>${matchReason(agent)?`<span class="match-reason">${esc(matchReason(agent))}</span>`:''}</button>`).join(''):'<div class="empty"><strong>Keine passenden Agenten gefunden.</strong><p>Entferne einzelne Filter oder starte eine neue Suche.</p><button class="secondary-button" type="button" id="emptyReset">Filter zurücksetzen</button></div>';
  $('cards').querySelectorAll('[data-agent]').forEach(button=>button.addEventListener('click',()=>selectAgent(button.dataset.agent,true)));
  $('emptyReset')?.addEventListener('click',reset);
}

function renderChips(){
  const chips=[];
  if(state.query) chips.push(`<span class="chip">Suche: ${esc(state.query)} <button type="button" data-clear="query" aria-label="Suche entfernen">×</button></span>`);
  if(state.department) chips.push(`<span class="chip">${esc(state.department)} <button type="button" data-clear="department" aria-label="Fachbereich entfernen">×</button></span>`);
  if(state.task) chips.push(`<span class="chip">${esc(state.tasks.find(item=>item.id===state.task)?.title||'Aufgabe')} <button type="button" data-clear="task" aria-label="Aufgabe entfernen">×</button></span>`);
  $('activeFilters').innerHTML=chips.join('');
  $('activeFilters').querySelectorAll('[data-clear]').forEach(button=>button.addEventListener('click',()=>{state[button.dataset.clear]='';if(button.dataset.clear==='query')$('searchInput').value='';renderAll();}));
}

function detailSection(label,value){return `<section class="detail-section"><h3 class="detail-label">${esc(label)}</h3><p class="detail-value">${esc(value||'Nicht verfügbar')}</p></section>`;}
function detailList(label,values){const items=list(values);return `<section class="detail-section"><h3 class="detail-label">${esc(label)}</h3>${items.length?`<ul class="detail-list">${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:'<p class="detail-value">Nicht verfügbar</p>'}</section>`;}

function renderDetail(){
  const agent=state.agents.find(item=>item.id===state.selected);
  if(!agent){$('detailContent').className='empty';$('detailContent').innerHTML='Wähle einen Agenten aus der Landkarte oder dem Katalog.';return;}
  $('detailContent').className='';
  $('detailContent').innerHTML=`<div class="detail-top"><div class="avatar">${esc(agent.initials)}</div><h2 id="detailTitle" tabindex="-1">${esc(agent.name)}</h2><p class="role">${esc(agent.role)}</p></div><div class="detail-body">${detailSection('Fachbereich & Cluster',`${agent.department} · ${agent.cluster}`)}${detailSection('Kurzbeschreibung',agent.shortDescription)}${detailList('Typische Aufgaben',agent.useCases)}${detailList('Geeignet für',agent.audience)}${detailList('Benötigte Eingaben',agent.inputs)}${detailList('Erwartete Ergebnisse',agent.outputs)}${detailList('Nicht geeignet für',agent.notFor)}${detailList('Grenzen & Ausschlüsse',agent.limitations)}${detailSection('Status',agent.status)}${detailSection('Verfügbarkeit',agent.availability)}${detailSection('Provenienz',agent.provenance)}${detailSection('Menschliche Prüfung',agent.humanReviewRequired)}${detailSection('Prompt / Konfiguration',agent.promptAvailability)}${detailSection('Start',agent.startUrl?'Startlink vorhanden.':(agent.startInstruction||'Startlink nicht öffentlich dokumentiert. Zugriff im zuständigen Workspace prüfen.'))}${agent.examplePrompt?`<section class="detail-section"><h3 class="detail-label">Beispielauftrag</h3><div class="copy-row"><div class="example">${esc(agent.examplePrompt)}</div><button class="copy-button" type="button" data-copy="${esc(agent.examplePrompt)}">Prompt kopieren</button></div></section>`:''}</div>`;
  const copyButton=$('detailContent').querySelector('[data-copy]');
  copyButton?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(agent.examplePrompt);copyButton.textContent='Kopiert';}catch{copyButton.textContent='Kopieren nicht möglich';}});
  requestAnimationFrame(()=>$('detailTitle')?.focus());
}

function selectAgent(id,updateUrl){
  if(!state.agents.some(agent=>agent.id===id)) return;
  state.selected=id;
  if(updateUrl) history.replaceState({},'',`?agent=${encodeURIComponent(id)}`);
  renderMap();renderCards();renderDetail();
  $('detailPanel').scrollIntoView({behavior:'smooth',block:'start'});
}
function reset(){state.query='';state.department='';state.task='';$('searchInput').value='';renderAll();}
function renderAll(){renderTasks();renderMap();renderFilter();renderCards();renderChips();renderDetail();}

async function init(){
  try{
    const response=await fetch('data/agents.json');
    if(!response.ok) throw new Error('Datenquelle nicht erreichbar.');
    const data=await response.json();
    const errors=validate(data);
    if(errors.length){showError(errors);return;}
    state.agents=data.agents;state.clusters=data.clusters;state.tasks=data.tasks||[];
    $('agentCount').textContent=state.agents.length;$('clusterCount').textContent=Object.keys(state.clusters).length;
    $('searchInput').addEventListener('input',event=>{state.query=event.target.value.trim();renderAll();});
    $('departmentFilter').addEventListener('change',event=>{state.department=event.target.value;renderAll();});
    $('resetButton').addEventListener('click',reset);
    $('mapToggle').addEventListener('click',event=>{const collapsed=$('mapGrid').dataset.collapsed==='true';$('mapGrid').dataset.collapsed=String(!collapsed);event.currentTarget.setAttribute('aria-expanded',String(collapsed));event.currentTarget.textContent=collapsed?'Landkarte einklappen':'Landkarte ausklappen';});
    const requested=new URLSearchParams(location.search).get('agent');
    renderAll();
    if(requested&&state.agents.some(agent=>agent.id===requested)) selectAgent(requested,false);
    $('appStatus').textContent='Bibliothek bereit.';
  }catch(error){showError([error.message||'Unbekannter Ladefehler.']);}
}
document.addEventListener('DOMContentLoaded',init);
