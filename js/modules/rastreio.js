/* Rastreabilidade: do ADD ao jogo, e de volta, com a aderência dos nove itens. */
(function(){
'use strict';
var WK=window.WK,WKM=window.WKM,$=WK.$,$$=WK.$$;
var ITEMS=[
 {n:'Hierarquia de barramentos',s:'ok',e:'28 barramentos conferidos por auditoria contra o ADD.'},
 {n:'Catálogo de eventos',s:'ok',e:'47 eventos no projeto do FMOD, criados por scripts a partir do ADD.'},
 {n:'Passos do jogador',s:'ok',e:'Tocam no jogo, com parâmetros Superficie e Postura. Só a superfície Terra tem assets.'},
 {n:'Ambiência do dia',s:'ok',e:'Implementada no projeto.'},
 {n:'Música adaptativa',s:'parc',e:'Três dos sete estados no protótipo. Lobby e exploração dependem do sistema de áreas, que a equipe de programação está integrando.'},
 {n:'Modo Escuta',s:'parc',e:'Snapshot ListenMode configurado no FMOD. A ligação ao jogo ainda está em desenvolvimento.'},
 {n:'Fauna',s:'parc',e:'Parâmetros de estado e alerta existem. Os sons são provisórios, sem som final.'},
 {n:'Lendas',s:'parc',e:'Snapshot Legend_BichoDoMato configurado. As assinaturas das oito lendas são propostas do áudio, que dependem de validação com a equipe de narrativa.'},
 {n:'Dublagem',s:'esp',e:'Apenas especificada, com 38 falas catalogadas.'}];
var SL={ok:['Implementado','ok'],parc:['Parcialmente','parc'],esp:['Apenas especificado','esp']};
var REV=[
 ['Alertas','Dois alertas viraram um único valor contínuo, de 0 a 1.'],
 ['Barramentos','SFX_PLAYER_FOLEY foi substituído por SFX_FOOTSTEPS, e entrou o SFX_WORLD.'],
 ['Código','O pseudocódigo em GDScript virou C#, a linguagem do projeto.'],
 ['Modo Escuta','Deixou de ser uma série de chamadas por barramento e virou um snapshot.'],
 ['Caminhos','Os caminhos dos eventos foram alinhados ao catálogo, e os passos deixaram de ficar mudos.']];
function build(el){
  var flow=[['ADD','versão 1.4, o documento'],['Scripts','criam eventos, barramentos e snapshots no FMOD Studio'],['Projeto FMOD','47 eventos · 28 barramentos · 6 snapshots · 8 parâmetros'],['Godot 4','C#, autoload de áudio'],['Auditoria','script que compara o projeto com o ADD']];
  el.innerHTML='<div class="card"><span class="eyebrow">Resultado · Rastreabilidade</span><h2>Do documento ao jogo, e de volta ao documento</h2>'+
  '<p class="sub">A rastreabilidade é poder conferir se o que foi especificado é o que foi implementado. A implementação também devolve ajustes ao ADD, por isso ele tem versões. '+WKM.tag('proj')+'</p>'+
  '<div class="flow">'+flow.map(function(f,i){return '<div class="fl"><b>'+f[0]+'</b><span>'+f[1]+'</span></div>'+(i<flow.length-1?'<i class="ar" aria-hidden="true">→</i>':'')}).join('')+'</div>'+
  '<div class="back">↩ A auditoria aponta diferenças, e o ADD é revisado. Foram cinco revisões vindas da implementação.</div></div>'+
  '<div class="cols"><div class="card"><h2>Aderência, 9 itens do ADD</h2><p class="sub">Quatro implementados, quatro parciais e um apenas especificado. Clique em um item.</p>'+
  '<div class="adh" id="adh">'+ITEMS.map(function(it,i){return '<button class="ad '+it.s+'" data-i="'+i+'"><span>'+SL[it.s][0]+'</span><b>'+it.n+'</b></button>'}).join('')+'</div>'+
  '<div class="info" id="adhInfo">Escolha um item para ver a evidência.</div>'+
  '<p class="hint">O critério de aderência é inicial, pois não foram encontrados critérios de avaliação específicos para documentos de design de áudio. A auditoria é um script próprio, o que é uma limitação declarada.</p></div>'+
  '<div class="card"><h2>As cinco revisões</h2><p class="sub">O que a implementação mudou no ADD.</p>'+
  '<ol class="rev">'+REV.map(function(r){return '<li><b>'+r[0]+'</b><span>'+r[1]+'</span></li>'}).join('')+'</ol>'+
  '<div class="vers"><span>v1.0 · 25/05</span><span>v1.1</span><span>v1.2</span><span>v1.3</span><span class="cur">v1.4 · 09/11</span></div>'+
  '<p class="hint">As versões são rodadas de iteração do método. O ADD v1.4 está publicado no Zenodo, com DOI 10.5281/zenodo.24075847, licença CC BY 4.0.</p></div></div>';
  $$('#adh .ad').forEach(function(b){b.onclick=function(){var it=ITEMS[+b.dataset.i];$$('#adh .ad').forEach(function(x){x.classList.toggle('sel',x===b)});$('#adhInfo').innerHTML='<b>'+it.n+'</b> · '+SL[it.s][0]+'<br>'+it.e}});
}
WKM.register({id:'rastreio',build:build});
})();
