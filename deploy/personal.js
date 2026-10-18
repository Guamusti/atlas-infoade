/* Atlas · Personal
   Sección independiente (/personal o #personal) para tareas personales. El calendario muestra de base,
   en solo lectura, lo académico (exámenes y tareas de asignaturas) y encima las tareas personales.
   Las tareas personales viven en state.personalTasks: se sincronizan, pero nunca aparecen en el
   calendario académico de Atlas. */
(function(){
const css=`
.pe-overlay{position:fixed;inset:0;z-index:240;background:#eef1ec;overflow:auto;display:none;-webkit-overflow-scrolling:touch}
.pe-overlay.open{display:block}
.pe-main{max-width:1040px;margin:0 auto;padding:20px 16px 110px}
.pe-add{display:grid;grid-template-columns:1fr auto;gap:8px;background:#fff;border:2px solid #17201b;border-radius:14px;padding:12px;box-shadow:4px 4px 0 #17201b;margin-bottom:14px}
.pe-add input[type=text]{font:inherit;font-size:15px;padding:11px 12px;border:1.5px solid #aab5ae;border-radius:10px;min-width:0}
.pe-add-row{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.pe-add-row select,.pe-add-row input{font:inherit;font-size:13px;padding:7px 8px;border:1.5px solid #aab5ae;border-radius:8px;background:#fff}
.pe-quick{border:1.5px solid #17201b;background:#fffdf7;border-radius:99px;padding:6px 11px;font:700 12px var(--font,'DM Sans',sans-serif);cursor:pointer}
.pe-quick.on{background:var(--forest,#153c2d);color:var(--acid,#dfff59)}
.pe-chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.pe-chip{border:1.5px solid #17201b;background:#fff;border-radius:99px;padding:5px 11px;font:700 12px var(--font,'DM Sans',sans-serif);cursor:pointer;display:inline-flex;gap:6px;align-items:center}
.pe-chip i{width:9px;height:9px;border-radius:50%;background:var(--c);display:inline-block}
.pe-chip.on{background:#17201b;color:#fff}
.pe-group{margin:16px 0 6px;font:400 20px 'DM Serif Display',serif;color:var(--forest,#153c2d);display:flex;gap:8px;align-items:baseline}
.pe-group small{font:700 11px var(--font,'DM Sans',sans-serif);color:var(--muted,#53615a)}
.pe-group.late{color:#c2410c}
.pe-task{display:flex;gap:10px;align-items:flex-start;background:#fff;border:1.5px solid #17201b;border-left:6px solid var(--c);border-radius:12px;padding:10px 12px;margin-bottom:7px}
.pe-task.done{opacity:.55}.pe-task.done .pe-title{text-decoration:line-through}
.pe-check{flex:0 0 24px;width:24px;height:24px;border-radius:50%;border:2px solid #17201b;background:#fff;cursor:pointer;display:grid;place-items:center;font-size:13px;margin-top:1px}
.pe-task.done .pe-check{background:var(--green,#16855b);border-color:var(--green,#16855b);color:#fff}
.pe-body{flex:1;min-width:0;cursor:pointer}
.pe-title{font-weight:700;font-size:14.5px;color:#17201b;overflow-wrap:anywhere}
.pe-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;font-size:11px;color:var(--muted,#53615a);align-items:center}
.pe-tag{background:color-mix(in srgb,var(--c) 14%,white);color:#17201b;border-radius:99px;padding:2px 8px;font-weight:700}
.pe-prio{font-weight:800}.pe-prio.alta{color:#c2410c}.pe-prio.baja{color:#78857e}
.pe-late{color:#c2410c;font-weight:800}
.pe-prog{display:flex;gap:6px;align-items:center;margin-top:6px}.pe-prog span{flex:1;height:6px;border-radius:99px;background:#e3e8e4;overflow:hidden}.pe-prog span i{display:block;height:100%;background:var(--c)}
.pe-prog button{border:1.5px solid #17201b;background:#fffdf7;border-radius:8px;font:700 11px var(--font,'DM Sans',sans-serif);padding:3px 7px;cursor:pointer}
.pe-done-toggle{margin-top:14px}
.pe-cal-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.pe-cal-head h2{font:400 clamp(24px,5vw,32px) 'DM Serif Display',serif;margin:0;color:var(--forest,#153c2d);text-transform:capitalize}
.pe-cal-nav{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.pe-toggle{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;background:#fff;border:1.5px solid #17201b;border-radius:99px;padding:6px 11px;cursor:pointer}
.pe-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.pe-dow{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted,#53615a);text-align:center;padding:4px 0}
.pe-day{min-height:96px;background:#fff;border:1.5px solid #cbd3db;border-radius:10px;padding:5px;cursor:pointer;display:flex;flex-direction:column;gap:3px;min-width:0}
.pe-day.out{opacity:.45}.pe-day.today{border-color:#17201b;box-shadow:2px 2px 0 var(--orange,#ff6b3d)}.pe-day.sel{outline:3px solid var(--acid,#dfff59);outline-offset:-1px}
.pe-dn{font-size:11px;font-weight:800}
.pe-ev{font-size:10px;line-height:1.25;border-radius:5px;padding:2px 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pe-ev.ac{background:transparent;border:1px dashed var(--c);color:var(--c)}
.pe-ev.pt{background:var(--c);color:#fff}.pe-ev.pt.done{opacity:.45;text-decoration:line-through}
.pe-more{font-size:10px;color:var(--muted,#53615a)}
.pe-panel{margin-top:14px;background:#fff;border:2px solid #17201b;border-radius:14px;padding:14px;box-shadow:4px 4px 0 #17201b}
.pe-panel h3{font:400 22px 'DM Serif Display',serif;margin:0 0 8px;color:var(--forest,#153c2d);text-transform:capitalize}
.pe-sub{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted,#53615a);margin:12px 0 6px}
.pe-acrow{display:flex;gap:8px;align-items:center;font-size:13px;padding:7px 9px;border:1px dashed var(--c);border-radius:9px;margin-bottom:5px}
.pe-acrow b{color:var(--c)}.pe-acrow span{flex:1;min-width:0}
.pe-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--muted,#53615a);margin-top:8px}
.pe-legend i{display:inline-block;width:14px;height:9px;border-radius:3px;margin-right:4px;vertical-align:middle}
.pe-modal{position:fixed;inset:0;z-index:330;background:rgba(21,60,45,.52);display:flex;align-items:center;justify-content:center;padding:14px}
.pe-modal>form{width:min(520px,100%);max-height:90vh;overflow:auto;background:var(--paper,#fffdf7);border:2px solid #17201b;border-radius:14px;padding:18px;box-shadow:7px 7px 0 #17201b;display:grid;gap:10px}
.pe-modal h3{font:400 24px 'DM Serif Display',serif;margin:0}
.pe-modal label{display:grid;gap:4px;font-size:12px;font-weight:700}
.pe-modal input,.pe-modal select,.pe-modal textarea{font:inherit;font-size:14px;padding:9px;border:1.5px solid #aab5ae;border-radius:9px;background:#fff;min-width:0}
.pe-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pe-actions{display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;margin-top:4px}
.pe-actions div{display:flex;gap:8px}
@media(max-width:760px){.pe-day{min-height:62px;padding:3px}.pe-ev{font-size:0;height:6px;padding:0;border-radius:3px}.pe-ev.ac{border-width:2px}.pe-two{grid-template-columns:1fr}}
`;
const st=document.createElement('style');st.textContent=css;document.head.append(st);

const PALETTE=['#2155f5','#e5a700','#e83e8c','#13a678','#9b51e0','#ff6b3d','#00a6a6','#7a8f32','#c74b50','#536d78'];
const DEFAULT_CATS=['Trabajo','Marketing','Proyectos','Lectura','Personal'];
const PRIOS={alta:'Alta',media:'Media',baja:'Baja'};
const view=()=>document.getElementById('personalOverlay');
let calCursor=new Date(),selDay=null,catFilter='',showDone=false,quickDate='';
const showAcademic=()=>{try{return localStorage.getItem('atlas_personal_academic')!=='0'}catch(e){return true}};
const today=()=>localISO(new Date());
const addDays=(iso,n)=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return localISO(d)};
function tasks(){state.personalTasks=Array.isArray(state.personalTasks)?state.personalTasks:[];return state.personalTasks}
function cats(){const used=tasks().map(t=>t.cat).filter(Boolean);return [...new Set([...DEFAULT_CATS,...used])]}
function catColor(c){const all=cats(),i=Math.max(0,all.indexOf(c));return PALETTE[i%PALETTE.length]}
function fmtDate(iso){if(!iso)return 'Sin fecha';const t=today(),d=Math.round((new Date(iso+'T12:00:00')-new Date(t+'T12:00:00'))/86400000);if(d===0)return 'Hoy';if(d===1)return 'Mañana';if(d===-1)return 'Ayer';return new Date(iso+'T12:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'})}
async function save(msg){await idbSet();if(msg)toast(msg);route()}

/* ---------- Marco ---------- */
function shell(tab){
  let el=view();
  if(!el){el=document.createElement('div');el.id='personalOverlay';el.className='pe-overlay study-overlay';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Tareas personales');document.body.append(el)}
  if(!el.querySelector('.sp-bar')){
    el.innerHTML=`<header class="sp-bar"><button class="sp-brand" data-pe-go="#personal"><span class="sp-logo">03</span><span><b>Atlas · Personal</b><small>Tareas fuera de lo académico</small></span></button>
      <nav class="sp-tabs" aria-label="Secciones personales"><button data-pe-tab="tasks" data-pe-go="#personal">Tareas</button><button data-pe-tab="cal" data-pe-go="#personal/calendario">Calendario</button></nav>
      <button class="btn sp-exit" data-pe-exit>← Atlas</button></header><main class="pe-main" id="peMain"></main>`;
    el.addEventListener('click',ev=>{const g=ev.target.closest('[data-pe-go]');if(g){ev.preventDefault();go(g.dataset.peGo)}if(ev.target.closest('[data-pe-exit]'))leave()});
  }
  el.querySelectorAll('[data-pe-tab]').forEach(b=>b.classList.toggle('active',b.dataset.peTab===tab));
  el.classList.add('open');el.style.display='block';document.body.style.overflow='hidden';return el.querySelector('#peMain');
}
function close(){const el=view();if(el){el.classList.remove('open');el.style.display=''}if(!document.getElementById('studyOverlay')?.classList.contains('open'))document.body.style.overflow=''}
function go(h){if(location.hash!==h)location.hash=h;else route()}
function leave(){const path=location.pathname.replace(/\/personal\/?$/,'/');history.pushState(null,'',path+location.search);close()}

/* ---------- Fila de tarea ---------- */
function taskRow(t){
  const c=catColor(t.cat),late=!t.done&&t.date&&t.date<today(),p=t.total>0?Math.min(1,(t.cur||0)/t.total):null;
  return `<div class="pe-task ${t.done?'done':''}" style="--c:${c}">
    <button class="pe-check" data-pe-done="${t.id}" aria-label="${t.done?'Marcar pendiente':'Completar'}">${t.done?'✓':''}</button>
    <div class="pe-body" data-pe-edit="${t.id}"><div class="pe-title">${esc(t.title)}</div>
      <div class="pe-meta">${t.cat?`<span class="pe-tag">${esc(t.cat)}</span>`:''}<span class="${late?'pe-late':''}">${esc(fmtDate(t.date))}${t.time?' · '+esc(t.time):''}</span>${t.prio&&t.prio!=='media'?`<span class="pe-prio ${t.prio}">${t.prio==='alta'?'▲ Alta':'▽ Baja'}</span>`:''}${t.notes?'<span>✎ notas</span>':''}</div>
      ${p!==null?`<div class="pe-prog"><span><i style="width:${Math.round(p*100)}%"></i></span><b>${t.cur||0}/${t.total} ${esc(t.unit||'')}</b>${t.done?'':`<button data-pe-inc="${t.id}">+${t.step||1}</button>`}</div>`:''}
    </div></div>`;
}
function bindRows(root){
  root.querySelectorAll('[data-pe-done]').forEach(b=>b.onclick=async()=>{const t=tasks().find(x=>x.id===b.dataset.peDone);if(!t)return;t.done=!t.done;t.doneAt=t.done?new Date().toISOString():null;await save(t.done?'Tarea completada':null)});
  root.querySelectorAll('[data-pe-edit]').forEach(b=>b.onclick=()=>editTask(b.dataset.peEdit));
  root.querySelectorAll('[data-pe-inc]').forEach(b=>b.onclick=async ev=>{ev.stopPropagation();const t=tasks().find(x=>x.id===b.dataset.peInc);if(!t)return;t.cur=Math.min(t.total,(Number(t.cur)||0)+(Number(t.step)||1));if(t.cur>=t.total){t.done=true;t.doneAt=new Date().toISOString()}await save(t.done?'¡Objetivo completado!':null)});
}

/* ---------- Vista: tareas ---------- */
function renderTasks(){
  const main=shell('tasks'),t0=today(),all=tasks().filter(t=>!catFilter||t.cat===catFilter);
  const open=all.filter(t=>!t.done),done=all.filter(t=>t.done).sort((a,b)=>(b.doneAt||'').localeCompare(a.doneAt||''));
  const sortFn=(a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(a.time||'99').localeCompare(b.time||'99')||['alta','media','baja'].indexOf(a.prio||'media')-['alta','media','baja'].indexOf(b.prio||'media');
  const groups=[['Vencidas',open.filter(t=>t.date&&t.date<t0),'late'],['Hoy',open.filter(t=>t.date===t0)],['Próximos 7 días',open.filter(t=>t.date>t0&&t.date<=addDays(t0,7))],['Más adelante',open.filter(t=>t.date>addDays(t0,7))],['Sin fecha',open.filter(t=>!t.date)]];
  main.innerHTML=`<form class="pe-add" data-pe-add>
      <input type="text" name="title" placeholder="Nueva tarea… (p. ej. Acabar implementación Verifactu)" autocomplete="off" required>
      <button class="btn primary" type="submit">Añadir</button>
      <div class="pe-add-row">${[['','Sin fecha'],[t0,'Hoy'],[addDays(t0,1),'Mañana']].map(([v,l])=>`<button type="button" class="pe-quick ${quickDate===v?'on':''}" data-pe-qd="${v}">${l}</button>`).join('')}
        <input type="date" name="date" value="${quickDate}" aria-label="Fecha">
        <select name="cat" aria-label="Área">${cats().map(c=>`<option ${c===(catFilter||'Trabajo')?'selected':''}>${esc(c)}</option>`).join('')}</select>
        <select name="prio" aria-label="Prioridad">${Object.entries(PRIOS).map(([k,v])=>`<option value="${k}" ${k==='media'?'selected':''}>${v}</option>`).join('')}</select></div>
    </form>
    <div class="pe-chips"><button class="pe-chip ${catFilter?'':'on'}" data-pe-cat="">Todas · ${tasks().filter(t=>!t.done).length}</button>${cats().map(c=>{const n=tasks().filter(t=>!t.done&&t.cat===c).length;return n||catFilter===c?`<button class="pe-chip ${catFilter===c?'on':''}" data-pe-cat="${esc(c)}" style="--c:${catColor(c)}"><i></i>${esc(c)} · ${n}</button>`:''}).join('')}</div>
    ${open.length?groups.filter(([,l])=>l.length).map(([n,l,cls])=>`<div class="pe-group ${cls||''}">${n}<small>${l.length}</small></div>${l.sort(sortFn).map(taskRow).join('')}`).join(''):`<div class="empty">${tasks().length?'No tienes tareas pendientes aquí. 🎉':'Aún no hay tareas personales. Escribe la primera arriba.'}</div>`}
    ${done.length?`<button class="btn ghost pe-done-toggle" data-pe-showdone>${showDone?'Ocultar':'Ver'} completadas (${done.length})</button>${showDone?`<div style="margin-top:8px">${done.slice(0,50).map(taskRow).join('')}</div>`:''}`:''}`;
  const f=main.querySelector('[data-pe-add]');
  f.onsubmit=async ev=>{ev.preventDefault();const fd=new FormData(f),title=String(fd.get('title')||'').trim();if(!title)return;
    tasks().push({id:crypto.randomUUID(),title,date:String(fd.get('date')||''),time:'',cat:String(fd.get('cat')||''),prio:String(fd.get('prio')||'media'),notes:'',done:false,createdAt:new Date().toISOString()});
    quickDate=String(fd.get('date')||'');await save('Tarea añadida');view().querySelector('[data-pe-add] input[name=title]')?.focus()};
  main.querySelectorAll('[data-pe-qd]').forEach(b=>b.onclick=()=>{quickDate=b.dataset.peQd;f.querySelector('[name=date]').value=quickDate;main.querySelectorAll('[data-pe-qd]').forEach(x=>x.classList.toggle('on',x===b))});
  f.querySelector('[name=date]').onchange=e=>{quickDate=e.target.value;main.querySelectorAll('[data-pe-qd]').forEach(x=>x.classList.toggle('on',x.dataset.peQd===quickDate))};
  main.querySelectorAll('[data-pe-cat]').forEach(b=>b.onclick=()=>{catFilter=b.dataset.peCat;renderTasks()});
  main.querySelector('[data-pe-showdone]')?.addEventListener('click',()=>{showDone=!showDone;renderTasks()});
  bindRows(main);
}

/* ---------- Vista: calendario ---------- */
function academicFor(iso){
  if(!showAcademic())return [];
  const exams=getEvents().filter(e=>e.date===iso).map(e=>({kind:'exam',label:`${e.short} · ${e.name}`,color:subjectColor(SUBJECTS.find(s=>s.id===e.sid)||{id:e.sid}),sid:e.sid,conv:e.conv,index:e.index,extra:e.conv==='extraordinary'?'Extraordinaria':''}));
  const acTasks=(state.tasks||[]).filter(t=>!t.completed&&t.due===iso).map(t=>{const s=SUBJECTS.find(x=>x.id===t.subjectId);return {kind:'task',label:`${s?.short?s.short+' · ':''}${t.title}`,color:s?subjectColor(s):'#536d78',sid:s?.id}});
  return [...exams,...acTasks];
}
function renderCal(){
  const main=shell('cal'),y=calCursor.getFullYear(),m=calCursor.getMonth(),first=new Date(y,m,1),offset=(first.getDay()+6)%7,start=new Date(y,m,1-offset),t0=today();
  let cells='';
  for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const iso=localISO(d),ac=academicFor(iso),pt=tasks().filter(t=>t.date===iso),items=[...ac.map(a=>`<div class="pe-ev ac" style="--c:${a.color}" title="${esc(a.label)}">${esc(a.label)}</div>`),...pt.map(t=>`<div class="pe-ev pt ${t.done?'done':''}" style="--c:${catColor(t.cat)}" title="${esc(t.title)}">${esc(t.title)}</div>`)];
    cells+=`<div class="pe-day ${d.getMonth()!==m?'out':''} ${iso===t0?'today':''} ${iso===selDay?'sel':''}" data-pe-day="${iso}"><span class="pe-dn">${d.getDate()}</span>${items.slice(0,4).join('')}${items.length>4?`<span class="pe-more">+${items.length-4}</span>`:''}</div>`}
  main.innerHTML=`<div class="pe-cal-head"><h2>${new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(calCursor)}</h2>
      <div class="pe-cal-nav"><button class="icon-btn" data-pe-prev aria-label="Mes anterior">←</button><button class="btn" data-pe-today>Hoy</button><button class="icon-btn" data-pe-next aria-label="Mes siguiente">→</button>
      <label class="pe-toggle"><input type="checkbox" data-pe-ac ${showAcademic()?'checked':''}> Académico</label></div></div>
    <div class="pe-grid">${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=>`<div class="pe-dow">${d}</div>`).join('')}${cells}</div>
    <div class="pe-legend"><span><i style="border:1.5px dashed #2155f5"></i>Académico (solo lectura)</span><span><i style="background:#e83e8c"></i>Tus tareas</span></div>
    <div id="peDayPanel"></div>`;
  main.querySelector('[data-pe-prev]').onclick=()=>{calCursor=new Date(y,m-1,1);renderCal()};
  main.querySelector('[data-pe-next]').onclick=()=>{calCursor=new Date(y,m+1,1);renderCal()};
  main.querySelector('[data-pe-today]').onclick=()=>{calCursor=new Date();selDay=t0;renderCal()};
  main.querySelector('[data-pe-ac]').onchange=e=>{try{localStorage.setItem('atlas_personal_academic',e.target.checked?'1':'0')}catch(_){}renderCal()};
  main.querySelectorAll('[data-pe-day]').forEach(c=>c.onclick=()=>{selDay=c.dataset.peDay;renderCal();document.getElementById('peDayPanel')?.scrollIntoView({behavior:'smooth',block:'nearest'})});
  if(!selDay&&t0.slice(0,7)===localISO(first).slice(0,7))selDay=t0;
  if(selDay)renderDayPanel(selDay);
}
function renderDayPanel(iso){
  const box=document.getElementById('peDayPanel');if(!box)return;
  const ac=academicFor(iso),pt=tasks().filter(t=>t.date===iso).sort((a,b)=>(a.time||'99').localeCompare(b.time||'99'));
  box.innerHTML=`<section class="pe-panel"><h3>${new Date(iso+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</h3>
    ${showAcademic()?`<div class="pe-sub">Académico</div>${ac.length?ac.map(a=>`<div class="pe-acrow" style="--c:${a.color}"><span><b>${esc(a.label)}</b>${a.extra?` · ${esc(a.extra)}`:''}</span>${a.kind==='exam'&&a.sid?`<button class="btn" data-study-sid="${a.sid}" data-study-conv="${a.conv}" data-study-exam="${typeof a.index==='number'?a.index:''}">Estudiar</button>`:''}</div>`).join(''):'<div class="sp-muted">Nada académico este día.</div>'}`:''}
    <div class="pe-sub">Tus tareas</div>${pt.length?pt.map(taskRow).join(''):'<div class="sp-muted">Sin tareas personales este día.</div>'}
    <div class="pe-actions"><span></span><div><button class="btn primary" data-pe-newday>+ Tarea este día</button></div></div></section>`;
  bindRows(box);
  box.querySelector('[data-pe-newday]').onclick=()=>editTask(null,iso);
}

/* ---------- Editor ---------- */
function editTask(id,date){
  const t=id?tasks().find(x=>x.id===id):{title:'',date:date||'',time:'',cat:catFilter||'Trabajo',prio:'media',notes:''};if(!t)return;
  const m=document.createElement('div');m.className='pe-modal';
  m.innerHTML=`<form><h3>${id?'Editar tarea':'Nueva tarea'}</h3>
    <label>Tarea<input name="title" value="${esc(t.title)}" required autocomplete="off"></label>
    <div class="pe-two"><label>Fecha<input type="date" name="date" value="${esc(t.date||'')}"></label><label>Hora (opcional)<input type="time" name="time" value="${esc(t.time||'')}"></label></div>
    <div class="pe-two"><label>Área<input name="cat" list="peCats" value="${esc(t.cat||'')}" placeholder="Trabajo, Lectura…"><datalist id="peCats">${cats().map(c=>`<option value="${esc(c)}">`).join('')}</datalist></label>
      <label>Prioridad<select name="prio">${Object.entries(PRIOS).map(([k,v])=>`<option value="${k}" ${k===(t.prio||'media')?'selected':''}>${v}</option>`).join('')}</select></label></div>
    <div class="pe-two"><label>Objetivo (opcional)<input type="number" min="0" name="total" value="${t.total||''}" placeholder="p. ej. 120"></label><label>Unidad<input name="unit" value="${esc(t.unit||'')}" placeholder="páginas, leads…"></label></div>
    ${t.total?`<div class="pe-two"><label>Llevas<input type="number" min="0" name="cur" value="${t.cur||0}"></label><label>Avance por clic<input type="number" min="1" name="step" value="${t.step||1}"></label></div>`:'<input type="hidden" name="cur" value="0"><input type="hidden" name="step" value="1">'}
    <label>Notas<textarea name="notes" rows="3" placeholder="Enlaces, contexto, siguientes pasos…">${esc(t.notes||'')}</textarea></label>
    <div class="pe-actions">${id?'<button type="button" class="btn" data-del style="color:#c2410c">Eliminar</button>':'<span></span>'}<div><button type="button" class="btn" data-x>Cancelar</button><button class="btn primary" type="submit">Guardar</button></div></div></form>`;
  document.body.append(m);m.querySelector('[name=title]').focus();
  m.onclick=ev=>{if(ev.target===m||ev.target.closest('[data-x]'))m.remove()};
  m.querySelector('[data-del]')?.addEventListener('click',async()=>{if(!confirm('¿Eliminar esta tarea?'))return;state.personalTasks=tasks().filter(x=>x.id!==id);m.remove();await save('Tarea eliminada')});
  m.querySelector('form').onsubmit=async ev=>{ev.preventDefault();const fd=new FormData(ev.target),title=String(fd.get('title')).trim();if(!title)return;
    const total=Math.max(0,Number(fd.get('total'))||0),patch={title,date:String(fd.get('date')||''),time:String(fd.get('time')||''),cat:String(fd.get('cat')||'').trim(),prio:String(fd.get('prio')||'media'),notes:String(fd.get('notes')||'').trim(),total:total||undefined,unit:total?String(fd.get('unit')||'').trim():undefined,cur:total?Math.min(total,Number(fd.get('cur'))||0):undefined,step:total?Math.max(1,Number(fd.get('step'))||1):undefined};
    if(id)Object.assign(t,patch);else tasks().push({id:crypto.randomUUID(),...patch,done:false,createdAt:new Date().toISOString()});
    m.remove();await save(id?'Tarea actualizada':'Tarea añadida')};
}

/* ---------- Rutas ---------- */
function route(){
  const h=location.hash;
  if(!/^#personal(\/|$)/.test(h))return close();
  if(h==='#personal/calendario')return renderCal();
  return renderTasks();
}
document.addEventListener('click',ev=>{const b=ev.target.closest?.('[data-personal-home]');if(!b)return;ev.preventDefault();go('#personal')},true);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&view()?.classList.contains('open')&&!document.querySelector('.pe-modal'))leave()});
window.addEventListener('hashchange',route);
window.addEventListener('popstate',()=>{if(!/^#personal/.test(location.hash))close()});
if(/\/personal\/?$/.test(location.pathname)&&!/^#personal/.test(location.hash))history.replaceState(null,'',location.pathname+location.search+'#personal');
const start=()=>{const t=document.getElementById('storageText')?.textContent||'';if(t&&!/^Conectando/.test(t))route();else setTimeout(start,150)};
if(/^#personal/.test(location.hash))start();
window.atlasPersonalRefresh=()=>{if(view()?.classList.contains('open'))route()};
})();
