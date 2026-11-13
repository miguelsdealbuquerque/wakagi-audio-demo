/* Glossário: cada termo em inglês com a frase em português e o exemplo do jogo. */
(function(){
'use strict';
var WK=window.WK,WKM=window.WKM,$=WK.$,$$=WK.$$;
/* t: termo, en: forma em inglês, d: definição, w: no Wakagi, tab: aba relacionada, c: categoria */
var G=[
 {t:'Middleware de áudio',en:'audio middleware',c:'Ferramentas',d:'Programa que fica entre o jogo e o som. O designer de áudio monta eventos, barramentos e regras nele, e o código do jogo só dispara.',w:'O Projeto Wakagi usa o FMOD Studio com a Godot 4.',tab:'rastreio'},
 {t:'Evento',en:'event',c:'Ferramentas',d:'Um som, ou um conjunto de sons e regras, que o jogo dispara pelo nome.',w:'O evento de passos recebe os parâmetros Superficie e Postura. O projeto tem 47 eventos.',tab:'passos'},
 {t:'Barramento',en:'bus',c:'Mixagem',d:'Um grupo de sons que se mixa junto, com um fader e um medidor. Os barramentos se juntam em grupos até o Master.',w:'MUSIC, SFX, AMB, VO, UI e CRITICAL. São 28 no projeto.',tab:'hierarquia'},
 {t:'Master',en:'master bus',c:'Mixagem',d:'A soma final de tudo, antes de sair no alto-falante.',w:'Todo som passa por pelo menos um grupo antes do Master.',tab:'hierarquia'},
 {t:'Snapshot',en:'snapshot',c:'Mixagem',d:'Uma foto da mixagem. Guarda deslocamentos em dB e os aplica de uma vez, com transição suave.',w:'ListenMode e Legend_BichoDoMato. São 6 snapshots no projeto.',tab:'parametros'},
 {t:'Parâmetro',en:'parameter, RTPC',c:'Ferramentas',d:'Um número que o jogo envia em tempo real e que controla o som por uma curva.',w:'Oito parâmetros, como Superficie, Postura, Tensao e HoraDoDia.',tab:'parametros'},
 {t:'Ducking',en:'ducking',c:'Dinâmica',d:'Abaixar um som automaticamente enquanto outro, mais importante, toca.',w:'A lenda abaixa a música. Está especificado por side-chain no ADD e, hoje, é aplicado por snapshots no FMOD.',tab:'dinamica'},
 {t:'Side-chain',en:'side-chain',c:'Dinâmica',d:'Quando o volume de um som é controlado pelo nível de outro som, o gatilho.',w:'O gatilho é a lenda, e o som controlado é a música.',tab:'dinamica'},
 {t:'Ataque e liberação',en:'attack and release',c:'Dinâmica',d:'Ataque é o quão rápido o efeito entra. Liberação é o quão rápido ele sai.',w:'No ducking, quanto tempo a música leva para descer e para voltar.',tab:'dinamica'},
 {t:'Compressor',en:'compressor',c:'Dinâmica',d:'Reduz a diferença entre sons altos e baixos. Acima do limiar, a razão define quanto passa.',w:'Conceito de apoio. Não é item específico do ADD.',tab:'dinamica'},
 {t:'Limiter',en:'limiter',c:'Dinâmica',d:'Um teto de volume. É um compressor com razão altíssima e ataque rápido.',w:'Conceito de apoio. Não é item específico do ADD.',tab:'dinamica'},
 {t:'Mascaramento',en:'masking',c:'Mixagem',d:'Quando um som esconde outro porque os dois ocupam a mesma faixa de frequência e o mesmo espaço.',w:'A regra inviolável manda evitar o que confunde a leitura de furtividade.',tab:'mix'},
 {t:'Voice stealing',en:'voice stealing',c:'Mixagem',d:'Quando o limite de vozes é atingido, o sistema corta o som menos importante para dar lugar a um mais importante.',w:'Sete níveis, do S, que nunca é cortado, ao F, o primeiro a ser cortado.',tab:'barramentos'},
 {t:'Transição quantizada',en:'quantized transition',c:'Música',d:'A troca de trilha espera o próximo tempo forte, para soar musical e não como um corte.',w:'A troca de estado musical acontece no próximo tempo forte, com antecipação máxima de um compasso.',tab:'musica'},
 {t:'Máquina de estados',en:'state machine',c:'Música',d:'Um conjunto de estados e regras de passagem entre eles.',w:'Sete estados no alvo do jogo, e três no protótipo.',tab:'musica'},
 {t:'Anti-música',en:'anti-music',c:'Música',d:'A trilha corrompida por DSP, sem melodia, quando uma lenda está ativa.',w:'Prevista para a demonstração do jogo.',tab:'musica'},
 {t:'DSP',en:'digital signal processing',c:'Ferramentas',d:'Processamento digital do sinal, como filtros, distorção e reverb.',w:'Usado na corrupção da trilha.',tab:null},
 {t:'Atenuação por distância',en:'distance attenuation',c:'Espaço',d:'O som fica mais baixo quanto mais longe está. Em campo aberto, cai 6 dB a cada dobro da distância.',w:'Faz parte do pilar Espacialidade total.',tab:'espaco'},
 {t:'Pan',en:'panning',c:'Espaço',d:'A posição do som entre a esquerda e a direita.',w:'Diz ao jogador de que lado vem a ameaça.',tab:'espaco'},
 {t:'Oclusão',en:'occlusion',c:'Espaço',d:'Quando um obstáculo fica entre a fonte e o ouvinte, o som chega mais baixo e abafado.',w:'Conceito de apoio, mostrado na aba Espaço.',tab:'espaco'},
 {t:'Filtro passa-baixa',en:'low-pass filter',c:'Espaço',d:'Deixa passar os graves e corta os agudos. É o que faz um som distante soar escuro.',w:'No mapa 3D, mais longe soa mais escuro.',tab:'espaco'},
 {t:'Contraste de segurança',en:'safety contrast',c:'Pilares do ADD',d:'O aviso precisa se destacar do que o rodeia, e não necessariamente ser mais alto.',w:'Um dos cinco pilares do ADD.',tab:'silencio'},
 {t:'Silêncio como instrumento',en:'silence as instrument',c:'Pilares do ADD',d:'O vazio antes de um aviso é uma decisão de design, e cria o maior contraste.',w:'Um dos cinco pilares do ADD.',tab:'silencio'},
 {t:'Regra inviolável',en:'inviolable rule',c:'Pilares do ADD',d:'Qualquer som que confunda a leitura de furtividade deve ser cortado, atenuado ou substituído.',w:'Seção 1.1 do ADD. Toda decisão de mixagem responde a ela.',tab:'mix'},
 {t:'Foley e SFX',en:'foley and sound effects',c:'Sons',d:'Foley é o som feito para acompanhar ações, como passos. SFX são os efeitos sonoros em geral.',w:'Passos, fauna e lendas saem pelo grupo SFX.',tab:'passos'},
 {t:'Ambiência',en:'ambience, soundscape',c:'Sons',d:'O som contínuo de fundo de um lugar.',w:'Vento, grilos à noite e aves de dia.',tab:'hierarquia'},
 {t:'Stem',en:'stem',c:'Música',d:'Uma camada da trilha, como percussão ou pad, que pode entrar e sair separadamente.',w:'O ADD descreve stems temáticos.',tab:'musica'},
 {t:'Autoload',en:'autoload',c:'Ferramentas',d:'Um script da Godot que fica sempre carregado, para ser usado por qualquer cena.',w:'A comunicação entre Godot e FMOD usa um autoload em C#.',tab:'rastreio'},
 {t:'Rastreabilidade',en:'traceability',c:'Método',d:'Poder seguir uma decisão da especificação até a implementação, e conferir.',w:'Scripts criam o projeto do FMOD a partir do ADD, e outro script audita.',tab:'rastreio'},
 {t:'Aderência',en:'adherence',c:'Método',d:'O quanto a implementação segue a especificação.',w:'Quatro de nove itens implementados, quatro parciais e um apenas especificado.',tab:'rastreio'},
 {t:'GDD e ADD',en:'game design document, audio design document',c:'Método',d:'O GDD descreve o jogo todo. O ADD descreve o áudio, como um documento de requisitos para o som.',w:'O ADD v1.4 está publicado no Zenodo, com DOI.',tab:'rastreio'},
 {t:'Decibel',en:'dB',c:'Mixagem',d:'Unidade de nível. Menos 6 dB é aproximadamente a metade da amplitude. Zero é o máximo digital.',w:'Os snapshots são conjuntos de deslocamentos em dB.',tab:'parametros'}];
var cat='Todos',q='';
function build(el){
  var cats=['Todos'].concat(G.map(function(g){return g.c}).filter(function(v,i,a){return a.indexOf(v)===i}).sort());
  el.innerHTML='<div class="card"><span class="eyebrow">Referência</span><h2>Glossário</h2><p class="sub">Os termos em inglês do ADD, com a frase em português e o exemplo do Wakagi. Procure por qualquer palavra, em português ou inglês.</p>'+
  '<input id="glQ" class="search" type="search" placeholder="Buscar, por exemplo ducking ou barramento" aria-label="Buscar no glossário">'+
  '<div class="chips" id="glC">'+cats.map(function(c){return '<button class="btn'+(c==='Todos'?' on':'')+'" data-c="'+c+'">'+c+'</button>'}).join('')+'</div>'+
  '<div id="glL" class="gl"></div></div>';
  $('#glQ').oninput=function(){q=this.value.toLowerCase();list()};
  $$('#glC button').forEach(function(b){b.onclick=function(){cat=b.dataset.c;$$('#glC button').forEach(function(x){x.classList.toggle('on',x===b)});list()}});
  list();
}
function list(){
  var out=G.filter(function(g){return (cat==='Todos'||g.c===cat)&&(!q||(g.t+' '+g.en+' '+g.d+' '+g.w).toLowerCase().indexOf(q)>-1)});
  $('#glL').innerHTML=out.length?out.map(function(g){return '<article class="term"><h3>'+g.t+' <small>'+g.en+'</small></h3><p>'+g.d+'</p><p class="nw"><b>No Wakagi</b> '+g.w+'</p>'+(g.tab?'<a href="#'+g.tab+'">Ver na demo</a>':'')+'</article>'}).join(''):'<p class="hint">Nenhum termo encontrado.</p>';
}
WKM.register({id:'glossario',build:build});
})();
