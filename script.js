// ===== ESTADO =====
let atividades = [];

// ===== DADOS PADRÃO PIPANDO =====
const dadosPadrao = [
  {
    id: uid(), nome: "Passeio de Buggy",
    tipos: [
      {nome:'Adulto', valor:120, sinalModo:'fixo', sinalValor:50},
      {nome:'Criança até 10 anos', valor:60, sinalModo:'pct', sinalValor:40}
    ],
    sinalAtivo: true,
    taxasNew: [{id:uid(), nome:'Taxa Ambiental', tipos:[{nome:'Adulto',modo:'fixo',valor:15},{nome:'Criança até 10 anos',modo:'fixo',valor:8}]}],
    linkMidia: ''
  },
  {
    id: uid(), nome: "Passeio de Jeep 4x4",
    tipos: [
      {nome:'Adulto', valor:100, sinalModo:'fixo', sinalValor:40},
      {nome:'Criança até 10 anos', valor:50, sinalModo:'pct', sinalValor:40}
    ],
    sinalAtivo: true,
    taxasNew: [{id:uid(), nome:'Taxa Ambiental', tipos:[{nome:'Adulto',modo:'fixo',valor:15},{nome:'Criança até 10 anos',modo:'fixo',valor:8}]}],
    linkMidia: ''
  },
  {
    id: uid(), nome: "Passeio de Barco — Lagoa Guaraíras",
    tipos: [
      {nome:'Adulto', valor:90, sinalModo:'pct', sinalValor:40},
      {nome:'Criança até 10 anos', valor:45, sinalModo:'pct', sinalValor:40}
    ],
    sinalAtivo: true,
    taxasNew: [],
    linkMidia: ''
  }
];

function uid() { return Math.random().toString(36).slice(2,8); }

// ===== PERSISTÊNCIA =====
function salvar() {
  localStorage.setItem('pipando_atividades', JSON.stringify(atividades));
}
function carregar() {
  const s = localStorage.getItem('pipando_atividades');
  atividades = s ? JSON.parse(s) : JSON.parse(JSON.stringify(dadosPadrao));
}

// ===== COTAÇÕES PERSISTÊNCIA =====
function carregarCotacoes() {
  try { return JSON.parse(localStorage.getItem('pipando_cotacoes') || '[]'); } catch{ return []; }
}
function salvarCotacoes(cots) {
  localStorage.setItem('pipando_cotacoes', JSON.stringify(cots));
}
function proximoNumCotacao() {
  const cots = carregarCotacoes();
  if(!cots.length) return 1;
  return Math.max(...cots.map(c => c.num||0)) + 1;
}
function registrarCotacao(dados) {
  const cots = carregarCotacoes();
  cots.unshift(dados); // mais recente primeiro
  salvarCotacoes(cots);
  atualizarBadge();
}

// ===== TABS =====
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  const tabs = ['cotacao','config','relatorio'];
  document.querySelectorAll('.tab-btn')[tabs.indexOf(tab)].classList.add('active');
  if(tab === 'cotacao') renderSelectGrid();
  if(tab === 'relatorio') renderRelatorio();
}

function atualizarBadge() {
  const cots = carregarCotacoes();
  const badge = document.getElementById('badge-count');
  if(cots.length > 0) {
    badge.style.display = 'inline';
    badge.textContent = cots.length;
  } else {
    badge.style.display = 'none';
  }
}

// ===== SALVAR CONFIG MANUAL =====
function salvarConfigManual() {
  // Sync tipos from DOM inputs before saving
  salvar();
  const btn = document.getElementById('btn-salvar-config');
  btn.classList.add('saved');
  btn.innerHTML = '✅ Configurações Salvas!';
  setTimeout(() => {
    btn.classList.remove('saved');
    btn.innerHTML = '💾 Salvar Configurações';
  }, 2200);
}

// ===== RENDER CONFIG =====
function toggleAcc(id) {
  const body = document.getElementById('acc-body-'+id);
  if(!body) return;
  const isOpen = body.classList.contains('open');
  document.querySelectorAll('.acc-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.acc-item').forEach(el => el.classList.remove('acc-open'));
  if(!isOpen) {
    body.classList.add('open');
    const item = body.closest('.acc-item');
    if(item) item.classList.add('acc-open');
  }
}

function salvarAcc(id, btnId) {
  const idx = typeof id === 'number' ? id : atividades.findIndex(a => a.id === id);
  const aid = idx >= 0 ? atividades[idx].id : null;
  salvar();
  renderConfig();
  renderSelectGrid();
  setTimeout(() => {
    if(aid) {
      const body = document.getElementById('acc-body-'+aid);
      if(body) {
        body.classList.add('open');
        const item = body.closest('.acc-item');
        if(item) item.classList.add('acc-open');
      }
    }
    const btn = document.getElementById(btnId);
    if(btn) {
      btn.textContent = '✓ Salvo!';
      btn.classList.add('saved');
      setTimeout(() => { if(btn) { btn.textContent = '💾 Salvar'; btn.classList.remove('saved'); } }, 1500);
    }
  }, 50);
}

function renderConfig() {
  const list = document.getElementById('ativ-list');
  list.innerHTML = '';
  atividades.forEach((a, i) => {
    // migrate legacy data
    if(!a.tipos || !a.tipos.length) a.tipos = [{nome:'Adulto', valor:a.preco||0, sinalModo:'fixo', sinalValor:a.sinal||0}];
    a.tipos.forEach(t => { if(!t.sinalModo) t.sinalModo='fixo'; if(t.sinalValor===undefined) t.sinalValor=0; });
    if(!a.taxasNew) a.taxasNew = (a.taxas||[]).map(tx=>({ id:uid(), nome:tx.nome, tipos: a.tipos.map(t=>({nome:t.nome,modo:'fixo',valor:tx.valor||0})) }));

    const badgeTxt = a.tipos.length + ' tipo' + (a.tipos.length>1?'s':'');
    const saveBtnId = 'acc-save-'+a.id;
    // Build price summary
    const precoSummary = a.tipos.map(t => `${esc(t.nome)}: R$ ${(t.valor||0).toFixed(0)}`).join(' · ');

    const card = document.createElement('div');
    card.className = 'acc-item';
    card.innerHTML = `
      <div class="acc-header" id="acc-hdr-${a.id}">
        <div class="acc-header-left">
          <div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="acc-nome">${esc(a.nome)}</span>
              ${a.sinalAtivo ? '<span class="acc-badge" style="background:#E1F5EE;color:#0F6E56">sinal</span>' : ''}
            </div>
            <div style="font-size:0.6rem;color:var(--mid);font-weight:700;margin-top:2px">${precoSummary}</div>
          </div>
        </div>
        <button class="acc-edit-btn" data-aid="${a.id}" onclick="toggleAcc(this.dataset.aid)">✏️ Editar</button>
      </div>
      <div class="acc-body" id="acc-body-${a.id}">

        <div class="acc-section">
          <div class="acc-section-title">Nome</div>
          <input class="acc-link-input" value="${esc(a.nome)}" placeholder="Nome da atividade"
            oninput="atividades[${i}].nome=this.value;renderSelectGrid()" style="margin-bottom:0">
        </div>

        <div class="acc-section">
          <div class="acc-section-title">👥 Tipos de passageiro</div>
          <div id="acc-tipos-${a.id}">
            ${renderTiposAcc(a.tipos, i, a.sinalAtivo, a.id)}
          </div>
          <button class="acc-add-tipo" data-aid="${a.id}" onclick="adicionarTipoById(this.dataset.aid)">＋ Adicionar tipo</button>
        </div>

        <div class="acc-section">
          <div class="acc-toggle-row">
            <label class="toggle-wrap">
              <input type="checkbox" ${a.sinalAtivo ? 'checked' : ''}
                onchange="atividades[${i}].sinalAtivo=this.checked;renderConfig()">
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">Cobrar sinal desta atividade</span>
          </div>
        </div>

        <div class="acc-section">
          <div class="acc-section-title">📋 Taxas adicionais</div>
          <div id="acc-taxas-${a.id}">
            ${renderTaxasNew(a.taxasNew||[], a.tipos, i)}
          </div>
          <button class="acc-add-tipo" onclick="adicionarTaxaNew(${i})">＋ Adicionar taxa</button>
        </div>

        <div class="acc-section">
          <div class="acc-section-title">📸 Link de mídia</div>
          <input class="acc-link-input" type="url" value="${esc(a.linkMidia||'')}"
            placeholder="https://youtube.com/..."
            oninput="atividades[${i}].linkMidia=this.value">
        </div>

        <div class="acc-footer">
          <button class="acc-btn-del" data-aid="${a.id}" onclick="removerAtividade(this.dataset.aid)">🗑 Remover</button>
          <button class="acc-btn-save" id="${saveBtnId}" data-aid="${a.id}" onclick="salvarAcc(this.dataset.aid,this.id)">💾 Salvar</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function renderTiposAcc(tipos, i, sinalAtivo, aid) {
  return tipos.map((t, j) => `
    <div class="acc-tipo-row">
      <input class="acc-tipo-input" value="${esc(t.nome)}" placeholder="Ex: Adulto"
        oninput="atividades[${i}].tipos[${j}].nome=this.value;renderSelectGrid()">
      <div class="acc-valor-wrap">
        <span class="acc-moeda">R$</span>
        <input class="acc-valor-input" type="number" min="0" step="1" value="${t.valor||0}"
          oninput="atividades[${i}].tipos[${j}].valor=parseFloat(this.value)||0;renderSelectGrid()">
      </div>
      ${sinalAtivo ? `
      <div class="acc-sinal-wrap">
        <button class="tipo-modo-btn ${t.sinalModo==='fixo'?'active':''}"
          onclick="setTipoModo(${i},${j},'sinalModo','fixo')">R$</button>
        <button class="tipo-modo-btn ${t.sinalModo==='pct'?'active':''}"
          onclick="setTipoModo(${i},${j},'sinalModo','pct')">%</button>
        <input class="acc-valor-input" type="number" min="0" step="1" value="${t.sinalValor||0}"
          oninput="atividades[${i}].tipos[${j}].sinalValor=parseFloat(this.value)||0"
          placeholder="${t.sinalModo==='pct'?'%':'R$'}" style="width:55px">
        <span style="font-size:0.65rem;color:var(--mid);font-weight:700">${calcSinalTipo(t)}</span>
      </div>` : ''}
      <button class="acc-del-tipo" data-aid="${aid}" data-j="${j}" onclick="removerTipoById(this.dataset.aid,parseInt(this.dataset.j))">✕</button>
    </div>
  `).join('');
}

function renderConfigOLD() {
  const list = document.getElementById('ativ-list-old');
  if(!list) return;
  list.innerHTML = '';
  atividades.forEach((a, i) => {
    if(!a.tipos || !a.tipos.length) a.tipos = [{nome:'Adulto', valor:a.preco||0, sinalModo:'fixo', sinalValor:a.sinal||0}];
    a.tipos.forEach(t => { if(!t.sinalModo) t.sinalModo='fixo'; if(t.sinalValor===undefined) t.sinalValor=0; });
    if(!a.taxasNew) a.taxasNew = (a.taxas||[]).map(tx=>({ id:uid(), nome:tx.nome, tipos: a.tipos.map(t=>({nome:t.nome,modo:'fixo',valor:tx.valor||0})) }));

    const card = document.createElement('div');
    card.className = 'ativ-card';
    card.innerHTML = `
      <div class="ativ-card-header">
        <input class="ativ-name-input" placeholder="Nome da atividade" value="${esc(a.nome)}"
          oninput="atividades[${i}].nome=this.value;renderSelectGrid()">
      </div>

      <div class="field-label" style="margin-bottom:10px">👥 Tipos de passageiro</div>
      <div id="tipos-${a.id}">
        ${renderTipos(a.tipos, i, a.sinalAtivo)}
      </div>
      <button class="btn-add-tipo" onclick="adicionarTipo(${i})">+ Adicionar tipo de passageiro</button>

      <div style="margin-top:14px">
        <div class="toggle-row">
          <label class="toggle-wrap">
            <input type="checkbox" ${a.sinalAtivo ? 'checked' : ''}
              onchange="atividades[${i}].sinalAtivo=this.checked;renderConfig()">
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-label">Cobrar sinal desta atividade</span>
        </div>
      </div>

      <div style="margin-top:14px">
        <div class="field-label" style="margin-bottom:8px">📋 Taxas adicionais</div>
        <div id="taxasnew-${a.id}">
          ${renderTaxasNew(a.taxasNew||[], a.tipos, i)}
        </div>
        <button class="btn-add-taxa" onclick="adicionarTaxaNew(${i})">+ Adicionar taxa</button>
      </div>

      <div style="margin-top:12px">
        <div class="field-label" style="margin-bottom:8px">📸 Link de mídia (fotos/vídeos)</div>
        <input class="field-input" type="url" placeholder="https://youtube.com/... ou drive.google.com/..."
          value="${esc(a.linkMidia||'')}"
          oninput="atividades[${i}].linkMidia=this.value"
          style="width:100%">
      </div>

      <div class="ativ-card-actions">
        <button class="btn-del-ativ" onclick="removerAtividade(${i})">🗑 Remover</button>
      </div>
    `;
    list.appendChild(card);
  });
}

function renderTipos(tipos, i, sinalAtivo) {
  return tipos.map((t, j) => `
    <div class="tipo-bloco">
      <div class="tipo-bloco-header">
        <div>
          <div class="tipo-bloco-nome">
            <input type="text" placeholder="Ex: Adulto" value="${esc(t.nome)}"
              style="font-family:'Montserrat',sans-serif;font-size:0.9rem;font-weight:900;border:none;border-bottom:1.5px solid #F5DDB8;background:transparent;color:var(--dark);outline:none;width:160px"
              oninput="atividades[${i}].tipos[${j}].nome=this.value;renderSelectGrid()">
          </div>
        </div>
        <button class="btn-remove-tipo" onclick="removerTipo(${i},${j})">✕</button>
      </div>
      <div class="tipo-campo-row">
        <span class="tipo-campo-label">💰 Valor</span>
        <span style="font-size:0.8rem;font-weight:700;color:var(--mid)">R$</span>
        <input class="tipo-campo-input" type="number" min="0" step="1" value="${t.valor||0}"
          oninput="atividades[${i}].tipos[${j}].valor=parseFloat(this.value)||0;renderSelectGrid()">
      </div>
      ${sinalAtivo ? `
      <div class="tipo-campo-row">
        <span class="tipo-campo-label">💳 Sinal</span>
        <div class="tipo-modo-toggle">
          <button class="tipo-modo-btn ${t.sinalModo==='fixo'?'active':''}"
            onclick="setTipoModo(${i},${j},'sinalModo','fixo')">R$</button>
          <button class="tipo-modo-btn ${t.sinalModo==='pct'?'active':''}"
            onclick="setTipoModo(${i},${j},'sinalModo','pct')">%</button>
        </div>
        <input class="tipo-campo-input" type="number" min="0" step="1" value="${t.sinalValor||0}"
          oninput="atividades[${i}].tipos[${j}].sinalValor=parseFloat(this.value)||0"
          placeholder="${t.sinalModo==='pct'?'ex: 40':'ex: 50'}">
        <span style="font-size:0.75rem;color:var(--mid);font-weight:700">
          = ${calcSinalTipo(t)}
        </span>
      </div>` : ''}
    </div>
  `).join('');
}

function calcSinalTipo(t) {
  if(!t.sinalValor) return 'R$ 0,00';
  const v = t.sinalModo === 'pct' ? (t.valor * t.sinalValor / 100) : t.sinalValor;
  return fmtBRL(v);
}

function setTipoModo(i, j, campo, valor) {
  atividades[i].tipos[j][campo] = valor;
  renderConfig();
}

function renderTaxasNew(taxas, tipos, i) {
  return taxas.map((tx, j) => `
    <div class="taxa-bloco">
      <div class="taxa-bloco-header">
        <input class="taxa-bloco-nome-input" type="text" placeholder="Nome da taxa" value="${esc(tx.nome)}"
          oninput="atividades[${i}].taxasNew[${j}].nome=this.value">
        <button class="btn-remove-taxa-bloco" onclick="removerTaxaNew(${i},${j})">✕</button>
      </div>
      ${tipos.map((t, k) => {
        const txTipo = (tx.tipos||[]).find(x=>x.nome===t.nome) || {nome:t.nome,modo:'fixo',valor:0};
        const idx = (tx.tipos||[]).findIndex(x=>x.nome===t.nome);
        const ti = idx >= 0 ? idx : k;
        return `
        <div class="tipo-campo-row">
          <span class="tipo-campo-label" style="min-width:90px">${esc(t.nome)}</span>
          <div class="tipo-modo-toggle">
            <button class="tipo-modo-btn ${txTipo.modo==='fixo'?'active':''}"
              onclick="setTaxaTipoModo(${i},${j},'${esc(t.nome)}','fixo')">R$</button>
            <button class="tipo-modo-btn ${txTipo.modo==='pct'?'active':''}"
              onclick="setTaxaTipoModo(${i},${j},'${esc(t.nome)}','pct')">%</button>
          </div>
          <input class="tipo-campo-input" type="number" min="0" step="0.5" value="${txTipo.valor||0}"
            oninput="setTaxaTipoValor(${i},${j},'${esc(t.nome)}',this.value)">
          <span style="font-size:0.75rem;color:var(--mid);font-weight:700">
            = ${txTipo.modo==='pct' ? fmtBRL(t.valor*(txTipo.valor||0)/100) : fmtBRL(txTipo.valor||0)}
          </span>
        </div>`;
      }).join('')}
    </div>
  `).join('');
}

function setTaxaTipoModo(i, j, nomeT, modo) {
  const tx = atividades[i].taxasNew[j];
  let entry = tx.tipos.find(x=>x.nome===nomeT);
  if(!entry) { entry = {nome:nomeT,modo:'fixo',valor:0}; tx.tipos.push(entry); }
  entry.modo = modo;
  renderConfig();
}

function setTaxaTipoValor(i, j, nomeT, val) {
  const tx = atividades[i].taxasNew[j];
  let entry = tx.tipos.find(x=>x.nome===nomeT);
  if(!entry) { entry = {nome:nomeT,modo:'fixo',valor:0}; tx.tipos.push(entry); }
  entry.valor = parseFloat(val)||0;
}

function adicionarTaxaNew(i) {
  if(!atividades[i].taxasNew) atividades[i].taxasNew = [];
  const tipos = atividades[i].tipos||[];
  atividades[i].taxasNew.push({
    id: uid(), nome: 'Nova Taxa',
    tipos: tipos.map(t=>({nome:t.nome, modo:'fixo', valor:0}))
  });
  renderConfig();
}
function removerTaxaNew(i, j) {
  atividades[i].taxasNew.splice(j,1);
  renderConfig();
}

function adicionarTaxa(i) {
  atividades[i].taxas = atividades[i].taxas || [];
  atividades[i].taxas.push({nome:'Taxa', valor: 0});
  salvar(); renderConfig();
}
function removerTaxa(i, j) {
  atividades[i].taxas.splice(j,1); salvar(); renderConfig();
}


function adicionarTipo(i) {
  atividades[i].tipos.push({nome:'Novo Tipo', valor:0, sinalModo:'fixo', sinalValor:0});
  salvar();
  renderConfig();
  // Re-open the accordion
  const aid = atividades[i].id;
  setTimeout(() => {
    const body = document.getElementById('acc-body-'+aid);
    if(body) {
      body.classList.add('open');
      const item = body.closest('.acc-item');
      if(item) item.classList.add('acc-open');
    }
  }, 50);
}

function removerTipo(i, j) {
  if(atividades[i].tipos.length <= 1) { alert('É necessário ao menos 1 tipo de passageiro.'); return; }
  atividades[i].tipos.splice(j, 1);
  salvar();
  renderConfig();
  const aid = atividades[i].id;
  setTimeout(() => {
    const body = document.getElementById('acc-body-'+aid);
    if(body) {
      body.classList.add('open');
      const item = body.closest('.acc-item');
      if(item) item.classList.add('acc-open');
    }
  }, 50);
}

function adicionarAtividade() {
  atividades.push({ id: uid(), nome: 'Nova Atividade', tipos: [{nome:'Adulto', valor:0, sinalModo:'fixo', sinalValor:0}], sinalAtivo: false, taxasNew: [], linkMidia: '' });
  salvar(); renderConfig();
}

function adicionarTipoById(aid) {
  const i = atividades.findIndex(a => a.id === aid);
  if(i < 0) return;
  atividades[i].tipos.push({nome:'Novo Tipo', valor:0, sinalModo:'fixo', sinalValor:0});
  salvar();
  renderConfig();
  setTimeout(() => {
    const body = document.getElementById('acc-body-'+aid);
    if(body) { body.classList.add('open'); const item = body.closest('.acc-item'); if(item) item.classList.add('acc-open'); }
  }, 50);
}

function removerTipoById(aid, j) {
  const i = atividades.findIndex(a => a.id === aid);
  if(i < 0) return;
  if(atividades[i].tipos.length <= 1) { alert('É necessário ao menos 1 tipo de passageiro.'); return; }
  atividades[i].tipos.splice(j, 1);
  salvar();
  renderConfig();
  setTimeout(() => {
    const body = document.getElementById('acc-body-'+aid);
    if(body) { body.classList.add('open'); const item = body.closest('.acc-item'); if(item) item.classList.add('acc-open'); }
  }, 50);
}

function removerAtividade(id) {
  if(!confirm('Remover esta atividade?')) return;
  const idx = typeof id === 'number' ? id : atividades.findIndex(a => a.id === id);
  if(idx < 0) return;
  atividades.splice(idx, 1);
  salvar();
  renderConfig();
  renderSelectGrid();
}

function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }

// ===== RENDER SELECT GRID =====
let selecionadas = new Set();
let datasAtiv = {};   // id -> data
let qtdsAtiv  = {};   // id -> {nomeType: qty, ...}

function renderSelectGrid() {
  const grid = document.getElementById('ativ-select-grid');
  if(!atividades.length) {
    grid.innerHTML = '<div class="empty-state"><span>🌊</span>Nenhuma atividade cadastrada ainda.<br>Vá em <b>⚙️ Configurar Atividades</b> para começar.</div>';
    return;
  }
  grid.innerHTML = atividades.map(a => {
    const sel = selecionadas.has(a.id);
    const tipos = a.tipos && a.tipos.length ? a.tipos : [{nome:'Adulto', valor: a.preco||0}];
    const priceRange = tipos.length === 1
      ? `R$ ${fmt(tipos[0].valor)} / ${tipos[0].nome}`
      : `R$ ${fmt(Math.min(...tipos.map(t=>t.valor)))} – ${fmt(Math.max(...tipos.map(t=>t.valor)))}`;
    // resumo das qtds selecionadas
    let resumo = '';
    if(sel && qtdsAtiv[a.id]) {
      const partes = tipos.filter(t => (qtdsAtiv[a.id][t.nome]||0) > 0)
                          .map(t => `${qtdsAtiv[a.id][t.nome]} ${t.nome}`);
      if(partes.length) resumo = `<div class="ativ-select-sinal" style="color:var(--ocean);margin-top:4px">${partes.join(' · ')}${datasAtiv[a.id] ? ' · 📅 ' + fmtDataDisplay(datasAtiv[a.id]) : ''}</div>`;
    }
    return `
    <div class="ativ-select-card ${sel ? 'selected' : ''}" id="card-${a.id}" onclick="abrirPopup('${a.id}')">
      <div class="check">✓</div>
      <div class="ativ-select-name">${esc(a.nome)}</div>
      <div class="ativ-select-price">${priceRange}</div>
      ${a.sinalAtivo ? `<div class="ativ-select-sinal">Sinal: R$ ${fmt(a.sinal)}/p</div>` : ''}
      ${resumo}
    </div>
  `}).join('');
}

function fmtDataDisplay(d) {
  if(!d) return '';
  const [y,m,dia] = d.split('-');
  return `${dia}/${m}/${y}`;
}

// ===== POP-UP =====
let popupAtivId = null;

function abrirPopup(id) {
  const a = atividades.find(x => x.id === id);
  if(!a) return;
  popupAtivId = id;
  const tipos = a.tipos && a.tipos.length ? a.tipos : [{nome:'Adulto', valor: a.preco||0}];
  const qtds  = qtdsAtiv[id] || {};

  document.getElementById('popup-title').textContent = a.nome;
  document.getElementById('popup-subtitle').textContent = 'Informe a quantidade por tipo de passageiro';
  const dataAtual = datasAtiv[id] || '';
  document.getElementById('popup-data').value = dataAtual;
  const dispEl = document.getElementById('popup-data-display');
  if(dataAtual) {
    dispEl.textContent = fmtDataDisplay(dataAtual);
    dispEl.style.color = 'var(--dark)';
  } else {
    dispEl.textContent = 'Selecionar data';
    dispEl.style.color = '#B0A090';
  }

  document.getElementById('popup-campos').innerHTML = tipos.map((t,j) => `
    <div class="popup-campo-row">
      <div class="popup-campo-info">
        <div class="popup-campo-nome">${esc(t.nome)}</div>
        <div class="popup-campo-preco">R$ ${fmt(t.valor)} por pessoa</div>
      </div>
      <div class="popup-counter">
        <button class="popup-btn" onclick="popupAlterarQty('${esc(t.nome)}',-1)">−</button>
        <input class="popup-qty" type="number" min="0" id="pqty-${j}" value="${qtds[t.nome]||0}"
          inputmode="numeric"
          onchange="popupSetQty('${esc(t.nome)}',this.value)"
          oninput="popupSetQty('${esc(t.nome)}',this.value)">
        <button class="popup-btn" onclick="popupAlterarQty('${esc(t.nome)}',1)">+</button>
      </div>
    </div>
  `).join('');

  document.getElementById('popup-overlay').classList.add('open');
}

function popupAlterarQty(nome, delta) {
  const a = atividades.find(x => x.id === popupAtivId);
  if(!a) return;
  const tipos = a.tipos && a.tipos.length ? a.tipos : [{nome:'Adulto', valor: a.preco||0}];
  if(!qtdsAtiv[popupAtivId]) qtdsAtiv[popupAtivId] = {};
  const cur = qtdsAtiv[popupAtivId][nome] || 0;
  const novo = Math.max(0, cur + delta);
  qtdsAtiv[popupAtivId][nome] = novo;
  const j = tipos.findIndex(t => t.nome === nome);
  const el = document.getElementById('pqty-' + j);
  if(el) el.value = novo;
}

function popupSetQty(nome, val) {
  if(!qtdsAtiv[popupAtivId]) qtdsAtiv[popupAtivId] = {};
  qtdsAtiv[popupAtivId][nome] = Math.max(0, parseInt(val) || 0);
}

function confirmarPopup() {
  if(!popupAtivId) return;
  // Sync typed values from inputs
  const a = atividades.find(x => x.id === popupAtivId);
  if(a) {
    const tipos = a.tipos && a.tipos.length ? a.tipos : [{nome:'Adulto', valor: a.preco||0}];
    if(!qtdsAtiv[popupAtivId]) qtdsAtiv[popupAtivId] = {};
    tipos.forEach((t, j) => {
      const el = document.getElementById('pqty-' + j);
      if(el) qtdsAtiv[popupAtivId][t.nome] = Math.max(0, parseInt(el.value)||0);
    });
  }
  const qtds = qtdsAtiv[popupAtivId] || {};
  const total = Object.values(qtds).reduce((s,v)=>s+v,0);
  if(total === 0) { alert('Selecione ao menos 1 passageiro.'); return; }
  selecionadas.add(popupAtivId);
  datasAtiv[popupAtivId] = document.getElementById('popup-data').value;
  fecharPopupOverlay();
  renderSelectGrid();
}

function fecharPopupCancelar() {
  // Se já estava selecionada, mantém. Se estava abrindo pela 1ª vez sem qty, remove
  const qtds = qtdsAtiv[popupAtivId] || {};
  const total = Object.values(qtds).reduce((s,v)=>s+v,0);
  if(total === 0) {
    selecionadas.delete(popupAtivId);
  }
  fecharPopupOverlay();
  renderSelectGrid();
}

function fecharPopup(e) {
  if(e.target === document.getElementById('popup-overlay')) fecharPopupCancelar();
}

function fecharPopupOverlay() {
  document.getElementById('popup-overlay').classList.remove('open');
  popupAtivId = null;
}

// ===== FORMATAR =====
function fmt(n) {
  return Number(n).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtBRL(n) { return 'R$ ' + fmt(n); }

// ===== GERAR COTAÇÃO =====
function gerarCotacao() {
  const sels = atividades.filter(a => selecionadas.has(a.id));
  if(!sels.length) { alert('Selecione ao menos uma atividade.'); return; }

  // Validar WhatsApp obrigatório
  const wppRaw = document.getElementById('wpp-cliente').value.trim();
  const wppNumeros = wppRaw.replace(/\D/g,'');
  if(!wppNumeros || wppNumeros.length < 10) {
    document.getElementById('wpp-cliente').classList.add('wpp-error');
    document.getElementById('wpp-erro').style.display = 'block';
    document.getElementById('wpp-cliente').focus();
    return;
  }
  document.getElementById('wpp-erro').style.display = 'none';

  // Formatar WhatsApp
  let wppFmt = wppNumeros;
  if(wppNumeros.length === 11) wppFmt = `(${wppNumeros.slice(0,2)}) ${wppNumeros.slice(2,7)}-${wppNumeros.slice(7)}`;
  else if(wppNumeros.length === 10) wppFmt = `(${wppNumeros.slice(0,2)}) ${wppNumeros.slice(2,6)}-${wppNumeros.slice(6)}`;

  let totalGeral = 0, totalSinal = 0;
  let itensHTML = '';
  let linhasWpp = '';
  const nome = document.getElementById('nome-cliente').value.trim();
  const agora = new Date();
  const dataStr = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const numCot = proximoNumCotacao();
  const numStr = '#' + String(numCot).padStart(4,'0');

  // Período de estadia
  const periodoIni = document.getElementById('periodo-inicio').value;
  const periodoFim = document.getElementById('periodo-fim').value;
  function fmtData(d) {
    if(!d) return '';
    const [y,m,dia] = d.split('-');
    return `${dia}/${m}/${y}`;
  }
  const periodoStr = periodoIni && periodoFim
    ? `${fmtData(periodoIni)} até ${fmtData(periodoFim)}`
    : periodoIni ? `a partir de ${fmtData(periodoIni)}`
    : periodoFim ? `até ${fmtData(periodoFim)}` : '';

  // Calcular noites
  let noitesStr = '';
  if(periodoIni && periodoFim) {
    const diff = (new Date(periodoFim) - new Date(periodoIni)) / 86400000;
    if(diff > 0) noitesStr = `${diff} noite${diff>1?'s':''}`;
  }

  sels.forEach(a => {
    const tipos = a.tipos && a.tipos.length ? a.tipos : [{nome:'Adulto', valor:a.preco||0, sinalModo:'fixo', sinalValor:0}];
    const qtds  = qtdsAtiv[a.id] || {};
    const tiposAtivos = tipos.filter(t => (qtds[t.nome]||0) > 0);
    const paxTotal = tipos.reduce((s,t)=>s+(qtds[t.nome]||0), 0);
    const subtotalTipos = tipos.reduce((s,t)=>s+(qtds[t.nome]||0)*t.valor, 0);

    // Calcular taxas por tipo
    const taxasNew = a.taxasNew || (a.taxas||[]).map(tx=>({id:uid(),nome:tx.nome,tipos:tipos.map(t=>({nome:t.nome,modo:'fixo',valor:tx.valor||0}))}));
    let subtaxas = 0;
    taxasNew.forEach(tx => {
      tipos.forEach(t => {
        const qty = qtds[t.nome]||0;
        if(!qty) return;
        const entry = (tx.tipos||[]).find(x=>x.nome===t.nome)||{modo:'fixo',valor:0};
        subtaxas += entry.modo==='pct' ? qty*(t.valor*entry.valor/100) : qty*entry.valor;
      });
    });

    // Calcular sinal por tipo
    let sinalAtiv = 0;
    if(a.sinalAtivo) {
      tipos.forEach(t => {
        const qty = qtds[t.nome]||0;
        if(!qty) return;
        const sv = t.sinalModo==='pct' ? (t.valor*(t.sinalValor||0)/100) : (t.sinalValor||0);
        sinalAtiv += qty * sv;
      });
    }

    const totalAtiv = subtotalTipos + subtaxas;
    totalGeral += totalAtiv;
    totalSinal += sinalAtiv;

    const dataPasseio = datasAtiv[a.id] ? fmtData(datasAtiv[a.id]) : '';

    // Nota HTML — passageiros
    itensHTML += `
      <div class="nota-item">
        <div class="nota-item-name">${esc(a.nome)}
          ${dataPasseio ? `<span class="nota-item-sub">📅 ${dataPasseio}</span>` : ''}
          ${tiposAtivos.map(t=>`<span class="nota-item-sub">${qtds[t.nome]} ${esc(t.nome)} × ${fmtBRL(t.valor)} = ${fmtBRL(qtds[t.nome]*t.valor)}</span>`).join('')}
        </div>
        <div class="nota-item-val">${fmtBRL(subtotalTipos)}</div>
      </div>
    `;
    // Nota HTML — taxas por tipo
    taxasNew.forEach(tx => {
      let txTotal = 0;
      const txLinhas = tiposAtivos.map(t => {
        const qty = qtds[t.nome]||0;
        const entry = (tx.tipos||[]).find(x=>x.nome===t.nome)||{modo:'fixo',valor:0};
        const vUnit = entry.modo==='pct' ? (t.valor*entry.valor/100) : entry.valor;
        const vTotal = qty * vUnit;
        txTotal += vTotal;
        if(!vUnit) return '';
        const label = entry.modo==='pct' ? `${entry.valor}% de ${fmtBRL(t.valor)}=${fmtBRL(vUnit)}` : fmtBRL(vUnit);
        return `${qty}×${esc(t.nome)}(${label})`;
      }).filter(Boolean);
      if(txTotal > 0) {
        itensHTML += `
          <div class="nota-taxa-item">
            <div class="nota-taxa-name">↳ ${esc(tx.nome)}: ${txLinhas.join(' + ')}</div>
            <div class="nota-taxa-val">${fmtBRL(txTotal)}</div>
          </div>
        `;
      }
    });

    // WhatsApp
    linhasWpp += `🌊 *${a.nome}*${dataPasseio ? ` — 📅 ${dataPasseio}` : ''}\n`;
    tiposAtivos.forEach(t => {
      linhasWpp += `   ${qtds[t.nome]} ${t.nome} × R$ ${fmt(t.valor)} = *R$ ${fmt(qtds[t.nome]*t.valor)}*\n`;
    });
    taxasNew.forEach(tx => {
      let txTotal = 0;
      tiposAtivos.forEach(t => {
        const qty = qtds[t.nome]||0;
        const entry = (tx.tipos||[]).find(x=>x.nome===t.nome)||{modo:'fixo',valor:0};
        txTotal += entry.modo==='pct' ? qty*(t.valor*entry.valor/100) : qty*entry.valor;
      });
      if(txTotal > 0) linhasWpp += `   📋 ${tx.nome} = R$ ${fmt(txTotal)}\n`;
    });
    if(a.sinalAtivo && sinalAtiv > 0) linhasWpp += `   💳 Sinal: R$ ${fmt(sinalAtiv)}\n`;
    linhasWpp += '\n';
  });

  const sinalHTML = totalSinal > 0 ? `
    <div class="nota-sinal-row">
      <div class="nota-sinal-label">💳 Sinal para confirmar</div>
      <div class="nota-sinal-val">${fmtBRL(totalSinal)}</div>
    </div>
  ` : '';

  const bars = Array.from({length:28}, (_,i) => {
    const w = [1,2,1,3,1,2,1,1,2,3,1,2,1,1,3,2,1,2,1,3,1,1,2,1,3,2,1,1][i]||1;
    return `<div class="nota-barcode-bar" style="width:${w+1}px"></div>`;
  }).join('');

  document.getElementById('nota-num').textContent = numStr;

  document.getElementById('nota-body').innerHTML = `
    <div class="nota-date">📅 ${dataStr}</div>
    <div class="nota-cliente-row">
      <div>
        ${nome ? `<div class="nota-cliente-name">👤 ${esc(nome)}</div>` : ''}
        <div class="nota-cliente-name" style="font-size:0.78rem;color:#C06A10;margin-top:${nome?'3px':'0'}">📲 +55 ${wppFmt}</div>
        ${periodoStr ? `<div class="nota-cliente-name" style="font-size:0.75rem;color:#1A7A3A;margin-top:3px;font-weight:700">🗓 ${periodoStr}${noitesStr ? ` (${noitesStr})` : ''}</div>` : ''}
      </div>

    </div>
    ${itensHTML}
    <div class="nota-total-section">
      <div class="nota-total-row">
        <div class="nota-total-label">💰 Total Geral</div>
        <div class="nota-total-val">${fmtBRL(totalGeral)}</div>
      </div>
      ${sinalHTML}
    </div>
    <div class="nota-footer">
      <div class="nota-footer-site">🌍 www.pipando.com.br · 📲 (84) 9 8166-2637</div>
      <div class="nota-footer-cadastur">⭐ Cadastur · Google 5★ · TripAdvisor 5★ — Praia da Pipa, RN</div>
      <div class="nota-barcode">${bars}</div>
    </div>
  `;

  // Texto WhatsApp
  const nomeCliente = nome ? `Olá, *${nome}*! ` : 'Olá! ';
  let wpp = `${nomeCliente}Segue a cotação ${numStr} dos passeios:\n\n`;
  if(periodoStr) wpp += `🗓 *Período:* ${periodoStr}${noitesStr ? ` (${noitesStr})` : ''}\n`;
  wpp += `━━━━━━━━━━━━━━━\n\n`;
  wpp += linhasWpp;
  wpp += `━━━━━━━━━━━━━━━\n`;
  wpp += `💰 *TOTAL: R$ ${fmt(totalGeral)}*\n`;
  if(totalSinal > 0) wpp += `💳 *Sinal para confirmar: R$ ${fmt(totalSinal)}*\n`;
  wpp += `\n📌 Para cotação e informações:\n`;
  wpp += `🌍 www.pipando.com.br\n`;
  wpp += `📲 (84) 9 8166-2637\n\n`;
  wpp += `_Sou o Matheus, especialista em passeios na Praia da Pipa. Vai ser um prazer te atender! 🤙_`;

  document.getElementById('wpp-texto').textContent = wpp;
  document.getElementById('resultado-wrap').style.display = 'block';
  document.getElementById('resultado-wrap').scrollIntoView({behavior:'smooth', block:'start'});

  // ===== SALVAR COTAÇÃO NO HISTÓRICO =====
  registrarCotacao({
    id: uid(),
    num: numCot,
    numStr,
    nome: nome || '',
    wpp: wppNumeros,
    wppFmt,
    passeios: sels.map(a => a.nome),
    passeiosQtds: sels.map(a => ({ nome: a.nome, qtds: qtdsAtiv[a.id]||{} })),
    passeiosMidia: sels.map(a => ({ nome: a.nome, link: a.linkMidia || '' })),
    datasPasseios: sels.map(a => ({ nome: a.nome, data: datasAtiv[a.id] ? fmtData(datasAtiv[a.id]) : '' })),
    periodoStr,
    noitesStr,
    total: totalGeral,
    sinal: totalSinal,
    textoWpp: wpp,
    data: agora.toISOString(),
    dataStr,
    status: 'pendente'
  });
}

// ===== SALVAR IMAGEM =====
async function capturarNota() {
  const el = document.getElementById('nota-fiscal');
  return await html2canvas(el, {
    scale: 3,
    useCORS: true,
    backgroundColor: null,
    logging: false
  });
}

async function salvarImagem() {
  const btn = document.getElementById('btn-salvar');
  btn.classList.add('saving');
  btn.innerHTML = '<span>⏳</span> Gerando...';
  try {
    const canvas = await capturarNota();
    const link = document.createElement('a');
    const nomeArq = document.getElementById('nome-cliente').value.trim() || document.getElementById('wpp-cliente').value.replace(/\D/g,'') || 'cotacao';
    link.download = `pipando-${nomeArq.replace(/\s+/g,'-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    btn.innerHTML = '<span>✅</span> Salvo!';
    setTimeout(()=>{ btn.classList.remove('saving'); btn.innerHTML='<span>📥</span> Salvar Imagem'; }, 2000);
  } catch(e) {
    btn.classList.remove('saving');
    btn.innerHTML = '<span>📥</span> Salvar Imagem';
    alert('Erro ao gerar imagem. Tente novamente.');
  }
}

async function compartilharImagem() {
  const btn = document.getElementById('btn-share');
  btn.classList.add('saving');
  btn.innerHTML = '<span>⏳</span> Preparando...';
  try {
    const canvas = await capturarNota();
    canvas.toBlob(async (blob) => {
      const nome = document.getElementById('nome-cliente').value.trim() || 'cotacao';
      const file = new File([blob], `pipando-${nome}.png`, {type:'image/png'});
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
        await navigator.share({ files: [file], title: 'Cotação Pipando Passeios' });
        btn.innerHTML = '<span>✅</span> Compartilhado!';
      } else {
        // Fallback: copia a imagem para clipboard
        try {
          await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
          btn.innerHTML = '<span>✅</span> Imagem copiada!';
        } catch {
          // Último fallback: abre em nova aba
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          btn.innerHTML = '<span>✅</span> Aberta!';
        }
      }
      setTimeout(()=>{ btn.classList.remove('saving'); btn.innerHTML='<span>📤</span> Compartilhar'; }, 2200);
    }, 'image/png');
  } catch(e) {
    btn.classList.remove('saving');
    btn.innerHTML = '<span>📤</span> Compartilhar';
  }
}

// ===== COPIAR =====
async function copiarTexto() {
  const texto = document.getElementById('wpp-texto').textContent;
  try {
    await navigator.clipboard.writeText(texto);
    const btn = document.getElementById('btn-copiar');
    btn.classList.add('copied');
    btn.innerHTML = '<span>✅</span> Copiado!';
    setTimeout(()=>{ btn.classList.remove('copied'); btn.innerHTML='<span>📋</span> Copiar para WhatsApp'; }, 2200);
  } catch(e) {
    alert('Selecione o texto acima e copie manualmente.');
  }
}

// ===== RELATÓRIO =====
const STATUS_LABELS = {
  pendente:  '⏳ Pendente',
  retornado: '✅ Retornado',
  fechado:   '🤝 Fechado',
  perdido:   '❌ Perdido'
};

function msnRetorno(c) {
  const nome = c.nome ? `*${c.nome}*` : 'você';
  const passeios = c.passeios.join(', ');
  return `Olá${c.nome ? `, *${c.nome}*` : ''}! Tudo bem? 😊\n\nVi que você recebeu nossa cotação ${c.numStr} para *${passeios}*.\n\nQueria saber se ficou alguma dúvida ou se posso ajudar a confirmar sua reserva! 🌊\n\n📲 (84) 9 8166-2637\n🌍 www.pipando.com.br`;
}

function renderRelatorio() {
  const todasCots = carregarCotacoes();
  const list = document.getElementById('rel-list');

  if(!todasCots.length) {
    list.innerHTML = `<div class="rel-empty"><span>📋</span>Nenhuma cotação registrada ainda.<br>Gere sua primeira cotação na aba <b>🧾 Realizar Cotação</b>.</div>`;
    return;
  }

  // ---- Ler filtros ----
  const fTexto  = (document.getElementById('f-texto')?.value || '').toLowerCase().trim();
  const fStatus = document.getElementById('f-status')?.value || '';
  const fDataIni = document.getElementById('f-data-ini')?.value || '';
  const fDataFim = document.getElementById('f-data-fim')?.value || '';

  // ---- Aplicar filtros ----
  const cots = todasCots.filter(c => {
    // Texto livre: número, nome, wpp, passeios
    if(fTexto) {
      const blob = [
        c.numStr, c.nome, c.wpp, c.wppFmt,
        ...(c.passeios || []),
        c.periodoStr || ''
      ].join(' ').toLowerCase();
      if(!blob.includes(fTexto)) return false;
    }
    // Status
    if(fStatus && c.status !== fStatus) return false;
    // Data da cotação (ISO string)
    if(fDataIni && c.data.slice(0,10) < fDataIni) return false;
    if(fDataFim && c.data.slice(0,10) > fDataFim) return false;
    return true;
  });

  // ---- Resumo geral (sempre sobre todas) ----
  const totalGeral = todasCots.reduce((s,c)=>s+c.total,0);
  const pendentes  = todasCots.filter(c=>c.status==='pendente').length;
  const fechados   = todasCots.filter(c=>c.status==='fechado').length;
  const resumo = `
    <div class="rel-resumo-bar">
      <div class="rel-resumo-chip"><span>Total</span><strong>${todasCots.length}</strong></div>
      <div class="rel-resumo-chip"><span>⏳ Pendentes</span><strong style="color:#856404">${pendentes}</strong></div>
      <div class="rel-resumo-chip"><span>🤝 Fechados</span><strong style="color:#1A6A3A">${fechados}</strong></div>
      <div class="rel-resumo-chip"><span>💰 Volume</span><strong>R$ ${fmt(totalGeral)}</strong></div>
    </div>
  `;

  // ---- Info de filtro ativo ----
  const filtrando = fTexto || fStatus || fDataIni || fDataFim;
  const filtroInfo = filtrando ? `
    <div class="rel-filtrado-info">
      🔎 <span>${cots.length} resultado${cots.length !== 1 ? 's' : ''} encontrado${cots.length !== 1 ? 's' : ''} de ${todasCots.length} cotações</span>
    </div>
  ` : '';

  if(!cots.length) {
    list.innerHTML = resumo + `
      <div class="rel-filtrado-info">🔎 Nenhuma cotação encontrada para os filtros selecionados.</div>
    `;
    return;
  }

  const wppIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.127 1.532 5.862L.06 23.386l5.666-1.452A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.003-1.37l-.36-.213-3.362.862.894-3.268-.234-.376A9.818 9.818 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>`;

  list.innerHTML = resumo + filtroInfo + cots.map(c => `
    <div class="rel-card" id="relcard-${c.id}">
      <div class="rel-card-header" onclick="toggleRelCard('${c.id}')">
        <div style="display:flex;flex-direction:column;gap:3px;flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="rel-num">${c.numStr}</span>
            <span class="rel-nome">${c.nome || '<span style="opacity:0.5">Sem nome</span>'}</span>
            <button class="rel-status-badge ${c.status}" onclick="event.stopPropagation();cycleStatus('${c.id}')" title="Clique para mudar status">${STATUS_LABELS[c.status]||c.status}</button>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <span class="rel-wpp">📲 +55 ${c.wppFmt}</span>
            <span class="rel-passeios">🌊 ${c.passeios.join(' · ')}</span>
            ${c.periodoStr ? `<span class="rel-passeios" style="color:#1A7A3A">🗓 ${c.periodoStr}</span>` : ''}
          </div>
        </div>
        <div style="text-align:right;display:flex;flex-direction:column;gap:3px;align-items:flex-end">
          <span class="rel-total">${fmtBRL(c.total)}</span>
          <span class="rel-data">${c.dataStr}</span>
        </div>
      </div>
      <div class="rel-body" id="relBody-${c.id}" style="display:none">
        ${(() => {
          const midias = (c.passeiosMidia||[]).filter(p=>p.link);
          if(!midias.length) return '';
          return `<div>
            <div style="font-size:0.75rem;font-weight:800;color:var(--mid);margin-bottom:6px">📸 MÍDIA DOS PASSEIOS</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${midias.map(p=>`
                <button class="rel-btn midia" onclick="copiarMidia('${c.id}','${esc(p.nome)}','${esc(p.link)}',event.target)">
                  🎥 ${esc(p.nome)}
                </button>
              `).join('')}
            </div>
          </div>`;
        })()}
        <div style="font-size:0.75rem;font-weight:700;color:var(--mid)">💬 Mensagem de retorno <span style="font-weight:600;opacity:0.7">(editável)</span></div>
        <textarea class="rel-msn-retorno" id="retorno-${c.id}">${msnRetorno(c)}</textarea>
        <div class="rel-btn-row">
          <button class="rel-btn wpp" onclick="chamarWpp('${c.id}')">${wppIcon} Chamar no WhatsApp</button>
          <button class="rel-btn copy" onclick="copiarCotacaoOriginal('${c.id}')">📋 Mensagem original</button>
          <button class="rel-btn copy-retorno" onclick="copiarRetorno('${c.id}')">📤 Copiar retorno</button>
          <button class="rel-btn del" onclick="excluirCotacao('${c.id}')" title="Excluir">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
}

function limparFiltros() {
  document.getElementById('f-texto').value = '';
  document.getElementById('f-status').value = '';
  document.getElementById('f-data-ini').value = '';
  document.getElementById('f-data-fim').value = '';
  renderRelatorio();
}

function toggleRelCard(id) {
  const body = document.getElementById('relBody-' + id);
  body.style.display = body.style.display === 'none' ? 'flex' : 'none';
}

function cycleStatus(id) {
  const order = ['pendente','retornado','fechado','perdido'];
  const cots = carregarCotacoes();
  const c = cots.find(x=>x.id===id);
  if(!c) return;
  c.status = order[(order.indexOf(c.status)+1) % order.length];
  salvarCotacoes(cots);
  renderRelatorio();
}

function chamarWpp(id) {
  const cots = carregarCotacoes();
  const c = cots.find(x=>x.id===id);
  if(!c) return;
  const num = '55' + c.wpp;
  const retorno = document.getElementById('retorno-' + id)?.value || msnRetorno(c);
  const url = `https://wa.me/${num}?text=${encodeURIComponent(retorno)}`;
  window.open(url, '_blank');
}

async function copiarCotacaoOriginal(id) {
  const cots = carregarCotacoes();
  const c = cots.find(x=>x.id===id);
  if(!c) return;
  try {
    await navigator.clipboard.writeText(c.textoWpp);
    flashBtn(event.target, '✅ Copiado!');
  } catch { alert('Copie manualmente:\n\n' + c.textoWpp); }
}

async function copiarRetorno(id) {
  const txt = document.getElementById('retorno-' + id)?.value;
  if(!txt) return;
  try {
    await navigator.clipboard.writeText(txt);
    flashBtn(event.target, '✅ Copiado!');
  } catch { alert('Copie manualmente:\n\n' + txt); }
}

async function copiarMidia(cotId, nomePasseio, link, btn) {
  const cots = carregarCotacoes();
  const c = cots.find(x=>x.id===cotId);
  const nomeCliente = c?.nome ? `*${c.nome}*` : 'você';
  const txt = `Olá${c?.nome ? `, *${c.nome}*` : ''}! 😊🌊\n\nDá uma olhada nas fotos e vídeos do *${nomePasseio}* — tenho certeza que vai amar! 🎥✨\n\n👉 ${link}\n\nQualquer dúvida é só chamar, vai ser um prazer te receber na Pipa! 🤙\n\n📲 (84) 9 8166-2637\n🌍 www.pipando.com.br`;
  try {
    await navigator.clipboard.writeText(txt);
    flashBtn(btn, '✅ Copiado!');
  } catch { alert('Copie manualmente:\n\n' + txt); }
}

function flashBtn(btn, txt) {
  const orig = btn.innerHTML;
  btn.innerHTML = txt;
  setTimeout(() => btn.innerHTML = orig, 2000);
}

function excluirCotacao(id) {
  if(!confirm('Excluir esta cotação?')) return;
  const cots = carregarCotacoes().filter(c=>c.id!==id);
  salvarCotacoes(cots);
  atualizarBadge();
  renderRelatorio();
}

function limparCotacoes() {
  if(!confirm('Limpar TODAS as cotações? Esta ação não pode ser desfeita.')) return;
  localStorage.removeItem('pipando_cotacoes');
  atualizarBadge();
  renderRelatorio();
}

// ===== CALENDÁRIO DATA PASSEIO =====
let calPasseioAberto = false;

function abrirCalPasseio() {
  // Reutiliza o mesmo calendário da estadia mas em modo "single day"
  const hoje = new Date();
  calAno = hoje.getFullYear();
  calMes = hoje.getMonth();
  const dataAtual = document.getElementById('popup-data').value;
  calIni = dataAtual ? new Date(dataAtual + 'T12:00:00') : null;
  calFim = calIni; // single day — ini === fim
  calPasseioAberto = true;
  renderCalPasseio();
  document.getElementById('cal-passeio-overlay').classList.add('open');
}

function renderCalPasseio() {
  document.getElementById('calp-mes-ano').textContent = MESES[calMes] + ' ' + calAno;
  const grid = document.getElementById('calp-dias');
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const primeiro = new Date(calAno, calMes, 1).getDay();
  const total = new Date(calAno, calMes+1, 0).getDate();
  let html = '';
  for(let i=0;i<primeiro;i++) html += '<div class="cal-dia cal-vazio"></div>';
  for(let d=1;d<=total;d++){
    const data = new Date(calAno, calMes, d);
    const dataStr = `${calAno}-${String(calMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isHoje = data.toDateString()===hoje.toDateString();
    const isSel = calIni && data.toDateString()===calIni.toDateString();
    let cls = 'cal-dia';
    if(isHoje) cls += ' cal-hoje';
    if(isSel) cls += ' cal-inicio cal-fim';
    html += `<div class="${cls}" onclick="selecionarDiaPasseio('${dataStr}')">${d}</div>`;
  }
  grid.innerHTML = html;
  const leg = document.getElementById('calp-legenda');
  leg.textContent = calIni ? `📅 ${fmtDataDisplay(calIni.toISOString().slice(0,10))} selecionado` : 'Selecione a data do passeio';
}

function navMesPasseio(d) {
  calMes += d;
  if(calMes > 11) { calMes = 0; calAno++; }
  if(calMes < 0)  { calMes = 11; calAno--; }
  renderCalPasseio();
}

function selecionarDiaPasseio(dataStr) {
  calIni = new Date(dataStr + 'T12:00:00');
  calFim = calIni;
  renderCalPasseio();
}

function confirmarCalPasseio() {
  if(calIni) {
    const dataStr = calIni.toISOString().slice(0,10);
    document.getElementById('popup-data').value = dataStr;
    const disp = document.getElementById('popup-data-display');
    disp.textContent = fmtDataDisplay(dataStr);
    disp.style.color = 'var(--dark)';
  }
  document.getElementById('cal-passeio-overlay').classList.remove('open');
  calPasseioAberto = false;
}

function limparCalPasseio() {
  calIni = null; calFim = null;
  document.getElementById('popup-data').value = '';
  const disp = document.getElementById('popup-data-display');
  disp.textContent = 'Selecionar data';
  disp.style.color = '#B0A090';
  renderCalPasseio();
}

function fecharCalPasseio(e) {
  if(e.target === document.getElementById('cal-passeio-overlay')) {
    document.getElementById('cal-passeio-overlay').classList.remove('open');
    calPasseioAberto = false;
  }
}

// ===== CALENDÁRIO ESTADIA =====
let calAno, calMes, calIni = null, calFim = null;
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function abrirCalendario() {
  const hoje = new Date();
  calAno = hoje.getFullYear();
  calMes = hoje.getMonth();
  // restore previous selection
  const ini = document.getElementById('periodo-inicio').value;
  const fim = document.getElementById('periodo-fim').value;
  calIni = ini ? new Date(ini + 'T12:00:00') : null;
  calFim = fim ? new Date(fim + 'T12:00:00') : null;
  renderCalendario();
  document.getElementById('cal-overlay').classList.add('open');
}

function fecharCalendario(e) {
  if(e.target === document.getElementById('cal-overlay'))
    document.getElementById('cal-overlay').classList.remove('open');
}

function navMes(d) {
  calMes += d;
  if(calMes > 11) { calMes = 0; calAno++; }
  if(calMes < 0)  { calMes = 11; calAno--; }
  renderCalendario();
}

function renderCalendario() {
  document.getElementById('cal-mes-ano').textContent = MESES[calMes] + ' ' + calAno;
  const grid = document.getElementById('cal-dias');
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const primeiro = new Date(calAno, calMes, 1).getDay();
  const total = new Date(calAno, calMes+1, 0).getDate();
  let html = '';
  for(let i=0;i<primeiro;i++) html += '<div class="cal-dia cal-vazio"></div>';
  for(let d=1;d<=total;d++){
    const data = new Date(calAno, calMes, d);
    const dataStr = `${calAno}-${String(calMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const passado = data < hoje;
    const isHoje = data.toDateString()===hoje.toDateString();
    const isIni = calIni && data.toDateString()===calIni.toDateString();
    const isFim = calFim && data.toDateString()===calFim.toDateString();
    const isEntre = calIni && calFim && data > calIni && data < calFim;
    let cls = 'cal-dia';
    if(passado) cls += ' cal-passado';
    if(isHoje) cls += ' cal-hoje';
    if(isIni) cls += ' cal-inicio';
    if(isFim) cls += ' cal-fim';
    if(isEntre) cls += ' cal-entre';
    const onclick = passado ? '' : `onclick="selecionarDia('${dataStr}')"`;
    html += `<div class="${cls}" ${onclick}>${d}</div>`;
  }
  grid.innerHTML = html;
  // legenda
  const leg = document.getElementById('cal-legenda');
  if(!calIni) leg.textContent = 'Selecione a data de entrada';
  else if(!calFim) leg.textContent = `Entrada: ${fmtDataDisplay(calIni.toISOString().slice(0,10))} — Selecione a saída`;
  else leg.textContent = `📅 ${fmtDataDisplay(calIni.toISOString().slice(0,10))} → ${fmtDataDisplay(calFim.toISOString().slice(0,10))}`;
}

function selecionarDia(dataStr) {
  const data = new Date(dataStr + 'T12:00:00');
  if(!calIni || (calIni && calFim)) {
    calIni = data; calFim = null;
  } else {
    if(data <= calIni) { calIni = data; calFim = null; }
    else calFim = data;
  }
  renderCalendario();
}

function limparEstadia() {
  calIni = null; calFim = null;
  document.getElementById('periodo-inicio').value = '';
  document.getElementById('periodo-fim').value = '';
  document.getElementById('estadia-display').textContent = 'Selecionar período';
  document.getElementById('estadia-display').style.color = '#B0A090';
  renderCalendario();
}

function confirmarEstadia() {
  if(calIni && calFim) {
    const ini = calIni.toISOString().slice(0,10);
    const fim = calFim.toISOString().slice(0,10);
    document.getElementById('periodo-inicio').value = ini;
    document.getElementById('periodo-fim').value = fim;
    const diff = Math.round((calFim - calIni) / 86400000);
    const disp = `${fmtDataDisplay(ini)} → ${fmtDataDisplay(fim)} (${diff} noite${diff>1?'s':''})`;
    document.getElementById('estadia-display').textContent = disp;
    document.getElementById('estadia-display').style.color = 'var(--dark)';
  } else if(calIni) {
    document.getElementById('periodo-inicio').value = calIni.toISOString().slice(0,10);
    document.getElementById('periodo-fim').value = '';
    document.getElementById('estadia-display').textContent = `A partir de ${fmtDataDisplay(calIni.toISOString().slice(0,10))}`;
    document.getElementById('estadia-display').style.color = 'var(--dark)';
  }
  document.getElementById('cal-overlay').classList.remove('open');
}

// ===== INIT =====
carregar();
renderConfig();
renderSelectGrid();
atualizarBadge();
