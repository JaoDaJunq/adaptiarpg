# Conceito de Expansão: Reino de Adaptia — Capítulo II e Fundações

*Criado: 15/07/2026*
*Status: Rascunho (aguardando revisão do João)*
*Base: sessão de brainstorm de 15/07/2026*

---

## Pitch da Expansão

> O Reino de Adaptia deixa de ser a jornada solo de João e vira a saga da **Ordem dos Seis**: o jogador escolhe seu herói inicial, recruta os demais na ordem que quiser explorando as regiões corrompidas de Adaptia, e monta uma equipe de até 4 heróis — cada um com build própria via árvore de habilidades bifurcada. No horizonte: um modo Versus (X1 online) onde cada jogador duela com a equipe que construiu.

---

## Identidade Central

| Aspecto | Detalhe |
| ---- | ---- |
| **Gênero** | RPG por turnos com combate em grupo |
| **Plataforma** | Web/Browser (GitHub Pages + Supabase) — sem engine, JS vanilla |
| **Jogadores** | Single-player (História) → futuro PvP 1v1 (Versus) |
| **Estado atual** | Capítulo I publicado e funcional (1 herói jogável: João) |
| **Modelo** | Atualizações contínuas — "nada 100% fechado" |

---

## A Decisão Estrutural: Dois Modos de Jogo

O conflito "como desbloquear personagens sem quebrar o jogo" se resolve separando dois modos com regras de acesso próprias:

### Modo História (campanha)
- Continuação da campanha existente (Capítulo I: Colinas de Lajeado / Grug)
- Heróis são recrutados **pela narrativa**, na ordem que o jogador escolher (ver Hub de Regiões)
- Limite de grupo em batalha impede o "time fodão quebrado"

### Modo Versus (visão futura — X1 online)
- Cada jogador escolhe SEU personagem/equipe desde o início — **nada trancado por história**
- Duelo de builds: mesma verba de pontos para todos, vantagem vem das escolhas, não de grind
- Salto técnico pesado (estado de partida online via Supabase) — fica para fase posterior; tudo antes disso é fundação para ele

---

## Combate em Grupo

- **Até 4 heróis em campo** por batalha (fantasia do quarteto: tank, mago, assassino, cura)
- Mesma lógica que os inimigos já usam hoje: cada herói entra na fila de iniciativa pela própria velocidade
- Cada herói tem vida, medidor de Ultimate e recargas próprios (o modelo do João, multiplicado)
- O motor de batalha atual já suporta múltiplas unidades por lado (lado inimigo) — é estender a simetria, não reescrever
- **Escalação**: antes de entrar em qualquer região, o jogador seleciona quais heróis leva
- Futuro (não é v1): combos/sinergias entre heróis (ex: Thomas aplica status → Djonga amplifica)

---

## Estrutura da Campanha: Hub de Regiões

> A vanguarda de Malvorax corrompe várias regiões de Adaptia ao mesmo tempo. Os heróis da Ordem estão espalhados, cada um segurando uma frente. O jogador escolhe qual frente reforçar primeiro.

- **Herói inicial livre**: o jogador escolhe QUALQUER herói disponível para começar (a intro atual já promete isso: "Escolha o líder que guiará a Ordem")
- Cada região é o **mini-capítulo de um herói**: fases com a cara dele, test drive do kit, recrutamento no clímax
- **Test drive**: o herói da região entra como aliado emprestado numa fase ANTES de se juntar oficialmente — o jogador sente o estilo dele na prática
- Sabores de recrutamento (para não ficar repetitivo):
  - **Resgate** (candidato: Lorenzo — protegendo refugiados, cercado)
  - **Duelo** (candidato: Djonga — te desafia antes de aceitar)
  - **Missão paralela** (candidato: Thomas — objetivo próprio que cruza com o seu)
- **Dificuldade escala por progresso**: a 1ª região que o jogador entrar (qualquer uma) é a mais fraca, a 2ª mais forte, e assim por diante — o mundo acompanha o jogador
- **Fortaleza do Malvorax**: DECISÃO ADIADA — estruturar as regiões dos heróis primeiro

---

## Sistema de Identidade dos Heróis

Regra de ouro: **a identidade vem do kit; a flexibilidade vem dos atributos.**

### Camada 1 — Kit fixo
As habilidades de cada herói são exclusivas e imutáveis. João é correntes e controle em qualquer build.

### Camada 2 — Arquétipo com desvio caro
Cada herói tem direcionamento padrão. Atributos podem **entortar, não inverter**: subir atributo fora da vocação custa mais pontos (ex: +vida custa 2 no Luan assassino, 1 no Lorenzo tank).

### Camada 3 — Árvore de habilidades bifurcada (modelo padrão)

```
     TRONCO (níveis 1 / 5 / 10 / 15)
   4 habilidades básicas — igual para todos os heróis
              │
       VOCAÇÃO (nível 20)
      escolha exclusiva: ESQUERDA ou DIREITA
        │               │
    Caminhos A / B   Caminhos C / D
   (pós-20 — níveis exatos variam por herói)
```

- **Nível máximo: 50.** Tronco nos níveis 1/5/10/15, vocação no 20, caminhos e ápice distribuídos até o 50
- **4 builds finais por herói** (2 vocações × 2 caminhos) → 24 arquétipos com 6 heróis
- Regras completas, atributos (7), fórmulas e custos: ver **[sistema-de-builds.md](sistema-de-builds.md)**

### Camada 4 — Passiva única
Cada herói tem um traço passivo que é a personalidade dele em mecânica (ex: Djonga ganha ataque ao apanhar; Lorenzo cura o aliado mais ferido ao fim do turno dele).

### Loadout: 5 habilidades + 1 Ultimate
O herói desbloqueia mais habilidades do que cabe nos slots — montar a build (escolher as 5 + ult que sinergizam) é parte do jogo. Gerenciado no Salão da Ordem.

### Respec (redistribuir pontos)
- **História**: tem custo — item "Cápsula de Reset"; mais adiante um NPC (vendedor/mago) que presta o serviço
- **Versus**: livre/barato — experimentar builds é o coração do modo

---

## As 3 Primeiras Árvores

### João — Ferro vs Rosa
O kit atual já é bifurcado por natureza:
- **Vocação do Ferro** (controle): Correntes Azuis (dano+lentidão), Prisão de Ferro (atordoa), ult Jardim de Ferro (dano em área + atordoa)
- **Vocação da Rosa** (sustain): Espinhos da Rosa (veneno), Pétalas Vítreas (cura+defesa), ult Florescer (área + cura + regeneração)
- As 4 habilidades atuais viram o tronco; cada vocação evolui seu lado. Quase nada do existente se perde.

### Djonga — Sistema de Sequência de Socos
- Soco **esquerdo = fogo** 🔥, soco **direito = gelo** ❄
- O jogo memoriza os **últimos 3 socos**; a sequência dispara efeitos:

| Sequência | Efeito (proposta inicial — balancear depois) |
|-----------|------|
| 🔥🔥🔥 | Combustão — dano forte + queimadura |
| ❄❄❄ | Congelamento — atordoa o alvo |
| 🔥❄🔥 | Choque térmico — dano crítico |
| ❄🔥❄ | Fragilizar — alvo recebe +dano de todas as fontes |

- O turno do Djonga é planejamento: "qual soco dou agora para armar a sequência dali a 2 turnos?"
- Vocações: **Brasa** (amplifica fogo, dano contínuo) vs **Geada** (amplifica gelo, controle)

### Luan — Fúria vs Baluarte (espadachim/guardião)
- **Fúria** (berserker): quanto menos vida, mais dano; Corte em Cone atinge múltiplos inimigos — risco e recompensa
- **Baluarte** (guardião): provoca inimigos a atacá-lo, postura de contra-ataque
- Diferenciação do Lorenzo (também protetor): **Luan tanca absorvendo e contra-atacando** (agressivo); **Lorenzo protege curando e escudando aliados** (suporte). Rivalidade narrativa potencial entre os dois.

---

## Equipamentos

4 slots por herói, estilo RPG clássico:

| Slot | Exemplos |
|------|----------|
| Arma | Espada (Luan), Livro Mágico (Ministro), Manoplas (Djonga) |
| Armadura | Peitoral, manto, cota |
| Acessório 1 | Anel |
| Acessório 2 | Colar |

- Estende o sistema de drops de fase que já existe (hoje dropa poções)
- Chefes dropam peças marcantes (ex: "Clava do Rei Grug")
- **v1**: efeitos simples, só atributos (+vida, +ataque). Efeitos especiais ("veneno ao atacar") ficam para camada 2.

---

## Pets — Criaturas Purificadas

Tema: Malvorax corrompe as criaturas de Adaptia (os javalis "enfurecidos pela corrupção" já estão na lore). Ao libertar uma região, o jogador **purifica** uma criatura dela, que vira pet.

- O Rato Selvagem da fase 1-1 é o primeiro pet do jogo
- Cada região tem seu pet característico → incentivo a completar todas
- Reaproveita arte dos inimigos existentes = barato de produzir
- **Mecânica v1**: cada herói equipa 1 pet; o pet dá **1 bônus passivo** (ex: +10% velocidade) + **1 gatilho automático por batalha** (ex: herói abaixo de 30% de vida → pet cura 15%). Sem microgerenciamento.
- Evolução/raridade: fica para depois. No Versus, o pet entra na verba de pontos da build.

---

## Salão da Ordem (tela de gerenciamento de equipe)

Quartel-general do jogador. Para cada herói do elenco:
- Árvore de habilidades (gastar pontos, escolher vocação/caminhos)
- Loadout de habilidades (5 + ult)
- Equipamentos (equipar/desequipar os 4 slots)
- Pet equipado
- Atributos e status

Complementa a **tela de escalação** (escolher até 4 heróis antes de cada região).

---

## Riscos e Pontos de Atenção

### Risco de escopo (o maior)
- **Herói inicial livre exige kit completo para cada herói disponível** (4 habilidades de tronco + vocações + ults + passiva + sprites). Hoje só João tem isso.
- Mitigação: lançar com 2-3 heróis iniciais prontos e liberar os demais em atualizações ("novo herói jogável" também é marketing de retorno).

### Risco técnico
- Modo Versus online é o salto mais pesado (estado de partida no Supabase, sincronização, matchmaking). Está isolado no fim da fila justamente por isso.
- O save atual (localStorage) precisará evoluir para acomodar múltiplos heróis, equipamentos, pets e builds.

### Risco de design
- Balancear 24 builds finais × sequências do Djonga × equipamentos é combinatório. Começar simples (v1 de tudo) e balancear por iteração.

---

## Perguntas em Aberto

1. **Elenco de lançamento do Capítulo II**: quantos heróis com kit completo no lançamento — 2, 3, ou todos os 6? (pendente de decisão)
2. **Árvores de Thomas, Lorenzo e Ministro**: conceitos de vocação ainda não desenhados
3. **História das regiões**: enredo de cada mini-capítulo (só os sabores de recrutamento foram esboçados)
4. **Fortaleza do Malvorax**: quantas regiões liberam o acesso (adiado por decisão)
5. **Detalhes do Versus**: formato de partida, ranking, pareamento — adiado
6. ~~Atributos editáveis~~ → **RESOLVIDO em 15/07/2026**: 7 atributos, 3 pontos/nível, afinidades — ver [sistema-de-builds.md](sistema-de-builds.md)

---

## Ordem de Construção Sugerida

1. **Sistema de builds/atributos + árvore bifurcada** — a fundação de tudo (refatorar a árvore do João para o novo modelo)
2. **Combate em grupo** (até 4 heróis, estender simetria do motor atual)
3. **Salão da Ordem + escalação**
4. **Equipamentos v1** (4 slots, só atributos)
5. **Kits de Djonga e Luan** + suas regiões (hub com 2 regiões iniciais)
6. **Demais heróis/regiões** em atualizações
7. **Pets v1**
8. **Modo Versus** (local/simulado primeiro, online depois)
9. **Polish visual** — contínuo/final, por decisão do João

---

## Decisões de Sessão (registro)

| Data | Decisão |
|------|---------|
| 15/07/2026 | Dois modos separados (História/Versus) com regras de acesso próprias |
| 15/07/2026 | Grupo de até 4 heróis em campo |
| 15/07/2026 | Hub de regiões com ordem de recrutamento livre + herói inicial livre |
| 15/07/2026 | Dificuldade escala por progresso (nº de regiões liberadas), não fixa por região |
| 15/07/2026 | Árvore: tronco (4 skills) → vocação (bifurcação nível 5) → 2 caminhos por vocação |
| 15/07/2026 | Loadout de 5 habilidades + 1 ult |
| 15/07/2026 | Respec com custo na História (Cápsula de Reset → NPC futuro); livre no Versus |
| 15/07/2026 | Sequência do Djonga: memória de 3 socos |
| 15/07/2026 | Fortaleza do Malvorax adiada — regiões dos heróis primeiro |
| 15/07/2026 | Documentação retroativa do Capítulo I: stand-by |
| 15/07/2026 | 7 atributos: HP, Ataque, Atq. Especial, Def. Física, Def. Mágica, Velocidade, Letalidade |
| 15/07/2026 | Letalidade = chance de crítico (1,5× dano) |
| 15/07/2026 | Nível máximo: 50 — tronco 1/5/10/15, vocação no 20, caminhos até o 50 |
| 15/07/2026 | Tronco igual para todos os heróis; níveis pós-20 variam por herói |
| 15/07/2026 | GDD do sistema de builds criado: [sistema-de-builds.md](sistema-de-builds.md) |
