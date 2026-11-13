# Sons reais

Coloque aqui os arquivos gravados e liste cada um em `manifest.json`.
Enquanto uma chave não tiver arquivo, o site continua usando o som sintetizado dela.

Chaves aceitas:

| Chave | Quando toca |
| --- | --- |
| `passos_Terra`, `passos_Grama`, `passos_Madeira`, `passos_Agua`, `passos_Lama`, `passos_FolhasSecas`, `passos_Galho`, `passos_Concreto`, `passos_Pedra`, `passos_PisoCeramico` | Passo na superfície escolhida |
| `onca`, `jacare`, `capivara` | Botões de fauna próxima |
| `ave` | Fauna distante e ambiência do dia |
| `garrafa` | Pé-de-garrafa |
| `bicho` | Bicho-do-mato (também aciona o snapshot da lenda) |

Exemplo de `manifest.json`:

```json
{
  "passos_Terra": ["passos_terra_01.wav", "passos_terra_02.wav"],
  "onca": ["onca_01.ogg"]
}
```

Dicas

- Prefira arquivos curtos, mono ou estéreo, normalizados em torno de −6 dBFS.
- Os sons passam pelos mesmos barramentos, filtros e snapshots dos sintetizados, então o comportamento da mixagem continua igual.
- Abrindo o `index.html` direto do disco (`file://`) o navegador bloqueia o carregamento. Teste com um servidor local (`python3 -m http.server`) ou direto no GitHub Pages.
