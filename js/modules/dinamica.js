/* Dinâmica: ducking (side-chain), compressor e limiter com gráficos e som. */
(function(){
'use strict';
var WK=window.WK,WKM=window.WKM,$=WK.$,$$=WK.$$,clamp=WK.clamp,db2=WK.db2;
var st={mode:'duck',R:12,A:60,Rel:600,T:-18,ratio:4,knee:6,ceil:-6,ab:true,t0:0,playing:false,dur:6};
var DUR={duck:6,comp:4,lim:4};
var cvW,cvT;

/* computador de ganho estático, com joelho suave (dB) */
function gc(x,T,R,K){var d=x-T;if(2*d<-K)return x;if(K>0&&2*Math.abs(d)<=K)return x+(1/R-1)*Math.pow(d+K/2,2)/(2*K);return T+d/R}

/* sinal de teste: ambiência baixa, três passos, um rosnado alto */
function env(t){var a=0.03+0.008*Math.sin(t*9);
  [0.4,1.0,1.6].forEach(function(s){var d=t-s;if(d>=0)a+=0.22*Math.exp(-d*14)});
  if(t>=2.3&&t<3.7){var d=t-2.3;a+=0.9*Math.min(1,d/0.08)*Math.exp(-Math.max(0,d-0.9)*8)}
  return a}
function params(){return st.mode==='lim'?{T:st.ceil,R:40,K:0,at:.001,rel:.12}:{T:st.T,R:st.ratio,K:st.knee,at:.005,rel:.25}}
/* curva de ganho no tempo (200 pontos por segundo), com ataque e liberação */
function gainCurve(){var p=params(),n=DUR.comp*200,out=new Float32Array(n),g=1,dt=1/200;
  for(var i=0;i<n;i++){var e=env(i*dt),xin=20*Math.log10(e+1e-6),yo=gc(xin,p.T,p.R,p.K),tgt=Math.pow(10,(yo-xin)/20);
    var tau=tgt<g?p.at:p.rel;g+=(tgt-g)*(1-Math.exp(-dt/tau));out[i]=g}
  return out}
/* ducking: queda em dB no tempo */
var TRIG=[1.5,3.5];
function duckCurve(){var n=300,out=[],g=0,dt=st.dur/n;
  for(var i=0;i<n;i++){var t=i*dt,on=t>=TRIG[0]&&t<TRIG[1],tgt=on?-st.R:0,tau=(tgt<g?st.A:st.Rel)/3000;g+=(tgt-g)*(1-Math.exp(-dt/tau));out.push(g)}
  return out}

function build(el){
  el.innerHTML=
  '<div class="card"><span class="eyebrow">Conceito</span><h2>Dinâmica, o volume que se ajusta sozinho</h2>'+
  '<p class="sub">Três ferramentas que mexem no volume de acordo com o próprio som. Cada uma com o seu gráfico, o seu som e um exemplo do jogo.</p>'+
  WKM.seg('dynMode',[['duck','Ducking'],['comp','Compressor'],['lim','Limiter']],'duck')+'</div>'+
  '<div class="cols"><div class="card"><canvas id="dynW" aria-label="Gráfico do volume no tempo"></canvas>'+
  '<div class="row" style="margin-top:.7rem;align-items:center"><button class="btn primary" id="dynPlay">Ouvir</button>'+
  '<div class="seg" id="dynAB"><button data-v="1" class="on" id="dynOn">Com o efeito</button><button data-v="0" id="dynOff">Sem o efeito</button></div>'+
  '<span class="hint" style="margin:0" id="dynInfo"></span></div>'+
  '<canvas id="dynT" aria-label="Curva de entrada e saída" style="margin-top:.8rem"></canvas></div>'+
  '<div class="card" id="dynSide"></div></div>';
  cvW=$('#dynW');cvT=$('#dynT');
  WKM.bindSeg('dynMode',function(v){st.mode=v;st.dur=DUR[v];side();draw()});
  WKM.bindSeg('dynAB',function(v){st.ab=v==='1'});
  $('#dynPlay').onclick=play;
  side();
}
function side(){
  var m=st.mode,h='';
  if(m==='duck'){
    h='<h2>Ducking por side-chain</h2><p class="sub">Um som, o gatilho, abaixa outro automaticamente. A lenda aparece e a trilha cede lugar. Quando a lenda acaba, a trilha volta.</p>'+
    '<div class="sliders1">'+WKM.slider('dR','Quanto abaixa',3,30,1,st.R,'dB')+WKM.slider('dA','Ataque, o quão rápido desce',10,500,10,st.A,'ms')+WKM.slider('dRel','Liberação, o quão rápido volta',100,2000,50,st.Rel,'ms')+'</div>'+
    '<p class="hint">'+WKM.tag('proj')+' O ADD especifica o ducking por side-chain. No projeto do FMOD, hoje, o efeito é aplicado por snapshots (aba Parâmetros e snapshots).</p>'+
    '<p class="hint">No jogo, é o que impede a música de esconder a lenda. É a regra inviolável em ação.</p>';
  }else if(m==='comp'){
    h='<h2>Compressor, que espreme</h2><p class="sub">Abaixo do limiar nada muda. Acima dele, a cada R dB que entram, só 1 dB sai. O rosnado alto é espremido e os passos baixos continuam iguais.</p>'+
    '<div class="sliders1">'+WKM.slider('cT','Limiar (threshold)',-40,0,1,st.T,'dB')+WKM.slider('cR','Razão (ratio)',1,20,0.5,st.ratio,': 1')+WKM.slider('cK','Joelho (knee)',0,20,1,st.knee,'dB')+'</div>'+
    '<p class="hint">'+WKM.tag('apoio')+' Conceito de apoio, para entender a mixagem. Não é um item específico do ADD.</p>'+
    '<p class="hint">No jogo, serve para domar o rosnado da onça sem apagar os passos do jogador.</p>';
  }else{
    h='<h2>Limiter, o teto</h2><p class="sub">Nada passa do teto. É um compressor com razão altíssima e ataque rápido. Pense em um rolo que alisa só os picos, sem mexer no resto.</p>'+
    '<div class="sliders1">'+WKM.slider('lC','Teto (ceiling)',-24,0,1,st.ceil,'dB')+'</div>'+
    '<p class="hint">'+WKM.tag('apoio')+' Conceito de apoio. Aqui o teto está bem baixo de propósito, para o efeito aparecer.</p>'+
    '<p class="hint">No jogo, protege o jogador de picos quando muitos sons disparam juntos.</p>';
  }
  $('#dynSide').innerHTML=h;
  if(m==='duck'){WKM.bindSlider('dR',function(v){st.R=v});WKM.bindSlider('dA',function(v){st.A=v});WKM.bindSlider('dRel',function(v){st.Rel=v})}
  if(m==='comp'){WKM.bindSlider('cT',function(v){st.T=v});WKM.bindSlider('cR',function(v){st.ratio=v});WKM.bindSlider('cK',function(v){st.knee=v})}
  if(m==='lim'){WKM.bindSlider('lC',function(v){st.ceil=v})}
  cvT.style.display=m==='duck'?'none':'block';
  $('#dynOn').textContent='Com o efeito';
}

function draw(){
  if(!cvW)return;var col=WKM.col,s=WKM.fit(cvW,st.mode==='duck'?300:230),c=s.c,w=s.w,h=s.h;
  c.clearRect(0,0,w,h);
  if(st.mode==='duck')drawDuck(c,w,h);else drawComp(c,w,h);
  if(st.mode!=='duck'){var s2=WKM.fit(cvT,230);drawTransfer(s2.c,s2.w,s2.h)}
  var ph=st.playing?clamp((performance.now()-st.t0)/1000/st.dur,0,1):null;
  if(ph!=null){var c2=cvW.getContext('2d');c2.setTransform(cvW._d,0,0,cvW._d,0,0);var x=36+(w-48)*ph;c2.strokeStyle=col('--fg');c2.lineWidth=1.5;c2.beginPath();c2.moveTo(x,6);c2.lineTo(x,h-22);c2.stroke()}
  var info=$('#dynInfo');
  if(st.mode==='duck')info.textContent='A música cai '+st.R+' dB em ~'+st.A+' ms e volta em ~'+st.Rel+' ms.';
  else{var p=params(),peak=20*Math.log10(.9),o=gc(peak,p.T,p.R,p.K);info.textContent='Pico do rosnado: '+peak.toFixed(1)+' dB entra, '+o.toFixed(1)+' dB sai ('+(o-peak).toFixed(1)+' dB).'}
  if(st.playing&&performance.now()-st.t0>st.dur*1000+200){st.playing=false;$('#dynPlay').textContent='Ouvir'}
}
function drawDuck(c,w,h){
  var col=WKM.col,L=36,R=12,T=14,B=22,pw=w-L-R,ph=h-T-B;
  /* faixas */
  var trigH=46,gy0=T+trigH+16,gh=ph-trigH-16;
  WKM.text(c,'GATILHO · LENDA',L,T-2,col('--muted'),'left',11);
  c.fillStyle=col('--panel2');WKM.roundRect(c,L,T+4,pw,trigH-8,6);c.fill();
  var x1=L+pw*TRIG[0]/st.dur,x2=L+pw*TRIG[1]/st.dur;
  c.fillStyle=col('--violet');WKM.roundRect(c,x1,T+8,x2-x1,trigH-16,6);c.fill();
  WKM.text(c,'lenda ativa',(x1+x2)/2,T+trigH/2+4,'#0A0A0B','center',12);
  /* eixo dB da música */
  WKM.text(c,'MÚSICA · VOLUME (dB)',L,gy0-4,col('--muted'),'left',11);
  var dbTop=3,dbBot=-34,yv=function(d){return gy0+gh*(dbTop-d)/(dbTop-dbBot)};
  c.strokeStyle=col('--line');c.lineWidth=1;[0,-12,-24].forEach(function(d){c.beginPath();c.moveTo(L,yv(d));c.lineTo(L+pw,yv(d));c.stroke();WKM.text(c,d+'',L-6,yv(d)+4,col('--muted'),'right',11)});
  /* sem efeito */
  c.setLineDash([6,5]);c.strokeStyle=col('--muted');c.lineWidth=2;c.beginPath();c.moveTo(L,yv(0));c.lineTo(L+pw,yv(0));c.stroke();c.setLineDash([]);
  /* com efeito */
  var cur=duckCurve();c.beginPath();cur.forEach(function(g,i){var x=L+pw*i/(cur.length-1),y=yv(g);if(i===0)c.moveTo(x,y);else c.lineTo(x,y)});
  c.strokeStyle=col('--amber');c.lineWidth=3;c.stroke();
  c.lineTo(L+pw,yv(0));c.lineTo(L,yv(0));c.closePath();c.fillStyle='rgba(247,41,61,.16)';c.fill();
  /* anotações */
  var mx=L+pw*(TRIG[0]+Math.min(st.A/1000,.9))/st.dur;
  WKM.text(c,'ataque',x1+6,yv(-st.R)-8,col('--fg'),'left',11);
  WKM.text(c,'liberação',x2+6,yv(-st.R)+(st.R<14?16:-8),col('--fg'),'left',11);
  WKM.text(c,'−'+st.R+' dB',L+pw*(TRIG[0]+TRIG[1])/2/st.dur,yv(-st.R)+16,col('--amber'),'center',12);
  WKM.text(c,'sem ducking',L+pw-4,yv(0)-8,col('--muted'),'right',11);
  for(var t=0;t<=st.dur;t+=1)WKM.text(c,t+' s',L+pw*t/st.dur,h-6,col('--muted'),'center',11);
}
function drawComp(c,w,h){
  var col=WKM.col,L=36,R=12,T=18,B=22,pw=w-L-R,ph=h-T-B,mid=T+ph/2,n=Math.floor(pw/2),g=gainCurve();
  WKM.text(c,'FORMA DE ONDA · ENTRADA (cinza) E SAÍDA (vermelho)',L,T-6,col('--muted'),'left',11);
  c.strokeStyle=col('--line');c.lineWidth=1;c.beginPath();c.moveTo(L,mid);c.lineTo(L+pw,mid);c.stroke();
  var amp=function(a){return a*ph/2*0.98};
  /* entrada */
  c.beginPath();for(var i=0;i<n;i++){var t=i/n*DUR.comp,e=env(t),x=L+i*2;c.moveTo(x,mid-amp(e));c.lineTo(x,mid+amp(e))}c.strokeStyle='rgba(163,158,158,.55)';c.lineWidth=2;c.stroke();
  /* saída */
  c.beginPath();for(var j=0;j<n;j++){var t2=j/n*DUR.comp,e2=env(t2),gg=g[Math.min(g.length-1,Math.floor(t2*200))],o=e2*gg,x2=L+j*2;c.moveTo(x2,mid-amp(o));c.lineTo(x2,mid+amp(o))}c.strokeStyle=col('--amber');c.lineWidth=2;c.stroke();
  if(st.mode==='lim'){var cl=Math.pow(10,st.ceil/20);c.setLineDash([6,5]);c.strokeStyle=col('--fg');c.lineWidth=1.5;[1,-1].forEach(function(sg){c.beginPath();c.moveTo(L,mid-sg*amp(cl));c.lineTo(L+pw,mid-sg*amp(cl));c.stroke()});c.setLineDash([]);WKM.text(c,'teto '+st.ceil+' dB',L+pw-4,mid-amp(cl)-6,col('--fg'),'right',11)}
  /* rótulos dos trechos */
  [['passos',1.0],['rosnado',3.0]].forEach(function(a){WKM.text(c,a[0],L+pw*a[1]/DUR.comp,h-6,col('--muted'),'center',11)});
  WKM.text(c,'fundo',L+8,h-6,col('--muted'),'left',11);
}
function drawTransfer(c,w,h){
  var col=WKM.col,p=params(),L=44,R=14,T=14,B=26,pw=w-L-R,ph=h-T-B,lo=-60,hi=0,xs=function(d){return L+pw*(d-lo)/(hi-lo)},ys=function(d){return T+ph*(hi-d)/(hi-lo)};
  c.clearRect(0,0,w,h);
  c.strokeStyle=col('--line');c.lineWidth=1;[-60,-40,-20,0].forEach(function(d){c.beginPath();c.moveTo(xs(d),T);c.lineTo(xs(d),T+ph);c.stroke();c.beginPath();c.moveTo(L,ys(d));c.lineTo(L+pw,ys(d));c.stroke();WKM.text(c,d+'',xs(d),h-8,col('--muted'),'center',11);WKM.text(c,d+'',L-6,ys(d)+4,col('--muted'),'right',11)});
  WKM.text(c,'ENTRADA (dB)',L+pw,h-8,col('--muted'),'right',11);WKM.text(c,'SAÍDA (dB)',L+2,T+10,col('--muted'),'left',11);
  c.setLineDash([5,5]);c.strokeStyle=col('--muted');c.beginPath();c.moveTo(xs(lo),ys(lo));c.lineTo(xs(hi),ys(hi));c.stroke();c.setLineDash([]);
  c.beginPath();for(var x=lo;x<=hi;x+=.5){var y=gc(x,p.T,p.R,p.K);if(x===lo)c.moveTo(xs(x),ys(y));else c.lineTo(xs(x),ys(y))}c.strokeStyle=col('--amber');c.lineWidth=3;c.stroke();
  c.strokeStyle=col('--fg');c.setLineDash([3,4]);c.lineWidth=1;c.beginPath();c.moveTo(xs(p.T),T);c.lineTo(xs(p.T),T+ph);c.stroke();c.setLineDash([]);
  WKM.text(c,st.mode==='lim'?'teto':'limiar',xs(p.T)+5,T+12,col('--fg'),'left',11);
  [['fundo',20*Math.log10(.03)],['passos',20*Math.log10(.25)],['rosnado',20*Math.log10(.9)]].forEach(function(m){var yo=gc(m[1],p.T,p.R,p.K);
    c.beginPath();c.arc(xs(m[1]),ys(yo),5,0,6.3);c.fillStyle=col('--fg');c.fill();WKM.text(c,m[0],xs(m[1]),ys(yo)+(m[0]==='rosnado'?-10:18),col('--fg'),'center',11)});
}

/* ---------- som ---------- */
function play(){
  if(!WK.need())return;var ctx=WK.ctx(),m=st.mode,t0=ctx.currentTime+.1,master=WK.master();
  st.t0=performance.now()+100;st.playing=true;st.dur=DUR[m];$('#dynPlay').textContent='Tocando';
  if(m==='duck'){
    var dg=ctx.createGain(),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1400;
    [45,52,57,64].forEach(function(n,i){var o=ctx.createOscillator();o.type='triangle';o.frequency.value=WK.mf(n);o.detune.value=(i%2?1:-1)*6;var g=ctx.createGain();g.gain.value=.11;o.connect(g);g.connect(lp);o.start(t0);o.stop(t0+st.dur)});
    lp.connect(dg);dg.connect(master);dg.gain.setValueAtTime(1,t0);
    if(st.ab){dg.gain.setValueAtTime(1,t0+TRIG[0]);dg.gain.setTargetAtTime(db2(-st.R),t0+TRIG[0],st.A/3000);dg.gain.setValueAtTime(db2(-st.R),t0+TRIG[1]);dg.gain.setTargetAtTime(1,t0+TRIG[1],st.Rel/3000)}
    /* gatilho: voz da lenda */
    var tg=t0+TRIG[0],d=TRIG[1]-TRIG[0],os=ctx.createOscillator();os.type='sawtooth';os.frequency.setValueAtTime(150,tg);os.frequency.linearRampToValueAtTime(172,tg+d*.5);os.frequency.linearRampToValueAtTime(140,tg+d);
    var f1=ctx.createBiquadFilter(),f2=ctx.createBiquadFilter();f1.type=f2.type='bandpass';f1.frequency.value=650;f2.frequency.value=1050;f1.Q.value=f2.Q.value=5;
    var g=ctx.createGain();g.gain.setValueAtTime(.0001,tg);g.gain.linearRampToValueAtTime(.55,tg+.2);g.gain.setValueAtTime(.55,tg+d-.3);g.gain.exponentialRampToValueAtTime(.0001,tg+d);
    var vb=ctx.createOscillator(),vg=ctx.createGain();vb.frequency.value=5.5;vg.gain.value=5;vb.connect(vg);vg.connect(os.frequency);
    os.connect(f1);os.connect(f2);f1.connect(g);f2.connect(g);g.connect(master);os.start(tg);vb.start(tg);os.stop(tg+d+.05);vb.stop(tg+d+.05);
  }else{
    var sig=ctx.createGain(),pg=ctx.createGain(),curve=gainCurve();sig.connect(pg);pg.connect(master);
    if(st.ab)pg.gain.setValueCurveAtTime(curve,t0,DUR.comp);else pg.gain.value=1;
    /* fundo */
    var nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),nd=nb.getChannelData(0);for(var i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
    var ns=ctx.createBufferSource();ns.buffer=nb;ns.loop=true;var nf=ctx.createBiquadFilter();nf.type='lowpass';nf.frequency.value=500;var ng=ctx.createGain();ng.gain.value=.03;ns.connect(nf);nf.connect(ng);ng.connect(sig);ns.start(t0);ns.stop(t0+DUR.comp);
    /* passos */
    [0.4,1.0,1.6].forEach(function(s){var ts=t0+s,b=ctx.createBufferSource();b.buffer=nb;var f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=700;var gg=ctx.createGain();gg.gain.setValueAtTime(.0001,ts);gg.gain.linearRampToValueAtTime(.22,ts+.003);gg.gain.exponentialRampToValueAtTime(.0001,ts+.22);b.connect(f);f.connect(gg);gg.connect(sig);b.start(ts);b.stop(ts+.3);
      var o=ctx.createOscillator();o.frequency.setValueAtTime(90,ts);o.frequency.exponentialRampToValueAtTime(55,ts+.12);var og=ctx.createGain();og.gain.setValueAtTime(.0001,ts);og.gain.linearRampToValueAtTime(.2,ts+.003);og.gain.exponentialRampToValueAtTime(.0001,ts+.2);o.connect(og);og.connect(sig);o.start(ts);o.stop(ts+.25)});
    /* rosnado */
    var tr=t0+2.3,o2=ctx.createOscillator();o2.type='sawtooth';o2.frequency.setValueAtTime(70,tr);o2.frequency.linearRampToValueAtTime(46,tr+1.3);var rf=ctx.createBiquadFilter();rf.type='lowpass';rf.frequency.value=420;var rg=ctx.createGain();
    rg.gain.setValueAtTime(.0001,tr);rg.gain.linearRampToValueAtTime(.9,tr+.08);rg.gain.setValueAtTime(.9,tr+.9);rg.gain.exponentialRampToValueAtTime(.0001,tr+1.4);o2.connect(rf);rf.connect(rg);rg.connect(sig);o2.start(tr);o2.stop(tr+1.5);
  }
}

WKM.register({id:'dinamica',build:build,show:function(){draw()},frame:draw,resize:draw});
})();
