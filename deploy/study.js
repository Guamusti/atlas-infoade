/* Atlas · Portal de estudio
   Sección independiente (/estudio o #estudio) con su propia navegación: inicio de estudio,
   asignaturas, repaso mixto, lobby por asignatura y vista de cada prueba (resumen, tarjetas, test).
   El material vive en study/<asignatura>.json (lista en study/index.json). El progreso se guarda en
   state.studyProgress y la asignación manual de temas en state.examTopics; ambos se sincronizan. */
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
.study-picker label{display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-top:1px solid #cbd3db;font-size:13px}
.study-overlay{background:#eef1ec}
.sp-bar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:14px;padding:12px max(16px,calc(50% - 520px));background:var(--paper,#fffdf7);border-bottom:2px solid #17201b}
.sp-brand{display:flex;align-items:center;gap:10px;border:0;background:transparent;cursor:pointer;text-align:left;color:#17201b;font:inherit;padding:0}
.sp-brand b{display:block;font-size:14px;letter-spacing:.02em}.sp-brand small{display:block;font-size:10px;color:var(--muted,#53615a);letter-spacing:.08em}
.sp-logo{width:38px;height:38px;border-radius:50%;background:var(--acid,#dfff59);border:2px solid #17201b;display:grid;place-items:center;font:400 17px 'DM Serif Display',serif}
.sp-tabs{display:flex;gap:4px;margin:0 auto;background:#eef2ef;border-radius:99px;padding:4px}
.sp-tabs button{border:0;background:transparent;border-radius:99px;padding:9px 18px;font:700 13px var(--font,'DM Sans',sans-serif);color:#17201b;cursor:pointer}
.sp-tabs button.active{background:var(--forest,#153c2d);color:var(--acid,#dfff59)}
.sp-exit{white-space:nowrap}
.sp-main{max-width:1040px;margin:0 auto;padding:22px 16px 110px}
.sp-loading{padding:40px;text-align:center;color:var(--muted,#53615a)}
.sp-head{display:flex;gap:14px;align-items:center;margin:2px 0 14px}
.sp-head h2{font:400 clamp(26px,5vw,38px)/1.05 'DM Serif Display',serif;margin:2px 0 0;color:var(--forest,#153c2d)}
.sp-hero{display:flex;justify-content:space-between;align-items:center;gap:20px;background:var(--forest,#153c2d);color:#fff;border:2px solid #17201b;border-radius:18px;padding:26px;box-shadow:6px 6px 0 var(--orange,#ff6b3d)}
.sp-eyebrow{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--acid,#dfff59)}
.sp-hero h1{font:400 clamp(28px,6vw,46px)/1.02 'DM Serif Display',serif;margin:8px 0}
.sp-hero p{margin:0;color:rgba(255,255,255,.78);font-size:14px}
.sp-hero-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.sp-hero .btn:not(.primary){background:transparent;color:#fff;border-color:#fff}
.study-ring.big{flex:0 0 108px;width:108px;height:108px}.study-ring.big span{width:86px;height:86px;font-size:22px;color:#17201b}
.sp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}
.sp-stats div{background:#fff;border:2px solid #17201b;border-radius:12px;padding:14px;box-shadow:3px 3px 0 #17201b}
.sp-stats b{display:block;font:400 30px/1 'DM Serif Display',serif;color:var(--forest,#153c2d)}.sp-stats b small{font-size:15px;color:var(--muted,#53615a)}
.sp-stats span{font-size:11px;color:var(--muted,#53615a)}
.sp-continue{display:flex;flex-direction:column;gap:3px;width:100%;text-align:left;background:#fff;border:2px solid #17201b;border-left:8px solid var(--subject-color);border-radius:12px;padding:12px 14px;margin-bottom:16px;cursor:pointer;font:inherit;color:#17201b}
.sp-continue .study-label{margin:0}.sp-continue small{color:var(--muted,#53615a)}
.sp-cols{display:grid;grid-template-columns:1.3fr 1fr;gap:18px}.sp-cols>section{min-width:0}
.sp-h3{font:400 22px 'DM Serif Display',serif;margin:6px 0 10px;color:var(--forest,#153c2d);display:flex;align-items:center;gap:6px}
.sp-h3 .subject-color-dot{width:10px;height:10px;border-radius:50%;background:var(--subject-color);display:inline-block}
.sp-row{display:flex;gap:12px;align-items:center;width:100%;text-align:left;background:#fff;border:1.5px solid #17201b;border-radius:12px;padding:10px 12px;margin-bottom:8px;cursor:pointer;font:inherit;color:#17201b;transition:transform .12s}
.sp-row:hover{transform:translate(-2px,-2px);box-shadow:3px 3px 0 #17201b}
.sp-date{flex:0 0 46px;text-align:center;border-radius:9px;background:var(--subject-color);color:#fff;padding:5px 0;font-size:10px;text-transform:uppercase;font-weight:700}
.sp-date b{display:block;font:400 21px/1 'DM Serif Display',serif}
.sp-dot{flex:0 0 12px;height:12px;border-radius:50%;background:var(--subject-color)}
.sp-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.sp-row-main b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sp-row-main small{font-size:11px;color:var(--muted,#53615a)}
.sp-bar-track{display:block;height:5px;border-radius:99px;background:#e3e8e4;overflow:hidden;margin-top:3px}.sp-bar-track span{display:block;height:100%;background:var(--subject-color,#16855b)}
.sp-muted{color:var(--muted,#53615a);font-size:12px}
.sp-wide{width:100%;margin-top:6px}
.sp-q{margin-bottom:14px}
.sp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.sp-subject{display:flex;flex-direction:column;gap:6px;text-align:left;background:#fff;border:2px solid #17201b;border-top:8px solid var(--subject-color);border-radius:14px;padding:14px;box-shadow:4px 4px 0 #17201b;cursor:pointer;font:inherit;color:#17201b;transition:transform .12s}
.sp-subject:hover{transform:translate(-2px,-2px)}
.sp-subject-top{display:flex;justify-content:space-between;align-items:center}
.sp-subject b{font:400 22px/1.1 'DM Serif Display',serif;color:var(--forest,#153c2d)}.sp-subject small{font-size:11px;color:var(--muted,#53615a)}
.sp-review{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.sp-card{background:#fff;border:2px solid #17201b;border-radius:14px;padding:16px;box-shadow:4px 4px 0 #17201b}
.sp-card .sp-h3{margin-top:0}
.study-exam{display:block;width:100%;text-align:left;font:inherit;color:#17201b}
.study-exam-head>span:first-child{display:flex;flex-direction:column}
.study-exam-name,.study-exam-meta,.study-exam-note{display:block}
.sp-main .study-exams{margin-top:4px}
@media(max-width:760px){
 .sp-bar{padding:10px 14px}.sp-brand small{display:none}
 .sp-tabs{position:fixed;left:10px;right:10px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:6;margin:0;justify-content:space-around;background:var(--forest,#153c2d);border:2px solid #17201b;box-shadow:3px 3px 0 var(--orange,#ff6b3d);padding:5px}
 .sp-tabs button{flex:1;color:rgba(255,255,255,.7)}.sp-tabs button.active{background:var(--acid,#dfff59);color:#17201b}
 .sp-exit{margin-left:auto}
 .sp-hero{align-items:flex-start;padding:20px}
 .study-ring.big{flex:0 0 64px;width:64px;height:64px}.study-ring.big span{width:50px;height:50px;font-size:14px}
 .sp-stats{grid-template-columns:repeat(2,1fr)}
 .sp-cols{grid-template-columns:1fr}
}
`;
const st=document.createElement('style');st.textContent=css;document.head.append(st);

const STUDY_CACHE={};let STUDY_INDEX=null;
const view=()=>document.getElementById('studyOverlay');

async function studyIndex(){
  if(STUDY_INDEX)return STUDY_INDEX;
  try{const r=await fetch('study/index.json',{cache:'no-cache'});STUDY_INDEX=r.ok?await r.json():[]}catch(e){STUDY_INDEX=[]}
  return STUDY_INDEX;
}
async function loadStudy(sid){
  if(sid in STUDY_CACHE)return STUDY_CACHE[sid];
  if(!(await studyIndex()).includes(sid))return STUDY_CACHE[sid]=null;
  try{const r=await fetch(`study/${encodeURIComponent(sid)}.json`,{cache:'no-cache'});STUDY_CACHE[sid]=r.ok?await r.json():null}catch(e){STUDY_CACHE[sid]=null}
  return STUDY_CACHE[sid];
}
async function loadAll(){const ids=await studyIndex();await Promise.all(ids.map(loadStudy));return Object.fromEntries(ids.map(id=>[id,STUDY_CACHE[id]]).filter(([,d])=>d))}
function studyState(){state.examTopics=state.examTopics||{};state.studyProgress=state.studyProgress||{};return state}
const subj=sid=>SUBJECTS.find(s=>s.id===sid);
const topicKey=(sid,tid)=>`${sid}/${tid}`;
const prog=(sid,tid)=>studyState().studyProgress[topicKey(sid,tid)]||{};
function topicProgress(sid,t){
  const p=prog(sid,t.id),cards=t.cards?.length||0,known=Math.min((p.k||[]).length,cards),parts=[];
  if(cards)parts.push(known/cards);if(t.quiz?.length)parts.push((p.q||0)/100);
  return parts.length?parts.reduce((a,x)=>a+x,0)/parts.length:0;
}
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
function isCustomRow(sid,conv,i){
  const custom=state.config[`${sid}:${conv}`]||state.config[sid],official=OFFICIAL_EVALUATIONS[sid]?.[conv]?.exams?.[i],current=cfg(subj(sid),conv).exams[i];
  return !!custom&&(!official||!current||official.name!==current.name);
}
function examTopicIds(sid,conv,i,data){
  const manual=studyState().examTopics[`${sid}:${conv}:${i}`];if(Array.isArray(manual))return manual;
  if(!data||isCustomRow(sid,conv,i))return [];
  return data.exams?.[conv]?.[i]?.topics||[];
}
function examTopics(sid,conv,i,data){const all=data?.topics||[];return examTopicIds(sid,conv,i,data).map(id=>all.find(t=>t.id===id)).filter(Boolean)}
function examNote(sid,conv,i,data){
  if(Array.isArray(studyState().examTopics[`${sid}:${conv}:${i}`]))return 'Temas elegidos por ti.';
  if(isCustomRow(sid,conv,i))return 'Prueba añadida o renombrada por ti: elige qué temas entran.';
  return data?.exams?.[conv]?.[i]?.note||ASSESSMENT_GUIDE[sid]?.[conv]?.[i]?.[1]||'';
}
const pct=x=>`${Math.round((x||0)*100)}%`;
function daysTo(date){if(!date)return null;return Math.ceil((new Date(date+'T12:00:00')-new Date())/86400000)}
function dueLabel(date){const d=daysTo(date);if(d===null)return 'Sin fecha';const f=new Date(date+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'});return d<0?`${f} · pasada`:d===0?`${f} · hoy`:`${f} · en ${d} día${d===1?'':'s'}`}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const ring=(p,size='')=>`<div class="study-ring ${size}" style="--p:${Math.round((p||0)*100)}"><span>${pct(p)}</span></div>`;
const shortTitle=t=>t.title.replace(/^[^·]*·\s*/,'');
/* Todas las pruebas con fecha futura (ordinaria y extraordinaria), con su material. */
async function upcoming(maxDays=60){
  const all=await loadAll(),out=[];
  for(const s of SUBJECTS)for(const conv of ['ordinary','extraordinary'])cfg(s,conv).exams.forEach((e,i)=>{
    const date=examDate(s.id,conv,i),d=daysTo(date);if(d===null||d<0||d>maxDays)return;
    const data=all[s.id]||null,topics=examTopics(s.id,conv,i,data);
    out.push({s,conv,i,e,date,d,data,topics,progress:avg(topics.map(t=>topicProgress(s.id,t)))});
  });
  return out.sort((a,b)=>a.date.localeCompare(b.date)||b.e.weight-a.e.weight);
}

/* ---------- Marco del portal ---------- */
function ensureShell(){
  let el=view();
  if(!el){el=document.createElement('div');el.id='studyOverlay';el.className='study-overlay';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Portal de estudio');document.body.append(el)}
  if(!el.querySelector('.sp-bar')){
    el.innerHTML=`<header class="sp-bar"><button class="sp-brand" data-sp-go="#estudio"><span class="sp-logo">03</span><span><b>Atlas · Estudio</b><small>INFOADE · UAH</small></span></button>
      <nav class="sp-tabs" aria-label="Secciones de estudio"><button data-sp-tab="home" data-sp-go="#estudio">Inicio</button><button data-sp-tab="subjects" data-sp-go="#estudio/asignaturas">Asignaturas</button><button data-sp-tab="review" data-sp-go="#estudio/repaso">Repaso</button></nav>
      <button class="btn sp-exit" data-sp-exit title="Volver a Atlas">← Atlas</button></header><main class="sp-main" id="spMain"></main>`;
    el.addEventListener('click',ev=>{const g=ev.target.closest('[data-sp-go]');if(g){ev.preventDefault();go(g.dataset.spGo)}if(ev.target.closest('[data-sp-exit]'))leave()});
  }
  el.classList.add('open');document.body.style.overflow='hidden';return el;
}
function frame(tab){const el=ensureShell();el.querySelectorAll('[data-sp-tab]').forEach(b=>b.classList.toggle('active',b.dataset.spTab===tab));const main=el.querySelector('#spMain');main.scrollTop=0;el.scrollTop=0;return main}
function pageHead(title,kicker,back,color){return `<div class="sp-head" ${color?`style="--subject-color:${color}"`:''}>${back?`<button class="icon-btn" data-sp-go="${back}" aria-label="Volver">←</button>`:''}<div><div class="study-kicker">${color?'<span class="subject-color-dot"></span>':''}${esc(kicker)}</div><h2>${esc(title)}</h2></div></div>`}
function closeStudy(){const el=view();if(el)el.classList.remove('open');document.body.style.overflow=''}
function go(hash){if(location.hash!==hash)location.hash=hash;else route()}
function leave(){const path=location.pathname.replace(/\/estudio\/?$/,'/');history.pushState(null,'',path+location.search);closeStudy()}

/* ---------- Inicio de estudio ---------- */
async function renderHome(){
  const main=frame('home');main.innerHTML='<div class="sp-loading">Cargando…</div>';
  const all=await loadAll(),list=await upcoming(60),withTopics=list.filter(x=>x.topics.length),next=withTopics[0];
  let cards=0,known=0,quizzes=[],started=0,total=0,last=null;
  for(const [sid,d] of Object.entries(all))for(const t of d.topics){total++;const p=prog(sid,t.id);cards+=t.cards.length;known+=Math.min((p.k||[]).length,t.cards.length);if(p.q!==undefined)quizzes.push(p.q);if(p.at){started++;if(!last||p.at>last.at)last={sid,t,at:p.at}}}
  const soonTopics=[];const seen=new Set();
  for(const x of withTopics.filter(x=>x.d<=21))for(const t of x.topics){const k=x.s.id+'/'+t.id;if(seen.has(k))continue;seen.add(k);soonTopics.push({x,t,p:topicProgress(x.s.id,t)})}
  soonTopics.sort((a,b)=>a.p-b.p||a.x.d-b.x.d);
  const lastExam=last&&list.find(x=>x.s.id===last.sid&&x.topics.some(t=>t.id===last.t.id));
  main.innerHTML=`<section class="sp-hero">
      <div><div class="sp-eyebrow">Tu portal de estudio</div><h1>${next?`${esc(next.s.short)}: ${esc(next.e.name)}`:'Sin exámenes próximos'}</h1>
      <p>${next?`${esc(dueLabel(next.date))} · ${Math.round(next.e.weight*100)}% de la nota · ${next.topics.length} tema${next.topics.length===1?'':'s'}`:'Cuando haya fechas en el calendario aparecerán aquí.'}</p>
      ${next?`<div class="sp-hero-actions"><button class="btn primary" data-sp-go="#estudio/${next.s.id}/${next.conv}/${next.i}">Estudiar ahora</button><button class="btn" data-sp-go="#estudio/${next.s.id}/${next.conv}/${next.i}/test">Hacer test</button></div>`:''}</div>
      ${next?ring(next.progress,'big'):''}
    </section>
    <section class="sp-stats">
      <div><b>${known}<small>/${cards}</small></b><span>tarjetas dominadas</span></div>
      <div><b>${quizzes.length?Math.round(avg(quizzes))+'%':'—'}</b><span>media en tests</span></div>
      <div><b>${started}<small>/${total}</small></b><span>temas empezados</span></div>
      <div><b>${list.filter(x=>x.d<=7).length}</b><span>pruebas en 7 días</span></div>
    </section>
    ${lastExam?`<button class="sp-continue" data-sp-go="#estudio/${lastExam.s.id}/${lastExam.conv}/${lastExam.i}/resumen/${last.t.id}" style="--subject-color:${subjectColor(lastExam.s)}"><span class="study-label">Continuar</span><b>${esc(lastExam.s.short)} · ${esc(last.t.title)}</b><small>${esc(lastExam.e.name)} · ${pct(topicProgress(last.sid,last.t))}</small></button>`:''}
    <div class="sp-cols">
      <section><h3 class="sp-h3">Próximas pruebas</h3>${list.length?list.slice(0,8).map(x=>`<button class="sp-row" data-sp-go="#estudio/${x.s.id}/${x.conv}/${x.i}" style="--subject-color:${subjectColor(x.s)}">
        <span class="sp-date"><b>${new Date(x.date+'T12:00:00').getDate()}</b>${new Date(x.date+'T12:00:00').toLocaleDateString('es-ES',{month:'short'})}</span>
        <span class="sp-row-main"><b>${esc(x.s.short)} · ${esc(x.e.name)}</b><small>${x.d===0?'hoy':`en ${x.d} día${x.d===1?'':'s'}`} · ${Math.round(x.e.weight*100)}%${x.conv==='extraordinary'?' · extraordinaria':''}</small>${x.topics.length?`<span class="sp-bar-track"><span style="width:${pct(x.progress)}"></span></span>`:'<small class="sp-muted">Sin temas asignados</small>'}</span></button>`).join(''):'<div class="empty">No hay pruebas con fecha en los próximos 60 días.</div>'}</section>
      <section><h3 class="sp-h3">Para reforzar</h3>${soonTopics.length?soonTopics.slice(0,6).map(({x,t,p})=>`<button class="sp-row" data-sp-go="#estudio/${x.s.id}/${x.conv}/${x.i}/tarjetas/${t.id}" style="--subject-color:${subjectColor(x.s)}"><span class="sp-dot"></span><span class="sp-row-main"><b>${esc(shortTitle(t))}</b><small>${esc(x.s.short)} · para ${esc(x.e.name)} (${x.d===0?'hoy':`en ${x.d} d`})</small><span class="sp-bar-track"><span style="width:${pct(p)}"></span></span></span></button>`).join(''):'<div class="empty">Nada urgente en las próximas 3 semanas.</div>'}
      <button class="btn primary sp-wide" data-sp-go="#estudio/repaso/proximos/tarjetas">Repaso rápido de lo próximo</button></section>
    </div>`;
}

/* ---------- Asignaturas ---------- */
async function renderSubjects(q){
  const main=frame('subjects'),all=await loadAll(),cur=Number(state.timetable?.quarter)||1,quarter=q||String(cur);
  const items=SUBJECTS.filter(s=>quarter==='all'||String(s.q)===quarter).map(s=>{
    const d=all[s.id],topics=d?.topics||[],p=avg(topics.map(t=>topicProgress(s.id,t)));
    const nx=cfg(s,'ordinary').exams.map((e,i)=>({e,i,date:examDate(s.id,'ordinary',i)})).filter(x=>daysTo(x.date)!==null&&daysTo(x.date)>=0).sort((a,b)=>a.date.localeCompare(b.date))[0];
    return {s,d,topics,p,nx};
  });
  main.innerHTML=`${pageHead('Asignaturas','Elige qué estudiar')}
    <div class="segmented conv-tabs sp-q">${[['1','Q1'],['2','Q2'],['all','Todas']].map(([v,l])=>`<button class="${quarter===v?'active':''}" data-sp-go="#estudio/asignaturas/${v}">${l}</button>`).join('')}</div>
    <div class="sp-grid">${items.map(({s,d,topics,p,nx})=>`<button class="sp-subject" data-sp-go="#estudio/${s.id}" style="--subject-color:${subjectColor(s)}">
      <span class="sp-subject-top"><span class="study-kicker"><span class="subject-color-dot"></span>${esc(s.short)} · Q${s.q}</span>${d?ring(p):''}</span>
      <b>${esc(s.name)}</b>
      <small>${d?`${topics.length} temas · material interactivo`:'Contenidos de la guía (material en preparación)'}</small>
      <small>${nx?`Próxima: ${esc(nx.e.name)} · ${esc(dueLabel(nx.date))}`:'Sin pruebas próximas'}</small></button>`).join('')||'<div class="empty">No hay asignaturas en este filtro.</div>'}</div>`;
}

/* ---------- Lobby de una asignatura ---------- */
async function renderLobby(sid,conv){
  const s=subj(sid);if(!s)return go('#estudio/asignaturas');
  const main=frame('subjects'),data=await loadStudy(sid),c=cfg(s,conv);
  const exams=c.exams.map((e,i)=>({e,i,date:examDate(sid,conv,i)})).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
  main.innerHTML=`${pageHead(s.name,`${s.short} · lobby de estudio`,'#estudio/asignaturas',subjectColor(s))}
    <div class="segmented conv-tabs study-conv">${['ordinary','extraordinary'].map(v=>`<button data-sp-go="#estudio/${sid}/${v}" class="${conv===v?'active':''}">${v==='ordinary'?'Ordinaria':'Extraordinaria'}</button>`).join('')}</div>
    ${data?`<p class="study-source">Contenidos según la ${esc(data.source)}. El material de estudio es de apoyo: contrástalo con los apuntes de clase.</p>`:`<p class="study-source">Aún no hay material interactivo para esta asignatura. Se muestran los contenidos que indica la guía para cada prueba.</p>`}
    <div class="study-exams">${exams.map(({e,i,date})=>{
      const topics=examTopics(sid,conv,i,data),p=topics.length?avg(topics.map(t=>topicProgress(sid,t))):null,d=daysTo(date),soon=d!==null&&d>=0&&d<=7;
      return `<button class="study-exam ${soon?'soon':''}" data-sp-go="#estudio/${sid}/${conv}/${i}">
        <span class="study-exam-head"><span><span class="study-exam-name">${esc(e.name)}</span><span class="study-exam-meta">${Math.round(e.weight*100)}% · ${esc(dueLabel(date))}${Number(e.min)>0?` · mín. ${e.min}`:''}</span></span>${p!==null?ring(p):''}</span>
        ${topics.length?`<span class="study-chips">${topics.map(t=>`<span>${esc(shortTitle(t))}</span>`).join('')}</span>`:`<span class="study-exam-note">${esc(examNote(sid,conv,i,data)||'Sin temas asignados.')}</span>`}
      </button>`}).join('')}</div>`;
}

/* ---------- Vista de una prueba ---------- */
async function renderExam(sid,conv,i,mode,topicFilter){
  const s=subj(sid);if(!s)return go('#estudio/asignaturas');
  const data=await loadStudy(sid),e=cfg(s,conv).exams[i];if(!e)return go(`#estudio/${sid}/${conv}`);
  const main=frame('subjects'),date=examDate(sid,conv,i),all=data?.topics||[],ids=examTopicIds(sid,conv,i,data),topics=examTopics(sid,conv,i,data);
  const active=topicFilter?topics.filter(t=>t.id===topicFilter):topics,note=examNote(sid,conv,i,data),base=`#estudio/${sid}/${conv}/${i}`;
  main.innerHTML=`${pageHead(e.name,`${s.short} · ${conv==='ordinary'?'Ordinaria':'Extraordinaria'} · ${Math.round(e.weight*100)}% · ${dueLabel(date)}`,`#estudio/${sid}/${conv}`,subjectColor(s))}
    ${note?`<div class="history-note">${esc(note)}</div>`:''}
    ${data?`<div class="study-assign"><button class="btn" data-study-edit>Elegir temas</button>${Array.isArray(state.examTopics?.[`${sid}:${conv}:${i}`])?'<button class="btn ghost" data-study-reset>Usar los de la guía</button>':''}</div>`:''}
    ${!topics.length?`<div class="empty">${data?'Esta prueba no tiene temas asignados. Pulsa «Elegir temas».':'Sin material interactivo todavía para esta asignatura.'}</div>`:`
    <div class="study-modes">${[['resumen','Resumen'],['tarjetas','Tarjetas'],['test','Test']].map(([m,l])=>`<button class="${mode===m?'active':''}" data-sp-go="${base}/${m}${topicFilter?'/'+topicFilter:''}">${l}</button>`).join('')}</div>
    ${topics.length>1?`<label class="study-filter">Tema <select data-study-topic><option value="">Todos los de esta prueba (${topics.length})</option>${topics.map(t=>`<option value="${t.id}" ${t.id===topicFilter?'selected':''}>${esc(t.title)}</option>`).join('')}</select></label>`:''}
    <div id="studyPane"></div>`}`;
  main.querySelector('[data-study-topic]')?.addEventListener('change',ev=>go(`${base}/${mode}${ev.target.value?'/'+ev.target.value:''}`));
  main.querySelector('[data-study-edit]')?.addEventListener('click',()=>editTopics(sid,conv,i,all,ids));
  main.querySelector('[data-study-reset]')?.addEventListener('click',async()=>{delete state.examTopics[`${sid}:${conv}:${i}`];await idbSet();route()});
  const pane=main.querySelector('#studyPane');if(!pane)return;
  const entries=active.map(t=>({sid,t}));
  if(mode==='tarjetas')return renderCards(pane,entries);
  if(mode==='test')return renderQuiz(pane,entries);
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

/* ---------- Repaso mixto ---------- */
async function renderReview(scope,mode){
  const main=frame('review'),all=await loadAll();
  if(!mode){
    const list=(await upcoming(14)).filter(x=>x.topics.length);
    main.innerHTML=`${pageHead('Repaso','Sesiones rápidas mezclando temas')}
      <div class="sp-review">
        <section class="sp-card"><h3 class="sp-h3">Lo que viene (14 días)</h3><p class="sp-muted">${list.length?list.map(x=>`${esc(x.s.short)} · ${esc(x.e.name)}`).join(' · '):'No hay pruebas con temas en los próximos 14 días.'}</p>
          <div class="sp-hero-actions"><button class="btn primary" data-sp-go="#estudio/repaso/proximos/tarjetas" ${list.length?'':'disabled'}>Tarjetas pendientes</button><button class="btn" data-sp-go="#estudio/repaso/proximos/test" ${list.length?'':'disabled'}>Test de 10</button></div></section>
        ${Object.entries(all).map(([sid,d])=>{const s=subj(sid);if(!s)return '';return `<section class="sp-card" style="--subject-color:${subjectColor(s)}"><h3 class="sp-h3"><span class="subject-color-dot"></span> ${esc(s.name)}</h3><p class="sp-muted">${d.topics.length} temas · ${pct(avg(d.topics.map(t=>topicProgress(sid,t))))} dominado</p>
          <div class="sp-hero-actions"><button class="btn primary" data-sp-go="#estudio/repaso/${sid}/tarjetas">Tarjetas pendientes</button><button class="btn" data-sp-go="#estudio/repaso/${sid}/test">Test de 10</button></div></section>`}).join('')}
      </div>`;
    return;
  }
  let entries=[];
  if(scope==='proximos'){const seen=new Set();for(const x of (await upcoming(14)))for(const t of x.topics){const k=x.s.id+'/'+t.id;if(!seen.has(k)){seen.add(k);entries.push({sid:x.s.id,t})}}}
  else if(all[scope])entries=all[scope].topics.map(t=>({sid:scope,t}));
  const label=scope==='proximos'?'Pruebas de los próximos 14 días':(subj(scope)?.name||scope);
  main.innerHTML=`${pageHead(mode==='test'?'Test rápido':'Tarjetas pendientes',label,'#estudio/repaso')}<div id="studyPane"></div>`;
  const pane=main.querySelector('#studyPane');
  if(!entries.length){pane.innerHTML='<div class="empty">No hay temas para repasar en este ámbito.</div>';return}
  if(mode==='test')renderQuiz(pane,entries,10);else renderCards(pane,entries,{onlyPending:true,limit:15});
}

/* ---------- Motores: tarjetas y test ---------- */
function saveProgress(sid,tid,patch){const k=topicKey(sid,tid),cur=studyState().studyProgress[k]||{};state.studyProgress[k]={...cur,...patch,at:new Date().toISOString()};return idbSet()}
function renderCards(pane,entries,opts={}){
  let deck=shuffle(entries.flatMap(({sid,t})=>t.cards.map((c,n)=>({sid,t,n,q:c[0],a:c[1]}))));
  if(opts.onlyPending){const pend=deck.filter(c=>!(prog(c.sid,c.t.id).k||[]).includes(c.n));deck=pend.length?pend:deck}
  if(opts.limit)deck=deck.slice(0,opts.limit);
  let pos=0,ok=0,flipped=false;
  const draw=()=>{
    if(pos>=deck.length){pane.innerHTML=`<div class="study-done"><div class="study-big">${ok}/${deck.length}</div><p>tarjetas que ya dominas en esta ronda.</p><button class="btn primary" data-again>Otra ronda</button></div>`;pane.querySelector('[data-again]').onclick=()=>renderCards(pane,entries,opts);return}
    const c=deck[pos],known=(prog(c.sid,c.t.id).k||[]).includes(c.n),s=subj(c.sid);
    pane.innerHTML=`<div class="study-count">${pos+1} / ${deck.length} · ${esc(s?.short||'')} · ${esc(shortTitle(c.t))}${known?' · ✓ dominada':''}</div>
      <button class="study-card ${flipped?'flipped':''}" data-flip aria-label="Girar tarjeta"><span class="study-card-side">${flipped?'Respuesta':'Pregunta'}</span><span class="study-card-text">${esc(flipped?c.a:c.q)}</span><span class="study-card-hint">${flipped?'':'Toca para ver la respuesta'}</span></button>
      <div class="study-card-actions">${flipped?`<button class="btn" data-again-card>Repasar</button><button class="btn primary" data-know>Lo sé</button>`:'<button class="btn" data-skip>Saltar</button>'}</div>`;
    pane.querySelector('[data-flip]').onclick=()=>{flipped=!flipped;draw()};
    pane.querySelector('[data-skip]')?.addEventListener('click',()=>{pos++;flipped=false;draw()});
    pane.querySelector('[data-again-card]')?.addEventListener('click',async()=>{const k=(prog(c.sid,c.t.id).k||[]).filter(x=>x!==c.n);await saveProgress(c.sid,c.t.id,{k});deck.push(c);pos++;flipped=false;draw()});
    pane.querySelector('[data-know]')?.addEventListener('click',async()=>{const k=[...new Set([...(prog(c.sid,c.t.id).k||[]),c.n])];await saveProgress(c.sid,c.t.id,{k});ok++;pos++;flipped=false;draw()});
  };draw();
}
function renderQuiz(pane,entries,limit){
  let qs=shuffle(entries.flatMap(({sid,t})=>t.quiz.map(q=>({sid,t,...q}))));if(limit)qs=qs.slice(0,limit);
  let pos=0;const score={};
  const draw=answered=>{
    if(pos>=qs.length){
      const total=qs.length,good=Object.values(score).reduce((a,x)=>a+x.ok,0);
      Promise.all(Object.values(score).map(x=>{const p=Math.round(x.ok/x.n*100),best=prog(x.sid,x.tid).q||0;return p>best?saveProgress(x.sid,x.tid,{q:p}):null}));
      pane.innerHTML=`<div class="study-done"><div class="study-big">${good}/${total}</div><p>${good===total?'¡Perfecto!':good/total>=.5?'Vas bien. Repasa los fallos en el resumen.':'Conviene repasar el resumen y las tarjetas.'}</p><button class="btn primary" data-again>Repetir test</button></div>`;
      pane.querySelector('[data-again]').onclick=()=>renderQuiz(pane,entries,limit);return;
    }
    const q=qs[pos],s=subj(q.sid);
    pane.innerHTML=`<div class="study-count">Pregunta ${pos+1} / ${qs.length} · ${esc(s?.short||'')} · ${esc(shortTitle(q.t))}</div><div class="study-q">${esc(q.q)}</div>
      <div class="study-options">${q.o.map((o,n)=>`<button data-opt="${n}" class="${answered!==undefined?(n===q.a?'right':n===answered?'wrong':''):''}" ${answered!==undefined?'disabled':''}>${esc(o)}</button>`).join('')}</div>
      ${answered!==undefined?`<div class="study-explain ${answered===q.a?'ok':'ko'}"><b>${answered===q.a?'Correcto.':'Incorrecto.'}</b> ${esc(q.e||'')}</div><div class="study-card-actions"><button class="btn primary" data-next>${pos+1<qs.length?'Siguiente':'Ver resultado'}</button></div>`:''}`;
    pane.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.opt),k=q.sid+'/'+q.t.id,sc=score[k]||(score[k]={sid:q.sid,tid:q.t.id,ok:0,n:0});sc.n++;if(n===q.a)sc.ok++;draw(n)});
    pane.querySelector('[data-next]')?.addEventListener('click',()=>{pos++;draw()});
  };draw();
}

/* ---------- Rutas ---------- */
function route(){
  const h=location.hash;
  if(!/^#estudio(\/|$)/.test(h))return closeStudy();
  let m;
  if(h==='#estudio'||h==='#estudio/')return renderHome();
  if((m=h.match(/^#estudio\/asignaturas(?:\/(1|2|all))?$/)))return renderSubjects(m[1]);
  if((m=h.match(/^#estudio\/repaso(?:\/([\w-]+)\/(tarjetas|test))?$/)))return renderReview(m[1],m[2]);
  if((m=h.match(/^#estudio\/([\w-]+)(?:\/(ordinary|extraordinary)(?:\/(\d+)(?:\/(resumen|tarjetas|test)(?:\/([\w-]+))?)?)?)?$/))){
    const [,sid,conv=state.activeConv,i,mode='resumen',topic]=m;
    return i===undefined?renderLobby(sid,conv):renderExam(sid,conv,Number(i),mode,topic);
  }
  go('#estudio');
}
window.openStudy=(sid,conv,i)=>{document.querySelectorAll('.day-detail-pop').forEach(x=>x.remove());if(document.getElementById('subjectModal')?.classList.contains('open'))closeModal();if(!sid)return go('#estudio');go(i===undefined||i===''?`#estudio/${sid}/${conv||state.activeConv}`:`#estudio/${sid}/${conv||state.activeConv}/${i}`)};
document.addEventListener('click',ev=>{const h=ev.target.closest?.('[data-study-home]');if(h){ev.preventDefault();return openStudy()}const b=ev.target.closest?.('[data-study-sid]');if(!b)return;ev.preventDefault();ev.stopPropagation();openStudy(b.dataset.studySid,b.dataset.studyConv,b.dataset.studyExam)},true);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&view()?.classList.contains('open')&&!document.querySelector('.study-picker'))leave()});
window.addEventListener('hashchange',route);
window.addEventListener('popstate',()=>{if(!/^#estudio/.test(location.hash))closeStudy()});
/* Entrada directa por /estudio: abre el portal en cuanto los datos locales estén cargados. */
if(/\/estudio\/?$/.test(location.pathname)&&!/^#estudio/.test(location.hash))history.replaceState(null,'',location.pathname+location.search+'#estudio');
const start=()=>{const t=document.getElementById('storageText')?.textContent||'';if(t&&!/^Conectando/.test(t))route();else setTimeout(start,150)};
if(/^#estudio/.test(location.hash))start();
})();
