/* Parâmetros como curvas e snapshots como "antes e depois". */
(function(){
'use strict';
var WK=window.WK,WKM=window.WKM,$=WK.$,clamp=WK.clamp,PRM=WK.PRM;
var cvP,cvS;
var CARDS=[
 {t:'VentoIntensidade',k:'Vento',x:[0,1],cur:function(){return PRM.Vento},xl:'0 a 1',
  lines:[{n:'volume do vento',f:function(v){return .02+.5*Math.pow(v,1.5)},r:[0,.55],u:function(y){return y.toFixed(2)},c:'--teal'},
         {n:'brilho do vento (filtro)',f:function(v){return 280+900*v},r:[250,1200],u:function(y){return Math.round(y)+' Hz'},c:'--amber'}]},
 {t:'Tensao',k:'Tensao',x:[0,1],cur:function(){return PRM.Tensao},xl:'0 a 1',
  lines:[{n:'drone grave de tensão',f:function(v){return .16*v},r:[0,.17],u:function(y){return y.toFixed(2)},c:'--teal'},
         {n:'batimento cardíaco',f:function(v){return 62+48*v},r:[55,115],u:function(y){return Math.round(y)+' BPM'},c:'--amber'}]},
 {t:'FaunaAlerta',k:'Alerta',x:[0,1],cur:function(){return PRM.Alerta},xl:'0 a 1',
  lines:[{n:'força do rosnado',f:function(v){return .4+.6*v},r:[.3,1.05],u:function(y){return y.toFixed(2)},c:'--teal'},
         {n:'rosnados por minuto (aprox.)',f:function(v){return 60000/(5500-4000*v)},r:[8,43],u:function(y){return Math.round(y)+'/min'},c:'--amber'}]}];
var SN=[['MUSIC','MUSIC'],['AMB','AMB'],['FOOT','SFX_FOOTSTEPS'],['FAUNA_CLOSE','SFX_FAUNA_CLOSE'],['FAUNA_DIST','SFX_FAUNA_DISTANT'],['LEGENDS','SFX_LEGENDS'],['CRITICAL','CRITICAL']];

function build(el){
  el.innerHTML='<div class="card"><span class="eyebrow">Conceito · 8 parâmetros no projeto</span><h2>Parâmetro é um botão que o jogo gira</h2>'+
  '<p class="sub">A Godot envia números ao FMOD em tempo real, e cada número controla o som por uma curva. Mexa nos sliders do fim da página e veja o ponto andar pela curva. '+WKM.tag('ilus')+'</p>'+
  '<canvas id="pmCv" aria-label="Curvas dos parâmetros"></canvas>'+
  '<p class="hint">As curvas são as do site. No FMOD, cada parâmetro age no evento por uma curva editável no projeto, e o desenho dela é uma decisão de design registrada no ADD.</p></div>'+
  '<div class="card"><span class="eyebrow">Conceito · 6 snapshots no projeto</span><h2>Snapshot é uma foto da mixagem</h2>'+
  '<p class="sub">Um snapshot guarda um conjunto de deslocamentos em dB e aplica tudo de uma vez, com transição suave. Compare a mesma mixagem em três momentos.</p>'+
  '<div class="row" style="margin-bottom:.7rem"><button class="btn" id="pmL" aria-pressed="false">Ouvir Modo Escuta</button><button class="btn warn" id="pmG" aria-pressed="false">Ouvir Legend_BichoDoMato</button></div>'+
  '<canvas id="pmSn" aria-label="Barras de dB por barramento em três momentos"></canvas>'+
  '<p class="hint">'+WKM.tag('proj')+' Modo Escuta conforme o projeto no FMOD (cama −8 dB com corte de agudos em 2 kHz, mid −6 dB, fauna distante −4 dB, passos −12 dB com passa-baixa em 1,5 kHz, fauna próxima +3 dB, com EQ de +4 dB em 3 kHz). Aqui a ambiência é um só fader e usa o valor da cama. '+WKM.tag('proj')+' Legend_BichoDoMato, valores do projeto no FMOD (música em −62 dB, ambiência em −10 dB, fauna distante em −12 dB). É o mesmo snapshot do Mixer da primeira aba.</p></div>';
  cvP=$('#pmCv');cvS=$('#pmSn');
  $('#pmL').onclick=function(){if(!WK.need())return;WK.setSnap('listen',!WK.snapOn.listen)};
  $('#pmG').onclick=function(){if(!WK.need())return;WK.setSnap('legend',!WK.snapOn.legend)};
}

function plotCard(c,x0,y0,w,h,card){
  var col=WKM.col;
  WKM.text(c,card.t,x0,y0+10,col('--fg'),'left',12);
  var px=x0+8,py=y0+26,pw=w-16,ph=h-60,xs=function(v){return px+pw*(v-card.x[0])/(card.x[1]-card.x[0])};
  c.strokeStyle=col('--line');c.lineWidth=1;c.strokeRect(px,py,pw,ph);
  var cur=card.cur();
  card.lines.forEach(function(L,i){
    var ys=function(v){return py+ph*(1-(v-L.r[0])/(L.r[1]-L.r[0]))};
    c.beginPath();for(var k=0;k<=50;k++){var v=card.x[0]+(card.x[1]-card.x[0])*k/50,y=L.f(v);if(k===0)c.moveTo(xs(v),ys(y));else c.lineTo(xs(v),ys(y))}c.strokeStyle=col(L.c);c.lineWidth=2.5;c.stroke();
    c.beginPath();c.arc(xs(cur),ys(L.f(cur)),5,0,6.3);c.fillStyle=col(L.c);c.fill();
    WKM.text(c,L.n+': '+L.u(L.f(cur)),px,py+ph+16+i*14,col(L.c),'left',10)});
  c.strokeStyle=col('--muted');c.setLineDash([3,4]);c.beginPath();c.moveTo(xs(cur),py);c.lineTo(xs(cur),py+ph);c.stroke();c.setLineDash([]);
}
function plotHora(c,x0,y0,w,h){
  var col=WKM.col;WKM.text(c,'HoraDoDia',x0,y0+10,col('--fg'),'left',12);
  var px=x0+8,py=y0+26,pw=w-16,ph=h-60,xs=function(v){return px+pw*v/24};
  c.strokeStyle=col('--line');c.strokeRect(px,py,pw,ph);
  c.fillStyle='rgba(154,165,171,.18)';c.fillRect(xs(6),py,xs(18)-xs(6),ph);
  WKM.text(c,'aves, de dia',xs(12),py+ph/2,col('--teal'),'center',11);WKM.text(c,'grilos',xs(3),py+ph/2,col('--amber'),'center',11);WKM.text(c,'grilos',xs(21),py+ph/2,col('--amber'),'center',11);
  [0,6,12,18,24].forEach(function(t){WKM.text(c,t+'h',xs(t),py+ph+12,col('--muted'),'center',10)});
  c.strokeStyle=col('--fg');c.lineWidth=2;c.beginPath();c.moveTo(xs(PRM.Hora),py);c.lineTo(xs(PRM.Hora),py+ph);c.stroke();
  var day=PRM.Hora>=6&&PRM.Hora<18;WKM.text(c,'agora: '+(day?'aves':'grilos'),px,py+ph+30,col('--fg'),'left',10)}
function plotPostura(c,x0,y0,w,h){
  var col=WKM.col;WKM.text(c,'Postura',x0,y0+10,col('--fg'),'left',12);
  var P=[['Agachado',.35,900],['Andando',.7,560],['Correndo',1,300]],px=x0+8,py=y0+26,pw=w-16,ph=h-60,bw=pw/3;
  P.forEach(function(p,i){var sel=PRM.Postura===p[0],bh=ph*p[1];c.fillStyle=sel?col('--amber'):col('--panel2');c.fillRect(px+i*bw+8,py+ph-bh,bw-16,bh);c.strokeStyle=col('--line');c.strokeRect(px+i*bw+8,py+ph-bh,bw-16,bh);
    WKM.text(c,p[0],px+i*bw+bw/2,py+ph+12,col(sel?'--amber':'--muted'),'center',10);WKM.text(c,p[2]+' ms',px+i*bw+bw/2,py+ph+26,col('--muted'),'center',10)});
  WKM.text(c,'altura = volume do passo · tempo entre passos',px,py-4,col('--muted'),'left',9)}

function drawP(){
  var col=WKM.col,W0=cvP.clientWidth||700,cols=W0>780?3:(W0>480?2:1),cardH=190,rows=Math.ceil(5/cols),s=WKM.fit(cvP,rows*cardH+6),c=s.c,w=s.w,cw=w/cols;c.clearRect(0,0,w,s.h);
  var draws=[function(x,y){plotCard(c,x,y,cw-10,cardH,CARDS[0])},function(x,y){plotCard(c,x,y,cw-10,cardH,CARDS[1])},function(x,y){plotCard(c,x,y,cw-10,cardH,CARDS[2])},function(x,y){plotHora(c,x,y,cw-10,cardH)},function(x,y){plotPostura(c,x,y,cw-10,cardH)}];
  draws.forEach(function(f,i){f((i%cols)*cw,Math.floor(i/cols)*cardH+2)});
}
function drawS(){
  var col=WKM.col,W0=cvS.clientWidth||700,rowH=34,s=WKM.fit(cvS,28+rowH*SN.length+8),c=s.c,w=s.w,h=s.h;c.clearRect(0,0,w,h);
  var lab=Math.min(170,w*.3),cw=(w-lab-8)/3,lo=-64,hi=20,heads=[['Normal',null],['Modo Escuta','listen'],['Legend_BichoDoMato','legend']];
  heads.forEach(function(hd,i){var x=lab+i*cw;var on=hd[1]&&WK.snapOn[hd[1]]||(!hd[1]&&!WK.snapOn.listen&&!WK.snapOn.legend);
    if(on){c.fillStyle='rgba(247,41,61,.10)';c.fillRect(x+2,0,cw-4,h);c.strokeStyle=col('--amber');c.lineWidth=1.5;c.strokeRect(x+2,1,cw-4,h-2)}
    WKM.text(c,hd[0]+(on?' · ativo':''),x+cw/2,16,col(on?'--amber':'--muted'),'center',11)});
  SN.forEach(function(b,r){var y=28+r*rowH;WKM.text(c,b[1],4,y+rowH/2+4,col('--fg'),'left',11);
    heads.forEach(function(hd,i){var x=lab+i*cw+8,bw=cw-16,zx=x+bw*(0-lo)/(hi-lo),v=hd[1]?(WK.SNAP[hd[1]][b[0]]||0):0;
      c.fillStyle=col('--panel2');c.fillRect(x,y+8,bw,rowH-16);
      var vx=x+bw*(v-lo)/(hi-lo);c.fillStyle=v<0?'rgba(247,41,61,.85)':(v>0?col('--teal'):col('--line'));c.fillRect(Math.min(zx,vx),y+8,Math.max(2,Math.abs(vx-zx)),rowH-16);
      c.strokeStyle=col('--fg');c.lineWidth=1;c.beginPath();c.moveTo(zx,y+4);c.lineTo(zx,y+rowH-4);c.stroke();
      WKM.text(c,v===0?'0':(v>0?'+':'−')+Math.abs(v)+' dB',x+bw-3,y+rowH/2+4,col('--fg'),'right',10)})});
  $('#pmL').classList.toggle('on',WK.snapOn.listen);$('#pmG').classList.toggle('on',WK.snapOn.legend);
}
function draw(){if(!cvP)return;drawP();drawS()}
WKM.register({id:'parametros',build:build,show:draw,frame:draw,resize:draw});
})();
