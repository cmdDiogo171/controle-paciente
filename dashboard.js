// dashboard.js

let pacientes = JSON.parse(localStorage.getItem('pacientes')) || [];
let consultas = JSON.parse(localStorage.getItem('consultas')) || [];
let pagamentos = JSON.parse(localStorage.getItem('pagamentos')) || [];
let buscaCalendario = '';

let __cloudPushTimer = null;

function agendarCloudPush(delay = 600) {
  if (!window.cloudPush) return;
  clearTimeout(__cloudPushTimer);
  __cloudPushTimer = setTimeout(() => {
    Promise.resolve(window.cloudPush()).catch(console.warn);
  }, delay);
}

const cores = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#30cfd0', '#a8edea'];

// Status de consulta
const statusConfig = {
  'Agendada':  { cor: '#667eea', bg: '#e0e7ff', icon: 'fa-calendar-check' },
  'Realizada': { cor: '#059669', bg: '#d1fae5', icon: 'fa-check-circle' },
  'Cancelada': { cor: '#dc2626', bg: '#fee2e2', icon: 'fa-times-circle' },
  'Faltou':    { cor: '#d97706', bg: '#fef3c7', icon: 'fa-user-times' }
};

function limparConsultasInvalidas() {
  consultas = consultas.filter(c => c.pacienteIndex >= 0 && c.pacienteIndex < pacientes.length);
  localStorage.setItem('consultas', JSON.stringify(consultas));
}

document.addEventListener('DOMContentLoaded', () => {
  limparConsultasInvalidas();
  inicializarNavegacao();
  carregarPacientes();
  carregarCalendario();
  carregarPagamentos();
});

function inicializarNavegacao() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
      document.getElementById(section).classList.add('active');
      if (section === 'calendario') carregarCalendario();
      if (section === 'pagamentos') carregarPagamentos();
    });
  });
}

// =====================
// PACIENTES
// =====================
function carregarPacientes() {
  const lista = document.getElementById('listaPacientes');
  lista.innerHTML = '';
  if (pacientes.length === 0) {
    lista.innerHTML = '<p style="text-align:center; padding:40px; color:#999;">Nenhum paciente cadastrado ainda.</p>';
    return;
  }
  pacientes.forEach((paciente, index) => {
    const cor = cores[index % cores.length];
    const iniciais = (paciente.nome || '').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const primeiraConsulta = paciente.primeiraConsulta ? `Primeira consulta: ${new Date(paciente.primeiraConsulta + 'T00:00:00').toLocaleDateString('pt-BR')}` : '';
    const proximoRetorno = paciente.proximoRetorno ? `Retorno: ${new Date(paciente.proximoRetorno + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Retorno não agendado';
    const card = document.createElement('div');
    card.className = 'paciente-card';
    card.innerHTML = `
      <div class="paciente-header" onclick="togglePaciente(${index})">
        <div class="paciente-avatar" style="background: ${cor}">${iniciais}</div>
        <div class="paciente-info" style="flex: 1;">
          <h3>${paciente.nome}</h3>
          <p>${paciente.idade} anos ${paciente.whatsapp ? '• ' + paciente.whatsapp : ''}</p>
          <p style="margin-top: 8px; font-size: 13px; color: #667eea;">
            <strong>Plano:</strong> ${paciente.plano || 'Não definido'} ${paciente.formaPagamento ? '(' + (paciente.formaPagamento === 'vista' ? 'à vista' : 'parcelado') + ')' : ''}
          </p>
          <p style="font-size: 13px; color: #666;">
            ${primeiraConsulta} ${primeiraConsulta && proximoRetorno ? '•' : ''} ${proximoRetorno}
          </p>
        </div>
        <div style="display: flex; gap: 10px;" onclick="event.stopPropagation();">
          <button class="btn-secondary" style="padding: 8px 16px;" onclick="editarPaciente(${index})"><i class="fas fa-edit"></i></button>
          <button class="btn-secondary" style="padding: 8px 16px; background: #fee; color: #ef4444;" onclick="excluirPaciente(${index})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="paciente-detalhes" id="detalhes-${index}">
        <div class="prontuario-section">
          <h4>Prontuário</h4>
          <button class="btn-secondary" onclick="abrirModalProntuario(${index})">
            <i class="fas fa-file-medical"></i> Ver Prontuário Completo
          </button>
          ${gerarResumoUltimaAvaliacao(paciente.prontuario)}
        </div>
      </div>
    `;
    lista.appendChild(card);
  });
}

function gerarResumoUltimaAvaliacao(prontuario) {
  if (!prontuario || !prontuario.historico || prontuario.historico.length === 0) {
    return '<p style="margin-top: 15px; color: #999;">Nenhuma avaliação registrada</p>';
  }
  const ultima = prontuario.historico[prontuario.historico.length - 1];
  return `
    <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
      <strong>Última avaliação:</strong> ${new Date(ultima.data).toLocaleDateString('pt-BR')}
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px;">
        ${ultima.peso ? `<div><small style="color:#666;">Peso</small><br><strong>${ultima.peso} kg</strong></div>` : ''}
        ${ultima.imc ? `<div><small style="color:#666;">IMC</small><br><strong>${ultima.imc}</strong></div>` : ''}
        ${ultima.cintura ? `<div><small style="color:#666;">Cintura</small><br><strong>${ultima.cintura} cm</strong></div>` : ''}
      </div>
    </div>
  `;
}

function togglePaciente(index) {
  document.querySelectorAll('.paciente-card')[index].classList.toggle('expanded');
}

function filtrarPacientes() {
  const busca = document.getElementById('searchPaciente').value.toLowerCase();
  document.querySelectorAll('.paciente-card').forEach((card, index) => {
    const nome = (pacientes[index]?.nome || '').toLowerCase();
    card.style.display = nome.includes(busca) ? 'block' : 'none';
  });
}

// =====================
// Modal Novo Paciente
// =====================
function abrirModalNovoPaciente() {
  document.getElementById('modalPaciente').classList.add('active');
  document.getElementById('formPaciente').reset();
  document.getElementById('formaPagamentoDiv').style.display = 'none';
  const hp = document.getElementById('horarioPrimeiraConsulta');
  const hr = document.getElementById('horarioRetorno');
  if (hp && !hp.value) hp.value = '09:00';
  if (hr && !hr.value) hr.value = '09:00';
  document.getElementById('formPaciente').onsubmit = salvarPaciente;
}

function mostrarOpcaoPagamento() {
  const plano = document.getElementById('planoPaciente').value;
  const divFormaPagamento = document.getElementById('formaPagamentoDiv');
  const infoText = document.getElementById('infoParcelas');
  if (plano === 'Mensal') { divFormaPagamento.style.display = 'none'; }
  else if (plano === 'Trimestral') { divFormaPagamento.style.display = 'block'; infoText.textContent = 'À vista: R$ 420 | Parcelado: 3x R$ 150'; }
  else if (plano === 'Semestral') { divFormaPagamento.style.display = 'block'; infoText.textContent = 'À vista: R$ 780 | Parcelado: 6x R$ 135'; }
  else { divFormaPagamento.style.display = 'none'; }
}

function normalizarHora(valor, fallback = '09:00') {
  const v = (valor || '').trim();
  return v ? v : fallback;
}

function addMonthsISO(isoDate, months) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function salvarPaciente(e) {
  e.preventDefault();
  const plano = document.getElementById('planoPaciente').value;
  const primeiraConsulta = document.getElementById('primeiraConsulta').value;
  const proximoRetorno = document.getElementById('proximoRetorno').value;
  const formaPagamento = document.getElementById('formaPagamento').value;
  const horarioPrimeiraConsulta = normalizarHora(document.getElementById('horarioPrimeiraConsulta')?.value, '09:00');
  const horarioRetorno = normalizarHora(document.getElementById('horarioRetorno')?.value, '09:00');
  const vencimentoPrimeiraParcela = document.getElementById('vencimentoPrimeiraParcela')?.value || null;
  const novoPaciente = {
    id: Date.now(),
    nome: document.getElementById('nomePaciente').value,
    idade: document.getElementById('idadePaciente').value,
    whatsapp: document.getElementById('whatsappPaciente').value,
    plano, formaPagamento, primeiraConsulta, proximoRetorno,
    horarioPrimeiraConsulta, horarioRetorno, vencimentoPrimeiraParcela,
    prontuario: { historico: [] }
  };
  const pacienteIndex = pacientes.length;
  pacientes.push(novoPaciente);
  gerarPagamentosAutomaticos(novoPaciente.id, plano, primeiraConsulta, formaPagamento, vencimentoPrimeiraParcela);
  if (primeiraConsulta) consultas.push({ id: Date.now(), pacienteIndex, data: primeiraConsulta, horario: horarioPrimeiraConsulta, tipo: 'Primeira Consulta', status: 'Agendada' });
  if (proximoRetorno) consultas.push({ id: Date.now() + 1, pacienteIndex, data: proximoRetorno, horario: horarioRetorno, tipo: 'Retorno', status: 'Agendada' });
  localStorage.setItem('pacientes', JSON.stringify(pacientes));
  localStorage.setItem('consultas', JSON.stringify(consultas));
  agendarCloudPush();
  fecharModal('modalPaciente');
  carregarPacientes();
  atualizarSelectsPacientes();
  carregarCalendario();
  carregarPagamentos();
}

function gerarPagamentosAutomaticos(pacienteId, plano, dataInicio, formaPagamento, vencimentoInicial = null) {
  if (!plano || !dataInicio) return;
  const base = vencimentoInicial || dataInicio;
  let numParcelas = 0, valorParcela = 0;
  if (plano === 'Mensal') { numParcelas = 1; valorParcela = 150; formaPagamento = 'vista'; }
  else if (plano === 'Trimestral') { numParcelas = formaPagamento === 'vista' ? 1 : 3; valorParcela = formaPagamento === 'vista' ? 420 : 150; }
  else if (plano === 'Semestral') { numParcelas = formaPagamento === 'vista' ? 1 : 6; valorParcela = formaPagamento === 'vista' ? 780 : 135; }
  for (let i = 0; i < numParcelas; i++) {
    pagamentos.push({
      id: Date.now() + i, pacienteId, valor: valorParcela,
      vencimento: addMonthsISO(base, i),
      descricao: numParcelas === 1 ? `${plano} - À vista` : `${plano} - Parcela ${i + 1}/${numParcelas}`,
      pago: false
    });
  }
  localStorage.setItem('pagamentos', JSON.stringify(pagamentos));
}

function editarPaciente(index) {
  const paciente = pacientes[index];
  const planoAntigo = paciente.plano || '';
  const formaPagamentoAntiga = paciente.formaPagamento || 'vista';
  const primeiraConsultaAntiga = paciente.primeiraConsulta || '';
  const venc1Antigo = paciente.vencimentoPrimeiraParcela || null;
  document.getElementById('nomePaciente').value = paciente.nome;
  document.getElementById('idadePaciente').value = paciente.idade;
  document.getElementById('whatsappPaciente').value = paciente.whatsapp || '';
  document.getElementById('planoPaciente').value = paciente.plano || '';
  document.getElementById('primeiraConsulta').value = paciente.primeiraConsulta || '';
  document.getElementById('proximoRetorno').value = paciente.proximoRetorno || '';
  const hp = document.getElementById('horarioPrimeiraConsulta');
  const hr = document.getElementById('horarioRetorno');
  const vp = document.getElementById('vencimentoPrimeiraParcela');
  if (hp) hp.value = paciente.horarioPrimeiraConsulta || '09:00';
  if (hr) hr.value = paciente.horarioRetorno || '09:00';
  if (vp) vp.value = paciente.vencimentoPrimeiraParcela || '';
  if (paciente.plano) { mostrarOpcaoPagamento(); document.getElementById('formaPagamento').value = paciente.formaPagamento || 'vista'; }
  document.getElementById('modalPaciente').classList.add('active');
  document.getElementById('formPaciente').onsubmit = (e) => {
    e.preventDefault();
    const planoNovo = document.getElementById('planoPaciente').value;
    const primeiraConsulta = document.getElementById('primeiraConsulta').value;
    const proximoRetorno = document.getElementById('proximoRetorno').value;
    const formaPagamento = document.getElementById('formaPagamento').value;
    const horarioPrimeiraConsulta = normalizarHora(document.getElementById('horarioPrimeiraConsulta')?.value, '09:00');
    const horarioRetorno = normalizarHora(document.getElementById('horarioRetorno')?.value, '09:00');
    const venc1Novo = document.getElementById('vencimentoPrimeiraParcela')?.value || null;
    pacientes[index] = { ...pacientes[index], nome: document.getElementById('nomePaciente').value, idade: document.getElementById('idadePaciente').value, whatsapp: document.getElementById('whatsappPaciente').value, plano: planoNovo, formaPagamento, primeiraConsulta, proximoRetorno, horarioPrimeiraConsulta, horarioRetorno, vencimentoPrimeiraParcela: venc1Novo };
    const mudouPagamento = (planoNovo !== planoAntigo) || (formaPagamento !== formaPagamentoAntiga) || (primeiraConsulta !== primeiraConsultaAntiga) || (venc1Novo !== venc1Antigo);
    if (mudouPagamento) { pagamentos = pagamentos.filter(p => p.pacienteId !== paciente.id); gerarPagamentosAutomaticos(paciente.id, planoNovo, primeiraConsulta, formaPagamento, venc1Novo); localStorage.setItem('pagamentos', JSON.stringify(pagamentos)); }
    consultas = consultas.filter(c => c.pacienteIndex !== index);
    if (primeiraConsulta) consultas.push({ id: Date.now(), pacienteIndex: index, data: primeiraConsulta, horario: horarioPrimeiraConsulta, tipo: 'Primeira Consulta', status: 'Agendada' });
    if (proximoRetorno) consultas.push({ id: Date.now() + 1, pacienteIndex: index, data: proximoRetorno, horario: horarioRetorno, tipo: 'Retorno', status: 'Agendada' });
    localStorage.setItem('pacientes', JSON.stringify(pacientes));
    localStorage.setItem('consultas', JSON.stringify(consultas));
    agendarCloudPush();
    fecharModal('modalPaciente');
    carregarPacientes(); atualizarSelectsPacientes(); carregarCalendario(); carregarPagamentos();
    document.getElementById('formPaciente').onsubmit = salvarPaciente;
  };
}

function excluirPaciente(index) {
  const paciente = pacientes[index];
  if (confirm(`Tem certeza que deseja excluir ${paciente.nome}?\n\nIsso também apagará:\n• Consultas agendadas\n• Pagamentos\n• Prontuário`)) {
    pacientes.splice(index, 1);
    consultas = consultas.filter(c => c.pacienteIndex !== index).map(c => c.pacienteIndex > index ? { ...c, pacienteIndex: c.pacienteIndex - 1 } : c);
    pagamentos = pagamentos.filter(p => p.pacienteId !== paciente.id);
    localStorage.setItem('pacientes', JSON.stringify(pacientes));
    localStorage.setItem('consultas', JSON.stringify(consultas));
    localStorage.setItem('pagamentos', JSON.stringify(pagamentos));
    agendarCloudPush();
    carregarPacientes(); atualizarSelectsPacientes(); carregarCalendario(); carregarPagamentos();
  }
}

// =====================
// PRONTUÁRIO
// =====================
function abrirModalProntuario(index) {
  const paciente = pacientes[index];
  const historico = paciente.prontuario?.historico || [];
  const modalHTML = `
    <div id="modalProntuario" class="modal active">
      <div class="modal-content" style="max-width: 1000px;">
        <span class="close" onclick="fecharModal('modalProntuario')">&times;</span>
        <h2>Prontuário - ${paciente.nome}</h2>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="color: #667eea;">Histórico de Avaliações</h3>
          <div style="display: flex; gap: 10px;">
            ${historico.length >= 2 ? `<button type="button" class="btn-secondary" onclick="mostrarGraficoEvolucao(${index})"><i class="fas fa-chart-line"></i> Ver Evolução</button>` : ''}
            <button type="button" class="btn-primary" onclick="abrirFormularioAvaliacao(${index})"><i class="fas fa-plus"></i> Nova Avaliação</button>
          </div>
        </div>
        <div id="graficoEvolucao" style="display: none; margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4 style="color: #667eea; margin: 0;">Evolução do Paciente</h4>
            <button type="button" class="btn-secondary" onclick="document.getElementById('graficoEvolucao').style.display='none'" style="padding: 5px 10px;"><i class="fas fa-times"></i></button>
          </div>
          <canvas id="chartEvolucao" style="max-height: 300px;"></canvas>
        </div>
        <div id="listaAvaliacoes" style="max-height: 500px; overflow-y: auto;">
          ${historico.length === 0 ? '<p style="text-align: center; color: #999; padding: 40px;">Nenhuma avaliação registrada ainda.</p>'
            : historico.map((av, idx) => `
              <div class="avaliacao-item" onclick="visualizarAvaliacao(${index}, ${idx})" style="background: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 8px; cursor: pointer; border-left: 4px solid #667eea; transition: all 0.3s;" onmouseover="this.style.background='#e0e7ff'" onmouseout="this.style.background='#f8f9fa'">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="font-size: 16px;">${new Date(av.data).toLocaleDateString('pt-BR')}</strong>
                    <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Peso: ${av.peso || '-'} kg | IMC: ${av.imc || '-'} | Cintura: ${av.cintura || '-'} cm</p>
                  </div>
                  <button onclick="event.stopPropagation(); excluirAvaliacao(${index}, ${idx})" style="background: #fee; color: #ef4444; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            `).reverse().join('')}
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function abrirFormularioAvaliacao(pacienteIndex, avaliacaoIndex = null) {
  const paciente = pacientes[pacienteIndex];
  const avaliacao = avaliacaoIndex !== null ? paciente.prontuario.historico[avaliacaoIndex] : null;
  const titulo = avaliacao ? 'Editar Avaliação' : 'Nova Avaliação';

  document.getElementById('modalProntuario').innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <span class="close" onclick="fecharModal('modalProntuario')">&times;</span>
      <h2>${titulo} - ${paciente.nome}</h2>
      <form id="formAvaliacao" onsubmit="salvarAvaliacao(event, ${pacienteIndex}, ${avaliacaoIndex})">
        <div class="form-group">
          <label>Data da Avaliação *</label>
          <input type="date" id="dataAvaliacao" value="${avaliacao?.data?.split('T')[0] || new Date().toISOString().split('T')[0]}" required>
        </div>
        <h4 style="margin: 25px 0 15px; color: #667eea;">Medidas Antropométricas</h4>
        <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
          <div class="form-group"><label>Peso atual (kg)</label><input type="number" step="0.1" id="peso" value="${avaliacao?.peso || ''}"></div>
          <div class="form-group"><label>Altura (m)</label><input type="number" step="0.01" id="altura" value="${avaliacao?.altura || ''}"></div>
          <div class="form-group"><label>IMC (kg/m²)</label><input type="number" step="0.1" id="imc" value="${avaliacao?.imc || ''}" readonly style="background: #f0f0f0;"></div>
        </div>
        <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
          <div class="form-group"><label>Peso usual (kg)</label><input type="number" step="0.1" id="pesoUsual" value="${avaliacao?.pesoUsual || ''}"></div>
          <div class="form-group"><label>Peso ideal (kg)</label><input type="number" step="0.1" id="pesoIdeal" value="${avaliacao?.pesoIdeal || ''}"></div>
          <div class="form-group"><label>Peso ajustado (kg)</label><input type="number" step="0.1" id="pesoAjustado" value="${avaliacao?.pesoAjustado || ''}"></div>
        </div>
        <h4 style="margin: 25px 0 15px; color: #667eea;">Circunferências (cm)</h4>
        <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
          <div class="form-group"><label>Cintura</label><input type="number" step="0.1" id="cintura" value="${avaliacao?.cintura || ''}"></div>
          <div class="form-group"><label>Quadril</label><input type="number" step="0.1" id="quadril" value="${avaliacao?.quadril || ''}"></div>
          <div class="form-group"><label>Relação cintura/quadril</label><input type="number" step="0.01" id="relacaoCQ" value="${avaliacao?.relacaoCQ || ''}" readonly style="background: #f0f0f0;"></div>
        </div>
        <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
          <div class="form-group"><label>Braço</label><input type="number" step="0.1" id="braco" value="${avaliacao?.braco || ''}"></div>
          <div class="form-group"><label>Circunf. muscular braço</label><input type="number" step="0.1" id="bracoMuscular" value="${avaliacao?.bracoMuscular || ''}"></div>
          <div class="form-group"><label>Panturrilha</label><input type="number" step="0.1" id="panturrilha" value="${avaliacao?.panturrilha || ''}"></div>
        </div>
        <div class="form-group"><label>Pescoço (cm)</label><input type="number" step="0.1" id="pescoco" value="${avaliacao?.pescoco || ''}"></div>
        <h4 style="margin: 25px 0 15px; color: #667eea;">Dobras Cutâneas (mm)</h4>
        <div class="form-row">
          <div class="form-group"><label>Tricipital (DCT)</label><input type="number" step="0.1" id="dct" value="${avaliacao?.dct || ''}"></div>
          <div class="form-group"><label>Bicipital (DCB)</label><input type="number" step="0.1" id="dcb" value="${avaliacao?.dcb || ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Subescapular (DCSE)</label><input type="number" step="0.1" id="dcse" value="${avaliacao?.dcse || ''}"></div>
          <div class="form-group"><label>Supra-ilíaca (DCSI)</label><input type="number" step="0.1" id="dcsi" value="${avaliacao?.dcsi || ''}"></div>
        </div>
        <h4 style="margin: 25px 0 15px; color: #667eea;">Metabolismo e Dieta</h4>
        <div class="form-row">
          <div class="form-group"><label>TMB (kcal)</label><input type="number" id="tmb" value="${avaliacao?.tmb || ''}"></div>
          <div class="form-group"><label>VET (kcal)</label><input type="number" id="vet" value="${avaliacao?.vet || ''}"></div>
        </div>
        <h4 style="margin: 25px 0 15px; color: #667eea;">Macronutrientes</h4>
        <div class="form-row" style="grid-template-columns: 1fr 1fr;">
          <div class="form-group"><label>Carboidratos (%)</label><input type="number" step="0.1" id="carbPct" value="${avaliacao?.carbPct || ''}"></div>
          <div class="form-group"><label>Carboidratos (g)</label><input type="number" step="0.1" id="carbG" value="${avaliacao?.carbG || ''}"></div>
        </div>
        <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
          <div class="form-group"><label>Proteínas (%)</label><input type="number" step="0.1" id="protPct" value="${avaliacao?.protPct || ''}"></div>
          <div class="form-group"><label>Proteínas (g)</label><input type="number" step="0.1" id="protG" value="${avaliacao?.protG || ''}"></div>
          <div class="form-group"><label>Proteínas (g/kg)</label><input type="number" step="0.01" id="protGkg" value="${avaliacao?.protGkg || ''}" readonly style="background: #f0f0f0;"></div>
        </div>
        <div class="form-row" style="grid-template-columns: 1fr 1fr;">
          <div class="form-group"><label>Lipídios (%)</label><input type="number" step="0.1" id="lipPct" value="${avaliacao?.lipPct || ''}"></div>
          <div class="form-group"><label>Lipídios (g)</label><input type="number" step="0.1" id="lipG" value="${avaliacao?.lipG || ''}"></div>
        </div>
        <div class="form-group">
          <label>Conduta Nutricional</label>
          <textarea id="observacoes" rows="3" placeholder="Ex: Dieta hipocalórica, aumento de proteínas, redução de sódio...">${avaliacao?.observacoes || ''}</textarea>
        </div>
        <div class="form-buttons">
          <button type="button" class="btn-secondary" onclick="abrirModalProntuario(${pacienteIndex})">Voltar</button>
          <button type="submit" class="btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('peso').addEventListener('input', calcularIMC);
  document.getElementById('altura').addEventListener('input', calcularIMC);
  document.getElementById('cintura').addEventListener('input', calcularRelacaoCQ);
  document.getElementById('quadril').addEventListener('input', calcularRelacaoCQ);
  ['vet', 'carbPct', 'protPct', 'lipPct'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcularGramasMacrosPorPct);
  });
  calcularGramasMacrosPorPct();

  const calcProtGkg = () => {
    const protG = parseFloat(document.getElementById('protG').value);
    const peso  = parseFloat(document.getElementById('peso').value);
    if (!isNaN(protG) && !isNaN(peso) && peso > 0) {
      document.getElementById('protGkg').value = (protG / peso).toFixed(2);
    } else {
      document.getElementById('protGkg').value = '';
    }
  };
  document.getElementById('protG').addEventListener('input', calcProtGkg);
  document.getElementById('peso').addEventListener('input', calcProtGkg);
  calcProtGkg();
}

function calcularIMC() {
  const peso = parseFloat(document.getElementById('peso').value);
  const altura = parseFloat(document.getElementById('altura').value);
  if (peso && altura) document.getElementById('imc').value = (peso / (altura * altura)).toFixed(1);
}

function calcularRelacaoCQ() {
  const cintura = parseFloat(document.getElementById('cintura').value);
  const quadril = parseFloat(document.getElementById('quadril').value);
  if (cintura && quadril) document.getElementById('relacaoCQ').value = (cintura / quadril).toFixed(2);
}

function calcularGramasMacrosPorPct() {
  const vetEl = document.getElementById('vet');
  if (!vetEl) return;
  const vet = parseFloat(vetEl.value);
  if (!Number.isFinite(vet) || vet <= 0) return;
  [{ pctId: 'carbPct', gId: 'carbG', k: 4 }, { pctId: 'protPct', gId: 'protG', k: 4 }, { pctId: 'lipPct', gId: 'lipG', k: 9 }].forEach(m => {
    const pctEl = document.getElementById(m.pctId);
    const gEl = document.getElementById(m.gId);
    if (!pctEl || !gEl || pctEl.value === '') return;
    const pct = parseFloat(pctEl.value);
    if (!Number.isFinite(pct) || pct < 0) return;
    const g = (vet * (pct / 100)) / m.k;
    gEl.value = Number.isFinite(g) ? g.toFixed(1) : '';
  });
}

function salvarAvaliacao(e, pacienteIndex, avaliacaoIndex) {
  e.preventDefault();
  const novaAvaliacao = {
    data: document.getElementById('dataAvaliacao').value + 'T00:00:00',
    peso: parseFloat(document.getElementById('peso').value) || null,
    altura: parseFloat(document.getElementById('altura').value) || null,
    imc: parseFloat(document.getElementById('imc').value) || null,
    pesoUsual: parseFloat(document.getElementById('pesoUsual').value) || null,
    pesoIdeal: parseFloat(document.getElementById('pesoIdeal').value) || null,
    pesoAjustado: parseFloat(document.getElementById('pesoAjustado').value) || null,
    cintura: parseFloat(document.getElementById('cintura').value) || null,
    quadril: parseFloat(document.getElementById('quadril').value) || null,
    relacaoCQ: parseFloat(document.getElementById('relacaoCQ').value) || null,
    braco: parseFloat(document.getElementById('braco').value) || null,
    bracoMuscular: parseFloat(document.getElementById('bracoMuscular').value) || null,
    panturrilha: parseFloat(document.getElementById('panturrilha').value) || null,
    pescoco: parseFloat(document.getElementById('pescoco').value) || null,
    dct: parseFloat(document.getElementById('dct').value) || null,
    dcb: parseFloat(document.getElementById('dcb').value) || null,
    dcse: parseFloat(document.getElementById('dcse').value) || null,
    dcsi: parseFloat(document.getElementById('dcsi').value) || null,
    tmb: parseInt(document.getElementById('tmb').value) || null,
    vet: parseInt(document.getElementById('vet').value) || null,
    carbPct: parseFloat(document.getElementById('carbPct').value) || null,
    carbG: parseFloat(document.getElementById('carbG').value) || null,
    protPct: parseFloat(document.getElementById('protPct').value) || null,
    protG: parseFloat(document.getElementById('protG').value) || null,
    protGkg: parseFloat(document.getElementById('protGkg').value) || null,
    lipPct: parseFloat(document.getElementById('lipPct').value) || null,
    lipG: parseFloat(document.getElementById('lipG').value) || null,
    observacoes: document.getElementById('observacoes').value
  };
  if (!pacientes[pacienteIndex].prontuario) pacientes[pacienteIndex].prontuario = { historico: [] };
  if (avaliacaoIndex !== null) pacientes[pacienteIndex].prontuario.historico[avaliacaoIndex] = novaAvaliacao;
  else pacientes[pacienteIndex].prontuario.historico.push(novaAvaliacao);
  localStorage.setItem('pacientes', JSON.stringify(pacientes));
  agendarCloudPush();
  abrirModalProntuario(pacienteIndex);
  carregarPacientes();
}

function visualizarAvaliacao(pacienteIndex, avaliacaoIndex) { abrirFormularioAvaliacao(pacienteIndex, avaliacaoIndex); }

function excluirAvaliacao(pacienteIndex, avaliacaoIndex) {
  if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
    pacientes[pacienteIndex].prontuario.historico.splice(avaliacaoIndex, 1);
    localStorage.setItem('pacientes', JSON.stringify(pacientes));
    agendarCloudPush();
    abrirModalProntuario(pacienteIndex);
    carregarPacientes();
  }
}

// =====================
// GRÁFICO DE EVOLUÇÃO
// =====================
function mostrarGraficoEvolucao(pacienteIndex) {
  const historico = pacientes[pacienteIndex].prontuario?.historico || [];
  if (historico.length < 2) { alert('É necessário pelo menos 2 avaliações para gerar o gráfico de evolução.'); return; }
  const ord = [...historico].sort((a, b) => new Date(a.data) - new Date(b.data));
  document.getElementById('graficoEvolucao').style.display = 'block';
  if (window.chartEvolucaoInstance) window.chartEvolucaoInstance.destroy();
  window.chartEvolucaoInstance = new Chart(document.getElementById('chartEvolucao'), {
    type: 'line',
    data: {
      labels: ord.map(h => new Date(h.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
      datasets: [
        { label: 'Peso (kg)', data: ord.map(h => h.peso), borderColor: '#667eea', backgroundColor: 'rgba(102,126,234,0.1)', tension: 0.4, yAxisID: 'y' },
        { label: 'IMC', data: ord.map(h => h.imc), borderColor: '#764ba2', backgroundColor: 'rgba(118,75,162,0.1)', tension: 0.4, yAxisID: 'y1' },
        { label: 'Cintura (cm)', data: ord.map(h => h.cintura), borderColor: '#f093fb', backgroundColor: 'rgba(240,147,251,0.1)', tension: 0.4, yAxisID: 'y2' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Peso (kg)' } },
        y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'IMC' }, grid: { drawOnChartArea: false } },
        y2: { type: 'linear', display: false, position: 'right' }
      }
    }
  });
  document.getElementById('graficoEvolucao').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// =====================
// CALENDÁRIO
// =====================
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();
let diaSelecionado = null;

function filtrarCalendario() {
  buscaCalendario = (document.getElementById('searchCalendario')?.value || '').toLowerCase().trim();
  carregarCalendario();
}

function carregarCalendario() {
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  document.getElementById('mesAno').textContent = `${meses[mesAtual]} ${anoAtual}`;
  const grid = document.getElementById('calendarioGrid');
  grid.innerHTML = '';
  ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(dia => {
    const h = document.createElement('div');
    h.className = 'calendar-day header';
    h.textContent = dia;
    grid.appendChild(h);
  });
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate();
  for (let i = 0; i < primeiroDia; i++) grid.appendChild(document.createElement('div'));
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  for (let dia = 1; dia <= ultimoDia; dia++) {
    const dataAtual = new Date(anoAtual, mesAtual, dia); dataAtual.setHours(0, 0, 0, 0);
    const celula = document.createElement('div');
    celula.className = 'calendar-day';
    celula.textContent = dia;
    if (dataAtual.getTime() === hoje.getTime()) celula.classList.add('today');

    // Filtra consultas do dia respeitando busca
    const consultasDia = consultas.filter(c => {
      const d = new Date(c.data + 'T00:00:00'); d.setHours(0,0,0,0);
      if (d.getTime() !== dataAtual.getTime()) return false;
      if (!buscaCalendario) return true;
      const nomePaciente = (pacientes[c.pacienteIndex]?.nome || '').toLowerCase();
      return nomePaciente.includes(buscaCalendario);
    });

    if (consultasDia.length > 0) {
      celula.classList.add('has-consulta');
      // Cor baseada no status da primeira consulta do dia
      const status = consultasDia[0].status || 'Agendada';
      if (status === 'Realizada') { celula.style.background = '#059669'; celula.style.color = 'white'; }
      else if (status === 'Cancelada') { celula.style.background = '#dc2626'; celula.style.color = 'white'; }
      else if (status === 'Faltou') { celula.style.background = '#d97706'; celula.style.color = 'white'; }
      else { celula.style.background = cores[consultasDia[0].pacienteIndex % cores.length]; celula.style.color = 'white'; }
    }

    celula.onclick = () => { diaSelecionado = dataAtual; mostrarConsultasDia(dataAtual); };
    grid.appendChild(celula);
  }

  const alvo = diaSelecionado || hoje;
  mostrarConsultasDia(alvo);
}

function mostrarConsultasDia(data) {
  const container = document.getElementById('consultasDia');
  const d = new Date(data); d.setHours(0,0,0,0);

  const consultasDia = consultas.filter(c => {
    const dc = new Date(c.data + 'T00:00:00'); dc.setHours(0,0,0,0);
    if (dc.getTime() !== d.getTime()) return false;
    if (!buscaCalendario) return true;
    const nomePaciente = (pacientes[c.pacienteIndex]?.nome || '').toLowerCase();
    return nomePaciente.includes(buscaCalendario);
  });

  if (consultasDia.length === 0) {
    container.innerHTML = `<p style="padding:20px; text-align:center; color:#999;">${buscaCalendario ? 'Nenhuma consulta deste paciente neste dia.' : 'Nenhuma consulta neste dia.'}</p>`;
    return;
  }

  container.innerHTML = `<h3>${new Date(data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</h3>`;

  consultasDia.forEach((consulta, i) => {
    const paciente = pacientes[consulta.pacienteIndex];
    if (!paciente) return;

    const status = consulta.status || 'Agendada';
    const cfg = statusConfig[status] || statusConfig['Agendada'];
    const idxGlobal = consultas.indexOf(consulta);

    const div = document.createElement('div');
    div.className = 'consulta-item';
    div.style.borderLeftColor = cfg.cor;
    div.style.background = cfg.bg;
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
        <div>
          <strong>${consulta.horario}</strong> — ${consulta.tipo}<br>
          <strong>${paciente.nome}</strong>
          <span style="
            display: inline-block; margin-left: 8px;
            padding: 2px 10px; border-radius: 20px; font-size: 12px;
            background: white; color: ${cfg.cor}; border: 1px solid ${cfg.cor};
          ">
            <i class="fas ${cfg.icon}"></i> ${status}
          </span>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
          ${['Agendada','Realizada','Cancelada','Faltou'].map(s => `
            <button onclick="alterarStatusConsulta(${idxGlobal}, '${s}')" style="
              padding: 4px 10px; border-radius: 6px; border: 1px solid ${statusConfig[s].cor};
              background: ${s === status ? statusConfig[s].cor : 'white'};
              color: ${s === status ? 'white' : statusConfig[s].cor};
              font-size: 12px; cursor: pointer; white-space: nowrap;
            ">${s}</button>
          `).join('')}
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function alterarStatusConsulta(index, novoStatus) {
  if (index < 0 || index >= consultas.length) return;
  consultas[index].status = novoStatus;
  localStorage.setItem('consultas', JSON.stringify(consultas));
  agendarCloudPush();
  carregarCalendario();
}

function mesAnterior() { mesAtual--; if (mesAtual < 0) { mesAtual = 11; anoAtual--; } carregarCalendario(); }
function proximoMes() { mesAtual++; if (mesAtual > 11) { mesAtual = 0; anoAtual++; } carregarCalendario(); }

// =====================
// Modal Nova Consulta
// =====================
function abrirModalNovaConsulta() {
  atualizarSelectsPacientes();
  document.getElementById('modalConsulta').classList.add('active');
  document.getElementById('formConsulta').reset();
  const h = document.getElementById('horarioConsulta');
  if (h && !h.value) h.value = '09:00';
}

function salvarConsulta(e) {
  e.preventDefault();
  const pacienteIndex = document.getElementById('pacienteConsulta').selectedIndex - 1;
  const data = document.getElementById('dataConsulta').value;
  const horario = document.getElementById('horarioConsulta')?.value || '';
  const tipo = document.getElementById('tipoConsulta').value;
  if (pacienteIndex < 0) return alert('Selecione um paciente.');
  if (!data) return alert('Selecione a data.');
  if (!horario) return alert('Selecione o horário.');
  consultas.push({ id: Date.now(), pacienteIndex, data, horario, tipo, status: 'Agendada' });
  localStorage.setItem('consultas', JSON.stringify(consultas));
  agendarCloudPush();
  fecharModal('modalConsulta');
  carregarCalendario();
}

// =====================
// PAGAMENTOS
// =====================
function carregarPagamentos() {
  const lista = document.getElementById('listaPagamentos');
  lista.innerHTML = '';
  let totalPago = 0, totalVencido = 0, totalPendente = 0;
  const hoje = new Date().setHours(0, 0, 0, 0);
  if (pagamentos.length === 0) lista.innerHTML = '<p style="text-align:center; padding:40px; color:#999;">Nenhum pagamento cadastrado ainda.</p>';
  pagamentos.forEach((pagamento, index) => {
    const paciente = pacientes.find(p => p.id === pagamento.pacienteId);
    if (!paciente) return;
    const vencimento = new Date(pagamento.vencimento + 'T00:00:00').setHours(0, 0, 0, 0);
    const valor = parseFloat(pagamento.valor);
    if (pagamento.pago) totalPago += valor;
    else if (vencimento < hoje) totalVencido += valor;
    else totalPendente += valor;
    const item = document.createElement('div');
    item.className = 'pagamento-item';
    if (pagamento.pago) item.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
    else if (vencimento < hoje) item.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
    item.innerHTML = `
      <div class="pagamento-info">
        <h4 style="color: ${pagamento.pago ? '#059669' : '#2c3e50'}">${paciente.nome}</h4>
        <p style="color: ${pagamento.pago ? '#047857' : '#666'}"><strong>Plano:</strong> ${paciente.plano || 'Não definido'} • ${pagamento.descricao || 'Pagamento'} • Vence em ${new Date(pagamento.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
      </div>
      <div class="pagamento-valor" style="color: ${pagamento.pago ? '#059669' : '#2c3e50'}">R$ ${valor.toFixed(2)}</div>
      <div class="pagamento-status ${pagamento.pago ? 'pago' : (vencimento < hoje ? 'vencido' : '')}" onclick="togglePagamento(${index})">
        ${pagamento.pago ? '<i class="fas fa-check" style="color:white;"></i>' : ''}
      </div>
    `;
    lista.appendChild(item);
  });
  document.getElementById('totalPago').textContent = `R$ ${totalPago.toFixed(2)}`;
  document.getElementById('totalVencido').textContent = `R$ ${totalVencido.toFixed(2)}`;
  document.getElementById('totalPendente').textContent = `R$ ${totalPendente.toFixed(2)}`;
}

function togglePagamento(index) {
  pagamentos[index].pago = !pagamentos[index].pago;
  localStorage.setItem('pagamentos', JSON.stringify(pagamentos));
  agendarCloudPush();
  carregarPagamentos();
}

// =====================
// UTILS
// =====================
function atualizarSelectsPacientes() {
  const select = document.getElementById('pacienteConsulta');
  if (!select) return;
  select.innerHTML = '<option value="">Selecione...</option>';
  pacientes.forEach(p => select.innerHTML += `<option>${p.nome}</option>`);
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) { modal.classList.remove('active'); if (id === 'modalProntuario') modal.remove(); }
}

window.addEventListener('cloud-updated', () => {
  pacientes = JSON.parse(localStorage.getItem('pacientes')) || [];
  consultas = JSON.parse(localStorage.getItem('consultas')) || [];
  pagamentos = JSON.parse(localStorage.getItem('pagamentos')) || [];
  if (typeof carregarPacientes === "function") carregarPacientes();
  if (typeof carregarCalendario === "function") carregarCalendario();
  if (typeof carregarPagamentos === "function") carregarPagamentos();
  console.log("Sistema sincronizado com a nuvem!");
});