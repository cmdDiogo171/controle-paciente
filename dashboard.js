// dashboard.js

// =====================
// Dados iniciais
// =====================
let pacientes = JSON.parse(localStorage.getItem('pacientes')) || [];
let consultas = JSON.parse(localStorage.getItem('consultas')) || [];
let pagamentos = JSON.parse(localStorage.getItem('pagamentos')) || [];

// Cores para pacientes
const cores = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#30cfd0', '#a8edea'];

// =====================
// LIMPA CONSULTAS INVÁLIDAS (pacientes que não existem mais)
// =====================
function limparConsultasInvalidas() {
  consultas = consultas.filter(c => {
    return c.pacienteIndex >= 0 && c.pacienteIndex < pacientes.length;
  });
  localStorage.setItem('consultas', JSON.stringify(consultas));
}

// =====================
// Inicialização
// =====================
document.addEventListener('DOMContentLoaded', () => {
  limparConsultasInvalidas(); // LIMPA CONSULTAS INVÁLIDAS
  inicializarNavegacao();
  carregarPacientes();
  carregarCalendario();
  carregarPagamentos();
});

// =====================
// Navegação
// =====================
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
    const iniciais = (paciente.nome || '')
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const primeiraConsulta = paciente.primeiraConsulta ?
      `Primeira consulta: ${new Date(paciente.primeiraConsulta + 'T00:00:00').toLocaleDateString('pt-BR')}` : '';

    const proximoRetorno = paciente.proximoRetorno ?
      `Retorno: ${new Date(paciente.proximoRetorno + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Retorno não agendado';

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
          <button class="btn-secondary" style="padding: 8px 16px;" onclick="editarPaciente(${index})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-secondary" style="padding: 8px 16px; background: #fee; color: #ef4444;" onclick="excluirPaciente(${index})">
            <i class="fas fa-trash"></i>
          </button>
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
        ${ultima.peso ? `<div><small style="color: #666;">Peso</small><br><strong>${ultima.peso} kg</strong></div>` : ''}
        ${ultima.imc ? `<div><small style="color: #666;">IMC</small><br><strong>${ultima.imc}</strong></div>` : ''}
        ${ultima.cintura ? `<div><small style="color: #666;">Cintura</small><br><strong>${ultima.cintura} cm</strong></div>` : ''}
      </div>
    </div>
  `;
}

function togglePaciente(index) {
  const card = document.querySelectorAll('.paciente-card')[index];
  card.classList.toggle('expanded');
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

  // defaults
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

  if (plano === 'Mensal') {
    divFormaPagamento.style.display = 'none';
  } else if (plano === 'Trimestral') {
    divFormaPagamento.style.display = 'block';
    infoText.textContent = 'À vista: R$ 420 | Parcelado: 3x R$ 150';
  } else if (plano === 'Semestral') {
    divFormaPagamento.style.display = 'block';
    infoText.textContent = 'À vista: R$ 780 | Parcelado: 6x R$ 135';
  } else {
    divFormaPagamento.style.display = 'none';
  }
}

// helpers
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
    plano: plano,
    formaPagamento: formaPagamento,
    primeiraConsulta: primeiraConsulta,
    proximoRetorno: proximoRetorno,

    // novos campos (pra editar depois sem perder)
    horarioPrimeiraConsulta,
    horarioRetorno,
    vencimentoPrimeiraParcela,

    prontuario: { historico: [] }
  };

  const pacienteIndex = pacientes.length;
  pacientes.push(novoPaciente);

  // Base do vencimento: vencimentoPrimeiraParcela (se preenchido) senão primeiraConsulta
  gerarPagamentosAutomaticos(novoPaciente.id, plano, primeiraConsulta, formaPagamento, vencimentoPrimeiraParcela);

  if (primeiraConsulta) {
    consultas.push({
      id: Date.now(),
      pacienteIndex: pacienteIndex,
      data: primeiraConsulta,
      horario: horarioPrimeiraConsulta,
      tipo: 'Primeira Consulta'
    });
  }

  if (proximoRetorno) {
    consultas.push({
      id: Date.now() + 1,
      pacienteIndex: pacienteIndex,
      data: proximoRetorno,
      horario: horarioRetorno,
      tipo: 'Retorno'
    });
  }

  localStorage.setItem('pacientes', JSON.stringify(pacientes));
  localStorage.setItem('consultas', JSON.stringify(consultas));

  fecharModal('modalPaciente');
  carregarPacientes();
  atualizarSelectsPacientes();
  carregarCalendario();
  carregarPagamentos();
}

// vencimentoInicial = data (YYYY-MM-DD) opcional para 1ª parcela
function gerarPagamentosAutomaticos(pacienteId, plano, dataInicio, formaPagamento, vencimentoInicial = null) {
  if (!plano || !dataInicio) return;

  // Se o usuário escolheu o vencimento da 1ª parcela, ele manda.
  const base = vencimentoInicial || dataInicio;

  let numParcelas = 0;
  let valorParcela = 0;

  if (plano === 'Mensal') {
    numParcelas = 1;
    valorParcela = 150;
    formaPagamento = 'vista';
  } else if (plano === 'Trimestral') {
    if (formaPagamento === 'vista') {
      numParcelas = 1;
      valorParcela = 420;
    } else {
      numParcelas = 3;
      valorParcela = 150;
    }
  } else if (plano === 'Semestral') {
    if (formaPagamento === 'vista') {
      numParcelas = 1;
      valorParcela = 780;
    } else {
      numParcelas = 6;
      valorParcela = 135;
    }
  }

  for (let i = 0; i < numParcelas; i++) {
    const vencimento = addMonthsISO(base, i);

    const descricao = numParcelas === 1
      ? `${plano} - À vista`
      : `${plano} - Parcela ${i + 1}/${numParcelas}`;

    pagamentos.push({
      id: Date.now() + i,
      pacienteId: pacienteId,
      valor: valorParcela,
      vencimento: vencimento,
      descricao: descricao,
      pago: false
    });
  }

  localStorage.setItem('pagamentos', JSON.stringify(pagamentos));
}

function editarPaciente(index) {
  const paciente = pacientes[index];

  // guarda valores antigos (pra decidir se regenera pagamentos)
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

  // novos campos
  const hp = document.getElementById('horarioPrimeiraConsulta');
  const hr = document.getElementById('horarioRetorno');
  const vp = document.getElementById('vencimentoPrimeiraParcela');
  if (hp) hp.value = paciente.horarioPrimeiraConsulta || '09:00';
  if (hr) hr.value = paciente.horarioRetorno || '09:00';
  if (vp) vp.value = paciente.vencimentoPrimeiraParcela || '';

  if (paciente.plano) {
    mostrarOpcaoPagamento();
    document.getElementById('formaPagamento').value = paciente.formaPagamento || 'vista';
  }

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

    pacientes[index].nome = document.getElementById('nomePaciente').value;
    pacientes[index].idade = document.getElementById('idadePaciente').value;
    pacientes[index].whatsapp = document.getElementById('whatsappPaciente').value;

    pacientes[index].plano = planoNovo;
    pacientes[index].formaPagamento = formaPagamento;

    pacientes[index].primeiraConsulta = primeiraConsulta;
    pacientes[index].proximoRetorno = proximoRetorno;

    pacientes[index].horarioPrimeiraConsulta = horarioPrimeiraConsulta;
    pacientes[index].horarioRetorno = horarioRetorno;
    pacientes[index].vencimentoPrimeiraParcela = venc1Novo;

    // Regenera pagamentos se mudar: plano/forma/dataInicio/venc1
    const mudouPagamento =
      (planoNovo !== planoAntigo) ||
      (formaPagamento !== formaPagamentoAntiga) ||
      (primeiraConsulta !== primeiraConsultaAntiga) ||
      (venc1Novo !== venc1Antigo);

    if (mudouPagamento) {
      pagamentos = pagamentos.filter(p => p.pacienteId !== paciente.id);
      gerarPagamentosAutomaticos(paciente.id, planoNovo, primeiraConsulta, formaPagamento, venc1Novo);
      localStorage.setItem('pagamentos', JSON.stringify(pagamentos));
    }

    // Regenera consultas do paciente (com as horas escolhidas)
    consultas = consultas.filter(c => c.pacienteIndex !== index);

    if (primeiraConsulta) {
      consultas.push({
        id: Date.now(),
        pacienteIndex: index,
        data: primeiraConsulta,
        horario: horarioPrimeiraConsulta,
        tipo: 'Primeira Consulta'
      });
    }

    if (proximoRetorno) {
      consultas.push({
        id: Date.now() + 1,
        pacienteIndex: index,
        data: proximoRetorno,
        horario: horarioRetorno,
        tipo: 'Retorno'
      });
    }

    localStorage.setItem('pacientes', JSON.stringify(pacientes));
    localStorage.setItem('consultas', JSON.stringify(consultas));

    fecharModal('modalPaciente');
    carregarPacientes();
    atualizarSelectsPacientes();
    carregarCalendario();
    carregarPagamentos();

    document.getElementById('formPaciente').onsubmit = salvarPaciente;
  };
}

function excluirPaciente(index) {
  const paciente = pacientes[index];

  if (confirm(`Tem certeza que deseja excluir ${paciente.nome}?\n\nIsso também apagará:\n• Consultas agendadas\n• Pagamentos\n• Prontuário`)) {
    // Remove paciente
    pacientes.splice(index, 1);

    // Remove consultas do paciente excluído
    consultas = consultas.filter(c => c.pacienteIndex !== index);

    // Atualiza índices das consultas dos pacientes seguintes
    consultas = consultas.map(c => {
      if (c.pacienteIndex > index) {
        return { ...c, pacienteIndex: c.pacienteIndex - 1 };
      }
      return c;
    });

    // Remove pagamentos
    pagamentos = pagamentos.filter(p => p.pacienteId !== paciente.id);

    localStorage.setItem('pacientes', JSON.stringify(pacientes));
    localStorage.setItem('consultas', JSON.stringify(consultas));
    localStorage.setItem('pagamentos', JSON.stringify(pagamentos));

    carregarPacientes();
    atualizarSelectsPacientes();
    carregarCalendario();
    carregarPagamentos();
  }
}

// =====================
// PRONTUÁRIO COM HISTÓRICO
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
            ${historico.length >= 2 ? `
              <button type="button" class="btn-secondary" onclick="mostrarGraficoEvolucao(${index})">
                <i class="fas fa-chart-line"></i> Ver Evolução
              </button>
            ` : ''}
            <button type="button" class="btn-primary" onclick="abrirFormularioAvaliacao(${index})">
              <i class="fas fa-plus"></i> Nova Avaliação
            </button>
          </div>
        </div>

        <div id="graficoEvolucao" style="display: none; margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4 style="color: #667eea; margin: 0;">Evolução do Paciente</h4>
            <button type="button" class="btn-secondary" onclick="document.getElementById('graficoEvolucao').style.display='none'" style="padding: 5px 10px;">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <canvas id="chartEvolucao" style="max-height: 300px;"></canvas>
        </div>

        <div id="listaAvaliacoes" style="max-height: 500px; overflow-y: auto;">
          ${historico.length === 0 ?
            '<p style="text-align: center; color: #999; padding: 40px;">Nenhuma avaliação registrada ainda.</p>'
            : historico.map((av, idx) => `
              <div class="avaliacao-item" onclick="visualizarAvaliacao(${index}, ${idx})" style="
                background: #f8f9fa;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 8px;
                cursor: pointer;
                border-left: 4px solid #667eea;
                transition: all 0.3s;
              " onmouseover="this.style.background='#e0e7ff'" onmouseout="this.style.background='#f8f9fa'">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="font-size: 16px;">${new Date(av.data).toLocaleDateString('pt-BR')}</strong>
                    <p style="margin: 5px 0 0; color: #666; font-size: 14px;">
                      Peso: ${av.peso || '-'} kg | IMC: ${av.imc || '-'} | Cintura: ${av.cintura || '-'} cm
                    </p>
                  </div>
                  <button onclick="event.stopPropagation(); excluirAvaliacao(${index}, ${idx})" style="
                    background: #fee;
                    color: #ef4444;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                  ">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).reverse().join('')
          }
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
          <div class="form-group">
            <label>Peso atual (kg)</label>
            <input type="number" step="0.1" id="peso" value="${avaliacao?.peso || ''}">
          </div>
          <div class="form-group">
            <label>Altura (m)</label>
            <input type="number" step="0.01" id="altura" value="${avaliacao?.altura || ''}">
          </div>
          <div class="form-group">
            <label>IMC (kg/m²)</label>
            <input type="number" step="0.1" id="imc" value="${avaliacao?.imc || ''}" readonly style="background: #f0f0f0;">
          </div>
        </div>

        <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
          <div class="form-group">
            <label>Peso usual (kg)</label>
            <input type="number" step="0.1" id="pesoUsual" value="${avaliacao?.pesoUsual || ''}">
          </div>
          <div class="form-group">
            <label>Peso ideal (kg)</label>
            <input type="number" step="0.1" id="pesoIdeal" value="${avaliacao?.pesoIdeal || ''}">
          </div>
          <div class="form-group">
            <label>Peso ajustado (kg)</label>
            <input type="number" step="0.1" id="pesoAjustado" value="${avaliacao?.pesoAjustado || ''}">
          </div>
        </div>

        <h4 style="margin: 25px 0 15px; color: #667eea;">Circunferências (cm)</h4>
        <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
          <div class="form-group">
            <label>Cintura</label>
            <input type="number" step="0.1" id="cintura" value="${avaliacao?.cintura || ''}">
          </div>
          <div class="form-group">
            <label>Quadril</label>
            <input type="number" step="0.1" id="quadril" value="${avaliacao?.quadril || ''}">
          </div>
          <div class="form-group">
            <label>Relação cintura/quadril</label>
            <input type="number" step="0.01" id="relacaoCQ" value="${avaliacao?.relacaoCQ || ''}" readonly style="background: #f0f0f0;">
          </div>
        </div>

        <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
          <div class="form-group">
            <label>Braço</label>
            <input type="number" step="0.1" id="braco" value="${avaliacao?.braco || ''}">
          </div>
          <div class="form-group">
            <label>Circunf. muscular braço</label>
            <input type="number" step="0.1" id="bracoMuscular" value="${avaliacao?.bracoMuscular || ''}">
          </div>
          <div class="form-group">
            <label>Panturrilha</label>
            <input type="number" step="0.1" id="panturrilha" value="${avaliacao?.panturrilha || ''}">
          </div>
        </div>

        <div class="form-group">
          <label>Pescoço (cm)</label>
          <input type="number" step="0.1" id="pescoco" value="${avaliacao?.pescoco || ''}">
        </div>

        <h4 style="margin: 25px 0 15px; color: #667eea;">Dobras Cutâneas (mm)</h4>
        <div class="form-row">
          <div class="form-group">
            <label>Tricipital (DCT)</label>
            <input type="number" step="0.1" id="dct" value="${avaliacao?.dct || ''}">
          </div>
          <div class="form-group">
            <label>Bicipital (DCB)</label>
            <input type="number" step="0.1" id="dcb" value="${avaliacao?.dcb || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Subescapular (DCSE)</label>
            <input type="number" step="0.1" id="dcse" value="${avaliacao?.dcse || ''}">
          </div>
          <div class="form-group">
            <label>Supra-ilíaca (DCSI)</label>
            <input type="number" step="0.1" id="dcsi" value="${avaliacao?.dcsi || ''}">
          </div>
        </div>

        <h4 style="margin: 25px 0 15px; color: #667eea;">Metabolismo e Dieta</h4>
        <div class="form-row">
          <div class="form-group">
            <label>TMB (kcal)</label>
            <input type="number" id="tmb" value="${avaliacao?.tmb || ''}">
          </div>
          <div class="form-group">
            <label>VET (kcal)</label>
            <input type="number" id="vet" value="${avaliacao?.vet || ''}">
          </div>
        </div>

        <h4 style="margin: 25px 0 15px; color: #667eea;">Macronutrientes</h4>
        <div class="form-row" style="grid-template-columns: 1fr 1fr;">
          <div class="form-group">
            <label>Carboidratos (%)</label>
            <input type="number" step="0.1" id="carbPct" value="${avaliacao?.carbPct || ''}">
          </div>
          <div class="form-group">
            <label>Carboidratos (g)</label>
            <input type="number" step="0.1" id="carbG" value="${avaliacao?.carbG || ''}">
          </div>
        </div>
        <div class="form-row" style="grid-template-columns: 1fr 1fr;">
          <div class="form-group">
            <label>Proteínas (%)</label>
            <input type="number" step="0.1" id="protPct" value="${avaliacao?.protPct || ''}">
          </div>
          <div class="form-group">
            <label>Proteínas (g)</label>
            <input type="number" step="0.1" id="protG" value="${avaliacao?.protG || ''}">
          </div>
        </div>
        <div class="form-row" style="grid-template-columns: 1fr 1fr;">
          <div class="form-group">
            <label>Lipídios (%)</label>
            <input type="number" step="0.1" id="lipPct" value="${avaliacao?.lipPct || ''}">
          </div>
          <div class="form-group">
            <label>Lipídios (g)</label>
            <input type="number" step="0.1" id="lipG" value="${avaliacao?.lipG || ''}">
          </div>
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

  // NOVO: gramas automáticas a partir das porcentagens (4/4/9)
  ['vet', 'carbPct', 'protPct', 'lipPct'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcularGramasMacrosPorPct);
  });
  calcularGramasMacrosPorPct();
}

function calcularIMC() {
  const peso = parseFloat(document.getElementById('peso').value);
  const altura = parseFloat(document.getElementById('altura').value);
  if (peso && altura) {
    const imc = (peso / (altura * altura)).toFixed(1);
    document.getElementById('imc').value = imc;
  }
}

function calcularRelacaoCQ() {
  const cintura = parseFloat(document.getElementById('cintura').value);
  const quadril = parseFloat(document.getElementById('quadril').value);
  if (cintura && quadril) {
    const relacao = (cintura / quadril).toFixed(2);
    document.getElementById('relacaoCQ').value = relacao;
  }
}

// =====================
// NOVO: calcula gramas do macro a partir do VET e % preenchida
// CHO = 4 kcal/g, PTN = 4 kcal/g, LIP = 9 kcal/g
// =====================
function calcularGramasMacrosPorPct() {
  const vetEl = document.getElementById('vet');
  if (!vetEl) return;

  const vet = parseFloat(vetEl.value);
  if (!Number.isFinite(vet) || vet <= 0) return;

  const macros = [
    { pctId: 'carbPct', gId: 'carbG', kcalPorG: 4 },
    { pctId: 'protPct', gId: 'protG', kcalPorG: 4 },
    { pctId: 'lipPct',  gId: 'lipG',  kcalPorG: 9 }
  ];

  macros.forEach(m => {
    const pctEl = document.getElementById(m.pctId);
    const gEl = document.getElementById(m.gId);
    if (!pctEl || !gEl) return;

    // Só calcula se a % foi preenchida (não mexe nas outras)
    if (pctEl.value === '') return;

    const pct = parseFloat(pctEl.value);
    if (!Number.isFinite(pct) || pct < 0) return;

    const g = (vet * (pct / 100)) / m.kcalPorG;
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
    lipPct: parseFloat(document.getElementById('lipPct').value) || null,
    lipG: parseFloat(document.getElementById('lipG').value) || null,
    observacoes: document.getElementById('observacoes').value
  };

  if (!pacientes[pacienteIndex].prontuario) {
    pacientes[pacienteIndex].prontuario = { historico: [] };
  }

  if (avaliacaoIndex !== null) {
    pacientes[pacienteIndex].prontuario.historico[avaliacaoIndex] = novaAvaliacao;
  } else {
    pacientes[pacienteIndex].prontuario.historico.push(novaAvaliacao);
  }

  localStorage.setItem('pacientes', JSON.stringify(pacientes));

  abrirModalProntuario(pacienteIndex);
  carregarPacientes();
}

function visualizarAvaliacao(pacienteIndex, avaliacaoIndex) {
  abrirFormularioAvaliacao(pacienteIndex, avaliacaoIndex);
}

function excluirAvaliacao(pacienteIndex, avaliacaoIndex) {
  if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
    pacientes[pacienteIndex].prontuario.historico.splice(avaliacaoIndex, 1);
    localStorage.setItem('pacientes', JSON.stringify(pacientes));
    abrirModalProntuario(pacienteIndex);
    carregarPacientes();
  }
}

// =====================
// GRÁFICO DE EVOLUÇÃO
// =====================
function mostrarGraficoEvolucao(pacienteIndex) {
  const paciente = pacientes[pacienteIndex];
  const historico = paciente.prontuario?.historico || [];

  if (historico.length < 2) {
    alert('É necessário pelo menos 2 avaliações para gerar o gráfico de evolução.');
    return;
  }

  // Ordena por data
  const historicoOrdenado = [...historico].sort((a, b) => new Date(a.data) - new Date(b.data));

  const labels = historicoOrdenado.map(h => new Date(h.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
  const pesos = historicoOrdenado.map(h => h.peso);
  const imcs = historicoOrdenado.map(h => h.imc);
  const cinturas = historicoOrdenado.map(h => h.cintura);

  // Mostra o container do gráfico
  document.getElementById('graficoEvolucao').style.display = 'block';

  // Destrói gráfico anterior se existir
  if (window.chartEvolucaoInstance) {
    window.chartEvolucaoInstance.destroy();
  }

  const ctx = document.getElementById('chartEvolucao');

  window.chartEvolucaoInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Peso (kg)',
          data: pesos,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'IMC',
          data: imcs,
          borderColor: '#764ba2',
          backgroundColor: 'rgba(118, 75, 162, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        },
        {
          label: 'Cintura (cm)',
          data: cinturas,
          borderColor: '#f093fb',
          backgroundColor: 'rgba(240, 147, 251, 0.1)',
          tension: 0.4,
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { position: 'top' },
        title: { display: false }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Peso (kg)' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'IMC' },
          grid: { drawOnChartArea: false }
        },
        y2: {
          type: 'linear',
          display: false,
          position: 'right'
        }
      }
    }
  });

  // Scroll suave até o gráfico
  document.getElementById('graficoEvolucao').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// =====================
// CALENDÁRIO
// =====================
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();

function carregarCalendario() {
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  document.getElementById('mesAno').textContent = `${meses[mesAtual]} ${anoAtual}`;

  const grid = document.getElementById('calendarioGrid');
  grid.innerHTML = '';

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  diasSemana.forEach(dia => {
    const header = document.createElement('div');
    header.className = 'calendar-day header';
    header.textContent = dia;
    grid.appendChild(header);
  });

  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate();

  for (let i = 0; i < primeiroDia; i++) {
    grid.appendChild(document.createElement('div'));
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const dataAtual = new Date(anoAtual, mesAtual, dia);
    dataAtual.setHours(0, 0, 0, 0);

    const celula = document.createElement('div');
    celula.className = 'calendar-day';
    celula.textContent = dia;

    if (dataAtual.getTime() === hoje.getTime()) {
      celula.classList.add('today');
    }

    const consultasDia = consultas.filter(c => {
      const dataConsulta = new Date(c.data + 'T00:00:00');
      dataConsulta.setHours(0, 0, 0, 0);
      return dataConsulta.getTime() === dataAtual.getTime();
    });

    if (consultasDia.length > 0) {
      celula.classList.add('has-consulta');
      celula.style.background = cores[consultasDia[0].pacienteIndex % cores.length];
      celula.style.color = 'white';
    }

    celula.onclick = () => mostrarConsultasDia(dataAtual);
    grid.appendChild(celula);
  }

  mostrarConsultasDia(hoje);
}

function mostrarConsultasDia(data) {
  const container = document.getElementById('consultasDia');
  const consultasDia = consultas.filter(c => {
    const dataConsulta = new Date(c.data + 'T00:00:00');
    dataConsulta.setHours(0, 0, 0, 0);
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return dataConsulta.getTime() === d.getTime();
  });

  if (consultasDia.length === 0) {
    container.innerHTML = '<p style="padding:20px; text-align:center; color:#999;">Nenhuma consulta neste dia.</p>';
    return;
  }

  container.innerHTML = `<h3>${new Date(data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</h3>`;

  consultasDia.forEach(consulta => {
    const paciente = pacientes[consulta.pacienteIndex];
    if (!paciente) return;

    const div = document.createElement('div');
    div.className = 'consulta-item';
    div.style.borderLeftColor = cores[consulta.pacienteIndex % cores.length];
    div.innerHTML = `
      <strong>${consulta.horario}</strong> - ${consulta.tipo}<br>
      <strong>${paciente.nome}</strong>
    `;
    container.appendChild(div);
  });
}

function mesAnterior() {
  mesAtual--;
  if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
  carregarCalendario();
}

function proximoMes() {
  mesAtual++;
  if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
  carregarCalendario();
}

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

  consultas.push({
    id: Date.now(),
    pacienteIndex: pacienteIndex,
    data: data,
    horario: horario,
    tipo: tipo
  });

  localStorage.setItem('consultas', JSON.stringify(consultas));

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

  if (pagamentos.length === 0) {
    lista.innerHTML = '<p style="text-align:center; padding:40px; color:#999;">Nenhum pagamento cadastrado ainda.</p>';
  }

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
        <p style="color: ${pagamento.pago ? '#047857' : '#666'}">
          <strong>Plano:</strong> ${paciente.plano || 'Não definido'} • ${pagamento.descricao || 'Pagamento'} •
          Vence em ${new Date(pagamento.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
        </p>
      </div>
      <div class="pagamento-valor" style="color: ${pagamento.pago ? '#059669' : '#2c3e50'}">R$ ${valor.toFixed(2)}</div>
      <div class="pagamento-status ${pagamento.pago ? 'pago' : (vencimento < hoje ? 'vencido' : '')}"
           onclick="togglePagamento(${index})">
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
  carregarPagamentos();
}

// =====================
// UTILS
// =====================
function atualizarSelectsPacientes() {
  const selects = [document.getElementById('pacienteConsulta')];
  selects.forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">Selecione...</option>';
    pacientes.forEach(p => {
      select.innerHTML += `<option>${p.nome}</option>`;
    });
  });
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    if (id === 'modalProntuario') {
      modal.remove();
    }
  }
}

function exportarBackup() {
  const dados = { pacientes, consultas, pagamentos };
  const blob = new Blob([JSON.stringify(dados)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-nutricao-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

function importarBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const dados = JSON.parse(event.target.result);

    pacientes = dados.pacientes || [];
    consultas = dados.consultas || [];
    pagamentos = dados.pagamentos || [];

    localStorage.setItem('pacientes', JSON.stringify(pacientes));
    localStorage.setItem('consultas', JSON.stringify(consultas));
    localStorage.setItem('pagamentos', JSON.stringify(pagamentos));

    Promise
      .resolve(window.cloudPush?.())
      .finally(() => {
        alert('Backup restaurado com sucesso!');
        location.reload();
      });
  };

  reader.readAsText(file);
}
