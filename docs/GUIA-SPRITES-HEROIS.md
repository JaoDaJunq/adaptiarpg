# Guia — Sprites Pixel de Batalha dos Heróis

*Para completar a virada full pixel art. Gere os sprites e solte os arquivos nas pastas indicadas — o jogo já os procura por esses nomes.*

## Por que precisamos

A UI, os inimigos das regiões novas e os ícones já são pixel art. Falta o último passo pra batalha ficar 100% coerente: os **sprites de batalha dos heróis** em pixel (hoje o jogo usa os retratos ilustrados ampliados). Os retratos ilustrados continuam sendo usados nos **diálogos e menus** — só a batalha muda.

## Arquivos esperados (nomes exatos)

| Herói | Arquivo | Situação |
|-------|---------|----------|
| João | `assets/joao-battle.png` | já existe (ilustrado) — substituir por versão pixel |
| Djonga | `assets/heroes/djonga-battle.png` | criar |
| Luan | `assets/heroes/luan-battle.png` | criar |

## Especificações técnicas

- **PNG com fundo transparente**
- **Corpo inteiro**, de frente ou perfil ¾, virado para a **direita** (os heróis ficam à esquerda encarando os inimigos à direita)
- Resolução sugerida: **48×48 a 64×64 px** (pixel art nativo). O jogo escala com nitidez (nearest-neighbor).
- Paleta limitada, contornos definidos — no mesmo espírito dos inimigos atuais (32rogues) para casar
- Pose de "pronto para combate" (idle heroico)

## Prompts sugeridos (para gerador de IA de pixel art)

**João** — cavaleiro-arcano:
> "pixel art battle sprite, full body, young arcane knight with a red/white varsity jacket, holding glowing blue energy chains and a blue rose, heroic idle pose facing right, transparent background, 64x64, limited palette, crisp outlines, RPG battler style"

**Djonga** — lutador de punhos:
> "pixel art battle sprite, full body, muscular street fighter with wrapped fists, left fist wreathed in fire and right fist in ice, fighting stance facing right, transparent background, 64x64, limited palette, crisp outlines, RPG battler style"

**Luan** — espadachim-guardião:
> "pixel art battle sprite, full body, swordsman-guardian holding a sword and shield, confident battle stance facing right, transparent background, 64x64, limited palette, crisp outlines, RPG battler style"

> Dica: gere os três no mesmo gerador/estilo e, se possível, anexe um sprite dos inimigos (`assets/enemies/escudeiro.png`) como referência de estilo pra IA casar a "pegada" pixel.

## Opcional — inimigos das Colinas em pixel

Os inimigos das Colinas (rato, javali, goblins, Grug) ainda são ilustrados. Para coerência total, podem ser trocados por pixel do 32rogues no futuro (a folha `monsters.png` tem ratos, javalis, goblins e um rei goblin). Não é urgente — as Colinas funcionam bem como estão.
