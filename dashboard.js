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
  consultas = consultas.filter(c => c.pacienteIndex >= 0 && c.pacienteIndex < pacientes.length);
  localStorage.setItem('consultas', JSON.stringify(consultas));
}

// =====================
// Inicialização
// =====================
document.addEventListener('DOMContentLoaded', () => {
  limparConsultasInvalidas();
  inicializarNavegacao();
  carregarPacientes();
  carregarCalendario();
  carregarPagamentos();

  bindModalUX();
  bindAutosaveDraftPaciente();

  // Marcação padrão do modal paciente
  const modalPaciente = document.getElementById('modalPaciente');
  if (modalPaciente) modalPaciente.dataset.mode = 'new';
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

    const primeiraConsulta = paciente.primeiraConsulta
      ? `Primeira consulta: ${new Date(paciente.primeiraConsulta + 'T00:00:00').toLocaleDateString('pt-BR')}`
      : '';

    const proximoRetorno = paciente.proximoRetorno
      ? `Retorno: ${new Date(paciente.proximoRetorno + 'T00:00:00').toLocaleDateString('pt-BR')}`
      : 'Retorno não agendado';

    const card = document.createElement('div');
    card.className = 'paciente-card';
    card.innerHTML = `
      <div class="paciente-header" onclick="togglePaciente(${index})">
        <div class="paciente-avatar" style="background: ${cor}">${iniciais}</div>
        <div class="paciente-info" style="flex: 1;">
          <h3>${paciente.nome}</h3>
          <p>${paciente.idade} anos ${paciente.whatsapp ? '• ' + paciente.whatsapp : ''}</p>
          <p style="margin-top: 8px; font-size: 13px; color: #667eea;">
            <strong>Plano:</strong> ${paciente.plano || 'Não definido'}
            ${paciente.formaPagamento ? '(' + (paciente.formaPagamento === 'vista' ? 'à vista' : 'parcelado') + ')' : ''}
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
  if (card) card.classList.toggle('expanded');
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
  const modal = document.getElementById('modalPaciente');
  modal.classList.add('active');
  modal.dataset.mode = 'new';

  const form = document.getElementById('formPaciente');
  form.reset();

  document.getElementById('formaPagamentoDiv').style.display = 'none';
  form.onsubmit = salvarPaciente;

  aplicarDraftPacienteSeExistir();
  focusPrimeiroCampo('modalPaciente');
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

function salvarPaciente(e) {
  e.preventDefault();

  const plano = document.getElementById('planoPaciente').value;
  const primeiraConsulta = document.getElementById('primeiraConsulta').value;
  const proximoRetorno = document.getElementById('proximoRetorno').value;

  // Se o plano for Mensal, força vista (e o select pode estar escondido)
  const formaPagamentoEl = document.getElementById('formaPagamento');
  const formaPagamento = (plano === 'Mensal')
    ? 'vista'
    : (formaPagamentoEl ? formaPagamentoEl.value : 'vista');

  const novoPaciente = {
    id: Date.now(),
    nome: document.getElementById('nomePaciente').value,
    idade: document.getElementById('idadePaciente').value,
    whatsapp: document.getElementById('whatsappPaciente').value,
    plano,
    formaPagamento,
    primeiraConsulta,
    proximoRetorno,
    prontuario: { historico: [] }
  };

  const pacienteIndex = pacientes.length;
  pacientes.push(novoPaciente);

  gerarPagamentosAutomaticos(novoPaciente.id, plano, primeiraConsulta, formaPagamento);

  if (primeiraConsulta) {
    consultas.push({
      id: Date.now(),
      pacienteIndex,
      data: primeiraConsulta,
      horario: '09:00',
      tipo: 'Primeira Consulta'
    });
  }

  if (proximoRetorno) {
    consultas.push({
      id: Date.now() + 1,
      pacienteIndex,
      data: proximoRetorno,
      horario: '09:00',
      tipo: 'Retorno'
    });
  }

  localStorage.setItem('pacientes', JSON.stringify(pacientes));
  localStorage.setItem('consultas', JSON.stringify(consultas));

  clearDraftPaciente();
  fecharModal('modalPaciente');

  carregarPacientes();
  atualizarSelectsPacientes();
  carregarCalendario();
  carregarPagamentos();
}

function gerarPagamentosAutomaticos(pacienteId, plano, dataInicio, formaPagamento) {
  if (!plano || !dataInicio) return;

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
    const dataVencimento = new Date(dataInicio + 'T00:00:00');
    dataVencimento.setDate(dataVencimento.getDate() + (i * 30));

    const descricao = (numParcelas === 1)
      ? `${plano} - À vista`
      : `${plano} - Parcela ${i + 1}/${numParcelas}`;

    pagamentos.push({
      id: Date.now() + i,
      pacienteId,
      valor: valorParcela,
      vencimento: dataVencimento.toISOString().split('T')[0],
      descricao,
      pago: false
    });
  }

  localStorage.setItem('pagamentos', JSON.stringify(pagamentos));
}

function editarPaciente(index) {
  const paciente = pacientes[index];
  if (!paciente) return;

  document.getElementById('nomePaciente').value = paciente.nome;
  document.getElementById('idadePaciente').value = paciente.idade;
  document.getElementById('whatsappPaciente').value = paciente.whatsapp || '';
  document.getElementById('planoPaciente').value = paciente.plano || '';
  document.getElementById('primeiraConsulta').value = paciente.primeiraConsulta || '';
  document.getElementById('proximoRetorno').value = paciente.proximoRetorno || '';

  if (paciente.plano) {
    mostrarOpcaoPagamento();
    const fp = document.getElementById('formaPagamento');
    if (fp) fp.value = paciente.formaPagamento || 'vista';
  }

  const modal = document.getElementById('modalPaciente');
  modal.classList.add('active');
  modal.dataset.mode = 'edit';

  const form = document.getElementById('formPaciente');

  form.onsubmit = (e) => {
    e.preventDefault();

    const planoNovo = document.getElementById('planoPaciente').value;
    const planoAntigo = paciente.plano;

    const primeiraConsulta = document.getElementById('primeiraConsulta').value;
    const proximoRetorno = document.getElementById('proximoRetorno').value;

    const formaPagamentoEl = document.getElementById('formaPagamento');
    const formaPagamento = (planoNovo === 'Mensal')
      ? 'vista'
      : (formaPagamentoEl ? formaPagamentoEl.value : 'vista');

    const formaPagamentoAntiga = paciente.formaPagamento;

    pacientes[index].nome = document.getElementById('nomePaciente').value;
    pacientes[index].idade = document.getElementById('idadePaciente').value;
    pacientes[index].whatsapp = document.getElementById('whatsappPaciente').value;
    pacientes[index].plano = planoNovo;
    pacientes[index].formaPagamento = formaPagamento;
    pacientes[index].primeiraConsulta = primeiraConsulta;
    pacientes[index].proximoRetorno = proximoRetorno;

    if (planoNovo !== planoAntigo || formaPagamento !== formaPagamentoAntiga) {
      pagamentos = pagamentos.filter(p => p.pacienteId !== paciente.id);
      gerarPagamentosAutomaticos(paciente.id, planoNovo, primeiraConsulta, formaPagamento);
      localStorage.setItem('pagamentos', JSON.stringify(pagamentos));
    }

    // Atualiza consultas do paciente
    consultas = consultas.filter(c => c.pacienteIndex !== index);

    if (primeiraConsulta) {
      consultas.push({
        id: Date.now(),
        pacienteIndex: index,
        data: primeiraConsulta,
        horario: '09:00',
        tipo: 'Primeira Consulta'
      });
    }

    if (proximoRetorno) {
      consultas.push({
        id: Date.now() + 1,
        pacienteIndex: index,
        data: proximoRetorno,
        horario: '09:00',
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

    // volta submit padrão
    form.onsubmit = salvarPaciente;
  };

  focusPrimeiroCampo('modalPaciente');
}

function excluirPaciente(index) {
  const paciente = pacientes[index];
  if (!paciente) return;

  if (confirm(`Tem certeza que deseja excluir ${paciente.nome}?\n\nIsso também apagará:\n• Consultas agendadas\n• Pagamentos\n• Prontuário`)) {
    pacientes.splice(index, 1);

    // Remove consultas do paciente excluído
    consultas = consultas.filter(c => c.pacienteIndex !== index);

    // Atualiza índices de quem veio depois
    consultas = consultas.map(c => {
      if (c.pacienteIndex > index) return { ...c, pacienteIndex: c.pacienteIndex - 1 };
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
  if (!paciente) return;

  const historico = paciente.prontuario?.historico || [];

  const modalHTML = `
    <div id="modalProntuario" class="modal active">
      <div class="modal-content" style="max-width: 1000px;">
        <span class="close" onclick="fecharModal('modalProntuario')">&times;</span>
        <h2>Prontuário - ${paciente.nome}</h2>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 10px; flex-wrap: wrap;">
          <h3 style="color: #667eea;">Histórico de Avaliações</h3>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
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
          ${
            historico.length === 0
              ? '<p style="text-align: center; color: #999; padding: 40px;">Nenhuma avaliação registrada ainda.</p>'
              : historico.map((av, idx) => `
                <div class="avaliacao-item" onclick="visualizarAvaliacao(${index}, ${idx})">
                  <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div>
                      <strong style="font-size: 16px;">${new Date(av.data).toLocaleDateString('pt-BR')}</strong>
                      <p style="margin: 5px 0 0; color: #666; font-size: 14px;">
                        Peso: ${av.peso ?? '-'} kg | IMC: ${av.imc ?? '-'} | Cintura: ${av.cintura ?? '-'} cm
                      </p>
                    </div>
                    <button onclick="event.stopPropagation(); excluirAvaliacao(${index}, ${idx})"
                      style="background: #fee; color: #ef4444; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">
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

/* ======= WIZARD: formulário segmentado ======= */
function abrirFormularioAvaliacao(pacienteIndex, avaliacaoIndex = null) {
  const paciente = pacientes[pacienteIndex];
  if (!paciente) return;

  if (!paciente.prontuario) paciente.prontuario = { historico: [] };

  const avaliacao = avaliacaoIndex !== null ? paciente.prontuario.historico[avaliacaoIndex] : null;
  const titulo = avaliacao ? 'Editar Avaliação' : 'Nova Avaliação';

  document.getElementById('modalProntuario').innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <span class="close" onclick="fecharModal('modalProntuario')">&times;</span>
      <h2>${titulo} - ${paciente.nome}</h2>

      <div class="wizard" id="wizardAvaliacao">
        <div class="wizard-top">
          <div class="wizard-title">Preenchimento por etapas</div>
          <div class="wizard-progress" aria-hidden="true"><div id="wizardBar"></div></div>
        </div>

        <div class="wizard-steps" id="wizardPills">
          <div class="wizard-step-pill" data-step="1"><span class="n">1</span> Básico</div>
          <div class="wizard-step-pill" data-step="2"><span class="n">2</span> Circunf.</div>
          <div class="wizard-step-pill" data-step="3"><span class="n">3</span> Dobras</div>
          <div class="wizard-step-pill" data-step="4"><span class="n">4</span> Dieta</div>
        </div>

        <div class="wizard-body">
          <form id="formAvaliacao" onsubmit="salvarAvaliacao(event, ${pacienteIndex}, ${avaliacaoIndex})">

            <!-- STEP 1 -->
            <div class="wizard-step" data-step="1">
              <div class="form-group compact">
                <label>Data da Avaliação *</label>
                <input type="date" id="dataAvaliacao"
                  value="${avaliacao?.data?.split('T')[0] || new Date().toISOString().split('T')[0]}"
                  required>
              </div>

              <h4 style="margin: 18px 0 10px; color: #667eea;">Medidas Antropométricas</h4>
              <div class="form-row compact">
                <div class="form-group compact">
                  <label>Peso</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="peso" value="${avaliacao?.peso ?? ''}" inputmode="decimal" placeholder="Ex: 72.5">
                    <span class="unit">kg</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>Altura</label>
                  <div class="input-unit">
                    <input type="number" step="0.01" id="altura" value="${avaliacao?.altura ?? ''}" inputmode="decimal" placeholder="Ex: 1.72">
                    <span class="unit">m</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>IMC</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="imc" value="${avaliacao?.imc ?? ''}" readonly style="background:#f0f0f0;">
                    <span class="unit">kg/m²</span>
                  </div>
                </div>
              </div>

              <div class="form-row compact">
                <div class="form-group compact">
                  <label>Peso usual</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="pesoUsual" value="${avaliacao?.pesoUsual ?? ''}" inputmode="decimal">
                    <span class="unit">kg</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>Peso ideal</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="pesoIdeal" value="${avaliacao?.pesoIdeal ?? ''}" inputmode="decimal">
                    <span class="unit">kg</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>Peso ajustado</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="pesoAjustado" value="${avaliacao?.pesoAjustado ?? ''}" inputmode="decimal">
                    <span class="unit">kg</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- STEP 2 -->
            <div class="wizard-step" data-step="2">
              <h4 style="margin: 0 0 10px; color: #667eea;">Circunferências</h4>

              <div class="form-row compact">
                <div class="form-group compact">
                  <label>Cintura</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="cintura" value="${avaliacao?.cintura ?? ''}" inputmode="decimal">
                    <span class="unit">cm</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>Quadril</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="quadril" value="${avaliacao?.quadril ?? ''}" inputmode="decimal">
                    <span class="unit">cm</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>Relação C/Q</label>
                  <input type="number" step="0.01" id="relacaoCQ" value="${avaliacao?.relacaoCQ ?? ''}" readonly style="background:#f0f0f0;">
                </div>
              </div>

              <div class="form-row compact">
                <div class="form-group compact">
                  <label>Braço</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="braco" value="${avaliacao?.braco ?? ''}" inputmode="decimal">
                    <span class="unit">cm</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>Braço muscular</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="bracoMuscular" value="${avaliacao?.bracoMuscular ?? ''}" inputmode="decimal">
                    <span class="unit">cm</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>Panturrilha</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="panturrilha" value="${avaliacao?.panturrilha ?? ''}" inputmode="decimal">
                    <span class="unit">cm</span>
                  </div>
                </div>
              </div>

              <div class="form-row compact">
                <div class="form-group compact">
                  <label>Pescoço</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="pescoco" value="${avaliacao?.pescoco ?? ''}" inputmode="decimal">
                    <span class="unit">cm</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- STEP 3 -->
            <div class="wizard-step" data-step="3">
              <h4 style="margin: 0 0 10px; color: #667eea;">Dobras Cutâneas</h4>

              <div class="form-row compact">
                <div class="form-group compact">
                  <label>Tricipital (DCT)</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="dct" value="${avaliacao?.dct ?? ''}" inputmode="decimal">
                    <span class="unit">mm</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>Bicipital (DCB)</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="dcb" value="${avaliacao?.dcb ?? ''}" inputmode="decimal">
                    <span class="unit">mm</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>Subescapular (DCSE)</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="dcse" value="${avaliacao?.dcse ?? ''}" inputmode="decimal">
                    <span class="unit">mm</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>Supra-ilíaca (DCSI)</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="dcsi" value="${avaliacao?.dcsi ?? ''}" inputmode="decimal">
                    <span class="unit">mm</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- STEP 4 -->
            <div class="wizard-step" data-step="4">
              <h4 style="margin: 0 0 10px; color: #667eea;">Metabolismo, macros e conduta</h4>

              <div class="form-row compact">
                <div class="form-group compact">
                  <label>TMB</label>
                  <div class="input-unit">
                    <input type="number" id="tmb" value="${avaliacao?.tmb ?? ''}" inputmode="numeric">
                    <span class="unit">kcal</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>VET</label>
                  <div class="input-unit">
                    <input type="number" id="vet" value="${avaliacao?.vet ?? ''}" inputmode="numeric">
                    <span class="unit">kcal</span>
                  </div>
                </div>
              </div>

              <div class="form-row compact">
                <div class="form-group compact">
                  <label>Carbo (%)</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="carbPct" value="${avaliacao?.carbPct ?? ''}" inputmode="decimal">
                    <span class="unit">%</span>
                  </div>
                </div>
                <div class="form-group compact">
                  <label>Carbo (g)</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="carbG" value="${avaliacao?.carbG ?? ''}" inputmode="decimal">
                    <span class="unit">g</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>Prot (%)</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="protPct" value="${avaliacao?.protPct ?? ''}" inputmode="decimal">
                    <span class="unit">%</span>
                  </div>
                </div>
                <div class="form-group compact">
                  <label>Prot (g)</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="protG" value="${avaliacao?.protG ?? ''}" inputmode="decimal">
                    <span class="unit">g</span>
                  </div>
                </div>

                <div class="form-group compact">
                  <label>Lip (%)</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="lipPct" value="${avaliacao?.lipPct ?? ''}" inputmode="decimal">
                    <span class="unit">%</span>
                  </div>
                </div>
                <div class="form-group compact">
                  <label>Lip (g)</label>
                  <div class="input-unit">
                    <input type="number" step="0.1" id="lipG" value="${avaliacao?.lipG ?? ''}" inputmode="decimal">
                    <span class="unit">g</span>
                  </div>
                </div>
              </div>

              <div class="form-group compact">
                <label>Conduta Nutricional</label>
                <textarea id="observacoes" rows="3" placeholder="Ex: reduzir ultraprocessados, ajustar proteína, aumentar fibras...">${avaliacao?.observacoes ?? ''}</textarea>
              </div>
            </div>

            <div class="wizard-actions">
              <button type="button" class="btn-secondary" onclick="abrirModalProntuario(${pacienteIndex})">Voltar</button>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="btn-secondary" id="wizardPrev">Anterior</button>
                <button type="button" class="btn-primary" id="wizardNext">Próximo</button>
                <button type="submit" class="btn-primary" id="wizardSave" style="display:none;">Salvar</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Mantém os cálculos automáticos (mesmos IDs que salvarAvaliacao usa)
  document.getElementById('peso').addEventListener('input', calcularIMC);
  document.getElementById('altura').addEventListener('input', calcularIMC);
  document.getElementById('cintura').addEventListener('input', calcularRelacaoCQ);
  document.getElementById('quadril').addEventListener('input', calcularRelacaoCQ);

  initWizardAvaliacao(4);
}

function initWizardAvaliacao(totalSteps = 4) {
  const wizard = document.getElementById('wizardAvaliacao');
  if (!wizard) return;

  const steps = Array.from(wizard.querySelectorAll('.wizard-step'));
  const pills = Array.from(wizard.querySelectorAll('.wizard-step-pill'));
  const bar = document.getElementById('wizardBar');

  const btnPrev = document.getElementById('wizardPrev');
  const btnNext = document.getElementById('wizardNext');
  const btnSave = document.getElementById('wizardSave');

  let step = 1;

  function render() {
    steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === step));
    pills.forEach(p => p.classList.toggle('active', Number(p.dataset.step) === step));

    const pct = Math.round(((step - 1) / (totalSteps - 1)) * 100);
    if (bar) bar.style.width = `${pct}%`;

    btnPrev.disabled = step === 1;
    btnNext.style.display = step === totalSteps ? 'none' : '';
    btnSave.style.display = step === totalSteps ? '' : 'none';
  }

  function go(n) {
    step = Math.min(totalSteps, Math.max(1, n));
    render();

    const first = wizard.querySelector(`.wizard-step[data-step="${step}"] input, .wizard-step[data-step="${step}"] select, .wizard-step[data-step="${step}"] textarea`);
    if (first) setTimeout(() => first.focus(), 0);
  }

  btnPrev.addEventListener('click', () => go(step - 1));
  btnNext.addEventListener('click', () => go(step + 1));
  pills.forEach(p => p.addEventListener('click', () => go(Number(p.dataset.step))));

  render();
  go(1);
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
  const historico = paciente?.prontuario?.historico || [];

  if (historico.length < 2) {
    alert('É necessário pelo menos 2 avaliações para gerar o gráfico de evolução.');
    return;
  }

  const historicoOrdenado = [...historico].sort((a, b) => new Date(a.data) - new Date(b.data));

  const labels = historicoOrdenado.map(h => new Date(h.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
  const pesos = historicoOrdenado.map(h => h.peso);
  const imcs = historicoOrdenado.map(h => h.imc);
  const cinturas = historicoOrdenado.map(h => h.cintura);

  document.getElementById('graficoEvolucao').style.display = 'block';

  if (window.chartEvolucaoInstance) window.chartEvolucaoInstance.destroy();

  const ctx = document.getElementById('chartEvolucao');

  window.chartEvolucaoInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Peso (kg)', data: pesos, borderColor: '#667eea', backgroundColor: 'rgba(102,126,234,0.1)', tension: 0.4, yAxisID: 'y' },
        { label: 'IMC', data: imcs, borderColor: '#764ba2', backgroundColor: 'rgba(118,75,162,0.1)', tension: 0.4, yAxisID: 'y1' },
        { label: 'Cintura (cm)', data: cinturas, borderColor: '#f093fb', backgroundColor: 'rgba(240,147,251,0.1)', tension: 0.4, yAxisID: 'y2' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top' }, title: { display: false } },
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

function carregarCalendario() {
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  document.getElementById('mesAno').textContent = `${meses[mesAtual]} ${anoAtual}`;

  const grid = document.getElementById('calendarioGrid');
  grid.innerHTML = '';

  const diasSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  diasSemana.forEach(dia => {
    const header = document.createElement('div');
    header.className = 'calendar-day header';
    header.textContent = dia;
    grid.appendChild(header);
  });

  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate();

  for (let i = 0; i < primeiroDia; i++) grid.appendChild(document.createElement('div'));

  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const dataAtual = new Date(anoAtual, mesAtual, dia);
    dataAtual.setHours(0,0,0,0);

    const celula = document.createElement('div');
    celula.className = 'calendar-day';
    celula.textContent = dia;

    if (dataAtual.getTime() === hoje.getTime()) celula.classList.add('today');

    const consultasDia = consultas.filter(c => {
      const dataConsulta = new Date(c.data + 'T00:00:00');
      dataConsulta.setHours(0,0,0,0);
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
    dataConsulta.setHours(0,0,0,0);
    const d = new Date(data);
    d.setHours(0,0,0,0);
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
// CONSULTAS
// =====================
function abrirModalNovaConsulta() {
  atualizarSelectsPacientes();
  document.getElementById('modalConsulta').classList.add('active');
  document.getElementById('formConsulta').reset();
  focusPrimeiroCampo('modalConsulta');
}

function salvarConsulta(e) {
  e.preventDefault();

  // Agora value = índice do paciente
  const pacienteIndex = Number(document.getElementById('pacienteConsulta').value);
  if (!Number.isFinite(pacienteIndex) || pacienteIndex < 0 || pacienteIndex >= pacientes.length) {
    alert('Selecione um paciente válido.');
    return;
  }

  consultas.push({
    id: Date.now(),
    pacienteIndex,
    data: document.getElementById('dataConsulta').value,
    horario: document.getElementById('horarioConsulta').value,
    tipo: document.getElementById('tipoConsulta').value
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

  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  if (pagamentos.length === 0) {
    lista.innerHTML = '<p style="text-align:center; padding:40px; color:#999;">Nenhum pagamento cadastrado ainda.</p>';
    document.getElementById('totalPago').textContent = 'R$ 0,00';
    document.getElementById('totalVencido').textContent = 'R$ 0,00';
    document.getElementById('totalPendente').textContent = 'R$ 0,00';
    return;
  }

  pagamentos.forEach((pagamento, index) => {
    const paciente = pacientes.find(p => p.id === pagamento.pacienteId);
    if (!paciente) return;

    const vencimento = new Date(pagamento.vencimento + 'T00:00:00');
    vencimento.setHours(0,0,0,0);

    const valor = parseFloat(pagamento.valor) || 0;

    if (pagamento.pago) totalPago += valor;
    else if (vencimento < hoje) totalVencido += valor;
    else totalPendente += valor;

    const item = document.createElement('div');
    item.className = 'pagamento-item';

    if (pagamento.pago) item.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
    else if (vencimento < hoje) item.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';

    item.innerHTML = `
      <div class="pagamento-info">
        <h4 style="color: ${pagamento.pago ? '#059669' : '#2c3e50'};">${paciente.nome}</h4>
        <p style="color: ${pagamento.pago ? '#047857' : '#666'};">
          <strong>Plano:</strong> ${paciente.plano || 'Não definido'} • ${pagamento.descricao || 'Pagamento'} •
          Vence em ${new Date(pagamento.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
        </p>
      </div>
      <div class="pagamento-valor" style="color: ${pagamento.pago ? '#059669' : '#2c3e50'};">
        R$ ${valor.toFixed(2)}
      </div>
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
  if (!pagamentos[index]) return;
  pagamentos[index].pago = !pagamentos[index].pago;
  localStorage.setItem('pagamentos', JSON.stringify(pagamentos));
  carregarPagamentos();
}

// =====================
// UTILS
// =====================
function atualizarSelectsPacientes() {
  const select = document.getElementById('pacienteConsulta');
  if (!select) return;

  select.innerHTML = '<option value="">Selecione...</option>';

  pacientes.forEach((p, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = p.nome;
    select.appendChild(opt);
  });
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');

  if (id === 'modalProntuario') {
    const dyn = document.getElementById('modalProntuario');
    if (dyn) dyn.remove();
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
  const file = e.target.files?.[0];
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

    alert('Backup restaurado com sucesso!');
    location.reload();
  };
  reader.readAsText(file);
}

// =====================
// UX: Modal (ESC, clique fora, foco)
// =====================
function focusPrimeiroCampo(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const alvo = modal.querySelector('input, select, textarea, button');
  if (alvo) setTimeout(() => alvo.focus(), 0);
}

function bindModalUX() {
  // Clique fora fecha (fixos)
  ['modalPaciente', 'modalConsulta'].forEach(id => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.addEventListener('mousedown', (e) => {
      if (e.target === modal) fecharModal(id);
    });
  });

  // Clique fora fecha (dinâmico prontuário)
  document.addEventListener('mousedown', (e) => {
    const dyn = document.getElementById('modalProntuario');
    if (!dyn) return;
    if (e.target === dyn) fecharModal('modalProntuario');
  });

  // ESC fecha modal ativo
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    const dyn = document.getElementById('modalProntuario');
    if (dyn?.classList.contains('active')) { fecharModal('modalProntuario'); return; }

    ['modalPaciente', 'modalConsulta'].forEach(id => {
      const modal = document.getElementById(id);
      if (modal?.classList.contains('active')) fecharModal(id);
    });
  });
}

// =====================
// UX: Rascunho (Novo Paciente)
// =====================
const DRAFT_PACIENTE_KEY = 'draft_formPaciente_v1';

function getDraftPaciente() {
  try { return JSON.parse(localStorage.getItem(DRAFT_PACIENTE_KEY) || 'null'); }
  catch { return null; }
}

function setDraftPaciente(draft) {
  localStorage.setItem(DRAFT_PACIENTE_KEY, JSON.stringify(draft));
}

function clearDraftPaciente() {
  localStorage.removeItem(DRAFT_PACIENTE_KEY);
}

function coletarCamposPaciente() {
  return {
    nomePaciente: document.getElementById('nomePaciente')?.value || '',
    idadePaciente: document.getElementById('idadePaciente')?.value || '',
    whatsappPaciente: document.getElementById('whatsappPaciente')?.value || '',
    planoPaciente: document.getElementById('planoPaciente')?.value || '',
    formaPagamento: document.getElementById('formaPagamento')?.value || 'vista',
    primeiraConsulta: document.getElementById('primeiraConsulta')?.value || '',
    proximoRetorno: document.getElementById('proximoRetorno')?.value || ''
  };
}

function aplicarDraftPacienteSeExistir() {
  const modal = document.getElementById('modalPaciente');
  if (!modal || modal.dataset.mode !== 'new') return;

  const draft = getDraftPaciente();
  if (!draft) return;

  const nomeEl = document.getElementById('nomePaciente');
  const idadeEl = document.getElementById('idadePaciente');
  const wppEl = document.getElementById('whatsappPaciente');
  const planoEl = document.getElementById('planoPaciente');
  const primeiraEl = document.getElementById('primeiraConsulta');
  const retornoEl = document.getElementById('proximoRetorno');
  const formaEl = document.getElementById('formaPagamento');

  if (nomeEl) nomeEl.value = draft.nomePaciente || '';
  if (idadeEl) idadeEl.value = draft.idadePaciente || '';
  if (wppEl) wppEl.value = draft.whatsappPaciente || '';
  if (planoEl) planoEl.value = draft.planoPaciente || '';
  if (primeiraEl) primeiraEl.value = draft.primeiraConsulta || '';
  if (retornoEl) retornoEl.value = draft.proximoRetorno || '';

  if (typeof mostrarOpcaoPagamento === 'function') mostrarOpcaoPagamento();
  if (formaEl) formaEl.value = draft.formaPagamento || 'vista';
}

function bindAutosaveDraftPaciente() {
  const ids = [
    'nomePaciente','idadePaciente','whatsappPaciente',
    'planoPaciente','formaPagamento','primeiraConsulta','proximoRetorno'
  ];

  const salvar = () => {
    const modal = document.getElementById('modalPaciente');
    if (!modal?.classList.contains('active')) return;
    if (modal.dataset.mode !== 'new') return;
    setDraftPaciente(coletarCamposPaciente());
  };

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', salvar);
    el.addEventListener('change', salvar);
  });
}
