/* Atlas · Asistente
   Chat en lenguaje natural sobre tu curso: «¿qué tengo que hacer hoy?», «¿cuándo es el próximo examen?»,
   «¿qué me falta por estudiar de SSOO?»… Se abre con el botón «Asistente» o con Alt+I.

   Cómo responde:
   1. Las consultas habituales (día, semana, exámenes, tareas, clases, notas, estudio) las resuelve un
      planificador que lee tus datos (state, calendario, portal de estudio). Es instantáneo y exacto: la fecha
      y los días que faltan nunca los calcula un modelo.
   2. Con la IA local activada, el modelo añade un consejo tras cada plan y contesta las preguntas libres
      (también sobre el contenido del temario) apoyándose en esos mismos datos.
   La IA corre en el dispositivo (IA integrada de Chrome/Edge, un modelo WebGPU o tu propio Ollama/LM Studio):
   nada se envía a una API de pago. Los ajustes del motor son de cada dispositivo y no se sincronizan. */
(function(){
'use strict';
const BASE=document.currentScript?.src||location.href;
const LSP='atlas.ai-';
const ls={get(k){try{return localStorage.getItem(LSP+k)}catch(_){return null}},set(k,v){try{localStorage.setItem(LSP+k,v)}catch(_){}},json(k,d){try{return{...d,...JSON.parse(localStorage.getItem(LSP+k)||'{}')}}catch(_){return{...d}}}};
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
const ready=()=>typeof state!=='undefined'&&typeof SUBJECTS!=='undefined'&&typeof getEvents==='function';

/* ---------- Fechas ---------- */
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseISO=s=>new Date(s+'T12:00:00');
const addDays=(s,n)=>{const d=parseISO(s);d.setDate(d.getDate()+n);return iso(d)};
const diffDays=(a,b)=>Math.round((parseISO(b)-parseISO(a))/864e5);
const longDate=s=>cap(parseISO(s).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}));
const shortDate=s=>parseISO(s).toLocaleDateString('es-ES',{day:'numeric',month:'short'}).replace('.','');
const dayName=s=>cap(parseISO(s).toLocaleDateString('es-ES',{weekday:'short'}).replace('.',''));
const rel=n=>n===0?'hoy':n===1?'mañana':n===2?'pasado mañana':n>2?`en ${n} días`:n===-1?'ayer':`hace ${-n} días`;
const pct=x=>`${Math.round((x||0)*100)}%`;
const plural=(n,a,b)=>`${n} ${n===1?a:b}`;

/* ---------- Datos del atlas ---------- */
const subj=id=>SUBJECTS.find(s=>s.id===id);
const quarterOf=d=>state.timetable.autoQuarter!==false?detectedQuarter(d):Number(state.timetable.quarter)||1;
function classesOn(day){
  const d=parseISO(day),q=quarterOf(d),term=state.timetable.terms[q];
  const inTerm=day>=term.start&&day<=term.end;
  const list=inTerm?(CLASS_SCHEDULE[q]||[]).filter(x=>x.day===d.getDay()).sort((a,b)=>a.start.localeCompare(b.start)):[];
  return{q,term,inTerm,list};
}
const kindOf=name=>/entreg|github|trabajo|exposici|memoria/.test(norm(name))?'entrega':'prueba';
function eventsList(){
  let raw=[];try{raw=getEvents()}catch(_){}
  return raw.map(e=>{
    const s=subj(e.sid);let conf=null;
    try{if(s&&typeof e.index==='number')conf=cfg(s,e.conv).exams[e.index]||null}catch(_){}
    return{...e,weight:Number(conf?.weight)||0,min:Number(conf?.min)||0,kind:kindOf(e.name),subj:s};
  }).sort((a,b)=>a.date.localeCompare(b.date)||b.weight-a.weight);
}
const evLabel=e=>`${e.short} · ${e.name}${e.conv==='extraordinary'?' (extraordinaria)':''}`;
const weightTxt=e=>e.weight>0?` · ${pct(e.weight)} de la nota`:'';
function taskBuckets(day,q){
  const today=iso(new Date());
  const pending=(state.tasks||[]).filter(t=>!t.completed&&subj(t.subjectId)?.q===q);
  const pers=(state.personalTasks||[]).filter(t=>!t.done);
  const lbl=t=>`${subj(t.subjectId)?.short||'Tarea'} · ${t.title}`;
  return{
    dueDay:[...pending.filter(t=>t.due===day).map(lbl),...pers.filter(t=>t.date===day).map(t=>`${t.title} (personal)`)],
    overdue:day>=today?[...pending.filter(t=>t.due&&t.due<today).sort((a,b)=>a.due.localeCompare(b.due)).map(t=>`${lbl(t)} (${rel(diffDays(today,t.due))})`),...pers.filter(t=>t.date&&t.date<today).map(t=>`${t.title} (personal, ${rel(diffDays(today,t.date))})`)]:[],
    unsched:pending.filter(t=>!t.due).length,
    pending,pers,
  };
}

/* ---------- Material de estudio (study/*.json) ---------- */
const STUDYC={};let studyP=null;
function loadStudy(){
  if(!studyP)studyP=fetch('study/index.json').then(r=>r.ok?r.json():[]).then(ids=>Promise.all(ids.map(id=>fetch(`study/${encodeURIComponent(id)}.json`).then(r=>r.ok?r.json():null).then(d=>{if(d)STUDYC[id]=d}).catch(()=>{})))).catch(()=>{});
  return studyP;
}
function topicProg(sid,t){
  const p=(state.studyProgress||{})[`${sid}/${t.id}`]||{},cards=t.cards?.length||0,known=Math.min((p.k||[]).length,cards),parts=[];
  if(cards)parts.push(known/cards);if(t.quiz?.length)parts.push((p.q||0)/100);if(t.labs?.length)parts.push((p.l||0)/100);
  return parts.length?parts.reduce((a,x)=>a+x,0)/parts.length:0;
}
function isCustomRow(sid,conv,i){
  try{const custom=state.config[`${sid}:${conv}`]||state.config[sid],official=OFFICIAL_EVALUATIONS[sid]?.[conv]?.exams?.[i],current=cfg(subj(sid),conv).exams[i];return!!custom&&(!official||!current||official.name!==current.name)}catch(_){return false}
}
/* Temas de una prueba: los que eligió el usuario o, si no, los de la guía (igual que el portal de estudio). */
function examStudy(e){
  const out={topics:[],avg:null,note:'',routable:typeof e.index==='number'};
  const data=STUDYC[e.sid];if(!out.routable)return out;
  const manual=(state.examTopics||{})[`${e.sid}:${e.conv}:${e.index}`];
  const ids=Array.isArray(manual)?manual:(!data||isCustomRow(e.sid,e.conv,e.index)?[]:data.exams?.[e.conv]?.[e.index]?.topics||[]);
  out.topics=ids.map(id=>data?.topics?.find(t=>t.id===id)).filter(Boolean).map(t=>({id:t.id,title:t.title,short:briefTitle(t.title),progress:topicProg(e.sid,t)}));
  out.avg=out.topics.length?out.topics.reduce((a,t)=>a+t.progress,0)/out.topics.length:null;
  out.note=Array.isArray(manual)?'Temas elegidos por ti.':data?.exams?.[e.conv]?.[e.index]?.note||'';
  return out;
}
/* «P1 · Incidencia 01 · Sistema de archivos…» → «Incidencia 01»; «Tema 1 · El SO…» se queda igual. */
const briefTitle=t=>{const p=String(t).split(' · ');return p.length>=3?p[1]:t};
const weakTopics=(st,n=3)=>[...st.topics].filter(t=>t.progress<.85).sort((a,b)=>a.progress-b.progress).slice(0,n);

/* ---------- Respuestas deterministas ---------- */
const R=(text,actions=[],advice=true)=>({text,actions,advice});
const studyLink=(e,sub='')=>`#estudio/${e.sid}/${e.conv}/${e.index}${sub}`;
function studyActions(e){
  const st=examStudy(e),acts=[];
  if(!st.routable||!st.topics.length)return acts;
  acts.push({label:'Estudiar ahora',go:studyLink(e)},{label:'Hacer test',go:studyLink(e,'/test')});
  const w=weakTopics(st,1)[0];if(w)acts.push({label:'Tarjetas del tema más flojo',go:studyLink(e,`/tarjetas/${w.id}`)});
  return acts;
}
function studyLines(e,today){
  const st=examStudy(e),days=diffDays(today,e.date),L=[];
  L.push(`- **${evLabel(e)}** — ${shortDate(e.date)} (${rel(days)})${weightTxt(e)}`);
  if(!st.routable||!st.topics.length){L.push('- Aún no hay material de este examen en el portal de estudio: repasa tus apuntes y la guía docente.');return L}
  const weak=weakTopics(st);
  if(weak.length)L.push(`- Temas por reforzar: ${weak.map(t=>`${t.short} (${pct(t.progress)})`).join('; ')}.`);
  else L.push(`- Llevas el temario casi dominado (${pct(st.avg)}): haz un test para afinar.`);
  L.push(days<=0?'- Es hoy: repasa lo esencial y llega con margen.':days<=3?'- Quedan pocos días: tarjetas y test de repaso, sin temas nuevos.':'- Dedica hoy un bloque de estudio a estos temas.');
  return L;
}
async function planDay(day){
  await loadStudy();
  const today=iso(new Date()),isToday=day===today,nowHM=new Date().toTimeString().slice(0,5);
  const{q,term,inTerm,list}=classesOn(day),evs=eventsList(),L=[];
  L.push(isToday?`**Hoy · ${longDate(day)}**`:`**${longDate(day)}** (${rel(diffDays(today,day))})`,'');
  L.push('**Clases**');
  if(!inTerm)L.push(`- Fuera del periodo lectivo de Q${q} (${shortDate(term.start)} – ${shortDate(term.end)}).`);
  else if(!list.length)L.push('- Sin clases.');
  else list.forEach(c=>L.push(`- ${c.start}–${c.end} · **${subj(c.sid)?.short||c.sid}** · ${c.type} · Aula ${c.room}${isToday&&c.end<=nowHM?' (terminada)':''}`));
  const dayEv=evs.filter(e=>e.date===day);
  if(dayEv.length){L.push('','**Pruebas y entregas ese día**');dayEv.forEach(e=>L.push(`- **${evLabel(e)}**${weightTxt(e)}`))}
  const tb=taskBuckets(day,q);
  L.push('','**Tareas**');
  if(!tb.dueDay.length&&!tb.overdue.length&&!(isToday&&tb.unsched))L.push('- Nada pendiente.');
  tb.dueDay.forEach(t=>L.push(`- Para ${isToday?'hoy':'ese día'}: ${t}`));
  tb.overdue.slice(0,4).forEach(t=>L.push(`- Atrasada: ${t}`));
  if(tb.overdue.length>4)L.push(`- … y ${tb.overdue.length-4} atrasadas más.`);
  if(isToday&&tb.unsched)L.push(`- ${plural(tb.unsched,'tarea sin fecha','tareas sin fecha')} en la bandeja.`);
  const ups=evs.filter(e=>e.date>=day),pr=ups.find(e=>e.kind==='prueba'),en=ups.find(e=>e.kind==='entrega'),actions=[];
  if(pr){
    L.push('','**Prepara el examen más próximo**',...studyLines(pr,today));
    actions.push(...studyActions(pr));
    if(en&&en.date<=pr.date&&en!==pr)L.push(`- Antes, tienes la entrega **${evLabel(en)}** (${rel(diffDays(today,en.date))}).`);
    const more=ups.filter(e=>e!==pr&&e!==en).slice(0,2);
    if(more.length)L.push(`- Después: ${more.map(e=>`${evLabel(e)} (${shortDate(e.date)})`).join('; ')}.`);
  }else if(en){
    L.push('','**Próxima entrega**',`- **${evLabel(en)}** — ${shortDate(en.date)} (${rel(diffDays(today,en.date))}).`);
  }else L.push('','No hay exámenes ni entregas con fecha a partir de ese día.');
  const week=evs.filter(e=>e.date>=day&&e.date<=addDays(day,7)).length;
  if(week>=3)L.push('',`Semana cargada: ${week} pruebas o entregas en los próximos 7 días.`);
  if(tb.pending.length||tb.pers.length)actions.push({label:'Ver tareas',run:()=>typeof openPlanTasks==='function'&&openPlanTasks()});
  return R(L.join('\n'),actions);
}
async function planRange(from,to,title){
  const today=iso(new Date()),evs=eventsList(),L=[`**${title}**`,''];
  for(let d=from;d<=to;d=addDays(d,1)){
    const{list,inTerm}=classesOn(d),de=evs.filter(e=>e.date===d),tb=taskBuckets(d,classesOn(d).q),bits=[];
    if(list.length)bits.push(plural(list.length,'clase','clases')+` (${[...new Set(list.map(c=>subj(c.sid)?.short||c.sid))].join(', ')})`);
    de.forEach(e=>bits.push(`**${evLabel(e)}**`));
    tb.dueDay.forEach(t=>bits.push(`tarea: ${t}`));
    L.push(`- **${dayName(d)} ${shortDate(d)}**${d===today?' (hoy)':''}: ${bits.length?bits.join(' · '):inTerm?'libre':'fuera de periodo lectivo'}`);
  }
  return R(L.join('\n'),[{label:'Ver calendario',run:()=>typeof switchView==='function'&&switchView('calendar')}]);
}
function examsAnswer(sid){
  const today=iso(new Date()),all=eventsList().filter(e=>(!sid||e.sid===sid)&&e.date>=today),L=[];
  if(!all.length)return R(sid?`No hay pruebas con fecha a partir de hoy para ${subj(sid).short}.`:'No hay pruebas ni entregas con fecha a partir de hoy.',[],false);
  const shown=all.slice(0,sid?10:7);
  L.push(sid?`**Próximas pruebas de ${subj(sid).name}**`:'**Próximos exámenes y entregas**','');
  shown.forEach(e=>L.push(`- **${shortDate(e.date)}** (${rel(diffDays(today,e.date))}) · ${evLabel(e)}${e.kind==='entrega'?' · entrega':''}${weightTxt(e)}`));
  if(all.length>shown.length)L.push(`- … y ${all.length-shown.length} más en el calendario.`);
  return R(L.join('\n'),[{label:'Ver calendario',run:()=>typeof switchView==='function'&&switchView('calendar')}]);
}
function tasksAnswer(day){
  const today=iso(new Date()),d=day||today,q=classesOn(d).q,tb=taskBuckets(d,q),L=[];
  const all=[...tb.pending.filter(t=>t.due).sort((a,b)=>a.due.localeCompare(b.due)).map(t=>`${subj(t.subjectId)?.short||''} · ${t.title} — ${shortDate(t.due)} (${rel(diffDays(today,t.due))})`),...tb.pers.filter(t=>t.date).sort((a,b)=>a.date.localeCompare(b.date)).map(t=>`${t.title} (personal) — ${shortDate(t.date)} (${rel(diffDays(today,t.date))})`)];
  if(day){
    L.push(`**Tareas para ${day===today?'hoy':longDate(day)}**`,'');
    if(tb.dueDay.length)tb.dueDay.forEach(t=>L.push(`- ${t}`));else L.push('- Nada pendiente para ese día.');
  }else{
    L.push('**Tareas pendientes**','');
    if(!all.length&&!tb.unsched)L.push('- No tienes tareas pendientes.');
    all.slice(0,10).forEach(t=>L.push(`- ${t}`));
    if(all.length>10)L.push(`- … y ${all.length-10} más.`);
    if(tb.unsched)L.push(`- ${plural(tb.unsched,'tarea sin fecha','tareas sin fecha')} en la bandeja.`);
  }
  return R(L.join('\n'),[{label:'Abrir bandeja',run:()=>typeof openPlanTasks==='function'&&openPlanTasks()}],false);
}
function classesAnswer(day){
  const{q,term,inTerm,list}=classesOn(day),L=[`**Clases · ${longDate(day)}**`,''];
  if(!inTerm)L.push(`- Fuera del periodo lectivo de Q${q} (${shortDate(term.start)} – ${shortDate(term.end)}).`);
  else if(!list.length)L.push('- Sin clases ese día.');
  else list.forEach(c=>L.push(`- ${c.start}–${c.end} · **${subj(c.sid)?.name||c.sid}** · ${c.type} · Aula ${c.room} · ${c.faculty}`));
  return R(L.join('\n'),[],false);
}
function gradesAnswer(sid){
  const list=(sid?[subj(sid)]:SUBJECTS).filter(Boolean),L=[sid?`**Notas · ${list[0].name}**`:'**Notas y media**',''];
  let any=false;
  list.forEach(s=>{
    let gi;try{gi=gradeInfo(s)}catch(_){return}
    if(!gi.filled&&!sid)return;any=true;
    const need=(()=>{try{return neededAverage(s)}catch(_){return null}})();
    L.push(`- **${s.short}**: ${gi.grade===null?'sin notas':`media ${gi.grade.toFixed(2).replace('.',',')} (${gi.filled}/${gi.total} pruebas)`}${gi.passed?' · aprobada':''}${gi.conditional?' · aprobada con mínimos pendientes':''}${need!==null&&need>0&&need<=10?` · necesitas ${need.toFixed(1).replace('.',',')} de media en lo que queda`:need!==null&&need>10?' · ya no llegas al 5 con lo que queda':''}`);
    if(sid)try{cfg(s).exams.forEach((e,i)=>{const v=state.grades[state.activeConv][key(s.id,i)];L.push(`  - ${e.name} (${pct(e.weight)}): ${v===undefined||v===''?'sin nota':String(v).replace('.',',')}`)})}catch(_){}
  });
  if(!any&&!sid)L.push('- Aún no has apuntado ninguna nota.');
  return R(L.join('\n'),[],false);
}
async function subjectAnswer(sid){
  await loadStudy();
  const s=subj(sid),today=iso(new Date()),L=[`**${s.name}** (${s.short}) · Q${s.q} · ${s.ects} ECTS`,''];
  const ups=eventsList().filter(e=>e.sid===sid&&e.date>=today);
  let gi=null;try{gi=gradeInfo(s)}catch(_){}
  if(gi?.filled)L.push(`- Nota actual: ${gi.grade.toFixed(2).replace('.',',')} (${gi.filled}/${gi.total} pruebas).`);
  if(s.schedule)L.push(`- Horario: ${s.schedule}.`);
  if(!ups.length)L.push('- No hay pruebas ni entregas con fecha a partir de hoy.');
  else{
    L.push('','**Próximas fechas**');
    ups.slice(0,6).forEach(e=>L.push(`- ${shortDate(e.date)} (${rel(diffDays(today,e.date))}) · ${e.name}${weightTxt(e)}`));
  }
  const pr=ups.find(e=>e.kind==='prueba'),actions=[];
  if(pr){L.push('','**Qué estudiar primero**',...studyLines(pr,today));actions.push(...studyActions(pr))}
  if(sid==='ssoo')actions.push({label:'Guía del examen de SSOO',go:'#ssoo'});
  actions.push({label:'Abrir ficha',run:()=>typeof openSubject==='function'&&openSubject(sid)});
  return R(L.join('\n'),actions);
}
async function studyPlan(){
  await loadStudy();
  const today=iso(new Date()),pr=eventsList().find(e=>e.date>=today&&e.kind==='prueba');
  if(!pr)return R('No hay exámenes con fecha a partir de hoy, así que no hay nada que preparar con urgencia.',[],false);
  return R(['**Qué estudiar ahora**','',...studyLines(pr,today)].join('\n'),studyActions(pr));
}
function helpAnswer(){
  return R(['**Puedo ayudarte con tu curso**','','- «¿Qué tengo que hacer hoy?» o «mañana», «el viernes», «el 12 de noviembre».','- «¿Qué tengo esta semana?» o «la semana que viene».','- «¿Cuándo es el próximo examen?» o «exámenes de SSOO».','- «¿Qué me falta por estudiar?» o «prepárame ED».','- «Tareas pendientes», «clases de mañana», «mis notas».',ai.enabled()?'- Con la IA activada, también preguntas libres sobre el temario: «explícame los procesos e hilos».':'- Activa la IA local (botón de arriba) para preguntas libres sobre el temario y consejos.'].join('\n'),[],false);
}

/* ---------- Interpretar la pregunta ---------- */
const WD={lunes:1,martes:2,miercoles:3,jueves:4,viernes:5,sabado:6,domingo:0};
const MONTHS={enero:1,ene:1,febrero:2,feb:2,marzo:3,mar:3,abril:4,abr:4,mayo:5,may:5,junio:6,jun:6,julio:7,jul:7,agosto:8,ago:8,septiembre:9,setiembre:9,sep:9,octubre:10,oct:10,noviembre:11,nov:11,diciembre:12,dic:12};
function subjectAliases(){
  const generic=new Set(['sistemas','estructura','economia','programacion','derecho','estados','operaciones','procesos','organizacion','bases','datos','empresariales','empresariales','sociedades','financieros','computadores','espanola','mundial','arquitectura','redes','avanzada','avanzadas','espanola']);
  return SUBJECTS.map(s=>{
    const a=new Set([norm(s.short),norm(s.name)]);if(s.id.length>=3)a.add(norm(s.id));
    norm(s.name).split(/[^a-z0-9]+/).filter(w=>w.length>=6&&!generic.has(w)).forEach(w=>a.add(w));
    return{id:s.id,aliases:[...a].filter(Boolean)};
  });
}
function findSubject(n){
  let best=null;
  for(const{id,aliases}of subjectAliases())for(const a of aliases){
    const m=new RegExp(`(^|[^a-z0-9])${a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^a-z0-9]|$)`).exec(n);
    if(m&&(!best||m.index<best.at))best={id,at:m.index};
  }
  return best?.id||null;
}
function findDate(n,today){
  if(/\bpasado manana\b/.test(n))return addDays(today,2);
  if(/\bmanana\b/.test(n)&&!/\bpor la manana\b/.test(n.replace(/\bmanana\b/,'manana')))return addDays(today,1);
  if(/\bmanana\b/.test(n))return addDays(today,1);
  if(/\b(hoy|esta noche|esta tarde)\b/.test(n))return today;
  let m=n.match(/\b(\d{1,2})\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/);
  let day,mon;
  if(m){day=+m[1];mon=MONTHS[m[2]]}
  else if((m=n.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/))){day=+m[1];mon=+m[2]}
  if(day&&mon&&day<=31&&mon<=12){
    const y=+today.slice(0,4);let c=`${y}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if(diffDays(today,c)<-30)c=`${y+1}${c.slice(4)}`;
    return c;
  }
  const wd=Object.keys(WD).find(k=>new RegExp(`\\b${k}\\b`).test(n));
  if(wd){const t=parseISO(today);let add=(WD[wd]-t.getDay()+7)%7;if(add===0)add=7;return addDays(today,add)}
  return null;
}
function findRange(n,today){
  const t=parseISO(today),dow=(t.getDay()+6)%7;
  if(/\b(proxima|siguiente|que viene)\b.*\bsemana\b|\bsemana\b.*\b(proxima|siguiente|que viene)\b/.test(n)){const mon=addDays(today,7-dow);return{from:mon,to:addDays(mon,6),title:'La semana que viene'}}
  if(/\besta semana\b|\bsemana\b/.test(n))return{from:today,to:addDays(today,6-dow),title:'Lo que queda de esta semana'};
  if(/\b(proximos|siguientes|estos)\s+(dias|7 dias|siete dias)\b/.test(n))return{from:today,to:addDays(today,6),title:'Los próximos 7 días'};
  return null;
}
function parse(q){
  const today=iso(new Date()),n=norm(q).replace(/[¿?¡!.,;:()"]/g,' ').replace(/\s+/g,' ').trim(),has=r=>r.test(n);
  return{
    n,today,subj:findSubject(n),date:findDate(n,today),range:findRange(n,today),
    grades:has(/\b(nota|notas|media|aprob\w*|calificaci\w*|suspend\w*|sacar)\b/),
    study:has(/\b(estudi\w*|prepar\w*|repas\w*|temario|temas?|me falta|falta por)\b/),
    exams:has(/\b(examen\w*|prueba\w*|pei\d?|pec\d?|pef|parcial\w*|final\w*|control\w*|tc\d)\b/),
    tasks:has(/\b(tarea\w*|deber\w*|entrega\w*|pendiente\w*|atrasad\w*|bandeja)\b/),
    classes:has(/\b(clase\w*|horario|aula|a que hora)\b/),
    greet:has(/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|ey)\b/)&&n.split(' ').length<=4,
    help:has(/\b(ayuda|que puedes|que sabes|como funcionas|que haces)\b/),
    plan:has(/\b(hacer|toca|tengo|hay|agenda|plan|prioridad|prioritario|primero|empezar|hoy)\b/),
  };
}
async function deterministic(p){
  if(p.help)return helpAnswer();
  if(p.grades)return gradesAnswer(p.subj);
  if(p.subj&&(p.study||p.exams||(!p.tasks&&!p.classes&&!p.date&&!p.range)))return subjectAnswer(p.subj);
  if(p.range)return planRange(p.range.from,p.range.to,p.range.title);
  if(p.classes&&!p.tasks&&!p.study)return classesAnswer(p.date||p.today);
  if(p.tasks&&!p.study)return tasksAnswer(p.date);
  if(p.exams&&!p.date&&!p.study)return examsAnswer(null);
  if(p.study&&!p.date)return studyPlan();
  if(p.greet){const r=await planDay(p.today);r.text=`¡Hola! Esto es lo que tienes hoy.\n\n${r.text}`;return r}
  if(p.date)return planDay(p.date);
  if(p.plan)return planDay(p.today);
  return null;
}

/* ---------- Contexto para el modelo ---------- */
const tokens=s=>norm(s).split(/[^a-z0-9]+/).filter(w=>w.length>=4);
function retrieveStudy(n,sid){
  const qt=tokens(n),found=[];if(!qt.length)return'';
  for(const[id,d]of Object.entries(STUDYC)){
    if(sid&&id!==sid)continue;
    for(const t of d.topics||[]){
      const notes=(t.notes||[]).flatMap(x=>x.h?[x.h]:x.p?[x.p]:x.list?x.list:x.tip?[x.tip]:x.warn?[x.warn]:[]);
      const chunks=[...(t.guide||[]).map(x=>({k:'guía',x})),...(t.cards||[]).map(c=>({k:'ficha',x:`${c[0]} → ${c[1]}`})),...notes.map(x=>({k:'apunte',x}))];
      let score=0;const hits=[];
      for(const c of chunks){const ct=new Set(tokens(c.x));const s=qt.filter(w=>ct.has(w)).length;if(s){score+=s;hits.push({...c,s})}}
      const ts=new Set(tokens(t.title));score+=qt.filter(w=>ts.has(w)).length*2;
      if(score)found.push({sid:id,t,score,hits:hits.sort((a,b)=>b.s-a.s).slice(0,4)});
    }
  }
  found.sort((a,b)=>b.score-a.score);
  return found.slice(0,2).map(f=>`[${subj(f.sid)?.short||f.sid}] ${f.t.title}\n`+f.hits.map(h=>`- (${h.k}) ${String(h.x).replace(/\*\*/g,'').slice(0,300)}`).join('\n')).join('\n\n').slice(0,1800);
}
function contextText(p){
  const now=new Date(),today=iso(now),q=quarterOf(now),{inTerm,term,list}=classesOn(today),evs=eventsList().filter(e=>e.date>=today),L=[];
  L.push(`FECHA: ${longDate(today)} de ${now.getFullYear()}, ${now.toTimeString().slice(0,5)}. Cuatrimestre Q${q}${inTerm?` (lectivo hasta el ${shortDate(term.end)})`:' (fuera de periodo lectivo)'}.`);
  L.push('ASIGNATURAS: '+SUBJECTS.filter(s=>s.q===q).map(s=>`${s.short}=${s.name}`).join('; '));
  L.push('CLASES HOY: '+(list.length?list.map(c=>`${c.start}-${c.end} ${subj(c.sid)?.short} aula ${c.room}`).join('; '):'ninguna'));
  const tb=taskBuckets(today,q);
  L.push('TAREAS PARA HOY: '+(tb.dueDay.join('; ')||'ninguna')+(tb.overdue.length?` | ATRASADAS: ${tb.overdue.slice(0,5).join('; ')}`:'')+(tb.unsched?` | SIN FECHA: ${tb.unsched}`:''));
  L.push('PRÓXIMAS PRUEBAS Y ENTREGAS (los días ya están calculados):');
  evs.slice(0,8).forEach(e=>{const st=examStudy(e);L.push(`- ${shortDate(e.date)} (${rel(diffDays(today,e.date))}) ${evLabel(e)} [${e.kind}]${weightTxt(e)}${st.topics.length?` · temas: ${st.topics.map(t=>`${t.short} ${pct(t.progress)}`).join('; ').slice(0,260)}`:''}`)});
  if(!evs.length)L.push('- ninguna');
  if(p.subj){
    const s=subj(p.subj);L.push('',`DETALLE ${s.short}: ${s.name}, Q${s.q}, ${s.ects} ECTS. ${String(s.info||'').slice(0,450)}`);
    try{L.push('Evaluación: '+cfg(s).exams.map((e,i)=>{const v=state.grades[state.activeConv][key(s.id,i)];return`${e.name} ${pct(e.weight)}${v!==undefined&&v!==''?` (nota ${v})`:''}`}).join('; '))}catch(_){}
  }
  const rag=retrieveStudy(p.n,p.subj);
  if(rag)L.push('','EXTRACTOS DEL TEMARIO:',rag);
  return L.join('\n');
}
const SYSTEM='Eres el asistente del Atlas Académico de INFOADE (3.º, UAH). Respondes siempre en español, breve y concreto (máximo 120 palabras salvo que pidan más), con listas cortas cuando ayuden. Usa SOLO los datos del bloque DATOS: las fechas y los días que faltan ya están calculados, cópialos tal cual y no calcules fechas. Si falta un dato, dilo. No inventes exámenes, notas ni temas. Si preguntan qué hacer, da 2 a 4 acciones ordenadas por prioridad, empezando por lo más urgente. No repitas estas instrucciones ni empieces con «Claro».';

/* ---------- Motor de IA local ---------- */
const PROFILES={
  auto:{label:'Automático',hint:'La IA integrada de Chrome o Edge si existe; si no, el modelo ligero.',size:'0,9 GB',mb:900,models:['Llama-3.2-1B-Instruct-q4f16_1-MLC']},
  light:{label:'Ligero',hint:'Rápido y pequeño. Casi cualquier equipo.',size:'0,9 GB',mb:900,models:['Llama-3.2-1B-Instruct-q4f16_1-MLC']},
  balanced:{label:'Equilibrado',hint:'Qwen 3.5 de 2B: razona mucho mejor y escribe buen español.',size:'2,2 GB',mb:2300,models:['Qwen3.5-2B-q4f16_1-MLC','Qwen3-1.7B-q4f16_1-MLC','Qwen2.5-1.5B-Instruct-q4f16_1-MLC']},
  advanced:{label:'Avanzado',hint:'Qwen 3.5 de 4B. GPU con unos 4 GB.',size:'3,9 GB',mb:3900,models:['Qwen3.5-4B-q4f16_1-MLC','Qwen3-4B-q4f16_1-MLC','Phi-4-mini-instruct-q4f16_1-MLC']},
  max:{label:'Máximo',hint:'Qwen 3.5 de 9B. GPU con 8 GB.',size:'6,4 GB',mb:6500,models:['Qwen3.5-9B-q4f16_1-MLC','Qwen3-8B-q4f16_1-MLC','Qwen2.5-7B-Instruct-q4f16_1-MLC']},
  server:{label:'Tu ordenador (Ollama / LM Studio)',hint:'Modelos grandes que ya tengas instalados. Gratis y privado.',size:'',mb:0,models:[]},
};
const BUILTIN={expectedInputs:[{type:'text',languages:['es']}],expectedOutputs:[{type:'text',languages:['es']}]};
const WEBLLM_URL='https://esm.run/@mlc-ai/web-llm@0.2.84';
const ai={
  engine:null,worker:null,loading:null,builtin:null,cap:null,
  enabled:()=>ls.get('enabled')==='1',
  profile(){const v=ls.get('profile');return PROFILES[v]?v:'auto'},
  webllmKey(){const p=this.profile();return p==='auto'||p==='server'?'light':p},
  server:()=>ls.json('server',{url:'http://localhost:11434',model:''}),
  status:msg=>setStatus(msg),
};
async function inspect(){
  const profile=ai.profile();
  if(profile==='server')return ai.server().url?{kind:'server'}:{kind:'none',reason:'Indica la dirección de tu servidor (Ollama o LM Studio).'};
  if(profile==='auto'&&globalThis.LanguageModel?.availability){
    try{const a=await globalThis.LanguageModel.availability(BUILTIN);if(a!=='unavailable')return{kind:'builtin',availability:a}}catch(_){}
  }
  if(!isSecureContext)return{kind:'none',reason:'La IA local necesita una conexión segura (HTTPS).'};
  if(!navigator.gpu)return{kind:'none',reason:'Este navegador no ofrece WebGPU. Prueba con Chrome o Edge actualizados, o usa tu propio servidor (Ollama).'};
  try{
    if(!await navigator.gpu.requestAdapter())return{kind:'none',reason:'WebGPU está desactivado o tu GPU no es compatible.'};
    const est=await navigator.storage?.estimate?.(),free=Math.max(0,(est?.quota||0)-(est?.usage||0)),need=PROFILES[ai.webllmKey()];
    if(free&&!ai.engine&&free<need.mb*1.2e6)return{kind:'none',reason:`No hay espacio local suficiente para el modelo «${need.label}» (unos ${need.size}). Elige uno más ligero.`};
    return{kind:'webllm'};
  }catch(_){return{kind:'none',reason:'No se pudo inicializar WebGPU en este dispositivo.'}}
}
function friendly(err){
  if(err?.name==='ServerAIError')return err.message;
  const m=String(err?.message||err||'').trim(),d=`${err?.name||''} ${m}`.toLowerCase();
  if(/out of memory|memory|allocation|device lost|gpu device/.test(d))return'La GPU no tiene memoria suficiente para el modelo. Elige uno más ligero.';
  if(/quota|storage|cache|space|disk/.test(d))return'No hay espacio local suficiente para terminar la descarga del modelo.';
  if(/network|fetch|failed to fetch|cors|load model/.test(d))return'La descarga del modelo se interrumpió. Pulsa enviar de nuevo para reanudarla; lo descargado se conserva.';
  if(/notsupported|not supported|unsupported/.test(d))return'Este navegador no admite el modelo local solicitado.';
  return m?`No se pudo usar la IA: ${m}`:'No se pudo usar la IA. Comprueba WebGPU, memoria y espacio disponible.';
}
const serverError=m=>Object.assign(new Error(m),{name:'ServerAIError'});
/* Oculta el razonamiento <think>…</think> de los modelos que lo emiten. */
function withoutThinking(onToken){
  const open='<think>',close='</think>';let inside=false,pending='';
  return delta=>{
    pending+=delta;let out='';
    while(pending){
      if(inside){const end=pending.indexOf(close);if(end<0){pending=pending.slice(-close.length);break}pending=pending.slice(end+close.length);inside=false;continue}
      const start=pending.indexOf(open);
      if(start>=0){out+=pending.slice(0,start);pending=pending.slice(start+open.length);inside=true;continue}
      let keep=0;for(let k=Math.min(open.length-1,pending.length);k>0;k--)if(open.startsWith(pending.slice(-k))){keep=k;break}
      out+=pending.slice(0,pending.length-keep);pending=pending.slice(pending.length-keep);break;
    }
    if(out)onToken(out);
  };
}
async function streamServer({messages,maxTokens,signal,onToken}){
  const{url,model}=ai.server();
  if(!model)throw serverError('Indica el modelo de tu servidor en los ajustes del motor (por ejemplo qwen2.5:7b).');
  let res;
  try{res=await fetch(`${url.replace(/\/+$/,'')}/v1/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages,stream:true,temperature:.2,max_tokens:maxTokens}),signal})}
  catch(e){if(e?.name==='AbortError')throw e;throw serverError(`No se pudo conectar con ${url}. Comprueba que Ollama o LM Studio está abierto y admite esta web (en Ollama: OLLAMA_ORIGINS=${location.origin}).`)}
  if(!res.ok){const t=await res.text().catch(()=>'');throw serverError(res.status===404?`El servidor no tiene el modelo «${model}». Descárgalo (ollama pull ${model}) o elige otro.`:`El servidor respondió con un error ${res.status}. ${t.slice(0,160)}`)}
  const reader=res.body.getReader(),dec=new TextDecoder();let buf='';
  for(;;){
    const{value,done}=await reader.read();if(done)break;
    buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop();
    for(const line of lines){
      const data=line.replace(/^data:\s*/,'').trim();
      if(!data||data==='[DONE]'||!line.startsWith('data:'))continue;
      try{const d=JSON.parse(data).choices?.[0]?.delta?.content;if(d)onToken(d)}catch(_){}
    }
  }
}
function flatten(messages){
  const sys=messages.filter(m=>m.role==='system').map(m=>m.content).join('\n');
  const rest=messages.filter(m=>m.role!=='system');
  return rest.length===1?`${sys}\n\n${rest[0].content}`:`${sys}\n\n${rest.map(m=>`${m.role==='user'?'Usuario':'Asistente'}: ${m.content}`).join('\n\n')}\n\nAsistente:`;
}
async function builtinSession(){
  if(ai.builtin)return ai.builtin;
  const a=await globalThis.LanguageModel.availability(BUILTIN);
  if(a==='unavailable')return null;
  ai.status(a==='available'?'Iniciando el modelo integrado…':'Descargando el modelo integrado del navegador…');
  ai.builtin=await globalThis.LanguageModel.create({...BUILTIN,monitor(m){m.addEventListener('downloadprogress',e=>ai.status(`Descargando el modelo integrado: ${Math.round(e.loaded*100)}%`))}});
  return ai.builtin;
}
function chooseModel(webllm){
  const entries=(webllm.prebuiltAppConfig?.model_list||[]).map(e=>e.model_id).filter(Boolean);
  const want=PROFILES[ai.webllmKey()].models.find(id=>entries.includes(id));
  return want||entries.find(id=>id==='Llama-3.2-1B-Instruct-q4f16_1-MLC')||entries.find(id=>/(?:1B|2B|3B).*Instruct.*q4f16_1/i.test(id)&&!/vision|llava|vl/i.test(id))||'Llama-3.2-1B-Instruct-q4f16_1-MLC';
}
async function webllmEngine(){
  if(ai.engine)return ai.engine;
  if(ai.loading)return ai.loading;
  ai.loading=(async()=>{
    ai.status('Preparando el motor de IA local…');
    const webllm=await import(WEBLLM_URL),model=chooseModel(webllm);
    ai.worker=new Worker(new URL('ai-worker.js?v=1',BASE),{type:'module'});
    ai.engine=await webllm.CreateWebWorkerMLCEngine(ai.worker,model,{initProgressCallback:p=>ai.status(p.text||'Descargando el modelo local…')});
    return ai.engine;
  })();
  try{return await ai.loading}catch(e){ai.worker?.terminate();ai.worker=null;ai.engine=null;throw e}finally{ai.loading=null}
}
async function streamChat({messages,maxTokens=400,signal,onToken}){
  const cap=await inspect();
  if(cap.kind==='none')throw new Error(cap.reason);
  onToken=withoutThinking(onToken);
  if(cap.kind==='server')return streamServer({messages,maxTokens,signal,onToken});
  if(cap.kind==='builtin'){
    const base=await builtinSession();if(!base)throw new Error('La IA integrada no está disponible.');
    const session=base.clone?await base.clone({signal}):base;
    try{
      let prev='';
      for await(const chunk of session.promptStreaming(flatten(messages),{signal})){
        const v=String(chunk||''),delta=prev&&v.startsWith(prev)?v.slice(prev.length):v;
        prev=v.startsWith(prev)?v:prev+v;if(delta)onToken(delta);
      }
    }finally{if(session!==base)session.destroy?.()}
    return;
  }
  const engine=await webllmEngine();ai.status('');
  const stream=await engine.chat.completions.create({messages,temperature:.2,max_tokens:maxTokens,stream:true,extra_body:{enable_thinking:false}});
  for await(const chunk of stream){
    if(signal.aborted){engine.interruptGenerate?.();throw new DOMException('Detenido','AbortError')}
    const d=chunk.choices?.[0]?.delta?.content||'';if(d)onToken(d);
  }
}
async function resetEngine(){
  try{await ai.engine?.unload?.()}catch(_){}
  ai.worker?.terminate();ai.engine=null;ai.worker=null;ai.builtin=null;ai.cap=null;
}

/* ---------- Interfaz ---------- */
const CSS=`
#assistantBtn{background:var(--forest,#153c2d)!important;color:var(--acid,#dfff59)!important;border-color:#17201b!important;font-weight:800}
@media(max-width:760px){#assistantBtn:after{content:'✦';font-size:15px}}
.as-overlay{position:fixed;inset:0;z-index:280;display:none;font-family:var(--font,'DM Sans',sans-serif)}
.as-overlay.open{display:block}
.as-scrim{position:absolute;inset:0;background:rgba(21,60,45,.45)}
.as-panel{position:absolute;right:0;top:0;bottom:0;width:min(500px,100%);background:var(--paper,#fffdf7);border-left:2px solid #17201b;display:flex;flex-direction:column;min-height:0}
.as-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:14px 16px 12px;border-bottom:2px solid #17201b}
.as-eyebrow{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--orange,#ff6b3d)}
.as-head h2{font:400 26px/1.05 'DM Serif Display',serif;margin:2px 0 0;color:var(--forest,#153c2d)}
.as-head-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
.as-chip,.as-icon{border:1.5px solid #17201b;background:#fff;border-radius:99px;font:700 12px var(--font,'DM Sans',sans-serif);padding:6px 11px;cursor:pointer;color:#17201b;display:inline-flex;gap:6px;align-items:center}
.as-icon{width:32px;height:32px;padding:0;justify-content:center;font-size:15px}
.as-chip i{width:8px;height:8px;border-radius:50%;background:#aab5ae}.as-chip.on i{background:var(--green,#16855b)}
.as-log{flex:1;min-height:0;overflow:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}
.as-msg{max-width:94%;border:1.5px solid #17201b;border-radius:14px;padding:10px 13px;font-size:14px;line-height:1.45;overflow-wrap:anywhere}
.as-msg.user{align-self:flex-end;background:var(--forest,#153c2d);color:var(--acid,#dfff59);border-radius:14px 14px 3px 14px}
.as-msg.bot{align-self:flex-start;background:#fff;color:#17201b;border-radius:14px 14px 14px 3px;box-shadow:3px 3px 0 #17201b}
.as-msg p{margin:0 0 6px}.as-msg p:last-child{margin-bottom:0}
.as-msg ul{margin:2px 0 6px;padding-left:18px}.as-msg li{margin:2px 0}
.as-msg b{font-weight:800}.as-msg code{background:#eef1ec;border-radius:4px;padding:0 4px;font-size:12.5px}
.as-msg h4{margin:0 0 4px;font:400 17px 'DM Serif Display',serif;color:var(--forest,#153c2d)}
.as-advice{margin-top:8px;padding:8px 10px;border-radius:10px;background:#f3f8d9;border:1.5px dashed #17201b;font-size:13.5px}
.as-advice small{display:block;font:800 10px var(--font,'DM Sans',sans-serif);letter-spacing:.1em;text-transform:uppercase;color:var(--forest,#153c2d);margin-bottom:3px}
.as-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.as-act{border:1.5px solid #17201b;background:var(--acid,#dfff59);border-radius:99px;padding:6px 12px;font:800 12px var(--font,'DM Sans',sans-serif);cursor:pointer;color:#17201b}
.as-act:hover{background:#17201b;color:var(--acid,#dfff59)}
.as-err{color:#c2410c;font-weight:700}
.as-typing{display:inline-block;width:7px;height:7px;border-radius:50%;background:#17201b;opacity:.45;animation:asblink 1s infinite}
@keyframes asblink{50%{opacity:1}}
.as-status{padding:0 16px 6px;font-size:12px;color:var(--muted,#53615a);min-height:0}.as-status:empty{display:none}
.as-chips{display:flex;gap:6px;overflow-x:auto;padding:0 16px 8px;scrollbar-width:none}.as-chips::-webkit-scrollbar{display:none}
.as-chips button{flex:0 0 auto;border:1.5px solid #17201b;background:#fffdf7;border-radius:99px;padding:6px 11px;font:700 12px var(--font,'DM Sans',sans-serif);cursor:pointer;color:#17201b;white-space:nowrap}
.as-chips button:hover{background:var(--acid,#dfff59)}
.as-form{display:flex;gap:8px;padding:10px 16px calc(12px + env(safe-area-inset-bottom));border-top:2px solid #17201b;background:#fff}
.as-form textarea{flex:1;min-width:0;resize:none;font:inherit;font-size:16px;padding:10px 12px;border:1.5px solid #17201b;border-radius:12px;background:var(--paper,#fffdf7);max-height:120px}
.as-send,.as-stop{border:2px solid #17201b;border-radius:12px;background:var(--acid,#dfff59);font:800 13px var(--font,'DM Sans',sans-serif);padding:0 14px;cursor:pointer;color:#17201b;box-shadow:2px 2px 0 #17201b}
.as-stop{background:#ffd9cc}
.as-settings{border-bottom:2px solid #17201b;padding:12px 16px;background:#f6f8f2;max-height:60%;overflow:auto;font-size:13px}
.as-settings[hidden]{display:none}
.as-settings p{margin:0 0 8px;color:var(--muted,#53615a)}
.as-profiles{display:grid;gap:6px;margin:8px 0}
.as-profiles button{text-align:left;border:1.5px solid #17201b;background:#fff;border-radius:10px;padding:8px 10px;cursor:pointer;font:inherit;color:#17201b;display:grid;gap:2px}
.as-profiles button[aria-checked=true]{background:var(--forest,#153c2d);color:#fff}
.as-profiles button span{display:flex;justify-content:space-between;gap:8px;font-weight:800}
.as-profiles button em{font-style:normal;font-size:12px;opacity:.85}
.as-set-row{display:grid;gap:4px;margin:8px 0;font-weight:700;font-size:12px}
.as-set-row input{font:inherit;font-size:14px;padding:8px 10px;border:1.5px solid #17201b;border-radius:8px;background:#fff}
.as-set-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center}
.as-set-btns button{border:2px solid #17201b;border-radius:10px;background:#fff;font:800 12px var(--font,'DM Sans',sans-serif);padding:8px 12px;cursor:pointer;color:#17201b}
.as-set-btns .primary{background:var(--acid,#dfff59);box-shadow:2px 2px 0 #17201b}
.as-set-note{font-size:12px;color:var(--muted,#53615a)}
@media(max-width:760px){.as-panel{width:100%;border-left:0}.as-head h2{font-size:23px}}
`;
const SUGGESTIONS=['¿Qué tengo que hacer hoy?','¿Cuándo es el próximo examen?','¿Qué me falta por estudiar?','¿Qué tengo esta semana?','Tareas pendientes','¿Qué clases tengo mañana?'];
let overlay=null,log=null,form=null,input=null,busy=false,abort=null,history=[],opener=null;
const $a=s=>overlay?.querySelector(s);
function setStatus(msg){
  const el=$a('.as-status');if(!el)return;
  const raw=String(msg||''),p=raw.match(/(\d{1,3})(?:\.\d+)?%/)?.[1];
  el.textContent=/fetching param cache/i.test(raw)?`Preparando el modelo local${p?` · ${p}%`:''}`:/loading model/i.test(raw)?`Cargando el modelo local${p?` · ${p}%`:''}`:raw;
}
/* Markdown mínimo: **negrita**, *cursiva*, `código`, listas con - y títulos con #. */
function md(src){
  const inline=s=>s.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*(?![\s*])(.+?)\*(?!\*)/g,'$1<i>$2</i>').replace(/`([^`]+)`/g,'<code>$1</code>');
  let out='',list=false;
  for(const raw of html(src).split('\n')){
    const l=raw.trimEnd(),li=l.match(/^\s*(?:[-•]|\d+[.)])\s+(.*)/);
    if(li){if(!list){out+='<ul>';list=true}out+=`<li>${inline(li[1])}</li>`;continue}
    if(list){out+='</ul>';list=false}
    if(!l.trim())continue;
    const h=l.match(/^#{1,4}\s+(.*)/);out+=h?`<h4>${inline(h[1])}</h4>`:`<p>${inline(l)}</p>`;
  }
  return out+(list?'</ul>':'');
}
function scrollEnd(){if(log)log.scrollTop=log.scrollHeight}
function addMsg(role,text=''){
  const el=document.createElement('div');el.className=`as-msg ${role}`;
  const body=document.createElement('div');body.className='as-body';body.innerHTML=role==='user'?html(text):md(text);
  el.append(body);log.append(el);scrollEnd();return{el,body};
}
function addActions(msg,actions){
  if(!actions?.length)return;
  const box=document.createElement('div');box.className='as-acts';
  actions.forEach(a=>{
    const b=document.createElement('button');b.type='button';b.className='as-act';b.textContent=a.label;
    b.onclick=()=>{close();if(a.go)location.hash===a.go?window.dispatchEvent(new HashChangeEvent('hashchange')):location.hash=a.go;else a.run?.()};
    box.append(b);
  });
  msg.el.append(box);scrollEnd();
}
function refreshChip(){
  const chip=$a('[data-as-engine]');if(!chip)return;
  const on=ai.enabled();chip.classList.toggle('on',on);
  chip.querySelector('span').textContent=on?`IA · ${ai.profile()==='server'?'tu servidor':PROFILES[ai.profile()].label}`:'IA desactivada';
}
function needAi(){
  const m=addMsg('bot','Esa pregunta necesita la IA local: con ella contesto preguntas libres y también sobre el temario. Las consultas de agenda, exámenes, tareas, clases y notas las resuelvo sin IA.');
  addActions(m,[{label:'Activar la IA',run:()=>openSettings()}]);
}
function chatMessages(user,extra){
  return[{role:'system',content:SYSTEM},...history.slice(-4),{role:'user',content:extra?`${extra}\n\nPREGUNTA: ${user}`:user}];
}
async function runStream(msgBody,messages,maxTokens){
  abort=new AbortController();let text='',raf=0;
  const paint=()=>{raf=0;msgBody.innerHTML=md(text)||'<span class="as-typing"></span>';scrollEnd()};
  msgBody.innerHTML='<span class="as-typing"></span>';
  try{
    await streamChat({messages,maxTokens,signal:abort.signal,onToken:d=>{text+=d;if(!raf)raf=requestAnimationFrame(paint)}});
  }finally{cancelAnimationFrame(raf);paint();setStatus('')}
  return text.trim();
}
async function ask(q){
  q=q.trim();if(!q||busy)return;
  if(!ready()){addMsg('bot','Los datos del atlas aún se están cargando. Inténtalo en un momento.');return}
  busy=true;form.classList.add('busy');$a('.as-send').hidden=true;$a('.as-stop').hidden=false;
  addMsg('user',q);
  try{
    const p=parse(q),det=await deterministic(p);
    if(det){
      const m=addMsg('bot',det.text);addActions(m,det.actions);
      history.push({role:'user',content:q},{role:'assistant',content:det.text.replace(/\*\*/g,'')});
      if(det.advice&&ai.enabled()){
        const adv=document.createElement('div');adv.className='as-advice';adv.innerHTML='<small>✦ Consejo de la IA</small><div class="as-adv-body"></div>';m.el.insertBefore(adv,m.el.querySelector('.as-acts'));
        try{
          const t=await runStream(adv.querySelector('.as-adv-body'),[{role:'system',content:SYSTEM},{role:'user',content:`DATOS:\n${contextText(p)}\n\nPLAN QUE YA SE LE HA MOSTRADO AL ALUMNO:\n${det.text.replace(/\*\*/g,'')}\n\nEscribe un consejo de 2 o 3 frases (máximo 60 palabras) sobre por dónde empezar y por qué. No repitas el plan ni inventes datos.`}],160);
          if(!t)adv.remove();
        }catch(e){if(e?.name==='AbortError')adv.remove();else{adv.remove();console.info('Consejo de IA no disponible',e)}}
      }
    }else if(ai.enabled()){
      const m=addMsg('bot','');
      try{
        const t=await runStream(m.body,chatMessages(q,`DATOS:\n${contextText(p)}`),450);
        if(t)history.push({role:'user',content:q},{role:'assistant',content:t});else m.body.innerHTML=md('No he podido generar una respuesta. Prueba a reformular la pregunta.');
      }catch(e){
        if(e?.name==='AbortError')m.body.innerHTML+=' <i>(detenido)</i>';
        else m.body.innerHTML=`<span class="as-err">${html(friendly(e))}</span>`;
      }
    }else needAi();
  }catch(e){addMsg('bot',`<span class="as-err">${html(friendly(e))}</span>`)}
  finally{busy=false;abort=null;form.classList.remove('busy');$a('.as-send').hidden=false;$a('.as-stop').hidden=true;input.focus()}
}
function headline(){
  try{
    const today=iso(new Date()),{list,inTerm}=classesOn(today),q=quarterOf(new Date()),tb=taskBuckets(today,q),pr=eventsList().find(e=>e.date>=today&&e.kind==='prueba');
    return`Hoy: ${inTerm?plural(list.length,'clase','clases'):'sin periodo lectivo'} · ${plural(tb.dueDay.length+tb.overdue.length,'tarea','tareas')} · ${pr?`${pr.short} ${rel(diffDays(today,pr.date))}`:'sin exámenes con fecha'}`;
  }catch(_){return''}
}
function welcome(){
  log.innerHTML='';history=[];
  const m=addMsg('bot',`**Hola, soy el asistente de tu atlas.**\n\nPregúntame en lenguaje natural qué tienes que hacer, cuándo son los exámenes o qué estudiar primero.${ready()?`\n\n${headline()}`:''}`);
  addActions(m,[{label:'¿Qué hago hoy?',run:()=>{open();ask('¿Qué tengo que hacer hoy?')}}]);
}
function renderSettings(){
  const box=$a('.as-settings'),cur=ai.profile(),srv=ai.server(),on=ai.enabled();
  box.innerHTML=`<p><b>Motor de IA local.</b> Todo corre en tu dispositivo y no hay coste por uso. Los modelos se descargan una sola vez.</p>
  <div class="as-profiles" role="radiogroup" aria-label="Motor de IA">${Object.entries(PROFILES).map(([id,p])=>`<button type="button" role="radio" aria-checked="${id===cur}" data-as-profile="${id}"><span>${html(p.label)}${p.size&&id!=='auto'?`<small>${p.size}</small>`:''}</span><em>${html(p.hint)}</em></button>`).join('')}</div>
  ${cur==='server'?`<label class="as-set-row">Dirección<input data-as-server="url" value="${html(srv.url)}" placeholder="http://localhost:11434" spellcheck="false"></label><label class="as-set-row">Modelo<input data-as-server="model" list="asModels" value="${html(srv.model)}" placeholder="qwen2.5:7b" spellcheck="false"></label><datalist id="asModels"></datalist><p class="as-set-note">Instala Ollama o LM Studio, descarga un modelo (<code>ollama pull qwen2.5:7b</code>) y permite esta web: <code>OLLAMA_ORIGINS=${html(location.origin)} ollama serve</code>.</p>`:''}
  <div class="as-set-note" data-as-cap>Comprobando este dispositivo…</div>
  <div class="as-set-btns"><button type="button" class="primary" data-as-toggle>${on?'Desactivar la IA':'Activar la IA'}</button>${cur==='server'?'<button type="button" data-as-test>Probar conexión</button>':''}<button type="button" data-as-close-settings>Cerrar ajustes</button></div>`;
  inspect().then(c=>{
    const el=box.querySelector('[data-as-cap]');if(!el)return;
    el.textContent=c.kind==='builtin'?'Este navegador trae IA integrada: se usará sin descargas propias.':c.kind==='webllm'?`Este dispositivo admite WebGPU: al activar se descargará el modelo «${PROFILES[ai.webllmKey()].label}» (unos ${PROFILES[ai.webllmKey()].size}) la primera vez que preguntes.`:c.kind==='server'?'Se usará tu servidor local.':c.reason;
  });
}
function openSettings(force){
  const box=$a('.as-settings');box.hidden=force===undefined?!box.hidden:!force;
  if(!box.hidden)renderSettings();
}
async function onSettingsClick(ev){
  const b=ev.target.closest('button');if(!b)return;
  if(b.dataset.asProfile){
    if(b.dataset.asProfile===ai.profile())return;
    ls.set('profile',b.dataset.asProfile);await resetEngine();renderSettings();refreshChip();return;
  }
  if(b.dataset.asCloseSettings!==undefined)return openSettings(false);
  if(b.dataset.asToggle!==undefined){
    if(ai.enabled()){ls.set('enabled','0');await resetEngine();renderSettings();refreshChip();return}
    const c=await inspect();
    if(c.kind==='none'){const el=$a('[data-as-cap]');if(el)el.textContent=c.reason;return}
    ls.set('enabled','1');renderSettings();refreshChip();openSettings(false);
    addMsg('bot',`IA activada. ${c.kind==='webllm'?`La primera pregunta descargará el modelo (unos ${PROFILES[ai.webllmKey()].size}); después funciona sin conexión.`:'Ya puedes hacer preguntas libres y recibirás un consejo con cada plan.'}`);
    return;
  }
  if(b.dataset.asTest!==undefined){
    const el=$a('[data-as-cap]');el.textContent='Conectando…';
    try{
      const{url}=ai.server(),r=await fetch(`${url.replace(/\/+$/,'')}/v1/models`);if(!r.ok)throw new Error(String(r.status));
      const ids=((await r.json()).data||[]).map(m=>m.id).filter(Boolean);
      $a('#asModels').innerHTML=ids.map(id=>`<option value="${html(id)}">`).join('');
      el.textContent=ids.length?`Conectado · ${plural(ids.length,'modelo','modelos')}: ${ids.slice(0,4).join(', ')}${ids.length>4?'…':''}`:'Conectado, pero no hay modelos descargados.';
    }catch(_){el.textContent=`Sin conexión con ${ai.server().url}. Revisa que esté abierto y permita esta web.`}
  }
}
function build(){
  const st=document.createElement('style');st.textContent=CSS;document.head.append(st);
  overlay=document.createElement('div');overlay.className='as-overlay';overlay.id='assistantOverlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Asistente del atlas');
  overlay.innerHTML=`<div class="as-scrim" data-as-close></div><section class="as-panel">
    <header class="as-head"><div><div class="as-eyebrow">Atlas · IA local</div><h2>Asistente</h2></div>
      <div class="as-head-actions"><button type="button" class="as-chip" data-as-engine title="Motor de IA"><i></i><span>IA desactivada</span></button><button type="button" class="as-icon" data-as-clear aria-label="Nueva conversación" title="Nueva conversación">↺</button><button type="button" class="as-icon" data-as-close aria-label="Cerrar">✕</button></div></header>
    <div class="as-settings" hidden></div>
    <div class="as-log" role="log" aria-live="polite"></div>
    <div class="as-status" role="status"></div>
    <div class="as-chips">${SUGGESTIONS.map(s=>`<button type="button" data-as-q="${html(s)}">${html(s)}</button>`).join('')}</div>
    <form class="as-form"><textarea rows="1" placeholder="Pregunta al asistente…" aria-label="Pregunta al asistente"></textarea><button type="submit" class="as-send">Enviar</button><button type="button" class="as-stop" hidden>Parar</button></form></section>`;
  document.body.append(overlay);
  log=$a('.as-log');form=$a('.as-form');input=$a('textarea');
  overlay.addEventListener('click',ev=>{
    if(ev.target.closest('[data-as-close]'))return close();
    if(ev.target.closest('[data-as-engine]'))return openSettings();
    if(ev.target.closest('[data-as-clear]')){abort?.abort();welcome();return}
    const q=ev.target.closest('[data-as-q]');if(q)return ask(q.dataset.asQ);
    if(ev.target.closest('.as-stop'))return abort?.abort();
    if(ev.target.closest('.as-settings'))onSettingsClick(ev);
  });
  overlay.addEventListener('change',ev=>{
    const f=ev.target.dataset?.asServer;if(!f)return;
    ls.set('server',JSON.stringify({...ai.server(),[f]:ev.target.value.trim()}));ai.cap=null;
  });
  form.addEventListener('submit',ev=>{ev.preventDefault();const v=input.value;input.value='';input.style.height='';ask(v)});
  input.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!ev.shiftKey&&!ev.isComposing){ev.preventDefault();form.requestSubmit()}});
  input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(120,input.scrollHeight)+'px'});
  welcome();refreshChip();
}
function open(){
  if(!overlay)build();
  if(overlay.classList.contains('open'))return;
  opener=document.activeElement;overlay.classList.add('open');document.body.style.overflow='hidden';
  refreshChip();setTimeout(()=>input.focus(),30);
}
function close(){
  if(!overlay?.classList.contains('open'))return;
  overlay.classList.remove('open');document.body.style.overflow='';
  try{opener?.focus?.()}catch(_){}
}
function mountButton(){
  if(document.getElementById('assistantBtn'))return;
  const bar=document.querySelector('.header-actions');if(!bar)return;
  const b=document.createElement('button');b.type='button';b.className='btn';b.id='assistantBtn';b.title='Asistente (Alt+I)';b.textContent='✦ Asistente';
  b.addEventListener('click',open);bar.prepend(b);
  if(!document.getElementById('assistantBtnCss')){const s=document.createElement('style');s.id='assistantBtnCss';s.textContent=CSS.split('.as-overlay')[0];document.head.append(s)}
}
document.addEventListener('keydown',ev=>{
  if(ev.altKey&&!ev.ctrlKey&&!ev.metaKey&&ev.code==='KeyI'){ev.preventDefault();overlay?.classList.contains('open')?close():open()}
  else if(ev.key==='Escape'&&overlay?.classList.contains('open')&&!ev.defaultPrevented){close()}
});
mountButton();
window.atlasAssistant={open,close,ask:q=>{open();return ask(q)}};
})();
