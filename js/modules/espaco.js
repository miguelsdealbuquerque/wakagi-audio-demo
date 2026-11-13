/* Espaço: distância, direção e oclusão como informação (pilar Espacialidade total). */
(function(){
'use strict';
var WK=window.WK,WKM=window.WKM,$=WK.$,clamp=WK.clamp;
var cv,cg,src={x:6,y:14},drag=false,wallOn=true,calling=false,nextCall=0,chain=null,lastD=0;
var RMAX=30,WALL={x1:-10,x2:10,y:8};

function geom(){
  var d=Math.hypot(src.x,src.y),dist=Math.max(d,1);
  var gdb=-20*Math.log10(dist),cut=clamp(20000*Math.exp(-d/18),1500,20000);
  var occ=wallOn&&crosses();if(occ){gdb-=9;cut=Math.min(cut,800)}
  var pan=clamp(src.x/dist,-1,1);
  return {d:d,gdb:gdb,cut:cut,occ:occ,pan:pan}}
function crosses(){ /* o segmento ouvinte→fonte atravessa a parede? */
  var ax=0,ay=0,bx=src.x,by=src.y;if(by<=WALL.y)return false;
  var t=(WALL.y-ay)/(by-ay),x=ax+t*(bx-ax);return x>=WALL.x1&&x<=WALL.x2}

function build(el){
  el.innerHTML='<div class="card"><span class="eyebrow">Pilar · Espacialidade total</span><h2>De onde vem, a que distância, atrás de quê</h2>'+
  '<p class="sub">Sem arma, o jogador sobrevive se ouvir a ameaça antes de vê-la. Arraste a fonte pelo mapa e escute a direção, a distância e o obstáculo.</p>'+
  '<canvas id="spCv" aria-label="Mapa visto de cima, com o ouvinte no centro e uma fonte sonora arrastável"></canvas>'+
  '<div class="row" style="margin-top:.7rem;align-items:center"><button class="btn primary" id="spCall" aria-pressed="false">Tocar chamado</button>'+
  '<button class="btn on" id="spWall" aria-pressed="true">Parede entre o ouvinte e a fonte</button><span class="hint" style="margin:0" id="spRead"></span></div>'+
  '<canvas id="spCg" style="margin-top:.8rem" aria-label="Curvas de volume, filtro e pan"></canvas>'+
  '<p class="hint">'+WKM.tag('proj')+' Espacialidade total é um dos cinco pilares do ADD. '+WKM.tag('apoio')+' As curvas são um modelo físico simples (−6 dB a cada dobro da distância), para explicar. No jogo, quem define as curvas é o FMOD.</p></div>';
  cv=$('#spCv');cg=$('#spCg');
  var ptr=function(e){var r=cv.getBoundingClientRect(),w=r.width,h=r.height,sc=Math.min(w,h)/2-18;return {x:(e.clientX-r.left-w/2)/sc*RMAX,y:-(e.clientY-r.top-h/2)/sc*RMAX}};
  cv.addEventListener('pointerdown',function(e){cv.setPointerCapture(e.pointerId);drag=true;mv(ptr(e))});
  cv.addEventListener('pointermove',function(e){if(drag)mv(ptr(e))});
  ['pointerup','pointercancel'].forEach(function(n){cv.addEventListener(n,function(){drag=false})});
  $('#spCall').onclick=function(){if(!WK.need())return;calling=!calling;this.classList.toggle('on',calling);this.setAttribute('aria-pressed',calling);this.textContent=calling?'Parar chamado':'Tocar chamado';if(calling)nextCall=0};
  $('#spWall').onclick=function(){wallOn=!wallOn;this.classList.toggle('on',wallOn);this.setAttribute('aria-pressed',wallOn)};
}
function mv(p){var d=Math.hypot(p.x,p.y);if(d>RMAX){p.x*=RMAX/d;p.y*=RMAX/d}src.x=p.x;src.y=p.y}

function ensureChain(){var ctx=WK.ctx();if(!ctx||chain)return;
  var g=ctx.createGain(),lp=ctx.createBiquadFilter(),pn=ctx.createStereoPanner(),inp=ctx.createGain();lp.type='lowpass';lp.Q.value=.7;inp.connect(lp);lp.connect(g);g.connect(pn);pn.connect(WK.master());chain={in:inp,g:g,lp:lp,pn:pn}}
function apply(){if(!chain)return;var ctx=WK.ctx(),m=geom(),t=ctx.currentTime;chain.g.gain.setTargetAtTime(Math.pow(10,m.gdb/20)*1.5,t,.05);chain.lp.frequency.setTargetAtTime(m.cut,t,.05);chain.pn.pan.setTargetAtTime(m.pan,t,.05)}
function call(){var ctx=WK.ctx(),t=ctx.currentTime+.02,d=chain.in;
  WK.tone(d,t,{f:2900,f2:2400,dur:.12,gain:.28,type:'triangle'});WK.tone(d,t+.17,{f:3300,f2:2800,dur:.11,gain:.24,type:'triangle'});
  WK.noise(d,t,{dur:.25,type:'highpass',f:3500,gain:.12});WK.tone(d,t+.05,{f:140,f2:90,dur:.3,gain:.2})}

function draw(){
  if(!cv)return;var col=WKM.col,W0=cv.clientWidth||600,H=Math.round(clamp(W0*.62,300,460)),s=WKM.fit(cv,H),c=s.c,w=s.w,h=s.h,m=geom();
  var cx=w/2,cy=h/2,sc=Math.min(w,h)/2-18,X=function(x){return cx+x/RMAX*sc},Y=function(y){return cy-y/RMAX*sc};
  c.clearRect(0,0,w,h);
  /* anéis de distância */
  [5,10,20,30].forEach(function(r){c.beginPath();c.arc(cx,cy,r/RMAX*sc,0,6.3);c.strokeStyle=col('--line');c.lineWidth=1;c.stroke();WKM.text(c,r+' m',cx+4,cy-r/RMAX*sc+12,col('--muted'),'left',10)});
  c.strokeStyle=col('--line');c.beginPath();c.moveTo(cx,cy-sc);c.lineTo(cx,cy+sc);c.moveTo(cx-sc,cy);c.lineTo(cx+sc,cy);c.stroke();
  WKM.text(c,'FRENTE',cx,cy-sc-4,col('--muted'),'center',10);WKM.text(c,'ESQ',cx-sc-4,cy+4,col('--muted'),'right',10);WKM.text(c,'DIR',cx+sc+4,cy+4,col('--muted'),'left',10);
  /* parede */
  if(wallOn){c.strokeStyle=col('--teal');c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(X(WALL.x1),Y(WALL.y));c.lineTo(X(WALL.x2),Y(WALL.y));c.stroke();c.lineCap='butt';WKM.text(c,'parede',X(WALL.x2)+14,Y(WALL.y)+4,col('--teal'),'left',11)}
  /* linha de visada */
  c.setLineDash([5,5]);c.strokeStyle=m.occ?col('--red'):col('--amber');c.lineWidth=1.5;c.beginPath();c.moveTo(cx,cy);c.lineTo(X(src.x),Y(src.y));c.stroke();c.setLineDash([]);
  /* ouvinte */
  c.beginPath();c.moveTo(cx,cy-12);c.lineTo(cx-8,cy+8);c.lineTo(cx+8,cy+8);c.closePath();c.fillStyle=col('--fg');c.fill();WKM.text(c,'OUVINTE',cx,cy+24,col('--muted'),'center',10);
  /* fonte */
  var r=9+4*Math.sin(performance.now()/180);c.beginPath();c.arc(X(src.x),Y(src.y),r+6,0,6.3);c.strokeStyle=col('--amber');c.globalAlpha=.4;c.lineWidth=2;c.stroke();c.globalAlpha=1;
  c.beginPath();c.arc(X(src.x),Y(src.y),9,0,6.3);c.fillStyle=col('--amber');c.fill();WKM.text(c,'fonte',X(src.x),Y(src.y)-16,col('--fg'),'center',11);
  /* leitura */
  $('#spRead').textContent=m.d.toFixed(0)+' m · '+m.gdb.toFixed(1)+' dB · filtro '+(m.cut/1000).toFixed(1)+' kHz · pan '+(m.pan>=0?'+':'')+m.pan.toFixed(2)+(m.occ?' · abafado pela parede':'');
  /* gráficos pequenos */
  var s2=WKM.fit(cg,170),g=s2.c,gw=s2.w,gh=170;g.clearRect(0,0,gw,gh);
  var pw=(gw-40)/3,panels=[
   {t:'VOLUME × DISTÂNCIA (dB)',f:function(d){return -20*Math.log10(Math.max(d,1))},xa:[0,RMAX],ya:[-32,3],cur:[m.d,m.gdb+(m.occ?9:0)],occ:m.occ?m.gdb:null,xl:'m'},
   {t:'FILTRO × DISTÂNCIA (kHz)',f:function(d){return clamp(20000*Math.exp(-d/18),1500,20000)/1000},xa:[0,RMAX],ya:[0,21],cur:[m.d,(m.occ?Math.max(m.cut,0):m.cut)/1000],xl:'m'},
   {t:'PAN × ÂNGULO',f:function(a){return Math.sin(a*Math.PI/180)},xa:[-90,90],ya:[-1,1],cur:[Math.atan2(src.x,Math.abs(src.y))*180/Math.PI,m.pan],xl:'°'}];
  panels.forEach(function(p,i){var x0=10+i*(pw+10),y0=22,ph=gh-44,xs=function(v){return x0+pw*(v-p.xa[0])/(p.xa[1]-p.xa[0])},ys=function(v){return y0+ph*(1-(v-p.ya[0])/(p.ya[1]-p.ya[0]))};
    WKM.text(g,p.t,x0,12,col('--muted'),'left',10);
    g.strokeStyle=col('--line');g.lineWidth=1;g.strokeRect(x0,y0,pw,ph);
    g.beginPath();for(var k=0;k<=60;k++){var xv=p.xa[0]+(p.xa[1]-p.xa[0])*k/60,yv=p.f(xv);if(k===0)g.moveTo(xs(xv),ys(yv));else g.lineTo(xs(xv),ys(yv))}g.strokeStyle=col('--amber');g.lineWidth=2.5;g.stroke();
    g.beginPath();g.arc(xs(clamp(p.cur[0],p.xa[0],p.xa[1])),ys(clamp(p.cur[1],p.ya[0],p.ya[1])),5,0,6.3);g.fillStyle=col('--fg');g.fill();
    if(p.occ!=null){g.beginPath();g.arc(xs(m.d),ys(clamp(p.occ,p.ya[0],p.ya[1])),5,0,6.3);g.fillStyle=col('--red');g.fill()}
    WKM.text(g,p.xa[0]+p.xl,x0+2,gh-4,col('--muted'),'left',10);WKM.text(g,p.xa[1]+p.xl,x0+pw,gh-4,col('--muted'),'right',10)});
  /* som */
  if(WK.ctx()&&calling){ensureChain();apply();var now=WK.ctx().currentTime;if(now>=nextCall){call();nextCall=now+.95}}
  else if(chain)apply();
}
WKM.register({id:'espaco',build:build,show:function(){calling=false;var b=$('#spCall');if(b){b.classList.remove('on');b.textContent='Tocar chamado'}draw()},frame:draw,resize:draw});
})();
