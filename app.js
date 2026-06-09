'use strict';

// ============================================================
// SUPABASE
// ============================================================
const SB = 'https://yjesmifqqfxialpiitnv.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZXNtaWZxcWZ4aWFscGlpdG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NTQwNDQsImV4cCI6MjA5NTMzMDA0NH0.Sn4b3YxLibSEUMhtc7Wcnerbb85Lr-FvkHee-VrjmoI';

async function dbGet(table, query) {
  query = query || '';
  try {
    const r = await fetch(SB + '/rest/v1/' + table + '?' + query, {
      headers: {
        'apikey': SK,
        'Authorization': 'Bearer ' + SK,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    if (!r.ok) { const e=await r.text(); console.error('dbGet error',r.status,e); return []; }
    return r.json();
  } catch(e) { console.error('dbGet', e); return []; }
}

async function dbPost(table, body) {
  try {
    const r = await fetch(SB + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'apikey': SK,
        'Authorization': 'Bearer ' + SK,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const e = await r.text();
      console.error('dbPost error', r.status, e);
      let msg = 'Erro ' + r.status;
      try { const j = JSON.parse(e); msg += ': ' + (j.message || j.hint || e); } catch(_) { msg += ': ' + e; }
      throw new Error(msg);
    }
    return r.json();
  } catch(e) { console.error('dbPost', e); return null; }
}

async function dbPatch(table, query, body) {
  try {
    const r = await fetch(SB + '/rest/v1/' + table + '?' + query, {
      method: 'PATCH',
      headers: {
        'apikey': SK,
        'Authorization': 'Bearer ' + SK,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) { const e=await r.text(); console.error('dbPatch error',r.status,e); return null; }
    return r.json();
  } catch(e) { console.error('dbPatch', e); return null; }
}

async function dbUpsert(table, body, onConflict) {
  try {
    const r = await fetch(SB + '/rest/v1/' + table + '?on_conflict=' + onConflict, {
      method: 'POST',
      headers: {
        'apikey': SK,
        'Authorization': 'Bearer ' + SK,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation,resolution=merge-duplicates'
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) { const e=await r.text(); console.error('dbUpsert error',r.status,e); return null; }
    return r.json();
  } catch(e) { console.error('dbUpsert', e); return null; }
}

async function dbDel(table, query) {
  try {
    const r = await fetch(SB + '/rest/v1/' + table + '?' + query, {
      method: 'DELETE',
      headers: {
        'apikey': SK,
        'Authorization': 'Bearer ' + SK,
        'Content-Type': 'application/json'
      }
    });
    if (!r.ok) { const e=await r.text(); console.error('dbDel error',r.status,e); }
    return r.ok;
  } catch(e) { return false; }
}

function showLoad(msg) {
  document.getElementById('load-msg').textContent = msg || 'Carregando...';
  document.getElementById('LOADING').style.display = 'flex';
}
function hideLoad() {
  document.getElementById('LOADING').style.display = 'none';
}

// ============================================================
// ESTADO
// ============================================================
var S = {
  role: null, user: null, nome: null,
  selPeriod: (function(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-Mensal';})(), selMember: null, selBox: 'Excedente',
  pendingEnvio: null, surveyMes: null,
  time: [], gestores: [], recados: [], projetos: [], iniciativas: [],
  autoav: {}, survey: {},
  ishi: { problema:'', metodo:'', maquina:'', material:'', maodeobra:'', meioambiente:'', medida:'' },
  porques: ['','','','',''],
  pdca: { plan:'', do_:'', check:'', act:'' },
  // login temp
  _gesNome: null, _gesId: null,
  _anaMat: null, _anaUser: null
};

function ini(n) {
  return (n || '??').split(' ').slice(0,2).map(function(c){ return c[0]; }).join('');
}

// ============================================================
// DADOS ESTÁTICOS
// ============================================================
var SK_JR = [
  {id:'s1',n:'Pontualidade / ETA / CPT / OOT',t:'Técnica',nr:3,p:5},
  {id:'s2',n:'Auditoria PELH',t:'Técnica',nr:2,p:4},
  {id:'s3',n:'Eficiência (Ocupação/SPP/Waterfill)',t:'Técnica',nr:2,p:4},
  {id:'s4',n:'Governança / Report (GEROT)',t:'Técnica',nr:2,p:4},
  {id:'s5',n:'Programação / Capacidade (W1/D0/D1)',t:'Técnica',nr:2,p:4},
  {id:'s6',n:'YMS Avançado / Fluxo Físico',t:'Técnica',nr:2,p:4},
  {id:'s7',n:'Causa Raiz / Kaizen (A3/PDCA)',t:'Técnica',nr:2,p:3},
  {id:'s8',n:'Deep Dives de Custo',t:'Técnica',nr:1,p:3},
  {id:'s9',n:'Ramp-up / Projetos',t:'Técnica',nr:1,p:3},
  {id:'s10',n:'Analytics (Excel/BI/SQL)',t:'Ferramenta',nr:2,p:3},
  {id:'s11',n:'Conhecimento do Negócio',t:'Negócio',nr:2,p:3},
  {id:'s12',n:'Conexão MWH / Reversa / Rotas',t:'Negócio',nr:1,p:3},
  {id:'s13',n:'Ética / Compliance',t:'Comportamental',nr:3,p:4},
  {id:'s14',n:'Relacionamento / Influência',t:'Comportamental',nr:2,p:3}
];
var SK_SSR = [
  {id:'s1',n:'Auditoria PELH',t:'Técnica',nr:3,p:5},
  {id:'s2',n:'Eficiência (Ocupação/SPP/Waterfill)',t:'Técnica',nr:3,p:5},
  {id:'s3',n:'Pontualidade / ETA / CPT / OOT',t:'Técnica',nr:3,p:5},
  {id:'s4',n:'Programação / Capacidade',t:'Técnica',nr:3,p:5},
  {id:'s5',n:'YMS Avançado / Fluxo Físico',t:'Técnica',nr:3,p:5},
  {id:'s6',n:'Analytics (Excel/BI/SQL)',t:'Ferramenta',nr:3,p:4},
  {id:'s7',n:'Causa Raiz / Kaizen (A3/PDCA)',t:'Técnica',nr:3,p:4},
  {id:'s8',n:'Conhecimento do Negócio',t:'Negócio',nr:3,p:4},
  {id:'s9',n:'Deep Dives de Custo',t:'Técnica',nr:3,p:4},
  {id:'s10',n:'Governança / Report',t:'Técnica',nr:3,p:4},
  {id:'s11',n:'Ética / Compliance',t:'Comportamental',nr:3,p:4},
  {id:'s12',n:'Relacionamento / Influência',t:'Comportamental',nr:3,p:4},
  {id:'s13',n:'Ramp-up / Projetos',t:'Técnica',nr:3,p:4},
  {id:'s14',n:'Conexão MWH / Reversa / Rotas',t:'Negócio',nr:2,p:3}
];
var DNA = ['Criar Valor para o Usuário','Empreender e Assumir Risco','Dar o Máximo e se Divertir','Estar em Beta Contínuo','Competir em Equipe para Ganhar','Executar com Excelência'];
var KPIS = [
  {id:'k1',n:'APMK (Safety)',s:'R'},{id:'k2',n:'2 Days MLB',s:'R'},
  {id:'k3',n:'CPS LH (Ground + Air)',s:'R'},{id:'k4',n:'Delay MLB',s:'R'},
  {id:'k5',n:'OOT (XD + SC + FBM)',s:'R'},{id:'k6',n:'ETA Destino Net',s:'R'},
  {id:'k7',n:'% Ops Prog Exc. Prata+',s:'R'},{id:'k8',n:'SPP',s:'R'},
  {id:'k9',n:'MLF',s:'R'},{id:'k10',n:'% Utilização LHVR',s:'R'},
  {id:'k11',n:'ETA Origem (1H)',s:'R'},{id:'k12',n:'Ocupação LH',s:'R'},
  {id:'k13',n:'Ocupação LH MWH',s:'R'},{id:'k14',n:'CPT MWH',s:'R'},
  {id:'k15',n:'Automatización Yard',s:'M'}
];
var ENG = ['Sinto orgulho de trabalhar no MELI.','Meu líder está acessível para conversar sobre qualquer assunto.','No MELI, encontro oportunidades para aprender e assumir novos desafios.','Posso organizar meu tempo pessoal com flexibilidade.','Meu líder toma ações para elevar o nível da equipe.','Sinto que meu líder valoriza minha contribuição.','Mantenho conversas de feedback com meu líder de forma recorrente e eficaz.','As oportunidades de assumir novos desafios são concedidas com base no mérito.','O trabalho que realizo me motiva.','Em minha equipe, trabalhamos com intensidade e dedicação.'];
var EXE = ['Asseguramos um ambiente de trabalho seguro.','Honramos os compromissos cumprindo o que foi prometido.','Alcançamos nossos objetivos otimizando tempo e recursos.','Em minha equipe, mantemos as coisas simples.','As reuniões são eficazes.'];
var MENUS = {
  gerente: [
    {id:'g-dash',l:'Dashboard',i:'fa-tachometer-alt'},
    {id:'g-gestores',l:'Gestores',i:'fa-users-cog'},
    {id:'g-4box',l:'4Box Regional',i:'fa-th'},
    {id:'g-calib',l:'Calibração',i:'fa-chart-bar'},
    {id:'g-talentos',l:'Mapa de Talentos',i:'fa-star'},
    {id:'g-survey',l:'Survey Regional',i:'fa-poll'}
  ],
  gestor: [
    {id:'cadastro',l:'Cadastro do time',i:'fa-users'},
    {id:'avaliacao',l:'Avaliação',i:'fa-clipboard-check'},
    {id:'fourbox',l:'4Box',i:'fa-th'},
    {id:'ficha',l:'Ficha individual',i:'fa-id-badge'},
    {id:'comparativo',l:'Comparativo & PDI',i:'fa-balance-scale'},
    {id:'calibracao',l:'Calibração',i:'fa-chart-bar'},
    {id:'survey-r',l:'Survey',i:'fa-poll'},
    {id:'recados',l:'Recados',i:'fa-comments'}
  ],
  analista: [
    {id:'autoav',l:'Auto-avaliação',i:'fa-star'},
    {id:'projetos',l:'Projetos',i:'fa-rocket'},
    {id:'iniciativas',l:'Iniciativas',i:'fa-lightbulb'},
    {id:'survey-a',l:'Avaliar gestor',i:'fa-comment-dots'},
    {id:'recado-a',l:'Meu recado',i:'fa-envelope'}
  ]
};

// ============================================================
// HELPERS UI
// ============================================================
function showErr(errId, msgId, txt) {
  document.getElementById(msgId).textContent = txt;
  document.getElementById(errId).style.display = 'flex';
}
function hideErr(errId) {
  var el = document.getElementById(errId);
  if (el) el.style.display = 'none';
}
function setBtnLoading(btnId, loading, txt) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + txt;
  } else {
    btn.innerHTML = btn.dataset.orig || btn.innerHTML;
  }
}
function modal(title, desc, btns) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-desc').innerHTML = desc;
  var ac = document.getElementById('modal-actions');
  ac.innerHTML = '';
  btns.forEach(function(b) {
    var el = document.createElement('button');
    el.className = 'btn ' + b.cls;
    el.textContent = b.txt;
    el.addEventListener('click', function() {
      document.getElementById('MODAL').style.display = 'none';
      b.fn();
    });
    ac.appendChild(el);
  });
  document.getElementById('MODAL').style.display = 'flex';
}

// ============================================================
// LOGIN — ABAS
// ============================================================
function showTab(role) {
  // Abas
  document.getElementById('tab-ger').classList.toggle('on', role === 'gerente');
  document.getElementById('tab-ges').classList.toggle('on', role === 'gestor');
  document.getElementById('tab-ana').classList.toggle('on', role === 'analista');
  // Forms
  document.getElementById('form-ger').style.display = role === 'gerente' ? 'block' : 'none';
  document.getElementById('form-ges').style.display = role === 'gestor'  ? 'block' : 'none';
  document.getElementById('form-ana').style.display = role === 'analista' ? 'block' : 'none';
  // Resetar erros
  ['ger-err','ges-err','ges-s2-err','ges-s3-err','ana-err','ana-s2-err','ana-s3-err'].forEach(hideErr);
}

// ============================================================
// LOGIN — GERENTE
// ============================================================
async function loginGerente() {
  var nome = document.getElementById('ger-nome').value.trim();
  var pwd  = document.getElementById('ger-pwd').value.trim();
  hideErr('ger-err');
  if (!nome || !pwd) { showErr('ger-err','ger-err-msg','Preencha nome e senha.'); return; }

  setBtnLoading('btn-ger-entrar', true, 'Verificando...');
  try {
    var rows = await dbGet('usuarios', 'role=eq.gerente&select=*');
    if (!rows || rows.length === 0) {
      showErr('ger-err','ger-err-msg','Erro ao consultar banco. Verifique sua conexão.');
      setBtnLoading('btn-ger-entrar', false);
      return;
    }
    // Busca tolerante: aceita qualquer capitalização
    var nomeBusca = nome.toLowerCase().trim();
    var user = rows.find(function(u) {
      return u.nome && u.nome.toLowerCase().trim() === nomeBusca;
    });
    if (!user) {
      var disponiveis = rows.map(function(u){return u.nome;}).join(', ');
      showErr('ger-err','ger-err-msg','Nome não encontrado. Use: ' + disponiveis);
      setBtnLoading('btn-ger-entrar', false);
      return;
    }
    if (user.senha !== pwd) {
      showErr('ger-err','ger-err-msg','Senha incorreta.');
      setBtnLoading('btn-ger-entrar', false);
      return;
    }
    showLoad('Carregando painel...');
    await loadGerente();
    hideLoad();
    entrar(user.matricula || 'ML000', user.nome, 'gerente');
  } catch(e) {
    console.error('loginGerente error:', e);
    showErr('ger-err','ger-err-msg','Erro de conexão: ' + e.message);
    setBtnLoading('btn-ger-entrar', false);
    hideLoad();
  }
}

// ============================================================
// LOGIN — GESTOR (por nome)
// ============================================================
async function gesVerificarNome() {
  var nome = document.getElementById('ges-nome').value.trim();
  hideErr('ges-err');
  if (!nome) { showErr('ges-err','ges-err-msg','Informe seu nome.'); return; }

  setBtnLoading('btn-ges-nome', true, 'Verificando...');
  try {
    // Busca todos os gestores e filtra client-side
    var all = await dbGet('usuarios', 'role=eq.gestor&select=*');
    setBtnLoading('btn-ges-nome', false);
    if (!all || all.length === 0) {
      showErr('ges-err','ges-err-msg','Erro ao consultar banco. Verifique sua conexão.');
      return;
    }
    var nomeBusca = nome.toLowerCase().trim();
    var user = all.find(function(u){
      if (!u.nome) return false;
      var nomeDB = u.nome.toLowerCase().trim();
      // Aceita qualquer variação: nome completo, primeiro nome, parcial
      return nomeDB === nomeBusca
        || nomeDB.includes(nomeBusca)
        || nomeBusca.includes(nomeDB.split(' ')[0])
        || nomeDB.split(' ')[0] === nomeBusca.split(' ')[0];
    });
    if (!user) {
      var nomes = all.map(function(u){return u.nome;}).join(', ');
      showErr('ges-err','ges-err-msg','Nome não encontrado. Nomes cadastrados: ' + nomes);
      return;
    }
    if (user.status === 'bloqueado') {
      showErr('ges-err','ges-err-msg','Acesso bloqueado (5 tentativas). Solicite desbloqueio ao gerente.');
      return;
    }
    S._gesId = user.id;
    S._gesNome = user.nome;
    if (!user.senha) {
      // Primeiro acesso
      document.getElementById('ges-s2-nome').textContent = user.nome;
      document.getElementById('ges-mat').value = user.matricula || '';
      document.getElementById('ges-s1').style.display = 'none';
      document.getElementById('ges-s2').style.display = 'block';
      setTimeout(function(){ document.getElementById('ges-mat').focus(); }, 50);
    } else {
      // Já tem senha — ir para login por matrícula
      document.getElementById('ges-login-mat').value = user.matricula || '';
      document.getElementById('ges-s1').style.display = 'none';
      document.getElementById('ges-s3').style.display = 'block';
      setTimeout(function(){ document.getElementById('ges-login-mat').focus(); }, 50);
    }
  } catch(e) {
    showErr('ges-err','ges-err-msg','Erro de conexão. Tente novamente.');
    setBtnLoading('btn-ges-nome', false);
  }
}

async function gesCriarSenha() {
  var mat = document.getElementById('ges-mat').value.trim().toUpperCase();
  var s1  = document.getElementById('ges-ns1').value;
  var s2  = document.getElementById('ges-ns2').value;
  hideErr('ges-s2-err');
  if (!mat) { showErr('ges-s2-err','ges-s2-msg','Informe sua matrícula.'); return; }
  if (!s1 || s1.length < 6) { showErr('ges-s2-err','ges-s2-msg','Senha deve ter pelo menos 6 caracteres.'); return; }
  if (s1 !== s2) { showErr('ges-s2-err','ges-s2-msg','As senhas não coincidem.'); return; }

  setBtnLoading('btn-ges-criar', true, 'Salvando...');
  try {
    await dbPatch('usuarios', 'id=eq.' + S._gesId, { matricula: mat, senha: s1, status: 'ativo', tentativas: 0 });
    showLoad('Carregando painel...');
    await loadGestor(mat);
    hideLoad();
    entrar(mat, S._gesNome, 'gestor');
  } catch(e) {
    showErr('ges-s2-err','ges-s2-msg','Erro ao salvar. Tente novamente.');
    setBtnLoading('btn-ges-criar', false);
    hideLoad();
  }
}

async function gesLogin() {
  var mat = document.getElementById('ges-login-mat').value.trim().toUpperCase();
  var pwd = document.getElementById('ges-login-pwd').value.trim();
  hideErr('ges-s3-err');
  if (!mat || !pwd) { showErr('ges-s3-err','ges-s3-msg','Preencha matrícula e senha.'); return; }

  setBtnLoading('btn-ges-login', true, 'Verificando...');
  try {
    var rows = await dbGet('usuarios', 'matricula=eq.' + mat + '&role=eq.gestor&select=*');
    var user = rows && rows.length ? rows[0] : null;
    if (!user) { showErr('ges-s3-err','ges-s3-msg','Matrícula não encontrada.'); setBtnLoading('btn-ges-login', false); return; }
    if (user.status === 'bloqueado') { showErr('ges-s3-err','ges-s3-msg','Acesso bloqueado. Solicite desbloqueio ao gerente.'); setBtnLoading('btn-ges-login', false); return; }
    if (user.senha !== pwd) {
      var tent = (user.tentativas || 0) + 1;
      var bloq = tent >= 5;
      await dbPatch('usuarios', 'matricula=eq.' + mat, { tentativas: tent, status: bloq ? 'bloqueado' : 'ativo' });
      showErr('ges-s3-err','ges-s3-msg', bloq ? 'Acesso bloqueado após 5 tentativas. Solicite desbloqueio.' : 'Senha incorreta. ' + (5-tent) + ' tentativa(s) restante(s).');
      setBtnLoading('btn-ges-login', false);
      return;
    }
    await dbPatch('usuarios', 'matricula=eq.' + mat, { tentativas: 0 });
    showLoad('Carregando painel...');
    await loadGestor(mat);
    hideLoad();
    entrar(mat, user.nome, 'gestor');
  } catch(e) {
    showErr('ges-s3-err','ges-s3-msg','Erro de conexão. Tente novamente.');
    setBtnLoading('btn-ges-login', false);
    hideLoad();
  }
}

// ============================================================
// LOGIN — ANALISTA
// ============================================================
async function anaVerificarMat() {
  var mat = document.getElementById('ana-mat').value.trim().toUpperCase();
  hideErr('ana-err');
  if (!mat) { showErr('ana-err','ana-err-msg','Informe sua matrícula.'); return; }

  setBtnLoading('btn-ana-mat', true, 'Verificando...');
  try {
    var rows = await dbGet('usuarios', 'matricula=eq.' + mat + '&role=eq.analista&select=*');
    var user = rows && rows.length ? rows[0] : null;
    setBtnLoading('btn-ana-mat', false);
    if (!user) { showErr('ana-err','ana-err-msg','Matrícula não encontrada. Solicite cadastro ao seu gestor.'); return; }
    if (user.status === 'bloqueado') { showErr('ana-err','ana-err-msg','Acesso bloqueado (5 tentativas). Solicite desbloqueio ao seu gestor.'); return; }
    S._anaMat = mat;
    S._anaUser = user;
    if (!user.senha) {
      document.getElementById('ana-s2-nome').textContent = user.nome || mat;
      document.getElementById('ana-s1').style.display = 'none';
      document.getElementById('ana-s2').style.display = 'block';
      setTimeout(function(){ document.getElementById('ana-ns1').focus(); }, 50);
    } else {
      document.getElementById('ana-s3-nome').textContent = (user.nome || mat) + ' · ' + mat;
      document.getElementById('ana-s1').style.display = 'none';
      document.getElementById('ana-s3').style.display = 'block';
      setTimeout(function(){ document.getElementById('ana-pwd').focus(); }, 50);
    }
  } catch(e) {
    showErr('ana-err','ana-err-msg','Erro de conexão. Tente novamente.');
    setBtnLoading('btn-ana-mat', false);
  }
}

async function anaCriarSenha() {
  var s1 = document.getElementById('ana-ns1').value;
  var s2 = document.getElementById('ana-ns2').value;
  hideErr('ana-s2-err');
  if (!s1 || s1.length < 6) { showErr('ana-s2-err','ana-s2-msg','Senha deve ter pelo menos 6 caracteres.'); return; }
  if (s1 !== s2) { showErr('ana-s2-err','ana-s2-msg','As senhas não coincidem.'); return; }

  setBtnLoading('btn-ana-criar', true, 'Salvando...');
  try {
    await dbPatch('usuarios', 'matricula=eq.' + S._anaMat, { senha: s1, status: 'ativo', tentativas: 0 });
    showLoad('Carregando painel...');
    await loadAnalista(S._anaMat, S._anaUser.gestor_id);
    hideLoad();
    entrar(S._anaMat, S._anaUser.nome || S._anaMat, 'analista');
  } catch(e) {
    showErr('ana-s2-err','ana-s2-msg','Erro ao salvar. Tente novamente.');
    setBtnLoading('btn-ana-criar', false);
    hideLoad();
  }
}

async function anaLogin() {
  var pwd = document.getElementById('ana-pwd').value.trim();
  hideErr('ana-s3-err');
  if (!pwd) { showErr('ana-s3-err','ana-s3-msg','Informe sua senha.'); return; }
  var user = S._anaUser;
  var mat  = S._anaMat;
  setBtnLoading('btn-ana-login', true, 'Verificando...');
  try {
    if (user.senha !== pwd) {
      var tent = (user.tentativas || 0) + 1;
      var bloq = tent >= 5;
      await dbPatch('usuarios', 'matricula=eq.' + mat, { tentativas: tent, status: bloq ? 'bloqueado' : 'ativo' });
      showErr('ana-s3-err','ana-s3-msg', bloq ? 'Acesso bloqueado após 5 tentativas. Solicite desbloqueio ao seu gestor.' : 'Senha incorreta. ' + (5-tent) + ' tentativa(s) restante(s).');
      setBtnLoading('btn-ana-login', false);
      return;
    }
    await dbPatch('usuarios', 'matricula=eq.' + mat, { tentativas: 0 });
    showLoad('Carregando painel...');
    await loadAnalista(mat, user.gestor_id);
    // Busca data de admissão do analista em time_membros
    hideLoad();
    entrar(mat, user.nome || mat, 'analista');
  } catch(e) {
    showErr('ana-s3-err','ana-s3-msg','Erro de conexão. Tente novamente.');
    setBtnLoading('btn-ana-login', false);
    hideLoad();
  }
}

// ============================================================
// ENTRAR / SAIR
// ============================================================
function entrar(mat, nome, role) {
  S.user = mat; S.nome = nome; S.role = role;
  document.getElementById('PAGE-LOGIN').style.display = 'none';
  document.getElementById('PAGE-APP').style.display = 'block';
  var rl = { gerente:'Painel Gerencial', gestor:'Painel do Gestor', analista:'Painel do Analista' };
  document.getElementById('tb-role').textContent = rl[role];
  document.getElementById('tb-nome').textContent = nome;
  document.getElementById('tb-av').textContent = ini(nome);
  if (role === 'gerente') {
    document.getElementById('tb-av').classList.add('av-ger');
  } else {
    document.getElementById('tb-av').classList.remove('av-ger');
  }
  buildSidebar();
  nav(MENUS[role][0].id);
}

function sair() {
  S = { role:null,user:null,nome:null,selPeriod:(function(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-Mensal';})(),selMember:null,selBox:'Excedente',pendingEnvio:null,surveyMes:null,time:[],gestores:[],recados:[],projetos:[],iniciativas:[],autoav:{},survey:{},ishi:{problema:'',metodo:'',maquina:'',material:'',maodeobra:'',meioambiente:'',medida:''},porques:['','','','',''],pdca:{plan:'',do_:'',check:'',act:''},_gesNome:null,_gesId:null,_anaMat:null,_anaUser:null };
  document.getElementById('PAGE-APP').style.display = 'none';
  document.getElementById('PAGE-LOGIN').style.display = 'flex';
  // Reset forms
  ['ger-nome','ger-pwd','ges-nome','ges-mat','ges-ns1','ges-ns2','ges-login-mat','ges-login-pwd','ana-mat','ana-ns1','ana-ns2','ana-pwd'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['ger-err','ges-err','ges-s2-err','ges-s3-err','ana-err','ana-s2-err','ana-s3-err'].forEach(hideErr);
  // Reset steps
  document.getElementById('ges-s1').style.display = 'block';
  document.getElementById('ges-s2').style.display = 'none';
  document.getElementById('ges-s3').style.display = 'none';
  document.getElementById('ana-s1').style.display = 'block';
  document.getElementById('ana-s2').style.display = 'none';
  document.getElementById('ana-s3').style.display = 'none';
  showTab('gestor');
}

// ============================================================
// CARREGAR DADOS
// ============================================================
async function loadGerente() {
  var g = await dbGet('usuarios', 'role=eq.gestor&select=*');
  S.gestores = (g || []).map(function(x) {
    return { id:x.id, mat:x.matricula, nome:x.nome||x.matricula, status:x.status||'ativo', tentativas:x.tentativas||0 };
  });
  var m = await dbGet('time_membros', 'select=*');
  await loadMembros(m || []);
}

async function loadGestor(mat) {
  var m = await dbGet('time_membros', 'gestor_id=eq.' + mat + '&select=*');
  await loadMembros(m || []);
  var r = await dbGet('recados', 'gestor_id=eq.' + mat + '&select=*&order=created_at.desc');
  S.recados = (r || []).map(function(x) {
    return { id:x.id,analista:x.analista_nome,mat:x.analista_mat,texto:x.texto,data:x.data_envio,resposta:x.resposta||'',dataResp:x.data_resposta||'' };
  });
}

async function loadAnalista(mat, gid) {
  var p = await dbGet('projetos', 'analista_mat=eq.' + mat + '&select=*&order=created_at.desc');
  S.projetos = (p || []).map(function(x) {
    return { id:x.id,nome:x.nome,papel:x.papel,periodo:x.periodo,status:x.status,resultado:x.resultado||'',evidencia:x.evidencia||'',desc_evidencia:x.desc_evidencia||'' };
  });
  var i = await dbGet('iniciativas', 'analista_mat=eq.' + mat + '&select=*&order=created_at.desc');
  S.iniciativas = (i || []).map(function(x) {
    return { id:x.id,nome:x.nome,kpi:x.kpi,impacto:x.impacto,como:x.como||'' };
  });
  var rc = await dbGet('recados', 'analista_mat=eq.' + mat + '&select=*&order=created_at.desc');
  S.recados = (rc || []).map(function(x) {
    return { id:x.id,analista:x.analista_nome,mat:x.analista_mat,texto:x.texto,data:x.data_envio,resposta:x.resposta||'',dataResp:x.data_resposta||'' };
  });
  var aa = await dbGet('auto_avaliacoes', 'analista_mat=eq.' + mat + '&select=*');
  if (aa && aa.length) {
    var a = aa[0]; var ao = {};
    if (a.skills) Object.keys(a.skills).forEach(function(k){ ao['sk_'+k] = a.skills[k]; });
    if (a.dna)    Object.keys(a.dna).forEach(function(k){ ao['dna_'+k] = a.dna[k]; });
    S.autoav = ao;
  }
  var sv = await dbGet('surveys', 'analista_mat=eq.' + mat + '&select=mes&order=created_at.desc&limit=1');
  if (sv && sv.length) S.surveyMes = sv[0].mes;
  if (gid) {
    var mb = await dbGet('time_membros', 'gestor_id=eq.' + gid + '&select=*');
    await loadMembros(mb || []);
  }
}

async function loadMembros(membros) {
  S.time = [];
  if (!membros.length) return;

  // Uma única query para todas as avaliações dos membros (evita N+1)
  var ids = membros.map(function(m){ return m.id; }).join(',');
  var todasAvs = await dbGet('avaliacoes', 'membro_id=in.(' + ids + ')&select=*');

  // Indexa por membro_id
  var avPorMembro = {};
  (todasAvs || []).forEach(function(a) {
    if (!avPorMembro[a.membro_id]) avPorMembro[a.membro_id] = {};
    avPorMembro[a.membro_id][a.periodo] = {
      skills:a.skills||{}, dna:a.dna||{}, kpis:a.kpis||{},
      pres:a.pres||{presencialidade:3,phishing:3,conectividade:3},
      entregas:a.entregas||'', fortes:a.fortes||'', dev:a.dev||'',
      passos:a.passos||'', carreira:a.carreira||'',
      turnover:a.turnover||'baixo', lancada:a.lancada||false, _id:a.id
    };
  });

  membros.forEach(function(m) {
    S.time.push({
      id:m.id, nome:m.nome, mat:m.matricula, cargo:m.cargo,
      conta:m.conta||'', adm:m.adm||'', cadencia:m.cadencia||'Mensal',
      gestorId:m.gestor_id, avaliacoes:avPorMembro[m.id]||{}
    });
  });
}

// ============================================================
// NAVEGAÇÃO
// ============================================================
function buildSidebar() {
  var sb = document.getElementById('SIDEBAR');
  sb.innerHTML = '<div class="sb-lbl" style="margin-top:.75rem">' + (S.role==='gerente'?'Regional':S.role==='gestor'?'Gestão':'Meu painel') + '</div>';
  MENUS[S.role].forEach(function(m) {
    var d = document.createElement('div');
    d.className = 'sb-item';
    d.id = 'sb-' + m.id;
    d.innerHTML = '<i class="fas ' + m.i + '"></i>' + m.l;
    d.addEventListener('click', function(){ nav(m.id); });
    sb.appendChild(d);
  });
}

function nav(pg) {
  S.page = pg;
  document.querySelectorAll('.sb-item').forEach(function(el){ el.classList.remove('on','on-ger'); });
  var el = document.getElementById('sb-' + pg);
  if (el) el.classList.add(S.role === 'gerente' ? 'on-ger' : 'on');
  var ct = document.getElementById('PAGE-CONTENT');
  ct.innerHTML = '';
  var pages = {
    'g-dash': pgGDash, 'g-gestores': pgGGestores, 'g-4box': pgG4Box,
    'g-calib': pgGCalib, 'g-talentos': pgGTalentos, 'g-survey': pgGSurvey,
    'cadastro': pgCadastro, 'avaliacao': pgAvaliacao, 'fourbox': pgFourbox,
    'ficha': pgFicha, 'comparativo': pgComparativo, 'calibracao': pgCalibracao,
    'survey-r': pgSurveyR, 'recados': pgRecados,
    'autoav': pgAutoav, 'projetos': pgProjetos, 'iniciativas': pgIniciativas,
    'survey-a': pgSurveyA, 'recado-a': pgRecadoA
  };
  if (pages[pg]) pages[pg](ct);
}

// ============================================================
// CÁLCULO DE SCORE
// ============================================================
function calcScore(m, period) {
  var av = m.avaliacoes[period];
  if (!av) return null;
  var sk = m.cargo === 'Analista Jr' ? SK_JR : SK_SSR;
  var pts=0, maxPts=0, pen=0;
  sk.forEach(function(s) {
    var v = av.skills[s.id] || 0;
    if (v === 0) { pen += s.p === 5 ? 15 : 5; }
    else { pts += (v/s.nr)*s.p; if(s.p===5&&v<s.nr) pen += Math.min(15,(s.nr-v)*5); }
    maxPts += s.p;
  });
  var perf = maxPts ? Math.max(0, Math.min(100, Math.round((pts/maxPts)*100) - pen)) : 0;
  var kpiPts = KPIS.reduce(function(a,k){ return a + (av.kpis[k.id]||0); }, 0);
  var kpiScore = Math.round((kpiPts / (KPIS.length*2)) * 100);
  var pr = av.pres || {presencialidade:3,phishing:3,conectividade:3};
  var presScore = Math.round(((pr.presencialidade+pr.phishing+pr.conectividade)/12)*100);
  var final = Math.round(perf*.6 + kpiScore*.25 + presScore*.15);
  var potPts=0, potMax=0;
  sk.forEach(function(s){ potPts += ((av.skills[s.id]||0)/4)*s.p; potMax += s.p; });
  var pot = potMax ? Math.round((potPts/potMax)*100) : 0;
  var admDate = m.adm && m.adm.length >= 8 ? new Date(m.adm) : null;
  var meses = admDate && !isNaN(admDate) ? Math.floor((new Date() - admDate) / (1000*60*60*24*30)) : 99;
  var box = 'Estável';
  if (meses < 6) box = 'Cedo p/ avaliar';
  else if (final < 45) box = 'Alerta';
  else if (final < 65) box = pot >= 60 ? 'Promissor' : 'Estável';
  else if (final < 80) box = pot >= 65 ? 'Excedente' : 'Estável';
  else box = pot >= 75 ? 'Atípico' : 'Excedente';
  var qual = 'Não aderente';
  if (final >= 90 && pen === 0) qual = 'Pronto';
  else if (final >= 80) qual = 'Pronto c/ ressalvas';
  else if (final >= 65) qual = 'Em desenvolvimento';
  // DNA — não compõe o score final, mas é calculado para exibição
  var dnaPts = 0, dnaCount = 0;
  Object.values(av.dna||{}).forEach(function(v){ dnaPts += parseInt(v)||0; dnaCount++; });
  var dnaScore = dnaCount ? Math.round((dnaPts/(dnaCount*2))*100) : null;

  return { final:final, pot:pot, box:box, qual:qual, pen:pen, kpiScore:kpiScore, presScore:presScore, perf:perf, dnaScore:dnaScore, meses:meses };
}

function bbadge(b){ return {Alerta:'b-r',Excedente:'b-g',Atípico:'b-n',Promissor:'b-a',Estável:'b-a','Cedo p/ avaliar':'b-gr'}[b]||'b-gr'; }
function bcolor(b){ return {Alerta:'#C62828',Excedente:'#2E7D32',Atípico:'#6A1B9A',Promissor:'#BF360C',Estável:'#E65100','Cedo p/ avaliar':'#888780'}[b]||'#888780'; }
function bbg(b){   return {Alerta:'#FFF5F5',Excedente:'#F1F8E9',Atípico:'#F3E5F5',Promissor:'#FFF8E1',Estável:'#FFFDE7','Cedo p/ avaliar':'#FAFAF8'}[b]||'#FAFAF8'; }
function lvlLbl(v){ return ['','Básico','Intermediário','Avançado','Referência'][v]||''; }

function ensureAv(mid) {
  mid = parseInt(mid);
  var m = S.time.find(function(x){ return x.id === mid; });
  if (!m) return null;
  if (!m.avaliacoes[S.selPeriod]) {
    m.avaliacoes[S.selPeriod] = { skills:{},dna:{},kpis:{},pres:{presencialidade:3,phishing:3,conectividade:3},entregas:'',fortes:'',dev:'',passos:'',carreira:'',turnover:'baixo',lancada:false };
  }
  return m.avaliacoes[S.selPeriod];
}

// CORES DOS NÍVEIS DE SKILL
var NCOR  = ['#9E9E9E','#66BB6A','#FFD600','#FF7043','#5C6BC0'];
var NNOME = ['Cedo para avaliar','Básico','Intermediário','Avançado','Referência'];

// Renderiza select de skill
function renderDots(mid, sid, cur, isG) {
  cur = parseInt(cur) || 0;
  var fn = isG ? 'skSet(' + mid + ',"' + sid + '",parseInt(this.value))' : 'autoSkSet("' + sid + '",parseInt(this.value))';
  var html = '<select style="width:auto;font-size:11px;padding:4px 8px" onchange="' + fn + '">';
  for (var v = 0; v <= 4; v++) {
    html += '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + NNOME[v] + '</option>';
  }
  html += '</select>';
  return html;
}

// Wrapper com data-attributes para atualização in-place
function dotsWrap(mid, sid, cur, isG) {
  return '<span data-sid="' + sid + '" data-mid="' + mid + '">' + renderDots(mid, sid, cur, isG) + '</span>';
}

// Gravar skill no estado e atualizar visual in-place (SEM recarregar a página)
function skSet(mid, sid, val) {
  mid = parseInt(mid); val = parseInt(val);
  var m = S.time.find(function(x){ return x.id === mid; });
  if (!m) { console.error('membro não encontrado:', mid); return; }
  if (!m.avaliacoes[S.selPeriod]) {
    m.avaliacoes[S.selPeriod] = {skills:{},dna:{},kpis:{},pres:{presencialidade:3,phishing:3,conectividade:3},entregas:'',fortes:'',dev:'',passos:'',carreira:'',turnover:'baixo',lancada:false};
  }
  m.avaliacoes[S.selPeriod].skills[sid] = val;
}

// Gravar auto-skill
function autoSkSet(sid, val) {
  val = parseInt(val);
  S.autoav['sk_' + sid] = val;
}

// Gravar DNA do membro
function setDna(mid, idx, val) {
  mid = parseInt(mid); val = parseInt(val);
  var m = S.time.find(function(x){ return x.id === mid; });
  if (!m) return;
  if (!m.avaliacoes[S.selPeriod]) {
    m.avaliacoes[S.selPeriod] = {skills:{},dna:{},kpis:{},pres:{presencialidade:3,phishing:3,conectividade:3},entregas:'',fortes:'',dev:'',passos:'',carreira:'',turnover:'baixo',lancada:false};
  }
  m.avaliacoes[S.selPeriod].dna[idx] = val;
}

// Gravar presencialidade
function setPres(mid, campo, val) {
  mid = parseInt(mid); val = parseInt(val);
  var m = S.time.find(function(x){ return x.id === mid; });
  if (!m) return;
  if (!m.avaliacoes[S.selPeriod]) {
    m.avaliacoes[S.selPeriod] = {skills:{},dna:{},kpis:{},pres:{presencialidade:3,phishing:3,conectividade:3},entregas:'',fortes:'',dev:'',passos:'',carreira:'',turnover:'baixo',lancada:false};
  }
  if (!m.avaliacoes[S.selPeriod].pres) m.avaliacoes[S.selPeriod].pres = {presencialidade:3,phishing:3,conectividade:3};
  m.avaliacoes[S.selPeriod].pres[campo] = val;
}

// Gravar KPI
function setKpi(mid, kid, val) {
  mid = parseInt(mid); val = parseInt(val);
  var m = S.time.find(function(x){ return x.id === mid; });
  if (!m) return;
  if (!m.avaliacoes[S.selPeriod]) {
    m.avaliacoes[S.selPeriod] = {skills:{},dna:{},kpis:{},pres:{presencialidade:3,phishing:3,conectividade:3},entregas:'',fortes:'',dev:'',passos:'',carreira:'',turnover:'baixo',lancada:false};
  }
  m.avaliacoes[S.selPeriod].kpis[kid] = val;
}

// Gravar campo qualitativo
function setAv(mid, campo, val) {
  mid = parseInt(mid);
  var m = S.time.find(function(x){ return x.id === mid; });
  if (!m) return;
  if (!m.avaliacoes[S.selPeriod]) {
    m.avaliacoes[S.selPeriod] = {skills:{},dna:{},kpis:{},pres:{presencialidade:3,phishing:3,conectividade:3},entregas:'',fortes:'',dev:'',passos:'',carreira:'',turnover:'baixo',lancada:false};
  }
  m.avaliacoes[S.selPeriod][campo] = val;
}

// Gravar risco de turnover
function setTurnover(mid, val) {
  mid = parseInt(mid);
  var m = S.time.find(function(x){ return x.id === mid; });
  if (!m) return;
  if (!m.avaliacoes[S.selPeriod]) {
    m.avaliacoes[S.selPeriod] = {skills:{},dna:{},kpis:{},pres:{presencialidade:3,phishing:3,conectividade:3},entregas:'',fortes:'',dev:'',passos:'',carreira:'',turnover:'baixo',lancada:false};
  }
  m.avaliacoes[S.selPeriod].turnover = val;
  // Atualiza visual dos botões de turnover
  var opts = [['baixo','to-low'],['medio','to-med'],['alto','to-high']];
  document.querySelectorAll('.to-opt').forEach(function(btn, i) {
    btn.classList.remove('to-low','to-med','to-high');
    if (opts[i] && opts[i][0] === val) btn.classList.add(opts[i][1]);
  });
}

// Atualizar score no topo da página de avaliação
function updateScoreLive(mid) {
  mid = parseInt(mid);
  var m = S.time.find(function(x){ return x.id === mid; });
  if (!m) return;
  ensureAv(mid);
  var sc = calcScore(m, S.selPeriod);
  if (!sc) return;
  var el = document.getElementById('score-live');
  if (!el) return;
  var av = m.avaliacoes[S.selPeriod] || {};
  var cor = sc.final>=80?'var(--gr)':sc.final>=60?'var(--n)':'var(--rd)';
  // Atualiza só o conteúdo de score, preservando o botão Calcular Score
  var scoreContent = document.getElementById('score-content');
  if (!scoreContent) return;
  scoreContent.innerHTML =
    '<div style="text-align:center;padding-right:1.5rem">'
    + '<div style="font-size:34px;font-weight:700;color:'+cor+'">'+sc.final+'%</div>'
    + '<div style="font-size:11px;color:var(--ts)">Score final</div></div>'
    + '<div style="flex:1"><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:.4rem">'
    + '<span class="badge '+bbadge(sc.box)+'">'+sc.box+'</span>'
    + '<span class="badge b-gr">'+sc.qual+'</span>'
    + (av.lancada?'<span class="badge b-g">✓ Enviado</span>':'<span class="badge b-a">Rascunho</span>')
    + '</div><div style="font-size:11px;color:var(--ts)">Skills: <b>'+sc.perf+'%</b> · KPIs: <b>'+sc.kpiScore+'%</b> · Pres: <b>'+sc.presScore+'%</b> · Pen: <b style="color:var(--rd)">-'+sc.pen+'pts</b>'+(sc.dnaScore!==null?' · DNA: <b>'+sc.dnaScore+'%</b>':'')+'</div>'
    + '</div>';
}

async function saveAv(mid, period) {
  var m = S.time.find(function(x){ return x.id===mid; });
  if (!m) return;
  var av = m.avaliacoes[period];
  if (!av) return;
  showLoad('Salvando...');
  await dbUpsert('avaliacoes', {
    membro_id:mid, periodo:period, skills:av.skills, dna:av.dna, kpis:av.kpis, pres:av.pres,
    entregas:av.entregas, fortes:av.fortes, dev:av.dev, passos:av.passos,
    carreira:av.carreira, turnover:av.turnover, lancada:av.lancada,
    gestor_id:S.user, updated_at:new Date().toISOString()
  }, 'membro_id,periodo');
  hideLoad();
}

// ============================================================
// PÁGINAS — GERENTE
// ============================================================
function pgGDash(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Dashboard Regional</div><div class="pd">Visão macro do negócio</div></div>';
  var all = S.time;
  var total = all.length || 1;
  var below = all.filter(function(m){ var sc=calcScore(m,S.selPeriod); return sc&&sc.final<55; }).length;
  var above = all.filter(function(m){ var sc=calcScore(m,S.selPeriod); return sc&&sc.final>=80; }).length;
  var meet  = total - below - above;
  var avg   = all.length ? Math.round(all.reduce(function(a,m){ var sc=calcScore(m,S.selPeriod); return a+(sc?sc.final:0); },0)/all.length) : 0;
  ct.innerHTML += '<div class="g5" style="margin-bottom:1.5rem">'
    + '<div class="metric"><div class="mv">'+S.gestores.length+'</div><div class="ml">Gestores</div></div>'
    + '<div class="metric"><div class="mv">'+all.length+'</div><div class="ml">Analistas</div></div>'
    + '<div class="metric"><div class="mv" style="color:var(--n)">'+avg+'%</div><div class="ml">Score médio</div></div>'
    + '<div class="metric"><div class="mv" style="color:var(--rd)">'+below+'</div><div class="ml">Below</div></div>'
    + '<div class="metric"><div class="mv" style="color:var(--gr)">'+above+'</div><div class="ml">Above</div></div>'
    + '</div>';
  // Tabela de gestores com scores dos seus times
  ct.innerHTML += '<div class="card"><div class="ct"><i class="fas fa-users-cog"></i>Performance por gestor</div>'
    + '<table class="tbl"><thead><tr><th>Gestor</th><th>Analistas</th><th>Média</th><th>Below</th><th>Above</th></tr></thead><tbody>'
    + S.gestores.map(function(g) {
        var tm = S.time.filter(function(m){ return m.gestorId===g.mat; });
        var tot = tm.length || 1;
        var bl = tm.filter(function(m){ var sc=calcScore(m,S.selPeriod); return sc&&sc.final<55; }).length;
        var ab = tm.filter(function(m){ var sc=calcScore(m,S.selPeriod); return sc&&sc.final>=80; }).length;
        var av2 = tm.length ? Math.round(tm.reduce(function(a,m){ var sc=calcScore(m,S.selPeriod); return a+(sc?sc.final:0); },0)/tm.length) : 0;
        return '<tr><td><div style="display:flex;align-items:center;gap:7px"><div class="av av-sm av-ger">'+ini(g.nome)+'</div><strong>'+g.nome+'</strong></div></td>'
          +'<td>'+tm.length+'</td>'
          +'<td style="font-weight:700;color:var(--n)">'+av2+'%</td>'
          +'<td style="color:var(--rd)">'+bl+'</td>'
          +'<td style="color:var(--gr)">'+ab+'</td></tr>';
      }).join('')
    + '</tbody></table></div>';
}

async function pgGGestores(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Gestores</div><div class="pd">Cadastro, reset de senha e bloqueio</div></div>'
    + '<div style="text-align:center;padding:2rem;color:var(--ts)"><div class="spinner" style="margin:0 auto"></div><div style="margin-top:.75rem">Carregando...</div></div>';
  showLoad('Carregando gestores...');
  var todos = await dbGet('usuarios', 'role=eq.gestor&select=*') || [];
  hideLoad();

  var ativos    = todos.filter(function(u){ return u.status==='ativo'; });
  var bloqueados= todos.filter(function(u){ return u.status==='bloqueado'; });

  ct.innerHTML = '<div class="ph"><div class="pt">Gestores</div><div class="pd">Cadastro, reset de senha e bloqueio</div></div>';

  // Cadastrar novo gestor
  ct.innerHTML += '<div class="card"><div class="ct"><i class="fas fa-user-plus"></i>Cadastrar novo gestor</div>'
    + '<div class="alert alert-n"><i class="fas fa-info-circle"></i>Informe apenas o nome. O gestor completará o cadastro no primeiro acesso.</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:1rem">'
    + '<input id="new-ges-nome" placeholder="Nome completo do gestor" style="flex:1">'
    + '<button class="btn btn-n" id="btn-novo-ges"><i class="fas fa-plus"></i> Cadastrar</button>'
    + '</div>'
    + '<div id="new-ges-err" class="alert alert-r" style="display:none"><i class="fas fa-exclamation-circle"></i><span id="new-ges-msg"></span></div>'
    + '</div>';

  // Lista ativos
  ct.innerHTML += '<div class="card"><div class="ct"><i class="fas fa-check-circle"></i>Gestores ativos <span class="badge b-g">'+ativos.length+'</span></div>'
    + (ativos.length ? ativos.map(function(u) {
        return '<div style="display:flex;align-items:center;gap:10px;padding:.75rem 0;border-bottom:1px solid #F5F4F0">'
          +'<div class="av av-md av-ger">'+ini(u.nome||u.matricula)+'</div>'
          +'<div style="flex:1"><div style="font-weight:600">'+u.nome+'</div>'
          +'<div style="font-size:11px;color:var(--ts)">'+(u.matricula||'Aguardando 1º acesso')+'</div></div>'
          +'<span class="badge b-g">Ativo</span>'
          +(u.matricula?'<button class="btn-sm" onclick="resetGestor('+u.id+',\''+u.nome+'\')"><i class="fas fa-key"></i> Reset</button>':'')
          +'<button class="btn-sm" style="background:#FFEBEE;border-color:#EF9A9A;color:#C62828" onclick="bloquearGestor('+u.id+',\''+u.nome+'\')"><i class="fas fa-lock"></i> Bloquear</button>'
    
          +'<button class="btn-sm" style="background:#FFEBEE;border-color:#EF9A9A;color:#C62828" onclick="excluirGestor('+u.id+',\''+u.nome+'\')"><i class="fas fa-trash-alt"></i> Excluir</button>'
                +'</div>';
      }).join('') : '<div style="color:var(--ts);font-size:13px">Nenhum ativo.</div>')
    + '</div>';

  // Bloqueados
  if (bloqueados.length) {
    ct.innerHTML += '<div class="card"><div class="ct"><i class="fas fa-lock"></i>Bloqueados <span class="badge b-r">'+bloqueados.length+'</span></div>'
      + bloqueados.map(function(u) {
          return '<div style="display:flex;align-items:center;gap:10px;padding:.75rem 0;border-bottom:1px solid #F5F4F0">'
            +'<div class="av av-md av-ger">'+ini(u.nome)+'</div>'
            +'<div style="flex:1"><div style="font-weight:600">'+u.nome+'</div>'
            +'<div style="font-size:11px;color:var(--ts)">'+u.matricula+'</div></div>'
            +'<span class="badge b-r">Bloqueado</span>'
            +'<button class="btn-sm" style="background:#E8F5E9;border-color:#A5D6A7;color:#2E7D32" onclick="desbloquearGestor('+u.id+',\''+u.nome+'\')"><i class="fas fa-unlock"></i> Desbloquear</button>'
            +'<button class="btn-sm" style="background:#FFEBEE;border-color:#EF9A9A;color:#C62828" onclick="excluirGestor('+u.id+',\''+u.nome+'\')"><i class="fas fa-trash-alt"></i> Excluir</button>'
            +'</div>';
        }).join('')
      + '</div>';
  }

  // Bind cadastrar
  document.getElementById('btn-novo-ges').addEventListener('click', async function() {
    var nome = document.getElementById('new-ges-nome').value.trim();
    hideErr('new-ges-err');
    if (!nome) { showErr('new-ges-err','new-ges-msg','Informe o nome.'); return; }
    this.disabled = true;
    showLoad('Cadastrando...');
    var r = await dbPost('usuarios', { nome:nome, role:'gestor', status:'ativo', tentativas:0 });
    hideLoad();
    if (!r) { showErr('new-ges-err','new-ges-msg','Erro ao cadastrar. Tente novamente.'); this.disabled=false; return; }
    await loadGerente();
    nav('g-gestores');
  });
}

async function resetGestor(id, nome) {
  if (!confirm('Resetar senha de '+nome+'?\nEle precisará criar nova senha no próximo acesso.')) return;
  showLoad('Resetando...');
  await dbPatch('usuarios', 'id=eq.'+id, { senha:null, status:'ativo', tentativas:0 });
  hideLoad();
  alert('Senha de '+nome+' resetada!');
  nav('g-gestores');
}
async function bloquearGestor(id, nome) {
  if (!confirm('Bloquear '+nome+'?')) return;
  await dbPatch('usuarios', 'id=eq.'+id, { status:'bloqueado' });
  nav('g-gestores');
}
async function desbloquearGestor(id, nome) {
  await dbPatch('usuarios', 'id=eq.'+id, { status:'ativo', tentativas:0 });
  nav('g-gestores');
}
async function excluirGestor(id, nome) {
  if (!confirm('Excluir o gestor '+nome+' permanentemente?\nEsta ação não pode ser desfeita.')) return;
  showLoad('Excluindo...');
  await dbDel('usuarios', 'id=eq.'+id);
  hideLoad();
  S.gestores = S.gestores.filter(function(g){ return g.id !== id; });
  nav('g-gestores');
}

function pgG4Box(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">4Box Regional</div><div class="pd">Todos os analistas da regional</div></div>';
  var boxes = { 'Alerta':[],'Cedo p/ avaliar':[],'Estável':[],'Excedente':[],'Promissor':[],'Atípico':[] };
  S.time.forEach(function(m){ var sc=calcScore(m,S.selPeriod); if(sc) boxes[sc.box].push({m:m,sc:sc}); });
  var total = S.time.length||1;
  var below = S.time.filter(function(m){ var sc=calcScore(m,S.selPeriod); return sc&&sc.final<55; }).length;
  var above = S.time.filter(function(m){ var sc=calcScore(m,S.selPeriod); return sc&&sc.final>=80; }).length;
  ct.innerHTML += '<div class="g4" style="margin-bottom:1rem">'
    +'<div class="metric"><div class="mv">'+S.time.length+'</div><div class="ml">Total</div></div>'
    +'<div class="metric"><div class="mv" style="color:var(--rd)">'+below+' ('+Math.round(below/total*100)+'%)</div><div class="ml">Below</div></div>'
    +'<div class="metric"><div class="mv">'+(total-below-above)+' ('+Math.round((total-below-above)/total*100)+'%)</div><div class="ml">Meet</div></div>'
    +'<div class="metric"><div class="mv" style="color:var(--gr)">'+above+' ('+Math.round(above/total*100)+'%)</div><div class="ml">Above</div></div>'
    +'</div>';
  renderBoxGrid(ct, boxes, false);
}

function pgGCalib(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Calibração Regional</div><div class="pd">Distribuição por gestor vs curva MELI</div></div>';
  S.gestores.forEach(function(g) {
    var tm = S.time.filter(function(m){ return m.gestorId===g.mat; });
    if (!tm.length) return;
    var tot = tm.length;
    var bl  = tm.filter(function(m){ var sc=calcScore(m,S.selPeriod); return sc&&sc.final<55; }).length;
    var me  = tm.filter(function(m){ var sc=calcScore(m,S.selPeriod); return sc&&sc.final>=55&&sc.final<80; }).length;
    var ab  = tm.filter(function(m){ var sc=calcScore(m,S.selPeriod); return sc&&sc.final>=80; }).length;
    var pB=Math.round(bl/tot*100), pM=Math.round(me/tot*100), pA=Math.round(ab/tot*100);
    ct.innerHTML += '<div class="card"><div class="ct"><i class="fas fa-chart-bar"></i>'+g.nome+' <span class="badge b-gr">'+tot+' analistas</span></div>'
      +'<div style="font-size:11px;color:var(--ts);margin-bottom:.3rem">Distribuição real</div>'
      +'<div class="cal-bar">'
      +'<div class="cal-seg" style="width:'+pB+'%;background:#FFEBEE;color:#C62828;min-width:'+( pB?'44px':'0')+'">Below '+pB+'%</div>'
      +'<div class="cal-seg" style="width:'+pM+'%;background:#E3F2FD;color:#1565C0">Meet '+pM+'%</div>'
      +'<div class="cal-seg" style="width:'+pA+'%;background:#E8F5E9;color:#2E7D32;min-width:'+( pA?'46px':'0')+'">Above '+pA+'%</div>'
      +'</div>'
      +'<div style="font-size:11px;color:var(--ts);margin-top:4px">Meta MELI: ≤5% Below · 75% Meet · ≥20% Above</div>'
      +'</div>';
  });
}

function pgGTalentos(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Mapa de Talentos</div><div class="pd">Sucessores e riscos da regional</div></div>';
  var scores = S.time.map(function(m){ return {m:m,sc:calcScore(m,S.selPeriod)}; }).filter(function(x){ return x.sc; });
  var atip = scores.filter(function(x){ return x.sc.box==='Atípico'; });
  var exc  = scores.filter(function(x){ return x.sc.box==='Excedente'; });
  var ale  = scores.filter(function(x){ return x.sc.box==='Alerta'; });
  var risk = scores.filter(function(x){ var av=x.m.avaliacoes[S.selPeriod]||{}; return av.turnover==='alto'; });
  ct.innerHTML += '<div class="g4" style="margin-bottom:1rem">'
    +'<div class="metric"><div class="mv" style="color:#6A1B9A">'+atip.length+'</div><div class="ml">Atípicos</div></div>'
    +'<div class="metric"><div class="mv" style="color:var(--gr)">'+exc.length+'</div><div class="ml">Excedentes</div></div>'
    +'<div class="metric"><div class="mv" style="color:var(--rd)">'+ale.length+'</div><div class="ml">Em alerta</div></div>'
    +'<div class="metric"><div class="mv" style="color:var(--am)">'+risk.length+'</div><div class="ml">Risco turnover</div></div>'
    +'</div>'
    +'<div class="g2">'
    +'<div class="card"><div class="ct"><i class="fas fa-crown"></i>Sucessores</div>'
    + ([].concat(atip,exc).map(function(x){ return '<div style="display:flex;align-items:center;gap:9px;padding:.5rem 0;border-bottom:1px solid #F5F4F0"><div class="av av-sm">'+ini(x.m.nome)+'</div><div style="flex:1"><div style="font-weight:600;font-size:12px">'+x.m.nome+'</div><div style="font-size:10px;color:var(--ts)">'+x.m.cargo+'</div></div><span class="badge '+bbadge(x.sc.box)+'">'+x.sc.box+'</span><span style="font-weight:700;color:var(--n);font-size:12px">'+x.sc.final+'%</span></div>'; }).join('') || '<div style="color:var(--ts);font-size:13px">Nenhum.</div>')
    +'</div>'
    +'<div class="card"><div class="ct"><i class="fas fa-exclamation-triangle"></i>Atenção</div>'
    + ([].concat(ale,risk).filter(function(x,i,a){ return a.findIndex(function(y){ return y.m.id===x.m.id; })===i; }).map(function(x){ var av=x.m.avaliacoes[S.selPeriod]||{}; return '<div style="display:flex;align-items:center;gap:9px;padding:.5rem 0;border-bottom:1px solid #F5F4F0"><div class="av av-sm">'+ini(x.m.nome)+'</div><div style="flex:1"><div style="font-weight:600;font-size:12px">'+x.m.nome+'</div><div style="font-size:10px;color:var(--ts)">'+x.m.cargo+'</div></div><span class="badge '+bbadge(x.sc.box)+'">'+x.sc.box+'</span>'+(av.turnover==='alto'?'<span>🔴</span>':'')+'</div>'; }).join('') || '<div style="color:var(--ts);font-size:13px">Nenhum.</div>')
    +'</div></div>';
}

function pgGSurvey(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Survey Regional</div><div class="pd">Resultados agregados — confidencial</div></div>';
  ct.innerHTML += '<div class="alert alert-n"><i class="fas fa-shield-alt"></i>Apenas médias. Nenhuma resposta individual é identificável.</div>';
  var me=[4.1,4.3,3.8,4.5,4.0,4.2,3.9,4.4,4.3,4.6], mx=[4.2,4.0,4.3,4.1,4.4];
  ct.innerHTML += '<div class="g2">'
    +'<div class="card"><div class="ct"><i class="fas fa-heart"></i>Engagement</div>'
    +ENG.map(function(q,i){ var s=me[i],c=s>=4?'var(--gr)':s>=3?'var(--am)':'var(--rd)'; return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #F5F4F0"><div style="flex:1;font-size:12px">'+(i+1)+'. '+q+'</div><div style="width:80px"><div class="pb"><div class="pf" style="width:'+Math.round(s/5*100)+'%;background:'+c+'"></div></div></div><div style="font-weight:700;color:'+c+';min-width:28px;text-align:right;font-size:12px">'+s.toFixed(1)+'</div></div>'; }).join('')
    +'</div>'
    +'<div class="card"><div class="ct"><i class="fas fa-bullseye"></i>EXE</div>'
    +EXE.map(function(q,i){ var s=mx[i],c=s>=4?'var(--gr)':s>=3?'var(--am)':'var(--rd)'; return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #F5F4F0"><div style="flex:1;font-size:12px">'+(i+1)+'. '+q+'</div><div style="width:80px"><div class="pb"><div class="pf" style="width:'+Math.round(s/5*100)+'%;background:'+c+'"></div></div></div><div style="font-weight:700;color:'+c+';min-width:28px;text-align:right;font-size:12px">'+s.toFixed(1)+'</div></div>'; }).join('')
    +'</div></div>';
}

// ============================================================
// PÁGINAS — GESTOR
// ============================================================
function pgCadastro(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Cadastro do time</div><div class="pd">Adicione colaboradores e gerencie acessos</div></div>';

  // Form adicionar analista
  ct.innerHTML += '<div class="card"><div class="ct"><i class="fas fa-user-plus"></i>Adicionar analista</div>'
    +'<div class="fr">'
    +'<div><label class="lbl">Nome completo</label><input id="nc-nome" placeholder="Nome do analista"></div>'
    +'<div><label class="lbl">Matrícula</label><input id="nc-mat" placeholder="Ex: ML050" style="text-transform:uppercase"></div>'
    +'</div>'
    +'<div class="fr">'
    +'<div><label class="lbl">Cargo</label><select id="nc-cargo"><option value="Analista Jr">Analista Jr</option><option value="Analista S.Sr">Analista S.Sr</option><option value="Analista Sr">Analista Sr</option></select></div>'
    +'<div><label class="lbl">Conta</label><input id="nc-conta" placeholder="Ex: BRSP06"></div>'
    +'</div>'
    +'<div class="fr">'
    +'<div><label class="lbl">Data admissão</label><input type="date" id="nc-adm"></div>'
    +'<div><label class="lbl">Cadência</label><select id="nc-cad"><option>Mensal</option><option>Quinzenal</option><option>Quarter</option></select></div>'
    +'</div>'
    +'<div id="nc-err" class="alert alert-r" style="display:none"><i class="fas fa-exclamation-circle"></i><span id="nc-msg"></span></div>'
    +'<button class="btn btn-y" id="btn-add-ana"><i class="fas fa-plus"></i> Adicionar</button>'
    +'</div>';

  // Time
  ct.innerHTML += '<div class="card"><div class="ct"><i class="fas fa-users"></i>Time <span class="badge b-y">'+S.time.length+'</span></div>'
    +'<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Nome</th><th>Cargo</th><th>Conta</th><th>Score</th><th>4Box</th><th>Acesso</th><th>Ações</th></tr></thead><tbody>'
    +S.time.map(function(m) {
      var sc = calcScore(m, S.selPeriod);
      return '<tr>'
        +'<td><div style="display:flex;align-items:center;gap:7px"><div class="av av-sm">'+ini(m.nome)+'</div><strong>'+m.nome+'</strong></div></td>'
        +'<td><span class="badge '+(m.cargo==='Analista Jr'?'b-jr':m.cargo==='Analista Sr'?'b-n':'b-ssr')+'">'+m.cargo+'</span></td>'
        +'<td>'+m.conta+'</td>'
        +'<td style="font-weight:700;color:'+(sc?sc.final>=80?'var(--gr)':sc.final>=60?'var(--n)':'var(--rd)':'var(--ts)')+'">'+( sc?sc.final+'%':'—')+'</td>'
        +'<td>'+( sc?'<span class="badge '+bbadge(sc.box)+'">'+sc.box+'</span>':'—')+'</td>'
        +'<td><span class="badge b-g">Ativo</span></td>'
        +'<td>'
        +'<button class="btn-sm" title="Reset" onclick="resetAnalista(\''+m.mat+'\',\''+m.nome+'\')" ><i class="fas fa-key"></i></button> '
        +'<button class="btn-sm" style="background:#FFEBEE;border-color:#EF9A9A;color:#C62828" title="Bloquear" onclick="bloquearAnalista(\''+m.mat+'\',\''+m.nome+'\')" ><i class="fas fa-lock"></i></button> '
        +'<button class="btn-sm" style="background:#FFEBEE;border-color:#EF9A9A;color:#C62828" title="Excluir" onclick="excluirAnalista('+m.id+',\''+m.mat+'\',\''+m.nome+'\')"><i class="fas fa-trash-alt"></i></button>'
        +'</td>'
        +'</tr>';
    }).join('')
    +'</tbody></table></div></div>';

  document.getElementById('btn-add-ana').addEventListener('click', async function() {
    var nome   = document.getElementById('nc-nome').value.trim();
    var mat    = document.getElementById('nc-mat').value.trim().toUpperCase();
    var cargo  = document.getElementById('nc-cargo').value;
    var conta  = document.getElementById('nc-conta').value.trim();
    var adm    = document.getElementById('nc-adm').value;
    var cad    = document.getElementById('nc-cad').value;
    hideErr('nc-err');
    if (!nome||!mat||!cargo||!conta||!adm) { showErr('nc-err','nc-msg','Preencha todos os campos.'); return; }
    if (S.time.find(function(x){ return x.mat===mat; })) { showErr('nc-err','nc-msg','Matrícula já cadastrada.'); return; }
    this.disabled = true;
    showLoad('Cadastrando...');
    try {
      var mb = await dbPost('time_membros', { matricula:mat,nome:nome,cargo:cargo,conta:conta,adm:adm,cadencia:cad,gestor_id:S.user });
      if (!mb || !mb.length) {
        hideLoad();
        this.disabled = false;
        showErr('nc-err','nc-msg','Erro ao salvar. Verifique sua conexão e tente novamente.');
        return;
      }
      await dbPost('usuarios', { matricula:mat,nome:nome,role:'analista',status:'ativo',tentativas:0,gestor_id:S.user });
      S.time.push({ id:mb[0].id,nome:nome,mat:mat,cargo:cargo,conta:conta,adm:adm,cadencia:cad,gestorId:S.user,avaliacoes:{} });
      hideLoad();
    } catch(e) {
      hideLoad();
      this.disabled = false;
      showErr('nc-err','nc-msg','Erro: ' + (e.message || 'Tente novamente.'));
      return;
    }
    nav('cadastro');
  });
}

async function resetAnalista(mat, nome) {
  if (!confirm('Resetar senha de '+nome+'?')) return;
  showLoad('Resetando...');
  await dbPatch('usuarios','matricula=eq.'+mat,{senha:null,status:'ativo',tentativas:0});
  hideLoad();
  alert('Senha de '+nome+' resetada!');
}
async function bloquearAnalista(mat, nome) {
  if (!confirm('Bloquear '+nome+'?')) return;
  await dbPatch('usuarios','matricula=eq.'+mat,{status:'bloqueado'});
  nav('cadastro');
}
async function excluirAnalista(id, mat, nome) {
  if (!confirm('Excluir '+nome+' ('+mat+') permanentemente?\nTodas as avaliações serão removidas. Esta ação não pode ser desfeita.')) return;
  showLoad('Excluindo...');
  await dbDel('usuarios', 'matricula=eq.'+mat);
  await dbDel('time_membros', 'id=eq.'+id);
  hideLoad();
  S.time = S.time.filter(function(m){ return m.id !== parseInt(id); });
  nav('cadastro');
}

function pgAvaliacao(ct) {
  if (!S.time.length) {
    ct.innerHTML = '<div class="ph"><div class="pt">Avaliação</div></div><div class="alert alert-y"><i class="fas fa-info-circle"></i>Nenhum colaborador cadastrado ainda.</div>';
    return;
  }
  if (!S.selMember) S.selMember = S.time[0].id;
  var m  = S.time.find(function(x){ return x.id===S.selMember; }) || S.time[0];
  var av = ensureAv(m.id);
  var sc = calcScore(m, S.selPeriod);
  var sk = m.cargo === 'Analista Jr' ? SK_JR : SK_SSR;
  // Períodos: 3 meses passados + atual + 2 futuros, mais qualquer período já avaliado
  var periods=(function(){
    var now=new Date(), list=[], seen={};
    for(var i=-3;i<=2;i++){
      var d=new Date(now.getFullYear(),now.getMonth()+i,1);
      var p=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-Mensal';
      if(!seen[p]){ list.push(p); seen[p]=true; }
    }
    // Inclui períodos que já têm avaliação no time (ex: seed com meses anteriores)
    S.time.forEach(function(mb){
      Object.keys(mb.avaliacoes||{}).forEach(function(p){
        if(!seen[p]){ list.push(p); seen[p]=true; }
      });
    });
    list.sort();
    return list;
  })();
  var presOpts = {
    presencialidade: ['< 79%','80-89%','90-99%','100%'],
    phishing:        ['Caiu 2+','Caiu 1x','Não caiu','Não caiu e reportou'],
    conectividade:   ['Empty','Low','Mid','High']
  };

  var scoreInner = sc
    ? '<div style="text-align:center;padding-right:1.5rem"><div style="font-size:34px;font-weight:700;color:'+(sc.final>=80?'var(--gr)':sc.final>=60?'var(--n)':'var(--rd)')+'">'+sc.final+'%</div><div style="font-size:11px;color:var(--ts)">Score final</div></div>'
      + '<div style="flex:1;min-width:160px"><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:.4rem"><span class="badge '+bbadge(sc.box)+'">'+sc.box+'</span><span class="badge b-gr">'+sc.qual+'</span>'+(av.lancada?'<span class="badge b-g">✓ Enviado</span>':'<span class="badge b-a">Rascunho</span>')+'</div>'
      + '<div style="font-size:11px;color:var(--ts)">Skills: <b>'+sc.perf+'%</b> · KPIs: <b>'+sc.kpiScore+'%</b> · Pres: <b>'+sc.presScore+'%</b> · Pen: <b style="color:var(--rd)">-'+sc.pen+'pts</b>'+(sc.dnaScore!==null?' · DNA: <b>'+sc.dnaScore+'%</b>':'')+'</div>'
      + '</div>'
    : '<div style="font-size:13px;color:var(--ts);flex:1">Preencha os campos e clique em <b>Calcular Score</b>.</div>';

  var scoreHtml = '<div id="score-live" style="display:flex;align-items:center;gap:1.5rem;padding:1rem;background:var(--gl);border-radius:var(--rm);border:1px solid var(--bd);flex-wrap:wrap;margin-bottom:.75rem">'
    + '<div id="score-content" style="display:flex;align-items:center;gap:1.5rem;flex:1;flex-wrap:wrap">' + scoreInner + '</div>'
    + '<button class="btn btn-n" id="btn-calcular" style="margin-left:auto;flex-shrink:0"><i class="fas fa-calculator"></i> Calcular Score</button>'
    + '</div>';

  ct.innerHTML = '<div class="ph"><div class="pt">Avaliação</div><div class="pd">Preencha todos os campos e clique em Calcular Score</div></div>'
    +'<div class="card">'
    +'<div class="fr">'
    +'<div><label class="lbl">Colaborador</label><select onchange="S.selMember=parseInt(this.value);nav(\'avaliacao\')">'
    +S.time.map(function(x){ return '<option value="'+x.id+'"'+(x.id===m.id?' selected':'')+'>'+x.nome+' — '+x.cargo+'</option>'; }).join('')
    +'</select></div>'
    +'<div><label class="lbl">Período</label><select onchange="S.selPeriod=this.value;nav(\'avaliacao\')">'
    +periods.map(function(p){ return '<option value="'+p+'"'+(p===S.selPeriod?' selected':'')+'>'+p+'</option>'; }).join('')
    +'</select></div>'
    +'</div>'
    +scoreHtml
    +(av.lancada?'<div class="alert alert-g"><i class="fas fa-check-circle"></i>Enviado oficialmente. Pode editar e reenviar.</div>':'<div class="alert alert-y"><i class="fas fa-info-circle"></i>Rascunho — clique em Envio oficial para computar o score.</div>')
    +'</div>'
    +'<div class="g2">'
    // Skills
    +'<div class="card"><div class="ct"><i class="fas fa-tools"></i>Skills</div>'
    +'<div style="font-size:10px;color:var(--ts);margin-bottom:.75rem;display:flex;gap:8px;flex-wrap:wrap">'
    +[['d1','Básico'],['d2','Intermediário'],['d3','Avançado'],['d4','Referência']].map(function(x){ return '<span style="display:inline-flex;align-items:center;gap:3px"><span class="dot '+x[0]+'" style="pointer-events:none"></span>'+x[1]+'</span>'; }).join('')
    +'</div>'
    +sk.map(function(s) {
      var cur = av.skills[s.id] !== undefined ? av.skills[s.id] : 0;
      var pcls = s.p===5?'p5':s.p===4?'p4':'p3';
      return '<div class="sr"><div class="sn">'+s.n+'</div><div class="st">'+s.t+'</div><span class="sp '+pcls+'">P'+s.p+'</span>'+dotsWrap(m.id,s.id,cur,true)+'</div>';
    }).join('')
    +'</div>'
    // Right column
    +'<div>'
    // DNA
    +'<div class="card" style="margin-bottom:1rem"><div class="ct"><i class="fas fa-dna"></i>DNA MELI</div>'
    +DNA.map(function(d,i) {
      var v = av.dna[i] !== undefined ? av.dna[i] : 1;
      return '<div class="sr"><div class="sn" style="font-size:12px">'+d+'</div>'
        +'<select style="width:auto;font-size:11px;padding:4px 8px" onchange="setDna('+m.id+','+i+',parseInt(this.value))">'
        +'<option value="0"'+(v===0?' selected':'')+'>Necessita alinhamento</option>'
        +'<option value="1"'+(v===1?' selected':'')+'>Alinhado</option>'
        +'<option value="2"'+(v===2?' selected':'')+'>Modelo a seguir</option>'
        +'</select></div>';
    }).join('')+'</div>'
    // Presencialidade
    +'<div class="pres-blk"><div class="pres-tt"><i class="fas fa-user-check"></i>Presencialidade · Phishing · Conectividade</div>'
    +'<div class="g3">'
    +Object.entries(presOpts).map(function(entry) {
      var campo=entry[0], opts=entry[1];
      var cur = (av.pres && av.pres[campo]) || 3;
      return '<div><label class="lbl">'+campo+'</label>'
        +'<select onchange="setPres('+m.id+',\''+campo+'\',parseInt(this.value))">'
        +opts.map(function(o,i){ return '<option value="'+(i+1)+'"'+(cur===i+1?' selected':'')+'>'+(i+1)+' — '+o+'</option>'; }).join('')
        +'</select></div>';
    }).join('')
    +'</div></div>'
    // KPIs
    +'<div class="card"><div class="ct"><i class="fas fa-chart-line"></i>KPIs Goals 2026</div>'
    +'<div style="font-size:11px;color:var(--ts);margin-bottom:.5rem"><span class="scope sc-r">REG</span> regional &nbsp; <span class="scope sc-m">MLB</span> Brasil</div>'
    +KPIS.map(function(k) {
      var v = av.kpis[k.id] !== undefined ? av.kpis[k.id] : 1;
      var c = v===2?'var(--gr)':v===1?'var(--am)':'var(--rd)';
      return '<div class="kpi-row"><span class="scope '+(k.s==='R'?'sc-r':'sc-m')+'">'+(k.s==='R'?'REG':'MLB')+'</span>'
        +'<div class="kpi-n">'+k.n+'</div>'
        +'<select style="width:auto;font-size:11px;padding:3px 7px" onchange="setKpi('+m.id+',\''+k.id+'\',parseInt(this.value))">'
        +'<option value="0"'+(v===0?' selected':'')+'>Abaixo</option>'
        +'<option value="1"'+(v===1?' selected':'')+'>Na meta</option>'
        +'<option value="2"'+(v===2?' selected':'')+'>Acima</option>'
        +'</select><span style="width:8px;height:8px;border-radius:50%;background:'+c+';display:inline-block"></span></div>';
    }).join('')
    +'</div>'
    +'</div></div>'
    // Qualitativo
    +'<div class="card"><div class="ct"><i class="fas fa-pen"></i>Qualitativo</div>'
    +'<div class="fr"><div><label class="lbl">Entregas</label><textarea onblur="setAv('+m.id+',\'entregas\',this.value)">'+av.entregas+'</textarea></div>'
    +'<div><label class="lbl">Pontos fortes</label><textarea onblur="setAv('+m.id+',\'fortes\',this.value)">'+av.fortes+'</textarea></div></div>'
    +'<div class="fr"><div><label class="lbl">A desenvolver</label><textarea onblur="setAv('+m.id+',\'dev\',this.value)">'+av.dev+'</textarea></div>'
    +'<div><label class="lbl">Próximos passos</label><textarea onblur="setAv('+m.id+',\'passos\',this.value)">'+av.passos+'</textarea></div></div>'
    +'<div class="fr">'
    +'<div><label class="lbl">Carreira</label><select onchange="setAv('+m.id+',\'carreira\',this.value)">'
    +['1-2 anos: S.Sr','2-3 anos: Especialista','3-4 anos: Coordenador','Em avaliação'].map(function(o){ return '<option'+(av.carreira===o?' selected':'')+'>'+o+'</option>'; }).join('')
    +'</select></div>'
    +'<div><label class="lbl">Risco turnover</label><div style="display:flex;gap:5px">'
    +[['baixo','🟢','to-low'],['medio','🟡','to-med'],['alto','🔴','to-high']].map(function(x){ return '<div class="to-opt'+(av.turnover===x[0]?' '+x[2]:'')+'" onclick="setTurnover('+m.id+',\''+x[0]+'\')">'+x[1]+' '+x[0]+'</div>'; }).join('')
    +'</div></div></div>'
    +'<div style="display:flex;gap:8px">'
    +'<button class="btn btn-y" onclick="enviarOficial('+m.id+')"><i class="fas fa-paper-plane"></i> '+(av.lancada?'Reenviar':'Envio oficial')+'</button>'
    +'<button class="btn btn-o" id="btn-rascunho"><i class="fas fa-save"></i> Salvar rascunho</button>'
    +'</div></div>';

  document.getElementById('btn-calcular').addEventListener('click', function() {
    var av = m.avaliacoes[S.selPeriod];
    updateScoreLive(m.id);
    this.innerHTML = '<i class="fas fa-check"></i> Calculado!';
    var btn = this;
    setTimeout(function(){ btn.innerHTML = '<i class="fas fa-calculator"></i> Calcular Score'; }, 2000);
  });

  document.getElementById('btn-rascunho').addEventListener('click', async function() {
    var orig = this.innerHTML; this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    await saveAv(m.id, S.selPeriod);
    this.innerHTML = '<i class="fas fa-check"></i> Salvo!';
    setTimeout(function(btn){ btn.innerHTML=orig; btn.disabled=false; }.bind(null,this), 2000);
  });
}

function enviarOficial(mid) {
  modal('Envio oficial da avaliação',
    '✅ Scores computados e salvos<br>✅ Auto-avaliação do analista liberada<br>✅ Pode editar e reenviar se necessário',
    [
      { txt:'Cancelar', cls:'btn btn-o', fn: function(){} },
      { txt:'Confirmar', cls:'btn btn-y', fn: async function() {
        var av = ensureAv(mid);
        if (av) av.lancada = true;
        await saveAv(mid, S.selPeriod);
        nav('avaliacao');
      }}
    ]
  );
}

function renderBoxGrid(ct, boxes, clickable) {
  var rows = [
    ['Alto desempenho', ['Cedo p/ avaliar','Excedente','Atípico']],
    ['Médio desempenho', ['Alerta','Estável','Promissor']]
  ];
  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:28px 1fr 1fr 1fr;grid-template-rows:24px 1fr 1fr;gap:4px';
  var empty = document.createElement('div'); grid.appendChild(empty);
  ['Baixo potencial','Médio potencial','Alto potencial'].forEach(function(l,i) {
    var d = document.createElement('div');
    d.style.cssText = 'background:'+(i===2?'var(--y)':'var(--gl)')+';border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:'+(i===2?'var(--n)':'var(--ts)');
    d.textContent = l; grid.appendChild(d);
  });
  rows.forEach(function(row) {
    var lbl = document.createElement('div');
    lbl.style.cssText = 'background:var(--gl);border-radius:6px;font-size:8px;font-weight:700;color:var(--ts);writing-mode:vertical-rl;transform:rotate(180deg);display:flex;align-items:center;justify-content:center;letter-spacing:.04em';
    lbl.textContent = row[0]; grid.appendChild(lbl);
    row[1].forEach(function(b) {
      var cell = document.createElement('div');
      cell.className = 'box-cell';
      cell.style.background = bbg(b);
      cell.innerHTML = '<div class="bc-t" style="color:'+bcolor(b)+'">'+b+' ('+(boxes[b]||[]).length+')</div>';
      (boxes[b]||[]).forEach(function(item) {
        var chip = document.createElement('span');
        chip.className = 'chip';
        chip.innerHTML = '<div class="av av-sm">'+ini(item.m.nome)+'</div>'+item.m.nome.split(' ')[0];
        if (clickable) {
          chip.addEventListener('click', function(){ S.selMember=item.m.id; S.selBox=b; nav('ficha'); });
        }
        cell.appendChild(chip);
      });
      if (!(boxes[b]||[]).length) cell.innerHTML += '<div style="font-size:10px;color:var(--ts)">Nenhum</div>';
      grid.appendChild(cell);
    });
  });
  ct.appendChild(grid);
}

function pgFourbox(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">4Box Visual</div><div class="pd">Performance × Potencial</div></div>';
  var boxes = { 'Alerta':[],'Cedo p/ avaliar':[],'Estável':[],'Excedente':[],'Promissor':[],'Atípico':[] };
  S.time.forEach(function(m){ var sc=calcScore(m,S.selPeriod); if(sc) boxes[sc.box].push({m:m,sc:sc}); });
  var total=S.time.length||1;
  var below=S.time.filter(function(m){ var sc=calcScore(m,S.selPeriod); return sc&&sc.final<55; }).length;
  var above=S.time.filter(function(m){ var sc=calcScore(m,S.selPeriod); return sc&&sc.final>=80; }).length;
  ct.innerHTML += '<div class="g4" style="margin-bottom:1rem">'
    +'<div class="metric"><div class="mv">'+total+'</div><div class="ml">Total</div></div>'
    +'<div class="metric"><div class="mv" style="color:var(--rd)">'+below+' ('+Math.round(below/total*100)+'%)</div><div class="ml">Below</div></div>'
    +'<div class="metric"><div class="mv">'+(total-below-above)+' ('+Math.round((total-below-above)/total*100)+'%)</div><div class="ml">Meet</div></div>'
    +'<div class="metric"><div class="mv" style="color:var(--gr)">'+above+' ('+Math.round(above/total*100)+'%)</div><div class="ml">Above</div></div>'
    +'</div>';
  renderBoxGrid(ct, boxes, true);
}

function pgFicha(ct) {
  var boxes = { 'Alerta':[],'Cedo p/ avaliar':[],'Estável':[],'Excedente':[],'Promissor':[],'Atípico':[] };
  S.time.forEach(function(m){ var sc=calcScore(m,S.selPeriod); if(sc) boxes[sc.box].push(m); });
  ct.innerHTML = '<div class="ph"><div class="pt">Ficha Individual</div></div>';
  // Tabs de quadrante
  var tabsDiv = document.createElement('div');
  tabsDiv.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;margin-bottom:1rem';
  Object.keys(boxes).forEach(function(b) {
    var btn = document.createElement('button');
    btn.className = 'btn-sm' + (b===S.selBox?' on':'');
    btn.textContent = b + ' (' + boxes[b].length + ')';
    btn.addEventListener('click', function(){ S.selBox=b; nav('ficha'); });
    tabsDiv.appendChild(btn);
  });
  ct.appendChild(tabsDiv);
  // Cards
  var cardsDiv = document.createElement('div');
  cardsDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:1rem';
  (boxes[S.selBox]||[]).forEach(function(m) {
    var d = document.createElement('div');
    d.className = 'pcard' + (m.id===S.selMember?' on':'');
    d.innerHTML = '<div class="av av-md">'+ini(m.nome)+'</div><div><div style="font-size:13px;font-weight:600">'+m.nome+'</div><div style="font-size:11px;color:var(--ts)">'+m.cargo+'</div></div>';
    d.addEventListener('click', function(){ S.selMember=m.id; nav('ficha'); });
    cardsDiv.appendChild(d);
  });
  ct.appendChild(cardsDiv);
  var sel = S.time.find(function(x){ return x.id===S.selMember; });
  if (!sel || !(boxes[S.selBox]||[]).find(function(x){ return x.id===S.selMember; })) return;
  var sc = calcScore(sel, S.selPeriod);
  if (!sc) return;
  var av = sel.avaliacoes[S.selPeriod] || {};
  ct.innerHTML += '<div style="display:flex;align-items:center;gap:14px;padding:1.25rem;background:'+bbg(sc.box)+';border-radius:var(--rl);margin-bottom:1rem;border:1px solid rgba(0,0,0,.06)">'
    +'<div class="av av-md" style="width:48px;height:48px;font-size:16px">'+ini(sel.nome)+'</div>'
    +'<div style="flex:1"><div style="font-size:18px;font-weight:700">'+sel.nome+'</div>'
    +'<div style="font-size:12px;color:var(--ts);margin-top:2px">'+sel.cargo+' · '+sel.conta+'</div>'
    +'<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap"><span class="badge '+bbadge(sc.box)+'">'+sc.box+'</span><span class="badge b-gr">'+sc.qual+'</span></div></div>'
    +'<div style="text-align:center"><div style="font-size:28px;font-weight:700;color:'+(sc.final>=80?'var(--gr)':sc.final>=60?'var(--n)':'var(--rd)')+'">'+sc.final+'%</div><div style="font-size:11px;color:var(--ts)">Pot: '+sc.pot+'%</div></div>'
    +'</div>'
    +'<div class="g2">'
    +'<div class="card"><div class="ct"><i class="fas fa-dna"></i>DNA MELI</div>'
    +DNA.map(function(d,i){ var v=av.dna&&av.dna[i]!==undefined?av.dna[i]:1; var l=['Necessita alinhamento','Alinhado','Modelo a seguir'][v]; var cls=v===0?'b-r':v===2?'b-g':'b-gr'; return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #F5F4F0"><div style="flex:1;font-size:12px">'+d+'</div><span class="badge '+cls+'">'+l+'</span></div>'; }).join('')
    +'</div>'
    +'<div class="card"><div class="ct"><i class="fas fa-star"></i>Entregas & Desenvolvimento</div>'
    +'<div style="font-size:11px;font-weight:700;color:var(--ts);margin-bottom:3px;text-transform:uppercase">Entregas</div><div style="font-size:12px;margin-bottom:.75rem">'+(av.entregas||'—')+'</div>'
    +'<div style="font-size:11px;font-weight:700;color:var(--ts);margin-bottom:3px;text-transform:uppercase">Pontos fortes</div><div style="margin-bottom:.75rem">'+((av.fortes||'').split(';').map(function(t){ return t.trim()?'<span class="tag">'+t.trim()+'</span>':''; }).join('')||'—')+'</div>'
    +'<div style="font-size:11px;font-weight:700;color:var(--ts);margin-bottom:3px;text-transform:uppercase">A desenvolver</div><div>'+((av.dev||'').split(';').map(function(t){ return t.trim()?'<span class="tag">'+t.trim()+'</span>':''; }).join('')||'—')+'</div>'
    +'</div></div>';
}

function pgComparativo(ct) {
  var m = S.time.find(function(x){ return x.id===S.selMember; }) || S.time[0];
  if (!m) { ct.innerHTML='<div class="ph"><div class="pt">Comparativo & PDI</div></div><div class="alert alert-y"><i class="fas fa-info-circle"></i>Nenhum colaborador no time.</div>'; return; }
  var av = m.avaliacoes[S.selPeriod] || {};
  var sk = m.cargo === 'Analista Jr' ? SK_JR : SK_SSR;
  var selHtml = '<div style="margin-bottom:1rem"><label class="lbl">Colaborador</label><select style="width:auto" onchange="S.selMember=parseInt(this.value);nav(\'comparativo\')">'
    +S.time.map(function(x){ return '<option value="'+x.id+'"'+(x.id===m.id?' selected':'')+'>'+x.nome+'</option>'; }).join('')+'</select></div>';
  ct.innerHTML = '<div class="ph"><div class="pt">Comparativo & PDI</div><div class="pd">Gestor vs auto-avaliação · Ferramentas de qualidade</div></div>' + selHtml;
  if (!av.lancada) {
    ct.innerHTML += '<div class="alert alert-y"><i class="fas fa-lock"></i>Envie a avaliação oficial de <b>'+m.nome+'</b> para liberar o comparativo.</div>';
    return;
  }
  ct.innerHTML += '<div class="card"><div class="ct"><i class="fas fa-balance-scale"></i>Skills — Gestor vs Auto</div>'
    +'<div style="display:grid;grid-template-columns:1fr 120px 120px 60px;gap:4px;margin-bottom:.5rem">'
    +'<div class="lbl">Skill</div><div class="lbl" style="text-align:center;color:var(--n)">Gestor</div><div class="lbl" style="text-align:center">Analista</div><div class="lbl" style="text-align:center">Gap</div></div>'
    +sk.map(function(s) {
      var vg = av.skills&&av.skills[s.id]!==undefined?av.skills[s.id]:1;
      var va = S.autoav['sk_'+s.id]!==undefined?S.autoav['sk_'+s.id]:1;
      var gap=vg-va; var gc=gap===0?'var(--gr)':Math.abs(gap)===1?'var(--am)':'var(--rd)';
      return '<div style="display:grid;grid-template-columns:1fr 120px 120px 60px;gap:4px;padding:5px 0;border-bottom:1px solid #F5F4F0;align-items:center">'
        +'<div style="font-size:12px">'+s.n+'</div>'
        +'<div style="text-align:center;font-size:11px;font-weight:700;color:var(--n)">'+lvlLbl(vg)+'</div>'
        +'<div style="text-align:center;font-size:11px;color:var(--ts)">'+lvlLbl(va)+'</div>'
        +'<div style="text-align:center;font-weight:700;color:'+gc+'">'+(gap===0?'=':(gap>0?'+':'')+gap)+'</div></div>';
    }).join('')+'</div>'
    +'<div class="card"><div class="ct"><i class="fas fa-fish"></i>Diagrama de Ishikawa</div>'
    +'<div style="margin-bottom:.75rem"><label class="lbl">Problema / Gap</label><input placeholder="Descreva o problema" value="'+(S.ishi.problema||'')+'" onblur="S.ishi.problema=this.value"></div>'
    +'<div class="g2">'+[['metodo','Método'],['maquina','Máquina/Sistema'],['material','Material/Dado'],['maodeobra','Mão de obra'],['meioambiente','Meio ambiente'],['medida','Medida/KPI']].map(function(x){ return '<div><label class="lbl">'+x[1]+'</label><textarea onblur="S.ishi.'+x[0]+'=this.value" style="min-height:55px">'+(S.ishi[x[0]]||'')+'</textarea></div>'; }).join('')+'</div></div>'
    +'<div class="card"><div class="ct"><i class="fas fa-question-circle"></i>5 Porquês</div>'
    +[0,1,2,3,4].map(function(i){ return '<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:.5rem"><div style="width:28px;height:28px;border-radius:50%;background:var(--y);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--n);flex-shrink:0">'+(i+1)+'</div><div style="flex:1"><input placeholder="Por quê?" value="'+(S.porques[i]||'')+'" onblur="S.porques['+i+']=this.value"></div></div>'; }).join('')
    +'</div>'
    +'<div class="card"><div class="ct"><i class="fas fa-sync-alt"></i>PDCA</div>'
    +'<div class="pdca-grid">'
    +[['plan','Plan','#E3F2FD','#90CAF9','#1565C0'],['do_','Do','#E8F5E9','#A5D6A7','#2E7D32'],['check','Check','#FFF8E1','#FFE082','#E65100'],['act','Act','#F3E5F5','#CE93D8','#6A1B9A']].map(function(x){ return '<div class="pdca-card" style="background:'+x[2]+';border-color:'+x[3]+'"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:'+x[4]+';margin-bottom:.4rem">'+x[1]+'</div><textarea onblur="S.pdca.'+x[0]+'=this.value" style="background:transparent;border-color:'+x[3]+';min-height:80px">'+(S.pdca[x[0]]||'')+'</textarea></div>'; }).join('')
    +'</div>'
    +'<div style="margin-top:.75rem"><button class="btn btn-y" id="btn-pdca-salvar"><i class="fas fa-save"></i> Salvar PDI</button></div></div>';

  document.getElementById('btn-pdca-salvar').addEventListener('click', function() {
    this.innerHTML = '<i class="fas fa-check"></i> Salvo!';
    var btn = this;
    setTimeout(function(){ btn.innerHTML='<i class="fas fa-save"></i> Salvar PDI'; }, 2000);
  });
}

function pgCalibracao(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Calibração</div><div class="pd">Distribuição real vs curva MELI</div></div>';
  var scores = S.time.map(function(m){ return {m:m,sc:calcScore(m,S.selPeriod)}; }).filter(function(x){ return x.sc; });
  var total=scores.length||1;
  var bl=scores.filter(function(x){ return x.sc.final<55; }).length;
  var me=scores.filter(function(x){ return x.sc.final>=55&&x.sc.final<80; }).length;
  var ab=scores.filter(function(x){ return x.sc.final>=80; }).length;
  var pB=Math.round(bl/total*100),pM=Math.round(me/total*100),pA=Math.round(ab/total*100);
  var avg=Math.round(scores.reduce(function(a,x){ return a+x.sc.final; },0)/total);
  ct.innerHTML += '<div class="g4" style="margin-bottom:1rem">'
    +'<div class="metric"><div class="mv">'+total+'</div><div class="ml">Avaliados</div></div>'
    +'<div class="metric"><div class="mv" style="color:var(--n)">'+avg+'%</div><div class="ml">Score médio</div></div>'
    +'<div class="metric"><div class="mv" style="color:'+(pB<=5?'var(--gr)':'var(--rd)')+'">'+pB+'%</div><div class="ml">Below (meta ≤5%)</div></div>'
    +'<div class="metric"><div class="mv" style="color:'+(pA>=20?'var(--gr)':'var(--am)')+'">'+pA+'%</div><div class="ml">Above (meta ≥20%)</div></div>'
    +'</div>'
    +'<div class="card"><div class="ct"><i class="fas fa-chart-bar"></i>Distribuição real vs curva MELI</div>'
    +'<div style="font-size:11px;color:var(--ts);margin-bottom:.3rem">Seu time</div>'
    +'<div class="cal-bar">'
    +'<div class="cal-seg" style="width:'+pB+'%;background:#FFEBEE;color:#C62828;min-width:'+(pB?'44px':'0')+'">Below '+pB+'%</div>'
    +'<div class="cal-seg" style="width:'+pM+'%;background:#E3F2FD;color:#1565C0">Meet '+pM+'%</div>'
    +'<div class="cal-seg" style="width:'+pA+'%;background:#E8F5E9;color:#2E7D32;min-width:'+(pA?'46px':'0')+'">Above '+pA+'%</div>'
    +'</div>'
    +'<div style="font-size:11px;color:var(--ts);margin:.75rem 0 .3rem">Curva MELI</div>'
    +'<div class="cal-bar">'
    +'<div class="cal-seg" style="width:5%;background:#FFEBEE;color:#C62828;min-width:44px">5%</div>'
    +'<div class="cal-seg" style="width:75%;background:#E3F2FD;color:#1565C0">Meet 75%</div>'
    +'<div class="cal-seg" style="width:20%;background:#E8F5E9;color:#2E7D32">Above 20%</div>'
    +'</div>'
    +(pB>5?'<div class="alert alert-r" style="margin-top:.75rem"><i class="fas fa-exclamation-triangle"></i>Below acima do limite ('+pB+'% vs meta 5%).</div>':'')
    +(pA<20?'<div class="alert alert-y" style="margin-top:.5rem"><i class="fas fa-info-circle"></i>Above abaixo da meta ('+pA+'% vs meta 20%).</div>':'')
    +'</div>'
    +'<div class="card"><div class="ct"><i class="fas fa-shield-alt"></i>Pontos de defesa</div>'
    +'<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Nome</th><th>Score</th><th>Pot.</th><th>P5</th><th>KPIs</th><th>4Box</th></tr></thead><tbody>'
    +scores.sort(function(a,b){ return b.sc.final-a.sc.final; }).map(function(item) {
      var av=item.m.avaliacoes[S.selPeriod]||{};
      var sk2=item.m.cargo==='Analista Jr'?SK_JR:SK_SSR;
      var cg=sk2.filter(function(s){ return s.p===5&&(av.skills&&av.skills[s.id]||0)<s.nr; }).length;
      var ko=KPIS.filter(function(k){ return av.kpis&&av.kpis[k.id]>=1; }).length;
      return '<tr><td><div style="display:flex;align-items:center;gap:7px"><div class="av av-sm">'+ini(item.m.nome)+'</div><strong>'+item.m.nome+'</strong></div></td>'
        +'<td style="font-weight:700;color:'+(item.sc.final>=80?'var(--gr)':item.sc.final>=60?'var(--n)':'var(--rd)')+'">'+item.sc.final+'%</td>'
        +'<td>'+item.sc.pot+'%</td>'
        +'<td><span class="badge '+(cg===0?'b-g':'b-r')+'">'+(cg===0?'OK':cg+' gaps')+'</span></td>'
        +'<td>'+ko+'/'+KPIS.length+'</td>'
        +'<td><span class="badge '+bbadge(item.sc.box)+'">'+item.sc.box+'</span></td></tr>';
    }).join('')+'</tbody></table></div></div>';
}

function pgSurveyR(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Resultado Survey</div><div class="pd">Respostas agregadas — confidencial</div></div>';
  ct.innerHTML += '<div class="alert alert-n"><i class="fas fa-shield-alt"></i>Apenas médias. Nenhuma resposta individual é identificável.</div>';
  var me=[4.1,4.3,3.8,4.5,4.0,4.2,3.9,4.4,4.3,4.6], mx=[4.2,4.0,4.3,4.1,4.4];
  ct.innerHTML += '<div class="g2">'
    +'<div class="card"><div class="ct"><i class="fas fa-heart"></i>Engagement</div>'
    +ENG.map(function(q,i){ var s=me[i],c=s>=4?'var(--gr)':s>=3?'var(--am)':'var(--rd)'; return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #F5F4F0"><div style="flex:1;font-size:12px">'+(i+1)+'. '+q+'</div><div style="width:80px"><div class="pb"><div class="pf" style="width:'+Math.round(s/5*100)+'%;background:'+c+'"></div></div></div><div style="font-weight:700;color:'+c+';min-width:28px;text-align:right;font-size:12px">'+s.toFixed(1)+'</div></div>'; }).join('')
    +'</div>'
    +'<div class="card"><div class="ct"><i class="fas fa-bullseye"></i>EXE</div>'
    +EXE.map(function(q,i){ var s=mx[i],c=s>=4?'var(--gr)':s>=3?'var(--am)':'var(--rd)'; return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #F5F4F0"><div style="flex:1;font-size:12px">'+(i+1)+'. '+q+'</div><div style="width:80px"><div class="pb"><div class="pf" style="width:'+Math.round(s/5*100)+'%;background:'+c+'"></div></div></div><div style="font-weight:700;color:'+c+';min-width:28px;text-align:right;font-size:12px">'+s.toFixed(1)+'</div></div>'; }).join('')
    +'</div></div>';
}

function pgRecados(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Recados do Time</div><div class="pd">Mensagens dos colaboradores</div></div>';
  var pend = S.recados.filter(function(r){ return !r.resposta; }).length;
  if (pend) ct.innerHTML += '<div class="alert alert-y"><i class="fas fa-envelope"></i>'+pend+' recado(s) aguardando resposta.</div>';
  if (!S.recados.length) { ct.innerHTML += '<div class="card"><div style="text-align:center;padding:2rem;color:var(--ts)">Nenhum recado ainda.</div></div>'; return; }
  S.recados.forEach(function(r) {
    ct.innerHTML += '<div class="recado-item">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:.75rem">'
      +'<div class="av av-sm">'+ini(r.analista)+'</div>'
      +'<div style="flex:1"><strong>'+r.analista+'</strong><div style="font-size:11px;color:var(--ts)">'+r.data+'</div></div>'
      +'<span class="badge '+(r.resposta?'b-g':'b-a')+'">'+(r.resposta?'Respondido':'Aguardando')+'</span></div>'
      +'<div style="font-size:13px;line-height:1.6;margin-bottom:.75rem">'+r.texto+'</div>'
      +(r.resposta
        ?'<div class="recado-resp"><div style="font-size:10px;color:var(--ts);margin-bottom:.3rem">Respondido em '+r.dataResp+'</div><div style="font-size:12px">'+r.resposta+'</div></div>'
        :'<label class="lbl">Sua resposta</label><textarea id="resp-'+r.id+'" style="margin-bottom:.5rem"></textarea><button class="btn btn-y" data-id="'+r.id+'"><i class="fas fa-reply"></i> Responder</button>'
      )
      +'</div>';
  });
  ct.querySelectorAll('button[data-id]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var id = parseInt(this.dataset.id);
      var txt = document.getElementById('resp-'+id).value.trim();
      if (!txt) return;
      var hoje = new Date().toISOString().split('T')[0];
      showLoad('Enviando...');
      await dbPatch('recados','id=eq.'+id,{resposta:txt,data_resposta:hoje});
      hideLoad();
      var r = S.recados.find(function(x){ return x.id===id; });
      if (r) { r.resposta=txt; r.dataResp=hoje; }
      pgRecados(document.getElementById('PAGE-CONTENT'));
    });
  });
}

// ============================================================
// PÁGINAS — ANALISTA
// ============================================================
function pgAutoav(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Auto-avaliação</div><div class="pd">Como você se avalia?</div></div>';
  ct.innerHTML += '<div class="alert alert-n"><i class="fas fa-info-circle"></i>Sua auto-avaliação só é visível ao gestor após o envio oficial da avaliação dele.</div>';
  ct.innerHTML += '<div class="card"><div class="ct"><i class="fas fa-tools"></i>Skills</div>'
    +'<div style="font-size:10px;color:var(--ts);margin-bottom:.75rem;display:flex;gap:8px;flex-wrap:wrap">'
    +[['d1','Básico'],['d2','Intermediário'],['d3','Avançado'],['d4','Referência']].map(function(x){ return '<span style="display:inline-flex;align-items:center;gap:3px"><span class="dot '+x[0]+'" style="pointer-events:none"></span>'+x[1]+'</span>'; }).join('')
    +'</div>'
    +SK_JR.map(function(s) {
      var cur = S.autoav['sk_'+s.id] !== undefined ? S.autoav['sk_'+s.id] : 0;
      return '<div class="sr"><div class="sn">'+s.n+'</div><div class="st">'+s.t+'</div>'+dotsWrap(0,s.id,cur,false)+'</div>';
    }).join('')+'</div>'
    +'<div class="card"><div class="ct"><i class="fas fa-dna"></i>DNA MELI</div>'
    +DNA.map(function(d,i) {
      var v = S.autoav['dna_'+i] !== undefined ? S.autoav['dna_'+i] : 1;
      return '<div class="sr"><div class="sn" style="font-size:12px">'+d+'</div>'
        +'<select style="width:auto;font-size:11px;padding:4px 8px" onchange="S.autoav[\'dna_'+i+'\']=parseInt(this.value)">'
        +'<option value="0"'+(v===0?' selected':'')+'>Necessita alinhamento</option>'
        +'<option value="1"'+(v===1?' selected':'')+'>Alinhado</option>'
        +'<option value="2"'+(v===2?' selected':'')+'>Modelo a seguir</option>'
        +'</select></div>';
    }).join('')+'</div>'
    +'<button class="btn btn-y" id="btn-salvar-auto"><i class="fas fa-save"></i> Salvar auto-avaliação</button>';

  document.getElementById('btn-salvar-auto').addEventListener('click', async function() {
    var orig = this.innerHTML; this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    var skills={}, dna={};
    Object.keys(S.autoav).forEach(function(k){
      if(k.startsWith('sk_')) skills[k.slice(3)] = S.autoav[k];
      else if(k.startsWith('dna_')) dna[k.slice(4)] = S.autoav[k];
    });
    await dbUpsert('auto_avaliacoes',{analista_mat:S.user,periodo:S.selPeriod,skills:skills,dna:dna,updated_at:new Date().toISOString()},'analista_mat');
    this.innerHTML = '<i class="fas fa-check"></i> Salvo!';
    var btn = this;
    setTimeout(function(){ btn.innerHTML=orig; btn.disabled=false; }, 2000);
  });
}

function pgProjetos(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Projetos</div><div class="pd">Registre com evidências</div></div>';
  ct.innerHTML += '<div class="card"><div class="ct"><i class="fas fa-rocket"></i>Meus projetos</div>'
    +S.projetos.map(function(p) {
      return '<div style="background:var(--gl);border-radius:var(--rm);padding:.85rem;margin-bottom:.5rem;display:flex;gap:9px;border:1px solid var(--bd)">'
        +'<div style="width:30px;height:30px;background:var(--y);border-radius:var(--rm);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas fa-folder" style="color:var(--n)"></i></div>'
        +'<div style="flex:1"><div style="font-weight:700;font-size:13px;margin-bottom:3px">'+p.nome+'</div>'
        +'<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px"><span class="badge '+(p.papel==='Líder'?'b-y':'b-n')+'">'+p.papel+'</span><span style="font-size:11px;color:var(--ts)">'+p.periodo+'</span><span class="badge '+(p.status==='Concluído'?'b-g':'b-a')+'">'+p.status+'</span></div>'
        +'<div style="font-size:11px;color:var(--ts)">'+p.resultado+'</div>'
        +(p.evidencia?'<div style="margin-top:5px;font-size:11px"><i class="fas fa-link" style="color:var(--n)"></i> <a href="'+p.evidencia+'" target="_blank" style="color:var(--n)">'+( p.desc_evidencia||'Ver evidência')+'</a></div>':'')
        +'</div></div>';
    }).join('')
    +'<button class="add-btn" id="show-proj-form"><i class="fas fa-plus"></i> Adicionar projeto</button></div>'
    +'<div class="card" id="proj-form" style="display:none"><div class="ct"><i class="fas fa-plus"></i>Novo projeto</div>'
    +'<div class="fr"><div><label class="lbl">Nome</label><input id="pj-nome"></div><div><label class="lbl">Papel</label><select id="pj-papel"><option>Líder</option><option>Membro</option></select></div></div>'
    +'<div class="fr"><div><label class="lbl">Período</label><select id="pj-per"><option>Q2 2026</option><option>Q1 2026</option></select></div><div><label class="lbl">Status</label><select id="pj-st"><option>Em andamento</option><option>Concluído</option></select></div></div>'
    +'<div style="margin-bottom:.75rem"><label class="lbl">Resultado</label><textarea id="pj-res"></textarea></div>'
    +'<div style="margin-bottom:.75rem"><label class="lbl">Link evidência</label><input id="pj-ev" placeholder="https://..."></div>'
    +'<div style="display:flex;gap:8px">'
    +'<button class="btn btn-y" id="btn-pj-salvar"><i class="fas fa-save"></i> Salvar</button>'
    +'<button class="btn btn-o" id="btn-pj-cancel">Cancelar</button>'
    +'</div></div>';

  document.getElementById('show-proj-form').addEventListener('click', function(){ document.getElementById('proj-form').style.display='block'; });
  document.getElementById('btn-pj-cancel').addEventListener('click', function(){ document.getElementById('proj-form').style.display='none'; });
  document.getElementById('btn-pj-salvar').addEventListener('click', async function() {
    var nome = document.getElementById('pj-nome').value.trim();
    if (!nome) return;
    var p = { analista_mat:S.user, nome:nome, papel:document.getElementById('pj-papel').value, periodo:document.getElementById('pj-per').value, status:document.getElementById('pj-st').value, resultado:document.getElementById('pj-res').value, evidencia:document.getElementById('pj-ev').value, desc_evidencia:'' };
    showLoad('Salvando...');
    var r = await dbPost('projetos', p);
    hideLoad();
    S.projetos.push(Object.assign({id: r&&r[0]?r[0].id:Date.now()}, p));
    pgProjetos(document.getElementById('PAGE-CONTENT'));
  });
}

function pgIniciativas(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Iniciativas</div><div class="pd">Melhorias voltadas para KPIs</div></div>';
  ct.innerHTML += '<div class="card"><div class="ct"><i class="fas fa-lightbulb"></i>Minhas iniciativas</div>'
    +S.iniciativas.map(function(i) {
      return '<div style="background:var(--gl);border-radius:var(--rm);padding:.85rem;margin-bottom:.5rem;border:1px solid var(--bd)">'
        +'<div style="font-weight:700;font-size:13px;margin-bottom:4px">'+i.nome+'</div>'
        +'<div style="display:flex;gap:5px;margin-bottom:4px"><span class="badge b-jr">'+i.kpi+'</span><span class="badge '+(i.impacto==='Alto'?'b-g':i.impacto==='Médio'?'b-a':'b-gr')+'">'+i.impacto+'</span></div>'
        +'<div style="font-size:11px;color:var(--ts)">'+i.como+'</div></div>';
    }).join('')
    +'<button class="add-btn" id="show-ini-form"><i class="fas fa-plus"></i> Nova iniciativa</button></div>'
    +'<div class="card" id="ini-form" style="display:none"><div class="ct"><i class="fas fa-plus"></i>Nova iniciativa</div>'
    +'<div style="margin-bottom:.75rem"><label class="lbl">Descrição</label><textarea id="ini-desc"></textarea></div>'
    +'<div class="fr"><div><label class="lbl">KPI relacionado</label><select id="ini-kpi"><option>OOT</option><option>SPP</option><option>Ocupação LH</option><option>ETA Origem</option><option>CPT MWH</option><option>Outro</option></select></div>'
    +'<div><label class="lbl">Impacto</label><select id="ini-imp"><option>Alto</option><option>Médio</option><option>Baixo</option></select></div></div>'
    +'<div style="margin-bottom:.75rem"><label class="lbl">Como implementar</label><textarea id="ini-como"></textarea></div>'
    +'<div style="display:flex;gap:8px">'
    +'<button class="btn btn-y" id="btn-ini-salvar"><i class="fas fa-save"></i> Salvar</button>'
    +'<button class="btn btn-o" id="btn-ini-cancel">Cancelar</button>'
    +'</div></div>';

  document.getElementById('show-ini-form').addEventListener('click', function(){ document.getElementById('ini-form').style.display='block'; });
  document.getElementById('btn-ini-cancel').addEventListener('click', function(){ document.getElementById('ini-form').style.display='none'; });
  document.getElementById('btn-ini-salvar').addEventListener('click', async function() {
    var desc = document.getElementById('ini-desc').value.trim();
    if (!desc) return;
    var p = { analista_mat:S.user, nome:desc, kpi:document.getElementById('ini-kpi').value, impacto:document.getElementById('ini-imp').value, como:document.getElementById('ini-como').value };
    showLoad('Salvando...');
    var r = await dbPost('iniciativas', p);
    hideLoad();
    S.iniciativas.push(Object.assign({id: r&&r[0]?r[0].id:Date.now()}, p));
    pgIniciativas(document.getElementById('PAGE-CONTENT'));
  });
}

function pgSurveyA(ct) {
  var agora = new Date();
  var mes = agora.getFullYear() + '-' + String(agora.getMonth()+1).padStart(2,'0');
  if (S.surveyMes === mes) {
    ct.innerHTML = '<div class="ph"><div class="pt">Avaliar Gestor</div></div><div class="alert alert-g"><i class="fas fa-check-circle"></i>Você já respondeu este mês! Próxima avaliação disponível no início do mês seguinte.</div>';
    return;
  }
  ct.innerHTML = '<div class="ph"><div class="pt">Avaliar Gestor</div><div class="pd">1 resposta por mês · Confidencial</div></div>'
    +'<div class="alert alert-n"><i class="fas fa-lock"></i>Respostas confidenciais. O gestor vê apenas o resultado agregado do time.</div>'
    +'<div class="card"><div class="ct"><i class="fas fa-heart"></i>Engagement</div>'
    +'<div style="font-size:11px;color:var(--ts);margin-bottom:.75rem">1 = Discordo totalmente &nbsp; 5 = Concordo totalmente</div>'
    +ENG.map(function(q,i) {
      return '<div class="sq"><div class="sq-t">'+(i+1)+'. '+q+'</div>'
        +'<div class="sq-s">'+[1,2,3,4,5].map(function(n) {
          return '<button class="sq-b'+(S.survey['e'+i]===n?' on':'')+'" onclick="S.survey[\'e'+i+'\']='+n+';this.closest(\'.sq-s\').querySelectorAll(\'.sq-b\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\')">'+n+'</button>';
        }).join('')+'</div></div>';
    }).join('')+'</div>'
    +'<div class="card"><div class="ct"><i class="fas fa-bullseye"></i>EXE</div>'
    +'<div style="font-size:11px;color:var(--ts);margin-bottom:.75rem">1 = Discordo totalmente &nbsp; 5 = Concordo totalmente</div>'
    +EXE.map(function(q,i) {
      return '<div class="sq"><div class="sq-t">'+(i+1)+'. '+q+'</div>'
        +'<div class="sq-s">'+[1,2,3,4,5].map(function(n) {
          return '<button class="sq-b'+(S.survey['x'+i]===n?' on':'')+'" onclick="S.survey[\'x'+i+'\']='+n+';this.closest(\'.sq-s\').querySelectorAll(\'.sq-b\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\')">'+n+'</button>';
        }).join('')+'</div></div>';
    }).join('')+'</div>'
    +'<div id="survey-status"></div>'
    +'<button class="btn btn-y" id="btn-enviar-survey"><i class="fas fa-paper-plane"></i> Enviar avaliação</button>';

  document.getElementById('btn-enviar-survey').addEventListener('click', async function() {
    var total = ENG.length + EXE.length;
    var ans   = Object.keys(S.survey).length;
    if (ans < total) {
      document.getElementById('survey-status').innerHTML = '<div class="alert alert-r" style="margin-bottom:1rem"><i class="fas fa-exclamation-triangle"></i>Responda todas as '+total+' perguntas ('+ans+'/'+total+' respondidas).</div>';
      return;
    }
    var agora2 = new Date();
    var mes2 = agora2.getFullYear() + '-' + String(agora2.getMonth()+1).padStart(2,'0');
    var rows = await dbGet('usuarios', 'matricula=eq.'+S.user+'&select=gestor_id');
    var gid = rows && rows.length ? rows[0].gestor_id : null;
    showLoad('Enviando...');
    await dbUpsert('surveys', { analista_mat:S.user,gestor_id:gid,mes:mes2,respostas:S.survey }, 'analista_mat,mes');
    hideLoad();
    S.surveyMes = mes2;
    pgSurveyA(document.getElementById('PAGE-CONTENT'));
  });
}

function pgRecadoA(ct) {
  ct.innerHTML = '<div class="ph"><div class="pt">Meu Recado</div><div class="pd">Canal direto com o gestor</div></div>';
  var meus = S.recados.filter(function(r){ return r.mat === S.user; });
  if (meus.length) {
    meus.forEach(function(r) {
      ct.innerHTML += '<div class="recado-item">'
        +'<div style="font-size:11px;color:var(--ts);margin-bottom:.4rem"><i class="fas fa-user" style="color:var(--n)"></i> <b style="color:var(--n)">Você</b> · '+r.data+'</div>'
        +'<div style="font-size:13px;line-height:1.6">'+r.texto+'</div>'
        +(r.resposta
          ?'<div class="recado-resp"><div style="font-size:10px;color:var(--ts);margin-bottom:.3rem">Gestor respondeu em '+r.dataResp+'</div><div style="font-size:12px">'+r.resposta+'</div></div>'
          :'<div style="margin-top:.5rem;font-size:11px;color:var(--ts)"><i class="fas fa-clock"></i> Aguardando resposta</div>'
        )+'</div>';
    });
  } else {
    ct.innerHTML += '<div class="alert alert-n"><i class="fas fa-inbox"></i>Nenhum recado enviado ainda.</div>';
  }
  ct.innerHTML += '<div class="card"><div class="ct"><i class="fas fa-pen"></i>Novo recado</div>'
    +'<textarea id="novo-recado" placeholder="Escreva seu recado..." style="min-height:100px;margin-bottom:.75rem"></textarea>'
    +'<button class="btn btn-y" id="btn-enviar-recado"><i class="fas fa-paper-plane"></i> Enviar</button></div>';

  document.getElementById('btn-enviar-recado').addEventListener('click', async function() {
    var txt = document.getElementById('novo-recado').value.trim();
    if (!txt) return;
    var hoje = new Date().toISOString().split('T')[0];
    var rows = await dbGet('usuarios','matricula=eq.'+S.user+'&select=gestor_id,nome');
    var gid  = rows && rows.length ? rows[0].gestor_id : null;
    var nome = rows && rows.length ? (rows[0].nome||S.user) : S.user;
    showLoad('Enviando...');
    var r = await dbPost('recados',{analista_nome:nome,analista_mat:S.user,gestor_id:gid,texto:txt,data_envio:hoje,resposta:''});
    hideLoad();
    if (r && r[0]) S.recados.unshift({id:r[0].id,analista:nome,mat:S.user,texto:txt,data:hoje,resposta:'',dataResp:''});
    pgRecadoA(document.getElementById('PAGE-CONTENT'));
  });
}

// ============================================================
// INIT — tudo acontece aqui, após o DOM estar 100% pronto
// ============================================================
document.addEventListener('DOMContentLoaded', function() {

  // === ABAS DE LOGIN ===
  document.getElementById('tab-ger').addEventListener('click', function(){ showTab('gerente'); });
  document.getElementById('tab-ges').addEventListener('click', function(){ showTab('gestor');  });
  document.getElementById('tab-ana').addEventListener('click', function(){ showTab('analista');});

  // === GERENTE ===
  document.getElementById('btn-ger-entrar').addEventListener('click', loginGerente);
  document.getElementById('ger-nome').addEventListener('keydown', function(e){ if(e.key==='Enter') loginGerente(); });
  document.getElementById('ger-pwd').addEventListener('keydown',  function(e){ if(e.key==='Enter') loginGerente(); });

  // === GESTOR step 1 ===
  document.getElementById('btn-ges-nome').addEventListener('click', gesVerificarNome);
  document.getElementById('ges-nome').addEventListener('keydown', function(e){ if(e.key==='Enter') gesVerificarNome(); });
  document.getElementById('ges-nome').addEventListener('input', function(){ this.value = this.value.charAt(0).toUpperCase() + this.value.slice(1); });

  // === GESTOR step 2 (criar senha) ===
  document.getElementById('btn-ges-criar').addEventListener('click', gesCriarSenha);
  document.getElementById('ges-mat').addEventListener('input', function(){ this.value = this.value.toUpperCase(); });
  document.getElementById('ges-ns1').addEventListener('keydown', function(e){ if(e.key==='Enter') gesCriarSenha(); });
  document.getElementById('ges-ns2').addEventListener('keydown', function(e){ if(e.key==='Enter') gesCriarSenha(); });
  document.getElementById('btn-ges-back1').addEventListener('click', function(){
    document.getElementById('ges-s1').style.display='block';
    document.getElementById('ges-s2').style.display='none';
    hideErr('ges-s2-err');
  });

  // === GESTOR step 3 (login matrícula) ===
  document.getElementById('btn-ges-login').addEventListener('click', gesLogin);
  document.getElementById('ges-login-mat').addEventListener('input', function(){ this.value = this.value.toUpperCase(); });
  document.getElementById('ges-login-mat').addEventListener('keydown', function(e){ if(e.key==='Enter') gesLogin(); });
  document.getElementById('ges-login-pwd').addEventListener('keydown', function(e){ if(e.key==='Enter') gesLogin(); });
  document.getElementById('btn-ges-back2').addEventListener('click', function(){
    document.getElementById('ges-s1').style.display='block';
    document.getElementById('ges-s3').style.display='none';
    document.getElementById('ges-nome').value='';
    hideErr('ges-s3-err');
  });

  // === ANALISTA step 1 ===
  document.getElementById('btn-ana-mat').addEventListener('click', anaVerificarMat);
  document.getElementById('ana-mat').addEventListener('input', function(){ this.value = this.value.toUpperCase(); });
  document.getElementById('ana-mat').addEventListener('keydown', function(e){ if(e.key==='Enter') anaVerificarMat(); });

  // === ANALISTA step 2 (criar senha) ===
  document.getElementById('btn-ana-criar').addEventListener('click', anaCriarSenha);
  document.getElementById('ana-ns1').addEventListener('keydown', function(e){ if(e.key==='Enter') anaCriarSenha(); });
  document.getElementById('ana-ns2').addEventListener('keydown', function(e){ if(e.key==='Enter') anaCriarSenha(); });
  document.getElementById('btn-ana-back').addEventListener('click', function(){
    document.getElementById('ana-s1').style.display='block';
    document.getElementById('ana-s2').style.display='none';
    document.getElementById('ana-mat').value=''; document.getElementById('ana-mat').disabled=false;
    hideErr('ana-s2-err');
  });

  // === ANALISTA step 3 (senha) ===
  document.getElementById('btn-ana-login').addEventListener('click', anaLogin);
  document.getElementById('ana-pwd').addEventListener('keydown', function(e){ if(e.key==='Enter') anaLogin(); });
  document.getElementById('btn-ana-back3').addEventListener('click', function(){
    document.getElementById('ana-s1').style.display='block';
    document.getElementById('ana-s3').style.display='none';
    document.getElementById('ana-mat').value=''; document.getElementById('ana-mat').disabled=false;
    hideErr('ana-s3-err');
  });

  // === SAIR ===
  document.getElementById('btn-sair').addEventListener('click', sair);

  // Estado inicial: mostrar aba Gestor
  showTab('gestor');
});