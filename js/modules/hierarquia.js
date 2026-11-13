/* Hierarquia de barramentos: do som ao Master, com medidores ao vivo. */
(function(){
'use strict';
var WK=window.WK,WKM=window.WKM,$=WK.$,$$=WK.$$,clamp=WK.clamp;
var cv,sel='SFX_LEGENDS',lit={};
/* colunas: fontes, barramentos filhos, grupos, master */
var SRC=[
 {id:'musica',nm:'Música',bus:'MUSIC',live:'MUSIC'},
 {id:'vento',nm:'Ambiência',bus:'AMB',live:'AMB'},
 {id:'passos',nm:'Passos',bus:'SFX_FOOTSTEPS',live:'FOOT',play:function(){WK.playStep()}},
 {id:'fauna',nm:'Fauna próxima',bus:'SFX_FAUNA_CLOSE',live:'FAUNA_CLOSE',play:function(){WK.growl('onca')}},
 {id:'ave',nm:'Fauna distante',bus:'SFX_FAUNA_DISTANT',live:'FAUNA_DIST',play:function(){WK.ave()}},
 {id:'lenda',nm:'Lenda',bus:'SFX_LEGENDS',live:'LEGENDS',play:function(){WK.garrafa()}},
 {id:'coracao',nm:'Batimento',bus:'CRITICAL',live:'CRITICAL',play:function(){var c=WK.ctx();WK.heartbeat(c.currentTime+.02)}}];
var LEAF=[
 {id:'SFX_FOOTSTEPS',live:'FOOT',grp:'SFX'},{id:'SFX_FAUNA_CLOSE',live:'FAUNA_CLOSE',grp:'SFX'},{id:'SFX_FAUNA_DISTANT',live:'FAUNA_DIST',grp:'SFX'},
 {id:'SFX_LEGENDS',live:'LEGENDS',grp:'SFX'},{id:'SFX_WORLD',live:null,grp:'SFX'}];
var GRP=[{id:'MUSIC'},{id:'SFX'},{id:'AMB'},{id:'VO'},{id:'UI'},{id:'CRITICAL'}];
var INFO={
 MASTER:['MASTER','Soma final. Todo som passa por pelo menos um grupo antes de chegar aqui.','proj'],
 MUSIC:['MUSIC','Trilha e anti-música. É o primeiro a ceder quando uma lenda entra (snapshot Legend_BichoDoMato, música do bioma em −62 dB).','proj'],
 SFX:['SFX','Grupo dos efeitos. Reúne passos, fauna, lendas e sons do mundo.','proj'],
 AMB:['AMB','Ambiência contínua do bioma, como vento, grilos e aves.','proj'],
 VO:['VO','Voz e diálogos. A dublagem está apenas especificada, com 38 falas catalogadas.','proj'],
 UI:['UI','Interface e menus.','proj'],
 CRITICAL:['CRITICAL','Sons que nunca são mascarados. É onde ficam as informações que o jogador não pode perder.','proj'],
 SFX_FOOTSTEPS:['SFX_FOOTSTEPS','Passos do jogador. Substituiu o antigo SFX_PLAYER_FOLEY em uma revisão do ADD.','proj'],
 SFX_FAUNA_CLOSE:['SFX_FAUNA_CLOSE','Fauna próxima. É o que o Modo Escuta destaca (no ListenMode ganha +3 dB e um EQ de +4 dB em 3 kHz).','proj'],
 SFX_FAUNA_DISTANT:['SFX_FAUNA_DISTANT','Fauna distante. É abafada pelo snapshot da lenda (−12 dB, valor do projeto).','proj'],
 SFX_LEGENDS:['SFX_LEGENDS','Lendas. Tem prioridade máxima, e é por aqui que a assinatura sonora da lenda aparece.','proj'],
 SFX_WORLD:['SFX_WORLD','Sons do mundo. Entrou no ADD em uma das cinco revisões vindas da implementação.','proj']};
var pos={};

function build(el){
  el.innerHTML='<div class="card"><span class="eyebrow">Conceito</span><h2>Todo som passa por um barramento</h2>'+
  '<p class="sub">Um barramento (bus) é um grupo de sons que se mixa junto. Dispare um som e veja o caminho até o Master. Clique em um nó para ler o que ele faz.</p>'+
  '<canvas id="hiCv" aria-label="Diagrama da hierarquia de barramentos"></canvas>'+
  '<div class="row" style="margin-top:.7rem"><button class="btn" id="hiP1">Passo</button><button class="btn" id="hiP2">Fauna próxima</button><button class="btn" id="hiP3">Fauna distante</button><button class="btn" id="hiP4">Lenda</button><button class="btn" id="hiP5">Batimento</button></div>'+
  '<div class="info" id="hiInfo"></div>'+
  '<p class="hint">'+WKM.tag('proj')+' A hierarquia mostra os grupos principais do ADD. O projeto do FMOD tem 28 barramentos no total, conferidos por auditoria. Os medidores só se movem com o som ligado.</p></div>';
  cv=$('#hiCv');
  var fx=[['hiP1',2],['hiP2',3],['hiP3',4],['hiP4',5],['hiP5',6]];
  fx.forEach(function(a){$('#'+a[0]).onclick=function(){if(!WK.need())return;SRC[a[1]].play()}});
  cv.addEventListener('pointerdown',function(e){var r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    var hit=null;Object.keys(pos).forEach(function(k){var p=pos[k];if(x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=p.y+p.h)hit=k});if(hit&&INFO[hit]){sel=hit;info()}});
  info();
}
function info(){var i=INFO[sel];$('#hiInfo').innerHTML='<b>'+i[0]+'</b> '+WKM.tag(i[2])+'<br>'+i[1]}
function lvl(live){if(!live||!WK.ctx())return 0;var an=WK.busAn()[live];if(!an)return 0;var d=new Float32Array(512);an.getFloatTimeDomainData(d);var r=0;for(var i=0;i<512;i++)r+=d[i]*d[i];r=Math.sqrt(r/512);return clamp((20*Math.log10(r+1e-6)+60)/60,0,1)}

function draw(){
  if(!cv)return;var col=WKM.col,W0=cv.clientWidth||600,H=Math.max(380,Math.round(W0*.52));var s=WKM.fit(cv,H),c=s.c,w=s.w,h=s.h;
  c.clearRect(0,0,w,h);var nodeH=Math.min(34,(h-30)/8),mx=10;
  var colx=[mx,w*.27,w*.54,w*.8],cw=[w*.19,w*.19,w*.17,w*.17];
  var gp=(h-24)/10,ySlot=function(i){return 12+gp*i+(gp-nodeH)/2};
  var sSlot={musica:0,vento:1,passos:2,fauna:3,ave:4,lenda:5,coracao:7},gSlot={MUSIC:0,AMB:1,SFX:4,CRITICAL:7,VO:8,UI:9};
  pos={};
  var levels={};SRC.forEach(function(s){levels[s.bus]=lvl(s.live)});
  /* níveis dos grupos: o maior filho */
  var sfx=Math.max(levels.SFX_FOOTSTEPS||0,levels.SFX_FAUNA_CLOSE||0,levels.SFX_FAUNA_DISTANT||0,levels.SFX_LEGENDS||0);
  var gl={MUSIC:levels.MUSIC||0,SFX:sfx,AMB:levels.AMB||0,VO:0,UI:0,CRITICAL:levels.CRITICAL||0};
  var master=Math.max(gl.MUSIC,gl.SFX,gl.AMB,gl.CRITICAL);
  /* posições */
  SRC.forEach(function(s){pos['src_'+s.id]={x:colx[0],y:ySlot(sSlot[s.id]),w:cw[0],h:nodeH}});
  LEAF.forEach(function(l,i){pos[l.id]={x:colx[1],y:ySlot(2+i),w:cw[1],h:nodeH}});
  GRP.forEach(function(g){pos[g.id]={x:colx[2],y:ySlot(gSlot[g.id]),w:cw[2],h:nodeH}});
  pos.MASTER={x:colx[3],y:ySlot(4.5)-nodeH/2,w:cw[3],h:nodeH*2};
  var ctr=function(k,side){var p=pos[k];return {x:side==='r'?p.x+p.w:p.x,y:p.y+p.h/2}};
  var link=function(a,b,amount,on){var A=ctr(a,'r'),B=ctr(b,'l');c.beginPath();c.moveTo(A.x,A.y);c.bezierCurveTo((A.x+B.x)/2,A.y,(A.x+B.x)/2,B.y,B.x,B.y);
    c.strokeStyle=on?col('--amber'):col('--line');c.globalAlpha=on?.35+.65*amount:1;c.lineWidth=on?2+3*amount:1.5;c.stroke();c.globalAlpha=1};
  /* ligações */
  SRC.forEach(function(s){var isLeaf=LEAF.some(function(l){return l.id===s.bus});var tgt=isLeaf?s.bus:s.bus,a=levels[s.bus]||0;link('src_'+s.id,tgt,a,a>.04)});
  LEAF.forEach(function(l){var a=levels[l.id]||0;link(l.id,l.grp,a,a>.04)});
  GRP.forEach(function(g){var a=gl[g.id];link(g.id,'MASTER',a,a>.04)});
  /* nós */
  var node=function(k,label,a,kind,sub){var p=pos[k],sl=sel===k;c.fillStyle=sl?'#2B1114':col('--panel2');WKM.roundRect(c,p.x,p.y,p.w,p.h,8);c.fill();
    c.strokeStyle=sl?col('--amber'):col('--line');c.lineWidth=sl?2:1;c.stroke();
    if(a>0){c.fillStyle='rgba(247,41,61,.55)';WKM.roundRect(c,p.x+2,p.y+p.h-6,(p.w-4)*a,4,2);c.fill()}
    WKM.text(c,label,p.x+8,p.y+(sub?p.h/2-1:p.h/2+4),col('--fg'),'left',11);if(sub)WKM.text(c,sub,p.x+8,p.y+p.h/2+11,col('--muted'),'left',10)};
  SRC.forEach(function(s){node('src_'+s.id,s.nm,levels[s.bus]||0)});
  LEAF.forEach(function(l){node(l.id,l.id,levels[l.id]||0)});
  GRP.forEach(function(g){node(g.id,g.id,gl[g.id],null,g.id==='VO'?'só especificado':(g.id==='CRITICAL'?'nunca mascarado':''))});
  node('MASTER','MASTER',master);
  ['FONTES','BARRAMENTOS','GRUPOS','SAÍDA'].forEach(function(t,i){WKM.text(c,t,colx[i]+cw[i]/2,8,col('--muted'),'center',10)});
  /* cliques nas fontes selecionam o barramento de destino */
  SRC.forEach(function(s){pos['src_'+s.id].alias=s.bus});
}
/* clique em fonte seleciona seu barramento */
var _info=info;
WKM.register({id:'hierarquia',build:build,show:draw,frame:draw,resize:draw});
var el=document.getElementById('hiCv');
document.addEventListener('pointerdown',function(e){if(e.target!==document.getElementById('hiCv'))return;var r=e.target.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
  Object.keys(pos).forEach(function(k){var p=pos[k];if(k.indexOf('src_')===0&&x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=p.y+p.h){sel=p.alias;_info()}})});
})();
