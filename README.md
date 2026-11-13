# Áudio adaptativo do Projeto Wakagi

Página de apoio do TCC sobre o **Audio Design Document (ADD)** do Projeto Wakagi, jogo de sobrevivência e furtividade do LEDES Games (Faculdade de Computação, UFMS). Tudo roda no navegador, sem instalação e sem servidor.

ADD v1.4 · [DOI 10.5281/zenodo.24075847](https://doi.org/10.5281/zenodo.24075847) · documento sob CC BY 4.0 · código sob MIT.

## O que tem

**Ouvir o jogo**

1. Mixagem em 3D, com mascaramento, ducking por prioridade, Modo Escuta e o snapshot da lenda
2. Passos, com os parâmetros Superficie e Postura
3. Música como máquina de estados, com transição quantizada
4. Voice stealing, com os níveis S a F

**Conceitos do ADD**

5. Dinâmica, com ducking (side-chain), compressor e limiter, cada um com gráfico e som
6. Barramentos, a hierarquia até o Master com medidores ao vivo
7. Espaço, com distância, direção e oclusão
8. Parâmetros como curvas e snapshots em "antes e depois"
9. Silêncio e contraste de segurança

**Método e referência**

- Rastreabilidade, do ADD ao jogo, com a aderência dos nove itens e as cinco revisões
- Glossário com os termos em inglês, a definição e o exemplo do Wakagi
- Links e QR Code do DOI e do site

Cada gráfico marca o que é **do projeto**, o que é **ilustrativo** e o que é **conceito de apoio**, para não confundir a explicação com o que o ADD especifica.

Atalhos: teclas `1` a `9` trocam de aba, `E` liga o Modo Escuta, e o botão "Letras maiores" ajuda no projetor.

Para gerar o QR por linha de comando, use `python3 tools/make_qr.py URL nome` (requer `pip install segno`).

## Trocar os sons sintetizados pelas gravações

Veja `assets/audio/README.md`. É só colocar os arquivos na pasta e listá-los em `manifest.json`. O que não tiver arquivo continua sintetizado.

## Estrutura

```
index.html          página única
css/                estilos
js/app.js           áudio, mixer 3D, passos, música e voice stealing
js/ui.js            utilidades dos módulos
js/modules/         um arquivo por conceito
js/vendor/          gerador de QR Code (MIT)
assets/audio/       sons reais, opcional
assets/qr/          QR Codes
tools/make_qr.py    gerador de QR em PNG e SVG
```

## Limites

Os sons são sintetizados no navegador e não são os assets do jogo. As curvas dos parâmetros são ilustrativos. O Legend_BichoDoMato usa os níveis do projeto no FMOD. A página explica o comportamento do ADD, e não substitui o jogo.
