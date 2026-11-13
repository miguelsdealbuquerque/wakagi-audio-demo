/* Silêncio como instrumento e contraste de segurança. */
(function(){
'use strict';
var WK=window.WK,WKM=window.WKM,$=WK.$,clamp=WK.clamp,db2=WK.db2;
var st={bg:-20,sil:1.2,cue:-4,playing:false,t0:0};
var FLOOR=-60,LEAD=1.5,CUEDUR=1.1,TAIL=1.5,DOWN=.35;
var cv;
function total(){return LEAD+DOWN+st.sil+CUEDUR+TAIL}
/* nível do fundo ao longo do tempo (dB) */
function bgAt(t){
  var s0=LEAD,s1=s0+DOWN,s2=s1+st.sil,s3=s2+CUEDUR,s4=s3+.5;
  if(t<s0)return st.bg;if(t<s1)return st.bg+(FLOOR-st.bg)*((t-s0)/DOWN);if(t<s2+CUEDUR*0)return FLOOR;
  if(t<s3)return FLOOR;if(t<s4)return FLOOR+(st.bg-FLOOR)*((t-s3)/.5);return st.bg}
function contrast(withSil){var bgAtCue=withSil?(st.sil>.05?FLOOR:st.bg):st.bg;return st.cue-Math.max(bgAtCue,FLOOR)}

function build(el){
  el.innerHTML='<div class="card"><span class="eyebrow">Pilares · Silêncio como instrumento e Contraste de segurança</span><h2>Para a ameaça ser ouvida, o resto precisa abrir espaço</h2>'+
  '<p class="sub">Um aviso não precisa ser mais alto, precisa contrastar com o que vem antes. O silêncio pouco antes do aviso cria o maior contraste possível. '+WKM.tag('proj')+'</p>'+
  '<canvas id="siCv" aria-label="Linha do tempo do fundo e do sinal da ameaça"></canvas>'+
  '<div class="row" style="margin-top:.7rem;align-items:center"><button class="btn primary" id="siPlay">Ouvir</button><span class="hint" style="margin:0" id="siRead"></span></div>'+
  '<div class="sliders" style="margin-top:.8rem">'+WKM.slider('siBg','Volume do fundo',-40,-6,1,st.bg,'dB')+WKM.slider('siSil','Silêncio antes do aviso',0,3,0.1,st.sil,'s')+WKM.slider('siCue','Volume do aviso',-20,0,1,st.cue,'dB')+'</div>'+
  '<p class="hint">'+WKM.tag('ilus')+' Valores para explicar a ideia. O que é do projeto é a regra: o som que confunde a leitura de furtividade deve ser cortado, atenuado ou substituído (ADD, seção 1.1). O silêncio, nesse caso, é uma das formas de atenuar.</p></div>';
  cv=$('#siCv');
  WKM.bindSlider('siBg',function(v){st.bg=v});WKM.bindSlider('siSil',function(v){st.sil=v});WKM.bindSlider('siCue',function(v){st.cue=v});
  $('#siPlay').onclick=play;
}
function draw(){
  if(!cv)return;var col=WKM.col,s=WKM.fit(cv,260),c=s.c,w=s.w,h=s.h,L=40,R=12,T=22,B=26,pw=w-L-R,ph=h-T-B,tt=total();
  c.clearRect(0,0,w,h);
  var xs=function(t){return L+pw*t/tt},ys=function(d){return T+ph*(0-d)/(0-(-66))};
  c.strokeStyle=col('--line');c.lineWidth=1;[0,-20,-40,-60].forEach(function(d){c.beginPath();c.moveTo(L,ys(d));c.lineTo(L+pw,ys(d));c.stroke();WKM.text(c,d+'',L-6,ys(d)+4,col('--muted'),'right',11)});
  WKM.text(c,'dB',L-6,T-8,col('--muted'),'right',11);
  /* fundo */
  c.beginPath();for(var i=0;i<=200;i++){var t=tt*i/200,d=bgAt(t);if(i===0)c.moveTo(xs(t),ys(d));else c.lineTo(xs(t),ys(d))}
  c.strokeStyle=col('--teal');c.lineWidth=3;c.stroke();c.lineTo(xs(tt),ys(-66));c.lineTo(xs(0),ys(-66));c.closePath();c.fillStyle='rgba(154,165,171,.14)';c.fill();
  WKM.text(c,'fundo (ambiência e trilha)',xs(.1),ys(st.bg)-8,col('--teal'),'left',11);
  /* silêncio */
  var s1=LEAD+DOWN,s2=s1+st.sil;if(st.sil>.05){c.fillStyle='rgba(247,41,61,.10)';c.fillRect(xs(s1),T,xs(s2)-xs(s1),ph);WKM.text(c,'silêncio '+st.sil.toFixed(1)+' s',(xs(s1)+xs(s2))/2,T+14,col('--amber'),'center',11)}
  /* aviso */
  var cs=s2,ce=cs+CUEDUR;c.fillStyle=col('--amber');WKM.roundRect(c,xs(cs),ys(st.cue),xs(ce)-xs(cs),ys(-66)-ys(st.cue),4);c.fill();
  WKM.text(c,'aviso da ameaça',(xs(cs)+xs(ce))/2,ys(st.cue)-8,col('--amber'),'center',11);
  /* medida de contraste */
  var bgb=st.sil>.05?FLOOR:st.bg;c.strokeStyle=col('--fg');c.lineWidth=1.5;var cx=xs(cs)-6;c.beginPath();c.moveTo(cx,ys(st.cue));c.lineTo(cx,ys(bgb));c.stroke();
  c.beginPath();c.moveTo(cx-4,ys(st.cue));c.lineTo(cx+4,ys(st.cue));c.moveTo(cx-4,ys(bgb));c.lineTo(cx+4,ys(bgb));c.stroke();
  WKM.text(c,'contraste '+(st.cue-Math.max(bgb,FLOOR)).toFixed(0)+' dB',cx-8,(ys(st.cue)+ys(bgb))/2,col('--fg'),'right',11);
  for(var t2=0;t2<=Math.floor(tt);t2++)WKM.text(c,t2+' s',xs(t2),h-8,col('--muted'),'center',11);
  if(st.playing){var ph2=(performance.now()-st.t0)/1000;if(ph2>tt+.2){st.playing=false;$('#siPlay').textContent='Ouvir'}else{c.strokeStyle=col('--fg');c.lineWidth=1.5;c.beginPath();c.moveTo(xs(ph2),T);c.lineTo(xs(ph2),T+ph);c.stroke()}}
  var cWith=contrast(true),cNo=contrast(false);
  $('#siRead').textContent='Contraste sem silêncio '+cNo.toFixed(0)+' dB, com silêncio '+cWith.toFixed(0)+' dB (o piso é −60 dB).';
}
function play(){
  if(!WK.need())return;var ctx=WK.ctx(),t0=ctx.currentTime+.1,tt=total(),master=WK.master();
  st.t0=performance.now()+100;st.playing=true;$('#siPlay').textContent='Tocando';
  /* fundo: vento + grilos + pad */
  var nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),nd=nb.getChannelData(0);for(var i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
  var bg=ctx.createGain();bg.connect(master);
  var ns=ctx.createBufferSource();ns.buffer=nb;ns.loop=true;var bf=ctx.createBiquadFilter();bf.type='bandpass';bf.frequency.value=600;bf.Q.value=.6;var ng=ctx.createGain();ng.gain.value=.7;ns.connect(bf);bf.connect(ng);ng.connect(bg);ns.start(t0);ns.stop(t0+tt);
  [45,52,57].forEach(function(n){var o=ctx.createOscillator();o.type='triangle';o.frequency.value=WK.mf(n);var g=ctx.createGain();g.gain.value=.25;o.connect(g);g.connect(bg);o.start(t0);o.stop(t0+tt)});
  for(var k=0;k<14;k++)WK.tone(bg,t0+k*.55,{f:4300,dur:.03,gain:.18,type:'square'});
  /* automação: nível do fundo em dB com piso */
  var steps=120;for(var j=0;j<=steps;j++){var t=tt*j/steps,d=bgAt(t),v=d<=FLOOR?0:db2(d);bg.gain.linearRampToValueAtTime(v,t0+t)}
  /* aviso */
  var tc=t0+LEAD+DOWN+st.sil,cg=ctx.createGain();cg.gain.value=db2(st.cue);cg.connect(master);
  var o2=ctx.createOscillator();o2.type='sawtooth';o2.frequency.setValueAtTime(70,tc);o2.frequency.linearRampToValueAtTime(46,tc+CUEDUR);var f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=420;var g2=ctx.createGain();
  g2.gain.setValueAtTime(.0001,tc);g2.gain.linearRampToValueAtTime(1,tc+.1);g2.gain.setValueAtTime(1,tc+CUEDUR-.3);g2.gain.exponentialRampToValueAtTime(.0001,tc+CUEDUR);
  var am=ctx.createOscillator(),ag=ctx.createGain();am.frequency.value=26;ag.gain.value=.25;am.connect(ag);ag.connect(g2.gain);
  o2.connect(f);f.connect(g2);g2.connect(cg);o2.start(tc);am.start(tc);o2.stop(tc+CUEDUR+.05);am.stop(tc+CUEDUR+.05);
}
WKM.register({id:'silencio',build:build,show:draw,frame:draw,resize:draw});
})();
