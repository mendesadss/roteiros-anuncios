# Roteiros de Anúncio, Global Brand

Central dos roteiros de vídeo pro **Meta Ads** do `@mendes.adss`. Objetivo do funil:
o anúncio atrai seguidor pro perfil, o perfil nutre, a mentoria é vendida depois.
**O CTA de todo vídeo é o follow, nunca a venda.**

**No ar:** https://mendesadss.github.io/roteiros-anuncios/

> Banco de conteúdo orgânico (ganchos, roteiros de Reels e ideias) fica em outro lugar:
> https://mendesadss.github.io/banco-de-ganchos/

## Como está organizado

| Arquivo | O que é |
|---|---|
| `dados.json` | **Todos os roteiros.** É o único arquivo que muda no dia a dia |
| `index.html` | A página. Lê o `dados.json`. Quase nunca muda |
| `sw.js` | Service worker (network-first, funciona offline) |
| `manifest.webmanifest`, `icon*.svg` | Instalação como app no celular |

## As abas

- **Fala** — talking head. Lotes V1 Fundação, V1 Viral, V2 Fundação e V2 Viral Máximo
- **Split-screen** — você embaixo falando, infográfico em cima. Cada cena traz o prompt pro ChatGPT
- **Narrados** — narração com B-roll, cena a cena, por persona (gestor de tráfego, infoprodutor, COD, etc.)
- **Arquivo** — o que já foi gravado

Marcou o checkbox, o roteiro sai da aba e vai pro Arquivo.

## Origem dos dados

Importado em 19/07/2026 de `global-brand/ADS Mendes/`:

| Fonte | Qtd | Vira |
|---|---:|---|
| `Roteiros 01 a 10.md` | 10 | V1 Fundação |
| `Roteiros 11 a 20 (viral maximo).md` | 10 | V1 Viral |
| `Roteiros V2 - Curto e Direto (sub-1min).md` | 20 | V2 Fundação + V2 Viral Máximo |
| `Roteiros + Prompts de Infografico (split-screen).md` | 11 | Split-screen |
| `ADS 13-07-26/banco-de-roteiros.html` | 10 | Narrados (B-roll) |

Total: **61 roteiros**.

## Estrutura do dados.json

```jsonc
{
  "versao": 1,
  "atualizado": "2026-07-19",
  "objetivo": "...",
  "lotes": ["V1 Fundação", "..."],
  "roteiros": [{
    "id": "v1-01",              // v1- vr- v2- sp- nr-
    "grupo": "fala|split|narrado",
    "lote": "V1 Fundação",
    "titulo": "...",
    "gancho": "...",            // os 3 primeiros segundos
    "corpo": "...",             // sem repetir gancho nem CTA
    "cta": "...",               // sempre pedindo o follow
    "duracao": "40 a 50s",
    "formato": "...", "angulo": "...", "cenario": "...",
    "legenda": "...", "visual": "...",
    "variacoes": ["..."],       // ganchos alternativos, opcional
    "cenas": [{ "n":1, "tempo":"0-6s", "tela":"...", "fala":"...",
                "cena":"...", "prompt":"..." }]   // split e narrado
  }]
}
```

## Para adicionar roteiro

Skill `/subir-anuncio` no Claude Code. Só acrescenta no `dados.json` e faz push.

## Regras de conteúdo (não negociar)

- CTA sempre no **follow**, nunca na venda. O avatar é cético e pedir venda ativa a defesa de "lá vem guru"
- **Nunca prometer atalho, renda garantida ou fórmula mágica.** É o gatilho de "golpe" pra esse público, e é reprovação no Meta
- Vertical 9:16, câmera na mão, cru. Nada de estúdio de guru
- Gancho nos 3 primeiros segundos, legenda queimada o tempo todo
