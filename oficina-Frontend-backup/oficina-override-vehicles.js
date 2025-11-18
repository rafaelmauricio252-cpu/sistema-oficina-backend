
/**
 * OficinaPro Cloud – override para carregar veículos do cliente
 * 
 * Como usar:
 * 1) Inclua este arquivo DEPOIS do seu JS principal no index.html
 *    <script src="seu-arquivo-principal.js"></script>
 *    <script src="oficina-override-vehicles.js"></script>
 * 2) Ele substitui com segurança as funções abaixo, sem quebrar o restante.
 */

(function () {
  // Utilidade local de log seguro
  const log = (...args) => console && console.log && console.log('[override-vehicles]', ...args);

  // IDs esperados na página (ajuste se necessário)
  const ID_CLIENTE = 'cliente';
  const ID_VEICULO = 'veiculo';
  const ID_BTN_NOVO_VEICULO = 'btnNovoVeiculo';

  // Garante objetos globais mínimos
  window.state = window.state || {};
  const API = window.API_BASE_URL || (window.API && window.API.BASE_URL) || 'http://localhost:3000/api';

  // No-ops para loading se não existirem globais
  const noop = () => {};
  const showLoading = (window.showLoading || noop);
  const hideLoading = (window.hideLoading || noop);

  /**
   * Substitui/define carregarVeiculosCliente(clienteId)
   * Tenta /clientes/:id/completo e cai para /veiculos?cliente_id=...
   */
  async function carregarVeiculosCliente(clienteId) {
    try {
      showLoading();
      const veiculoSelect = document.getElementById(ID_VEICULO);
      if (veiculoSelect) {
        veiculoSelect.disabled = true;
        veiculoSelect.innerHTML = '<option>Carregando veículos...</option>';
      }

      let res = await fetch(`${API}/clientes/${clienteId}/completo`);
      let data = await res.json();

      let veiculos = [];
      if (res.ok && data?.cliente && Array.isArray(data.cliente.veiculos)) {
        veiculos = data.cliente.veiculos;
      } else {
        res = await fetch(`${API}/veiculos?cliente_id=${clienteId}`);
        data = await res.json();
        if (res.ok && (data?.sucesso || data?.success) && Array.isArray(data.veiculos)) {
          veiculos = data.veiculos;
        } else if (Array.isArray(data)) {
          veiculos = data; // caso API retorne lista direta
        } else {
          throw new Error('Nenhuma rota de veículos respondeu como esperado.');
        }
      }

      window.state.veiculos = veiculos;
      popularSelectVeiculos();
      if (veiculoSelect) veiculoSelect.disabled = veiculos.length === 0;
    } catch (error) {
      log('Erro ao carregar veículos:', error);
      const veiculoSelect = document.getElementById(ID_VEICULO);
      if (veiculoSelect) {
        veiculoSelect.innerHTML = '<option>Erro ao carregar veículos</option>';
        veiculoSelect.disabled = true;
      }
    } finally {
      hideLoading();
    }
  }

  /**
   * Substitui/define popularSelectVeiculos() com tolerância a campos faltantes.
   */
  function popularSelectVeiculos() {
    const select = document.getElementById(ID_VEICULO);
    if (!select) return;

    const veiculos = Array.isArray(window.state.veiculos) ? window.state.veiculos : [];
    select.innerHTML = '<option value="">Selecione um veículo...</option>';

    if (veiculos.length === 0) {
      select.innerHTML = '<option value="">Nenhum veículo encontrado</option>';
      return;
    }

    veiculos.forEach((v) => {
      const option = document.createElement('option');
      option.value = v.id;
      const texto = [
        v.placa || null,
        [v.marca, v.modelo].filter(Boolean).join(' ') || null,
        v.ano ? `(${v.ano})` : null,
      ].filter(Boolean).join(' - ');
      option.textContent = texto || `Veículo #${v.id}`;
      select.appendChild(option);
    });
  }

  /**
   * Substitui/define onClienteChange() para disparar carregamento com feedback
   */
  async function onClienteChange() {
    const clienteSelect = document.getElementById(ID_CLIENTE);
    const veiculoSelect = document.getElementById(ID_VEICULO);
    const btnNovoVeiculo = document.getElementById(ID_BTN_NOVO_VEICULO);

    if (!clienteSelect) return;
    const clienteId = clienteSelect.value;

    if (!clienteId) {
      window.state.clienteAtual = null;
      if (veiculoSelect) {
        veiculoSelect.disabled = true;
        veiculoSelect.innerHTML = '<option value="">Selecione um cliente primeiro...</option>';
      }
      if (btnNovoVeiculo) btnNovoVeiculo.disabled = true;
      return;
    }

    window.state.clienteAtual = clienteId;

    if (veiculoSelect) {
      veiculoSelect.disabled = true;
      veiculoSelect.innerHTML = '<option>Carregando veículos...</option>';
    }
    if (btnNovoVeiculo) btnNovoVeiculo.disabled = true;

    await carregarVeiculosCliente(clienteId);

    if (veiculoSelect) veiculoSelect.disabled = (window.state.veiculos || []).length === 0;
    if (btnNovoVeiculo) btnNovoVeiculo.disabled = false;
  }

  // Expõe/override no escopo global de forma segura
  window.carregarVeiculosCliente = carregarVeiculosCliente;
  window.popularSelectVeiculos = popularSelectVeiculos;
  window.onClienteChange = onClienteChange;

  // Seletor de cliente dispara o onClienteChange automaticamente
  window.addEventListener('DOMContentLoaded', () => {
    const clienteSelect = document.getElementById(ID_CLIENTE);
    if (clienteSelect && !clienteSelect._ofcBound) {
      clienteSelect.addEventListener('change', onClienteChange);
      clienteSelect._ofcBound = true;
    }
    log('Override de veículos carregado. API =', API);
  });
})();
