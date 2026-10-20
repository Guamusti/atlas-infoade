/* Atlas · Guía de estudio del examen de Sistemas Operativos (SSOO)
   Página independiente (/ssoo o #ssoo) con su propia navegación: inicio, teoría, práctica (Práctica 1,
   incidencias 1–4), simulacros y plan de seguimiento. El contenido vive en ssoo-examen/*.json y cada pieza
   indica su origen (apuntes / resumen no oficial / complemento) y cita archivo y página del PDF fuente.
   El progreso se guarda en state.ssooExam (se sincroniza con el resto del estado). Los PDF no se incluyen
   en el repositorio: se pueden vincular desde Inicio → Fuentes para abrirlos en la página citada. */
(function(){
'use strict';
const DIR='ssoo-examen/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(16).slice(2);
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const plural=(n,a,b)=>`${n} ${n===1?a:b}`;
const ORIG={a:{lbl:'Apuntes',tip:'Aparece en los apuntes o guías oficiales entregados'},r:{lbl:'Resumen no oficial',tip:'Procede de un resumen o informe propio, no de un apunte oficial'},c:{lbl:'Complemento',tip:'Complemento estándar de Linux/Bash o recomendación de estudio: no está literal en los documentos'}};
const TIPOS={prediccion:'Predicción',diagnostico:'Diagnóstico',seleccion:'Selección de orden',interpretacion:'Interpretación',escritura:'Escritura de orden'};
const SECTEO=[['resumen','Resumen'],['mapa','Mapa'],['conceptos','Conceptos'],['glosario','Glosario'],['comparativas','Comparativas'],['test','Test de repaso'],['desarrollo','Desarrollo'],['estrategia','Estrategia']];
const SECPRA=[['resumen','Objetivos y conceptos'],['ordenes','Órdenes'],['ejemplos','Ejemplos'],['ejercicios','Ejercicios'],['errores','Errores frecuentes']];
const CSS=`
.sx-overlay{position:fixed;inset:0;z-index:255;background:var(--paper,#fffdf7);overflow:auto;display:none;-webkit-overflow-scrolling:touch;font-family:var(--font,'DM Sans',sans-serif);color:#17201b}
.sx-overlay.open{display:block}
.sx-bar{position:sticky;top:0;z-index:3;display:flex;gap:12px;align-items:center;padding:10px max(14px,calc(50% - 450px));background:var(--paper,#fffdf7);border-bottom:2px solid #17201b}
.sx-brand{display:flex;gap:9px;align-items:center;border:0;background:none;cursor:pointer;padding:0;text-align:left;color:inherit;font:inherit}
.sx-logo{width:34px;height:34px;border-radius:50%;background:var(--acid,#dfff59);border:2px solid #17201b;display:grid;place-items:center;font:400 15px 'DM Serif Display',serif}
.sx-brand b{display:block;font-size:14px;line-height:1.1}.sx-brand small{display:block;font-size:10px;color:var(--muted,#53615a);letter-spacing:.06em;text-transform:uppercase}
.sx-tabs{display:flex;gap:4px;overflow-x:auto;flex:1;scrollbar-width:none}.sx-tabs::-webkit-scrollbar{display:none}
.sx-tab{flex:0 0 auto;border:0;background:none;padding:8px 12px;border-radius:99px;font:700 13px var(--font,'DM Sans',sans-serif);cursor:pointer;color:#17201b;white-space:nowrap}
.sx-tab:hover{background:#eef1ec}.sx-tab.on{background:var(--forest,#153c2d);color:#fff}
.sx-x{flex:0 0 auto;width:34px;height:34px;border-radius:50%;border:1.5px solid #17201b;background:#fff;font-size:15px;cursor:pointer}
.sx-main{max-width:900px;margin:0 auto;padding:18px 14px 110px}
.sx-main:focus{outline:none}
.sx-sub{display:flex;gap:6px;overflow-x:auto;margin:0 0 16px;padding-bottom:4px;scrollbar-width:none}.sx-sub::-webkit-scrollbar{display:none}
.sx-chip{flex:0 0 auto;border:1.5px solid #17201b;background:#fff;border-radius:99px;padding:6px 12px;font:700 12px var(--font,'DM Sans',sans-serif);cursor:pointer;color:#17201b;white-space:nowrap}
.sx-chip.on{background:#17201b;color:#fff}.sx-chip:hover:not(.on){background:var(--acid,#dfff59)}
.sx-eyebrow{font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--orange,#ff6b3d)}
.sx-main h1{font:400 clamp(30px,6vw,46px)/1.02 'DM Serif Display',serif;margin:4px 0 8px;color:var(--forest,#153c2d)}
.sx-main h2{font:400 clamp(22px,4vw,28px)/1.1 'DM Serif Display',serif;margin:22px 0 8px;color:var(--forest,#153c2d)}
.sx-main h3{font:800 15px var(--font,'DM Sans',sans-serif);margin:16px 0 6px}
.sx-lead{color:var(--muted,#53615a);font-size:14px;margin:0 0 12px}
.sx-hero{background:var(--forest,#153c2d);color:#fff;border:2px solid #17201b;border-radius:16px;padding:20px 20px 18px;box-shadow:5px 5px 0 var(--orange,#ff6b3d)}
.sx-hero h1{color:#fff}.sx-hero .sx-eyebrow{color:var(--acid,#dfff59)}.sx-hero p{margin:0 0 10px;opacity:.9;font-size:14px}
.sx-notice{display:inline-flex;gap:7px;align-items:flex-start;background:rgba(255,255,255,.12);border:1px dashed rgba(255,255,255,.55);border-radius:10px;padding:7px 11px;font-size:12px;line-height:1.35}
.sx-grid2{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));margin:16px 0}
.sx-card{background:#fff;border:2px solid #17201b;border-radius:14px;padding:16px;box-shadow:4px 4px 0 #17201b}
.sx-card.t{border-top:8px solid #2563eb}.sx-card.p{border-top:8px solid var(--green,#16855b)}
.sx-card h2{margin:0 0 6px}.sx-card ul{margin:6px 0 10px;padding-left:18px;font-size:13.5px}.sx-card li{margin:3px 0}
.sx-prog{height:8px;border-radius:99px;background:#e3e8e4;overflow:hidden;margin:6px 0 4px}.sx-prog i{display:block;height:100%;background:var(--green,#16855b)}
.sx-small{font-size:12px;color:var(--muted,#53615a)}
.sx-btn{border:2px solid #17201b;background:#fff;border-radius:10px;padding:8px 13px;font:800 13px var(--font,'DM Sans',sans-serif);cursor:pointer;color:#17201b;box-shadow:2px 2px 0 #17201b}
.sx-btn.pri{background:var(--acid,#dfff59)}.sx-btn.dan{background:#ffd9cc}.sx-btn:disabled{opacity:.5;cursor:default}
.sx-btn.sm{padding:5px 10px;font-size:12px}
.sx-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}
.sx-badge{display:inline-block;border-radius:99px;padding:2px 9px;font:800 10px var(--font,'DM Sans',sans-serif);letter-spacing:.05em;text-transform:uppercase;border:1.5px solid #17201b;vertical-align:middle;white-space:nowrap}
.sx-badge.o-a{background:#d9f5e5}.sx-badge.o-r{background:#fff2c7}.sx-badge.o-c{background:#dbe7ff}
.sx-badge.dan{background:#ffd9cc}.sx-badge.ok{background:#d9f5e5}.sx-badge.ko{background:#ffd9cc}
.sx-srcs{display:inline-flex;gap:4px;flex-wrap:wrap;vertical-align:middle}
.sx-src{border:1px solid #17201b;background:#f4f6f1;border-radius:6px;padding:1px 6px;font:700 10.5px ui-monospace,Menlo,Consolas,monospace;cursor:pointer;color:#17201b}
.sx-src:hover{background:var(--acid,#dfff59)}.sx-src.linked{background:#d9f5e5}
.sx-pop{position:fixed;z-index:300;max-width:min(340px,calc(100vw - 24px));background:#17201b;color:#fff;border-radius:12px;padding:12px 14px;font-size:12.5px;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.sx-pop b{display:block;margin-bottom:3px}.sx-pop .sx-btn{margin-top:8px}
.sx-sec{background:#fff;border:1.5px solid #17201b;border-radius:12px;margin:10px 0;overflow:hidden}
.sx-sec>summary{cursor:pointer;padding:11px 14px;font-weight:800;font-size:14.5px;display:flex;gap:8px;align-items:center;justify-content:space-between;list-style:none}
.sx-sec>summary::-webkit-details-marker{display:none}
.sx-sec>summary:after{content:'+';font-size:18px;font-weight:700}.sx-sec[open]>summary:after{content:'–'}
.sx-sec .in{padding:2px 14px 14px}
.sx-concept{border-top:1px dashed #b8c2bb;padding:10px 0}.sx-concept:first-child{border-top:0}
.sx-concept h4{margin:0 0 4px;font-size:14.5px;display:flex;gap:7px;align-items:center;flex-wrap:wrap}
.sx-rel{margin-top:6px;padding:6px 10px;background:#f3f8d9;border-radius:8px;font-size:12.5px}
.sx-md p{margin:0 0 6px;font-size:14px;line-height:1.5}.sx-md ul{margin:2px 0 8px;padding-left:20px;font-size:14px}.sx-md li{margin:3px 0;line-height:1.45}
.sx-md code{background:#eef1ec;border-radius:4px;padding:0 4px;font:12.5px ui-monospace,Menlo,Consolas,monospace}
.sx-main code{overflow-wrap:anywhere}.sx-ex,.sx-card,.sx-concept{overflow-wrap:anywhere}
.sx-md pre{background:#17201b;color:#e8f0ea;border-radius:10px;padding:10px 12px;overflow:auto;font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace;margin:6px 0 10px}
.sx-md pre code{background:none;padding:0;color:inherit}
.sx-md table,.sx-tbl{border-collapse:collapse;width:100%;font-size:13px;margin:6px 0 10px}
.sx-md th,.sx-md td,.sx-tbl th,.sx-tbl td{border:1px solid #17201b;padding:6px 8px;text-align:left;vertical-align:top}
.sx-md th,.sx-tbl th{background:#eef1ec}
.sx-tblwrap{overflow-x:auto}
.sx-memory td.fn:not(.show){color:transparent;text-shadow:0 0 9px #17201b;cursor:pointer;user-select:none}
.sx-search{width:100%;font:inherit;font-size:14px;padding:9px 12px;border:1.5px solid #17201b;border-radius:10px;margin:0 0 12px;background:#fff}
.sx-ex{background:#fff;border:2px solid #17201b;border-radius:14px;padding:14px;margin:12px 0;box-shadow:3px 3px 0 #17201b}
.sx-ex.hl{outline:4px solid var(--acid,#dfff59)}
.sx-ex h4{margin:0 0 6px;font-size:15px;display:flex;gap:7px;align-items:center;flex-wrap:wrap}
.sx-sol{margin-top:10px;border-top:2px dashed #17201b;padding-top:10px;background:#fafcf6}
.sx-sol[hidden]{display:none}
.sx-ok{background:#d9f5e5}.sx-ko{background:#ffd9cc}
.sx-opt{display:flex;gap:9px;align-items:flex-start;width:100%;text-align:left;border:1.5px solid #17201b;background:#fff;border-radius:10px;padding:9px 11px;margin:6px 0;font:inherit;font-size:14px;cursor:pointer;color:#17201b}
.sx-opt:hover:not(:disabled){background:#f3f8d9}.sx-opt:disabled{cursor:default}
.sx-opt.good{background:#d9f5e5;border-color:var(--green,#16855b)}.sx-opt.bad{background:#ffd9cc;border-color:#c2410c}
.sx-opt b{flex:0 0 22px;height:22px;border-radius:50%;border:1.5px solid #17201b;display:grid;place-items:center;font-size:11px}
.sx-expl{margin-top:8px;padding:9px 11px;border-radius:10px;background:#f4f6f1;font-size:13.5px;line-height:1.45}
.sx-qhead{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:var(--muted,#53615a);margin-bottom:6px}
.sx-rub label{display:flex;gap:8px;align-items:flex-start;margin:5px 0;font-size:13.5px;cursor:pointer}
.sx-rub input,.sx-check input{width:18px;height:18px;flex:0 0 18px;margin-top:1px;accent-color:var(--forest,#153c2d)}
.sx-check{display:flex;gap:9px;align-items:flex-start;padding:7px 0;border-top:1px dashed #b8c2bb;font-size:14px;cursor:pointer}
.sx-check:first-of-type{border-top:0}
.sx-banner{background:#fff2c7;border:1.5px dashed #17201b;border-radius:10px;padding:9px 12px;font-size:13px;margin:10px 0}
.sx-banner.red{background:#ffd9cc}
.sx-banner.blue{background:#dbe7ff}
.sx-textarea{width:100%;min-height:90px;font:inherit;font-size:14px;padding:9px 11px;border:1.5px solid #17201b;border-radius:10px;background:#fff;resize:vertical}
.sx-input{font:inherit;font-size:14px;padding:8px 10px;border:1.5px solid #17201b;border-radius:10px;background:#fff;min-width:0}
.sx-stat{display:flex;gap:14px;flex-wrap:wrap;margin:8px 0}.sx-stat div{border:2px solid #17201b;border-radius:12px;padding:8px 14px;background:#fff;text-align:center;min-width:90px}
.sx-stat b{display:block;font:400 26px 'DM Serif Display',serif}.sx-stat span{font-size:11px;color:var(--muted,#53615a);text-transform:uppercase;letter-spacing:.06em}
.sx-err{display:flex;gap:10px;align-items:flex-start;background:#fff;border:1.5px solid #17201b;border-left:6px solid #c2410c;border-radius:10px;padding:9px 12px;margin:8px 0}
.sx-err.done{border-left-color:var(--green,#16855b);opacity:.7}
.sx-err .tx{flex:1;min-width:0;font-size:13.5px;overflow-wrap:anywhere}
.sx-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:310;background:#17201b;color:#fff;border-radius:99px;padding:9px 16px;font-size:13px;font-weight:700}
.sx-timer{font:800 18px ui-monospace,Menlo,Consolas,monospace}
.sx-qn{font:800 11px var(--font,'DM Sans',sans-serif);color:var(--muted,#53615a)}
@media(max-width:640px){.sx-brand small{display:none}.sx-bar{gap:8px}}
#sxPrint{display:none}
@media print{
  body>*:not(#sxPrint){display:none!important}
  #sxPrint{display:block!important;position:static;padding:0;color:#000;background:#fff;font:12pt/1.4 Georgia,serif}
  #sxPrint h1{font-size:18pt;margin:0 0 4pt}#sxPrint h2{font-size:13pt;margin:14pt 0 4pt;border-bottom:1px solid #000}
  #sxPrint ul{margin:2pt 0 6pt 16pt;padding:0}#sxPrint li{margin:2pt 0}
  #sxPrint .q{margin:8pt 0;page-break-inside:avoid}#sxPrint .opt{margin-left:18pt}
  #sxPrint .lines{border-bottom:1px solid #999;height:20pt}
  #sxPrint pre{border:1px solid #999;padding:4pt;white-space:pre-wrap;font:10pt/1.3 monospace}
}
`;
let overlay=null,DATA=null,loading=null,prevHash='',topEl=null,mainEl=null,popEl=null,timer=null;
const LINKS={};   // id de fuente → URL del PDF vinculado por el usuario (solo sesión actual)
let QZ=null;      // ejecución de un test de repaso
let SIM=null;     // simulacro en curso
let REV=null;     // repaso de errores en curso

/* ---------- Estado persistente (state.ssooExam) ---------- */
function ST(){
  const s=state.ssooExam=state.ssooExam&&typeof state.ssooExam==='object'?state.ssooExam:{};
  for(const k of ['checks','quiz','ejer','sim','notes','rub'])s[k]=s[k]&&typeof s[k]==='object'?s[k]:{};
  s.errores=Array.isArray(s.errores)?s.errores:[];
  return s;
}
async function save(){try{await idbSet()}catch(e){console.warn('No se pudo guardar el progreso',e)}}
function toastMsg(t){const el=document.createElement('div');el.className='sx-toast';el.textContent=t;overlay.append(el);setTimeout(()=>el.remove(),2200)}
const storageReady=()=>document.getElementById('storageDot')?.classList.contains('ready');
function whenReady(){
  if(storageReady())return Promise.resolve();
  return new Promise(res=>{let n=0;const t=setInterval(()=>{if(storageReady()||++n>80){clearInterval(t);res()}},50)});
}
function load(){
  if(DATA)return Promise.resolve(DATA);
  return loading??=Promise.all(['meta','teoria','practica','simulacros','plan','resumen'].map(n=>fetch(DIR+n+'.json').then(r=>{if(!r.ok)throw new Error(n);return r.json()}))).then(([meta,teoria,practica,sim,plan,resumen])=>{
    DATA={meta,teoria,practica,sim:sim.simulacros,plan,resumen};
    DATA.Q=Object.fromEntries(teoria.test.map(q=>[q.id,q]));
    DATA.D=Object.fromEntries(teoria.desarrollo.map(d=>[d.id,d]));
    DATA.PT=Object.fromEntries(practica.test.map(q=>[q.id,q]));
    DATA.EX={};practica.incidencias.forEach(I=>I.ejercicios.forEach(e=>DATA.EX[e.id]={...e,inc:I.id}));
    DATA.SRC=Object.fromEntries(meta.fuentes.map(f=>[f.id,f]));
    return DATA;
  });
}

/* ---------- Markdown mínimo ---------- */
function inl(s){
  return String(s).split(/(`[^`]*`)/).map((p,i)=>i%2?`<code>${esc(p.slice(1,-1))}</code>`:esc(p).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g,'$1<i>$2</i>')).join('');
}
function md(src){
  const L=String(src??'').split('\n');let out='',i=0;
  while(i<L.length){
    const l=L[i];
    if(l.startsWith('```')){const b=[];i++;while(i<L.length&&!L[i].startsWith('```')){b.push(L[i]);i++}i++;out+=`<pre><code>${esc(b.join('\n'))}</code></pre>`;continue}
    if(/^\s*\|/.test(l)){const rows=[];while(i<L.length&&/^\s*\|/.test(L[i])){rows.push(L[i].trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));i++}
      out+=`<div class="sx-tblwrap"><table><thead><tr>${rows[0].map(c=>`<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r=>`<tr>${r.map(c=>`<td>${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;continue}
    if(/^\s*(?:[-•]|\d+[.)])\s+/.test(l)){const items=[];while(i<L.length&&/^\s*(?:[-•]|\d+[.)])\s+/.test(L[i])){items.push(L[i].replace(/^\s*(?:[-•]|\d+[.)])\s+/,''));i++}out+=`<ul>${items.map(x=>`<li>${inl(x)}</li>`).join('')}</ul>`;continue}
    if(l.trim())out+=`<p>${inl(l)}</p>`;
    i++;
  }
  return `<div class="sx-md">${out}</div>`;
}
const badge=o=>`<span class="sx-badge o-${o}" title="${esc(ORIG[o].tip)}">${ORIG[o].lbl}</span>`;
function srcTitle(r){const f=DATA.SRC[r.s];return`${f?.ruta||r.s} · p. ${r.p}${r.e?' · '+r.e:''}`}
const srcs=l=>`<span class="sx-srcs">${(l||[]).map(r=>`<button type="button" class="sx-src${LINKS[r.s]?' linked':''}" data-act="src" data-s="${esc(r.s)}" data-p="${esc(r.p)}" data-e="${esc(r.e||'')}" title="${esc(srcTitle(r))}">${esc(r.s)} p.${esc(r.p)}</button>`).join('')}</span>`;

/* ---------- Progreso ---------- */
function progTeoria(){
  const s=ST(),sub=DATA.teoria.temas.flatMap(t=>t.subtemas),done=sub.filter(x=>s.checks['t:'+x.id]).length;
  const seen=DATA.teoria.test.filter(q=>s.quiz[q.id]),ok=seen.filter(q=>s.quiz[q.id].last==='ok').length;
  return{done,total:sub.length,seen:seen.length,qtotal:DATA.teoria.test.length,ok,pct:Math.round(((done/sub.length)+(seen.length/DATA.teoria.test.length))/2*100)};
}
function progPractica(){
  const s=ST(),incs=DATA.practica.incidencias,keys=incs.flatMap(I=>['conceptos','ordenes','ejercicios','distinciones'].map(k=>`p:${I.id}:${k}`));
  const done=keys.filter(k=>s.checks[k]).length,ex=Object.keys(DATA.EX),made=ex.filter(id=>s.ejer[id]?.estado==='ok').length;
  return{done,total:keys.length,made,extotal:ex.length,pct:Math.round(((done/keys.length)+(made/ex.length))/2*100)};
}
const bar=p=>`<div class="sx-prog"><i style="width:${p}%"></i></div>`;

/* ---------- Registro de errores ---------- */
function addError(kind,ref,texto){
  const s=ST(),ex=s.errores.find(e=>e.kind===kind&&e.ref===ref);
  if(ex){ex.resuelto=false;ex.at=new Date().toISOString();return}
  s.errores.push({id:uid(),kind,ref,texto,at:new Date().toISOString(),resuelto:false,nota:''});
}
function errLink(e){
  if(e.kind==='test')return'#ssoo/teoria/test';
  if(e.kind==='ptest')return'#ssoo/practica/test';
  if(e.kind==='ejercicio'){const x=DATA.EX[e.ref];return x?`#ssoo/practica/${x.inc}/ejercicios/${e.ref}`:'#ssoo/practica'}
  return null;
}
const kindLbl={test:'Test de teoría',ptest:'Test de práctica',ejercicio:'Ejercicio',manual:'Anotado por ti'};

/* ---------- Vistas ---------- */
function vInicio(){
  const M=DATA.meta,pt=progTeoria(),pp=progPractica();
  const ev=(()=>{try{return getEvents().filter(e=>e.sid==='ssoo').sort((a,b)=>a.date.localeCompare(b.date))}catch(_){return[]}})();
  const evHtml=ev.length?`<div class="sx-tblwrap"><table class="sx-tbl"><thead><tr><th>Fecha</th><th>Prueba registrada en tu calendario</th></tr></thead><tbody>${ev.map(e=>`<tr><td>${esc(new Date(e.date+'T12:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'long'}))}</td><td>${esc(e.name)}${e.conv==='extraordinary'?' (extraordinaria)':''}</td></tr>`).join('')}</tbody></table></div><p class="sx-small">Son las fechas de SSOO que ya tiene tu calendario de Atlas. Esta guía no sabe cuál corresponde al examen en papel descrito arriba: <b>no asume fecha</b>.</p>`:'<p class="sx-small">No hay fechas de SSOO en tu calendario.</p>';
  return`<section class="sx-hero"><div class="sx-eyebrow">Guía de estudio del examen</div><h1>${esc(M.asignatura)}</h1><p>Prepara por separado la <b>teoría</b> y la <b>práctica</b> (Práctica 1, incidencias 1–4), con recuperación activa y simulacros en papel.</p>
    <div class="sx-notice" role="note"><span>ⓘ</span><span>${esc(M.aviso)}</span></div></section>
  <div class="sx-grid2">
    <article class="sx-card t"><div class="sx-eyebrow" style="color:#2563eb">Parte 1</div><h2>Teoría</h2><ul>${M.formato[0].items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>
      ${bar(pt.pct)}<div class="sx-small">${pt.done}/${pt.total} subtemas repasados · ${pt.seen}/${pt.qtotal} preguntas contestadas${pt.seen?` (${Math.round(pt.ok/pt.seen*100)}% acertadas en la última vez)`:''}</div>
      <div class="sx-row"><button class="sx-btn pri" data-go="#ssoo/teoria">Resumen de teoría</button><button class="sx-btn" data-go="#ssoo/teoria/test">Test de repaso</button></div></article>
    <article class="sx-card p"><div class="sx-eyebrow" style="color:var(--green,#16855b)">Parte 2</div><h2>Práctica</h2><ul>${M.formato[1].items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>
      ${bar(pp.pct)}<div class="sx-small">${pp.done}/${pp.total} casillas · ${pp.made}/${pp.extotal} ejercicios resueltos</div>
      <div class="sx-row"><button class="sx-btn pri" data-go="#ssoo/practica">Resumen de práctica</button><button class="sx-btn" data-go="#ssoo/practica/distinciones">Distinciones clave</button></div></article>
  </div>
  <div class="sx-row"><button class="sx-btn" data-go="#ssoo/simulacros">Simulacros</button><button class="sx-btn" data-go="#ssoo/plan">Plan y seguimiento</button></div>
  <h2>Qué no se sabe todavía</h2>
  <div class="sx-banner">No hay confirmación de: ${M.sinConfirmar.map(x=>`<b>${esc(x.toLowerCase())}</b>`).join(', ')}. Esta guía no los supone.</div>
  <h2>Fechas de SSOO en tu calendario</h2>${evHtml}
  <h2>Cómo leer esta guía</h2>
  <p class="sx-small">Cada pieza lleva una etiqueta de origen y, cuando es posible, la cita del archivo y la página del PDF (por ejemplo <span class="sx-srcs"><span class="sx-src">T2 p.18</span></span>).</p>
  <div class="sx-row">${['a','r','c'].map(o=>`${badge(o)} <span class="sx-small">${esc(ORIG[o].tip)}</span>`).join('<br>')}</div>
  <h2>Fuentes</h2>
  <p class="sx-small">Los PDF no se incluyen en el Atlas. Si los vinculas (solo en esta sesión), las citas abrirán el PDF en la página indicada.</p>
  ${M.fuentes.map(f=>`<div class="sx-ex" style="box-shadow:none"><h4><span class="sx-badge o-${f.tipo}">${esc(f.id)}</span> ${esc(f.titulo)} ${badge(f.tipo)}</h4>
    <div class="sx-small"><code>${esc(f.ruta)}</code> · ${f.paginas} páginas</div><div class="sx-small">${esc(f.nota)}</div>
    <div class="sx-row"><button class="sx-btn sm" data-act="link" data-s="${esc(f.id)}">${LINKS[f.id]?'PDF vinculado ✓ (cambiar)':'Vincular PDF…'}</button>${LINKS[f.id]?`<button class="sx-btn sm" data-act="open" data-s="${esc(f.id)}">Abrir</button>`:''}</div></div>`).join('')}
  <details class="sx-sec"><summary>Limitaciones del material y de esta guía</summary><div class="in sx-md"><ul>${M.limitaciones.map(l=>`<li>${inl(l)}</li>`).join('')}</ul></div></details>
  <details class="sx-sec"><summary>Discrepancias y dudas encontradas</summary><div class="in">${M.discrepancias.map(d=>`<h3>${esc(d.t)}</h3>${md(d.md)}`).join('')}</div></details>`;
}

/* --- Teoría --- */
function vTeoria(sec){
  sec=SECTEO.some(s=>s[0]===sec)?sec:'resumen';
  const nav=`<div class="sx-sub">${SECTEO.map(([k,l])=>`<button class="sx-chip${k===sec?' on':''}" data-go="#ssoo/teoria/${k}">${l}</button>`).join('')}</div>`;
  const T=DATA.teoria,s=ST();
  let body='';
  if(sec==='resumen')body=vResumenTeoria();
  else if(sec==='mapa'){
    body=`<h1>Teoría</h1><p class="sx-lead">Mapa fiel a los apuntes: epígrafes de las diapositivas de los Temas 1 y 2. Marca cada subtema cuando puedas explicarlo <b>sin mirar</b>.</p>`+T.temas.map(t=>`<details class="sx-sec" open><summary><span>${esc(t.titulo)} <span class="sx-small">· ${esc(DATA.SRC[t.fuente].ruta.split('/').pop())}</span></summary><div class="in"><p class="sx-small">${esc(t.resumen)}</p>
      ${t.subtemas.map(x=>`<label class="sx-check"><input type="checkbox" data-chk="t:${x.id}"${s.checks['t:'+x.id]?' checked':''}><span><b>${esc(x.titulo)}</b><br><span class="sx-small">${x.epigrafes.map(esc).join(' · ')}</span><br><a href="#ssoo/teoria/conceptos/${x.id}" data-go="#ssoo/teoria/conceptos/${x.id}" class="sx-small">Ir a los conceptos →</a></span></label>`).join('')}</div></details>`).join('')
      +`<div class="sx-banner blue">Las diapositivas que son solo imagen o diagrama (niveles de capas, llamadas al sistema, diagrama de estados, esquemas de micronúcleo…) se han leído visualmente y se resumen en los conceptos con su página.</div>`;
  }else if(sec==='conceptos'){
    body=`<h1>Conceptos</h1><input class="sx-search" type="search" placeholder="Filtrar conceptos…" data-filter=".sx-concept" aria-label="Filtrar conceptos">`+T.temas.map(t=>`<h2>${esc(t.titulo)}</h2>`+t.subtemas.map(x=>`<details class="sx-sec" id="sub-${x.id}" open><summary>${esc(x.titulo)}</summary><div class="in">${x.conceptos.map(c=>`<article class="sx-concept" id="${c.id}"><h4>${esc(c.t)} ${badge(c.o)} ${srcs(c.src)}</h4>${md(c.md)}${c.rel?`<div class="sx-rel"><b>Relación:</b> ${inl(c.rel)}</div>`:''}</article>`).join('')}</div></details>`).join('')).join('');
  }else if(sec==='glosario'){
    body=`<h1>Glosario</h1><input class="sx-search" type="search" placeholder="Buscar término…" data-filter=".sx-term" aria-label="Buscar término"><div class="sx-row"><button class="sx-chip on" data-act="gfilter" data-v="">Todos</button><button class="sx-chip" data-act="gfilter" data-v="t1">Tema 1</button><button class="sx-chip" data-act="gfilter" data-v="t2">Tema 2</button></div>
      <div id="sxGlos">${T.glosario.map(g=>`<article class="sx-concept sx-term" data-tema="${g.tema}"><h4>${esc(g.t)} <span class="sx-small">${g.tema==='t1'?'Tema 1':'Tema 2'}</span> ${srcs(g.src)}</h4><p style="margin:0;font-size:14px">${inl(g.d)}</p></article>`).join('')}</div>`;
  }else if(sec==='comparativas'){
    body=`<h1>Comparativas</h1><p class="sx-lead">Tablas para distinguir ideas que suelen confundirse. Cada una cita su diapositiva.</p>`+T.comparativas.map(c=>`<details class="sx-sec" open><summary>${esc(c.titulo)}</summary><div class="in"><div class="sx-tblwrap"><table class="sx-tbl"><thead><tr>${c.cols.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${c.filas.map(f=>`<tr>${f.map(x=>`<td>${inl(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div>${srcs(c.src)}</div>${c.nota?`<p class="sx-small">${inl(c.nota)}</p>`:''}</div></details>`).join('');
  }else if(sec==='test'){
    body=`<h1>Test de repaso</h1><div class="sx-banner">Según la información recibida, el test de teoría <b>no resta</b>. Estas preguntas son de práctica, no del examen real.</div><div id="sxQuiz">${quizConfig('teoria')}</div>`;
  }else if(sec==='desarrollo'){
    body=`<h1>Pregunta de desarrollo</h1><div class="sx-banner red"><b>Propuestas de práctica, no preguntas confirmadas del examen.</b> Se basan solo en los apuntes. En el examen la pregunta vale 2 puntos y se responde en papel.</div>`+T.desarrollo.map(d=>{
      const rub=d.rubrica.map((r,i)=>`<label><input type="checkbox" data-rub="${d.id}:${i}"${s.rub[d.id+':'+i]?' checked':''}> ${esc(r)}</label>`).join('');
      return`<article class="sx-ex" id="${d.id}"><h4>${esc(d.titulo)} <span class="sx-badge o-c">Propuesta</span> <span class="sx-small">${d.tema==='t1'?'Tema 1':'Tema 2'}</span> ${srcs(d.src)}</h4>${md(d.enunciado)}
        <div class="sx-row"><button class="sx-btn sm" data-act="reveal" data-id="${d.id}-s">Mostrar esquema de respuesta</button></div>
        <div class="sx-sol" id="${d.id}-s" hidden><b>Esquema de respuesta</b> ${badge('a')}${md(d.esquema.map(x=>'- '+x).join('\n'))}</div>
        <h3>Rúbrica breve de autoevaluación</h3><div class="sx-rub">${rub}</div>
        <div class="sx-small" id="${d.id}-score">${rubScore(d)}</div>
        <details style="margin-top:8px"><summary class="sx-small" style="cursor:pointer">Borrador opcional (en el examen será en papel)</summary><textarea class="sx-textarea" data-note="${d.id}" placeholder="Escribe aquí tu esquema o tu respuesta…">${esc(s.notes[d.id]||'')}</textarea></details></article>`;
    }).join('');
  }else if(sec==='estrategia'){
    const e=T.estrategia;
    body=`<h1>Estrategia para la pregunta de desarrollo (2 puntos, en papel)</h1><div class="sx-banner">${badge('c')} ${esc(e.aviso)}</div><div class="sx-md"><ul>${e.pasos.map(p=>`<li>${inl(p)}</li>`).join('')}</ul></div><h3>Plantilla de estructura</h3><pre style="background:#17201b;color:#e8f0ea;border-radius:10px;padding:10px 12px;font:13px/1.5 ui-monospace,monospace;white-space:pre-wrap">${esc(e.plantilla)}</pre>
      <div class="sx-row"><button class="sx-btn pri" data-go="#ssoo/teoria/desarrollo">Practicar un desarrollo</button></div>`;
  }
  return nav+body;
}
function rubScore(d){const s=ST(),n=d.rubrica.filter((_,i)=>s.rub[d.id+':'+i]).length;return`Autoevaluación: ${n} de ${d.rubrica.length} criterios cumplidos.`}

/* --- Resúmenes (versión corta) --- */
function vResumenTeoria(){
  const R=DATA.resumen;
  return`<h1>Resumen de teoría</h1><p class="sx-lead">${esc(R.aviso)}</p>
    <div class="sx-row"><button class="sx-btn sm" data-act="printres" data-v="teoria">Imprimir resumen</button><button class="sx-btn sm" data-go="#ssoo/teoria/test">Test de repaso</button></div>`
    +R.teoria.map(t=>`<h2>${esc(t.tema)}</h2>`+t.bloques.map(b=>`<article class="sx-concept"><h4>${esc(b.t)} ${srcs(b.src)}</h4>${md(b.puntos.map(x=>'- '+x).join('\n'))}<a class="sx-small" href="#ssoo/teoria/conceptos/${b.id}" data-go="#ssoo/teoria/conceptos/${b.id}">Ver el detalle →</a></article>`).join('')).join('')
    +`<div class="sx-banner blue">Cada bloque cita sus diapositivas (T1 = Tema 1, T2 = Tema 2). Para ampliar: <button class="sx-chip" data-go="#ssoo/teoria/conceptos">Conceptos</button> <button class="sx-chip" data-go="#ssoo/teoria/comparativas">Comparativas</button> <button class="sx-chip" data-go="#ssoo/teoria/glosario">Glosario</button></div>`;
}
function vResumenPractica(){
  const R=DATA.resumen;
  return`<h1>Resumen de práctica</h1><p class="sx-lead">Solo la <b>Práctica 1, incidencias 1–4</b> (la minishell no entra). Todo en papel y con órdenes sencillas.</p>
    <div class="sx-row"><button class="sx-btn sm" data-act="printres" data-v="practica">Imprimir resumen</button><button class="sx-btn sm" data-go="#ssoo/practica/distinciones">Distinciones clave</button><button class="sx-btn sm" data-go="#ssoo/practica/test">Test de práctica</button></div>`
    +R.practica.map(x=>`<article class="sx-card p" style="margin:12px 0"><h3 style="margin:0 0 6px">${esc(x.t)} ${srcs(x.src)}</h3>${md(x.esencial.map(e=>'- '+e).join('\n'))}<div class="sx-small"><b>Órdenes:</b> ${inl(x.ordenes)}</div><div class="sx-row"><button class="sx-btn sm" data-go="#ssoo/practica/${x.id}/ordenes">Órdenes</button><button class="sx-btn sm" data-go="#ssoo/practica/${x.id}/ejercicios">Ejercicios</button><button class="sx-btn sm" data-go="#ssoo/practica/${x.id}/errores">Errores frecuentes</button></div></article>`).join('')
    +`<p class="sx-small">${inl(R.practicaNota)}</p>`;
}
function printResumen(kind){
  const R=DATA.resumen,plain=x=>String(x).replace(/\*\*/g,'').replace(/`/g,'').replace(/\*/g,'');
  let h=`<h1>Sistemas Operativos · Resumen de ${kind==='teoria'?'teoría':'práctica'}</h1>`;
  if(kind==='teoria')h+=R.teoria.map(t=>`<h2>${esc(t.tema)}</h2>`+t.bloques.map(b=>`<div class="q"><b>${esc(b.t)}</b> (${b.src.map(r=>r.s+' p.'+r.p).join(', ')})<ul>${b.puntos.map(p=>`<li>${esc(plain(p))}</li>`).join('')}</ul></div>`).join('')).join('');
  else h+=R.practica.map(x=>`<h2>${esc(x.t)}</h2><div class="q"><ul>${x.esencial.map(p=>`<li>${esc(plain(p))}</li>`).join('')}</ul><div>Órdenes: ${esc(plain(x.ordenes))}</div></div>`).join('')+`<p><i>${esc(plain(R.practicaNota))}</i></p>`;
  let box=document.getElementById('sxPrint');if(!box){box=document.createElement('div');box.id='sxPrint';document.body.append(box)}
  box.innerHTML=h;const clear=()=>{box.innerHTML='';window.removeEventListener('afterprint',clear)};window.addEventListener('afterprint',clear);setTimeout(()=>window.print(),50);
}

/* --- Test de repaso (genérico para teoría y práctica) --- */
function quizBank(kind){return kind==='teoria'?DATA.teoria.test:DATA.practica.test}
function quizConfig(kind){
  const bank=quizBank(kind),s=ST(),seen=bank.filter(q=>s.quiz[q.id]).length;
  const temas=kind==='teoria'?`<label class="sx-small">Tema <select class="sx-input" id="qzTema"><option value="">Todos</option><option value="t1">Tema 1</option><option value="t2">Tema 2</option></select></label>`:`<label class="sx-small">Incidencia <select class="sx-input" id="qzTema"><option value="">Todas</option>${DATA.practica.incidencias.map(I=>`<option value="${I.id}">Incidencia ${I.num}</option>`).join('')}</select></label>`;
  return`<p class="sx-lead">${bank.length} preguntas en el banco · ${seen} contestadas alguna vez. Las opciones se mezclan cada vez.</p>
   <div class="sx-row">${temas}
   <label class="sx-small">Cuáles <select class="sx-input" id="qzWhich"><option value="all">Todas</option><option value="new">Sin contestar</option><option value="ko">Falladas la última vez</option></select></label>
   <label class="sx-small">Nº <select class="sx-input" id="qzN"><option>10</option><option>15</option><option>20</option><option value="999">Todas</option></select></label></div>
   ${kind==='practica'?'<div class="sx-banner">Según la información recibida, <b>las dos preguntas tipo test de la práctica sí restan</b>. La fórmula se desconoce: por eso aquí puedes <b>dejar en blanco</b> y se cuenta aparte.</div>':''}
   <div class="sx-row"><button class="sx-btn pri" data-act="qstart" data-kind="${kind}">Empezar</button></div>`;
}
function qzStart(kind){
  const bank=quizBank(kind),s=ST(),tema=$q('#qzTema')?.value||'',which=$q('#qzWhich')?.value||'all',n=Number($q('#qzN')?.value)||10;
  let list=bank.filter(q=>!tema||(kind==='teoria'?q.tema===tema:q.inc===tema));
  if(which==='new')list=list.filter(q=>!s.quiz[q.id]);
  if(which==='ko')list=list.filter(q=>s.quiz[q.id]?.last==='ko');
  list=shuffle(list).slice(0,n);
  if(!list.length){$q('#sxQuiz').insertAdjacentHTML('beforeend','<div class="sx-banner red">No hay preguntas con ese filtro.</div>');return}
  QZ={kind,items:list.map(q=>({q,order:shuffle(q.o.map((_,i)=>i)),pick:null,blank:false})),i:0,done:false};
  qzRender();
}
function qzRender(){
  const box=$q('#sxQuiz');if(!box||!QZ)return;
  if(QZ.i>=QZ.items.length){return qzSummary()}
  const it=QZ.items[QZ.i],q=it.q,ans=it.pick!==null||it.blank;
  box.innerHTML=`<div class="sx-qhead"><span class="sx-qn">Pregunta ${QZ.i+1} de ${QZ.items.length}</span><span>${srcs(ans?q.src:[])}</span></div><div class="sx-ex" style="box-shadow:none"><h4 style="font-size:15px">${inl(q.q)}</h4>
    ${it.order.map((oi,k)=>{const good=ans&&oi===q.a,bad=ans&&it.pick===oi&&oi!==q.a;return`<button class="sx-opt${good?' good':''}${bad?' bad':''}" data-act="qpick" data-oi="${oi}"${ans?' disabled':''}><b>${'ABCD'[k]}</b><span>${inl(q.o[oi])}</span></button>`}).join('')}
    ${QZ.kind==='practica'&&!ans?`<div class="sx-row"><button class="sx-btn sm" data-act="qblank">Dejar en blanco</button></div>`:''}
    ${ans?`<div class="sx-expl ${it.blank?'':it.pick===q.a?'sx-ok':'sx-ko'}"><b>${it.blank?'En blanco.':it.pick===q.a?'¡Correcto!':'Incorrecto.'}</b> ${inl(q.e)}</div>`:''}
    </div><div class="sx-row">${ans?`<button class="sx-btn pri" data-act="qnext">${QZ.i+1<QZ.items.length?'Siguiente':'Ver resultado'}</button>`:''}<button class="sx-btn sm" data-act="qstop">Terminar</button></div>`;
}
function qzPick(oi){
  const it=QZ.items[QZ.i];if(it.pick!==null||it.blank)return;
  it.pick=oi;const q=it.q,ok=oi===q.a,s=ST(),p=s.quiz[q.id]||{n:0,ok:0};
  s.quiz[q.id]={n:p.n+1,ok:p.ok+(ok?1:0),last:ok?'ok':'ko',at:new Date().toISOString()};
  if(!ok)addError(QZ.kind==='teoria'?'test':'ptest',q.id,q.q);
  save();qzRender();
}
function qzBlank(){const it=QZ.items[QZ.i];if(it.pick!==null||it.blank)return;it.blank=true;const q=it.q,s=ST(),p=s.quiz[q.id]||{n:0,ok:0};s.quiz[q.id]={n:p.n+1,ok:p.ok,last:'ko',blank:true,at:new Date().toISOString()};addError('ptest',q.id,q.q);save();qzRender()}
function qzSummary(){
  const it=QZ.items,ok=it.filter(x=>x.pick===x.q.a).length,blank=it.filter(x=>x.blank).length,ko=it.filter(x=>x.pick!==null&&x.pick!==x.q.a).length,unans=it.length-ok-ko-blank;
  $q('#sxQuiz').innerHTML=`<h2>Resultado</h2><div class="sx-stat"><div><b>${ok}</b><span>Aciertos</span></div><div><b>${ko}</b><span>Fallos</span></div><div><b>${blank}</b><span>En blanco</span></div>${unans?`<div><b>${unans}</b><span>Sin contestar</span></div>`:''}</div>
   ${QZ.kind==='practica'?'<p class="sx-small">No se calcula nota: se desconoce la fórmula de penalización.</p>':''}
   <p class="sx-small">Los fallos se han añadido a «Errores que debo volver a practicar».</p>
   <div class="sx-row"><button class="sx-btn pri" data-act="qrestart" data-kind="${QZ.kind}">Otra tanda</button><button class="sx-btn" data-go="#ssoo/plan">Ver errores</button></div>`;
  QZ=null;
}

/* --- Práctica --- */
function vPractica(inc,sec,item){
  const P=DATA.practica,nav=`<div class="sx-sub"><button class="sx-chip${!inc?' on':''}" data-go="#ssoo/practica">Resumen</button>${P.incidencias.map(I=>`<button class="sx-chip${inc===I.id?' on':''}" data-go="#ssoo/practica/${I.id}">Incidencia ${I.num}</button>`).join('')}<button class="sx-chip${inc==='distinciones'?' on':''}" data-go="#ssoo/practica/distinciones">Distinciones</button><button class="sx-chip${inc==='test'?' on':''}" data-go="#ssoo/practica/test">Test de práctica</button></div>`;
  if(inc==='distinciones')return nav+vDistinciones();
  if(inc==='test')return nav+`<h1>Test de práctica</h1><div id="sxQuiz">${quizConfig('practica')}</div>`;
  const I=P.incidencias.find(x=>x.id===inc);
  if(!I)return nav+vResumenPractica();
  sec=SECPRA.some(s=>s[0]===sec)?sec:'resumen';
  const sub=`<div class="sx-sub">${SECPRA.map(([k,l])=>`<button class="sx-chip${k===sec?' on':''}" data-go="#ssoo/practica/${I.id}/${k}">${l}</button>`).join('')}</div>`;
  const s=ST();let body='';
  if(sec==='resumen'){
    body=`<h1>${esc(I.titulo)}</h1><p class="sx-lead">${esc(I.sub)} · ${srcs(I.resultadosSrc)}</p><h2>Objetivos (resultados de aprendizaje)</h2><div class="sx-md"><ul>${I.resultados.map(r=>`<li>${inl(r)}</li>`).join('')}</ul></div>${badge('a')}
      <h2>Conceptos examinables</h2><p class="sx-small">Los que la guía pide poder explicar, comprobar o justificar.</p>${I.examinables.map(x=>`<article class="sx-concept"><h4>${esc(x.t)} ${badge(x.o)} ${srcs(x.src)}</h4>${md(x.md)}</article>`).join('')}
      <label class="sx-check"><input type="checkbox" data-chk="p:${I.id}:conceptos"${s.checks[`p:${I.id}:conceptos`]?' checked':''}><span>Puedo explicar estos conceptos sin mirar.</span></label>`;
  }else if(sec==='ordenes'){
    body=`<h1>Órdenes · ${esc(I.titulo.replace(/ · .*/,''))}</h1><p class="sx-small">${inl(I.ordenesNota)}</p>
      <label class="sx-check"><input type="checkbox" data-memory> <span><b>Modo memoria:</b> oculta la función y pulsa la fila para comprobar lo que recordabas (recuperación activa).</span></label>
      <div class="sx-tblwrap"><table class="sx-tbl" id="sxOrd"><thead><tr><th>Orden</th><th>Función</th><th>En la guía</th></tr></thead><tbody>${I.ordenes.map(o=>`<tr><td><code>${esc(o.cmd)}</code></td><td class="fn" data-act="showfn">${inl(o.fn)}${o.nota?`<div class="sx-small">${inl(o.nota)}</div>`:''}</td><td>${srcs(o.lista)}</td></tr>`).join('')}</tbody></table></div>
      <label class="sx-check"><input type="checkbox" data-chk="p:${I.id}:ordenes"${s.checks[`p:${I.id}:ordenes`]?' checked':''}><span>Puedo escribir estas órdenes de memoria.</span></label>`;
  }else if(sec==='ejemplos'){
    body=`<h1>Ejemplos pequeños</h1><div class="sx-banner">${badge('c')} Ejemplos con nombres ficticios; las salidas son de muestra y pueden variar con el sistema o el idioma. Pruébalos en una máquina Linux.</div>`+I.ejemplos.map(e=>`<article class="sx-ex"><h4>${esc(e.t)} ${badge('c')} ${srcs(e.src)}</h4><pre style="background:#17201b;color:#e8f0ea;border-radius:10px;padding:10px 12px;overflow:auto;font:12.5px/1.5 ui-monospace,monospace;margin:6px 0">${esc(e.cmds)}</pre>${md(e.md)}</article>`).join('');
  }else if(sec==='ejercicios'){
    body=`<h1>Ejercicios · ${esc(I.titulo.replace(/ · .*/,''))}</h1><div class="sx-banner">Intenta resolverlos <b>en papel</b> antes de abrir la solución. Las órdenes destructivas usan ejemplos ficticios y se explica exactamente qué se borraría o modificaría.</div>
      <div class="sx-row"><button class="sx-chip on" data-act="exfilter" data-v="">Todos</button><button class="sx-chip" data-act="exfilter" data-v="pend">Pendientes</button><button class="sx-chip" data-act="exfilter" data-v="ko">Fallados</button></div>`+I.ejercicios.map(e=>exHtml(e,item)).join('')
      +`<label class="sx-check"><input type="checkbox" data-chk="p:${I.id}:ejercicios"${s.checks[`p:${I.id}:ejercicios`]?' checked':''}><span>He hecho los ejercicios de esta incidencia.</span></label>`;
  }else if(sec==='errores'){
    body=`<h1>Errores y confusiones frecuentes</h1><p class="sx-small">Cada punto indica si procede de las guías (${badge('a')}), de un resumen (${badge('r')}) o es un complemento de estudio (${badge('c')}).</p>`+I.errores.map(e=>`<article class="sx-concept"><h4>${esc(e.t)} ${badge(e.o)} ${srcs(e.src)}</h4>${md(e.md)}</article>`).join('')
      +`<h2>Distinciones de esta incidencia</h2>`+I.distinciones.map(d=>`<article class="sx-concept"><h4>${inl(d.t)} ${srcs(d.src)}</h4>${md(d.md)}</article>`).join('')
      +`<label class="sx-check"><input type="checkbox" data-chk="p:${I.id}:distinciones"${s.checks[`p:${I.id}:distinciones`]?' checked':''}><span>Distingo estos pares de conceptos sin dudar.</span></label>`;
  }
  return nav+sub+body;
}
function exHtml(e,hl){
  const st=ST().ejer[e.id]?.estado||'';
  return`<article class="sx-ex${hl===e.id?' hl':''}" id="ex-${e.id}" data-ex="${e.id}" data-st="${st}"><h4>${esc(e.t)} <span class="sx-badge">${TIPOS[e.tipo]||e.tipo}</span> ${e.peligro?'<span class="sx-badge dan" title="Orden potencialmente destructiva con ejemplo ficticio">Orden destructiva (ficticia)</span>':''} <span class="sx-badge o-c">Ejercicio propuesto</span> ${srcs(e.src)} <span class="sx-st">${stBadge(st)}</span></h4>${md(e.enun)}
    <div class="sx-row"><button class="sx-btn sm" data-act="reveal" data-id="sol-${e.id}">Mostrar solución razonada</button></div>
    <div class="sx-sol" id="sol-${e.id}" hidden>${md(e.sol)}<div class="sx-row"><b class="sx-small">¿Cómo te ha salido?</b><button class="sx-btn sm" data-act="mark" data-id="${e.id}" data-v="ok">✓ Lo acerté</button><button class="sx-btn sm dan" data-act="mark" data-id="${e.id}" data-v="ko">✗ Fallé</button></div></div></article>`;
}
const stBadge=s=>s==='ok'?'<span class="sx-badge ok">Resuelto</span>':s==='ko'?'<span class="sx-badge ko">A repasar</span>':'';
function vDistinciones(){
  const M=DATA.meta;
  return`<h1>Distinciones clave</h1><p class="sx-lead">Cada distinción se ha <b>comprobado en los documentos</b> antes de presentarla como materia examinable: aquí tienes dónde aparece.</p>
  <div class="sx-tblwrap"><table class="sx-tbl"><thead><tr><th>Distinción</th><th>Incidencia</th><th>Dónde aparece</th></tr></thead><tbody>${M.distinciones.map(d=>`<tr><td><b>${inl(d.t)}</b><div class="sx-small">${inl(d.nota)}</div></td><td><button class="sx-chip" data-go="#ssoo/practica/${d.inc}/errores">Incidencia ${d.inc.slice(1)}</button></td><td>${srcs(d.evidencia)}</td></tr>`).join('')}</tbody></table></div>
  <h2>Resumen por incidencia</h2>${DATA.practica.incidencias.map(I=>`<details class="sx-sec" open><summary>${esc(I.titulo)}</summary><div class="in">${I.distinciones.map(d=>`<article class="sx-concept"><h4>${inl(d.t)} ${srcs(d.src)}</h4>${md(d.md)}</article>`).join('')}</div></details>`).join('')}`;
}

/* --- Simulacros --- */
function vSimulacros(id,arg){
  if(id==='examen-teoria'||id==='examen-practica'){if(!SIM||SIM.def.id!==id||SIM.arg!==(arg||'')){SIM=examenTipo(id,arg);SIM.arg=arg||''}return simView()}
  if(id&&SIM&&SIM.def.id===id)return simView();
  const all=[...DATA.sim.teoria.map(d=>({...d,kind:'teoria'})),...DATA.sim.practica.map(d=>({...d,kind:'practica'}))],hist=ST().sim;
  const card=d=>{const h=(hist[d.id]||[]).slice(-1)[0];return`<article class="sx-card ${d.kind==='teoria'?'t':'p'}"><h2 style="font-size:20px">${esc(d.titulo)}</h2><p class="sx-small">${esc(d.descripcion)}</p><p class="sx-small">${Object.values(d.tiempos).map(esc).join(' ')}</p>${h?`<div class="sx-small">Último intento: ${h.a} aciertos · ${h.f} fallos · ${h.b} en blanco</div>`:''}<div class="sx-row"><button class="sx-btn pri" data-act="simopen" data-id="${d.id}">Abrir</button></div></article>`};
  return`<h1>Simulacros</h1><div class="sx-banner"><b>Los tiempos son sugerencias</b>, no la duración del examen (se desconoce). Pensados para hacerlos <b>en papel</b>: imprime el enunciado, resuélvelo y luego corrige con la hoja de soluciones razonadas.</div>
  <h2>Teoría</h2><p class="sx-small">Test (sin penalización según la información recibida) y una pregunta de desarrollo. El número real de preguntas tipo test se desconoce: estos simulacros usan una cantidad de práctica.</p><div class="sx-grid2">${all.filter(d=>d.kind==='teoria').map(card).join('')}
   <article class="sx-card t"><h2 style="font-size:20px">Simulacro de teoría a medida</h2><p class="sx-small">Elige tú cuántas preguntas tipo test.</p><div class="sx-row"><label class="sx-small">Nº de preguntas <select class="sx-input" id="simN"><option>10</option><option>15</option><option selected>20</option><option>30</option><option>40</option></select></label></div><div class="sx-row"><button class="sx-btn pri" data-act="simcustom">Crear</button></div></article></div>
  <h2>Práctica</h2><p class="sx-small">Dos preguntas tipo test (que según la información recibida restan) y ejercicios de incidencias con órdenes sencillas.</p><div class="sx-grid2">${all.filter(d=>d.kind==='practica').map(card).join('')}
   <article class="sx-card p"><h2 style="font-size:20px">Simulacro de práctica aleatorio</h2><p class="sx-small">2 preguntas tipo test y 1 ejercicio de cada incidencia, al azar.</p><div class="sx-row"><button class="sx-btn pri" data-act="simrandom">Crear</button></div></article></div>`;
}
function simBuild(def){
  const kind=def.kind||(def.test.some(i=>DATA.Q[i])?'teoria':'practica');
  const tests=def.test.map(i=>(kind==='teoria'?DATA.Q:DATA.PT)[i]);
  return{def:{...def,kind},kind,tests,orders:tests.map(q=>shuffle(q.o.map((_,i)=>i))),picks:tests.map(()=>null),
    dev:kind==='teoria'?DATA.D[def.desarrollo]:null,ejs:kind==='practica'?def.ejercicios.map(i=>DATA.EX[i]):[],
    marks:{},stage:'intro',start:null,saved:false};
}
function simOpen(def){SIM=simBuild(def);location.hash=`#ssoo/simulacros/${def.id}`}
/* Examen tipo con el formato conocido (se abre desde el portal de estudio): #ssoo/simulacros/examen-teoria/t1,t2 | examen-practica/i1,i2,i3,i4 */
function examenTipo(id,arg){
  const kind=id==='examen-teoria'?'teoria':'practica',filt=(arg||'').split(',').filter(Boolean);
  if(kind==='teoria'){
    const temas=filt.length?filt:['t1','t2'],pool=DATA.teoria.test.filter(q=>temas.includes(q.tema)),devs=DATA.teoria.desarrollo.filter(d=>temas.includes(d.tema));
    return simBuild({id,kind,titulo:'Examen tipo de teoría',descripcion:`En papel. Test de ${Math.min(20,pool.length)} preguntas de práctica (según la información recibida el test vale 8 puntos y no resta; el número real se desconoce) y una pregunta de desarrollo (2 puntos). Temas: ${temas.map(t=>t==='t1'?'Tema 1':'Tema 2').join(' y ')}.`,
      test:shuffle(pool).slice(0,20).map(q=>q.id),desarrollo:shuffle(devs.length?devs:DATA.teoria.desarrollo)[0].id,
      tiempos:{test:'Sugerencia: aproximadamente 1 minuto por pregunta.',desarrollo:'Sugerencia: unos 15–20 minutos para el desarrollo.'}});
  }
  const incs=filt.length?filt:['i1','i2','i3','i4'],pts=shuffle(DATA.practica.test.filter(q=>incs.includes(q.inc))),pool=pts.length>=2?pts:shuffle(DATA.practica.test);
  return simBuild({id,kind,titulo:'Examen tipo de práctica',descripcion:'En papel. Dos preguntas tipo test (que según la información recibida sí restan) y un ejercicio de cada incidencia de la Práctica 1 con órdenes sencillas. La minishell no entra.',
    test:pool.slice(0,2).map(q=>q.id),ejercicios:incs.map(i=>shuffle(DATA.practica.incidencias.find(I=>I.id===i).ejercicios)[0].id),
    tiempos:{test:'Sugerencia: 5 minutos para las dos preguntas.',ejercicios:'Sugerencia: unos 10–12 minutos por ejercicio.'}});
}
function simView(){
  const S=SIM,d=S.def;
  const head=`<div class="sx-row"><button class="sx-btn sm" data-act="simexit">← ${S.arg!==undefined?'Volver':'Simulacros'}</button>${S.arg!==undefined&&S.stage==='intro'?'<button class="sx-btn sm" data-act="simregen">Otro examen tipo</button>':''}</div><h1>${esc(d.titulo)}</h1>`;
  if(S.stage==='intro'){
    return head+`<p class="sx-lead">${esc(d.descripcion||'')}</p><div class="sx-banner">${Object.values(d.tiempos).map(esc).join(' ')} <b>Son sugerencias</b>, no la duración oficial.</div>
      ${S.kind==='practica'?'<div class="sx-banner red">Las dos preguntas tipo test restan según la información recibida. <b>No se conoce la fórmula</b>: no se calcula nota; se cuentan aciertos, fallos y blancos.</div>':'<div class="sx-banner">El test de teoría no resta según la información recibida.</div>'}
      <div class="sx-grid2"><article class="sx-card ${S.kind==='teoria'?'t':'p'}"><h2 style="font-size:20px">En papel (recomendado)</h2><p class="sx-small">Imprime el enunciado, resuélvelo con boli y sin apuntes, y luego corrige aquí.</p><div class="sx-row"><button class="sx-btn pri" data-act="simprint" data-v="enun">Imprimir enunciado</button><button class="sx-btn" data-act="simstage" data-v="corr">Ya lo hice: corregir</button></div><div class="sx-row"><button class="sx-btn" data-act="simprint" data-v="sol">Imprimir soluciones razonadas</button></div></article>
      <article class="sx-card ${S.kind==='teoria'?'t':'p'}"><h2 style="font-size:20px">En pantalla</h2><p class="sx-small">Responde aquí y se corrige al entregar.</p><div class="sx-row"><label class="sx-small"><input type="checkbox" id="simTimer"> Mostrar cronómetro (sugerencia)</label></div><div class="sx-row"><button class="sx-btn pri" data-act="simstage" data-v="screen">Empezar</button></div></article></div>`;
  }
  if(S.stage==='screen'){
    return head+`<div class="sx-row"><span class="sx-timer" id="sxTimer" ${S.timer?'':'hidden'}>00:00</span></div><h2>${S.kind==='teoria'?'Test':'Preguntas tipo test'}</h2>`+S.tests.map((q,i)=>`<article class="sx-ex"><div class="sx-qn">Pregunta ${i+1}</div><h4 style="font-size:15px">${inl(q.q)}</h4>${S.orders[i].map((oi,k)=>`<label class="sx-opt" style="cursor:pointer"><input type="radio" name="sq${i}" value="${oi}" ${S.picks[i]===oi?'checked':''}><span>${'ABCD'[k]}. ${inl(q.o[oi])}</span></label>`).join('')}${S.kind==='practica'?'<div class="sx-small">Si no la sabes, déjala sin marcar (en blanco).</div>':''}</article>`).join('')
      +(S.kind==='teoria'?`<h2>Pregunta de desarrollo (2 puntos)</h2><article class="sx-ex"><h4 style="font-size:15px">${esc(S.dev.titulo)} <span class="sx-badge o-c">Propuesta</span></h4>${md(S.dev.enunciado)}<p class="sx-small">Resuélvela en papel (esquema de 3 minutos y redacción) y corrígela después.</p></article>`:`<h2>Ejercicios de incidencias</h2>`+S.ejs.map((e,i)=>`<article class="sx-ex"><h4 style="font-size:15px">Ejercicio ${i+1} · ${esc(e.t)} <span class="sx-badge">${TIPOS[e.tipo]}</span>${e.peligro?' <span class="sx-badge dan">Orden destructiva (ficticia)</span>':''}</h4>${md(e.enun)}<p class="sx-small">Respóndelo en papel y corrige después.</p></article>`).join(''))
      +`<div class="sx-row"><button class="sx-btn pri" data-act="simsubmit">Entregar y corregir</button></div>`;
  }
  return head+simCorr();
}
function simCorr(){
  const S=SIM,s=ST();let a=0,f=0,b=0;
  const tests=S.tests.map((q,i)=>{
    const pick=S.picks[i],mk=S.marks['t'+i]??(pick===null?(S.fromScreen?'b':null):(pick===q.a?'a':'f')),
      shownPick=pick;
    return{q,i,pick:shownPick,mk};
  });
  tests.forEach(t=>{if(t.mk==='a')a++;else if(t.mk==='f')f++;else if(t.mk==='b')b++});
  const dev=S.dev;const ejMarks=S.ejs.map((e,i)=>S.marks['e'+i]||null);
  const sum=`<div class="sx-stat"><div><b>${a}</b><span>Aciertos</span></div><div><b>${f}</b><span>Fallos</span></div><div><b>${b}</b><span>En blanco</span></div></div>`;
  const mkBtns=(key,cur,withBlank)=>`<div class="sx-row"><b class="sx-small">Anota tu resultado:</b><button class="sx-btn sm${cur==='a'?' pri':''}" data-act="simmark" data-k="${key}" data-v="a">✓ Acerté</button><button class="sx-btn sm${cur==='f'?' dan':''}" data-act="simmark" data-k="${key}" data-v="f">✗ Fallé</button>${withBlank?`<button class="sx-btn sm${cur==='b'?' pri':''}" data-act="simmark" data-k="${key}" data-v="b">○ En blanco</button>`:''}</div>`;
  return`<div class="sx-banner blue"><b>Hoja de soluciones razonadas.</b> ${S.fromScreen?'Se ha corregido tu test; puedes ajustar las marcas.':'Marca cómo te fue en cada pregunta (hecha en papel).'} ${S.kind==='practica'?'Las dos preguntas tipo test restan según la información recibida; no se calcula nota.':''}</div>${sum}
  <h2>${S.kind==='teoria'?'Test':'Preguntas tipo test'}</h2>`+tests.map(t=>`<article class="sx-ex"><div class="sx-qn">Pregunta ${t.i+1}</div><h4 style="font-size:15px">${inl(t.q.q)}</h4>${t.q.o.map((o,oi)=>`<div class="sx-opt ${oi===t.q.a?'good':t.pick===oi?'bad':''}" style="cursor:default"><b>${oi===t.q.a?'✓':t.pick===oi?'✗':''}</b><span>${inl(o)}</span></div>`).join('')}<div class="sx-expl"><b>Respuesta:</b> ${inl(t.q.o[t.q.a])}. ${inl(t.q.e)} ${srcs(t.q.src)}</div>${mkBtns('t'+t.i,t.mk,true)}</article>`).join('')
  +(S.kind==='teoria'?`<h2>Desarrollo</h2><article class="sx-ex"><h4 style="font-size:15px">${esc(dev.titulo)} <span class="sx-badge o-c">Propuesta</span> ${srcs(dev.src)}</h4>${md(dev.enunciado)}<h3>Esquema de respuesta</h3>${md(dev.esquema.map(x=>'- '+x).join('\n'))}<h3>Rúbrica</h3><div class="sx-rub">${dev.rubrica.map((r,i)=>`<label><input type="checkbox" data-rub="${dev.id}:${i}"${s.rub[dev.id+':'+i]?' checked':''}> ${esc(r)}</label>`).join('')}</div><div class="sx-small" id="${dev.id}-score">${rubScore(dev)}</div></article>`
    :`<h2>Ejercicios de incidencias</h2>`+S.ejs.map((e,i)=>`<article class="sx-ex"><h4 style="font-size:15px">Ejercicio ${i+1} · ${esc(e.t)} ${srcs(e.src)}</h4>${md(e.enun)}<div class="sx-sol">${md(e.sol)}</div>${mkBtns('e'+i,ejMarks[i],false)}</article>`).join(''))
  +`<div class="sx-row"><button class="sx-btn pri" data-act="simsave"${S.saved?' disabled':''}>${S.saved?'Resultado guardado':'Guardar resultado y registrar errores'}</button><button class="sx-btn" data-act="simexit">Salir</button></div>`;
}
function printSheet(mode){
  const S=SIM,d=S.def,sol=mode==='sol';let h=`<h1>${esc(d.titulo)} ${sol?'· Soluciones razonadas':''}</h1><div>Sistemas Operativos · Simulacro en papel · ${Object.values(d.tiempos).map(esc).join(' ')} (sugerencias, no es la duración oficial)</div>`;
  h+=`<h2>${S.kind==='teoria'?'Test':'Preguntas tipo test'}</h2>`+S.tests.map((q,i)=>`<div class="q"><b>${i+1}.</b> ${esc(q.q.replace(/`/g,''))}${S.orders[i].map((oi,k)=>`<div class="opt">${'ABCD'[k]}) ${esc(q.o[oi].replace(/`/g,''))}${sol&&oi===q.a?' ✔':''}</div>`).join('')}${sol?`<div class="opt"><i>${esc(q.e.replace(/`/g,''))}</i></div>`:''}</div>`).join('');
  if(S.kind==='teoria'){h+=`<h2>Pregunta de desarrollo (2 puntos)</h2><div class="q"><b>${esc(S.dev.titulo)}.</b> ${esc(S.dev.enunciado.replace(/`/g,''))}${sol?`<ul>${S.dev.esquema.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:Array.from({length:14},()=>'<div class="lines"></div>').join('')}</div>`}
  else{h+=`<h2>Ejercicios de incidencias</h2>`+S.ejs.map((e,i)=>`<div class="q"><b>Ejercicio ${i+1}.</b> ${esc(e.t)}<pre>${esc(e.enun.replace(/```/g,'').replace(/`/g,''))}</pre>${sol?`<pre>${esc(e.sol.replace(/```/g,'').replace(/`/g,''))}</pre>`:Array.from({length:8},()=>'<div class="lines"></div>').join('')}</div>`).join('')}
  let box=document.getElementById('sxPrint');if(!box){box=document.createElement('div');box.id='sxPrint';document.body.append(box)}
  box.innerHTML=h;
  const clear=()=>{box.innerHTML='';window.removeEventListener('afterprint',clear)};window.addEventListener('afterprint',clear);
  setTimeout(()=>window.print(),50);
}
function simSubmit(){
  const S=SIM;
  S.tests.forEach((_,i)=>{const r=overlay.querySelector(`input[name=sq${i}]:checked`);S.picks[i]=r?Number(r.value):null});
  S.fromScreen=true;S.marks={};clearInterval(timer);S.stage='corr';renderMain();
}
function simSave(){
  const S=SIM,s=ST();let a=0,f=0,b=0;
  S.tests.forEach((q,i)=>{const mk=S.marks['t'+i]??(S.picks[i]===null?(S.fromScreen?'b':null):(S.picks[i]===q.a?'a':'f'));
    if(mk==='a')a++;else if(mk==='f'){f++;addError(S.kind==='teoria'?'test':'ptest',q.id,q.q)}else if(mk==='b'){b++;addError(S.kind==='teoria'?'test':'ptest',q.id,q.q)}});
  S.ejs.forEach((e,i)=>{const mk=S.marks['e'+i];if(mk==='a'){s.ejer[e.id]={estado:'ok',at:new Date().toISOString()}}else if(mk==='f'){s.ejer[e.id]={estado:'ko',at:new Date().toISOString()};addError('ejercicio',e.id,e.t)}});
  const rub=S.dev?S.dev.rubrica.filter((_,i)=>s.rub[S.dev.id+':'+i]).length:null;
  const arr=s.sim[S.def.id]=s.sim[S.def.id]||[];arr.push({at:new Date().toISOString(),a,f,b,rub});if(arr.length>10)arr.shift();
  S.saved=true;save();toastMsg('Resultado guardado');renderMain();
}
function simTick(){
  const el=document.getElementById('sxTimer');if(!el||!SIM?.start)return;
  const t=Math.floor((Date.now()-SIM.start)/1000);el.textContent=`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
}

/* --- Plan y seguimiento --- */
function vPlan(){
  const P=DATA.plan,s=ST(),pt=progTeoria(),pp=progPractica(),pend=s.errores.filter(e=>!e.resuelto),done=s.errores.filter(e=>e.resuelto);
  const phase=f=>`<details class="sx-sec"${f.id==='f0'?' open':''}><summary>${esc(f.t)}</summary><div class="in">${f.pasos.map((p,i)=>`<label class="sx-check"><input type="checkbox" data-chk="plan:${f.id}:${i}"${s.checks[`plan:${f.id}:${i}`]?' checked':''}><span>${inl(p)}</span></label>`).join('')}</div></details>`;
  const errItem=e=>{const l=errLink(e);return`<div class="sx-err${e.resuelto?' done':''}"><div class="tx"><span class="sx-badge">${kindLbl[e.kind]||e.kind}</span> ${inl(e.texto)}${e.nota?`<div class="sx-small">${esc(e.nota)}</div>`:''}</div><div class="sx-row" style="margin:0">${l?`<button class="sx-btn sm" data-go="${l}">Ir</button>`:''}${e.resuelto?`<button class="sx-btn sm" data-act="errreopen" data-id="${e.id}">Reabrir</button>`:`<button class="sx-btn sm pri" data-act="errresolve" data-id="${e.id}">Resuelto</button>`}<button class="sx-btn sm dan" data-act="errdel" data-id="${e.id}" aria-label="Eliminar">✕</button></div></div>`};
  return`<h1>Plan y seguimiento</h1><div class="sx-banner">${badge('c')} ${esc(P.aviso)}</div>
  <h2>Ruta de estudio</h2>${P.fases.map(phase).join('')}
  <h2>Progreso por tema e incidencia</h2>
  <div class="sx-grid2"><article class="sx-card t"><h3 style="margin-top:0">Teoría</h3>${bar(pt.pct)}${DATA.teoria.temas.flatMap(t=>t.subtemas).map(x=>`<label class="sx-check"><input type="checkbox" data-chk="t:${x.id}"${s.checks['t:'+x.id]?' checked':''}><span>${esc(x.titulo)}</span></label>`).join('')}<div class="sx-small">${pt.seen}/${pt.qtotal} preguntas contestadas · ${DATA.teoria.desarrollo.filter(d=>d.rubrica.some((_,i)=>s.rub[d.id+':'+i])).length}/${DATA.teoria.desarrollo.length} desarrollos trabajados</div></article>
  <article class="sx-card p"><h3 style="margin-top:0">Práctica</h3>${bar(pp.pct)}${DATA.practica.incidencias.map(I=>`<div class="sx-check" style="display:block"><b>${esc(I.titulo.replace(/ · .*/,''))}</b>${[['conceptos','Conceptos'],['ordenes','Órdenes de memoria'],['ejercicios','Ejercicios'],['distinciones','Distinciones']].map(([k,l])=>`<label style="display:flex;gap:8px;margin:3px 0 3px 8px;cursor:pointer"><input type="checkbox" data-chk="p:${I.id}:${k}"${s.checks[`p:${I.id}:${k}`]?' checked':''} style="width:16px;height:16px"> <span class="sx-small">${l}</span></label>`).join('')}</div>`).join('')}<div class="sx-small">${pp.made}/${pp.extotal} ejercicios resueltos</div></article></div>
  <h2>Errores que debo volver a practicar</h2><p class="sx-small">Se llena solo con tus fallos en tests, ejercicios y simulacros. Puedes añadir los tuyos.</p>
  <div class="sx-row"><button class="sx-btn pri" data-act="revstart"${pend.length?'':' disabled'}>Repasar ahora (${pend.length})</button></div><div id="sxReview"></div>
  ${pend.length?pend.map(errItem).join(''):'<div class="sx-banner">No tienes errores pendientes. ¡Bien! Sigue con los simulacros.</div>'}
  <form class="sx-row" data-form="erradd"><input class="sx-input" name="texto" placeholder="Anota algo que debas volver a practicar…" style="flex:1;min-width:200px" required><button class="sx-btn" type="submit">Añadir</button></form>
  ${done.length?`<details class="sx-sec"><summary>Resueltos (${done.length})</summary><div class="in">${done.map(errItem).join('')}</div></details>`:''}`;
}
function revStart(){
  const s=ST(),pend=s.errores.filter(e=>!e.resuelto);
  if(!pend.length)return;
  REV={items:shuffle(pend).map(e=>({e,order:null,pick:null,shown:false})),i:0,ok:0};
  revRender();
}
function revRender(){
  const box=$q('#sxReview');if(!box||!REV)return;
  if(REV.i>=REV.items.length){box.innerHTML=`<div class="sx-banner blue"><b>Repaso terminado.</b> ${REV.ok} de ${REV.items.length} resueltos.</div>`;REV=null;renderMain();return}
  const it=REV.items[REV.i],e=it.e;let body='';
  if(e.kind==='test'||e.kind==='ptest'){
    const q=(e.kind==='test'?DATA.Q:DATA.PT)[e.ref];
    if(!q)body=`<p>${inl(e.texto)}</p>`;
    else{it.order=it.order||shuffle(q.o.map((_,i)=>i));const ans=it.pick!==null;body=`<h4 style="font-size:15px">${inl(q.q)}</h4>${it.order.map((oi,k)=>`<button class="sx-opt${ans&&oi===q.a?' good':''}${ans&&it.pick===oi&&oi!==q.a?' bad':''}" data-act="revpick" data-oi="${oi}"${ans?' disabled':''}><b>${'ABCD'[k]}</b><span>${inl(q.o[oi])}</span></button>`).join('')}${ans?`<div class="sx-expl">${inl(q.e)} ${srcs(q.src)}</div>`:''}`}
  }else if(e.kind==='ejercicio'){
    const x=DATA.EX[e.ref];
    body=x?`<h4 style="font-size:15px">${esc(x.t)}</h4>${md(x.enun)}<div class="sx-row"><button class="sx-btn sm" data-act="revshow">Mostrar solución</button></div>${it.shown?`<div class="sx-sol">${md(x.sol)}</div>`:''}`:`<p>${inl(e.texto)}</p>`;
  }else body=`<p>${inl(e.texto)}</p>`;
  const ask=(e.kind==='ejercicio'||e.kind==='manual'||!(DATA.Q[e.ref]||DATA.PT[e.ref]));
  box.innerHTML=`<article class="sx-ex"><div class="sx-qn">Repaso ${REV.i+1} de ${REV.items.length} · ${kindLbl[e.kind]}</div>${body}<div class="sx-row">${ask?`<button class="sx-btn sm pri" data-act="revdone" data-v="ok">Ya lo sé (resolver)</button><button class="sx-btn sm" data-act="revdone" data-v="ko">Aún no</button>`:(it.pick!==null?`<button class="sx-btn sm pri" data-act="revnext">Siguiente</button>`:'')}<button class="sx-btn sm dan" data-act="revstop">Salir</button></div></article>`;
}

/* ---------- Navegación y render ---------- */
const $q=(s)=>overlay?.querySelector(s);
function parse(){const h=location.hash.replace(/^#/,'').split('/');return h[0]==='ssoo'?h.slice(1):(/\/ssoo\/?$/.test(location.pathname)?[]:null)}
function frame(){
  if(!overlay){
    const st=document.createElement('style');st.textContent=CSS;document.head.append(st);
    overlay=document.createElement('div');overlay.id='ssooOverlay';overlay.className='sx-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Guía de estudio del examen de SSOO');
    overlay.innerHTML=`<header class="sx-bar"><button class="sx-brand" data-go="#ssoo"><span class="sx-logo">03</span><span><b>SSOO · Examen</b><small>Atlas · INFOADE</small></span></button><nav class="sx-tabs" aria-label="Secciones"></nav><button class="sx-x" data-act="close" aria-label="Cerrar">✕</button></header><main class="sx-main" id="sxMain" tabindex="-1"></main>`;
    document.body.append(overlay);
    topEl=overlay.querySelector('.sx-tabs');mainEl=overlay.querySelector('#sxMain');
    overlay.addEventListener('click',onClick);overlay.addEventListener('change',onChange);overlay.addEventListener('input',onInput);overlay.addEventListener('submit',onSubmit);
  }
}
function renderMain(keepScroll){
  const p=parse();if(!p||!DATA)return;
  const tab=p[0]||'inicio',y=overlay.scrollTop;
  topEl.innerHTML=[['inicio','Inicio'],['teoria','Teoría'],['practica','Práctica'],['simulacros','Simulacros'],['plan','Plan']].map(([k,l])=>`<button class="sx-tab${k===tab?' on':''}" data-go="${k==='inicio'?'#ssoo':'#ssoo/'+k}">${l}</button>`).join('');
  let html='';
  if(tab==='teoria')html=vTeoria(p[1]);
  else if(tab==='practica')html=vPractica(p[1],p[2],p[3]);
  else if(tab==='simulacros')html=vSimulacros(p[1],p[2]);
  else if(tab==='plan')html=vPlan();
  else html=vInicio();
  mainEl.innerHTML=html;
  if(keepScroll)overlay.scrollTop=y;
  else{
    overlay.scrollTop=0;try{mainEl.focus({preventScroll:true})}catch(_){}
    const anchor=(tab==='teoria'&&p[1]==='conceptos'&&p[2])?document.getElementById('sub-'+p[2]):(tab==='practica'&&p[3]?document.getElementById('ex-'+p[3]):null);
    if(anchor){anchor.scrollIntoView({block:'start'})}
  }
  if(tab==='simulacros'&&SIM?.stage==='screen'&&SIM.timer){clearInterval(timer);timer=setInterval(simTick,500);simTick()}
}
async function open(){
  frame();
  overlay.classList.add('open');document.body.style.overflow='hidden';
  try{await whenReady();await load()}catch(e){mainEl.innerHTML=`<div class="sx-banner red">No se pudo cargar el contenido de la guía (${esc(e.message)}). Comprueba la conexión.</div>`;return}
  renderMain();
}
function close(){
  if(!overlay?.classList.contains('open'))return;
  clearInterval(timer);overlay.classList.remove('open');document.body.style.overflow='';closePop();
  if(SIM&&SIM.arg!==undefined)SIM=null;   // el examen tipo se genera de nuevo al volver
  const back=prevHash&&!/^#ssoo/.test(prevHash)?prevHash:'';
  if(/\/ssoo\/?$/.test(location.pathname))history.pushState(null,'',location.pathname.replace(/\/ssoo\/?$/,'/')+location.search+back);
  else if(location.hash!==back)history.replaceState(null,'',location.pathname+location.search+back);
  if(back)window.dispatchEvent(new HashChangeEvent('hashchange'));
}
function go(h){if(location.hash!==h)location.hash=h;else renderMain()}
function route(){
  const p=parse();
  if(p){if(!overlay?.classList.contains('open'))prevHash=lastHash;open()}
  else if(overlay?.classList.contains('open')){clearInterval(timer);overlay.classList.remove('open');document.body.style.overflow='';closePop();if(SIM&&SIM.arg!==undefined)SIM=null}
}
let lastHash=/^#ssoo/.test(location.hash)?'':location.hash;
function onHash(ev){
  const old=ev?.oldURL?new URL(ev.oldURL).hash:'';
  if(!/^#ssoo/.test(old))lastHash=old;   // hash desde el que se entró en la guía
  route();
}

/* ---------- Eventos ---------- */
function closePop(){popEl?.remove();popEl=null}
function firstNum(p){return(String(p).match(/\d+/)||[1])[0]}
function showPop(btn){
  closePop();const s=btn.dataset.s,p=btn.dataset.p,e=btn.dataset.e,f=DATA.SRC[s];
  if(LINKS[s]){window.open(`${LINKS[s]}#page=${firstNum(p)}`,'_blank','noopener');return}
  popEl=document.createElement('div');popEl.className='sx-pop';
  popEl.innerHTML=`<b>${esc(f?.titulo||s)}</b><div><code style="color:#dfff59">${esc(f?.ruta||'')}</code></div><div>Página ${esc(p)}${e?' · '+esc(e):''} (página del PDF)</div><div style="opacity:.8;margin-top:4px">Vincula el PDF para que este enlace lo abra en esa página.</div><button class="sx-btn sm" data-act="link" data-s="${esc(s)}">Vincular PDF…</button>`;
  overlay.append(popEl);const r=btn.getBoundingClientRect();
  popEl.style.left=Math.max(8,Math.min(r.left,innerWidth-popEl.offsetWidth-8))+'px';popEl.style.top=Math.min(r.bottom+6,innerHeight-popEl.offsetHeight-8)+'px';
}
function pickPdf(sid){
  const inp=document.createElement('input');inp.type='file';inp.accept='application/pdf';
  inp.onchange=()=>{const f=inp.files[0];if(!f)return;if(LINKS[sid])URL.revokeObjectURL(LINKS[sid]);LINKS[sid]=URL.createObjectURL(f);closePop();toastMsg(`PDF vinculado: ${f.name}`);renderMain(true)};
  inp.click();
}
function onClick(ev){
  const t=ev.target;
  if(popEl&&!t.closest('.sx-pop')&&!t.closest('[data-act=src]'))closePop();
  const g=t.closest('[data-go]');if(g&&!t.closest('[data-act]')){ev.preventDefault();return go(g.dataset.go)}
  const b=t.closest('[data-act]');if(!b)return;
  const act=b.dataset.act,id=b.dataset.id;
  switch(act){
    case'close':return close();
    case'src':return showPop(b);
    case'link':return pickPdf(b.dataset.s);
    case'open':return LINKS[b.dataset.s]&&window.open(LINKS[b.dataset.s],'_blank','noopener');
    case'reveal':{const el=document.getElementById(id);if(el){el.hidden=!el.hidden;b.textContent=el.hidden?b.textContent.replace('Ocultar','Mostrar'):b.textContent.replace('Mostrar','Ocultar')}return}
    case'showfn':return b.classList.toggle('show');
    case'gfilter':{overlay.querySelectorAll('[data-act=gfilter]').forEach(x=>x.classList.toggle('on',x===b));const g=overlay.querySelector('#sxGlos');if(g){g.dataset.tf=b.dataset.v;applyGlos()}return}
    case'exfilter':{const v=b.dataset.v;b.parentElement.querySelectorAll('.sx-chip').forEach(x=>x.classList.toggle('on',x===b));overlay.querySelectorAll('[data-ex]').forEach(x=>{const st=x.dataset.st;x.style.display=!v||(v==='pend'&&st!=='ok')||(v==='ko'&&st==='ko')?'':'none'});return}
    case'mark':{
      const s=ST(),ex=DATA.EX[id];s.ejer[id]={estado:b.dataset.v,at:new Date().toISOString()};
      if(b.dataset.v==='ko')addError('ejercicio',id,ex.t);else{const e=s.errores.find(e=>e.kind==='ejercicio'&&e.ref===id&&!e.resuelto);if(e)e.resuelto=true}
      const card=document.getElementById('ex-'+id);if(card){card.dataset.st=b.dataset.v;card.querySelector('.sx-st').innerHTML=stBadge(b.dataset.v)}
      toastMsg(b.dataset.v==='ok'?'Anotado como resuelto':'Añadido a errores a repasar');return save();}
    case'printres':return printResumen(b.dataset.v);
    case'qstart':return qzStart(b.dataset.kind);
    case'qrestart':{const k=b.dataset.kind;$q('#sxQuiz').innerHTML=quizConfig(k);return}
    case'qpick':return qzPick(Number(b.dataset.oi));
    case'qblank':return qzBlank();
    case'qnext':QZ.i++;return qzRender();
    case'qstop':{if(QZ){QZ.i=QZ.items.length;qzRender()}return}
    case'simopen':{const d=[...DATA.sim.teoria.map(x=>({...x,kind:'teoria'})),...DATA.sim.practica.map(x=>({...x,kind:'practica'}))].find(x=>x.id===id);return simOpen(d)}
    case'simcustom':{const n=Number($q('#simN').value)||20,ids=shuffle(DATA.teoria.test.map(q=>q.id)).slice(0,n);return simOpen({id:'st-custom',titulo:`Simulacro de teoría a medida (${n} preguntas)`,descripcion:'Test aleatorio y un tema de desarrollo al azar.',kind:'teoria',test:ids,desarrollo:shuffle(DATA.teoria.desarrollo)[0].id,tiempos:{test:`Sugerencia: aproximadamente 1 minuto por pregunta.`,desarrollo:'Sugerencia: unos 15–20 minutos para el desarrollo.'}})}
    case'simrandom':{const ids=shuffle(DATA.practica.test.map(q=>q.id)).slice(0,2),exs=DATA.practica.incidencias.map(I=>shuffle(I.ejercicios)[0].id);return simOpen({id:'sp-custom',titulo:'Simulacro de práctica aleatorio',descripcion:'2 preguntas tipo test y 1 ejercicio de cada incidencia.',kind:'practica',test:ids,ejercicios:exs,tiempos:{test:'Sugerencia: 5 minutos para las dos preguntas.',ejercicios:'Sugerencia: unos 10–12 minutos por ejercicio.'}})}
    case'simexit':{clearInterval(timer);const fromEx=SIM&&SIM.arg!==undefined;SIM=null;if(fromEx&&prevHash&&!/^#ssoo/.test(prevHash))return close();return go('#ssoo/simulacros')}
    case'simregen':{const a=SIM.arg,id=SIM.def.id;SIM=examenTipo(id,a);SIM.arg=a;return renderMain()}
    case'simstage':{SIM.stage=b.dataset.v;SIM.fromScreen=false;if(SIM.stage==='screen'){SIM.timer=!!$q('#simTimer')?.checked;SIM.start=Date.now()}if(SIM.stage==='corr'){SIM.marks={}}return renderMain()}
    case'simprint':return printSheet(b.dataset.v);
    case'simsubmit':return simSubmit();
    case'simmark':{SIM.marks[b.dataset.k]=b.dataset.v;return renderMain(true)}
    case'simsave':return simSave();
    case'errresolve':{const e=ST().errores.find(x=>x.id===id);if(e)e.resuelto=true;save();return renderMain(true)}
    case'errreopen':{const e=ST().errores.find(x=>x.id===id);if(e)e.resuelto=false;save();return renderMain(true)}
    case'errdel':{const s=ST();s.errores=s.errores.filter(x=>x.id!==id);save();return renderMain(true)}
    case'revstart':return revStart();
    case'revpick':{const it=REV.items[REV.i],q=(it.e.kind==='test'?DATA.Q:DATA.PT)[it.e.ref];it.pick=Number(b.dataset.oi);if(it.pick===q.a){it.e.resuelto=true;REV.ok++;toastMsg('¡Correcto! Marcado como resuelto')}save();return revRender()}
    case'revshow':{REV.items[REV.i].shown=true;return revRender()}
    case'revdone':{const it=REV.items[REV.i];if(b.dataset.v==='ok'){it.e.resuelto=true;REV.ok++;if(it.e.kind==='ejercicio'){const s=ST();s.ejer[it.e.ref]={estado:'ok',at:new Date().toISOString()}}}save();REV.i++;return revRender()}
    case'revnext':REV.i++;return revRender();
    case'revstop':REV=null;return renderMain();
  }
}
function onChange(ev){
  const t=ev.target;
  if(t.dataset.chk!==undefined){ST().checks[t.dataset.chk]=t.checked;save();return}
  if(t.dataset.rub!==undefined){const[id,i]=t.dataset.rub.split(':');ST().rub[`${id}:${i}`]=t.checked;save();const d=DATA.D[id],el=document.getElementById(id+'-score');if(d&&el)el.textContent=rubScore(d);return}
  if(t.dataset.memory!==undefined){document.getElementById('sxOrd')?.classList.toggle('sx-memory',t.checked);overlay.querySelectorAll('#sxOrd td.fn').forEach(x=>x.classList.remove('show'));return}
}
function applyGlos(){const g=overlay.querySelector('#sxGlos');if(!g)return;const tf=g.dataset.tf||'',sq=g.dataset.sq||'';g.querySelectorAll('.sx-term').forEach(x=>x.style.display=(!tf||x.dataset.tema===tf)&&(!sq||x.textContent.toLowerCase().includes(sq))?'':'none')}
let noteT=0;
function onInput(ev){
  const t=ev.target;
  if(t.dataset.filter){const q=t.value.trim().toLowerCase();if(t.dataset.filter==='.sx-term'){const g=overlay.querySelector('#sxGlos');if(g){g.dataset.sq=q;applyGlos()}return}overlay.querySelectorAll(t.dataset.filter).forEach(x=>x.style.display=!q||x.textContent.toLowerCase().includes(q)?'':'none');return}
  if(t.dataset.note){clearTimeout(noteT);noteT=setTimeout(()=>{ST().notes[t.dataset.note]=t.value;save()},500)}
}
function onSubmit(ev){
  const f=ev.target.closest('[data-form=erradd]');if(!f)return;
  ev.preventDefault();const txt=new FormData(f).get('texto').toString().trim();if(!txt)return;
  ST().errores.push({id:uid(),kind:'manual',ref:'',texto:txt,at:new Date().toISOString(),resuelto:false,nota:''});save();renderMain(true);
}
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&overlay?.classList.contains('open')&&!ev.defaultPrevented){if(popEl)return closePop();ev.preventDefault();close()}});
window.addEventListener('hashchange',onHash);
window.addEventListener('popstate',()=>{if(!/^#ssoo/.test(location.hash)&&!/\/ssoo\/?$/.test(location.pathname)&&overlay?.classList.contains('open')){clearInterval(timer);overlay.classList.remove('open');document.body.style.overflow=''}});
if(/\/ssoo\/?$/.test(location.pathname)&&!/^#ssoo/.test(location.hash))history.replaceState(null,'',location.pathname+location.search+'#ssoo');
window.atlasSsooExam={open:()=>go('#ssoo')};
if(parse())open();
})();
