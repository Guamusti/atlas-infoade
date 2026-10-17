/* Atlas · Lobby de estudio
   Contenidos por prueba (guía docente) y estudio interactivo (resumen, tarjetas y test).
   El material vive en study/<asignatura>.json; el progreso se guarda en state.studyProgress
   y la asignación manual de temas en state.examTopics, ambos sincronizados con el resto del estado. */
(function(){
const css=`.study-overlay{position:fixed;inset:0;z-index:250;background:var(--paper,#fffdf7);overflow:auto;display:none;-webkit-overflow-scrolling:touch}
.study-overlay.open{display:block}
.study-top{position:sticky;top:0;z-index:2;display:flex;gap:14px;align-items:center;padding:16px max(16px,calc(50% - 440px));background:var(--paper,#fffdf7);border-bottom:2px solid #17201b}
.study-top h2{font:400 clamp(24px,5vw,34px)/1.05 'DM Serif Display',serif;margin:2px 0 0;color:var(--forest,#153c2d)}
.study-kicker{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--subject-color);display:flex;align-items:center;gap:6px}
.study-kicker .subject-color-dot{width:9px;height:9px;border-radius:50%;background:var(--subject-color);display:inline-block}
.study-body{max-width:880px;margin:0 auto;padding:18px 16px 90px}
.study-source{font-size:12px;color:var(--muted,#53615a);margin:10px 0 16px}
.study-conv{margin-bottom:6px}
.study-exams{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.study-exam{background:#fff;border:2px solid #17201b;border-radius:12px;padding:14px;box-shadow:4px 4px 0 #17201b;cursor:pointer;transition:transform .12s}
.study-exam:hover,.study-exam:focus{transform:translate(-2px,-2px);outline:none}
.study-exam.soon{background:#fff1ed}
.study-exam-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.study-exam-name{font-weight:700;font-size:15px;color:#17201b}
.study-exam-meta{font-size:11px;color:var(--muted,#53615a);margin-top:3px}
.study-exam-note{font-size:12px;color:var(--muted,#53615a);margin-top:10px}
.study-ring{--p:0;flex:0 0 44px;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--green,#16855b) calc(var(--p)*1%),#e3e8e4 0)}
.study-ring span{width:34px;height:34px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:10px;font-weight:800}
.study-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}
.study-chips span{font-size:10px;background:#eef2ef;border:1px solid #cbd3db;border-radius:99px;padding:3px 8px}
.study-assign{display:flex;gap:8px;margin:12px 0}
.study-modes{display:flex;gap:6px;margin:14px 0 10px;background:#eef2ef;border-radius:99px;padding:4px;width:max-content;max-width:100%}
.study-modes button{border:0;background:transparent;border-radius:99px;padding:8px 16px;font:700 13px var(--font,'DM Sans',sans-serif);cursor:pointer;color:#17201b}
.study-modes button.active{background:var(--forest,#153c2d);color:#fff}
.study-filter{display:flex;gap:8px;align-items:center;font-size:12px;margin-bottom:12px}
.study-filter select{flex:1;min-width:0;padding:8px;border:1px solid #aab5ae;border-radius:8px;background:#fff;font:inherit}
.study-topic{background:#fff;border:1.5px solid #17201b;border-radius:12px;padding:16px;margin:12px 0}
.study-topic-head{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.study-topic h3{font:400 21px/1.15 'DM Serif Display',serif;margin:0;color:var(--forest,#153c2d)}
.study-topic-pct{font-size:11px;font-weight:800;color:var(--green,#16855b)}
.study-label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--orange,#ff6b3d);margin:14px 0 6px}
.study-guide,.study-summary{margin:0;padding-left:18px;font-size:13px;line-height:1.55}
.study-guide li{color:var(--muted,#53615a)}
.study-summary li{margin:5px 0}
.study-count{font-size:11px;color:var(--muted,#53615a);margin-bottom:10px}
.study-card{display:flex;flex-direction:column;justify-content:center;gap:12px;width:100%;min-height:230px;padding:26px;border:2px solid #17201b;border-radius:16px;background:#fff;box-shadow:6px 6px 0 #17201b;text-align:left;cursor:pointer;font:inherit;color:#17201b}
.study-card.flipped{background:#f3ffd0}
.study-card-side{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--orange,#ff6b3d)}
.study-card-text{font-size:clamp(16px,3.6vw,21px);line-height:1.4}
.study-card-hint{font-size:11px;color:var(--muted,#53615a)}
.study-card-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
.study-q{font-size:clamp(16px,3.4vw,19px);font-weight:600;line-height:1.4;margin-bottom:14px}
.study-options{display:grid;gap:8px}
.study-options button{text-align:left;padding:12px 14px;border:1.5px solid #17201b;border-radius:10px;background:#fff;font:inherit;font-size:14px;cursor:pointer;color:#17201b}
.study-options button:hover:not(:disabled){background:#f3ffd0}
.study-options button.right{background:#dcf7e8;border-color:#16855b}
.study-options button.wrong{background:#ffe1d5;border-color:#d94b38}
.study-explain{margin-top:12px;padding:12px;border-radius:10px;font-size:13px;line-height:1.5}
.study-explain.ok{background:#dcf7e8}.study-explain.ko{background:#fff1ed}
.study-done{text-align:center;padding:40px 10px}
.study-big{font:400 64px/1 'DM Serif Display',serif;color:var(--forest,#153c2d)}
.study-picker{position:fixed;inset:0;z-index:320;background:rgba(21,60,45,.52);display:flex;align-items:center;justify-content:center;padding:14px}
.study-picker>div{width:min(520px,100%);max-height:85vh;overflow:auto;background:var(--paper,#fffdf7);border:2px solid #17201b;border-radius:14px;padding:20px;box-shadow:7px 7px 0 #17201b}
.study-picker h3{font:400 24px 'DM Serif Display',serif;margin:0 0 12px}
.study-picker label{display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-top:1px solid #cbd3db;font-size:13px}`;
const st=document.createElement('style');st.textContent=css;document.head.append(st);
const STUDY_CACHE={};
const view=()=>document.getElementById('studyOverlay');

async function loadStudy(sid){
  if(sid in STUDY_CACHE)return STUDY_CACHE[sid];
  try{const r=await fetch(`study/${encodeURIComponent(sid)}.json`,{cache:'no-cache'});STUDY_CACHE[sid]=r.ok?await r.json():null}catch(e){STUDY_CACHE[sid]=null}
  return STUDY_CACHE[sid];
}
function studyState(){state.examTopics=state.examTopics||{};state.studyProgress=state.studyProgress||{};return state}
const topicKey=(sid,tid)=>`${sid}/${tid}`;
function topicProgress(sid,t){
  const p=studyState().studyProgress[topicKey(sid,t.id)]||{},cards=t.cards?.length||0,known=Math.min((p.k||[]).length,cards);
  const parts=[];if(cards)parts.push(known/cards);if(t.quiz?.length)parts.push((p.q||0)/100);
  return parts.length?parts.reduce((a,x)=>a+x,0)/parts.length:0;
}
function examTopicIds(sid,conv,i,data){
  const manual=studyState().examTopics[`${sid}:${conv}:${i}`];if(Array.isArray(manual))return manual;
  if(!data)return [];
  const custom=state.config[`${sid}:${conv}`]||state.config[sid],official=OFFICIAL_EVALUATIONS[sid]?.[conv]?.exams?.[i],current=cfg(SUBJECTS.find(s=>s.id===sid),conv).exams[i];
  if(custom&&(!official||!current||official.name!==current.name))return [];
  return data.exams?.[conv]?.[i]?.topics||[];
}
function examNote(sid,conv,i,data){
  if(Array.isArray(studyState().examTopics[`${sid}:${conv}:${i}`]))return 'Temas elegidos por ti.';
  const custom=state.config[`${sid}:${conv}`]||state.config[sid],official=OFFICIAL_EVALUATIONS[sid]?.[conv]?.exams?.[i],current=cfg(SUBJECTS.find(s=>s.id===sid),conv).exams[i];
  if(custom&&(!official||!current||official.name!==current.name))return 'Prueba añadida o renombrada por ti: elige qué temas entran.';
  return data?.exams?.[conv]?.[i]?.note||ASSESSMENT_GUIDE[sid]?.[conv]?.[i]?.[1]||'';
}
const pct=x=>`${Math.round(x*100)}%`;
function daysTo(date){if(!date)return null;return Math.ceil((new Date(date+'T12:00:00')-new Date())/86400000)}
function dueLabel(date){const d=daysTo(date);if(d===null)return 'Sin fecha';const f=new Date(date+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'});return d<0?`${f} · pasada`:d===0?`${f} · hoy`:`${f} · en ${d} día${d===1?'':'s'}`}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function ensureOverlay(){
  let el=view();if(el)return el;
  el=document.createElement('div');el.id='studyOverlay';el.className='study-overlay';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
  document.body.append(el);return el;
}
function closeStudy(){const el=view();if(el)el.classList.remove('open');document.body.style.overflow=''}
function go(hash){if(location.hash!==hash)location.hash=hash;else route()}
function leave(){if(/^#estudio\//.test(location.hash))history.pushState(null,'',location.pathname+location.search);closeStudy()}

function header(s,title,sub,back){
  return `<header class="study-top" style="--subject-color:${subjectColor(s)}"><button class="icon-btn" data-study-back aria-label="Volver">${back?'←':'×'}</button><div><div class="study-kicker"><span class="subject-color-dot"></span>${esc(s.short)} · ${esc(sub)}</div><h2>${esc(title)}</h2></div></header>`;
}
async function renderLobby(sid,conv){
  const s=SUBJECTS.find(x=>x.id===sid);if(!s)return leave();
  const el=ensureOverlay(),data=await loadStudy(sid),c=cfg(s,conv);
  const exams=c.exams.map((e,i)=>({e,i,date:examDate(sid,conv,i)})).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
  const topicsById=Object.fromEntries((data?.topics||[]).map(t=>[t.id,t]));
  el.innerHTML=`${header(s,'Lobby de estudio',s.name,false)}
  <div class="study-body">
    <div class="segmented conv-tabs study-conv"><button data-study-conv="ordinary" class="${conv==='ordinary'?'active':''}">Ordinaria</button><button data-study-conv="extraordinary" class="${conv==='extraordinary'?'active':''}">Extraordinaria</button></div>
    ${data?`<p class="study-source">Contenidos según la ${esc(data.source)}. El material de estudio es de apoyo: contrástalo con los apuntes de clase.</p>`:`<p class="study-source">Aún no hay material interactivo para esta asignatura. Se muestran los contenidos que indica la guía para cada prueba.</p>`}
    <div class="study-exams">${exams.map(({e,i,date})=>{
      const ids=examTopicIds(sid,conv,i,data),topics=ids.map(id=>topicsById[id]).filter(Boolean),prog=topics.length?topics.reduce((a,t)=>a+topicProgress(sid,t),0)/topics.length:null,d=daysTo(date),soon=d!==null&&d>=0&&d<=7;
      return `<article class="study-exam ${soon?'soon':''}" data-study-exam="${i}" tabindex="0">
        <div class="study-exam-head"><div><div class="study-exam-name">${esc(e.name)}</div><div class="study-exam-meta">${Math.round(e.weight*100)}% · ${esc(dueLabel(date))}${Number(e.min)>0?` · mín. ${e.min}`:''}</div></div>${prog!==null?`<div class="study-ring" style="--p:${Math.round(prog*100)}"><span>${pct(prog)}</span></div>`:''}</div>
        ${topics.length?`<div class="study-chips">${topics.map(t=>`<span>${esc(t.title.replace(/^[^·]*·\s*/,''))}</span>`).join('')}</div>`:`<div class="study-exam-note">${esc(examNote(sid,conv,i,data)||'Sin temas asignados.')}</div>`}
      </article>`}).join('')}</div>
  </div>`;
  el.classList.add('open');document.body.style.overflow='hidden';
  el.querySelector('[data-study-back]').onclick=leave;
  el.querySelectorAll('[data-study-conv]').forEach(b=>b.onclick=()=>go(`#estudio/${sid}/${b.dataset.studyConv}`));
  el.querySelectorAll('[data-study-exam]').forEach(a=>{const open=()=>go(`#estudio/${sid}/${conv}/${a.dataset.studyExam}`);a.onclick=open;a.onkeydown=ev=>{if(ev.key==='Enter')open()}});
}

async function renderExam(sid,conv,i,mode,topicFilter){
  const s=SUBJECTS.find(x=>x.id===sid);if(!s)return leave();
  const el=ensureOverlay(),data=await loadStudy(sid),e=cfg(s,conv).exams[i];if(!e)return go(`#estudio/${sid}/${conv}`);
  const date=examDate(sid,conv,i),all=data?.topics||[],ids=examTopicIds(sid,conv,i,data),topics=ids.map(id=>all.find(t=>t.id===id)).filter(Boolean);
  const active=topicFilter?topics.filter(t=>t.id===topicFilter):topics,note=examNote(sid,conv,i,data);
  el.innerHTML=`${header(s,e.name,`${conv==='ordinary'?'Ordinaria':'Extraordinaria'} · ${Math.round(e.weight*100)}% · ${dueLabel(date)}`,true)}
  <div class="study-body">
    ${note?`<div class="history-note">${esc(note)}</div>`:''}
    ${data?`<div class="study-assign"><button class="btn" data-study-edit>Elegir temas</button>${Array.isArray(state.examTopics?.[`${sid}:${conv}:${i}`])?'<button class="btn ghost" data-study-reset>Usar los de la guía</button>':''}</div>`:''}
    ${!topics.length?`<div class="empty">${data?'Esta prueba no tiene temas asignados. Pulsa «Elegir temas».':'Sin material interactivo todavía.'}</div>`:`
    <div class="study-modes">${[['resumen','Resumen'],['tarjetas','Tarjetas'],['test','Test']].map(([m,l])=>`<button class="${mode===m?'active':''}" data-study-mode="${m}">${l}</button>`).join('')}</div>
    ${topics.length>1?`<label class="study-filter">Tema <select data-study-topic><option value="">Todos los de esta prueba (${topics.length})</option>${topics.map(t=>`<option value="${t.id}" ${t.id===topicFilter?'selected':''}>${esc(t.title)}</option>`).join('')}</select></label>`:''}
    <div id="studyPane"></div>`}
  </div>`;
  el.classList.add('open');document.body.style.overflow='hidden';
  el.querySelector('[data-study-back]').onclick=()=>go(`#estudio/${sid}/${conv}`);
  const base=`#estudio/${sid}/${conv}/${i}`;
  el.querySelectorAll('[data-study-mode]').forEach(b=>b.onclick=()=>go(`${base}/${b.dataset.studyMode}${topicFilter?'/'+topicFilter:''}`));
  el.querySelector('[data-study-topic]')?.addEventListener('change',ev=>go(`${base}/${mode}${ev.target.value?'/'+ev.target.value:''}`));
  el.querySelector('[data-study-edit]')?.addEventListener('click',()=>editTopics(sid,conv,i,all,ids));
  el.querySelector('[data-study-reset]')?.addEventListener('click',async()=>{delete state.examTopics[`${sid}:${conv}:${i}`];await idbSet();route()});
  const pane=el.querySelector('#studyPane');if(!pane)return;
  if(mode==='tarjetas')return renderCards(pane,sid,active);
  if(mode==='test')return renderQuiz(pane,sid,active);
  pane.innerHTML=active.map(t=>`<section class="study-topic"><div class="study-topic-head"><h3>${esc(t.title)}</h3><span class="study-topic-pct">${pct(topicProgress(sid,t))}</span></div>
    <div class="study-label">Contenidos de la guía docente</div><ul class="study-guide">${t.guide.map(g=>`<li>${esc(g)}</li>`).join('')}</ul>
    <div class="study-label">Claves para el examen</div><ul class="study-summary">${t.summary.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></section>`).join('');
}

function editTopics(sid,conv,i,all,ids){
  const pop=document.createElement('div');pop.className='study-picker';
  pop.innerHTML=`<div><h3>¿Qué temas entran?</h3>${all.map(t=>`<label><input type="checkbox" value="${t.id}" ${ids.includes(t.id)?'checked':''}> ${esc(t.title)}</label>`).join('')}<div class="day-detail-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Guardar</button></div></div>`;
  document.body.append(pop);
  pop.onclick=async ev=>{if(ev.target===pop||ev.target.closest('[data-x]'))return pop.remove();if(ev.target.closest('[data-ok]')){studyState().examTopics[`${sid}:${conv}:${i}`]=[...pop.querySelectorAll('input:checked')].map(x=>x.value);pop.remove();await idbSet();route()}};
}

function saveProgress(sid,tid,patch){const k=topicKey(sid,tid),cur=studyState().studyProgress[k]||{};state.studyProgress[k]={...cur,...patch,at:new Date().toISOString()};return idbSet()}

function renderCards(pane,sid,topics){
  const deck=shuffle(topics.flatMap(t=>t.cards.map((c,n)=>({t,n,q:c[0],a:c[1]}))));let pos=0,ok=0,flipped=false;
  const draw=()=>{
    if(pos>=deck.length){pane.innerHTML=`<div class="study-done"><div class="study-big">${ok}/${deck.length}</div><p>tarjetas que ya dominas en esta ronda.</p><button class="btn primary" data-again>Otra ronda</button></div>`;pane.querySelector('[data-again]').onclick=()=>renderCards(pane,sid,topics);return}
    const c=deck[pos],known=(state.studyProgress[topicKey(sid,c.t.id)]?.k||[]).includes(c.n);
    pane.innerHTML=`<div class="study-count">${pos+1} / ${deck.length} · ${esc(c.t.title)}${known?' · ✓ dominada':''}</div>
      <button class="study-card ${flipped?'flipped':''}" data-flip aria-label="Girar tarjeta"><span class="study-card-side">${flipped?'Respuesta':'Pregunta'}</span><span class="study-card-text">${esc(flipped?c.a:c.q)}</span><span class="study-card-hint">${flipped?'':'Toca para ver la respuesta'}</span></button>
      <div class="study-card-actions">${flipped?`<button class="btn" data-again-card>Repasar</button><button class="btn primary" data-know>Lo sé</button>`:'<button class="btn" data-skip>Saltar</button>'}</div>`;
    pane.querySelector('[data-flip]').onclick=()=>{flipped=!flipped;draw()};
    pane.querySelector('[data-skip]')?.addEventListener('click',()=>{pos++;flipped=false;draw()});
    pane.querySelector('[data-again-card]')?.addEventListener('click',async()=>{const k=(state.studyProgress[topicKey(sid,c.t.id)]?.k||[]).filter(x=>x!==c.n);await saveProgress(sid,c.t.id,{k});deck.push(c);pos++;flipped=false;draw()});
    pane.querySelector('[data-know]')?.addEventListener('click',async()=>{const k=[...new Set([...(state.studyProgress[topicKey(sid,c.t.id)]?.k||[]),c.n])];await saveProgress(sid,c.t.id,{k});ok++;pos++;flipped=false;draw()});
  };draw();
}

function renderQuiz(pane,sid,topics){
  const qs=shuffle(topics.flatMap(t=>t.quiz.map(q=>({t,...q}))));let pos=0;const score={};
  const draw=answered=>{
    if(pos>=qs.length){
      const total=qs.length,good=Object.values(score).reduce((a,x)=>a+x.ok,0);
      Promise.all(Object.entries(score).map(([tid,x])=>{const p=Math.round(x.ok/x.n*100),best=state.studyProgress[topicKey(sid,tid)]?.q||0;return p>best?saveProgress(sid,tid,{q:p}):null}));
      pane.innerHTML=`<div class="study-done"><div class="study-big">${good}/${total}</div><p>${good===total?'¡Perfecto!':good/total>=.5?'Vas bien. Repasa los fallos en el resumen.':'Conviene repasar el resumen y las tarjetas.'}</p><button class="btn primary" data-again>Repetir test</button></div>`;
      pane.querySelector('[data-again]').onclick=()=>renderQuiz(pane,sid,topics);return;
    }
    const q=qs[pos];
    pane.innerHTML=`<div class="study-count">Pregunta ${pos+1} / ${qs.length} · ${esc(q.t.title)}</div><div class="study-q">${esc(q.q)}</div>
      <div class="study-options">${q.o.map((o,n)=>`<button data-opt="${n}" class="${answered!==undefined?(n===q.a?'right':n===answered?'wrong':''):''}" ${answered!==undefined?'disabled':''}>${esc(o)}</button>`).join('')}</div>
      ${answered!==undefined?`<div class="study-explain ${answered===q.a?'ok':'ko'}"><b>${answered===q.a?'Correcto.':'Incorrecto.'}</b> ${esc(q.e||'')}</div><div class="study-card-actions"><button class="btn primary" data-next>${pos+1<qs.length?'Siguiente':'Ver resultado'}</button></div>`:''}`;
    pane.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.opt),sc=score[q.t.id]||(score[q.t.id]={ok:0,n:0});sc.n++;if(n===q.a)sc.ok++;draw(n)});
    pane.querySelector('[data-next]')?.addEventListener('click',()=>{pos++;draw()});
  };draw();
}

function route(){
  const m=location.hash.match(/^#estudio\/([\w-]+)(?:\/(ordinary|extraordinary)(?:\/(\d+)(?:\/(resumen|tarjetas|test)(?:\/([\w-]+))?)?)?)?$/);
  if(!m)return closeStudy();
  const [,sid,conv=state.activeConv,i,mode='resumen',topic]=m;
  if(i===undefined)renderLobby(sid,conv);else renderExam(sid,conv,Number(i),mode,topic);
}
window.openStudy=(sid,conv,i)=>{document.querySelectorAll('.day-detail-pop').forEach(x=>x.remove());if(document.getElementById('subjectModal')?.classList.contains('open'))closeModal();go(i===undefined||i===''?`#estudio/${sid}/${conv||state.activeConv}`:`#estudio/${sid}/${conv||state.activeConv}/${i}`)};
document.addEventListener('click',ev=>{const b=ev.target.closest?.('[data-study-sid]');if(!b)return;ev.preventDefault();ev.stopPropagation();openStudy(b.dataset.studySid,b.dataset.studyConv,b.dataset.studyExam)},true);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&view()?.classList.contains('open')&&!document.querySelector('.study-picker'))leave()});
window.addEventListener('hashchange',route);
const start=()=>{const t=document.getElementById('storageText')?.textContent||'';if(t&&!/^Conectando/.test(t))route();else setTimeout(start,200)};
if(/^#estudio\//.test(location.hash))setTimeout(start,400);
})();
