(() => {
'use strict';

/* ═══════════════════ HELPERS ═══════════════════ */
const $ = s => document.querySelector(s);
const clamp = (n,a,b) => Math.max(a, Math.min(b,n));
const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const wait = ms => new Promise(r => setTimeout(r, ms));
const esc = t => String(t).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));

/* ═══════════════════ DADOS: HERÓI ═══════════════════ */
const HERO = {
  id: 'joao', name: 'João', title: 'Rosa Azul / Correntes',
  portrait: 'assets/joao.png', sprite: 'assets/joao-battle.png',
  baseHp: 300, hpGrow: 45, baseAtk: 30, atkGrow: 5, baseSpd: 70, spdGrow: 2,
  lore: 'Cavaleiro-arcano da Ordem dos Seis. Empunha a Rosa Azul, relíquia que converte vontade em correntes de energia.'
};
const LOCKED_HEROES = [
  { id:'luan', name:'Luan', title:'Corte em Cone', portrait:'assets/luan.png' },
  { id:'thomas', name:'Thomas', title:'Lâminas / Sombras', portrait:'assets/thomas.png' },
  { id:'lorenzo', name:'Lorenzo', title:'Baluarte / Cura', portrait:'assets/lorenzo.png' },
  { id:'ministro', name:'Ministro', title:'Elixires / Veneno', portrait:'assets/ministro.png' },
  { id:'djonga', name:'Djonga', title:'Punhos de Impacto', portrait:'assets/djonga.png' },
];

const MAX_LEVEL = 10;
const xpForNext = lvl => Math.round(60 * Math.pow(lvl, 1.45));
const heroStats = lvl => ({
  maxHp: HERO.baseHp + HERO.hpGrow * (lvl-1),
  atk:   HERO.baseAtk + HERO.atkGrow * (lvl-1),
  spd:   HERO.baseSpd + HERO.spdGrow * (lvl-1),
});

/* ═══════════════════ DADOS: HABILIDADES ═══════════════════ */
const SKILLS = {
  chains: {
    id:'chains', name:'Correntes Azuis', starter:true, cost:0, reqLevel:1, cd:2,
    desc:'Prende o alvo com correntes de energia. Dano moderado e reduz a velocidade do inimigo por 2 turnos.',
    hint:'Dano + Lentidão'
  },
  thorns: {
    id:'thorns', name:'Espinhos da Rosa', cost:1, reqLevel:2, cd:3,
    desc:'Espinhos vítreos perfuram o alvo, envenenando-o. Dano leve + 12 de veneno por 3 turnos.',
    hint:'Dano + Veneno'
  },
  petals: {
    id:'petals', name:'Pétalas Vítreas', cost:1, reqLevel:3, cd:4,
    desc:'A Rosa Azul floresce em volta de João, restaurando 30% da vida e assumindo postura defensiva até o próximo turno.',
    hint:'Cura 30% + Defesa'
  },
  prison: {
    id:'prison', name:'Prisão de Ferro', cost:2, reqLevel:4, cd:4,
    desc:'Correntes pesadas esmagam o alvo. Dano alto e atordoa por 1 turno.',
    hint:'Dano alto + Atordoamento'
  },
};
const ULTIMATES = {
  garden: {
    id:'garden', name:'Jardim de Ferro', starter:true, cost:0, reqLevel:1,
    shout:'JARDIM DE FERRO!',
    desc:'Um jardim de correntes irrompe do chão: dano pesado em TODOS os inimigos e atordoa o alvo principal.',
    hint:'Dano em área + Atordoamento'
  },
  bloom: {
    id:'bloom', name:'Jardim de Ferro: Florescer', cost:2, reqLevel:5,
    shout:'JARDIM DE FERRO... FLORESCER!',
    desc:'Variação vital do Jardim: dano em área menor, mas cura 35% da vida de João e concede regeneração por 3 turnos.',
    hint:'Área + Cura 35% + Regeneração'
  },
};

/* ═══════════════════ DADOS: ITENS ═══════════════════ */
const ITEMS = {
  pocao_menor:  { id:'pocao_menor',  icon:'🧪', img:'assets/items/pocao-menor.png', name:'Poção Menor',       desc:'Restaura 60 de vida.' },
  pocao_maior:  { id:'pocao_maior',  icon:'⚗️', img:'assets/items/pocao-maior.png', name:'Poção Maior',       desc:'Restaura 150 de vida.' },
  elixir_azul:  { id:'elixir_azul',  icon:'💠', img:'assets/items/elixir-azul.png', name:'Elixir Azul',       desc:'Carrega 50% do medidor de Ultimate.' },
  tonico:       { id:'tonico',       icon:'🌿', img:'assets/items/tonico.png',      name:'Tônico Purificante', desc:'Remove veneno e lentidão e cura 40 de vida.' },
};

/* ═══════════════════ DADOS: INIMIGOS ═══════════════════ */
const ENEMIES = {
  rato:    { id:'rato',    name:'Rato Selvagem',  icon:'🐀', size:58,  hp:55,  atk:9,  spd:62, xp:18,
             moves:[{k:'bite', chance:1, mult:1, label:'morde'}] },
  javali:  { id:'javali',  name:'Javali Feroz',   icon:'🐗', size:80,  hp:110, atk:15, spd:50, xp:32,
             moves:[{k:'gore', chance:.35, mult:1.6, label:'usa <em>Investida</em> contra'}, {k:'hit', chance:1, mult:1, label:'chifra'}] },
  batedor: { id:'batedor', name:'Goblin Batedor', icon:'👺', size:68,  hp:80,  atk:13, spd:72, xp:26,
             moves:[{k:'dbl', chance:.3, mult:.75, hits:2, label:'desfere <em>Golpe Duplo</em> em'}, {k:'stab', chance:1, mult:1, label:'apunhala'}] },
  bruto:   { id:'bruto',   name:'Goblin Bruto',   icon:'👹', size:92,  hp:150, atk:19, spd:45, xp:44,
             moves:[{k:'smash', chance:.35, mult:1.5, label:'esmaga com a <em>Pancada Colossal</em>'}, {k:'club', chance:1, mult:1, label:'golpeia'}] },
  grug:    { id:'grug',    name:'Grug, o Rei Goblin', icon:'👹', crown:true, size:150, hp:480, atk:22, spd:58, xp:220, boss:true },
};

/* ═══════════════════ DADOS: FASES ═══════════════════ */
const STAGES = [
  {
    id:'1-1', name:'Trilha dos Ratos', icon:'🐀', iconImg:'assets/stages/ratos.png',
    desc:'Ratos gigantes bloqueiam a trilha de entrada das Colinas.',
    waves:[ ['rato','rato'] ],
    tutorial:'basics', clearBonus:30, bg:'assets/bg/colinas.jpg',
    drops:{ pocao_menor:2 },
  },
  {
    id:'1-2', name:'Clareira dos Javalis', icon:'🐗', iconImg:'assets/stages/javalis.png',
    desc:'Javalis enfurecidos pela corrupção de Malvorax. Golpes pesados — use seu alforje.',
    waves:[ ['javali','rato'] ],
    tutorial:'items', clearBonus:35, bg:'assets/bg/clareira.jpg',
    grantOnEnter:{ pocao_menor:2 },
    drops:{ pocao_menor:1, elixir_azul:1 },
  },
  {
    id:'1-3', name:'Emboscada Goblin', icon:'⚔️', iconImg:'assets/stages/goblins.png',
    desc:'Uma horda goblin ataca em ondas. Sobreviva a todas para avançar.',
    waves:[ ['batedor','batedor'], ['batedor','bruto'], ['bruto','bruto'] ],
    tutorial:'horde', clearBonus:50, bg:'assets/bg/emboscada.jpg',
    drops:{ pocao_maior:1, tonico:1 },
  },
  {
    id:'1-4', name:'Salão do Rei Goblin', icon:'👑', iconImg:'assets/stages/grug-boss.png', boss:true,
    desc:'Grug aguarda no coração das Colinas. Derrote-o e liberte a região.',
    waves:[ ['grug','batedor'] ],
    tutorial:'boss', clearBonus:80, bg:'assets/bg/salao-goblin.jpg',
    drops:{ pocao_maior:2, elixir_azul:1 },
  },
];

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
  { who:'Narrador', ico:'📜', text:'Fim do Capítulo I. A jornada continua nas próximas crônicas do Reino de Adaptia — com novos heróis, novas terras e o Flagelo Cinzento à espreita.' },
];

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
    { title:'Nova habilidade disponível!', text:'Você subiu de nível e ganhou Pontos de Habilidade. No mapa, abra a ÁRVORE DE HABILIDADES para desbloquear novos golpes da Rosa Azul.' },
  ],
};

/* ═══════════════════ SAVE SYSTEM ═══════════════════ */
const SLOT_KEY = i => `adaptia_slot_${i}`;

function newSave() {
  return {
    createdAt: Date.now(), hero: null,
    level: 1, xp: 0, sp: 0,
    skills: ['chains'], ults: ['garden'], activeUlt: 'garden',
    inventory: { pocao_menor: 1 },
    cleared: [], flags: {},
  };
}
function readSlot(i) {
  try { const raw = localStorage.getItem(SLOT_KEY(i)); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
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
  $('#screen-' + name).classList.add('active');
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
  grid.appendChild(mk(HERO, false));
  LOCKED_HEROES.forEach(h => grid.appendChild(mk(h, true)));
}

/* ═══════════════════ TELA: MAPA ═══════════════════ */
function stageUnlocked(idx) {
  if (idx === 0) return true;
  return G.save.cleared.includes(STAGES[idx-1].id);
}
function renderMap() {
  const s = G.save;
  const st = heroStats(s.level);
  $('#map-hero-level').textContent = s.level;
  const need = xpForNext(s.level);
  $('#map-xp-fill').style.width = (s.level >= MAX_LEVEL ? 100 : clamp(s.xp/need*100, 0, 100)) + '%';
  $('#map-xp-label').textContent = s.level >= MAX_LEVEL ? 'Nível máximo' : `${s.xp} / ${need} XP`;
  $('#map-hero-stats').innerHTML = `
    <div><span>VIDA</span><strong>${st.maxHp}</strong></div>
    <div><span>ATAQUE</span><strong>${st.atk}</strong></div>
    <div><span>VELOC.</span><strong>${st.spd}</strong></div>`;
  const badge = $('#map-sp-badge');
  badge.textContent = s.sp;
  badge.classList.toggle('hidden', s.sp <= 0);

  const path = $('#stage-path');
  path.innerHTML = '';
  STAGES.forEach((stage, idx) => {
    if (idx > 0) {
      const conn = document.createElement('div');
      conn.className = 'stage-connector';
      path.appendChild(conn);
    }
    const unlocked = stageUnlocked(idx);
    const cleared = s.cleared.includes(stage.id);
    const node = document.createElement('div');
    node.className = 'stage-node ' + (stage.boss?'boss ':'') + (unlocked ? 'unlocked' : 'locked') + (cleared ? ' cleared' : '');
    node.innerHTML = `
      <div class="sn-icon">${stage.iconImg ? `<img src="${stage.iconImg}" alt="">` : stage.icon}</div>
      <div class="sn-body">
        <p class="eyebrow">Fase ${stage.id}${stage.boss ? ' · CHEFE' : ''}${stage.waves.length>1 ? ' · '+stage.waves.length+' ondas' : ''}</p>
        <h3>${esc(stage.name)}</h3>
        <p>${esc(stage.desc)}</p>
      </div>
      <div class="sn-state">${cleared ? '✓ Concluída' : unlocked ? 'Entrar ›' : '🔒'}</div>`;
    if (unlocked) node.addEventListener('click', () => enterStage(stage));
    path.appendChild(node);
  });
}

function enterStage(stage) {
  if (stage.id === '1-4' && !G.save.flags.preBossSeen) {
    G.save.flags.preBossSeen = true; persist();
    playStory(STORY_PRE_BOSS, () => startBattle(stage), 'assets/bg/salao-goblin.jpg');
  } else {
    startBattle(stage);
  }
}

/* ═══════════════════ TELA: ÁRVORE ═══════════════════ */
function renderTree() {
  const s = G.save;
  $('#tree-sp').textContent = s.sp;
  const skDiv = $('#tree-skills');
  skDiv.innerHTML = '';
  Object.values(SKILLS).forEach(sk => {
    const owned = s.skills.includes(sk.id);
    const canBuy = !owned && s.level >= sk.reqLevel && s.sp >= sk.cost;
    const node = document.createElement('div');
    node.className = 'tree-node' + (owned ? ' owned' : '');
    node.innerHTML = `
      <h4>${esc(sk.name)}</h4>
      <span class="tn-meta">${sk.hint} · Recarga ${sk.cd} turnos · Requer nível ${sk.reqLevel}${sk.cost ? ' · Custa ' + sk.cost + ' PH' : ' · Inicial'}</span>
      <p>${esc(sk.desc)}</p>
      <div class="tn-row">${owned
        ? '<span style="color:var(--green);font-family:var(--display);font-size:13px">✓ Dominada</span>'
        : `<button class="btn-gold small" ${canBuy?'':'disabled'}>Desbloquear (${sk.cost} PH)</button>
           ${s.level < sk.reqLevel ? '<small style="color:var(--muted)">Nível insuficiente</small>' : ''}`}</div>`;
    const btn = node.querySelector('button');
    if (btn) btn.addEventListener('click', () => {
      s.sp -= sk.cost; s.skills.push(sk.id); persist(); renderTree();
    });
    skDiv.appendChild(node);
  });

  const ulDiv = $('#tree-ults');
  ulDiv.innerHTML = '';
  Object.values(ULTIMATES).forEach(u => {
    const owned = s.ults.includes(u.id);
    const active = s.activeUlt === u.id;
    const canBuy = !owned && s.level >= u.reqLevel && s.sp >= u.cost;
    const node = document.createElement('div');
    node.className = 'tree-node' + (owned ? ' owned' : '') + (active ? ' active-ult' : '');
    node.innerHTML = `
      <h4>${esc(u.name)}</h4>
      <span class="tn-meta">${u.hint}${u.cost ? ' · Requer nível ' + u.reqLevel + ' · Custa ' + u.cost + ' PH' : ' · Inicial'}</span>
      <p>${esc(u.desc)}</p>
      <div class="tn-row">${
        active ? '<span style="color:var(--rose-blue);font-family:var(--display);font-size:13px">◆ Ultimate ativa</span>'
        : owned ? '<button class="btn-gold small" data-act="equip">Equipar</button>'
        : `<button class="btn-gold small" ${canBuy?'':'disabled'} data-act="buy">Desbloquear (${u.cost} PH)</button>
           ${s.level < u.reqLevel ? '<small style="color:var(--muted)">Nível insuficiente</small>' : ''}`}</div>`;
    const btn = node.querySelector('button');
    if (btn) btn.addEventListener('click', () => {
      if (btn.dataset.act === 'buy') { s.sp -= u.cost; s.ults.push(u.id); }
      s.activeUlt = u.id;
      persist(); renderTree();
    });
    ulDiv.appendChild(node);
  });
}

/* ═══════════════════ TELA: INVENTÁRIO ═══════════════════ */
function renderBag() {
  const list = $('#bag-list');
  list.innerHTML = '';
  const entries = Object.entries(G.save.inventory).filter(([,n]) => n > 0);
  if (!entries.length) {
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
}

function itemIco(it, size) {
  return it.img
    ? `<img class="item-ico" src="${it.img}" alt="" style="width:${size}px;height:${size}px">`
    : `<span style="font-size:${Math.round(size*0.7)}px">${it.icon}</span>`;
}

/* ═══════════════════ MOTOR DE BATALHA ═══════════════════ */
function buildHeroUnit() {
  const s = G.save;
  const st = heroStats(s.level);
  return {
    uid:'hero', side:'hero', name:HERO.name, icon:null,
    hp:st.maxHp, maxHp:st.maxHp, atk:st.atk, spd:st.spd,
    meter:0, defending:false, alive:true, statuses:[],
    cds:{}, // skillId -> turnos restantes
    bob: Math.random()*10, shakeT:0, flashT:0,
  };
}
function buildEnemy(key, idx) {
  const d = ENEMIES[key];
  return {
    uid:`e-${key}-${idx}-${rand(0,9999)}`, side:'enemy', kind:key,
    name:d.name, icon:d.icon, crown:!!d.crown, size:d.size, boss:!!d.boss,
    hp:d.hp, maxHp:d.hp, atk:d.atk, spd:d.spd, xp:d.xp, moves:d.moves,
    defending:false, alive:true, statuses:[], enraged:false, turnCount:0,
    bob: Math.random()*10, shakeT:0, flashT:0,
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

  G.battle = {
    stage, waveIdx: 0,
    hero: buildHeroUnit(),
    enemies: stage.waves[0].map((k,i) => buildEnemy(k,i)),
    queue: [], active: null, round: 1, over: false,
    xpEarned: 0, turnCounter: 0, logs: [], popups: [], busy: false,
    heroPose: null, heroPoseUntil: 0,
  };

  $('#battle-stage-id').textContent = 'Fase ' + stage.id + (stage.waves.length > 1 ? ` · Onda 1/${stage.waves.length}` : '');
  $('#battle-stage-name').textContent = stage.name;
  $('#cmd-hero-name').textContent = HERO.name;
  show('battle');
  log(`A batalha em <strong>${esc(stage.name)}</strong> começa!`);
  queueTutorial(stage.tutorial, 'tut_' + stage.tutorial, () => {
    refillQueue();
    nextTurn();
  });
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
function aliveUnits() { const b = G.battle; return [b.hero, ...b.enemies].filter(u => u.alive); }
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
    renderMenu('root');
  } else {
    b.busy = true;
    renderMenu('waiting');
    await wait(650);
    await enemyAct(actor);
  }
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
    } else if (st.type === 'regen') {
      const h = applyHeal(u, st.value);
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
    if (st.type === 'slow') { if (--st.turns > 0) keep.push(st); }
    else keep.push(st);
  });
  u.statuses = keep;
}

/* ── dano / cura ── */
function applyDamage(src, tgt, amount, opt = {}) {
  if (!tgt || !tgt.alive) return 0;
  let v = Math.max(1, Math.round(amount + rand(-3, 3)));
  if (tgt.defending) v = Math.round(v * 0.5);

  tgt.hp = clamp(tgt.hp - v, 0, tgt.maxHp);
  tgt.shakeT = performance.now() + 320;
  tgt.flashT = performance.now() + 200;
  popup(tgt, '-' + v, opt.color || '#ff6b74');

  // vítima carrega medidor
  if (tgt.side === 'hero' && !opt.noMeter) gainMeter(tgt, Math.round(v * 0.4));

  if (tgt.hp <= 0) {
    tgt.alive = false;
    tgt.statuses = [];
    log(`<strong>${esc(tgt.name)}</strong> foi derrotado!`);
    if (tgt.side === 'enemy') G.battle.xpEarned += tgt.xp;
  }
  return v;
}
function applyHeal(u, amount) {
  if (!u.alive) return 0;
  const prev = u.hp;
  u.hp = clamp(u.hp + Math.round(amount), 0, u.maxHp);
  const h = u.hp - prev;
  if (h > 0) popup(u, '+' + h, '#4fc98a');
  return h;
}
function gainMeter(u, n) {
  if (u.side !== 'hero') return;
  const before = u.meter;
  u.meter = clamp(u.meter + n, 0, 100);
  if (before < 100 && u.meter >= 100) {
    log(`O medidor de <strong class="hero">João</strong> está completo! A Ultimate brilha. 💠`);
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

  const hero = b.hero;
  if (mode === 'root') {
    prompt.textContent = 'O que João fará?';
    add('⚔ Atacar', 'Dano básico · +20 medidor', null, () => renderMenu('target', {act:'attack'}));
    add('🌹 Habilidades', 'Golpes da Rosa Azul', null, () => renderMenu('skills'));
    const ult = ULTIMATES[G.save.activeUlt];
    const ready = hero.meter >= 100;
    add('💠 ' + ult.name, ready ? 'PRONTA! Medidor 100%' : `Medidor ${hero.meter}%`, ready ? 'ult-ready' : '', () => doUltimate(), !ready);
    add('🛡 Defender', 'Reduz dano 50% · +15 medidor', null, () => doDefend());
    add('🎒 Itens', 'Usa um item do alforje', null, () => renderMenu('items'));
    add('⏳ Aguardar', 'Pula a vez · +12 medidor', null, () => doWaitTurn());
    return;
  }

  if (mode === 'skills') {
    prompt.textContent = 'Escolha uma habilidade';
    G.save.skills.forEach(id => {
      const sk = SKILLS[id];
      const cd = hero.cds[id] || 0;
      add(sk.name, cd > 0 ? `Recarga: ${cd} turno(s)` : sk.hint, null, () => {
        if (sk.id === 'petals') doSkill(sk, hero);
        else renderMenu('target', {act:'skill', skill:sk});
      }, cd > 0);
    });
    add('‹ Voltar', null, 'back', () => renderMenu('root'));
    return;
  }

  if (mode === 'items') {
    prompt.textContent = 'Escolha um item';
    const entries = Object.entries(G.save.inventory).filter(([,n]) => n > 0);
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

async function endHeroAction() {
  const b = G.battle;
  renderMenu('waiting');
  renderHud();
  if (checkEnd()) return;
  tickEndStatuses(b.hero);
  await wait(720);
  nextTurn();
}

function doAttack(target) {
  const b = G.battle;
  if (b.busy) return; b.busy = true;
  const h = b.hero;
  setHeroPose('attack', 850);
  const d = applyDamage(h, target, h.atk + 6);
  log(`<strong class="hero">João</strong> golpeia <strong>${esc(target.name)}</strong> com a Rosa Azul: <strong>${d}</strong> de dano.`);
  gainMeter(h, 20);
  endHeroAction();
}

function doSkill(sk, target) {
  const b = G.battle;
  if (b.busy) return; b.busy = true;
  const h = b.hero;
  h.cds[sk.id] = sk.cd + 1; // +1 porque decrementa já no início do próximo turno dele
  setHeroPose(sk.id, 900);

  if (sk.id === 'chains') {
    const d = applyDamage(h, target, h.atk + 12);
    addStatus(target, {type:'slow', turns:2});
    log(`<strong class="hero">João</strong> lança <strong>Correntes Azuis</strong>: ${d} de dano e <strong>${esc(target.name)}</strong> fica lento. ⛓️`);
  } else if (sk.id === 'thorns') {
    const d = applyDamage(h, target, h.atk + 6);
    addStatus(target, {type:'poison', turns:3, value:12});
    log(`<strong class="hero">João</strong> crava <strong>Espinhos da Rosa</strong>: ${d} de dano e veneno por 3 turnos. 🌹☠️`);
  } else if (sk.id === 'petals') {
    const healed = applyHeal(h, Math.round(h.maxHp * 0.30));
    h.defending = true;
    log(`<strong class="hero">João</strong> invoca <strong>Pétalas Vítreas</strong>: recupera ${healed} de vida e assume postura defensiva. 🌹🛡`);
  } else if (sk.id === 'prison') {
    const d = applyDamage(h, target, h.atk + 16);
    addStatus(target, {type:'stun', turns:1});
    log(`<strong class="hero">João</strong> fecha a <strong>Prisão de Ferro</strong>: ${d} de dano e <strong>${esc(target.name)}</strong> é atordoado! ⛓️💫`);
  }
  gainMeter(h, 15);
  endHeroAction();
}

async function doUltimate() {
  const b = G.battle;
  if (b.busy) return; b.busy = true;
  const h = b.hero;
  if (h.meter < 100) { b.busy = false; return; }
  h.meter = 0;
  const ult = ULTIMATES[G.save.activeUlt];
  renderMenu('waiting');

  await playUltCutscene(ult);

  const foes = b.enemies.filter(e => e.alive);
  if (ult.id === 'garden') {
    foes.forEach((e, i) => {
      applyDamage(h, e, h.atk + 18);
      if (i === 0) addStatus(e, {type:'stun', turns:1});
    });
    log(`<strong class="hero">João</strong> desencadeia o <strong>JARDIM DE FERRO</strong>! Correntes irrompem do chão e atingem todos os inimigos. ⛓️🌹`);
  } else {
    foes.forEach(e => applyDamage(h, e, h.atk + 10));
    applyHeal(h, Math.round(h.maxHp * 0.35));
    addStatus(h, {type:'regen', turns:3, value:Math.round(h.maxHp * 0.06)});
    log(`<strong class="hero">João</strong> faz o Jardim <strong>FLORESCER</strong>: dano em área, vida restaurada e pétalas regenerantes. 🌹✨`);
  }
  endHeroAction();
}

function doDefend() {
  const b = G.battle;
  if (b.busy) return; b.busy = true;
  const h = b.hero;
  h.defending = true;
  gainMeter(h, 15);
  log(`<strong class="hero">João</strong> ergue as correntes em guarda. 🛡`);
  endHeroAction();
}

function doWaitTurn() {
  const b = G.battle;
  if (b.busy) return; b.busy = true;
  gainMeter(b.hero, 12);
  log(`<strong class="hero">João</strong> estuda o campo e concentra energia. ⏳`);
  endHeroAction();
}

function doItem(id) {
  const b = G.battle;
  if (b.busy) return; b.busy = true;
  const h = b.hero;
  const inv = G.save.inventory;
  if (!inv[id]) { b.busy = false; return; }
  inv[id] -= 1; persist();
  const it = ITEMS[id];
  if (id === 'pocao_menor') applyHeal(h, 60);
  if (id === 'pocao_maior') applyHeal(h, 150);
  if (id === 'elixir_azul') gainMeter(h, 50);
  if (id === 'tonico') { removeStatus(h,'poison'); removeStatus(h,'slow'); applyHeal(h, 40); }
  log(`<strong class="hero">João</strong> usa <strong>${esc(it.name)}</strong>. ${it.icon}`);
  endHeroAction();
}

/* ═══════════════════ IA INIMIGA ═══════════════════ */
async function enemyAct(e) {
  const b = G.battle;
  const h = b.hero;
  e.turnCount += 1;

  if (e.boss) return bossAct(e);

  // escolhe movimento pela tabela de chances
  let mv = e.moves[e.moves.length - 1];
  for (const m of e.moves) { if (Math.random() < m.chance) { mv = m; break; } }
  const hits = mv.hits || 1;
  let total = 0;
  for (let i = 0; i < hits; i++) {
    total += applyDamage(e, h, e.atk * mv.mult);
    if (hits > 1) await wait(240);
  }
  log(`<strong>${esc(e.name)}</strong> ${mv.label} <strong class="hero">João</strong>: <strong>${total}</strong> de dano.`);
  renderHud();
  if (checkEnd()) return;
  tickEndStatuses(e);
  await wait(680);
  nextTurn();
}

async function bossAct(e) {
  const b = G.battle;
  const h = b.hero;

  if (!e.enraged && e.hp / e.maxHp <= 0.4) {
    e.enraged = true;
    e.atk = Math.round(e.atk * 1.3);
    log(`<strong>${esc(e.name)}</strong> entra em <strong>FÚRIA</strong>! Seus olhos ardem em vermelho. 🔥`);
    popup(e, 'FÚRIA!', '#ff9540');
    renderHud();
    await wait(750);
  }

  const cycle = e.enraged ? 2 : 3;
  if (e.turnCount % cycle === 0) {
    const d = applyDamage(e, h, e.atk * 1.8);
    log(`<strong>${esc(e.name)}</strong> solta o <strong>GRITO DEVASTADOR</strong>: <strong>${d}</strong> de dano brutal! 💥`);
  } else if (e.hp / e.maxHp < 0.7 && Math.random() < 0.25) {
    const heal = applyHeal(e, 40);
    log(`<strong>${esc(e.name)}</strong> devora rações goblins e recupera ${heal} de vida. 🍖`);
  } else {
    const d = applyDamage(e, h, e.atk);
    log(`<strong>${esc(e.name)}</strong> esmaga <strong class="hero">João</strong> com a clava real: <strong>${d}</strong> de dano.`);
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
  const heroDead = !b.hero.alive;
  const foesDead = b.enemies.every(e => !e.alive);

  if (heroDead) { b.over = true; setTimeout(() => finishBattle(false), 900); return true; }

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
        b.enemies = b.stage.waves[b.waveIdx].map((k,i) => buildEnemy(k,i));
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
    $('#result-title').textContent = 'João tomba nas Colinas...';
    $('#result-copy').textContent = 'Mas cavaleiros da Rosa Azul não conhecem o fim. Recupere o fôlego e tente novamente — nenhum progresso foi perdido.';
    $('#result-rows').innerHTML = '';
    $('#btn-result-retry').classList.remove('hidden');
    $('#btn-result-continue').textContent = 'Voltar ao mapa';
    $('#btn-result-continue').onclick = () => { renderMap(); show('map'); };
    show('result');
    return;
  }

  const firstClear = !s.cleared.includes(b.stage.id);
  let xp = b.xpEarned + (firstClear ? b.stage.clearBonus : 0);
  const rows = [[`XP dos inimigos`, b.xpEarned + ' XP']];
  if (firstClear) rows.push(['Bônus de primeira vitória', '+' + b.stage.clearBonus + ' XP']);

  // drops (apenas na primeira vitória)
  if (firstClear && b.stage.drops) {
    Object.entries(b.stage.drops).forEach(([id,n]) => {
      s.inventory[id] = (s.inventory[id]||0) + n;
      rows.push([itemIco(ITEMS[id], 22) + ' ' + ITEMS[id].name, '×' + n]);
    });
  }

  // aplica XP e level ups
  let leveled = 0;
  s.xp += xp;
  while (s.level < MAX_LEVEL && s.xp >= xpForNext(s.level)) {
    s.xp -= xpForNext(s.level);
    s.level += 1; s.sp += 1; leveled += 1;
  }
  if (s.level >= MAX_LEVEL) s.xp = 0;
  if (firstClear) s.cleared.push(b.stage.id);
  persist();

  $('#result-eyebrow').textContent = b.stage.boss ? 'O Rei caiu' : 'Vitória';
  $('#result-title').textContent = b.stage.boss ? 'As Colinas estão livres!' : b.stage.name + ' superada!';
  $('#result-copy').textContent = b.stage.boss
    ? 'Grug foi derrotado e a vanguarda de Malvorax recua. O Capítulo I chega ao fim.'
    : 'A trilha adiante se abre. Fortaleça João antes de seguir.';
  $('#result-rows').innerHTML = rows.map(([k,v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('');

  if (leveled > 0) {
    const lv = $('#result-levelup');
    lv.classList.remove('hidden');
    lv.innerHTML = `⬆ Subiu para o nível <strong>${s.level}</strong>! +${leveled} Ponto(s) de Habilidade`;
  }

  const isBoss = b.stage.boss;
  $('#btn-result-continue').textContent = 'Continuar';
  $('#btn-result-continue').onclick = () => {
    if (leveled > 0) queueTutorial('skillup', 'tut_skillup');
    if (isBoss && !s.flags.epilogueSeen) {
      s.flags.epilogueSeen = true; persist();
      playStory(STORY_EPILOGUE, () => { renderMap(); show('map'); }, 'assets/bg/colinas.jpg');
    } else {
      renderMap(); show('map');
    }
  };
  show('result');
}

/* ═══════════════════ CUTSCENE DE ULTIMATE ═══════════════════ */
function playUltCutscene(ult) {
  return new Promise(resolve => {
    const ov = $('#ult-overlay');
    $('#ult-name').textContent = ult.shout;
    $('#ult-caller').textContent = HERO.name + ' invoca';
    const poseSrc = ult.id === 'bloom' ? 'assets/heroes/joao-ult-bloom.png' : 'assets/heroes/joao-ult-garden.png';
    const fxSrc = ult.id === 'bloom' ? 'assets/fx/bloom.png' : 'assets/fx/garden.png';
    $('#ult-sprite').src = poseSrc;
    $('#ult-effect').src = fxSrc;
    ov.classList.toggle('bloom', ult.id === 'bloom');
    const pet = $('#ult-petals');
    pet.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const sp = document.createElement('span');
      sp.textContent = Math.random() < 0.5 ? '🌹' : '💠';
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
  const h = b.hero;

  $('#cmd-hp-fill').style.width = clamp(h.hp / h.maxHp * 100, 0, 100) + '%';
  $('#cmd-hp-label').textContent = `${h.hp}/${h.maxHp} HP`;
  $('#cmd-sp-fill').style.width = clamp(h.meter, 0, 100) + '%';
  $('#cmd-sp-label').textContent = `Ultimate ${h.meter}%`;

  const tags = [];
  if (h.defending) tags.push('<span class="st-buff">DEFENDENDO</span>');
  h.statuses.forEach(st => {
    const map = { poison:['VENENO','st-debuff'], slow:['LENTO','st-debuff'], stun:['ATORDOADO','st-debuff'], regen:['REGEN','st-buff'] };
    const m = map[st.type]; if (m) tags.push(`<span class="${m[1]}">${m[0]} ${st.turns}t</span>`);
  });
  $('#cmd-status-tags').innerHTML = tags.join('');

  // fila de turnos
  const preview = [b.active, ...b.queue].filter(Boolean)
    .filter((u,i,arr) => u.alive && arr.findIndex(x => x.uid === u.uid) === i).slice(0, 7);
  $('#turn-list').innerHTML = preview.map(u => `
    <div class="turn-pill ${b.active?.uid === u.uid ? 'now' : ''}">
      <span class="tp-ico">${u.side === 'hero' ? '🌹' : u.icon}</span>
      <span>${esc(u.name)}</span>
      <small>${u.hp}/${u.maxHp}</small>
    </div>`).join('');
}

const CANVAS = { hero: null, heroPoses: {}, enemies: {}, bgs: {} };
function loadImg(src) { const i = new Image(); i.src = src; return i; }
function loadSprites() {
  CANVAS.hero = loadImg(HERO.sprite);
  CANVAS.heroPoses = {
    attack: loadImg('assets/heroes/joao-attack.png'),
    chains: loadImg('assets/heroes/joao-chains.png'),
    thorns: loadImg('assets/heroes/joao-thorns.png'),
    petals: loadImg('assets/heroes/joao-petals.png'),
    prison: loadImg('assets/heroes/joao-prison.png'),
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
  CANVAS.bgs = {
    'assets/bg/colinas.jpg':      loadImg('assets/bg/colinas.jpg'),
    'assets/bg/clareira.jpg':     loadImg('assets/bg/clareira.jpg'),
    'assets/bg/emboscada.jpg':    loadImg('assets/bg/emboscada.jpg'),
    'assets/bg/salao-goblin.jpg': loadImg('assets/bg/salao-goblin.jpg'),
  };
}
function setHeroPose(name, ms) {
  if (!G.battle) return;
  G.battle.heroPose = name;
  G.battle.heroPoseUntil = performance.now() + ms;
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

  // posições
  const heroPos = { x: 210, y: 470 };
  const slots = [ {x:690,y:470}, {x:865,y:446}, {x:545,y:430} ];

  drawHero(ctx, b.hero, heroPos, now);
  b.enemies.forEach((e, i) => drawEnemy(ctx, e, slots[i] || slots[0], now));

  // popups de dano
  b.popups = b.popups.filter(p => now - p.t0 < 1000);
  b.popups.forEach(p => {
    const unit = [b.hero, ...b.enemies].find(u => u.uid === p.uid);
    if (!unit) return;
    const pos = unit.side === 'hero' ? heroPos : (slots[b.enemies.indexOf(unit)] || slots[0]);
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
  let img = CANVAS.hero;
  const b = G.battle;
  if (b && b.heroPose && now < b.heroPoseUntil) {
    const p = CANVAS.heroPoses[b.heroPose];
    if (p && p.complete && p.naturalWidth) img = p;
  }
  const bob = Math.sin(now / 600 + u.bob) * 4;
  const sx = unitShake(u, now);
  const x = pos.x + sx, y = pos.y + bob;

  // sombra + anel de turno
  ctx.save();
  ctx.globalAlpha = u.alive ? 1 : 0.3;
  ctx.beginPath(); ctx.fillStyle = 'rgba(77,141,255,.16)';
  ctx.ellipse(pos.x, pos.y + 8, 78, 18, 0, 0, Math.PI * 2); ctx.fill();
  if (G.battle.active?.uid === u.uid && u.alive) {
    ctx.beginPath(); ctx.strokeStyle = '#4d8dff'; ctx.lineWidth = 3;
    ctx.globalAlpha = .5 + Math.sin(now / 240) * .3;
    ctx.ellipse(pos.x, pos.y + 8, 88, 24, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = u.alive ? 1 : 0.3;
  }

  let topY = pos.y - 250;
  if (img && img.complete && img.naturalWidth) {
    const ratio = img.naturalWidth / img.naturalHeight;
    let dh = 262, dw = dh * ratio;
    if (dw > 240) { dw = 240; dh = dw / ratio; }
    if (u.flashT && now < u.flashT) ctx.filter = 'brightness(2.2)';
    ctx.drawImage(img, x - dw / 2, y - dh, dw, dh);
    ctx.filter = 'none';
    topY = y - dh;
  } else {
    ctx.fillStyle = '#4d8dff';
    ctx.fillRect(x - 32, y - 130, 64, 130);
  }
  ctx.restore();

  drawHudBars(ctx, u, pos.x, topY - 20, '#4fc98a');
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
  const img = CANVAS.enemies[key];
  let topY = y - u.size * 2;
  if (img && img.complete && img.naturalWidth) {
    const ratio = img.naturalWidth / img.naturalHeight;
    let dh = u.size * 2.35, dw = dh * ratio;
    const maxW = u.boss ? 300 : 210;
    if (dw > maxW) { dw = maxW; dh = dw / ratio; }
    if (u.flashT && now < u.flashT) ctx.filter = 'brightness(2.3) saturate(.6)';
    ctx.drawImage(img, x - dw / 2, y - dh, dw, dh);
    ctx.filter = 'none';
    topY = y - dh;
  } else {
    ctx.font = `${u.size}px serif`; ctx.textAlign = 'center';
    ctx.fillText(u.icon, x, y);
    topY = y - u.size;
  }
  ctx.restore();

  drawHudBars(ctx, u, pos.x, topY - 16, '#ff656f');

  if (u.statuses.length) {
    const labels = { poison:'☠️', slow:'🐌', stun:'💫', regen:'✨' };
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

  $('#btn-select-confirm').addEventListener('click', () => {
    if (!pickedHero) return;
    G.save.hero = pickedHero; persist();
    renderMap(); show('map');
  });

  $('#btn-map-tree').addEventListener('click', () => { renderTree(); show('tree'); });
  $('#btn-map-bag').addEventListener('click', () => { renderBag(); show('bag'); });
  $('#btn-map-slots').addEventListener('click', () => { renderSlots(); show('slots'); });
  $('#btn-tree-back').addEventListener('click', () => { renderMap(); show('map'); });
  $('#btn-bag-back').addEventListener('click', () => { renderMap(); show('map'); });

  $('#btn-tut-ok').addEventListener('click', showNextTut);
  $('#btn-result-retry').addEventListener('click', () => startBattle(G.battle.stage));
}

function init() {
  wire();
  loadSprites();
  requestAnimationFrame(drawLoop);
}
document.addEventListener('DOMContentLoaded', init);
})();
