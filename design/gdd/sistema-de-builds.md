# GDD: Sistema de Builds (Atributos, Árvore de Habilidades e Loadout)

*Criado: 15/07/2026*
*Status: Rascunho aprovado em conceito (valores sujeitos a balanceamento)*
*Documento-pai: [capitulo-2-concept.md](capitulo-2-concept.md)*

---

## 1. Visão Geral (Overview)

Sistema que transforma cada herói em um projeto pessoal do jogador: 7 atributos distribuíveis com afinidades por herói, árvore de habilidades com tronco comum (níveis 1–15) e bifurcação em vocações (nível 20+), loadout de 5 habilidades + 1 Ultimate, e respec com custo. É a fundação dos modos História e Versus — a identidade vem do kit fixo; a flexibilidade vem dos pontos.

## 2. Fantasia do Jogador (Player Fantasy)

"**Meu** João não é igual ao seu." O jogador sente que criou seu herói: escolheu onde investir, qual vocação seguir, quais habilidades levar. No Versus, a vitória vem da build bem pensada, não de grind — o duelo é de ideias de construção.

## 3. Regras Detalhadas (Detailed Rules)

### 3.1 Os 7 Atributos

| Atributo | Efeito | Ganho por melhoria |
|----------|--------|--------------------|
| **HP** | Vida máxima | +10 |
| **Ataque** | Dano de habilidades físicas | +2 |
| **Ataque Especial** | Dano de habilidades mágicas/arcanas E poder de cura | +2 |
| **Defesa Física** | Reduz dano físico recebido | +2 |
| **Defesa Mágica** | Reduz dano mágico recebido | +2 |
| **Velocidade** | Posição na fila de iniciativa | +2 |
| **Letalidade** | Chance de acerto crítico (crítico = 1,5× dano) | +1% |

- **Toda habilidade tem um tipo**: Física (usa Ataque vs Defesa Física) ou Mágica (usa Ataque Especial vs Defesa Mágica).
- **Curas escalam com Ataque Especial** — curandeiro que investe em Atq. Especial cura mais.
- Letalidade base de todo herói: **5%**. Crítico não se aplica a curas.
- Inimigos também possuem os 7 atributos (rework das fichas de inimigos necessário).

### 3.2 Níveis e Pontos

- **Nível máximo: 50** (régua definida pelo João em 15/07/2026)
- **3 pontos de atributo por nível** (do nível 2 ao 50 → 147 pontos na jornada completa)
- Pontos não gastos ficam acumulados (sem punição por guardar)

### 3.3 Afinidades e Custos (a regra do "desvio caro")

Cada herói tem **3 atributos de afinidade** (seu direcionamento natural):

| Custo | Condição |
|-------|----------|
| **1 ponto** por melhoria | Atributo de afinidade do herói |
| **2 pontos** por melhoria | Atributo fora da afinidade |

**Afinidades propostas** (sujeitas a ajuste quando cada kit for detalhado):

| Herói | Afinidades | Leitura do arquétipo |
|-------|-----------|----------------------|
| João | HP, Ataque Especial, Defesa Mágica | Cavaleiro-arcano controlador |
| Djonga | Ataque, Letalidade, HP | Lutador de impacto |
| Luan | Ataque, Velocidade, Defesa Física | Espadachim/guardião |
| Lorenzo | HP, Defesa Física, Ataque Especial | Baluarte curandeiro |
| Thomas | Letalidade, Velocidade, Ataque | Assassino das sombras |
| Ministro | Ataque Especial, Defesa Mágica, Velocidade | Alquimista venenoso |

- **Teto por atributo: 30 melhorias** — ninguém vira deus em tudo; escolher é obrigatório.
- Você pode **entortar** o arquétipo (João tank, Luan resistente), pagando o dobro — mas nunca **inverter** completamente (o teto + custo dobrado garantem isso).

### 3.4 Cronograma de Desbloqueio de Habilidades

**Tronco — igual para TODOS os heróis** (definido pelo João em 15/07/2026):

| Nível | Desbloqueio |
|-------|-------------|
| 1 | 1ª habilidade básica + Ultimate inicial |
| 5 | 2ª habilidade básica |
| 10 | 3ª habilidade básica |
| 15 | 4ª habilidade básica |
| 20 | **VOCAÇÃO** — escolha exclusiva: Esquerda ou Direita |

**Pós-20 — os níveis exatos VARIAM por herói** (template de referência):

| Faixa | Desbloqueio (template) |
|-------|------------------------|
| 20 | Passiva da vocação escolhida |
| ~25 | 1ª habilidade da vocação |
| ~30 | **CAMINHO** — 2ª bifurcação dentro da vocação |
| ~35–45 | Habilidades do caminho escolhido |
| 50 | Habilidade/evolução de ápice (ex: Ultimate evoluída) |

Cada herói distribui esses marcos em níveis ligeiramente diferentes — dá personalidade de progressão sem quebrar o padrão mental do jogador.

### 3.5 Loadout

- **5 slots de habilidade + 1 slot de Ultimate** por herói
- O herói desbloqueia mais habilidades do que cabe — montar o loadout é parte do jogo
- Gerenciado no **Salão da Ordem**; travado durante batalhas

### 3.6 Respec (redistribuir pontos e escolhas)

| Modo | Regra |
|------|-------|
| **História** | Custa 1 **Cápsula de Reset** (item raro de drop/recompensa). Futuro: NPC (vendedor/mago) presta o serviço |
| **Versus** | Livre/custo simbólico — experimentar builds é o coração do modo |

- O respec devolve TODOS os pontos de atributo e reabre vocação + caminho
- Habilidades no loadout que deixarem de existir após respec são removidas automaticamente

### 3.7 Regra de justiça do Versus

Todos os jogadores da mesma faixa de nível têm o **mesmo orçamento de pontos**. Vantagem vem das escolhas (afinidades, vocação, caminho, loadout), nunca de grind. Pareamento por faixa de nível (detalhes no futuro GDD do Versus).

## 4. Fórmulas (Formulas)

### 4.1 Dano (base Pokémon, simplificada)

```
Dano = Poder × (AtaqueRelevante ÷ DefesaRelevante) × Variação
```

- **Poder**: valor fixo de cada habilidade (definido no GDD de cada herói)
- **AtaqueRelevante**: Ataque (habilidade física) ou Ataque Especial (mágica)
- **DefesaRelevante**: Defesa Física ou Defesa Mágica do alvo, conforme o tipo
- **Variação**: aleatório entre 0,90 e 1,10
- **Crítico**: se rolar (chance = Letalidade), multiplica por **1,5**
- **Dano mínimo**: 1 (a divisão nunca zera o dano — defesa reduz, não imuniza)
- Defender (ação de batalha): mantém a redução de 50% do dano final, como hoje

### 4.2 Cura

```
Cura = PoderDeCura × (AtaqueEspecial ÷ 100) × Variação(0,95–1,05)
```

Curas não criticam.

### 4.3 Atributos totais de um herói

```
AtributoFinal = Base do herói + (Crescimento automático × (nível−1)) + (Melhorias investidas × ganho) + Equipamentos + Pet
```

- **Crescimento automático**: pequeno ganho fixo por nível (mantém o "piso" do arquétipo mesmo sem investir — herança do sistema atual de `hpGrow`/`atkGrow`)
- Valores de base e crescimento por herói: definidos no GDD de cada herói

### 4.4 Curva de XP (proposta inicial — calibrar com conteúdo)

```
XP para subir do nível L = 60 × L^1,5
```

Substitui a curva atual (`60 × L^1,45`, teto 10). Precisa ser calibrada junto com o XP concedido por inimigos das regiões (que escalam por progresso).

## 5. Casos Extremos (Edge Cases)

- **Pontos não gastos + level up**: acumulam sem limite; nenhuma janela obrigatória de gasto
- **Respec com equipamento que exige atributo**: v1 não tem requisitos de atributo em equipamentos — sem conflito (revisar se equipamentos ganharem requisitos)
- **Loadout com menos de 5 habilidades** (início de jogo): permitido; slots vazios
- **Teto de atributo atingido**: botão de melhoria desabilita; pontos podem ir a outro atributo
- **Letalidade acima de 100%**: impossível pelo teto (5% base + 30% máx. de melhorias + bônus de equipamentos/pet limitados — cap rígido de 60% por segurança)
- **Herói recrutado com jogador em nível alto**: herói novo entra no nível médio da equipe (evita grind chato de nivelar do 1); pontos retroativos concedidos integralmente

## 6. Dependências (Dependencies)

- **Combate em grupo** (até 4 heróis) — consome os atributos na batalha
- **Salão da Ordem** — interface de gasto de pontos, vocação, loadout
- **Equipamentos v1** — somam atributos na fórmula 4.3
- **Pets v1** — somam atributos/efeitos na fórmula 4.3
- **Rework de inimigos** — fichas com 7 atributos + tipo de dano por golpe
- **Migração de save** (localStorage) — schema novo: pontos, afinidades, vocação, caminho, loadout por herói
- **Futuro GDD do Versus** — faixas de pareamento e orçamento igualitário

## 7. Válvulas de Ajuste (Tuning Knobs)

| Válvula | Valor inicial | Observação |
|---------|---------------|------------|
| Pontos por nível | 3 | Baixar para 2 se builds ficarem "completas demais" |
| Teto por atributo | 30 melhorias | Controla o quão extremo uma build fica |
| Custo fora de afinidade | 2× | A alma da regra do desvio |
| Multiplicador de crítico | 1,5× | Padrão da indústria |
| Letalidade base / cap | 5% / 60% | Cap de segurança |
| Ganhos por melhoria | tabela 3.1 | Balancear com fórmula de dano |
| Curva de XP | 60 × L^1,5 | Calibrar com XP dos inimigos por região |
| Variação de dano | 0,90–1,10 | Menos variação = mais tático |

## 8. Critérios de Aceite (Acceptance Criteria)

1. Jogador ganha exatamente 3 pontos ao subir de nível; pontos acumulam se não gastos
2. Melhoria em afinidade custa 1 ponto; fora de afinidade custa 2; teto de 30 melhorias por atributo é respeitado
3. Habilidades desbloqueiam nos níveis 1/5/10/15; vocação disponível apenas no nível 20; caminho apenas após vocação
4. Escolher vocação Esquerda bloqueia permanentemente a Direita (até respec) e vice-versa
5. Dano físico usa Ataque vs Defesa Física; mágico usa Ataque Especial vs Defesa Mágica; dano mínimo 1
6. Crítico ocorre na frequência da Letalidade (teste estatístico em N=1000 ataques, tolerância ±2%) e multiplica por 1,5
7. Curas escalam com Ataque Especial e nunca criticam
8. Loadout limita 5 habilidades + 1 ult; alterável apenas fora de batalha
9. Cápsula de Reset devolve todos os pontos e reabre vocação/caminho; loadout inválido é limpo automaticamente
10. Save antigo (nível ≤10, árvore antiga) migra sem perda de progresso percebida

---

## Anexo: Árvore do João no novo modelo (esboço de referência)

**Tronco** (habilidades atuais realocadas):
- Nv 1: Correntes Azuis (mágica — dano + lentidão) + Ult Jardim de Ferro
- Nv 5: Espinhos da Rosa (mágica — dano + veneno)
- Nv 10: Pétalas Vítreas (cura 30% + postura defensiva)
- Nv 15: Prisão de Ferro (mágica — dano alto + atordoamento)

**Nível 20 — VOCAÇÃO DO FERRO** (controle):
- Passiva "Peso das Correntes": +15% dano em alvos com lentidão/atordoamento
- Nv 25: Correntes Gêmeas (atinge 2 alvos + lentidão)
- Nv 30: caminho **Carcereiro** (controle: mais atordoamento) ou **Executor** (dano em alvos controlados)
- Nv 35–45: habilidades do caminho (detalhar no GDD do João)
- Nv 50: Jardim de Ferro — forma final

**Nível 20 — VOCAÇÃO DA ROSA** (sustain):
- Passiva "Seiva Vital": curas de João aplicam regeneração adicional
- Nv 25: Roseira Guardiã (cura aliado + espinhos refletem dano)
- Nv 30: caminho **Jardineiro** (cura de grupo) ou **Venenoso** (veneno amplificado)
- Nv 35–45: habilidades do caminho (detalhar no GDD do João)
- Nv 50: Florescer — forma final

*(Ultimate Florescer deixa de ser compra avulsa da árvore antiga e vira recompensa da Vocação da Rosa.)*
