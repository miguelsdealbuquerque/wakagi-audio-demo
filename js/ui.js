/* Utilidades compartilhadas pelos módulos de conceito.
   Cada módulo se registra com WKM.register({id, frame, show, resize}). */
(function(){
'use strict';
var WK=window.WK;
var mods={};
var $=WK.$,$$=WK.$$,clamp=WK.clamp;

window.WKM={
  mods:mods,
  register:function(m){mods[m.id]=m;var el=document.getElementById('p-'+m.id);if(el&&m.build)m.build(el);},
  col:function(n){return WK.cssv(n)},
  /* canvas nítido que acompanha a largura do cartão */
  fit:function(cv,hCss){
    var d=Math.min(2,window.devicePixelRatio||1),w=Math.max(200,Math.round(cv.clientWidth||cv.parentElement.clientWidth||300));
    if(cv._w!==w||cv._h!==hCss||cv._d!==d){cv._w=w;cv._h=hCss;cv._d=d;cv.width=w*d;cv.height=hCss*d;cv.style.height=hCss+'px'}
    var c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);return {c:c,w:w,h:hCss}
  },
  fs:function(px){return Math.round(px*(WK.isPresent()?1.15:1))},
  mono:function(px){return '600 '+WKM.fs(px)+'px '+WK.cssv('--mono')},
  text:function(c,s,x,y,col,al,px){c.font=WKM.mono(px||12);c.fillStyle=col;c.textAlign=al||'left';c.fillText(s,x,y)},
  /* marca "ilustrativo" vs "do projeto" */
  tag:function(kind){
    var m={proj:['Do projeto','tg proj'],ilus:['Ilustrativo','tg ilus'],apoio:['Conceito de apoio','tg apoio']}[kind];
    return '<span class="'+m[1]+'">'+m[0]+'</span>'},
  seg:function(id,items,cur){
    return '<div class="seg" id="'+id+'" role="group">'+items.map(function(i){return '<button data-v="'+i[0]+'" class="'+(i[0]===cur?'on':'')+'">'+i[1]+'</button>'}).join('')+'</div>'},
  bindSeg:function(id,fn){
    var root=document.getElementById(id);
    $$('button',root).forEach(function(b){b.onclick=function(){$$('button',root).forEach(function(x){x.classList.toggle('on',x===b)});fn(b.dataset.v)}})},
  slider:function(id,label,min,max,step,val,unit){
    return '<label class="sl"><span>'+label+' <output id="o-'+id+'">'+val+'</output>'+(unit?' '+unit:'')+'</span><input id="'+id+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'"></label>'},
  bindSlider:function(id,fn){
    var el=document.getElementById(id),o=document.getElementById('o-'+id);
    var f=function(){if(o)o.textContent=el.value;fn(+el.value)};el.oninput=f;f()},
  roundRect:function(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
};
WK.onShow=function(t){var m=mods[t];if(m&&m.show)m.show()};
WK.frame=function(t){var m=mods[t];if(m&&m.frame)m.frame()};
WK.onResize=function(){var m=mods[WK.tab()];if(m&&m.resize)m.resize()};
})();
