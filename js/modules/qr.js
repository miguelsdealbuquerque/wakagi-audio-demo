/* Links e QR Codes, para colocar no slide ou imprimir. */
(function(){
'use strict';
var WK=window.WK,WKM=window.WKM,$=WK.$;
var DOI='https://doi.org/10.5281/zenodo.24075847';
function qrCanvas(cv,text){
  var qr=qrcode(0,'M');qr.addData(text);qr.make();var n=qr.getModuleCount(),mod=Math.max(4,Math.floor(560/(n+8))),size=(n+8)*mod;
  cv.width=size;cv.height=size;cv.style.width='min(100%,320px)';cv.style.height='auto';var c=cv.getContext('2d');
  c.fillStyle='#fff';c.fillRect(0,0,size,size);c.fillStyle='#000';
  for(var r=0;r<n;r++)for(var k=0;k<n;k++)if(qr.isDark(r,k))c.fillRect((k+4)*mod,(r+4)*mod,mod,mod)}
function save(cv,name){cv.toBlob(function(b){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove()})}
function siteUrl(){return location.protocol==='file:'?'':(location.origin+location.pathname)}
function build(el){
  el.innerHTML='<div class="cols"><div class="card"><span class="eyebrow">Documento</span><h2>ADD no Zenodo</h2><p class="sub">DOI 10.5281/zenodo.24075847 · licença CC BY 4.0</p><canvas id="qrD" class="qr" aria-label="QR Code do DOI do ADD"></canvas>'+
  '<p class="hint" id="qrDt"></p><div class="row"><button class="btn" id="qrDs">Baixar PNG</button></div></div>'+
  '<div class="card"><span class="eyebrow">Demonstração</span><h2>Este site</h2><p class="sub">Para usar no slide, abra esta página já publicada e baixe o QR.</p><canvas id="qrS" class="qr" aria-label="QR Code deste site"></canvas>'+
  '<label class="sl" style="margin-top:.6rem"><span>Endereço do site</span><input id="qrSu" class="search" type="url" placeholder="https://seu-usuario.github.io/wakagi-audio-demo/"></label>'+
  '<div class="row" style="margin-top:.6rem"><button class="btn" id="qrSs">Baixar PNG</button></div></div></div>';
  qrCanvas($('#qrD'),DOI);$('#qrDt').textContent=DOI;
  $('#qrDs').onclick=function(){save($('#qrD'),'qr-doi-add.png')};
  var u=siteUrl();$('#qrSu').value=u;
  function s(){var v=$('#qrSu').value.trim();if(v){qrCanvas($('#qrS'),v)}else{var c=$('#qrS');c.width=c.height=10}}
  $('#qrSu').oninput=s;s();
  $('#qrSs').onclick=function(){save($('#qrS'),'qr-site-wakagi.png')};
}
WKM.register({id:'qr',build:build});
})();
