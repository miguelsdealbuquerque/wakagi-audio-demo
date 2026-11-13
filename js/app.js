(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
var db2=function(d){return Math.pow(10,d/20)};
var mf=function(n){return 440*Math.pow(2,(n-69)/12)};
var cssv=function(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()};

/* ---------- estado ---------- */
var PRM={MusicState:'LOBBY',Hora:14,Tensao:0.2,Alerta:0.3,Superficie:'Terra',Postura:'Andando',Vento:0.35};
var SURFACES=['Terra','Grama','Madeira','Agua','Lama','FolhasSecas','Galho','Concreto','Pedra','PisoCeramico'];
var POSTURES=[{k:'Agachado',g:0.35,i:900},{k:'Andando',g:0.7,i:560},{k:'Correndo',g:1,i:300}];
var BUSES=[
 {id:'MUSIC',nm:'MUSIC'},{id:'AMB',nm:'AMB'},{id:'FOOT',nm:'SFX_FOOTSTEPS'},
 {id:'FAUNA_CLOSE',nm:'SFX_FAUNA_CLOSE'},{id:'FAUNA_DIST',nm:'SFX_FAUNA_DISTANT'},
 {id:'LEGENDS',nm:'SFX_LEGENDS'},{id:'CRITICAL',nm:'CRITICAL'}];
var SNAP={
 listen:{MUSIC:0,AMB:-8,FOOT:-12,FAUNA_CLOSE:3,FAUNA_DIST:-4},
 legend:{MUSIC:-62,AMB:-10,FAUNA_DIST:-12}};
var snapOn={listen:false,legend:false};
var faderDb={};BUSES.forEach(function(b){faderDb[b.id]=0});
var SOURCES=[
 {k:'musica',nm:'Música',bus:'MUSIC',x:-0.05,y:0.5,z:0.62,col:'--blue',pri:2},
 {k:'vento',nm:'Ambiência',bus:'AMB',x:0.45,y:0.8,z:0.8,col:'--teal',pri:1},
 {k:'passos',nm:'Passos',bus:'FOOT',x:0,y:0.2,z:0.12,col:'--amber',pri:4},
 {k:'fauna',nm:'Fauna próxima',bus:'FAUNA_CLOSE',x:-0.7,y:0.3,z:0.3,col:'--red',pri:5},
 {k:'ave',nm:'Fauna distante',bus:'FAUNA_DIST',x:0.8,y:0.9,z:0.95,col:'--pink',pri:3},
 {k:'lenda',nm:'Lenda',bus:'LEGENDS',x:-0.5,y:0.68,z:0.7,col:'--violet',pri:6},
 {k:'coracao',nm:'Batimento',bus:'CRITICAL',x:0.4,y:0.1,z:0.06,col:'--fg',pri:7}];
var SRC={};SOURCES.forEach(function(s){SRC[s.k]=s});

var ctx=null,master=null,noiseBuf=null,busN={},busAn={};
var walking=false,heartOn=false,duck=false,faunaAuto=false;

function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(function(){t.classList.remove('show')},2200)}
function need(){if(!ctx){toast('Clique em Ligar o som primeiro');return false}if(ctx.state==='suspended')ctx.resume();return true}

/* ---------- audio: base ---------- */
function mkNoise(){var n=ctx.sampleRate*2,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(var i=0;i<n;i++)d[i]=Math.random()*2-1;return b}
function noise(dest,t,o){o=Object.assign({dur:.1,type:'lowpass',f:1000,q:1,gain:1,attack:.002},o);
 var s=ctx.createBufferSource();s.buffer=noiseBuf;var f=ctx.createBiquadFilter();f.type=o.type;f.frequency.value=o.f;f.Q.value=o.q;
 var g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(o.gain,t+o.attack);g.gain.exponentialRampToValueAtTime(0.0001,t+o.dur);
 s.connect(f);f.connect(g);g.connect(dest);s.start(t,Math.random()*1.4);s.stop(t+o.dur+.05)}
function tone(dest,t,o){o=Object.assign({f:440,f2:null,dur:.2,type:'sine',gain:.3,attack:.004},o);
 var os=ctx.createOscillator();os.type=o.type;os.frequency.setValueAtTime(o.f,t);if(o.f2)os.frequency.exponentialRampToValueAtTime(o.f2,t+o.dur);
 var g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(o.gain,t+o.attack);g.gain.exponentialRampToValueAtTime(0.0001,t+o.dur);
 os.connect(g);g.connect(dest);os.start(t);os.stop(t+o.dur+.05)}
function inp(k){return SRC[k].in}

function build(){
 ctx=new (window.AudioContext||window.webkitAudioContext)();
 noiseBuf=mkNoise();
 master=ctx.createGain();var comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=5;
 master.connect(comp);comp.connect(ctx.destination);setVol();
 BUSES.forEach(function(b){var g=ctx.createGain();var an=ctx.createAnalyser();an.fftSize=1024;g.connect(an);an.connect(master);busN[b.id]=g;busAn[b.id]=an});
 SOURCES.forEach(function(s){
  var i=ctx.createGain(),lp=ctx.createBiquadFilter(),dk=ctx.createGain(),ds=ctx.createGain(),pan=ctx.createStereoPanner(),an=ctx.createAnalyser();
  lp.type='lowpass';an.fftSize=512;i.connect(lp);lp.connect(dk);dk.connect(ds);ds.connect(pan);pan.connect(an);an.connect(busN[s.bus]);
  s.in=i;s.lp=lp;s.dk=dk;s.ds=ds;s.pan=pan;s.an=an;s.mask=false;applyPlace(s,true)});
 applyBus(true);
 /* vento continuo */
 var wn=ctx.createBufferSource();wn.buffer=noiseBuf;wn.loop=true;var wf=ctx.createBiquadFilter();wf.type='bandpass';wf.Q.value=.6;var wg=ctx.createGain();
 wn.connect(wf);wf.connect(wg);wg.connect(inp('vento'));wn.start();
 var lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=.13;lg.gain.value=160;lfo.connect(lg);lg.connect(wf.frequency);lfo.start();
 build.wf=wf;build.wg=wg;
 /* dreno de tensao */
 var td=ctx.createOscillator();td.type='sawtooth';td.frequency.value=55;var tf=ctx.createBiquadFilter();tf.type='lowpass';tf.frequency.value=220;var tg=ctx.createGain();tg.gain.value=0;
 td.connect(tf);tf.connect(tg);tg.connect(inp('musica'));td.start();build.tg=tg;
 setParams();nextBeat=ctx.currentTime+.15;beat=0;loadSamples();
}
function setVol(){if(master)master.gain.setTargetAtTime(db2(+$('#vol').value),ctx.currentTime,.05)}
function applyBus(imm){BUSES.forEach(function(b){var off=0;['listen','legend'].forEach(function(k){if(snapOn[k]&&SNAP[k][b.id]!=null)off+=SNAP[k][b.id]});
 var d=faderDb[b.id]+off;var v=d<=-60?0:db2(d);busN[b.id].gain.setTargetAtTime(v,ctx.currentTime,imm?.001:.18)});updateMixUI()}
function applyPlace(s,imm){if(!ctx)return;var t=ctx.currentTime,tc=imm?.001:.08;
 s.pan.pan.setTargetAtTime(clamp(s.x*.9,-1,1),t,tc);
 s.ds.gain.setTargetAtTime(1-.6*s.z,t,tc);
 s.lp.frequency.setTargetAtTime(16000*Math.pow(.1,s.z),t,tc)}
function setParams(){if(!ctx)return;var v=PRM.Vento;build.wg.gain.setTargetAtTime(.02+.5*Math.pow(v,1.5),ctx.currentTime,.2);build.wf.frequency.setTargetAtTime(280+900*v,ctx.currentTime,.3);
 build.tg.gain.setTargetAtTime(PRM.Tensao*.16,ctx.currentTime,.4)}

/* ---------- sons ---------- */
var SURF={
 Terra:function(d,t,g){noise(d,t,{dur:.14,f:700,gain:g});tone(d,t,{f:90,f2:55,dur:.1,gain:g*.5})},
 Grama:function(d,t,g){noise(d,t,{dur:.22,type:'bandpass',f:3200,q:.7,gain:g*.8});noise(d,t+.03,{dur:.15,type:'highpass',f:5000,gain:g*.4})},
 Madeira:function(d,t,g){noise(d,t,{dur:.06,type:'bandpass',f:500,q:2,gain:g});tone(d,t,{f:210,f2:150,dur:.16,gain:g*.55,type:'triangle'})},
 Agua:function(d,t,g){noise(d,t,{dur:.18,type:'bandpass',f:1400,q:1.2,gain:g*.7});for(var i=0;i<3;i++)tone(d,t+.02+i*.05,{f:500+i*250,f2:1100+i*300,dur:.07,gain:g*.25})},
 Lama:function(d,t,g){noise(d,t,{dur:.25,f:380,gain:g});tone(d,t,{f:140,f2:50,dur:.22,gain:g*.5})},
 FolhasSecas:function(d,t,g){for(var i=0;i<7;i++)noise(d,t+i*.018+Math.random()*.01,{dur:.04,type:'highpass',f:3500+Math.random()*3000,gain:g*.5})},
 Galho:function(d,t,g){noise(d,t,{dur:.03,type:'highpass',f:1800,gain:g});tone(d,t,{f:1800,f2:900,dur:.05,type:'square',gain:g*.12});noise(d,t+.06,{dur:.05,type:'bandpass',f:2400,gain:g*.5})},
 Concreto:function(d,t,g){noise(d,t,{dur:.05,type:'bandpass',f:2600,q:1.5,gain:g});tone(d,t,{f:120,f2:70,dur:.08,gain:g*.4})},
 Pedra:function(d,t,g){noise(d,t,{dur:.07,type:'bandpass',f:1800,q:3,gain:g});tone(d,t,{f:950,dur:.12,gain:g*.2})},
 PisoCeramico:function(d,t,g){noise(d,t,{dur:.04,type:'highpass',f:3000,gain:g});tone(d,t,{f:2400,dur:.1,gain:g*.2});tone(d,t,{f:3100,dur:.07,gain:g*.12})}};
/* ---------- sons reais (opcional) ---------- */
var SAMPLES={},sampleN=0;
function loadSamples(){if(location.protocol==='file:')return;
 fetch('assets/audio/manifest.json').then(function(r){return r.ok?r.json():{}}).then(function(m){
  Object.keys(m).forEach(function(k){if(k.charAt(0)==='_')return;SAMPLES[k]=[];(m[k]||[]).forEach(function(f){
   fetch('assets/audio/'+f).then(function(r){return r.arrayBuffer()}).then(function(b){return ctx.decodeAudioData(b)}).then(function(buf){SAMPLES[k].push(buf);sampleN++;var e=$('#sndMode');if(e)e.textContent='Sons reais carregados: '+sampleN+' arquivo(s). O que não tem arquivo continua sintetizado.'}).catch(function(){})})})}).catch(function(){})}
function sample(key,dest,gain,t){var a=SAMPLES[key];if(!a||!a.length)return false;var s=ctx.createBufferSource();s.buffer=a[Math.floor(Math.random()*a.length)];var g=ctx.createGain();g.gain.value=gain==null?1:gain;s.connect(g);g.connect(dest);s.start(t||ctx.currentTime+.005);return true}
var stepSide=1;
function playStep(){if(!ctx)return;var p=POSTURES.filter(function(q){return q.k===PRM.Postura})[0];
 var pn=ctx.createStereoPanner();pn.pan.value=.18*stepSide;stepSide*=-1;pn.connect(inp('passos'));
 if(!sample('passos_'+PRM.Superficie,pn,p.g))SURF[PRM.Superficie](pn,ctx.currentTime+.005,p.g*.9);setTimeout(function(){try{pn.disconnect()}catch(e){}},900)}
function growl(kind){if(!ctx)return;var t=ctx.currentTime+.01,d=inp('fauna'),a=.4+.6*PRM.Alerta;if(sample(kind,d,.5+.5*PRM.Alerta))return;
 if(kind==='onca'){var o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(70,t);o.frequency.linearRampToValueAtTime(46,t+1.1);
  var f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=420;var g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(.5*a,t+.15);g.gain.exponentialRampToValueAtTime(.0001,t+1.2);
  var am=ctx.createOscillator(),ag=ctx.createGain();am.frequency.value=26;ag.gain.value=.25*a;am.connect(ag);ag.connect(g.gain);
  o.connect(f);f.connect(g);g.connect(d);o.start(t);am.start(t);o.stop(t+1.3);am.stop(t+1.3);noise(d,t,{dur:1,type:'bandpass',f:320,q:1.5,gain:.25*a,attack:.2})}
 else if(kind==='jacare'){tone(d,t,{f:48,f2:36,dur:1.1,type:'sawtooth',gain:.32*a,attack:.1});noise(d,t+.2,{dur:.8,type:'highpass',f:3500,gain:.12*a,attack:.2})}
 else{tone(d,t,{f:1900,f2:2500,dur:.09,gain:.22,type:'triangle'});tone(d,t+.14,{f:2100,f2:2700,dur:.09,gain:.2,type:'triangle'})}}
function ave(){if(!ctx)return;var t=ctx.currentTime+.01,d=inp('ave');if(sample('ave',d,1))return;tone(d,t,{f:3200,f2:2700,dur:.11,gain:.2,type:'triangle'});tone(d,t+.16,{f:3500,f2:3000,dur:.1,gain:.16,type:'triangle'});tone(d,t+.3,{f:3100,f2:3300,dur:.14,gain:.14,type:'triangle'})}
function grilo(){if(!ctx)return;var t=ctx.currentTime+.01,d=inp('vento');for(var i=0;i<4;i++)tone(d,t+i*.05,{f:4300,dur:.035,gain:.05,type:'square'})}
function garrafa(){if(!ctx)return;var t=ctx.currentTime+.01,d=inp('lenda');if(sample('garrafa',d,1))return;[0,.45,.9].forEach(function(o,i){tone(d,t+o,{f:1750+i*60,dur:.35,gain:.22});tone(d,t+o,{f:2650+i*80,dur:.2,gain:.12});noise(d,t+o,{dur:.03,type:'highpass',f:4000,gain:.2})})}
function bicho(){if(!ctx)return;var t=ctx.currentTime+.01,d=inp('lenda');var real=sample('bicho',d,1);
 (real?[]:[0,1.5]).forEach(function(o){var os=ctx.createOscillator();os.type='sawtooth';os.frequency.setValueAtTime(150,t+o);os.frequency.linearRampToValueAtTime(175,t+o+.5);os.frequency.linearRampToValueAtTime(140,t+o+1.1);
  var f1=ctx.createBiquadFilter(),f2=ctx.createBiquadFilter();f1.type=f2.type='bandpass';f1.frequency.value=650;f2.frequency.value=1050;f1.Q.value=f2.Q.value=5;
  var g=ctx.createGain();g.gain.setValueAtTime(.0001,t+o);g.gain.linearRampToValueAtTime(.7,t+o+.2);g.gain.exponentialRampToValueAtTime(.0001,t+o+1.2);
  var vb=ctx.createOscillator(),vg=ctx.createGain();vb.frequency.value=5.5;vg.gain.value=5;vb.connect(vg);vg.connect(os.frequency);
  os.connect(f1);os.connect(f2);f1.connect(g);f2.connect(g);g.connect(d);os.start(t+o);vb.start(t+o);os.stop(t+o+1.3);vb.stop(t+o+1.3)});
 setSnap('legend',true);clearTimeout(bicho.h);bicho.h=setTimeout(function(){setSnap('legend',false)},3600)}
var hbNext=0;
function heartbeat(t){var d=inp('coracao');tone(d,t,{f:70,f2:45,dur:.16,gain:.55});tone(d,t+.17,{f:62,f2:42,dur:.14,gain:.4})}

/* ---------- musica ---------- */
var BPM=84,BEAT=60/BPM,BAR=BEAT*4,nextBeat=0,beat=0,curState='LOBBY',pending=null;
var STATES=[
 {k:'LOBBY',d:'Acampamento ativo',demo:true},{k:'EXPLORATION',d:'Estado padrão em campo',demo:true},{k:'TENSION',d:'Alerta acima do limiar',demo:true},
 {k:'PURSUIT',d:'Animal perseguindo',demo:false},{k:'TASK_COMPLETE',d:'Tarefa principal concluída',demo:false},{k:'CRITICAL',d:'Sanidade baixa',demo:false},{k:'LEGEND_ACTIVE',d:'Lenda ativa no mapa (anti-música)',demo:false}];
function pad(t,notes,o){o=Object.assign({vol:.12,type:'triangle',cut:1200,det:0},o);var out=ctx.createGain(),f=ctx.createBiquadFilter(),v=o.vol/notes.length*1.6;
 f.type='lowpass';f.frequency.value=o.cut;out.gain.setValueAtTime(.0001,t);out.gain.exponentialRampToValueAtTime(v,t+.45);out.gain.setValueAtTime(v,t+BAR-.1);out.gain.exponentialRampToValueAtTime(.0001,t+BAR+.7);
 f.connect(out);out.connect(inp('musica'));notes.forEach(function(n,i){var os=ctx.createOscillator();os.type=o.type;os.frequency.value=mf(n);os.detune.value=(i%2?1:-1)*o.det;os.connect(f);os.start(t);os.stop(t+BAR+.8)})}
var PADS={
 LOBBY:function(t){pad(t,[45,52,57,60,64],{vol:.14,cut:900})},
 EXPLORATION:function(t){pad(t,[45,52,57,60,64,71],{vol:.14,cut:1800})},
 TENSION:function(t){pad(t,[45,46,52,53],{vol:.13,type:'sawtooth',cut:700,det:8})},
 PURSUIT:function(t){pad(t,[45,48,51],{vol:.1,type:'sawtooth',cut:2200})},
 TASK_COMPLETE:function(t){pad(t,[57,61,64,69],{vol:.14,cut:2600});tone(inp('musica'),t,{f:1318,dur:1.8,gain:.14})},
 CRITICAL:function(t){pad(t,[33,40],{vol:.16,cut:300});tone(inp('musica'),t,{f:3200,dur:BAR,gain:.012,attack:.5})},
 LEGEND_ACTIVE:function(t){pad(t,[45,45.35,57.6,64.2],{vol:.12,type:'sine',cut:1500,det:14});noise(inp('musica'),t,{dur:BAR,type:'bandpass',f:900,q:6,gain:.1,attack:1.3})}};
var ARP=[57,60,64,67,71,64];
var BEATS={
 EXPLORATION:function(t,i){tone(inp('musica'),t,{f:mf(ARP[(beat*3+i)%ARP.length]+12),dur:.5,gain:.08,type:'triangle'});tone(inp('musica'),t+BEAT/2,{f:mf(ARP[(beat*3+i+2)%ARP.length]+12),dur:.4,gain:.05,type:'triangle'})},
 TENSION:function(t){tone(inp('musica'),t,{f:55,f2:40,dur:.3,gain:.24})},
 PURSUIT:function(t){tone(inp('musica'),t,{f:55,f2:45,dur:.2,type:'sawtooth',gain:.16});noise(inp('musica'),t+BEAT/2,{dur:.05,type:'highpass',f:6000,gain:.1});noise(inp('musica'),t,{dur:.05,type:'highpass',f:6000,gain:.08})},
 CRITICAL:function(t,i){if(i%2===0){tone(inp('musica'),t,{f:52,f2:38,dur:.2,gain:.2});tone(inp('musica'),t+.18,{f:48,f2:36,dur:.16,gain:.14})}}};
function schedBeat(t,b){var i=b%4;
 if(i===0){if(pending){curState=pending;pending=null}PADS[curState](t);
  setTimeout(function(){renderStates()},Math.max(0,(t-ctx.currentTime)*1000))}
 if(BEATS[curState])BEATS[curState](t,i);
 setTimeout(function(){flashBeat(i)},Math.max(0,(t-ctx.currentTime)*1000))}
function musicTick(){if(!ctx)return;while(nextBeat<ctx.currentTime+.2){schedBeat(nextBeat,beat);nextBeat+=BEAT;beat++}}
function flashBeat(i){$$('#beats i').forEach(function(e,j){e.classList.toggle('hit',j===i)});
 var info=$('#musicInfo');if(pending){info.textContent='Troca para '+pending+' no próximo compasso (faltam '+(3-i)+' tempos)'}else{info.textContent='Estado atual '+curState+' · '+BPM+' BPM'}}
function setState(k){PRM.MusicState=k;if(!ctx){curState=k;renderStates();updateParams();toast('Ligue o som para ouvir');return}
 if(k!==curState)pending=k;renderStates();updateParams()}
function renderStates(){var h='';STATES.forEach(function(s){var c=s.k===curState?' cur':(s.k===pending?' pend':'');
 h+='<button class="st'+c+'" data-s="'+s.k+'"><span class="tag">'+(s.demo?'na demo':'alvo final')+'</span><b>'+s.k+'</b><small>'+s.d+'</small></button>'});
 $('#states').innerHTML=h;$$('#states .st').forEach(function(b){b.onclick=function(){setState(b.dataset.s)}});
 $('#codeMusic').innerHTML=
 'LOBBY          <b>pad grave, lento</b>\nEXPLORATION    <b>pad + arpejo suave</b>\nTENSION        <b>cluster + pulso grave</b>\nPURSUIT        <b>pulso rápido + chiado</b>\nTASK_COMPLETE  <b>acorde maior brilhante</b>\nCRITICAL       <b>drone abafado + zumbido</b>\nLEGEND_ACTIVE  <b>anti-música, sem melodia</b>\n\nMusicState = <b>'+PRM.MusicState+'</b>'}

/* ---------- snapshots / mixer ---------- */
function setSnap(k,v){snapOn[k]=v;$('#b'+(k==='listen'?'Listen':'Legend')).classList.toggle('on',v);$('#b'+(k==='listen'?'Listen':'Legend')).setAttribute('aria-pressed',v);if(ctx)applyBus(false);else updateMixUI()}
function buildMixer(){var h='';BUSES.forEach(function(b){h+='<div class="mixrow"><div><div class="nm">'+b.nm+'</div></div><div><input type="range" min="-60" max="6" step="1" value="0" data-b="'+b.id+'" aria-label="Fader '+b.nm+'"><div class="meter"><i id="m-'+b.id+'"></i></div></div><div class="db" id="d-'+b.id+'">0.0</div></div>'});
 $('#mixer').innerHTML=h;$$('#mixer input').forEach(function(i){i.oninput=function(){faderDb[i.dataset.b]=+i.value;if(ctx)applyBus(false);else updateMixUI()}})}
function updateMixUI(){BUSES.forEach(function(b){var off=0;['listen','legend'].forEach(function(k){if(snapOn[k]&&SNAP[k][b.id]!=null)off+=SNAP[k][b.id]});
 var el=$('#d-'+b.id);if(!el)return;var tot=faderDb[b.id]+off;el.innerHTML=(tot<=-60?'−∞':tot.toFixed(1))+(off?'<br><span class="snap">'+(off>0?'+':'')+off+' snap</span>':'')})}

/* ---------- 3D ---------- */
var cv=$('#cv3d'),c2=cv.getContext('2d'),W=0,H=0,dpr=1,yaw=.28,pitch=.5,pos={},drag=null,lastInfo='';
function resize(){var r=cv.parentElement.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=Math.max(280,r.width-32);H=Math.round(clamp(W*.7,320,560));cv.width=W*dpr;cv.height=H*dpr;cv.style.height=H+'px';c2.setTransform(dpr,0,0,dpr,0,0)}
function P(x,y,z){var X=x,Y=y-.5,Z=(z-.5)*1.6,cy=Math.cos(yaw),sy=Math.sin(yaw),x1=X*cy-Z*sy,z1=X*sy+Z*cy,cp=Math.cos(pitch),sp=Math.sin(pitch),y1=Y*cp+z1*sp,z2=-Y*sp+z1*cp,cam=3.4,S=Math.min(W*.27,H*.44),s=S*cam/(cam+z2);
 return {sx:W/2+x1*s,sy:H*.47-y1*s,s:s/S,z:z2}}
function line(a,b,col,w,dash){c2.beginPath();c2.moveTo(a.sx,a.sy);c2.lineTo(b.sx,b.sy);c2.strokeStyle=col;c2.lineWidth=w||1;c2.setLineDash(dash||[]);c2.stroke();c2.setLineDash([])}
function arrow(a,b,col){line(a,b,col,2);var ang=Math.atan2(b.sy-a.sy,b.sx-a.sx);c2.beginPath();c2.moveTo(b.sx,b.sy);c2.lineTo(b.sx-9*Math.cos(ang-.45),b.sy-9*Math.sin(ang-.45));c2.lineTo(b.sx-9*Math.cos(ang+.45),b.sy-9*Math.sin(ang+.45));c2.closePath();c2.fillStyle=col;c2.fill()}
function txt(s,p,col,dx,dy,al){c2.font='600 '+Math.round(12*(document.documentElement.classList.contains('present')?1.15:1))+'px '+cssv('--mono');c2.fillStyle=col;c2.textAlign=al||'center';c2.fillText(s,p.sx+(dx||0),p.sy+(dy||0))}
function level(s){if(!ctx)return .35;var d=new Float32Array(256);s.an.getFloatTimeDomainData(d);var r=0;for(var i=0;i<256;i++)r+=d[i]*d[i];r=Math.sqrt(r/256);var dbv=20*Math.log10(r+1e-6);return clamp((dbv+54)/42,0,1)}
function draw3d(){
 c2.clearRect(0,0,W,H);var line1=cssv('--line'),mut=cssv('--muted');
 for(var x=-1;x<=1.001;x+=.5)line(P(x,0,0),P(x,0,1),line1,1);for(var z=0;z<=1.001;z+=.25)line(P(-1,0,z),P(1,0,z),line1,1);
 arrow(P(-1,0,0),P(1.08,0,0),cssv('--amber'));arrow(P(-1,0,0),P(-1,1.12,0),cssv('--blue'));arrow(P(-1,0,0),P(-1,0,1.1),cssv('--teal'));
 txt('ESQ',P(-1,0,0),cssv('--amber'),0,18);txt('CENTRO',P(0,0,0),cssv('--amber'),0,18);txt('DIR',P(1,0,0),cssv('--amber'),0,18);
 txt('AGUDO',P(-1,1.12,0),cssv('--blue'),0,-8);txt('GRAVE',P(-1,0,0),cssv('--blue'),-8,-6,'right');
 txt('PERTO',P(-1,0,.04),cssv('--teal'),-10,24,'right');txt('LONGE',P(-1,0,1.1),cssv('--teal'),-10,4,'right');
 var l0=P(0,0,-.05);txt('OUVINTE',l0,mut,0,32);c2.beginPath();c2.arc(l0.sx,l0.sy+14,6,0,6.3);c2.fillStyle=mut;c2.fill();
 var list=SOURCES.map(function(s){var p=P(s.x,s.y,s.z);s._p=p;s._lv=level(s);return s}).sort(function(a,b){return b._p.z-a._p.z});
 /* mascaramento */
 SOURCES.forEach(function(s){s.mask=false});
 for(var i=0;i<SOURCES.length;i++)for(var j=i+1;j<SOURCES.length;j++){var a=SOURCES[i],b=SOURCES[j];if(a._lv<.12||b._lv<.12)continue;
  var d=Math.hypot((a.x-b.x)/2,a.y-b.y,a.z-b.z);if(d<.3){var lo=a.pri<b.pri?a:b;if(lo.bus!=='CRITICAL'&&lo.pri<6)lo.mask=true;
   line(a._p,b._p,cssv('--red'),2,[6,5]);txt('mascaramento',{sx:(a._p.sx+b._p.sx)/2,sy:(a._p.sy+b._p.sy)/2},cssv('--red'),0,-10)}}
 if(ctx)SOURCES.forEach(function(s){s.dk.gain.setTargetAtTime(duck&&s.mask?.45:1,ctx.currentTime,.1)});
 list.forEach(function(s){var p=s._p,fl=P(s.x,0,s.z),col=cssv(s.col),r=(11+16*s._lv)*p.s*1.15;
  line(fl,p,col,1,[3,4]);c2.beginPath();c2.ellipse(fl.sx,fl.sy,r*1.1,r*.45,0,0,6.3);c2.fillStyle='rgba(0,0,0,.35)';c2.fill();
  var g=c2.createRadialGradient(p.sx-r*.3,p.sy-r*.3,r*.1,p.sx,p.sy,r);g.addColorStop(0,'#fff');g.addColorStop(.25,col);g.addColorStop(1,'rgba(0,0,0,.55)');
  c2.globalAlpha=ctx?(.35+.65*Math.min(1,s._lv*2.2)):.75;c2.beginPath();c2.arc(p.sx,p.sy,r,0,6.3);c2.fillStyle=g;c2.fill();c2.globalAlpha=1;
  if(s._lv>.05){c2.beginPath();c2.arc(p.sx,p.sy,r+4+10*s._lv,0,6.3);c2.strokeStyle=col;c2.globalAlpha=.5*s._lv+.1;c2.lineWidth=2;c2.stroke();c2.globalAlpha=1}
  if(s.mask&&duck){c2.beginPath();c2.arc(p.sx,p.sy,r+3,0,6.3);c2.strokeStyle=cssv('--red');c2.setLineDash([4,3]);c2.stroke();c2.setLineDash([])}
  txt(s.nm,p,cssv('--fg'),0,-r-8);s._r=r})}
function pickSrc(px,py){var best=null,bd=1e9;SOURCES.forEach(function(s){if(!s._p)return;var d=Math.hypot(px-s._p.sx,py-s._p.sy);if(d<Math.max(s._r||14,18)+8&&d<bd){bd=d;best=s}});return best}
function solve(s,px,py){var x=s.x,z=s.z;for(var k=0;k<6;k++){var a=P(x,s.y,z),b=P(x+.01,s.y,z),c=P(x,s.y,z+.01),ex=px-a.sx,ey=py-a.sy,j11=(b.sx-a.sx)/.01,j21=(b.sy-a.sy)/.01,j12=(c.sx-a.sx)/.01,j22=(c.sy-a.sy)/.01,det=j11*j22-j12*j21;if(Math.abs(det)<1e-6)break;x+=(ex*j22-ey*j12)/det;z+=(-ex*j21+ey*j11)/det}
 s.x=clamp(x,-1,1);s.z=clamp(z,0,1)}
function ptr(e){var r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
cv.addEventListener('pointerdown',function(e){var q=ptr(e),s=pickSrc(q.x,q.y);cv.setPointerCapture(e.pointerId);drag=s?{s:s}:{rot:true,x:q.x,y:q.y}});
cv.addEventListener('pointermove',function(e){if(!drag)return;var q=ptr(e);
 if(drag.s){solve(drag.s,q.x,q.y);applyPlace(drag.s,false);$('#placeInfo').textContent=drag.s.nm+' · esquerda/direita '+drag.s.x.toFixed(2)+' · distância '+drag.s.z.toFixed(2)+' (mais longe soa mais escuro e mais baixo)'}
 else{yaw+=(q.x-drag.x)*.008;pitch=clamp(pitch+(q.y-drag.y)*.006,.05,1.3);drag.x=q.x;drag.y=q.y}});
['pointerup','pointercancel'].forEach(function(n){cv.addEventListener(n,function(){drag=null})});

/* ---------- passos UI ---------- */
function buildSurfs(){$('#surfs').innerHTML=SURFACES.map(function(s){return '<button data-s="'+s+'" class="'+(s===PRM.Superficie?'on':'')+'">'+s+'</button>'}).join('');
 $$('#surfs button').forEach(function(b){b.onclick=function(){PRM.Superficie=b.dataset.s;buildSurfs();updateParams();if(need())playStep()}});
 $('#posts').innerHTML=POSTURES.map(function(p){return '<button data-p="'+p.k+'" class="'+(p.k===PRM.Postura?'on':'')+'">'+p.k+'</button>'}).join('');
 $$('#posts button').forEach(function(b){b.onclick=function(){PRM.Postura=b.dataset.p;buildSurfs();updateParams();if(need())playStep()}});
 $('#codeStep').innerHTML='event:/SFX/Player/Footsteps\n  <b>Superficie</b> = '+PRM.Superficie+'\n  <b>Postura</b>   = '+PRM.Postura+'\n\nroteado para SFX_FOOTSTEPS'}
function setWalk(v){walking=v;['bWalk','walk2'].forEach(function(i){$('#'+i).classList.toggle('on',v);$('#'+i).setAttribute('aria-pressed',v)});if(v&&!need()){setWalk(false)}}
var scope=$('#scope'),sc=scope.getContext('2d');
function drawScope(){var w=scope.clientWidth,h=150,d=window.devicePixelRatio||1;if(scope.width!==Math.round(w*d)){scope.width=Math.round(w*d);scope.height=h*d}
 sc.setTransform(d,0,0,d,0,0);sc.clearRect(0,0,w,h);sc.strokeStyle=cssv('--line');sc.beginPath();sc.moveTo(0,h/2);sc.lineTo(w,h/2);sc.stroke();
 if(!ctx)return;var buf=new Float32Array(1024);busAn.FOOT.getFloatTimeDomainData(buf);sc.beginPath();sc.strokeStyle=cssv('--amber');sc.lineWidth=2;
 for(var i=0;i<1024;i+=2){var x=i/1024*w,y=h/2-buf[i]*h*.9;if(i===0)sc.moveTo(x,y);else sc.lineTo(x,y)}sc.stroke()}

/* ---------- voice stealing ---------- */
var TIERS=['S','A','B','C','D','E','F'],voices=[],vlog=[],vlimit=6,vid=0;
function vlogAdd(m){vlog.unshift(m);vlog=vlog.slice(0,8);$('#vlog').innerHTML=vlog.map(function(l){return '<div>'+l+'</div>'}).join('')}
function vsound(tier,dur){if(!ctx)return null;var rank=TIERS.indexOf(tier),t=ctx.currentTime+.01,o=ctx.createOscillator(),g=ctx.createGain();o.type=rank===0?'sawtooth':'triangle';o.frequency.value=mf(81-rank*4);
 g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.06,t+.05);g.gain.setValueAtTime(.06,t+dur-.1);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05);return {o:o,g:g}}
function killVoice(v){if(v.snd&&ctx){v.snd.g.gain.cancelScheduledValues(ctx.currentTime);v.snd.g.gain.setTargetAtTime(.0001,ctx.currentTime,.02);try{v.snd.o.stop(ctx.currentTime+.1)}catch(e){}}}
function spawn(tier){var rank=TIERS.indexOf(tier),life=6000;
 if(voices.length<vlimit){add();vlogAdd('Som '+tier+' tocou. '+voices.length+' de '+vlimit+' vozes em uso.');return}
 var victim=voices.slice().sort(function(a,b){return b.rank-a.rank||a.born-b.born})[0];
 if(victim.rank>rank||(victim.rank===rank&&rank!==0)){victim.cut=true;killVoice(victim);vlogAdd('<span style="color:var(--red)">'+victim.tier+' foi cortado</span> para dar lugar a '+tier+'.');setTimeout(function(){voices=voices.filter(function(v){return v!==victim});renderSlots()},350);voices=voices.filter(function(v){return v!==victim});add(true)}
 else{vlogAdd('Limite atingido. O novo som '+tier+' foi descartado, pois todos os que tocam têm prioridade igual ou maior'+(victim.rank===0?' (S nunca é cortado)':'')+'.')}
 function add(after){var v={id:++vid,tier:tier,rank:rank,born:performance.now(),life:life,snd:vsound(tier,life/1000)};voices.push(v);setTimeout(function(){voices=voices.filter(function(x){return x!==v})},life)}}
function renderSlots(){var h='',now=performance.now();for(var i=0;i<vlimit;i++){var v=voices[i];
 if(v){var pct=clamp(100-(now-v.born)/v.life*100,0,100);h+='<div class="slot full" style="'+(v.rank===0?'border-color:var(--red)':'')+'"><span>nível <b style="color:var(--amber)">'+v.tier+'</b></span><span>voz '+(i+1)+'</span><i class="bar" style="width:'+pct+'%"></i></div>'}
 else h+='<div class="slot"><span style="color:var(--muted)">livre</span><span style="color:var(--muted)">voz '+(i+1)+'</span></div>'}
 $('#slots').innerHTML=h}
function buildTiers(){$('#tiers').innerHTML=TIERS.map(function(t){return '<button data-t="'+t+'" class="'+(t==='S'?'s':'')+'" aria-label="Disparar som de nível '+t+'">'+t+'</button>'}).join('');
 $$('#tiers button').forEach(function(b){b.onclick=function(){if(need())spawn(b.dataset.t)}})}

/* ---------- parametros ---------- */
function updateParams(){var hn=(PRM.Hora/24),fe=PRM.Alerta<.34?'Calma':(PRM.Alerta<.67?'Atenta':'Alerta');
 var rows=[['MusicState',PRM.MusicState],['HoraDoDia',hn.toFixed(2)+' (global)'],['Tensao',PRM.Tensao.toFixed(2)+' (global)'],['FaunaEstado',fe],['FaunaAlerta',PRM.Alerta.toFixed(2)],['Superficie',PRM.Superficie],['Postura',PRM.Postura],['VentoIntensidade',PRM.Vento.toFixed(2)]];
 $('#params').innerHTML=rows.map(function(r){return '<div class="chip"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>'}).join('');
 $('#oVento').textContent=PRM.Vento.toFixed(2);var hh=Math.floor(PRM.Hora),mm=Math.round((PRM.Hora-hh)*60);$('#oHora').textContent=('0'+hh).slice(-2)+':'+('0'+mm).slice(-2);$('#oTens').textContent=PRM.Tensao.toFixed(2);$('#oAlert').textContent=PRM.Alerta.toFixed(2);buildSurfsLite()}
function buildSurfsLite(){var c=$('#codeStep');if(c)c.innerHTML='event:/SFX/Player/Footsteps\n  <b>Superficie</b> = '+PRM.Superficie+'\n  <b>Postura</b>   = '+PRM.Postura+'\n\nroteado para SFX_FOOTSTEPS';var cm=$('#codeMusic');if(cm&&cm.innerHTML)cm.innerHTML=cm.innerHTML.replace(/MusicState = <b>[^<]*<\/b>/,'MusicState = <b>'+PRM.MusicState+'</b>')}

/* ---------- loops ---------- */
var nextStepAt=0,nextFauna=0,nextAmb=0,hbT=0,tabNow='mix';
function tick(){if(!ctx)return;var now=performance.now();
 if(walking&&now>=nextStepAt){playStep();nextStepAt=now+POSTURES.filter(function(p){return p.k===PRM.Postura})[0].i}
 if(faunaAuto&&now>=nextFauna){growl(Math.random()<.7?'onca':'jacare');nextFauna=now+(5500-4000*PRM.Alerta)+Math.random()*1200}
 if(now>=nextAmb){var day=PRM.Hora>=6&&PRM.Hora<18;if(day)ave();else grilo();nextAmb=now+(day?4000+Math.random()*5000:900+Math.random()*1600)}
 if(heartOn&&ctx.currentTime>=hbT){var bpm=62+48*PRM.Tensao;heartbeat(ctx.currentTime+.02);hbT=ctx.currentTime+60/bpm}
 musicTick()}
function frame(){
 if(ctx){BUSES.forEach(function(b){var d=new Float32Array(512);busAn[b.id].getFloatTimeDomainData(d);var r=0;for(var i=0;i<512;i++)r+=d[i]*d[i];r=Math.sqrt(r/512);var db=20*Math.log10(r+1e-6);var m=$('#m-'+b.id);if(m)m.style.width=clamp((db+60)/60*100,0,100)+'%'})}
 if(tabNow==='mix')draw3d();if(tabNow==='passos')drawScope();if(tabNow==='barramentos')renderSlots();if(window.WK&&WK.frame)WK.frame(tabNow);
 requestAnimationFrame(frame)}

/* ---------- navegacao e ligacoes ---------- */
function show(t){if(!$('#p-'+t))t='mix';tabNow=t;$$('.panel').forEach(function(p){p.classList.toggle('cur',p.id==='p-'+t)});$$('.tabs a').forEach(function(a){a.classList.toggle('cur',a.dataset.t===t)});if(t==='mix')resize();if(window.WK&&WK.onShow)WK.onShow(t);window.scrollTo(0,0)}
window.addEventListener('hashchange',function(){show(location.hash.slice(1))});
window.addEventListener('resize',function(){if(tabNow==='mix')resize();if(window.WK&&WK.onResize)WK.onResize()});
document.addEventListener('keydown',function(e){if(/INPUT|TEXTAREA/.test(e.target.tagName)&&e.target.type!=='range')return;var k=e.key.toLowerCase(),nav=$$('.tabs a'),ix=parseInt(k,10);
 if(ix>=1&&ix<=nav.length){location.hash='#'+nav[ix-1].dataset.t}else if(k==='e'){setSnap('listen',!snapOn.listen)}});

$('#power').onclick=function(){if(!ctx){build();$('#power').textContent='Som ligado';$('#power').classList.add('live');toast('Som ligado')}else if(ctx.state==='running'){ctx.suspend();$('#power').textContent='Ligar o som';$('#power').classList.remove('live')}else{ctx.resume();$('#power').textContent='Som ligado';$('#power').classList.add('live')}};
$('#vol').oninput=setVol;
$('#zoom').onclick=function(){var on=document.documentElement.classList.toggle('present');$('#zoom').setAttribute('aria-pressed',on);$('#zoom').classList.toggle('on',on);if(tabNow==='mix')resize()};
$('#bListen').onclick=function(){setSnap('listen',!snapOn.listen)};
$('#bLegend').onclick=function(){setSnap('legend',!snapOn.legend)};
$('#bDuck').onclick=function(){duck=!duck;$('#bDuck').classList.toggle('on',duck);$('#bDuck').setAttribute('aria-pressed',duck)};
$('#bWalk').onclick=function(){setWalk(!walking)};$('#walk2').onclick=function(){setWalk(!walking)};
$('#bHeart').onclick=function(){if(!need())return;heartOn=!heartOn;$('#bHeart').classList.toggle('on',heartOn);$('#bHeart').setAttribute('aria-pressed',heartOn);hbT=0};
$('#step').onclick=function(){if(need())playStep()};
$$('[data-fx]').forEach(function(b){b.onclick=function(){if(!need())return;var k=b.dataset.fx;if(k==='ave')ave();else if(k==='garrafa')garrafa();else if(k==='bicho')bicho();else growl(k)}});
$('#bAuto').onclick=function(){if(!need())return;faunaAuto=!faunaAuto;$('#bAuto').classList.toggle('on',faunaAuto);$('#bAuto').setAttribute('aria-pressed',faunaAuto);nextFauna=0};
$('#sVento').oninput=function(e){PRM.Vento=+e.target.value;updateParams();setParams()};
$('#sHora').oninput=function(e){PRM.Hora=+e.target.value;updateParams()};
$('#sTens').oninput=function(e){PRM.Tensao=+e.target.value;updateParams();setParams()};
$('#sAlert').oninput=function(e){PRM.Alerta=+e.target.value;updateParams()};
$('#vlim').oninput=function(e){vlimit=+e.target.value;$('#vlimOut').textContent=vlimit;while(voices.length>vlimit){var v=voices.pop();killVoice(v)}renderSlots()};
$('#storm').onclick=function(){if(!need())return;var w=['F','F','E','E','D','C','B','A','F','E','S','F'];w.forEach(function(t,i){setTimeout(function(){spawn(t)},i*180)})};
$('#clearV').onclick=function(){voices.forEach(killVoice);voices=[];vlogAdd('Todas as vozes liberadas.');renderSlots()};

buildMixer();buildSurfs();renderStates();buildTiers();updateParams();renderSlots();updateMixUI();
show(location.hash.slice(1));resize();setInterval(tick,50);requestAnimationFrame(frame);
window.WK={ctx:function(){return ctx},need:need,toast:toast,$:$,$$:$$,clamp:clamp,db2:db2,mf:mf,cssv:cssv,master:function(){return master},busN:function(){return busN},busAn:function(){return busAn},
 inp:inp,noise:noise,tone:tone,PRM:PRM,BUSES:BUSES,SNAP:SNAP,snapOn:snapOn,faderDb:faderDb,SOURCES:SOURCES,SRC:SRC,TIERS:TIERS,setSnap:setSnap,applyBus:applyBus,growl:growl,ave:ave,garrafa:garrafa,bicho:bicho,heartbeat:heartbeat,playStep:playStep,
 setParams:setParams,updateParams:updateParams,setState:setState,STATES:STATES,show:show,isPresent:function(){return document.documentElement.classList.contains('present')},tab:function(){return tabNow}};
if(window.WKInit)window.WKInit(window.WK);
})();
