(() => {
'use strict';

/* ═══════════════════ HELPERS ═══════════════════ */
const $ = s => document.querySelector(s);
const clamp = (n,a,b) => Math.max(a, Math.min(b,n));
const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const wait = ms => new Promise(r => setTimeout(r, ms));
const esc = t => String(t).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));

/* ═══════════════════ ÁUDIO (música: OpenGameArt CC0/CC-BY · SFX: CC0 — ver CREDITS.md) ═══════════════════ */
const AUDIO = {
  muted: localStorage.getItem('adaptia_muted') === '1',
  unlocked: false, current: null, el: null,
  tracks: {
    map:    'assets/audio/map-theme.mp3',
    battle: 'assets/audio/battle-theme.mp3',
  },
  sfxFiles: {
    hit:'assets/audio/sfx/hit.wav', hit2:'assets/audio/sfx/hit2.wav',
    magic:'assets/audio/sfx/magic.wav', spell:'assets/audio/sfx/spell.wav',
    battleStart:'assets/audio/sfx/battle-start.wav', potion:'assets/audio/sfx/potion.wav',
    click:'assets/audio/sfx/click.wav', select:'assets/audio/sfx/select.wav',
    enemyHurt:'assets/audio/sfx/enemy-hurt.wav', bossRoar:'assets/audio/sfx/boss-roar.wav',
  },
};

function playMusic(track) {
  AUDIO.wanted = track;
  if (AUDIO.muted || !AUDIO.unlocked) return;
  if (AUDIO.current === track && AUDIO.el && !AUDIO.el.paused) return;
  if (AUDIO.el) { AUDIO.el.pause(); AUDIO.el = null; }
  const src = AUDIO.tracks[track];
  if (!src) return;
  const el = new Audio(src);
  el.loop = true; el.volume = 0.32;
  el.play().catch(() => {});
  AUDIO.el = el; AUDIO.current = track;
}

function sfx(name, vol = 0.45) {
  if (AUDIO.muted || !AUDIO.unlocked) return;
  const src = AUDIO.sfxFiles[name];
  if (!src) return;
  try { const a = new Audio(src); a.volume = vol; a.play().catch(() => {}); } catch {}
}

function toggleMute() {
  AUDIO.muted = !AUDIO.muted;
  localStorage.setItem('adaptia_muted', AUDIO.muted ? '1' : '0');
  const btn = $('#btn-mute');
  if (btn) btn.textContent = AUDIO.muted ? '🔇' : '🔊';
  if (AUDIO.muted && AUDIO.el) { AUDIO.el.pause(); AUDIO.el = null; AUDIO.current = null; }
  else if (!AUDIO.muted && AUDIO.wanted) playMusic(AUDIO.wanted);
}

/* Navegadores exigem interação antes de tocar áudio */
function unlockAudio() {
  if (AUDIO.unlocked) return;
  AUDIO.unlocked = true;
  if (AUDIO.wanted) playMusic(AUDIO.wanted);
}

/* ═══════════════════ DADOS: ATRIBUTOS (ver design/gdd/sistema-de-builds.md) ═══════════════════ */
const ATTRS = ['hp','atk','atkEsp','defFis','defMag','vel','let'];
const ATTR_INFO = {
  hp:     { label:'VIDA',     gain:10 },
  atk:    { label:'ATAQUE',   gain:2 },
  atkEsp: { label:'ATQ.ESP',  gain:2 },
  defFis: { label:'DEF.FÍS',  gain:2 },
  defMag: { label:'DEF.MÁG',  gain:2 },
  vel:    { label:'VELOC.',   gain:2 },
  let:    { label:'LETAL.',   gain:1 }, // % de crítico
};
const POINTS_PER_LEVEL = 3;
const ALLOC_CAP = 30;        // máx. de melhorias por atributo
const LET_CAP = 60;          // teto rígido de chance de crítico (%)
const CRIT_MULT = 1.5;

/* ═══════════════════ DADOS: HERÓIS (ver design/gdd/capitulo-2-concept.md) ═══════════════════ */
const HEROES = {
  joao: {
    id:'joao', name:'João', title:'Rosa Azul / Correntes', arche:'Cavaleiro-arcano',
    portrait:'assets/joao.png', sprite:'assets/joao-battle.png',
    base: { hp:300, atk:20, atkEsp:30, defFis:20, defMag:24, vel:70, let:5 },
    grow: { hp:12,  atk:1,  atkEsp:2,  defFis:1,  defMag:1,  vel:1,  let:0 },
    affinities: ['hp','atkEsp','defMag'],
    ults: ['garden','bloom'], defaultUlt:'garden', firstSkill:'chains',
    lore: 'Cavaleiro-arcano da Ordem dos Seis. Empunha a Rosa Azul, relíquia que converte vontade em correntes de energia.'
  },
  djonga: {
    id:'djonga', name:'Djonga', title:'Punhos de Impacto', arche:'Lutador',
    portrait:'assets/djonga.png', sprite:'assets/heroes/djonga-battle.png',
    base: { hp:320, atk:32, atkEsp:12, defFis:22, defMag:14, vel:66, let:10 },
    grow: { hp:13,  atk:2,  atkEsp:0,  defFis:1,  defMag:1,  vel:1,  let:0 },
    affinities: ['atk','let','hp'],
    ults: ['sequencia'], defaultUlt:'sequencia', firstSkill:'soco_esq',
    lore: 'O Punho do Vale. Esquerda em brasa, direita em geada — a ordem dos socos decide o destino da luta.'
  },
  luan: {
    id:'luan', name:'Luan', title:'Corte em Cone', arche:'Espadachim-guardião',
    portrait:'assets/luan.png', sprite:'assets/heroes/luan-battle.png',
    base: { hp:340, atk:30, atkEsp:10, defFis:26, defMag:16, vel:74, let:8 },
    grow: { hp:14,  atk:2,  atkEsp:0,  defFis:1,  defMag:1,  vel:1,  let:0 },
    affinities: ['atk','vel','defFis'],
    ults: ['tempestade'], defaultUlt:'tempestade', firstSkill:'cone',
    lore: 'Espadachim do Bosque das Lâminas. Sua espada corta em arco — e seu escudo é o próprio corpo.'
  },
};
const LOCKED_HEROES = [
  { id:'thomas', name:'Thomas', title:'Lâminas / Sombras', portrait:'assets/thomas.png' },
  { id:'lorenzo', name:'Lorenzo', title:'Baluarte / Cura', portrait:'assets/lorenzo.png' },
  { id:'ministro', name:'Ministro', title:'Elixires / Veneno', portrait:'assets/ministro.png' },
];

const MAX_LEVEL = 50;
const xpForNext = lvl => Math.round(60 * Math.pow(lvl, 1.5));

/* Atributos finais = base + crescimento automático + melhorias + equipamentos */
function computeStats(heroId, hs) {
  const H = HEROES[heroId];
  const lvl = hs.level, alloc = hs.alloc || {};
  const st = {};
  ATTRS.forEach(a => {
    st[a] = H.base[a] + Math.floor(H.grow[a] * (lvl-1)) + (alloc[a]||0) * ATTR_INFO[a].gain;
  });
  Object.values(hs.equip || {}).forEach(itemId => {
    const it = EQUIPMENT[itemId];
    if (it) Object.entries(it.stats).forEach(([a, v]) => { st[a] = (st[a]||0) + v; });
  });
  st.let = Math.min(st.let, LET_CAP);
  st.maxHp = st.hp;
  return st;
}
const allocCost = (heroId, attr) => HEROES[heroId].affinities.includes(attr) ? 1 : 2;

/* Uma habilidade está desbloqueada se herói/nível/vocação/caminho conferem */
function skillUnlocked(heroId, hs, sk) {
  if (sk.hero !== heroId) return false;
  if (hs.level < sk.unlock) return false;
  if (sk.voc && hs.vocacao !== sk.voc) return false;
  if (sk.caminho && hs.caminho !== sk.caminho) return false;
  return true;
}
function ownedSkills(heroId, hs) { return Object.values(SKILLS).filter(sk => skillUnlocked(heroId, hs, sk)); }
function battleLoadout(heroId, hs) {
  return (hs.loadout || []).filter(id => SKILLS[id] && skillUnlocked(heroId, hs, SKILLS[id])).slice(0, 5);
}
function currentUlt(heroId, hs) {
  const u = ULTIMATES[hs.activeUlt];
  if (u && u.hero === heroId && (!u.voc || hs.vocacao === u.voc)) return u;
  return ULTIMATES[HEROES[heroId].defaultUlt];
}

/* ═══════════════════ DADOS: HABILIDADES ═══════════════════ */
/* hero: dono da habilidade | type: 'mag' usa Atq.Especial vs Def.Mágica, 'fis' usa Ataque vs Def.Física
   power: multiplicador da fórmula Dano = power × (Atq ÷ Def) × variação
   unlock: nível em que desbloqueia | voc/caminho: exigência de vocação/caminho
   punch: 'E'/'D' — socos do Djonga (alimentam a sequência) | selfCast: sem alvo inimigo */
const SKILLS = {
  /* ══════ JOÃO — TRONCO (níveis 1 / 5 / 10 / 15) ══════ */
  chains: {
    hero:'joao',
    id:'chains', name:'Correntes Azuis', type:'mag', power:17, unlock:1, cd:2,
    desc:'Prende o alvo com correntes de energia. Dano moderado e reduz a velocidade do inimigo por 2 turnos.',
    hint:'Dano + Lentidão'
  },
  thorns: {
    hero:'joao', id:'thorns', name:'Espinhos da Rosa', type:'mag', power:14, unlock:5, cd:3,
    desc:'Espinhos vítreos perfuram o alvo, envenenando-o. Dano leve + 12 de veneno por 3 turnos.',
    hint:'Dano + Veneno'
  },
  petals: {
    hero:'joao', id:'petals', name:'Pétalas Vítreas', type:'mag', power:0, unlock:10, cd:4, selfCast:true,
    desc:'A Rosa Azul floresce em volta de João, restaurando 30% da vida e assumindo postura defensiva até o próximo turno.',
    hint:'Cura 30% + Defesa'
  },
  prison: {
    hero:'joao', id:'prison', name:'Prisão de Ferro', type:'mag', power:20, unlock:15, cd:4,
    desc:'Correntes pesadas esmagam o alvo. Dano alto e atordoa por 1 turno.',
    hint:'Dano alto + Atordoamento'
  },
  /* ── VOCAÇÃO DO FERRO (nível 20+) ── */
  gemeas: {
    hero:'joao', id:'gemeas', name:'Correntes Gêmeas', type:'mag', power:14, unlock:25, voc:'ferro', cd:3,
    desc:'Duas correntes disparam ao mesmo tempo: atingem 2 inimigos e aplicam lentidão em ambos.',
    hint:'2 alvos + Lentidão'
  },
  tranca: {
    hero:'joao', id:'tranca', name:'Tranca Absoluta', type:'mag', power:16, unlock:35, voc:'ferro', caminho:'carcereiro', cd:4,
    desc:'A prisão definitiva: dano moderado, atordoa por 1 turno e aplica lentidão por 2.',
    hint:'Atordoa + Lentidão'
  },
  guilhotina: {
    hero:'joao', id:'guilhotina', name:'Guilhotina de Elos', type:'mag', power:26, unlock:35, voc:'ferro', caminho:'executor', cd:4,
    desc:'Elos afiados caem sobre o alvo. Dano brutal — ainda maior se o alvo estiver lento ou atordoado.',
    hint:'Dano brutal + bônus vs controlados'
  },
  /* ── VOCAÇÃO DA ROSA (nível 20+) ── */
  roseira: {
    hero:'joao', id:'roseira', name:'Roseira Guardiã', type:'mag', power:0, unlock:25, voc:'rosa', cd:4, selfCast:true,
    desc:'Uma roseira de vidro brota e envolve João: cura forte e regeneração por 3 turnos.',
    hint:'Cura + Regeneração'
  },
  chuva: {
    hero:'joao', id:'chuva', name:'Chuva de Pétalas', type:'mag', power:0, unlock:35, voc:'rosa', caminho:'jardineiro', cd:5, selfCast:true,
    desc:'Pétalas curativas cobrem o campo: cura 25% da vida e purifica veneno e lentidão.',
    hint:'Cura 25% + Purifica'
  },
  mortifera: {
    hero:'joao', id:'mortifera', name:'Rosa Mortífera', type:'mag', power:15, unlock:35, voc:'rosa', caminho:'venenoso', cd:4,
    desc:'A rosa mostra o outro lado da beleza: dano moderado + veneno devastador (20 por 3 turnos).',
    hint:'Dano + Veneno forte'
  },

  /* ══════ DJONGA — TRONCO (sequência de socos: memoriza os 3 últimos) ══════ */
  soco_esq: {
    hero:'djonga', id:'soco_esq', name:'Cruzado de Brasa', type:'fis', power:15, unlock:1, cd:0, punch:'E',
    desc:'Soco esquerdo envolto em fogo. Sem recarga — é o pão com manteiga do Djonga e alimenta a Sequência.',
    hint:'🔥 Soco esquerdo · sem recarga'
  },
  soco_dir: {
    hero:'djonga', id:'soco_dir', name:'Direto de Geada', type:'fis', power:15, unlock:5, cd:0, punch:'D',
    desc:'Soco direito coberto de gelo. Sem recarga. Combine esquerdas e direitas para disparar Sequências.',
    hint:'❄ Soco direito · sem recarga'
  },
  gancho: {
    hero:'djonga', id:'gancho', name:'Gancho Ascendente', type:'fis', power:22, unlock:10, cd:3,
    desc:'Um gancho brutal que arranca o alvo do chão. Não conta para a Sequência — é puro impacto.',
    hint:'Dano alto'
  },
  clinch: {
    hero:'djonga', id:'clinch', name:'Clinch', type:'fis', power:12, unlock:15, cd:4,
    desc:'Agarra e trava o oponente: dano leve e atordoamento por 1 turno.',
    hint:'Dano + Atordoamento'
  },
  /* Vocação da Brasa */
  pe_brasa: {
    hero:'djonga', id:'pe_brasa', name:'Pé na Brasa', type:'fis', power:20, unlock:25, voc:'brasa', cd:3,
    desc:'Chute flamejante que incendeia o alvo: dano + queimadura (14 por 2 turnos).',
    hint:'Dano + Queimadura'
  },
  fornalha_skill: {
    hero:'djonga', id:'fornalha_skill', name:'Abraço da Fornalha', type:'fis', power:16, unlock:35, voc:'brasa', caminho:'fornalha', cd:4,
    desc:'Incendeia TODOS os inimigos com queimadura (12 por 3 turnos).',
    hint:'Queimadura em área'
  },
  pavio_skill: {
    hero:'djonga', id:'pavio_skill', name:'Explosão do Pavio', type:'fis', power:28, unlock:35, voc:'brasa', caminho:'pavio', cd:4,
    desc:'Um único soco devastador com chance dobrada de crítico.',
    hint:'Dano brutal + crítico provável'
  },
  /* Vocação da Geada */
  nevasca: {
    hero:'djonga', id:'nevasca', name:'Nevasca de Jabs', type:'fis', power:12, unlock:25, voc:'geada', cd:3,
    desc:'Rajada de jabs congelantes em 2 inimigos: dano e lentidão em ambos.',
    hint:'2 alvos + Lentidão'
  },
  zero_skill: {
    hero:'djonga', id:'zero_skill', name:'Zero Absoluto', type:'fis', power:18, unlock:35, voc:'geada', caminho:'zero', cd:4,
    desc:'O frio que para tudo: dano + atordoamento por 1 turno.',
    hint:'Dano + Atordoamento'
  },
  granizo_skill: {
    hero:'djonga', id:'granizo_skill', name:'Tempestade de Granizo', type:'fis', power:13, unlock:35, voc:'geada', caminho:'granizo', cd:4,
    desc:'Golpeia TODOS os inimigos com punhos de gelo e aplica lentidão.',
    hint:'Área + Lentidão'
  },

  /* ══════ LUAN — TRONCO ══════ */
  cone: {
    hero:'luan', id:'cone', name:'Corte em Cone', type:'fis', power:13, unlock:1, cd:2,
    desc:'A espada varre em arco: atinge o alvo e mais um inimigo próximo.',
    hint:'2 alvos'
  },
  postura: {
    hero:'luan', id:'postura', name:'Postura do Guardião', type:'fis', power:0, unlock:5, cd:3, selfCast:true,
    desc:'Luan bate o punho no escudo e PROVOCA: inimigos são forçados a atacá-lo por 2 turnos, e ele assume postura defensiva.',
    hint:'Provocar + Defesa'
  },
  lamina_veloz: {
    hero:'luan', id:'lamina_veloz', name:'Lâmina Veloz', type:'fis', power:16, unlock:10, cd:2,
    desc:'Um corte rápido e certeiro. Recarga curta, dano confiável.',
    hint:'Dano rápido'
  },
  julgamento: {
    hero:'luan', id:'julgamento', name:'Julgamento', type:'fis', power:24, unlock:15, cd:4,
    desc:'Golpe pesado de duas mãos. Causa +50% de dano se Luan estiver abaixo de metade da vida.',
    hint:'Dano alto + bônus ferido'
  },
  /* Vocação da Fúria */
  corte_sangrento: {
    hero:'luan', id:'corte_sangrento', name:'Corte Sangrento', type:'fis', power:20, unlock:25, voc:'furia', cd:3,
    desc:'Luan sacrifica 8% da própria vida para desferir um corte devastador.',
    hint:'Dano alto · custa vida'
  },
  carnificina: {
    hero:'luan', id:'carnificina', name:'Carnificina', type:'fis', power:15, unlock:35, voc:'furia', caminho:'carnificina', cd:4,
    desc:'Cortes em TODOS os inimigos — mais fortes quanto menos vida Luan tiver.',
    hint:'Área + bônus ferido'
  },
  ultimo_fio: {
    hero:'luan', id:'ultimo_fio', name:'Último Fio', type:'fis', power:30, unlock:35, voc:'furia', caminho:'fio', cd:5,
    desc:'O golpe de quem não teme o fim: dano brutal, dobrado abaixo de 25% de vida.',
    hint:'Dano extremo ferido'
  },
  /* Vocação do Baluarte */
  muralha: {
    hero:'luan', id:'muralha', name:'Muralha Viva', type:'fis', power:0, unlock:25, voc:'baluarte', cd:4, selfCast:true,
    desc:'Provoca todos os inimigos por 2 turnos e recupera 15% da vida.',
    hint:'Provocar + Cura 15%'
  },
  escudo_espelho: {
    hero:'luan', id:'escudo_espelho', name:'Escudo-Espelho', type:'fis', power:0, unlock:35, voc:'baluarte', caminho:'espelho', cd:4, selfCast:true,
    desc:'Postura perfeita: defesa total e contra-ataque garantido no próximo turno.',
    hint:'Defesa + Contra-ataque'
  },
  quebra_cerco: {
    hero:'luan', id:'quebra_cerco', name:'Quebra-Cerco', type:'fis', power:17, unlock:35, voc:'baluarte', caminho:'cerco', cd:4,
    desc:'Investida de escudo em todos os inimigos: dano moderado e lentidão.',
    hint:'Área + Lentidão'
  },
};

/* Sequências do Djonga: os 3 últimos socos disparam efeitos (E=🔥 D=❄) */
const PUNCH_COMBOS = [
  { seq:'EEE', name:'COMBUSTÃO',      icon:'🔥🔥🔥', effect:'burn',   desc:'queimadura forte no alvo' },
  { seq:'DDD', name:'CONGELAMENTO',   icon:'❄❄❄',   effect:'stun',   desc:'atordoa o alvo' },
  { seq:'EDE', name:'CHOQUE TÉRMICO', icon:'🔥❄🔥', effect:'shock',  desc:'dano crítico garantido' },
  { seq:'DED', name:'FRAGILIZAR',     icon:'❄🔥❄',  effect:'expose', desc:'alvo fica lento e vulnerável' },
];

/* Vocações e caminhos por herói (bifurcação no nível 20; caminho no 30) */
const VOC_LEVEL = 20, PATH_LEVEL = 30, APEX_LEVEL = 50;
const VOCACOES = {
  joao: {
  ferro: {
    id:'ferro', name:'Vocação do Ferro', icon:'⛓️',
    tagline:'Controle absoluto — correntes, prisões e atordoamento.',
    passive:'Peso das Correntes: +15% de dano em alvos com lentidão ou atordoamento.',
    caminhos: {
      carcereiro: { id:'carcereiro', name:'Carcereiro', desc:'Ninguém escapa: mais atordoamento e lentidão.' },
      executor:   { id:'executor',   name:'Executor',   desc:'Dano pesado contra alvos controlados.' },
    },
    apex:'Nível 50 — Jardim de Ferro: Forma Final (dano maior + atordoa TODOS os inimigos).'
  },
  rosa: {
    id:'rosa', name:'Vocação da Rosa', icon:'🌹',
    tagline:'A rosa viva — cura, veneno e resistência.',
    passive:'Seiva Vital: toda cura de João também aplica regeneração por 2 turnos.',
    caminhos: {
      jardineiro: { id:'jardineiro', name:'Jardineiro', desc:'Cura amplificada e purificação.' },
      venenoso:   { id:'venenoso',   name:'Venenoso',   desc:'O espinho por trás da pétala: veneno devastador.' },
    },
    apex:'Nível 50 — Florescer: Forma Final (cura 50% + regeneração prolongada).'
  },
  },
  djonga: {
    brasa: {
      id:'brasa', name:'Vocação da Brasa', icon:'🔥',
      tagline:'O fogo que não apaga — dano contínuo e agressão.',
      passive:'Sangue Fervente: queimaduras causadas por Djonga são 50% mais fortes.',
      caminhos: {
        fornalha: { id:'fornalha', name:'Fornalha', desc:'Queimadura espalhada em todos os inimigos.' },
        pavio:    { id:'pavio',    name:'Pavio Curto', desc:'Explosões de dano crítico.' },
      },
      apex:'Nível 50 — Sequência Infinita: Forma Final (7 socos + queimadura em todos).'
    },
    geada: {
      id:'geada', name:'Vocação da Geada', icon:'❄',
      tagline:'O frio que trava a luta — controle e precisão.',
      passive:'Mãos Frias: +15% de dano em alvos com lentidão ou atordoamento.',
      caminhos: {
        zero:    { id:'zero',    name:'Zero Absoluto', desc:'Atordoamento em sequência.' },
        granizo: { id:'granizo', name:'Granizo', desc:'Controle em área.' },
      },
      apex:'Nível 50 — Sequência Infinita: Forma Final (7 socos + lentidão em todos).'
    },
  },
  luan: {
    furia: {
      id:'furia', name:'Vocação da Fúria', icon:'🩸',
      tagline:'Quanto mais fundo o corte, mais afiada a lâmina.',
      passive:'Fúria Crescente: +1% de dano para cada 2% de vida perdida (até +50%).',
      caminhos: {
        carnificina: { id:'carnificina', name:'Carnificina', desc:'Destruição em área alimentada pela dor.' },
        fio:         { id:'fio',         name:'Último Fio',  desc:'Golpes únicos de dano extremo.' },
      },
      apex:'Nível 50 — Tempestade de Aço: Forma Final (dano dobrado quando ferido).'
    },
    baluarte: {
      id:'baluarte', name:'Vocação do Baluarte', icon:'🛡',
      tagline:'A muralha que devolve cada golpe.',
      passive:'Represália: ao ser atacado, Luan contra-ataca com 30% do seu Ataque (1× por turno).',
      caminhos: {
        espelho: { id:'espelho', name:'Escudo-Espelho', desc:'Defesa perfeita e contra-ataques.' },
        cerco:   { id:'cerco',   name:'Quebra-Cerco',   desc:'Proteção agressiva em área.' },
      },
      apex:'Nível 50 — Tempestade de Aço: Forma Final (+ provoca e defende após o golpe).'
    },
  },
};

const ULTIMATES = {
  garden: {
    id:'garden', hero:'joao', name:'Jardim de Ferro', starter:true,
    shout:'JARDIM DE FERRO!',
    desc:'Um jardim de correntes irrompe do chão: dano pesado em TODOS os inimigos e atordoa o alvo principal.',
    hint:'Dano em área + Atordoamento'
  },
  bloom: {
    id:'bloom', hero:'joao', name:'Jardim de Ferro: Florescer', voc:'rosa',
    shout:'JARDIM DE FERRO... FLORESCER!',
    desc:'Variação vital do Jardim: dano em área menor, mas cura 35% da vida de João e concede regeneração por 3 turnos.',
    hint:'Área + Cura 35% + Regeneração'
  },
  sequencia: {
    id:'sequencia', hero:'djonga', name:'Sequência Infinita', starter:true,
    shout:'SEQUÊNCIA... INFINITA!',
    desc:'Djonga desfere 5 socos alternados de fogo e gelo no alvo — cada um pode critar.',
    hint:'5 golpes no alvo'
  },
  tempestade: {
    id:'tempestade', hero:'luan', name:'Tempestade de Aço', starter:true,
    shout:'TEMPESTADE DE AÇO!',
    desc:'Luan gira como um furacão de lâminas: dano pesado em TODOS os inimigos e postura defensiva.',
    hint:'Dano em área + Defesa'
  },
};

/* ═══════════════════ DADOS: EQUIPAMENTOS (4 slots: arma, armadura, 2 acessórios) ═══════════════════ */
const EQUIP_SLOTS = { arma:'Arma', armadura:'Armadura', acc1:'Acessório I', acc2:'Acessório II' };
const EQUIPMENT = {
  /* armas */
  espada_recruta:   { id:'espada_recruta',   slot:'arma', icon:'🗡', name:'Espada de Recruta',    stats:{atk:4},              desc:'+4 Ataque' },
  rosa_temperada:   { id:'rosa_temperada',   slot:'arma', icon:'🌹', name:'Rosa Temperada',       stats:{atkEsp:5},           desc:'+5 Atq. Especial' },
  manoplas_ferro:   { id:'manoplas_ferro',   slot:'arma', icon:'🥊', name:'Manoplas de Ferro',    stats:{atk:6, vel:-2},      desc:'+6 Ataque, −2 Velocidade' },
  lamina_lajeado:   { id:'lamina_lajeado',   slot:'arma', icon:'⚔️', name:'Lâmina de Lajeado',    stats:{atk:5, let:3},       desc:'+5 Ataque, +3% Letalidade' },
  clava_grug:       { id:'clava_grug',       slot:'arma', icon:'🏏', name:'Clava do Rei Grug',    stats:{atk:9, vel:-4},      desc:'+9 Ataque, −4 Velocidade' },
  cetro_cinzento:   { id:'cetro_cinzento',   slot:'arma', icon:'🪄', name:'Cetro Cinzento',       stats:{atkEsp:8, defMag:3}, desc:'+8 Atq. Especial, +3 Def. Mágica' },
  /* armaduras */
  gibao_couro:      { id:'gibao_couro',      slot:'armadura', icon:'🦺', name:'Gibão de Couro',      stats:{defFis:4},            desc:'+4 Def. Física' },
  cota_malha:       { id:'cota_malha',       slot:'armadura', icon:'⛓️', name:'Cota de Malha',       stats:{defFis:6, vel:-2},    desc:'+6 Def. Física, −2 Velocidade' },
  manto_petalas:    { id:'manto_petalas',    slot:'armadura', icon:'🧥', name:'Manto de Pétalas',    stats:{defMag:6},            desc:'+6 Def. Mágica' },
  couraça_braseiro: { id:'couraça_braseiro', slot:'armadura', icon:'🛡', name:'Couraça do Braseiro', stats:{defFis:5, defMag:5},  desc:'+5 Def. Física, +5 Def. Mágica' },
  /* acessórios */
  anel_vigor:       { id:'anel_vigor',       slot:'acc',  icon:'💍', name:'Anel do Vigor',        stats:{hp:40},              desc:'+40 Vida' },
  anel_presteza:    { id:'anel_presteza',    slot:'acc',  icon:'💍', name:'Anel da Presteza',     stats:{vel:5},              desc:'+5 Velocidade' },
  colar_focado:     { id:'colar_focado',     slot:'acc',  icon:'📿', name:'Colar do Foco',        stats:{atkEsp:4},           desc:'+4 Atq. Especial' },
  colar_predador:   { id:'colar_predador',   slot:'acc',  icon:'📿', name:'Colar do Predador',    stats:{let:5},              desc:'+5% Letalidade' },
  amuleto_ordem:    { id:'amuleto_ordem',    slot:'acc',  icon:'🔶', name:'Amuleto da Ordem',     stats:{hp:25, defMag:3},    desc:'+25 Vida, +3 Def. Mágica' },
  bracelete_pedra:  { id:'bracelete_pedra',  slot:'acc',  icon:'🪨', name:'Bracelete de Pedra',   stats:{defFis:3, hp:20},    desc:'+3 Def. Física, +20 Vida' },
};
// ícones pixel (Shikashi Fantasy Icons — ver CREDITS.md); ç normalizado no nome do arquivo
Object.values(EQUIPMENT).forEach(it => { it.img = `assets/icons/equip_${it.id.replace('ç','c')}.png`; });

/* ═══════════════════ DADOS: ITENS ═══════════════════ */
const ITEMS = {
  pocao_menor:  { id:'pocao_menor',  icon:'🧪', img:'assets/items/pocao-menor.png', name:'Poção Menor',       desc:'Restaura 60 de vida.' },
  pocao_maior:  { id:'pocao_maior',  icon:'⚗️', img:'assets/items/pocao-maior.png', name:'Poção Maior',       desc:'Restaura 150 de vida.' },
  elixir_azul:  { id:'elixir_azul',  icon:'💠', img:'assets/items/elixir-azul.png', name:'Elixir Azul',       desc:'Carrega 50% do medidor de Ultimate.' },
  tonico:       { id:'tonico',       icon:'🌿', img:'assets/items/tonico.png',      name:'Tônico Purificante', desc:'Remove veneno e lentidão e cura 40 de vida.' },
  capsula_reset:{ id:'capsula_reset', icon:'🔮', img:'assets/icons/equip_capsula_reset.png', name:'Cápsula de Reset', noBattle:true, desc:'Redistribui todos os pontos de atributo e reabre a escolha de vocação. Use na Árvore de Habilidades.' },
};

/* ═══════════════════ DADOS: INIMIGOS ═══════════════════ */
/* Fichas com os 7 atributos; cada golpe tem power + tipo (todos físicos por ora) */
const ENEMIES = {
  rato:    { id:'rato',    name:'Rato Selvagem',  icon:'🐀', size:58,  hp:55,  atk:14, atkEsp:8,  defFis:12, defMag:10, spd:62, let:5,  xp:18,
             moves:[{k:'bite', chance:1, power:13, type:'fis', label:'morde'}] },
  javali:  { id:'javali',  name:'Javali Feroz',   icon:'🐗', size:80,  hp:110, atk:20, atkEsp:8,  defFis:20, defMag:12, spd:50, let:5,  xp:32,
             moves:[{k:'gore', chance:.35, power:24, type:'fis', label:'usa <em>Investida</em> contra'}, {k:'hit', chance:1, power:15, type:'fis', label:'chifra'}] },
  batedor: { id:'batedor', name:'Goblin Batedor', icon:'👺', size:68,  hp:80,  atk:18, atkEsp:10, defFis:14, defMag:14, spd:72, let:10, xp:26,
             moves:[{k:'dbl', chance:.3, power:11, type:'fis', hits:2, label:'desfere <em>Golpe Duplo</em> em'}, {k:'stab', chance:1, power:15, type:'fis', label:'apunhala'}] },
  bruto:   { id:'bruto',   name:'Goblin Bruto',   icon:'👹', size:92,  hp:150, atk:24, atkEsp:8,  defFis:22, defMag:12, spd:45, let:5,  xp:44,
             moves:[{k:'smash', chance:.35, power:26, type:'fis', label:'esmaga com a <em>Pancada Colossal</em>'}, {k:'club', chance:1, power:17, type:'fis', label:'golpeia'}] },
  grug:    { id:'grug',    name:'Grug, o Rei Goblin', icon:'👹', crown:true, size:150, hp:460, atk:26, atkEsp:12, defFis:20, defMag:13, spd:58, let:10, xp:220, boss:true },

  /* ── Cratera Escaldante (região do Djonga) ── */
  capanga:  { id:'capanga',  name:'Capanga da Cratera', icon:'🪓', size:80,  hp:110, atk:20, atkEsp:8,  defFis:18, defMag:12, spd:55, let:5,  xp:38,
              moves:[{k:'axe', chance:.3, power:24, type:'fis', label:'desce o machado em'}, {k:'hit', chance:1, power:16, type:'fis', label:'golpeia'}] },
  fundidor: { id:'fundidor', name:'Fundidor Corrompido', icon:'🔥', size:78, hp:100, atk:12, atkEsp:24, defFis:12, defMag:20, spd:60, let:5,  xp:42,
              moves:[{k:'lava', chance:.35, power:22, type:'mag', label:'arremessa escória fundida em'}, {k:'brand', chance:1, power:15, type:'mag', label:'marca a brasa em'}] },
  brigao:   { id:'brigao',   name:'Brigão de Aluguel',  icon:'👊', size:84,  hp:140, atk:22, atkEsp:8,  defFis:20, defMag:14, spd:64, let:12, xp:48,
              moves:[{k:'combo', chance:.3, power:12, type:'fis', hits:2, label:'emenda um combo em'}, {k:'jab', chance:1, power:17, type:'fis', label:'soca'}] },
  djonga_boss: { id:'djonga_boss', name:'Djonga, o Punho do Vale', icon:'🥊', size:130, hp:520, atk:30, atkEsp:14, defFis:22, defMag:16, spd:66, let:15, xp:260, boss:true, duel:true },

  /* ── Bosque das Lâminas (região do Luan) ── */
  lobo:      { id:'lobo',      name:'Lobo da Névoa',     icon:'🐺', size:72,  hp:85,  atk:18, atkEsp:8,  defFis:14, defMag:14, spd:78, let:12, xp:36,
               moves:[{k:'pounce', chance:.35, power:22, type:'fis', label:'salta sobre'}, {k:'bite', chance:1, power:15, type:'fis', label:'morde'}] },
  espectro:  { id:'espectro',  name:'Espectro Lâmina',   icon:'👻', size:76,  hp:85,  atk:10, atkEsp:24, defFis:10, defMag:22, spd:70, let:8,  xp:44,
               moves:[{k:'slash', chance:.35, power:23, type:'mag', label:'atravessa com lâminas espectrais'}, {k:'cut', chance:1, power:15, type:'mag', label:'corta'}] },
  escudeiro: { id:'escudeiro', name:'Escudeiro Caído',   icon:'⚔️', size:86,  hp:150, atk:20, atkEsp:10, defFis:24, defMag:14, spd:48, let:5,  xp:50,
               moves:[{k:'charge', chance:.3, power:25, type:'fis', label:'investe de escudo contra'}, {k:'sword', chance:1, power:16, type:'fis', label:'golpeia'}] },
  cavaleiro: { id:'cavaleiro', name:'Cavaleiro Cinzento', icon:'🛡', size:140, hp:560, atk:28, atkEsp:18, defFis:26, defMag:18, spd:52, let:10, xp:280, boss:true },
  cogumelo:  { id:'cogumelo',  name:'Cogumelo Corrompido', icon:'🍄', size:60,  hp:70,  atk:14, atkEsp:14, defFis:12, defMag:14, spd:44, let:5,  xp:30,
               moves:[{k:'spore', chance:.35, power:14, type:'mag', label:'lança esporos tóxicos em'}, {k:'headbutt', chance:1, power:13, type:'fis', label:'dá uma cabeçada em'}] },
};

/* Dificuldade escala por progresso: inimigos ficam mais fortes a cada região liberada */
function scaledEnemy(key, idx, factor) {
  const e = buildEnemy(key, idx);
  if (factor > 1) {
    e.hp = Math.round(e.hp * factor); e.maxHp = e.hp;
    e.atk = Math.round(e.atk * factor); e.atkEsp = Math.round(e.atkEsp * factor);
    e.defFis = Math.round(e.defFis * (1 + (factor-1)*0.5)); e.defMag = Math.round(e.defMag * (1 + (factor-1)*0.5));
    e.xp = Math.round(e.xp * factor);
  }
  return e;
}

/* ═══════════════════ DADOS: REGIÕES E FASES (hub de Adaptia) ═══════════════════ */
const REGIONS = {
  colinas: {
    id:'colinas', name:'Colinas de Lajeado', icon:'⛰️', heroReward:null,
    tagline:'Capítulo I — o covil do Rei Goblin', chapter:'Capítulo I',
    desc:'Onde tudo começou: as trilhas infestadas pela vanguarda de Malvorax.',
    bgCard:'assets/bg/colinas.jpg',
    stages: [
      {
        id:'1-1', name:'Trilha dos Ratos', icon:'🐀', iconImg:'assets/stages/ratos.png',
        desc:'Ratos gigantes bloqueiam a trilha de entrada das Colinas.',
        waves:[ ['rato','rato'] ],
        tutorial:'basics', clearBonus:30, bg:'assets/bg/colinas.jpg',
        drops:{ pocao_menor:2 }, dropsEquip:{ espada_recruta:1 },
      },
      {
        id:'1-2', name:'Clareira dos Javalis', icon:'🐗', iconImg:'assets/stages/javalis.png',
        desc:'Javalis enfurecidos pela corrupção de Malvorax. Golpes pesados — use seu alforje.',
        waves:[ ['javali','rato'] ],
        tutorial:'items', clearBonus:35, bg:'assets/bg/clareira.jpg',
        grantOnEnter:{ pocao_menor:2 },
        drops:{ pocao_menor:1, elixir_azul:1 }, dropsEquip:{ gibao_couro:1 },
      },
      {
        id:'1-3', name:'Emboscada Goblin', icon:'⚔️', iconImg:'assets/stages/goblins.png',
        desc:'Uma horda goblin ataca em ondas. Sobreviva a todas para avançar.',
        waves:[ ['batedor','batedor'], ['batedor','bruto'], ['bruto','bruto'] ],
        tutorial:'horde', clearBonus:50, bg:'assets/bg/emboscada.jpg',
        drops:{ pocao_maior:1, tonico:1 }, dropsEquip:{ lamina_lajeado:1, anel_vigor:1 },
      },
      {
        id:'1-4', name:'Salão do Rei Goblin', icon:'👑', iconImg:'assets/stages/grug-boss.png', boss:true,
        desc:'Grug aguarda no coração das Colinas. Derrote-o e liberte a região.',
        waves:[ ['grug','batedor'] ],
        tutorial:'boss', clearBonus:80, bg:'assets/bg/salao-goblin.jpg',
        drops:{ pocao_maior:2, elixir_azul:1, capsula_reset:1 }, dropsEquip:{ clava_grug:1 },
      },
    ],
  },
  cratera: {
    id:'cratera', name:'Cratera Escaldante', icon:'🌋', heroReward:'djonga',
    tagline:'Região do Djonga — prove seu valor no duelo', chapter:'Crônicas da Ordem',
    desc:'Mercenários corrompidos tomaram a cratera vulcânica. Um lutador solitário resiste — e não confia em ninguém.',
    bgCard:'assets/bg/cratera.svg',
    stages: [
      {
        id:'C-1', name:'Trilha Escaldante', icon:'🪓',
        desc:'Capangas de Malvorax bloqueiam a subida da cratera.',
        waves:[ ['capanga','capanga'] ],
        tutorial:'party', clearBonus:45, bg:'assets/bg/cratera.svg',
        drops:{ pocao_menor:2 }, dropsEquip:{ bracelete_pedra:1 },
      },
      {
        id:'C-2', name:'Forja a Céu Aberto', icon:'🔥',
        desc:'Fundidores corrompidos vertem escória viva. Cuidado: dano MÁGICO — Defesa Física não ajuda aqui.',
        waves:[ ['fundidor','capanga'], ['fundidor','brigao'] ],
        clearBonus:55, bg:'assets/bg/cratera.svg',
        drops:{ pocao_maior:1, tonico:1 }, dropsEquip:{ couraça_braseiro:1 },
      },
      {
        id:'C-3', name:'O Desafio do Punho', icon:'🥊', boss:true,
        desc:'Djonga não pede ajuda — exige prova. Vença o duelo e ganhe um aliado.',
        waves:[ ['djonga_boss'] ],
        clearBonus:90, bg:'assets/bg/cratera.svg',
        drops:{ pocao_maior:2, elixir_azul:1 }, dropsEquip:{ manoplas_ferro:1 },
      },
    ],
  },
  bosque: {
    id:'bosque', name:'Bosque das Lâminas', icon:'🌲', heroReward:'luan',
    tagline:'Região do Luan — lute ao lado do espadachim', chapter:'Crônicas da Ordem',
    desc:'Uma névoa cinzenta engoliu o bosque. Dentro dela, um espadachim segura sozinho uma frente inteira.',
    bgCard:'assets/bg/bosque.svg',
    stages: [
      {
        id:'B-1', name:'Orla Nevoenta', icon:'🐺',
        desc:'Lobos da névoa e cogumelos corrompidos rondam a entrada do bosque.',
        waves:[ ['lobo','cogumelo'] ],
        tutorial:'party', clearBonus:45, bg:'assets/bg/bosque.svg',
        drops:{ pocao_menor:2 }, dropsEquip:{ anel_presteza:1 },
      },
      {
        id:'B-2', name:'Trilha dos Caídos', icon:'⚔️', guest:'luan',
        desc:'Luan luta ao seu lado nesta batalha — sinta o estilo do espadachim-guardião.',
        waves:[ ['escudeiro','lobo'], ['escudeiro','espectro'] ],
        tutorial:'guest', clearBonus:55, bg:'assets/bg/bosque.svg',
        drops:{ pocao_maior:1 }, dropsEquip:{ cota_malha:1 },
      },
      {
        id:'B-3', name:'Clareira do Cinzento', icon:'🛡', boss:true,
        desc:'O Cavaleiro Cinzento, tenente de Malvorax, comanda a névoa. Derrote-o e liberte o bosque — e Luan.',
        waves:[ ['cavaleiro','espectro'] ],
        clearBonus:90, bg:'assets/bg/bosque.svg',
        drops:{ pocao_maior:2, elixir_azul:1, capsula_reset:1 }, dropsEquip:{ cetro_cinzento:1, colar_predador:1 },
      },
    ],
  },
};
const ALL_STAGES = Object.values(REGIONS).flatMap(r => r.stages);
const stageById = id => ALL_STAGES.find(st => st.id === id);
const regionOfStage = id => Object.values(REGIONS).find(r => r.stages.some(st => st.id === id));
function regionCleared(save, regionId) {
  return REGIONS[regionId].stages.every(st => save.cleared.includes(st.id));
}
function difficultyFactor(save) {
  const cleared = Object.keys(REGIONS).filter(id => regionCleared(save, id)).length;
  return 1 + 0.35 * cleared;
}

/* ═══════════════════ DADOS: HISTÓRIA ═══════════════════ */
const STORY_INTRO = [
  { who:'Narrador', ico:'📜', text:'Há gerações, o Reino de Adaptia prospera sob a luz do Alvorecer — a chama ancestral que protege suas terras.' },
  { who:'Narrador', ico:'📜', text:'Mas nas Terras Cinzentas, além das fronteiras, algo antigo despertou. Malvorax, o Flagelo Cinzento, marcha para apagar a chama... e sua vanguarda já corrompe as Colinas de Lajeado.' },
  { who:'Rei Guilherme I', ico:'👑', text:'Ordem dos Seis! Convoco-vos ao trono. Batedores relatam hordas nas Colinas, lideradas por um rei goblin a serviço do Flagelo.' },
  { who:'Rei Guilherme I', ico:'👑', text:'Atravessem as Colinas, derrotem esse tirano menor e abram caminho até a fortaleza de Malvorax. Adaptia deposita sua fé em vós.' },
  { who:'João', img:'assets/joao.png', text:'Pela Rosa Azul e pelo reino... eu abrirei o caminho, Majestade. Que as correntes do Jardim prendam qualquer sombra que ouse avançar.' },
  { who:'Narrador', ico:'📜', text:'E assim, o primeiro capítulo da crônica começa. Escolha o líder que guiará a Ordem pelas Colinas de Lajeado.' },
];
const STORY_PRE_BOSS = [
  { who:'Grug, o Rei Goblin', ico:'👹', text:'GRAAAH! Um humaninho com uma flor? O mestre Malvorax me prometeu estas colinas... e eu prometi a ele seus ossos!' },
  { who:'João', img:'assets/joao.png', text:'Estas colinas têm dono, Grug — e não é você, nem seu mestre. Vou lhe mostrar por que chamam isto aqui de Jardim de Ferro.' },
];
const STORY_EPILOGUE = [
  { who:'Narrador', ico:'📜', text:'Com um estrondo final, o Rei Goblin tomba. As Colinas de Lajeado respiram aliviadas... por ora.' },
  { who:'João', img:'assets/joao.png', text:'Isso foi só a vanguarda. Malvorax ainda espreita além das montanhas — e a Ordem precisará de todos os seus heróis.' },
  { who:'Narrador', ico:'📜', text:'As Crônicas da Ordem continuam. Novas frentes se abrem no mapa de Adaptia — e em cada uma, um herói resiste sozinho, esperando por você.' },
];

/* Histórias das regiões novas: intro (1ª entrada), pré-chefe e recrutamento */
const REGION_STORIES = {
  cratera: {
    intro: [
      { who:'Narrador', ico:'📜', text:'A Cratera Escaldante ferve. Mercenários a serviço de Malvorax tomaram as forjas vulcânicas — e um único lutador ainda resiste, de punhos nus.' },
      { who:'Djonga', img:'assets/djonga.png', text:'Ei, você aí da flor azul. Pode ir voltando. Essa cratera é MINHA briga — não preciso de cavaleirinho de ordem nenhuma.' },
      { who:'João', img:'assets/joao.png', text:'A Ordem não veio roubar sua briga, Djonga. Veio somar. Mas se quer que a gente prove valor primeiro... que seja.' },
      { who:'Djonga', img:'assets/djonga.png', text:'Hah! Gostei. Limpa os capangas da subida e a gente conversa. No MEU idioma: na porrada.' },
    ],
    preBoss: [
      { who:'Djonga', img:'assets/djonga.png', text:'Chegou até aqui. Admito: não esperava. Mas na cratera só entra quem me vence — esquerda de brasa, direita de geada. Se aguenta?' },
      { who:'João', img:'assets/joao.png', text:'A Ordem precisa do seu punho, Djonga. Se um duelo é o preço... as correntes estão prontas.' },
    ],
    epilogue: [
      { who:'Djonga', img:'assets/djonga.png', text:'...Boa luta. Faz TEMPO que ninguém me derruba. Tá certo, flor azul: teu bando agora tem um punho. O Punho do Vale.' },
      { who:'Narrador', ico:'📜', text:'DJONGA SE JUNTOU À ORDEM! O lutador de punhos elementais agora está disponível no Salão da Ordem e na escalação da equipe.' },
    ],
  },
  bosque: {
    intro: [
      { who:'Narrador', ico:'📜', text:'O Bosque das Lâminas afundou numa névoa cinzenta. Dizem que dentro dela um espadachim luta há dias — sem dormir, sem recuar.' },
      { who:'Luan', img:'assets/luan.png', text:'Quem vem lá?! ...Um manto da Ordem? Então o Rei finalmente ouviu. A névoa vem do Cavaleiro Cinzento — um tenente do próprio Malvorax.' },
      { who:'João', img:'assets/joao.png', text:'Você segurou uma frente inteira sozinho, Luan. Descanse a guarda um instante — a partir de agora, lutamos juntos.' },
      { who:'Luan', img:'assets/luan.png', text:'Descansar depois. Primeiro os lobos, depois os caídos... e no fim, o Cinzento. Fica atrás do meu escudo quando a névoa fechar.' },
    ],
    preBoss: [
      { who:'Cavaleiro Cinzento', ico:'🛡', text:'O espadachim teimoso arranjou companhia... Não importa. A névoa engole rosas, correntes e lâminas por igual.' },
      { who:'Luan', img:'assets/luan.png', text:'Essa névoa acaba HOJE, Cinzento. Pelo bosque, pelos caídos — e pela Ordem que você jurou destruir.' },
    ],
    epilogue: [
      { who:'Narrador', ico:'📜', text:'A névoa se desfaz em fiapos prateados. O Bosque das Lâminas respira — e o Cavaleiro Cinzento não passa de um eco.' },
      { who:'Luan', img:'assets/luan.png', text:'Dívida paga, bosque livre. Minha lâmina é da Ordem agora, João. Aponta a próxima frente — eu seguro a linha.' },
      { who:'Narrador', ico:'📜', text:'LUAN SE JUNTOU À ORDEM! O espadachim-guardião agora está disponível no Salão da Ordem e na escalação da equipe.' },
    ],
  },
};

/* ═══════════════════ DADOS: TUTORIAIS ═══════════════════ */
const TUTORIALS = {
  basics: [
    { title:'Turnos e Iniciativa', text:'As batalhas acontecem em turnos. A ordem é definida pela VELOCIDADE de cada combatente — acompanhe a fila "Ordem de turnos" ao lado da arena.' },
    { title:'Atacar', text:'No seu turno, escolha ATACAR e depois o alvo. Cada ataque também carrega seu medidor de Ultimate (a barra azul).' },
    { title:'Defender e Aguardar', text:'DEFENDER reduz pela metade o dano recebido até seu próximo turno e carrega um pouco do medidor. AGUARDAR pula a vez carregando o medidor — útil com habilidades em recarga.' },
  ],
  meter: [
    { title:'ULTIMATE PRONTA!', text:'Seu medidor chegou a 100%! O botão JARDIM DE FERRO está brilhando — use-o para desencadear um ataque devastador em todos os inimigos.' },
  ],
  items: [
    { title:'Itens de Batalha', text:'João recebeu 2 Poções Menores! No menu ITENS você pode usá-las para curar em pleno combate. Usar um item consome o turno — escolha o momento certo.' },
  ],
  horde: [
    { title:'Batalha em Horda', text:'Esta emboscada tem 3 ONDAS de inimigos. Sua vida, medidor e recargas se mantêm entre as ondas — administre habilidades e itens para durar até o fim!' },
  ],
  boss: [
    { title:'Batalha de Chefe', text:'Grug é implacável: a cada 3 turnos ele desfere o GRITO DEVASTADOR, um golpe brutal. E abaixo de 40% de vida, entra em FÚRIA, ficando mais forte e rápido. Guarde a Ultimate para esse momento.' },
  ],
  skillup: [
    { title:'Pontos de Atributo!', text:'Heróis subiram de nível e ganharam 3 Pontos de Atributo cada. No SALÃO DA ORDEM você fortalece cada herói — atributos de afinidade custam 1 ponto; os demais custam 2.' },
  ],
  party: [
    { title:'Batalha em Grupo', text:'Sua equipe luta JUNTA! Cada herói entra na fila de turnos pela própria Velocidade. No turno de cada um, você escolhe a ação dele — vida, medidor e recargas são individuais.' },
  ],
  guest: [
    { title:'Aliado Convidado', text:'Um herói luta ao seu lado nesta batalha como convidado! Aproveite para sentir o estilo dele — se a região for libertada, ele se junta à Ordem de vez.' },
  ],
  punch: [
    { title:'Sequência de Socos', text:'Os socos do Djonga têm memória! Esquerda 🔥 e Direita ❄ alimentam a SEQUÊNCIA (veja os 3 últimos socos no painel). Padrões completos disparam efeitos: 🔥🔥🔥 queima, ❄❄❄ congela, 🔥❄🔥 crita, ❄🔥❄ fragiliza.' },
  ],
  equip: [
    { title:'Equipamento obtido!', text:'Você coletou seu primeiro equipamento! No SALÃO DA ORDEM, aba de cada herói, você equipa armas, armaduras e acessórios — cada peça soma atributos na batalha.' },
  ],
  recruit: [
    { title:'Novo herói na Ordem!', text:'Um herói se juntou à sua equipe! Abra o SALÃO DA ORDEM para ver os atributos, árvore e equipamentos dele — e monte sua ESCALAÇÃO antes de cada fase (até 4 heróis em campo).' },
  ],
};

/* ═══════════════════ SAVE SYSTEM ═══════════════════ */
const SLOT_KEY = i => `adaptia_slot_${i}`;

function newHeroState(heroId, level = 1) {
  return {
    level, xp: 0,
    attrPoints: POINTS_PER_LEVEL * (level - 1),
    alloc: { hp:0, atk:0, atkEsp:0, defFis:0, defMag:0, vel:0, let:0 },
    vocacao: null, caminho: null,
    loadout: [HEROES[heroId].firstSkill],
    activeUlt: HEROES[heroId].defaultUlt,
    equip: { arma:null, armadura:null, acc1:null, acc2:null },
  };
}

function newSave() {
  return {
    v: 3, createdAt: Date.now(), hero: null,
    party: ['joao'],
    roster: { joao: newHeroState('joao') },
    inventory: { pocao_menor: 1 },
    equipOwned: {},
    cleared: [], flags: {},
  };
}

/* Migração em cadeia: v1 (sp/skills) → v2 (builds solo) → v3 (roster multi-herói) */
function migrateSave(s) {
  if (!s.v) { // v1 → v2
    const trunk = ['chains','thorns','petals','prison'];
    s = {
      v: 2, createdAt: s.createdAt || Date.now(), hero: s.hero || null,
      level: Math.min(s.level || 1, MAX_LEVEL), xp: s.xp || 0,
      attrPoints: POINTS_PER_LEVEL * (Math.min(s.level || 1, MAX_LEVEL) - 1),
      alloc: { hp:0, atk:0, atkEsp:0, defFis:0, defMag:0, vel:0, let:0 },
      vocacao: null, caminho: null,
      loadout: (s.skills || ['chains']).filter(id => trunk.includes(id)),
      activeUlt: 'garden',
      inventory: s.inventory || { pocao_menor: 1 },
      cleared: s.cleared || [], flags: s.flags || {},
    };
    if (!s.loadout.length) s.loadout = ['chains'];
  }
  if (s.v === 2) { // v2 → v3
    const joao = newHeroState('joao', s.level);
    joao.xp = s.xp; joao.attrPoints = s.attrPoints; joao.alloc = s.alloc;
    joao.vocacao = s.vocacao; joao.caminho = s.caminho;
    joao.loadout = s.loadout; joao.activeUlt = s.activeUlt;
    s = {
      v: 3, createdAt: s.createdAt, hero: s.hero,
      party: ['joao'], roster: { joao },
      inventory: s.inventory, equipOwned: {},
      cleared: s.cleared, flags: s.flags,
    };
  }
  return s;
}

function readSlot(i) {
  try {
    const raw = localStorage.getItem(SLOT_KEY(i));
    return raw ? migrateSave(JSON.parse(raw)) : null;
  }
  catch { return null; }
}

/* Recruta um herói: entra no nível médio da equipe, com pontos retroativos */
function recruitHero(save, heroId) {
  if (save.roster[heroId]) return;
  const levels = Object.values(save.roster).map(h => h.level);
  const avg = Math.max(1, Math.round(levels.reduce((a,b) => a+b, 0) / levels.length));
  save.roster[heroId] = newHeroState(heroId, avg);
  if (save.party.length < 4) save.party.push(heroId);
}
function persist() {
  if (G.slot == null || !G.save) return;
  try { localStorage.setItem(SLOT_KEY(G.slot), JSON.stringify(G.save)); } catch {}
}
function eraseSlot(i) { try { localStorage.removeItem(SLOT_KEY(i)); } catch {} }

/* ═══════════════════ ESTADO GLOBAL ═══════════════════ */
const G = { slot: null, save: null, battle: null, images: {} };

function show(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const scr = $('#screen-' + name);
  scr.classList.add('active');
  // transição suave de entrada
  scr.classList.remove('enter');
  void scr.offsetWidth;
  scr.classList.add('enter');
  // trilha por contexto
  if (name === 'battle') playMusic('battle');
  else playMusic('map');
}

/* ═══════════════════ TELA: SLOTS ═══════════════════ */
function renderSlots() {
  const list = $('#slot-list');
  list.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const data = readSlot(i);
    const card = document.createElement('div');
    card.className = 'slot-card';
    const num = `<div class="slot-num">${['I','II','III'][i]}</div>`;
    if (data) {
      const prog = data.cleared.length;
      card.innerHTML = num + `
        <div class="slot-info">
          <strong>${data.hero ? 'João — Nível ' + data.level : 'Jornada iniciada'}</strong>
          <small>${prog}/4 fases concluídas · Capítulo I</small>
        </div>
        <div class="slot-actions">
          <button class="btn-gold small" data-act="play">Continuar</button>
          <button class="btn-ghost small" data-act="del">Apagar</button>
        </div>`;
    } else {
      card.innerHTML = num + `
        <div class="slot-info">
          <strong>Registro vazio</strong>
          <small>Comece uma nova crônica</small>
        </div>
        <div class="slot-actions">
          <button class="btn-gold small" data-act="new">Nova Jornada</button>
        </div>`;
    }
    card.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'del') {
          if (confirm('Apagar este registro? A crônica será perdida para sempre.')) { eraseSlot(i); renderSlots(); }
          return;
        }
        G.slot = i;
        if (act === 'new') {
          G.save = newSave(); persist();
          playStory(STORY_INTRO, () => { renderSelect(); show('select'); }, 'assets/bg/trono.jpg');
        } else {
          G.save = readSlot(i);
          if (!G.save.hero) { renderSelect(); show('select'); }
          else { renderMap(); show('map'); }
        }
      });
    });
    list.appendChild(card);
  }
}

/* ═══════════════════ TELA: HISTÓRIA ═══════════════════ */
const story = { scenes: [], idx: 0, typing: null, done: null };

function playStory(scenes, done, bg) {
  story.scenes = scenes; story.idx = 0; story.done = done;
  const sb = $('#story-bg');
  sb.style.backgroundImage = bg ? `url(${bg})` : 'none';
  show('story');
  renderScene();
}
function renderScene() {
  const sc = story.scenes[story.idx];
  if (!sc) return endStory();
  const pt = $('#story-portrait');
  pt.innerHTML = sc.img ? `<img src="${sc.img}" alt="${esc(sc.who)}">` : (sc.ico || '📜');
  $('#story-speaker').textContent = sc.who;
  const el = $('#story-text');
  el.textContent = '';
  clearInterval(story.typing);
  let i = 0;
  story.typing = setInterval(() => {
    el.textContent = sc.text.slice(0, ++i);
    if (i >= sc.text.length) clearInterval(story.typing);
  }, 16);
}
function advanceStory() {
  const sc = story.scenes[story.idx];
  if (!sc) return;
  if ($('#story-text').textContent.length < sc.text.length) {
    clearInterval(story.typing);
    $('#story-text').textContent = sc.text;
    return;
  }
  story.idx += 1;
  if (story.idx >= story.scenes.length) endStory(); else renderScene();
}
function endStory() {
  clearInterval(story.typing);
  const cb = story.done; story.done = null;
  if (cb) cb();
}

/* ═══════════════════ TELA: SELEÇÃO ═══════════════════ */
let pickedHero = null;
function renderSelect() {
  pickedHero = null;
  $('#btn-select-confirm').disabled = true;
  const grid = $('#hero-grid');
  grid.innerHTML = '';
  const mk = (h, locked) => {
    const card = document.createElement('article');
    card.className = 'hero-card ' + (locked ? 'locked' : 'available');
    card.innerHTML = `
      <img src="${h.portrait}" alt="${esc(h.name)}" />
      <div class="hc-body"><h3>${esc(h.name)}</h3><small>${esc(h.title)}</small></div>`;
    if (!locked) card.addEventListener('click', () => {
      pickedHero = h.id;
      grid.querySelectorAll('.hero-card').forEach(c => c.classList.remove('picked'));
      card.classList.add('picked');
      $('#btn-select-confirm').disabled = false;
    });
    return card;
  };
  grid.appendChild(mk(HEROES.joao, false));
  [HEROES.djonga, HEROES.luan, ...LOCKED_HEROES].forEach(h => grid.appendChild(mk(h, true)));
}

/* ═══════════════════ TELA: MAPA (hub de regiões) ═══════════════════ */
function stageUnlockedIn(region, idx) {
  if (idx === 0) return true;
  return G.save.cleared.includes(region.stages[idx-1].id);
}

/* Painel lateral: a Ordem (equipe) */
function renderPartyPanel() {
  const s = G.save;
  const panel = $('#party-panel');
  const totalPts = Object.values(s.roster).reduce((n,h) => n + h.attrPoints, 0);
  let html = `<h3 class="pp-title">A Ordem</h3><div class="pp-list">`;
  Object.entries(s.roster).forEach(([id, hs]) => {
    const H = HEROES[id];
    const inParty = s.party.includes(id);
    const need = xpForNext(hs.level);
    const pct = hs.level >= MAX_LEVEL ? 100 : clamp(hs.xp/need*100, 0, 100);
    html += `
      <div class="pp-hero ${inParty ? 'deployed' : ''}">
        <img src="${H.portrait}" alt="${esc(H.name)}">
        <div class="pp-info">
          <strong>${esc(H.name)}</strong>
          <small>Nível ${hs.level}${inParty ? ' · em campo' : ' · reserva'}</small>
          <div class="bar tiny"><div class="fill xp" style="width:${pct}%"></div></div>
        </div>
        ${hs.attrPoints > 0 ? `<span class="badge">${hs.attrPoints}</span>` : ''}
      </div>`;
  });
  LOCKED_HEROES.concat(Object.values(HEROES).filter(H => !s.roster[H.id]).map(H => ({name:H.name, title:H.title, portrait:H.portrait}))).forEach(h => {
    html += `
      <div class="pp-hero locked">
        <img src="${h.portrait}" alt="">
        <div class="pp-info"><strong>${esc(h.name)}</strong><small>🔒 ${esc(h.title)}</small></div>
      </div>`;
  });
  html += `</div>
    <div class="mh-actions">
      <button id="btn-map-salao" class="btn-gold">🏰 Salão da Ordem ${totalPts > 0 ? `<span class="badge">${totalPts}</span>` : ''}</button>
      <button id="btn-map-escalar" class="btn-ghost">⚔ Escalação (${s.party.length}/4)</button>
      <button id="btn-map-bag" class="btn-ghost">🎒 Inventário</button>
      <button id="btn-map-slots" class="btn-ghost small">‹ Trocar Registro</button>
    </div>`;
  panel.innerHTML = html;
  $('#btn-map-salao').addEventListener('click', () => { renderSalao(); show('tree'); });
  $('#btn-map-escalar').addEventListener('click', openEscalacao);
  $('#btn-map-bag').addEventListener('click', () => { renderBag(); show('bag'); });
  $('#btn-map-slots').addEventListener('click', () => { renderSlots(); show('slots'); });
}

/* Constrói um mapa de nós conectados + caixa de info (estilo Pocket Map) */
function buildNodeMap(container, nodes, infoFor) {
  container.innerHTML = '';
  container.className = 'node-map';
  const track = document.createElement('div');
  track.className = 'nm-track';
  const info = document.createElement('div');
  info.className = 'nm-info';
  info.id = 'nm-info';

  const select = (i) => {
    track.querySelectorAll('.map-node').forEach(n => n.classList.remove('sel'));
    const node = track.querySelector(`.map-node[data-i="${i}"]`);
    if (node) node.classList.add('sel');
    info.innerHTML = infoFor(nodes[i], i);
    const act = info.querySelector('button[data-act]');
    if (act && nodes[i].onEnter) act.addEventListener('click', nodes[i].onEnter);
  };

  nodes.forEach((nd, i) => {
    if (i > 0) {
      const link = document.createElement('div');
      link.className = 'mn-link' + (nd.linkOn ? ' on' : '');
      track.appendChild(link);
    }
    const btn = document.createElement('button');
    btn.className = 'map-node ' + nd.state;
    btn.dataset.i = i;
    btn.innerHTML = `<span class="mn-dot">${nd.icon}</span><span class="mn-label">${esc(nd.label)}</span>`;
    btn.addEventListener('click', () => select(i));
    track.appendChild(btn);
  });
  container.appendChild(track);
  container.appendChild(info);
  // seleção inicial: primeiro nó "atual" (desbloqueado não concluído) ou o primeiro
  let start = nodes.findIndex(n => n.state === 'unlocked');
  if (start < 0) start = 0;
  select(start);
}

/* Hub: regiões como nós do mapa-múndi */
function renderMap() {
  G.region = null;
  renderPartyPanel();
  const s = G.save;
  $('#map-head').innerHTML = `
    <p class="eyebrow">◈ Mapa de Adaptia ◈</p>
    <h2>Frentes de Batalha</h2>
    <p class="scr-sub">A vanguarda de Malvorax avança em várias frentes. Escolha onde a Ordem atacará.</p>`;
  const el = $('#stage-path');
  const regions = Object.values(REGIONS);
  const nodes = regions.map((region, idx) => {
    const done = regionCleared(s, region.id);
    const started = region.stages.some(st => s.cleared.includes(st.id));
    return {
      region,
      label: region.name,
      icon: done ? '✓' : region.icon,
      state: done ? 'cleared' : 'unlocked',
      linkOn: idx === 0 ? false : (regionCleared(s, regions[idx-1].id)),
      onEnter: () => enterRegion(region),
    };
  });
  buildNodeMap(el, nodes, (nd) => {
    const region = nd.region;
    const clearedCount = region.stages.filter(st => s.cleared.includes(st.id)).length;
    const done = regionCleared(s, region.id);
    const reward = region.heroReward && !s.roster[region.heroReward]
      ? `<p class="nmi-hero">★ Recompensa: <strong>${esc(HEROES[region.heroReward].name)}</strong> se junta à Ordem</p>` : '';
    return `
      <div class="nmi-head"><span class="nmi-icon">${region.icon}</span>
        <div><p class="eyebrow">${esc(region.chapter)}</p><h3>${esc(region.name)}</h3></div></div>
      <p class="nmi-desc">${esc(region.desc)}</p>
      ${reward}
      <div class="nmi-foot">
        <span>${clearedCount}/${region.stages.length} fases</span>
        <button class="btn-royal small" data-act>${done ? 'Rejogar ›' : 'Entrar ›'}</button>
      </div>`;
  });
}

function enterRegion(region) {
  const s = G.save;
  const introFlag = 'intro_' + region.id;
  if (REGION_STORIES[region.id] && !s.flags[introFlag]) {
    s.flags[introFlag] = true; persist();
    playStory(REGION_STORIES[region.id].intro, () => renderRegion(region), region.bgCard);
  } else {
    renderRegion(region);
  }
}

/* Região: fases como trilha de nós conectados */
function renderRegion(region) {
  G.region = region;
  renderPartyPanel();
  show('map');
  const s = G.save;
  $('#map-head').innerHTML = `
    <button class="btn-back" id="btn-region-back">‹ Mapa de Adaptia</button>
    <p class="eyebrow">${esc(region.chapter)}</p>
    <h2>${region.icon} ${esc(region.name)}</h2>`;
  $('#btn-region-back').addEventListener('click', renderMap);
  const el = $('#stage-path');
  const nodes = region.stages.map((stage, idx) => {
    const unlocked = stageUnlockedIn(region, idx);
    const cleared = s.cleared.includes(stage.id);
    const icon = cleared ? '✓' : stage.boss ? '☠' : stage.guest ? '★' : (unlocked ? (idx+1) : '🔒');
    return {
      stage, idx,
      label: 'Fase ' + stage.id,
      icon,
      state: cleared ? 'cleared' : unlocked ? 'unlocked' : 'locked',
      linkOn: idx === 0 ? false : s.cleared.includes(region.stages[idx-1].id),
      onEnter: unlocked ? () => enterStage(stage) : null,
    };
  });
  buildNodeMap(el, nodes, (nd) => {
    const stage = nd.stage;
    const unlocked = nd.state !== 'locked';
    const cleared = nd.state === 'cleared';
    const tags = [];
    if (stage.boss) tags.push('CHEFE');
    if (stage.guest) tags.push('ALIADO CONVIDADO');
    if (stage.waves.length > 1) tags.push(stage.waves.length + ' ONDAS');
    return `
      <div class="nmi-head"><span class="nmi-icon">${stage.iconImg ? `<img src="${stage.iconImg}" alt="">` : stage.icon}</span>
        <div><p class="eyebrow">Fase ${stage.id}${tags.length ? ' · ' + tags.join(' · ') : ''}</p><h3>${esc(stage.name)}</h3></div></div>
      <p class="nmi-desc">${esc(stage.desc)}</p>
      <div class="nmi-foot">
        <span>${cleared ? '✓ Concluída' : unlocked ? 'Disponível' : '🔒 Bloqueada'}</span>
        ${unlocked ? `<button class="btn-royal small" data-act>${cleared ? 'Rejogar ›' : 'Entrar ›'}</button>` : ''}
      </div>`;
  });
}

function enterStage(stage) {
  const region = regionOfStage(stage.id);
  const s = G.save;
  const go = () => startBattle(stage);
  if (stage.boss) {
    const flag = 'preboss_' + region.id;
    if (!s.flags[flag]) {
      s.flags[flag] = true; persist();
      const story = region.id === 'colinas' ? STORY_PRE_BOSS : (REGION_STORIES[region.id] || {}).preBoss;
      if (story) return playStory(story, go, stage.bg);
    }
  }
  go();
}

/* ═══════════════════ ESCALAÇÃO (escolher até 4 heróis) ═══════════════════ */
function openEscalacao() {
  const s = G.save;
  const ov = $('#escalacao-overlay');
  const list = $('#escalacao-list');
  list.innerHTML = '';
  Object.entries(s.roster).forEach(([id, hs]) => {
    const H = HEROES[id];
    const on = s.party.includes(id);
    const row = document.createElement('button');
    row.className = 'esc-hero' + (on ? ' on' : '');
    row.innerHTML = `
      <img src="${H.portrait}" alt="">
      <div><strong>${esc(H.name)}</strong><small>Nível ${hs.level} · ${esc(H.title)}</small></div>
      <span class="esc-state">${on ? '◆ EM CAMPO' : '◇ reserva'}</span>`;
    row.addEventListener('click', () => {
      if (on) {
        if (s.party.length <= 1) { alert('Pelo menos 1 herói precisa estar em campo.'); return; }
        s.party = s.party.filter(x => x !== id);
      } else {
        if (s.party.length >= 4) { alert('Máximo de 4 heróis em campo. Remova alguém antes.'); return; }
        s.party.push(id);
      }
      persist(); openEscalacao();
    });
    list.appendChild(row);
  });
  ov.classList.remove('hidden');
}

/* ═══════════════════ TELA: SALÃO DA ORDEM (builds por herói — sistema-de-builds.md) ═══════════════════ */
function salaoHero() {
  const s = G.save;
  if (!G.heroSel || !s.roster[G.heroSel]) G.heroSel = Object.keys(s.roster)[0];
  return G.heroSel;
}

function renderSalao() {
  const s = G.save;
  const heroId = salaoHero();
  const hs = s.roster[heroId];
  // abas de heróis
  const tabs = $('#salao-tabs');
  tabs.innerHTML = '';
  Object.keys(s.roster).forEach(id => {
    const H = HEROES[id];
    const b = document.createElement('button');
    b.className = 'salao-tab' + (id === heroId ? ' on' : '');
    b.innerHTML = `<img src="${H.portrait}" alt=""><span>${esc(H.name)}</span>${s.roster[id].attrPoints > 0 ? `<em class="badge">${s.roster[id].attrPoints}</em>` : ''}`;
    b.addEventListener('click', () => { G.heroSel = id; renderSalao(); });
    tabs.appendChild(b);
  });
  $('#salao-hero-title').textContent = HEROES[heroId].name + ' — ' + HEROES[heroId].title;
  $('#tree-sp').textContent = hs.attrPoints;
  renderAttrs(heroId, hs);
  renderTrunk(heroId, hs);
  renderVocacao(heroId, hs);
  renderLoadoutPanel(heroId, hs);
  renderEquipPanel(heroId, hs);
  renderRespec(heroId, hs);
}

/* ── painel de atributos ── */
function renderAttrs(heroId, hs) {
  const st = computeStats(heroId, hs);
  const div = $('#tree-attrs');
  div.innerHTML = '';
  ATTRS.forEach(a => {
    const cost = allocCost(heroId, a);
    const inv = hs.alloc[a] || 0;
    const capped = inv >= ALLOC_CAP;
    const can = !capped && hs.attrPoints >= cost;
    const row = document.createElement('div');
    row.className = 'attr-row' + (cost === 1 ? ' affinity' : '');
    row.innerHTML = `
      <span class="ar-name">${cost === 1 ? '★ ' : ''}${ATTR_INFO[a].label}</span>
      <strong class="ar-val">${st[a]}${a==='let' ? '%' : ''}</strong>
      <small class="ar-inv">${inv}/${ALLOC_CAP}</small>
      <button class="btn-gold small" ${can ? '' : 'disabled'}>+${ATTR_INFO[a].gain}${a==='let' ? '%' : ''} (${cost} pt)</button>`;
    row.querySelector('button').addEventListener('click', () => {
      if (hs.attrPoints < cost || (hs.alloc[a]||0) >= ALLOC_CAP) return;
      hs.attrPoints -= cost;
      hs.alloc[a] = (hs.alloc[a]||0) + 1;
      persist(); renderSalao();
    });
    div.appendChild(row);
  });
  const note = document.createElement('p');
  note.className = 'attr-note';
  note.innerHTML = `★ = afinidade de ${esc(HEROES[heroId].name)} (custa 1 ponto). Demais atributos custam 2.`;
  div.appendChild(note);
}

/* ── tronco (desbloqueio automático por nível) ── */
function renderTrunk(heroId, hs) {
  const div = $('#tree-skills');
  div.innerHTML = '';
  Object.values(SKILLS).filter(sk => sk.hero === heroId && !sk.voc).forEach(sk => {
    const ok = skillUnlocked(heroId, hs, sk);
    const node = document.createElement('div');
    node.className = 'tree-node' + (ok ? ' owned' : '');
    node.innerHTML = `
      <h4>${esc(sk.name)}</h4>
      <span class="tn-meta">${sk.hint} · ${sk.cd > 0 ? 'Recarga ' + sk.cd + ' turnos' : 'Sem recarga'} · Nível ${sk.unlock}</span>
      <p>${esc(sk.desc)}</p>
      <div class="tn-row">${ok
        ? '<span style="color:var(--green);font-family:var(--display);font-size:13px">✓ Dominada</span>'
        : `<small style="color:var(--muted)">🔒 Desbloqueia no nível ${sk.unlock}</small>`}</div>`;
    div.appendChild(node);
  });
}

/* ── vocação e caminhos ── */
function renderVocacao(heroId, hs) {
  const div = $('#tree-vocacao');
  div.innerHTML = '';
  const H = HEROES[heroId];

  if (!hs.vocacao) {
    const intro = document.createElement('p');
    intro.className = 'attr-note';
    intro.textContent = hs.level >= VOC_LEVEL
      ? `O momento chegou: escolha a vocação de ${H.name}. A escolha é definitiva (reversível apenas com uma Cápsula de Reset).`
      : `No nível ${VOC_LEVEL}, ${H.name} escolherá sua vocação — o rumo que definirá sua build.`;
    div.appendChild(intro);
  }

  Object.values(VOCACOES[heroId] || {}).forEach(v => {
    if (hs.vocacao && hs.vocacao !== v.id) return; // após escolher, só mostra a escolhida
    const chosen = hs.vocacao === v.id;
    const canPick = !hs.vocacao && hs.level >= VOC_LEVEL;
    const card = document.createElement('div');
    card.className = 'tree-node voc-card' + (chosen ? ' owned' : '');
    let inner = `
      <h4>${v.icon} ${esc(v.name)}</h4>
      <span class="tn-meta">${esc(v.tagline)}</span>
      <p><strong>Passiva:</strong> ${esc(v.passive)}</p>`;
    if (chosen) {
      // habilidades da vocação
      Object.values(SKILLS).filter(sk => sk.hero === heroId && sk.voc === v.id && !sk.caminho).forEach(sk => {
        const ok = skillUnlocked(heroId, hs, sk);
        inner += `<p class="voc-skill">${ok ? '✓' : '🔒'} <strong>${esc(sk.name)}</strong> (nível ${sk.unlock}) — ${sk.hint}</p>`;
      });
      // caminhos
      if (!hs.caminho) {
        inner += hs.level >= PATH_LEVEL
          ? `<p class="attr-note">Escolha um caminho dentro da vocação:</p>`
          : `<p class="attr-note">No nível ${PATH_LEVEL}, a vocação se aprofunda em um de dois caminhos:</p>`;
        Object.values(v.caminhos).forEach(c => {
          inner += `<div class="path-row">
            <div><strong>${esc(c.name)}</strong><br><small>${esc(c.desc)}</small></div>
            <button class="btn-gold small" data-path="${c.id}" ${hs.level >= PATH_LEVEL ? '' : 'disabled'}>Seguir</button>
          </div>`;
        });
      } else {
        const c = v.caminhos[hs.caminho];
        inner += `<p class="voc-skill">◆ Caminho: <strong>${esc(c.name)}</strong> — ${esc(c.desc)}</p>`;
        Object.values(SKILLS).filter(sk => sk.hero === heroId && sk.caminho === hs.caminho).forEach(sk => {
          const ok = skillUnlocked(heroId, hs, sk);
          inner += `<p class="voc-skill">${ok ? '✓' : '🔒'} <strong>${esc(sk.name)}</strong> (nível ${sk.unlock}) — ${sk.hint}</p>`;
        });
      }
      inner += `<p class="attr-note">${esc(v.apex)}</p>`;
    } else {
      inner += `<div class="tn-row">${canPick
        ? `<button class="btn-gold small" data-voc="${v.id}">Escolher ${esc(v.name)}</button>`
        : `<small style="color:var(--muted)">🔒 Nível ${VOC_LEVEL} necessário</small>`}</div>`;
    }
    card.innerHTML = inner;
    const vbtn = card.querySelector('button[data-voc]');
    if (vbtn) vbtn.addEventListener('click', () => {
      if (!confirm(`Seguir a ${v.name}? A escolha é definitiva (reversível apenas com Cápsula de Reset).`)) return;
      hs.vocacao = v.id; persist(); renderSalao();
    });
    card.querySelectorAll('button[data-path]').forEach(pbtn => {
      pbtn.addEventListener('click', () => {
        const c = v.caminhos[pbtn.dataset.path];
        if (!confirm(`Seguir o caminho ${c.name}? A escolha é definitiva (reversível apenas com Cápsula de Reset).`)) return;
        hs.caminho = c.id; persist(); renderSalao();
      });
    });
    div.appendChild(card);
  });
}

/* ── loadout: 5 habilidades + 1 ultimate ── */
function renderLoadoutPanel(heroId, hs) {
  const div = $('#tree-loadout');
  div.innerHTML = '';
  const equipped = battleLoadout(heroId, hs);

  const head = document.createElement('p');
  head.className = 'attr-note';
  head.innerHTML = `Habilidades equipadas: <strong>${equipped.length}/5</strong> — só as equipadas aparecem em batalha.`;
  div.appendChild(head);

  ownedSkills(heroId, hs).forEach(sk => {
    const on = hs.loadout.includes(sk.id);
    const chip = document.createElement('button');
    chip.className = 'loadout-chip' + (on ? ' on' : '');
    chip.innerHTML = `${on ? '◆' : '◇'} ${esc(sk.name)} <small>${sk.hint}</small>`;
    chip.addEventListener('click', () => {
      if (on) {
        if (hs.loadout.length <= 1) { alert('Pelo menos 1 habilidade precisa ficar equipada.'); return; }
        hs.loadout = hs.loadout.filter(id => id !== sk.id);
      } else {
        if (battleLoadout(heroId, hs).length >= 5) { alert('Máximo de 5 habilidades equipadas. Remova uma antes.'); return; }
        hs.loadout.push(sk.id);
      }
      persist(); renderSalao();
    });
    div.appendChild(chip);
  });

  // ultimate
  const ulHead = document.createElement('p');
  ulHead.className = 'attr-note';
  ulHead.textContent = 'Ultimate equipada:';
  div.appendChild(ulHead);
  Object.values(ULTIMATES).filter(u => u.hero === heroId).forEach(u => {
    const available = !u.voc || hs.vocacao === u.voc;
    const active = currentUlt(heroId, hs).id === u.id;
    const chip = document.createElement('button');
    chip.className = 'loadout-chip' + (active ? ' on' : '');
    chip.disabled = !available;
    chip.innerHTML = `${active ? '◆' : '◇'} ${esc(u.name)} <small>${available ? u.hint : '🔒 Requer vocação específica'}</small>`;
    if (available) chip.addEventListener('click', () => { hs.activeUlt = u.id; persist(); renderSalao(); });
    div.appendChild(chip);
  });
}

/* ── equipamentos (4 slots) ── */
function equippedByRoster(save, itemId) {
  let n = 0;
  Object.values(save.roster).forEach(h => {
    Object.values(h.equip || {}).forEach(id => { if (id === itemId) n += 1; });
  });
  return n;
}

function renderEquipPanel(heroId, hs) {
  const s = G.save;
  const div = $('#tree-equip');
  div.innerHTML = '';

  // slots atuais
  Object.entries(EQUIP_SLOTS).forEach(([slot, label]) => {
    const itemId = hs.equip[slot];
    const it = itemId ? EQUIPMENT[itemId] : null;
    const row = document.createElement('div');
    row.className = 'equip-slot' + (it ? ' filled' : '');
    row.innerHTML = `
      <span class="es-label">${label}</span>
      <span class="es-item">${it ? `${equipIco(it, 26)} ${esc(it.name)} <small>${esc(it.desc)}</small>` : '<small>— vazio —</small>'}</span>
      ${it ? '<button class="btn-ghost small">Remover</button>' : ''}`;
    const btn = row.querySelector('button');
    if (btn) btn.addEventListener('click', () => { hs.equip[slot] = null; persist(); renderSalao(); });
    div.appendChild(row);
  });

  // arsenal disponível
  const avail = Object.entries(s.equipOwned || {}).filter(([id, n]) => n - equippedByRoster(s, id) > 0);
  const head = document.createElement('p');
  head.className = 'attr-note';
  head.textContent = avail.length ? 'Arsenal da Ordem (disponível para equipar):' : 'Arsenal vazio — equipamentos caem nas fases (primeira vitória).';
  div.appendChild(head);
  avail.forEach(([id]) => {
    const it = EQUIPMENT[id];
    const chip = document.createElement('button');
    chip.className = 'loadout-chip';
    chip.innerHTML = `${equipIco(it, 24)} ${esc(it.name)} <small>${esc(it.desc)} · ${it.slot === 'acc' ? 'Acessório' : EQUIP_SLOTS[it.slot]}</small>`;
    chip.addEventListener('click', () => {
      let slot = it.slot;
      if (slot === 'acc') slot = !hs.equip.acc1 ? 'acc1' : (!hs.equip.acc2 ? 'acc2' : 'acc1');
      hs.equip[slot] = id;
      persist(); renderSalao();
    });
    div.appendChild(chip);
  });
}

/* ── respec ── */
function renderRespec(heroId, hs) {
  const s = G.save;
  const div = $('#tree-respec');
  const caps = s.inventory.capsula_reset || 0;
  div.innerHTML = `
    <p class="attr-note">🔮 Cápsulas de Reset: <strong>${caps}</strong> — redistribui os pontos de ${esc(HEROES[heroId].name)} e reabre vocação e caminho.</p>
    <button class="btn-ghost small" ${caps > 0 ? '' : 'disabled'}>Usar Cápsula de Reset</button>`;
  div.querySelector('button').addEventListener('click', () => {
    if (!caps) return;
    if (!confirm(`Usar uma Cápsula de Reset em ${HEROES[heroId].name}? Todos os pontos voltam e a vocação/caminho serão reabertos.`)) return;
    s.inventory.capsula_reset -= 1;
    hs.attrPoints = POINTS_PER_LEVEL * (hs.level - 1);
    ATTRS.forEach(a => hs.alloc[a] = 0);
    hs.vocacao = null; hs.caminho = null;
    hs.activeUlt = HEROES[heroId].defaultUlt;
    hs.loadout = battleLoadout(heroId, hs);
    if (!hs.loadout.length) hs.loadout = [HEROES[heroId].firstSkill];
    persist(); renderSalao();
    alert(`${HEROES[heroId].name} foi renovado. Redistribua os pontos!`);
  });
}

/* ═══════════════════ TELA: INVENTÁRIO ═══════════════════ */
function renderBag() {
  const list = $('#bag-list');
  list.innerHTML = '';
  const entries = Object.entries(G.save.inventory).filter(([,n]) => n > 0);
  const equipEntries = Object.entries(G.save.equipOwned || {}).filter(([,n]) => n > 0);
  if (!entries.length && !equipEntries.length) {
    list.innerHTML = '<p class="bag-empty">O alforje está vazio. Vença batalhas para coletar itens.</p>';
    return;
  }
  entries.forEach(([id, n]) => {
    const it = ITEMS[id];
    if (!it) return;
    const row = document.createElement('div');
    row.className = 'bag-item';
    row.innerHTML = `<div class="bi-icon">${itemIco(it, 44)}</div>
      <div><strong>${esc(it.name)}</strong><small>${esc(it.desc)}</small></div>
      <div class="bi-count">×${n}</div>`;
    list.appendChild(row);
  });
  if (equipEntries.length) {
    const head = document.createElement('p');
    head.className = 'attr-note';
    head.style.textAlign = 'center';
    head.textContent = '⚔ Equipamentos da Ordem (equipe no Salão da Ordem)';
    list.appendChild(head);
    equipEntries.forEach(([id, n]) => {
      const it = EQUIPMENT[id];
      if (!it) return;
      const usados = equippedByRoster(G.save, id);
      const row = document.createElement('div');
      row.className = 'bag-item';
      row.innerHTML = `<div class="bi-icon">${equipIco(it, 40)}</div>
        <div><strong>${esc(it.name)}</strong><small>${esc(it.desc)}${usados ? ` · ${usados} em uso` : ''}</small></div>
        <div class="bi-count">×${n}</div>`;
      list.appendChild(row);
    });
  }
}

function itemIco(it, size) {
  return it.img
    ? `<img class="item-ico ico-pix" src="${it.img}" alt="" style="width:${size}px;height:${size}px">`
    : `<span style="font-size:${Math.round(size*0.7)}px">${it.icon}</span>`;
}
function equipIco(it, size) {
  return it.img
    ? `<img class="item-ico ico-pix" src="${it.img}" alt="" style="width:${size}px;height:${size}px;vertical-align:middle">`
    : `<span style="font-size:${Math.round(size*0.7)}px">${it.icon}</span>`;
}

/* ═══════════════════ MOTOR DE BATALHA ═══════════════════ */
function buildHeroUnit(heroId, hs, isGuest = false) {
  const st = computeStats(heroId, hs);
  return {
    uid:'h-' + heroId, side:'hero', heroId, guest:isGuest,
    name:HEROES[heroId].name, icon:null,
    hp:st.maxHp, maxHp:st.maxHp,
    atk:st.atk, atkEsp:st.atkEsp, defFis:st.defFis, defMag:st.defMag,
    spd:st.vel, let:st.let,
    vocacao:hs.vocacao, caminho:hs.caminho, level:hs.level,
    hs, // referência ao estado persistente (loadout, cds não — cds são da batalha)
    meter:0, defending:false, alive:true, statuses:[],
    cds:{}, seq:'', counterUsed:false,
    bob: Math.random()*10, shakeT:0, flashT:0, pose:null, poseUntil:0,
  };
}
function buildEnemy(key, idx) {
  const d = ENEMIES[key];
  return {
    uid:`e-${key}-${idx}-${rand(0,9999)}`, side:'enemy', kind:key,
    name:d.name, icon:d.icon, crown:!!d.crown, size:d.size, boss:!!d.boss,
    hp:d.hp, maxHp:d.hp,
    atk:d.atk, atkEsp:d.atkEsp, defFis:d.defFis, defMag:d.defMag,
    spd:d.spd, let:d.let||5,
    xp:d.xp, moves:d.moves,
    defending:false, alive:true, statuses:[], enraged:false, turnCount:0,
    bob: Math.random()*10, shakeT:0, flashT:0, pose:null, poseUntil:0,
  };
}

function startBattle(stage) {
  const s = G.save;
  // itens concedidos pela fase (uma vez por save)
  const grantFlag = 'grant_' + stage.id;
  if (stage.grantOnEnter && !s.flags[grantFlag]) {
    s.flags[grantFlag] = true;
    Object.entries(stage.grantOnEnter).forEach(([id,n]) => { s.inventory[id] = (s.inventory[id]||0) + n; });
    persist();
  }

  // monta a equipe: escalação atual + convidado da fase (test drive)
  const heroes = s.party.filter(id => s.roster[id]).map(id => buildHeroUnit(id, s.roster[id]));
  if (stage.guest && !s.roster[stage.guest]) {
    const levels = Object.values(s.roster).map(h => h.level);
    const avg = Math.max(1, Math.round(levels.reduce((a,b) => a+b, 0) / levels.length));
    heroes.push(buildHeroUnit(stage.guest, newHeroState(stage.guest, avg), true));
  }

  const factor = difficultyFactor(s);
  G.battle = {
    stage, waveIdx: 0, factor,
    heroes,
    enemies: stage.waves[0].map((k,i) => scaledEnemy(k,i,factor)),
    queue: [], active: null, round: 1, over: false,
    xpEarned: 0, turnCounter: 0, logs: [], popups: [], busy: false,
  };

  $('#battle-stage-id').textContent = 'Fase ' + stage.id + (stage.waves.length > 1 ? ` · Onda 1/${stage.waves.length}` : '');
  $('#battle-stage-name').textContent = stage.name;
  show('battle');
  sfx('battleStart', 0.5);
  log(`A batalha em <strong>${esc(stage.name)}</strong> começa!`);
  const tuts = [];
  if (stage.tutorial) tuts.push(stage.tutorial);
  if (heroes.some(h => h.heroId === 'djonga') && !s.flags.tut_punch) tuts.push('punch');
  const runTuts = () => {
    const t = tuts.shift();
    if (t) queueTutorial(t, 'tut_' + t, runTuts);
    else { refillQueue(); nextTurn(); }
  };
  runTuts();
  renderHud();
}

/* ── tutoriais ── */
const tutState = { queue: [], after: null };
function queueTutorial(key, flag, after) {
  const s = G.save;
  if (!key || s.flags[flag]) { if (after) after(); return; }
  s.flags[flag] = true; persist();
  tutState.queue = TUTORIALS[key].slice();
  tutState.after = after || null;
  showNextTut();
}
function showNextTut() {
  const card = tutState.queue.shift();
  if (!card) {
    $('#tutorial-overlay').classList.add('hidden');
    const cb = tutState.after; tutState.after = null;
    if (cb) cb();
    return;
  }
  $('#tut-title').textContent = card.title;
  $('#tut-text').textContent = card.text;
  $('#tutorial-overlay').classList.remove('hidden');
}

/* ── fila de turnos ── */
function aliveUnits() { const b = G.battle; return [...b.heroes, ...b.enemies].filter(u => u.alive); }
function aliveHeroes() { return G.battle.heroes.filter(h => h.alive); }
function initiative(u) {
  let v = u.spd + rand(0, 6);
  if (hasStatus(u,'slow')) v -= 12;
  if (u.enraged) v += 10;
  return v;
}
function refillQueue() {
  const b = G.battle;
  b.queue = aliveUnits().sort((a,z) => initiative(z) - initiative(a));
}

async function nextTurn() {
  const b = G.battle;
  if (!b || b.over) return;
  if (checkEnd()) return;

  if (!b.queue.length) { b.round += 1; refillQueue(); }
  let actor = b.queue.shift();
  while (actor && !actor.alive) actor = b.queue.shift();
  if (!actor) return nextTurn();

  b.turnCounter += 1;
  b.active = actor;
  actor.defending = false;
  $('#battle-round').textContent = 'Rodada ' + b.round;

  // decrementa recargas do herói no início do turno dele
  if (actor.side === 'hero') {
    Object.keys(actor.cds).forEach(k => { if (actor.cds[k] > 0) actor.cds[k] -= 1; });
    actor.counterUsed = false; // Represália renova a cada turno do Luan
  }

  const skipped = tickStartStatuses(actor);
  renderHud();
  if (checkEnd()) return;

  if (skipped) {
    await wait(700);
    tickEndStatuses(actor);
    return nextTurn();
  }

  if (actor.side === 'hero') {
    b.busy = false;
    renderCommandHero(actor);
    renderMenu('root');
  } else {
    b.busy = true;
    renderMenu('waiting');
    await wait(650);
    await enemyAct(actor);
  }
}

/* Painel de comando reflete o herói ativo */
function renderCommandHero(u) {
  const H = HEROES[u.heroId];
  $('#cmd-hero-img').src = H.portrait;
  $('#cmd-hero-name').textContent = H.name + (u.guest ? ' (convidado)' : '');
}

/* ── status ── */
function hasStatus(u,t){ return u.statuses.some(s => s.type === t); }
function addStatus(u,st){
  const ex = u.statuses.find(s => s.type === st.type);
  if (ex) { ex.turns = Math.max(ex.turns, st.turns); ex.value = Math.max(ex.value||0, st.value||0); }
  else u.statuses.push({...st});
}
function removeStatus(u,t){ u.statuses = u.statuses.filter(s => s.type !== t); }

function tickStartStatuses(u) {
  let skip = false;
  const keep = [];
  u.statuses.forEach(st => {
    if (st.type === 'poison') {
      const d = applyDamage(null, u, st.value, {tag:'veneno', color:'#8fdc5a', noMeter:true});
      log(`<strong>${esc(u.name)}</strong> sofre ${d} de veneno. ☠️`);
      if (--st.turns > 0) keep.push(st);
    } else if (st.type === 'burn') {
      const d = applyDamage(null, u, st.value, {tag:'queimadura', color:'#ff9540', noMeter:true});
      log(`<strong>${esc(u.name)}</strong> queima: ${d} de dano. 🔥`);
      if (--st.turns > 0) keep.push(st);
    } else if (st.type === 'regen') {
      const h = applyHeal(u, st.value, { noSeiva:true });
      log(`<strong>${esc(u.name)}</strong> regenera ${h} de vida. 🌹`);
      if (--st.turns > 0) keep.push(st);
    } else if (st.type === 'stun') {
      log(`<strong>${esc(u.name)}</strong> está atordoado e perde a vez! 💫`);
      skip = true;
      if (--st.turns > 0) keep.push(st);
    } else keep.push(st);
  });
  u.statuses = keep;
  return skip;
}
function tickEndStatuses(u) {
  const keep = [];
  u.statuses.forEach(st => {
    if (['slow','taunt','fragil','contra'].includes(st.type)) { if (--st.turns > 0) keep.push(st); }
    else keep.push(st);
  });
  u.statuses = keep;
}

/* ── dano / cura (fórmula: Dano = Poder × (Atq ÷ Def) × variação — sistema-de-builds.md §4) ── */
function applyDamage(src, tgt, power, opt = {}) {
  if (!tgt || !tgt.alive) return 0;
  let v, crit = false;

  if (!src) {
    v = Math.max(1, Math.round(power)); // dano fixo (veneno, efeitos)
  } else {
    const type = opt.type || 'mag';
    const atkVal = type === 'fis' ? src.atk : src.atkEsp;
    const defVal = Math.max(1, type === 'fis' ? tgt.defFis : tgt.defMag);
    v = power * (atkVal / defVal) * (0.9 + Math.random() * 0.2);
    // Passivas Peso das Correntes (Ferro) / Mãos Frias (Geada): +15% em alvos controlados
    const controlled = hasStatus(tgt,'slow') || hasStatus(tgt,'stun');
    if (['ferro','geada'].includes(src.vocacao) && controlled) v *= 1.15;
    // Passiva Fúria Crescente (Luan): +1% de dano por 2% de vida perdida (máx +50%)
    if (src.vocacao === 'furia') v *= 1 + Math.min(0.5, (1 - src.hp / src.maxHp) * 0.5);
    // Guilhotina de Elos: +50% em alvos controlados
    if (opt.bonusVsControlled && controlled) v *= 1.5;
    // Alvo fragilizado (sequência ❄🔥❄ do Djonga): +20% de dano recebido
    if (hasStatus(tgt,'fragil')) v *= 1.2;
    // Crítico via Letalidade (forçado por Choque Térmico)
    if (opt.forceCrit || Math.random() * 100 < (src.let || 0)) { v *= CRIT_MULT; crit = true; }
    v = Math.max(1, Math.round(v));
  }
  if (tgt.defending) v = Math.max(1, Math.round(v * 0.5));

  tgt.hp = clamp(tgt.hp - v, 0, tgt.maxHp);
  tgt.shakeT = performance.now() + 320;
  tgt.flashT = performance.now() + 200;
  popup(tgt, (crit ? '✦ -' : '-') + v, crit ? '#ffd24d' : (opt.color || '#ff6b74'));
  if (crit) log(`💥 <strong>Acerto crítico!</strong>`);
  if (src) sfx(crit ? 'hit2' : ((opt.type || 'mag') === 'mag' ? 'magic' : 'hit'), crit ? 0.55 : 0.4);

  // vítima carrega medidor
  if (tgt.side === 'hero' && !opt.noMeter) gainMeter(tgt, Math.round(v * 0.4));

  if (tgt.hp <= 0) {
    tgt.alive = false;
    tgt.statuses = [];
    log(`<strong>${esc(tgt.name)}</strong> foi derrotado!`);
    if (tgt.side === 'enemy') G.battle.xpEarned += tgt.xp;
  }

  // Contra-ataques do defensor (Escudo-Espelho e Represália do Baluarte)
  if (tgt.alive && tgt.side === 'hero' && src && src.side === 'enemy' && !opt.isCounter && src.alive) {
    if (hasStatus(tgt, 'contra')) {
      removeStatus(tgt, 'contra');
      const cd = applyDamage(tgt, src, 20, {type:'fis', isCounter:true});
      log(`<strong class="hero">${esc(tgt.name)}</strong> reflete o golpe com o Escudo-Espelho: <strong>${cd}</strong> de dano! 🪞`);
    } else if (tgt.vocacao === 'baluarte' && !tgt.counterUsed) {
      tgt.counterUsed = true;
      const cd = applyDamage(tgt, src, 8, {type:'fis', isCounter:true});
      log(`<strong class="hero">${esc(tgt.name)}</strong> contra-ataca (Represália): <strong>${cd}</strong> de dano! ⚔️`);
    }
  }
  return v;
}
function applyHeal(u, amount, opt = {}) {
  if (!u.alive) return 0;
  const prev = u.hp;
  u.hp = clamp(u.hp + Math.round(amount), 0, u.maxHp);
  const h = u.hp - prev;
  if (h > 0) popup(u, '+' + h, '#4fc98a');
  if (h > 0 && !opt.noSeiva) sfx('spell', 0.3);
  // Passiva Seiva Vital (Vocação da Rosa): curas aplicam regeneração
  if (h > 0 && u.vocacao === 'rosa' && !opt.noSeiva) {
    addStatus(u, { type:'regen', turns:2, value:Math.round(u.maxHp * 0.05) });
  }
  return h;
}
/* Cura com valor fixo escala com Ataque Especial (sistema-de-builds.md §4.2) */
function healPower(u, poder) {
  return Math.round(poder * ((u.atkEsp || 100) / 100) * (0.95 + Math.random() * 0.10));
}
function gainMeter(u, n) {
  if (u.side !== 'hero') return;
  const before = u.meter;
  u.meter = clamp(u.meter + n, 0, 100);
  if (before < 100 && u.meter >= 100) {
    log(`O medidor de <strong class="hero">${esc(u.name)}</strong> está completo! A Ultimate brilha. 💠`);
    queueTutorial('meter', 'tut_meter');
  }
}
function popup(u, text, color) {
  G.battle.popups.push({ uid: u.uid, text, color, t0: performance.now() });
}
function log(html) {
  const b = G.battle;
  b.logs.push(html);
  if (b.logs.length > 80) b.logs.shift();
  $('#battle-log').innerHTML = b.logs.slice().reverse().map(l => `<div class="log-line">${l}</div>`).join('');
}

/* ═══════════════════ AÇÕES DO JOGADOR ═══════════════════ */
function renderMenu(mode, ctx) {
  const b = G.battle;
  const menu = $('#cmd-menu');
  const prompt = $('#cmd-prompt');
  menu.innerHTML = '';
  const add = (label, sub, cls, fn, disabled, item) => {
    const btn = document.createElement('button');
    btn.className = 'cmd-btn ' + (cls||'');
    const ico = item ? itemIco(item, 30) : '';
    btn.innerHTML = ico + `<span>${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>`;
    btn.disabled = !!disabled;
    if (fn) btn.addEventListener('click', fn);
    menu.appendChild(btn);
  };

  if (mode === 'waiting') {
    prompt.textContent = b.active ? `${b.active.name} age...` : '...';
    add('Aguardando o inimigo...', null, null, null, true);
    return;
  }

  const hero = b.active && b.active.side === 'hero' ? b.active : aliveHeroes()[0];
  if (!hero) return;
  if (mode === 'root') {
    prompt.textContent = `O que ${hero.name} fará?`;
    // painel de sequência do Djonga
    if (hero.heroId === 'djonga') {
      const seqStr = hero.seq.split('').map(c => c === 'E' ? '🔥' : '❄').join(' ') || '—';
      prompt.innerHTML = `O que ${esc(hero.name)} fará? <span class="seq-tag">Sequência: ${seqStr}</span>`;
    }
    add('⚔ Atacar', 'Dano básico · +20 medidor', null, () => renderMenu('target', {act:'attack'}));
    add('✦ Habilidades', 'Golpes de ' + hero.name, null, () => renderMenu('skills'));
    const ult = currentUlt(hero.heroId, hero.hs);
    const ready = hero.meter >= 100;
    add('💠 ' + ult.name, ready ? 'PRONTA! Medidor 100%' : `Medidor ${hero.meter}%`, ready ? 'ult-ready' : '', () => doUltimate(), !ready);
    add('🛡 Defender', 'Reduz dano 50% · +15 medidor', null, () => doDefend());
    add('🎒 Itens', 'Usa um item do alforje', null, () => renderMenu('items'));
    add('⏳ Aguardar', 'Pula a vez · +12 medidor', null, () => doWaitTurn());
    return;
  }

  if (mode === 'skills') {
    prompt.textContent = 'Escolha uma habilidade';
    const equipped = battleLoadout(hero.heroId, hero.hs);
    if (!equipped.length) add('Nenhuma habilidade equipada', 'Monte o loadout no Salão da Ordem', null, null, true);
    equipped.forEach(id => {
      const sk = SKILLS[id];
      const cd = hero.cds[id] || 0;
      add(sk.name, cd > 0 ? `Recarga: ${cd} turno(s)` : sk.hint, null, () => {
        if (sk.selfCast) doSkill(sk, hero);
        else renderMenu('target', {act:'skill', skill:sk});
      }, cd > 0);
    });
    add('‹ Voltar', null, 'back', () => renderMenu('root'));
    return;
  }

  if (mode === 'items') {
    prompt.textContent = 'Escolha um item';
    const entries = Object.entries(G.save.inventory).filter(([id,n]) => n > 0 && ITEMS[id] && !ITEMS[id].noBattle);
    if (!entries.length) add('Alforje vazio', 'Vença batalhas para coletar itens', null, null, true);
    entries.forEach(([id,n]) => {
      const it = ITEMS[id];
      add(`${it.name} ×${n}`, it.desc, 'has-ico', () => doItem(id), false, it);
    });
    add('‹ Voltar', null, 'back', () => renderMenu('root'));
    return;
  }

  if (mode === 'target') {
    prompt.textContent = 'Escolha o alvo';
    b.enemies.filter(e => e.alive).forEach(e => {
      add(`${e.icon} ${e.name}`, `${e.hp}/${e.maxHp} HP`, 'target', () => {
        if (ctx.act === 'attack') doAttack(e);
        else doSkill(ctx.skill, e);
      });
    });
    add('‹ Voltar', null, 'back', () => renderMenu('root'));
  }
}

function reactEnemies(ms) {
  if (!G.battle) return;
  G.battle.enemies.filter(e => e.alive).forEach(e => setUnitPose(e, 'defend', ms));
}

async function endHeroAction() {
  const b = G.battle;
  renderMenu('waiting');
  renderHud();
  if (checkEnd()) return;
  if (b.active) tickEndStatuses(b.active);
  await wait(720);
  nextTurn();
}

/* Ataque básico por herói */
const BASIC_ATTACK = {
  joao:   { type:'mag', power:14, verb:'golpeia', flavor:'com a Rosa Azul' },
  djonga: { type:'fis', power:14, verb:'soca', flavor:'com um jab seco' },
  luan:   { type:'fis', power:14, verb:'corta', flavor:'com a lâmina' },
};

function doAttack(target) {
  const b = G.battle;
  if (b.busy) return; b.busy = true;
  const h = b.active;
  const ba = BASIC_ATTACK[h.heroId] || BASIC_ATTACK.joao;
  setHeroPose('attack', 850);
  reactEnemies(900);
  const d = applyDamage(h, target, ba.power, {type:ba.type});
  log(`<strong class="hero">${esc(h.name)}</strong> ${ba.verb} <strong>${esc(target.name)}</strong> ${ba.flavor}: <strong>${d}</strong> de dano.`);
  gainMeter(h, 20);
  endHeroAction();
}

/* Sequência de socos do Djonga: registra o soco e dispara combos */
function registerPunch(h, punch, target) {
  h.seq = (h.seq + punch).slice(-3);
  const combo = PUNCH_COMBOS.find(c => c.seq === h.seq);
  if (!combo) return;
  h.seq = '';
  popup(h, combo.name + '!', '#ffd24d');
  if (combo.effect === 'burn') {
    const val = h.vocacao === 'brasa' ? 21 : 14;
    addStatus(target, {type:'burn', turns:2, value:val});
    log(`💥 <strong>SEQUÊNCIA ${combo.icon} — ${combo.name}!</strong> ${esc(target.name)} pega fogo!`);
  } else if (combo.effect === 'stun') {
    addStatus(target, {type:'stun', turns:1});
    log(`💥 <strong>SEQUÊNCIA ${combo.icon} — ${combo.name}!</strong> ${esc(target.name)} congela e perde a vez!`);
  } else if (combo.effect === 'shock') {
    const d = applyDamage(h, target, 15, {type:'fis', forceCrit:true});
    log(`💥 <strong>SEQUÊNCIA ${combo.icon} — ${combo.name}!</strong> Impacto crítico de <strong>${d}</strong>!`);
  } else if (combo.effect === 'expose') {
    addStatus(target, {type:'slow', turns:2});
    addStatus(target, {type:'fragil', turns:2});
    log(`💥 <strong>SEQUÊNCIA ${combo.icon} — ${combo.name}!</strong> ${esc(target.name)} fica lento e vulnerável!`);
  }
}

/* pose visual de cada habilidade (novas reaproveitam sprites existentes) */
const SKILL_POSE = {
  chains:'chains', thorns:'thorns', petals:'petals', prison:'prison',
  gemeas:'chains', tranca:'prison', guilhotina:'prison',
  roseira:'petals', chuva:'petals', mortifera:'thorns',
};

function doSkill(sk, target) {
  const b = G.battle;
  if (b.busy) return; b.busy = true;
  const h = b.active;
  h.cds[sk.id] = sk.cd + 1;
  setHeroPose(SKILL_POSE[sk.id] || 'attack', 900);
  reactEnemies(900);

  /* ── DJONGA ── */
  if (sk.punch) {
    const d = applyDamage(h, target, sk.power, {type:sk.type});
    const ico = sk.punch === 'E' ? '🔥' : '❄';
    log(`<strong class="hero">${esc(h.name)}</strong> desfere <strong>${esc(sk.name)}</strong> ${ico}: ${d} de dano.`);
    registerPunch(h, sk.punch, target);
    gainMeter(h, 15);
    return endHeroAction();
  }
  if (sk.id === 'gancho') {
    const d = applyDamage(h, target, sk.power, {type:sk.type});
    log(`<strong class="hero">${esc(h.name)}</strong> arranca <strong>${esc(target.name)}</strong> do chão com o <strong>Gancho Ascendente</strong>: <strong>${d}</strong> de dano! 🥊`);
  } else if (sk.id === 'clinch') {
    const d = applyDamage(h, target, sk.power, {type:sk.type});
    addStatus(target, {type:'stun', turns:1});
    log(`<strong class="hero">${esc(h.name)}</strong> trava <strong>${esc(target.name)}</strong> no <strong>Clinch</strong>: ${d} de dano e atordoamento! 💫`);
  } else if (sk.id === 'pe_brasa') {
    const d = applyDamage(h, target, sk.power, {type:sk.type});
    addStatus(target, {type:'burn', turns:2, value: h.vocacao === 'brasa' ? 21 : 14});
    log(`<strong class="hero">${esc(h.name)}</strong> acerta o <strong>Pé na Brasa</strong>: ${d} de dano e queimadura! 🔥`);
  } else if (sk.id === 'fornalha_skill') {
    b.enemies.filter(e => e.alive).forEach(e => {
      applyDamage(h, e, sk.power, {type:sk.type});
      addStatus(e, {type:'burn', turns:3, value: h.vocacao === 'brasa' ? 18 : 12});
    });
    log(`<strong class="hero">${esc(h.name)}</strong> abre o <strong>Abraço da Fornalha</strong>: todos os inimigos queimam! 🔥🔥`);
  } else if (sk.id === 'pavio_skill') {
    const d = applyDamage(h, target, sk.power, {type:sk.type, forceCrit: Math.random() < 0.5});
    log(`<strong class="hero">${esc(h.name)}</strong> detona a <strong>Explosão do Pavio</strong>: <strong>${d}</strong> de dano! 💥`);
  } else if (sk.id === 'nevasca') {
    const others = b.enemies.filter(e => e.alive && e.uid !== target.uid);
    const second = others.length ? others[rand(0, others.length - 1)] : null;
    const d1 = applyDamage(h, target, sk.power, {type:sk.type});
    addStatus(target, {type:'slow', turns:2});
    if (second) { applyDamage(h, second, sk.power, {type:sk.type}); addStatus(second, {type:'slow', turns:2}); }
    log(`<strong class="hero">${esc(h.name)}</strong> dispara a <strong>Nevasca de Jabs</strong>: ${d1} de dano e lentidão! ❄`);
  } else if (sk.id === 'zero_skill') {
    const d = applyDamage(h, target, sk.power, {type:sk.type});
    addStatus(target, {type:'stun', turns:1});
    log(`<strong class="hero">${esc(h.name)}</strong> aplica o <strong>Zero Absoluto</strong>: ${d} de dano e congelamento! ❄💫`);
  } else if (sk.id === 'granizo_skill') {
    b.enemies.filter(e => e.alive).forEach(e => {
      applyDamage(h, e, sk.power, {type:sk.type});
      addStatus(e, {type:'slow', turns:2});
    });
    log(`<strong class="hero">${esc(h.name)}</strong> invoca a <strong>Tempestade de Granizo</strong>: gelo em todos! ❄❄`);

  /* ── LUAN ── */
  } else if (sk.id === 'cone') {
    const others = b.enemies.filter(e => e.alive && e.uid !== target.uid);
    const second = others.length ? others[rand(0, others.length - 1)] : null;
    const d1 = applyDamage(h, target, sk.power, {type:sk.type});
    let msg = `<strong class="hero">${esc(h.name)}</strong> varre com o <strong>Corte em Cone</strong>: ${d1} em <strong>${esc(target.name)}</strong>`;
    if (second) { const d2 = applyDamage(h, second, sk.power, {type:sk.type}); msg += ` e ${d2} em <strong>${esc(second.name)}</strong>`; }
    log(msg + '. ⚔️');
  } else if (sk.id === 'postura') {
    addStatus(h, {type:'taunt', turns:2});
    h.defending = true;
    log(`<strong class="hero">${esc(h.name)}</strong> bate o punho no escudo: <strong>PROVOCA</strong> os inimigos e assume a guarda! 🛡`);
  } else if (sk.id === 'lamina_veloz') {
    const d = applyDamage(h, target, sk.power, {type:sk.type});
    log(`<strong class="hero">${esc(h.name)}</strong> desfere a <strong>Lâmina Veloz</strong>: ${d} de dano. ⚔️`);
  } else if (sk.id === 'julgamento') {
    const wounded = h.hp / h.maxHp < 0.5;
    const d = applyDamage(h, target, wounded ? sk.power * 1.5 : sk.power, {type:sk.type});
    log(`<strong class="hero">${esc(h.name)}</strong> desce o <strong>Julgamento</strong>${wounded ? ' <em>ferido</em>' : ''}: <strong>${d}</strong> de dano! ⚖️`);
  } else if (sk.id === 'corte_sangrento') {
    const custo = Math.round(h.maxHp * 0.08);
    h.hp = clamp(h.hp - custo, 1, h.maxHp);
    popup(h, '-' + custo, '#ff6b74');
    const d = applyDamage(h, target, sk.power, {type:sk.type});
    log(`<strong class="hero">${esc(h.name)}</strong> paga em sangue (${custo}) pelo <strong>Corte Sangrento</strong>: <strong>${d}</strong> de dano! 🩸`);
  } else if (sk.id === 'carnificina') {
    const bonus = 1 + Math.min(0.5, (1 - h.hp / h.maxHp));
    b.enemies.filter(e => e.alive).forEach(e => applyDamage(h, e, sk.power * bonus, {type:sk.type}));
    log(`<strong class="hero">${esc(h.name)}</strong> desencadeia a <strong>Carnificina</strong> em todos os inimigos! 🩸⚔️`);
  } else if (sk.id === 'ultimo_fio') {
    const desperate = h.hp / h.maxHp < 0.25;
    const d = applyDamage(h, target, desperate ? sk.power * 2 : sk.power, {type:sk.type});
    log(`<strong class="hero">${esc(h.name)}</strong> corta no <strong>Último Fio</strong>${desperate ? ' <em>à beira do fim</em>' : ''}: <strong>${d}</strong> de dano! ⚔️`);
  } else if (sk.id === 'muralha') {
    addStatus(h, {type:'taunt', turns:2});
    applyHeal(h, Math.round(h.maxHp * 0.15));
    log(`<strong class="hero">${esc(h.name)}</strong> ergue a <strong>Muralha Viva</strong>: provoca todos e recupera o fôlego! 🛡✨`);
  } else if (sk.id === 'escudo_espelho') {
    h.defending = true;
    addStatus(h, {type:'contra', turns:2});
    log(`<strong class="hero">${esc(h.name)}</strong> assume o <strong>Escudo-Espelho</strong>: defesa total e contra-ataque armado! 🪞`);
  } else if (sk.id === 'quebra_cerco') {
    b.enemies.filter(e => e.alive).forEach(e => {
      applyDamage(h, e, sk.power, {type:sk.type});
      addStatus(e, {type:'slow', turns:2});
    });
    log(`<strong class="hero">${esc(h.name)}</strong> rompe o cerco de escudo em riste: dano e lentidão em todos! 🛡💨`);

  /* ── JOÃO ── */
  } else if (sk.id === 'chains') {
    const d = applyDamage(h, target, sk.power, {type:sk.type});
    addStatus(target, {type:'slow', turns:2});
    log(`<strong class="hero">João</strong> lança <strong>Correntes Azuis</strong>: ${d} de dano e <strong>${esc(target.name)}</strong> fica lento. ⛓️`);
  } else if (sk.id === 'thorns') {
    const d = applyDamage(h, target, sk.power, {type:sk.type});
    addStatus(target, {type:'poison', turns:3, value:12});
    log(`<strong class="hero">João</strong> crava <strong>Espinhos da Rosa</strong>: ${d} de dano e veneno por 3 turnos. 🌹☠️`);
  } else if (sk.id === 'petals') {
    const healed = applyHeal(h, Math.round(h.maxHp * 0.30));
    h.defending = true;
    log(`<strong class="hero">João</strong> invoca <strong>Pétalas Vítreas</strong>: recupera ${healed} de vida e assume postura defensiva. 🌹🛡`);
  } else if (sk.id === 'prison') {
    const d = applyDamage(h, target, sk.power, {type:sk.type});
    addStatus(target, {type:'stun', turns:1});
    log(`<strong class="hero">João</strong> fecha a <strong>Prisão de Ferro</strong>: ${d} de dano e <strong>${esc(target.name)}</strong> é atordoado! ⛓️💫`);
  } else if (sk.id === 'gemeas') {
    const others = b.enemies.filter(e => e.alive && e.uid !== target.uid);
    const second = others.length ? others[rand(0, others.length - 1)] : null;
    const d1 = applyDamage(h, target, sk.power, {type:sk.type});
    addStatus(target, {type:'slow', turns:2});
    let msg = `<strong class="hero">João</strong> dispara <strong>Correntes Gêmeas</strong>: ${d1} de dano em <strong>${esc(target.name)}</strong>`;
    if (second) {
      const d2 = applyDamage(h, second, sk.power, {type:sk.type});
      addStatus(second, {type:'slow', turns:2});
      msg += ` e ${d2} em <strong>${esc(second.name)}</strong>`;
    }
    log(msg + ' — ambos ficam lentos. ⛓️⛓️');
  } else if (sk.id === 'tranca') {
    const d = applyDamage(h, target, sk.power, {type:sk.type});
    addStatus(target, {type:'stun', turns:1});
    addStatus(target, {type:'slow', turns:2});
    log(`<strong class="hero">João</strong> sela a <strong>Tranca Absoluta</strong>: ${d} de dano, atordoamento e lentidão! ⛓️🔒`);
  } else if (sk.id === 'guilhotina') {
    const d = applyDamage(h, target, sk.power, {type:sk.type, bonusVsControlled:true});
    log(`<strong class="hero">João</strong> faz cair a <strong>Guilhotina de Elos</strong>: <strong>${d}</strong> de dano! ⛓️⚔️`);
  } else if (sk.id === 'roseira') {
    const healed = applyHeal(h, healPower(h, 90));
    addStatus(h, {type:'regen', turns:3, value:Math.round(h.maxHp * 0.06)});
    log(`<strong class="hero">João</strong> ergue a <strong>Roseira Guardiã</strong>: recupera ${healed} de vida e regenera por 3 turnos. 🌹✨`);
  } else if (sk.id === 'chuva') {
    const healed = applyHeal(h, Math.round(h.maxHp * 0.25));
    removeStatus(h, 'poison'); removeStatus(h, 'slow');
    log(`<strong class="hero">João</strong> invoca a <strong>Chuva de Pétalas</strong>: ${healed} de vida e purificação. 🌹🌧️`);
  } else if (sk.id === 'mortifera') {
    const d = applyDamage(h, target, sk.power, {type:sk.type});
    addStatus(target, {type:'poison', turns:3, value:20});
    log(`<strong class="hero">João</strong> revela a <strong>Rosa Mortífera</strong>: ${d} de dano e veneno devastador. 🌹☠️`);
  }
  gainMeter(h, 15);
  endHeroAction();
}

async function doUltimate() {
  const b = G.battle;
  if (b.busy) return; b.busy = true;
  const h = b.active;
  if (h.meter < 100) { b.busy = false; return; }
  h.meter = 0;
  const ult = currentUlt(h.heroId, h.hs);
  renderMenu('waiting');

  await playUltCutscene(ult, h);

  const foes = b.enemies.filter(e => e.alive);
  if (ult.id === 'garden') {
    const apex = h.level >= APEX_LEVEL && h.vocacao === 'ferro';
    foes.forEach((e, i) => {
      applyDamage(h, e, apex ? 30 : 22, {type:'mag'});
      if (apex || i === 0) addStatus(e, {type:'stun', turns:1});
    });
    log(`<strong class="hero">João</strong> desencadeia o <strong>JARDIM DE FERRO${apex ? ': FORMA FINAL' : ''}</strong>! Correntes irrompem do chão e atingem todos os inimigos. ⛓️🌹`);
  } else if (ult.id === 'bloom') {
    const apex = h.level >= APEX_LEVEL && h.vocacao === 'rosa';
    foes.forEach(e => applyDamage(h, e, 15, {type:'mag'}));
    applyHeal(h, Math.round(h.maxHp * (apex ? 0.50 : 0.35)));
    addStatus(h, {type:'regen', turns:apex ? 4 : 3, value:Math.round(h.maxHp * 0.06)});
    log(`<strong class="hero">João</strong> faz o Jardim <strong>FLORESCER${apex ? ' — FORMA FINAL' : ''}</strong>: dano em área, vida restaurada e pétalas regenerantes. 🌹✨`);
  } else if (ult.id === 'sequencia') {
    const apex = h.level >= APEX_LEVEL && h.vocacao;
    const hits = apex ? 7 : 5;
    let total = 0;
    for (let i = 0; i < hits; i++) {
      const t = b.enemies.find(e => e.alive);
      if (!t) break;
      total += applyDamage(h, t, 10, {type:'fis'});
      await wait(160);
    }
    if (apex && h.vocacao === 'brasa') foes.forEach(e => e.alive && addStatus(e, {type:'burn', turns:2, value:21}));
    if (apex && h.vocacao === 'geada') foes.forEach(e => e.alive && addStatus(e, {type:'slow', turns:2}));
    log(`<strong class="hero">Djonga</strong> desfere a <strong>SEQUÊNCIA INFINITA${apex ? ': FORMA FINAL' : ''}</strong> — ${hits} socos, <strong>${total}</strong> de dano total! 🔥❄`);
  } else if (ult.id === 'tempestade') {
    const apex = h.level >= APEX_LEVEL && h.vocacao;
    const bonus = h.vocacao === 'furia' ? 1 + Math.min(0.5, (1 - h.hp / h.maxHp)) : 1;
    foes.forEach(e => applyDamage(h, e, (apex ? 26 : 20) * bonus, {type:'fis'}));
    h.defending = true;
    if (apex && h.vocacao === 'baluarte') addStatus(h, {type:'taunt', turns:2});
    log(`<strong class="hero">Luan</strong> gira a <strong>TEMPESTADE DE AÇO${apex ? ': FORMA FINAL' : ''}</strong>: lâminas em todos os inimigos! ⚔️🌪️`);
  }
  endHeroAction();
}

function doDefend() {
  const b = G.battle;
  if (b.busy) return; b.busy = true;
  const h = b.active;
  h.defending = true;
  setHeroPose('defend', 900);
  gainMeter(h, 15);
  log(`<strong class="hero">${esc(h.name)}</strong> assume postura defensiva. 🛡`);
  endHeroAction();
}

function doWaitTurn() {
  const b = G.battle;
  if (b.busy) return; b.busy = true;
  gainMeter(b.active, 12);
  log(`<strong class="hero">${esc(b.active.name)}</strong> estuda o campo e concentra energia. ⏳`);
  endHeroAction();
}

function doItem(id) {
  const b = G.battle;
  if (b.busy) return; b.busy = true;
  const h = b.active;
  const inv = G.save.inventory;
  if (!inv[id]) { b.busy = false; return; }
  inv[id] -= 1; persist();
  const it = ITEMS[id];
  if (id === 'pocao_menor') applyHeal(h, 60);
  if (id === 'pocao_maior') applyHeal(h, 150);
  if (id === 'elixir_azul') gainMeter(h, 50);
  if (id === 'tonico') { removeStatus(h,'poison'); removeStatus(h,'slow'); removeStatus(h,'burn'); applyHeal(h, 40); }
  log(`<strong class="hero">${esc(h.name)}</strong> usa <strong>${esc(it.name)}</strong>. ${it.icon}`);
  endHeroAction();
}

/* ═══════════════════ IA INIMIGA ═══════════════════ */
/* Escolha de alvo: Provocar tem prioridade absoluta; senão, alvo aleatório vivo */
function pickHeroTarget() {
  const alive = aliveHeroes();
  if (!alive.length) return null;
  const taunters = alive.filter(h => hasStatus(h, 'taunt'));
  const pool = taunters.length ? taunters : alive;
  return pool[rand(0, pool.length - 1)];
}

async function enemyAct(e) {
  const b = G.battle;
  e.turnCount += 1;

  if (e.boss) return bossAct(e);

  const h = pickHeroTarget();
  if (!h) return;
  // escolhe movimento pela tabela de chances
  let mv = e.moves[e.moves.length - 1];
  for (const m of e.moves) { if (Math.random() < m.chance) { mv = m; break; } }
  const hits = mv.hits || 1;
  setUnitPose(e, 'attack', 550 + hits * 260 + 680);
  let total = 0;
  for (let i = 0; i < hits; i++) {
    total += applyDamage(e, h, mv.power, {type:mv.type || 'fis'});
    if (hits > 1) await wait(240);
  }
  log(`<strong>${esc(e.name)}</strong> ${mv.label} <strong class="hero">${esc(h.name)}</strong>: <strong>${total}</strong> de dano.`);
  renderHud();
  if (checkEnd()) return;
  tickEndStatuses(e);
  await wait(680);
  nextTurn();
}

async function bossAct(e) {
  const b = G.battle;
  const h = pickHeroTarget();
  if (!h) return;

  if (!e.enraged && e.hp / e.maxHp <= 0.4) {
    e.enraged = true;
    e.atk = Math.round(e.atk * 1.3);
    sfx('bossRoar', 0.6);
    log(`<strong>${esc(e.name)}</strong> entra em <strong>FÚRIA</strong>! 🔥`);
    popup(e, 'FÚRIA!', '#ff9540');
    renderHud();
    await wait(750);
  }

  const cycle = e.enraged ? 2 : 3;
  if (e.kind === 'djonga_boss') {
    // Duelo: Djonga usa as próprias sequências contra você
    if (e.turnCount % 3 === 0) {
      setUnitPose(e, 'attack', 1350);
      const d1 = applyDamage(e, h, 15, {type:'fis'});
      await wait(240);
      const d2 = applyDamage(e, h, 15, {type:'fis'});
      addStatus(h, {type:'burn', turns:2, value:12});
      log(`<strong>${esc(e.name)}</strong> emenda a <strong>SEQUÊNCIA DE BRASA</strong> em <strong class="hero">${esc(h.name)}</strong>: ${d1 + d2} de dano + queimadura! 🔥🔥`);
    } else if (e.enraged && e.turnCount % 2 === 0) {
      setUnitPose(e, 'attack', 1350);
      const d = applyDamage(e, h, 24, {type:'fis'});
      addStatus(h, {type:'slow', turns:2});
      log(`<strong>${esc(e.name)}</strong> crava o <strong>DIRETO DE GEADA</strong>: <strong>${d}</strong> de dano e lentidão! ❄`);
    } else {
      setUnitPose(e, 'attack', 1350);
      const d = applyDamage(e, h, 18, {type:'fis'});
      log(`<strong>${esc(e.name)}</strong> soca <strong class="hero">${esc(h.name)}</strong> com respeito e força: <strong>${d}</strong> de dano.`);
    }
  } else if (e.kind === 'cavaleiro') {
    if (e.turnCount % cycle === 0) {
      setUnitPose(e, 'attack', 1350);
      // Lâmina da Névoa: dano MÁGICO em todos os heróis
      let total = 0;
      aliveHeroes().forEach(hh => { total += applyDamage(e, hh, 20, {type:'mag'}); });
      log(`<strong>${esc(e.name)}</strong> faz a névoa cortar TODOS: <strong>LÂMINA DA NÉVOA</strong>, ${total} de dano total! 🌫️⚔️`);
    } else {
      setUnitPose(e, 'attack', 1350);
      const d = applyDamage(e, h, 24, {type:'fis'});
      log(`<strong>${esc(e.name)}</strong> desce o montante cinzento em <strong class="hero">${esc(h.name)}</strong>: <strong>${d}</strong> de dano.`);
    }
  } else {
    // Grug
    if (e.turnCount % cycle === 0) {
      setUnitPose(e, 'attack', 1350);
      const d = applyDamage(e, h, 38, {type:'fis'});
      log(`<strong>${esc(e.name)}</strong> solta o <strong>GRITO DEVASTADOR</strong>: <strong>${d}</strong> de dano brutal! 💥`);
    } else if (e.hp / e.maxHp < 0.7 && Math.random() < 0.25) {
      const heal = applyHeal(e, 40);
      log(`<strong>${esc(e.name)}</strong> devora rações goblins e recupera ${heal} de vida. 🍖`);
    } else {
      setUnitPose(e, 'attack', 1350);
      const d = applyDamage(e, h, 22, {type:'fis'});
      log(`<strong>${esc(e.name)}</strong> esmaga <strong class="hero">${esc(h.name)}</strong> com a clava real: <strong>${d}</strong> de dano.`);
    }
  }
  renderHud();
  if (checkEnd()) return;
  tickEndStatuses(e);
  await wait(700);
  nextTurn();
}

/* ═══════════════════ ONDAS E FIM DE BATALHA ═══════════════════ */
function checkEnd() {
  const b = G.battle;
  if (b.over) return true;
  const heroesDead = b.heroes.every(h => !h.alive);
  const foesDead = b.enemies.every(e => !e.alive);

  if (heroesDead) { b.over = true; setTimeout(() => finishBattle(false), 900); return true; }

  if (foesDead) {
    if (b.waveIdx < b.stage.waves.length - 1) {
      b.waveIdx += 1;
      const banner = $('#wave-banner');
      banner.textContent = `Onda ${b.waveIdx + 1} de ${b.stage.waves.length}!`;
      banner.classList.remove('hidden');
      log(`⚔️ <strong>Nova onda de inimigos se aproxima!</strong>`);
      $('#battle-stage-id').textContent = `Fase ${b.stage.id} · Onda ${b.waveIdx + 1}/${b.stage.waves.length}`;
      setTimeout(() => {
        banner.classList.add('hidden');
        b.enemies = b.stage.waves[b.waveIdx].map((k,i) => scaledEnemy(k,i,b.factor));
        refillQueue();
        renderHud();
        nextTurn();
      }, 1400);
      return true; // interrompe o fluxo atual; nextTurn é retomado após a onda
    }
    b.over = true;
    setTimeout(() => finishBattle(true), 900);
    return true;
  }
  return false;
}

function finishBattle(victory) {
  const b = G.battle;
  const s = G.save;
  $('#btn-result-retry').classList.add('hidden');
  $('#result-levelup').classList.add('hidden');

  if (!victory) {
    $('#result-eyebrow').textContent = 'Derrota';
    $('#result-title').textContent = 'A Ordem recua...';
    $('#result-copy').textContent = 'Mas heróis de Adaptia não conhecem o fim. Recupere o fôlego, ajuste a equipe no Salão da Ordem e tente novamente — nenhum progresso foi perdido.';
    $('#result-rows').innerHTML = '';
    $('#btn-result-retry').classList.remove('hidden');
    $('#btn-result-continue').textContent = 'Voltar ao mapa';
    $('#btn-result-continue').onclick = () => { renderMap(); show('map'); };
    show('result');
    return;
  }

  const firstClear = !s.cleared.includes(b.stage.id);
  const xp = b.xpEarned + (firstClear ? b.stage.clearBonus : 0);
  const rows = [[`XP dos inimigos`, b.xpEarned + ' XP']];
  if (firstClear) rows.push(['Bônus de primeira vitória', '+' + b.stage.clearBonus + ' XP']);

  // drops (apenas na primeira vitória)
  if (firstClear && b.stage.drops) {
    Object.entries(b.stage.drops).forEach(([id,n]) => {
      s.inventory[id] = (s.inventory[id]||0) + n;
      rows.push([itemIco(ITEMS[id], 22) + ' ' + ITEMS[id].name, '×' + n]);
    });
  }
  // drops de equipamento (apenas na primeira vitória)
  let droppedEquip = false;
  if (firstClear && b.stage.dropsEquip) {
    Object.entries(b.stage.dropsEquip).forEach(([id,n]) => {
      s.equipOwned[id] = (s.equipOwned[id]||0) + n;
      rows.push([equipIco(EQUIPMENT[id], 22) + ' ' + EQUIPMENT[id].name, 'equip.']);
      droppedEquip = true;
    });
  }

  // XP para todos os heróis escalados (+3 Pontos de Atributo por nível)
  const levelUps = [];
  b.heroes.filter(u => !u.guest).forEach(u => {
    const hs = s.roster[u.heroId];
    if (!hs) return;
    hs.xp += xp;
    let leveled = 0;
    while (hs.level < MAX_LEVEL && hs.xp >= xpForNext(hs.level)) {
      hs.xp -= xpForNext(hs.level);
      hs.level += 1; hs.attrPoints += POINTS_PER_LEVEL; leveled += 1;
    }
    if (hs.level >= MAX_LEVEL) hs.xp = 0;
    if (leveled > 0) levelUps.push(`${HEROES[u.heroId].name} → nível ${hs.level} (+${leveled * POINTS_PER_LEVEL} pts)`);
  });
  if (firstClear) s.cleared.push(b.stage.id);

  // recrutamento: liberou a região do herói?
  const region = regionOfStage(b.stage.id);
  let recruited = null;
  if (region && region.heroReward && !s.roster[region.heroReward] && regionCleared(s, region.id)) {
    recruitHero(s, region.heroReward);
    recruited = region.heroReward;
  }
  persist();

  $('#result-eyebrow').textContent = b.stage.boss ? 'Chefe derrotado' : 'Vitória';
  $('#result-title').textContent = b.stage.boss ? region.name + ' está livre!' : b.stage.name + ' superada!';
  $('#result-copy').textContent = b.stage.boss
    ? (recruited ? HEROES[recruited].name + ' se junta à Ordem! A região respira aliviada.' : 'A região respira aliviada. A vanguarda de Malvorax recua.')
    : 'A trilha adiante se abre. Fortaleça sua equipe antes de seguir.';
  $('#result-rows').innerHTML = rows.map(([k,v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('');

  if (levelUps.length) {
    const lv = $('#result-levelup');
    lv.classList.remove('hidden');
    lv.innerHTML = '⬆ ' + levelUps.join(' · ');
  }

  const isBoss = b.stage.boss;
  $('#btn-result-continue').textContent = 'Continuar';
  $('#btn-result-continue').onclick = () => {
    if (levelUps.length) queueTutorial('skillup', 'tut_skillup');
    if (droppedEquip) queueTutorial('equip', 'tut_equip');
    const afterStories = () => { renderMap(); show('map'); };
    if (isBoss && region.id === 'colinas' && !s.flags.epilogueSeen) {
      s.flags.epilogueSeen = true; persist();
      playStory(STORY_EPILOGUE, afterStories, 'assets/bg/colinas.jpg');
    } else if (recruited && REGION_STORIES[region.id]) {
      s.flags['epilogue_' + region.id] = true; persist();
      playStory(REGION_STORIES[region.id].epilogue, () => {
        queueTutorial('recruit', 'tut_recruit');
        afterStories();
      }, b.stage.bg);
    } else {
      afterStories();
    }
  };
  show('result');
}

/* ═══════════════════ CUTSCENE DE ULTIMATE ═══════════════════ */
const ULT_MEDIA = {
  garden:     { sprite:'assets/heroes/joao-ult-garden.png', fx:'assets/fx/garden.png', particles:['🌹','💠'] },
  bloom:      { sprite:'assets/heroes/joao-ult-bloom.png',  fx:'assets/fx/bloom.png',  particles:['🌹','💠'] },
  sequencia:  { sprite:'assets/heroes/djonga-battle.png',   fx:'assets/fx/garden.png', particles:['🔥','❄'], fallback:'assets/djonga.png' },
  tempestade: { sprite:'assets/heroes/luan-battle.png',     fx:'assets/fx/garden.png', particles:['⚔️','🌪️'], fallback:'assets/luan.png' },
};
function playUltCutscene(ult, unit) {
  return new Promise(resolve => {
    const ov = $('#ult-overlay');
    const media = ULT_MEDIA[ult.id] || ULT_MEDIA.garden;
    $('#ult-name').textContent = ult.shout;
    $('#ult-caller').textContent = (unit ? unit.name : 'Herói') + ' invoca';
    const spriteEl = $('#ult-sprite');
    spriteEl.onerror = () => { if (media.fallback) { spriteEl.onerror = null; spriteEl.src = media.fallback; } };
    spriteEl.src = media.sprite;
    $('#ult-effect').src = media.fx;
    ov.classList.toggle('bloom', ult.id === 'bloom');
    const pet = $('#ult-petals');
    pet.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const sp = document.createElement('span');
      sp.textContent = media.particles[rand(0, media.particles.length - 1)];
      sp.style.left = rand(0, 96) + '%';
      sp.style.animationDuration = (1.4 + Math.random() * 1.4) + 's';
      sp.style.animationDelay = (Math.random() * 0.6) + 's';
      sp.style.fontSize = rand(16, 34) + 'px';
      pet.appendChild(sp);
    }
    // reinicia animações
    ov.classList.add('hidden');
    void ov.offsetWidth;
    ov.classList.remove('hidden');
    setTimeout(() => { ov.classList.add('hidden'); resolve(); }, 2050);
  });
}

/* ═══════════════════ HUD + RENDER CANVAS ═══════════════════ */
function renderHud() {
  const b = G.battle;
  if (!b) return;
  const h = (b.active && b.active.side === 'hero') ? b.active : (aliveHeroes()[0] || b.heroes[0]);
  if (!h) return;
  renderCommandHero(h);

  $('#cmd-hp-fill').style.width = clamp(h.hp / h.maxHp * 100, 0, 100) + '%';
  $('#cmd-hp-label').textContent = `${h.hp}/${h.maxHp} HP`;
  $('#cmd-sp-fill').style.width = clamp(h.meter, 0, 100) + '%';
  $('#cmd-sp-label').textContent = `Ultimate ${h.meter}%`;

  const tags = [];
  if (h.defending) tags.push('<span class="st-buff">DEFENDENDO</span>');
  h.statuses.forEach(st => {
    const map = { poison:['VENENO','st-debuff'], burn:['QUEIMANDO','st-debuff'], slow:['LENTO','st-debuff'], stun:['ATORDOADO','st-debuff'],
                  regen:['REGEN','st-buff'], taunt:['PROVOCANDO','st-buff'], contra:['CONTRA-ATAQUE','st-buff'], fragil:['FRÁGIL','st-debuff'] };
    const m = map[st.type]; if (m) tags.push(`<span class="${m[1]}">${m[0]} ${st.turns}t</span>`);
  });
  $('#cmd-status-tags').innerHTML = tags.join('');

  // fila de turnos
  const HERO_ICONS = { joao:'🌹', djonga:'🥊', luan:'⚔️' };
  const preview = [b.active, ...b.queue].filter(Boolean)
    .filter((u,i,arr) => u.alive && arr.findIndex(x => x.uid === u.uid) === i).slice(0, 7);
  $('#turn-list').innerHTML = preview.map(u => `
    <div class="turn-pill ${b.active?.uid === u.uid ? 'now' : ''} ${u.side}">
      <span class="tp-ico">${u.side === 'hero' ? (HERO_ICONS[u.heroId] || '🌹') : u.icon}</span>
      <span>${esc(u.name)}</span>
      <small>${u.hp}/${u.maxHp}</small>
    </div>`).join('');
}

const CANVAS = { heroSprites: {}, heroPortraits: {}, heroPoses: {}, enemies: {}, enemyAttack: {}, enemyDefend: {}, bgs: {} };
function loadImg(src) { const i = new Image(); i.src = src; return i; }
function loadSprites() {
  Object.values(HEROES).forEach(H => {
    CANVAS.heroSprites[H.id] = loadImg(H.sprite);
    CANVAS.heroPortraits[H.id] = loadImg(H.portrait);
  });
  CANVAS.heroPoses = {
    attack: loadImg('assets/heroes/joao-attack.png'),
    chains: loadImg('assets/heroes/joao-chains.png'),
    thorns: loadImg('assets/heroes/joao-thorns.png'),
    petals: loadImg('assets/heroes/joao-petals.png'),
    prison: loadImg('assets/heroes/joao-prison.png'),
    defend: loadImg('assets/heroes/joao-defend.png'),
    garden: loadImg('assets/heroes/joao-ult-garden.png'),
    bloom:  loadImg('assets/heroes/joao-ult-bloom.png'),
  };
  CANVAS.enemies = {
    rato:    loadImg('assets/enemies/rato.png'),
    javali:  loadImg('assets/enemies/javali.png'),
    batedor: loadImg('assets/enemies/batedor.png'),
    bruto:   loadImg('assets/enemies/bruto.png'),
    grug:    loadImg('assets/enemies/grug.png'),
    'grug-enraged': loadImg('assets/enemies/grug-enraged.png'),
  };
  CANVAS.enemyAttack = {
    rato:    loadImg('assets/enemies/rato-attack.png'),
    javali:  loadImg('assets/enemies/javali-attack.png'),
    batedor: loadImg('assets/enemies/batedor-attack.png'),
    bruto:   loadImg('assets/enemies/bruto-attack.png'),
    grug:    loadImg('assets/enemies/grug-attack.png'),
    'grug-enraged': loadImg('assets/enemies/grug-enraged-attack.png'),
  };
  CANVAS.enemyDefend = {
    rato:    loadImg('assets/enemies/rato-defend.png'),
    javali:  loadImg('assets/enemies/javali-defend.png'),
    batedor: loadImg('assets/enemies/batedor-defend.png'),
    bruto:   loadImg('assets/enemies/bruto-defend.png'),
    grug:    loadImg('assets/enemies/grug-defend.png'),
    'grug-enraged': loadImg('assets/enemies/grug-defend.png'),
  };
  CANVAS.bgs = {};
  ALL_STAGES.forEach(st => { if (st.bg && !CANVAS.bgs[st.bg]) CANVAS.bgs[st.bg] = loadImg(st.bg); });
  // sprites de inimigos das regiões novas (pixel art — 32rogues, ver CREDITS.md)
  PIXEL_ENEMIES.forEach(k => { CANVAS.enemies[k] = loadImg(`assets/enemies/${k}.png`); });
  CANVAS.enemies.djonga_boss = loadImg('assets/djonga.png'); // o duelo é contra o próprio Djonga
}
/* inimigos em pixel art (renderizados nítidos, sem suavização) */
const PIXEL_ENEMIES = ['capanga','fundidor','brigao','lobo','espectro','escudeiro','cavaleiro','cogumelo'];
function setHeroPose(name, ms) {
  const b = G.battle;
  if (!b || !b.active || b.active.side !== 'hero') return;
  b.active.pose = name;
  b.active.poseUntil = performance.now() + ms;
}
function setUnitPose(u, name, ms) {
  u.pose = name;
  u.poseUntil = performance.now() + ms;
}

function drawLoop(now) {
  requestAnimationFrame(drawLoop);
  const b = G.battle;
  const cv = $('#battle-canvas');
  if (!cv || !$('#screen-battle').classList.contains('active')) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);

  const bgImg = b && b.stage.bg ? CANVAS.bgs[b.stage.bg] : null;
  if (bgImg && bgImg.complete && bgImg.naturalWidth) {
    // cover, alinhado à base para o chão ficar sob os pés
    const scale = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
    const dw = bgImg.naturalWidth * scale, dh = bgImg.naturalHeight * scale;
    const dx = (W - dw) / 2, dy = H - dh;
    ctx.drawImage(bgImg, dx, dy, dw, dh);
    // vinheta + escurecimento inferior para leitura dos sprites/HUD
    const vg = ctx.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0, 'rgba(6,9,18,.32)');
    vg.addColorStop(.55, 'rgba(6,9,18,.05)');
    vg.addColorStop(1, 'rgba(4,6,12,.62)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(6,9,16,.28)'; ctx.fillRect(0, H - 90, W, 90);
  } else {
    // fallback: céu procedural
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#101a33');
    sky.addColorStop(.55, '#0a1122');
    sky.addColorStop(1, '#070c18');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath(); ctx.fillStyle = 'rgba(220,232,255,.85)';
    ctx.arc(W - 130, 86, 34, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.fillStyle = 'rgba(220,232,255,.10)';
    ctx.arc(W - 130, 86, 58, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0c1526';
    ctx.beginPath(); ctx.ellipse(180, 470, 380, 130, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#0e1930';
    ctx.beginPath(); ctx.ellipse(760, 490, 420, 150, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#101b2f';
    ctx.fillRect(0, 430, W, H - 430);
    ctx.strokeStyle = 'rgba(216,180,90,.12)';
    ctx.beginPath(); ctx.moveTo(0, 430); ctx.lineTo(W, 430); ctx.stroke();
  }

  if (!b) return;

  // posições: até 4 heróis à esquerda (escalonados), inimigos à direita
  const heroSlots = [ {x:220,y:478}, {x:105,y:452}, {x:330,y:440}, {x:150,y:508} ];
  const slots = [ {x:690,y:470}, {x:865,y:446}, {x:545,y:430} ];

  b.heroes.forEach((h, i) => drawHero(ctx, h, heroSlots[i] || heroSlots[0], now));
  b.enemies.forEach((e, i) => drawEnemy(ctx, e, slots[i] || slots[0], now));

  // popups de dano
  b.popups = b.popups.filter(p => now - p.t0 < 1000);
  b.popups.forEach(p => {
    const unit = [...b.heroes, ...b.enemies].find(u => u.uid === p.uid);
    if (!unit) return;
    const pos = unit.side === 'hero'
      ? (heroSlots[b.heroes.indexOf(unit)] || heroSlots[0])
      : (slots[b.enemies.indexOf(unit)] || slots[0]);
    const t = (now - p.t0) / 1000;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.font = '900 26px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = p.color;
    ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 8;
    ctx.fillText(p.text, pos.x, pos.y - 180 - t * 46);
    ctx.restore();
  });
}

function unitShake(u, now) {
  return (u.shakeT && now < u.shakeT) ? Math.sin(now / 22) * 7 : 0;
}

function drawHero(ctx, u, pos, now) {
  let img = CANVAS.heroSprites[u.heroId];
  // poses só existem para João por enquanto
  if (u.heroId === 'joao' && u.pose && now < u.poseUntil) {
    const p = CANVAS.heroPoses[u.pose];
    if (p && p.complete && p.naturalWidth) img = p;
  }
  // fallback: retrato do herói se o sprite de batalha não existir
  if (!img || !img.complete || !img.naturalWidth) {
    const alt = CANVAS.heroPortraits[u.heroId];
    if (alt && alt.complete && alt.naturalWidth) img = alt;
  }
  const bob = Math.sin(now / 600 + u.bob) * 4;
  const sx = unitShake(u, now);
  const x = pos.x + sx, y = pos.y + bob;

  // sombra + anel de turno
  ctx.save();
  ctx.globalAlpha = u.alive ? 1 : 0.3;
  ctx.beginPath(); ctx.fillStyle = 'rgba(77,141,255,.16)';
  ctx.ellipse(pos.x, pos.y + 8, 66, 16, 0, 0, Math.PI * 2); ctx.fill();
  if (G.battle.active?.uid === u.uid && u.alive) {
    ctx.beginPath(); ctx.strokeStyle = '#4d8dff'; ctx.lineWidth = 3;
    ctx.globalAlpha = .5 + Math.sin(now / 240) * .3;
    ctx.ellipse(pos.x, pos.y + 8, 76, 22, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = u.alive ? 1 : 0.3;
  }

  let topY = pos.y - 230;
  if (img && img.complete && img.naturalWidth) {
    const ratio = img.naturalWidth / img.naturalHeight;
    let dh = 232, dw = dh * ratio;
    if (dw > 200) { dw = 200; dh = dw / ratio; }
    if (u.flashT && now < u.flashT) ctx.filter = 'brightness(2.2)';
    if (!u.alive) ctx.filter = 'grayscale(1) brightness(.6)';
    ctx.drawImage(img, x - dw / 2, y - dh, dw, dh);
    ctx.filter = 'none';
    topY = y - dh;
  } else {
    ctx.fillStyle = '#4d8dff';
    ctx.fillRect(x - 32, y - 130, 64, 130);
  }
  ctx.restore();

  if (u.alive) drawHudBars(ctx, u, pos.x, topY - 20, '#4fc98a');

  if (u.statuses.length && u.alive) {
    const labels = { poison:'☠️', burn:'🔥', slow:'🐌', stun:'💫', regen:'✨', taunt:'🛡', contra:'🪞', fragil:'💔' };
    ctx.font = '15px serif'; ctx.textAlign = 'center';
    ctx.fillText(u.statuses.map(s => labels[s.type] || '').join(' '), pos.x, topY - 26);
  }
}

function drawEnemy(ctx, u, pos, now) {
  const bob = Math.sin(now / 520 + u.bob) * (u.boss ? 3 : 5);
  const sx = unitShake(u, now);
  const x = pos.x + sx, y = pos.y + bob;

  ctx.save();
  if (!u.alive) { ctx.restore(); return; }

  // aura de fúria pulsante
  if (u.enraged) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,80,50,${0.10 + Math.abs(Math.sin(now/300))*0.10})`;
    ctx.ellipse(pos.x, y - u.size * 1.1, u.size * 1.5, u.size * 1.7, 0, 0, Math.PI * 2); ctx.fill();
  }

  // sombra + anel de turno
  ctx.beginPath();
  ctx.fillStyle = u.enraged ? 'rgba(255,110,60,.22)' : 'rgba(224,82,95,.16)';
  ctx.ellipse(pos.x, pos.y + 6, u.size * 0.7, 16, 0, 0, Math.PI * 2); ctx.fill();
  if (G.battle.active?.uid === u.uid) {
    ctx.beginPath(); ctx.strokeStyle = '#d8b45a'; ctx.lineWidth = 3;
    ctx.globalAlpha = .5 + Math.sin(now / 240) * .3;
    ctx.ellipse(pos.x, pos.y + 6, u.size * 0.8, 20, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  let key = u.kind;
  if (u.kind === 'grug' && u.enraged) key = 'grug-enraged';
  let img;
  if (u.pose === 'attack' && now < u.poseUntil) {
    img = CANVAS.enemyAttack[key] || CANVAS.enemies[key];
  } else if (u.pose === 'defend' && now < u.poseUntil) {
    img = CANVAS.enemyDefend[key] || CANVAS.enemies[key];
  } else {
    img = CANVAS.enemies[key];
  }
  let topY = y - u.size * 2;
  if (img && img.complete && img.naturalWidth) {
    const pixel = PIXEL_ENEMIES.includes(u.kind);
    const ratio = img.naturalWidth / img.naturalHeight;
    let dh, dw;
    if (pixel) {
      // pixel art: altura-alvo proporcional ao tamanho, renderização nítida
      const targetH = u.size * (u.boss ? 1.7 : 1.5);
      const scale = targetH / img.naturalHeight;
      dw = img.naturalWidth * scale; dh = targetH;
      ctx.imageSmoothingEnabled = false;
    } else {
      dh = u.size * 2.35; dw = dh * ratio;
      const maxW = u.boss ? 300 : 210;
      if (dw > maxW) { dw = maxW; dh = dw / ratio; }
    }
    if (u.flashT && now < u.flashT) ctx.filter = 'brightness(2.3) saturate(.6)';
    ctx.drawImage(img, x - dw / 2, y - dh, dw, dh);
    ctx.filter = 'none';
    ctx.imageSmoothingEnabled = true;
    topY = y - dh;
  } else {
    ctx.font = `${u.size}px serif`; ctx.textAlign = 'center';
    ctx.fillText(u.icon, x, y);
    topY = y - u.size;
  }
  ctx.restore();

  drawHudBars(ctx, u, pos.x, topY - 16, '#ff656f');

  if (u.statuses.length) {
    const labels = { poison:'☠️', burn:'🔥', slow:'🐌', stun:'💫', regen:'✨', fragil:'💔' };
    ctx.font = '16px serif'; ctx.textAlign = 'center';
    ctx.fillText(u.statuses.map(s => labels[s.type] || '').join(' '), pos.x, topY - 22);
  }
}

function drawHudBars(ctx, u, x, y, hpColor) {
  const w = 120;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(6,10,18,.85)';
  ctx.strokeStyle = 'rgba(216,180,90,.28)';
  roundRect(ctx, x - 70, y, 140, u.side === 'hero' ? 52 : 42, 10);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#f2ecdd';
  ctx.font = '700 12px Alegreya, serif';
  ctx.fillText(u.name, x, y + 15);

  roundRect(ctx, x - w/2, y + 21, w, 7, 999);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill();
  roundRect(ctx, x - w/2, y + 21, w * clamp(u.hp / u.maxHp, 0, 1), 7, 999);
  ctx.fillStyle = hpColor; ctx.fill();

  if (u.side === 'hero') {
    roundRect(ctx, x - w/2, y + 32, w, 5, 999);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill();
    roundRect(ctx, x - w/2, y + 32, w * clamp(u.meter / 100, 0, 1), 5, 999);
    ctx.fillStyle = '#4d8dff'; ctx.fill();
    ctx.fillStyle = '#a9b6cf'; ctx.font = '10px Alegreya, serif';
    ctx.fillText(`${u.hp}/${u.maxHp}`, x, y + 48);
  } else {
    ctx.fillStyle = '#c8b193'; ctx.font = '10px Alegreya, serif';
    ctx.fillText(`${u.hp}/${u.maxHp}`, x, y + 38);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/* ═══════════════════ EVENTOS + INIT ═══════════════════ */
function wire() {
  $('#btn-title-start').addEventListener('click', () => { renderSlots(); show('slots'); });
  $('#btn-slots-back').addEventListener('click', () => show('title'));

  $('#story-stage').addEventListener('click', advanceStory);
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && $('#screen-story').classList.contains('active')) { e.preventDefault(); advanceStory(); }
  });
  $('#btn-story-skip').addEventListener('click', e => { e.stopPropagation(); endStory(); });

  $('#btn-select-back').addEventListener('click', () => { renderSlots(); show('slots'); });
  $('#btn-select-confirm').addEventListener('click', () => {
    if (!pickedHero) return;
    G.save.hero = pickedHero; persist();
    renderMap(); show('map');
  });

  $('#btn-tree-back').addEventListener('click', () => { renderMap(); show('map'); });
  $('#btn-bag-back').addEventListener('click', () => { renderMap(); show('map'); });
  $('#btn-escalacao-ok').addEventListener('click', () => {
    $('#escalacao-overlay').classList.add('hidden');
    renderPartyPanel();
  });

  $('#btn-battle-back').addEventListener('click', () => {
    if (!confirm('Abandonar a batalha? O progresso desta fase será perdido.')) return;
    if (G.battle) { G.battle.over = true; G.battle = null; }
    renderMap(); show('map');
  });

  $('#btn-tut-ok').addEventListener('click', showNextTut);
  $('#btn-result-retry').addEventListener('click', () => startBattle(G.battle.stage));

  // áudio: desbloqueio na primeira interação + clique de interface + mudo
  document.addEventListener('pointerdown', unlockAudio, { once:true });
  document.addEventListener('click', e => {
    if (e.target.closest('button')) sfx('click', 0.16);
  });
  const mute = $('#btn-mute');
  mute.textContent = AUDIO.muted ? '🔇' : '🔊';
  mute.addEventListener('click', toggleMute);
}

function init() {
  wire();
  loadSprites();
  requestAnimationFrame(drawLoop);
}
document.addEventListener('DOMContentLoaded', init);
})();
