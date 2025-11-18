// ============================================
// CONFIGURAÇÃO
// ============================================
const API_BASE_URL = 'http://localhost:3000/api';

// ============================================
// ESTADO DA APLICAÇÃO
// ============================================
const state = {
    clientes: [],
    veiculos: [],
    mecanicos: [],
    servicos: [],
    pecas: [],
    servicosSelecionados: [],
    pecasSelecionadas: [],
    clienteAtual: null,
    veiculoAtual: null
};

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarApp();
    configurarEventos();
});

async function inicializarApp() {
    try {
        showLoading();
        
        // Carregar dados iniciais
        await Promise.all([
            carregarClientes(),
            carregarMecanicos(),
            carregarServicos()
        ]);
        
        // Definir data de abertura como hoje
        document.getElementById('dataAbertura').valueAsDate = new Date();
        
        hideLoading();
        showToast('Sistema carregado com sucesso!', 'success');
    } catch (error) {
        hideLoading();
        showToast('Erro ao carregar dados iniciais', 'error');
        console.error(error);
    }
}

// ============================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================
function configurarEventos() {
    // Cliente
    document.getElementById('btnNovoCliente').addEventListener('click', mostrarModalCliente);
    document.getElementById('btnCancelarCliente').addEventListener('click', esconderModalCliente);
    document.getElementById('btnSalvarCliente').addEventListener('click', salvarCliente);
    document.getElementById('cliente').addEventListener('change', onClienteChange);
    
    // Veículo
    document.getElementById('btnNovoVeiculo').addEventListener('click', mostrarModalVeiculo);
    document.getElementById('btnCancelarVeiculo').addEventListener('click', esconderModalVeiculo);
    document.getElementById('btnSalvarVeiculo').addEventListener('click', salvarVeiculo);
    
    // Serviços
    document.getElementById('btnAdicionarServico').addEventListener('click', adicionarServico);
    
    // Peças
    document.getElementById('buscaPeca').addEventListener('input', buscarPecas);
    
    // Valores
    document.getElementById('desconto').addEventListener('input', calcularTotal);
    document.getElementById('status').addEventListener('change', onStatusChange);
    
    // Formulário
    document.getElementById('formOS').addEventListener('submit', salvarOS);
    document.getElementById('btnCancelar').addEventListener('click', limparFormulario);
    
    // Máscaras
    aplicarMascaras();
}

// ============================================
// MÁSCARAS
// ============================================
function aplicarMascaras() {
    // CPF/CNPJ
    document.getElementById('clienteCpfCnpj').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            // CPF: 000.000.000-00
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            // CNPJ: 00.000.000/0000-00
            value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
        }
        e.target.value = value;
    });
    
    // Telefone
    document.getElementById('clienteTelefone').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 10) {
            // (00) 0000-0000
            value = value.replace(/^(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            // (00) 00000-0000
            value = value.replace(/^(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = value;
    });
    
    // Placa
    document.getElementById('veiculoPlaca').addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
}

// ============================================
// API - CLIENTES
// ============================================
async function carregarClientes() {
    try {
        const response = await fetch(`${API_BASE_URL}/clientes`);
        const data = await response.json();
        
        if (data.sucesso) {
            state.clientes = data.clientes;
            popularSelectClientes();
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        throw error;
    }
}

function popularSelectClientes() {
    const select = document.getElementById('cliente');
    select.innerHTML = '<option value="">Selecione um cliente...</option>';
    
    state.clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = `${cliente.nome} - ${formatarCpfCnpj(cliente.cpf_cnpj)}`;
        select.appendChild(option);
    });
}

function mostrarModalCliente() {
    document.getElementById('modalCliente').classList.remove('hidden');
}

function esconderModalCliente() {
    document.getElementById('modalCliente').classList.add('hidden');
    limparModalCliente();
}

function limparModalCliente() {
    document.getElementById('clienteNome').value = '';
    document.getElementById('clienteCpfCnpj').value = '';
    document.getElementById('clienteTelefone').value = '';
    document.getElementById('clienteEmail').value = '';
}

async function salvarCliente() {
    const nome = document.getElementById('clienteNome').value.trim();
    const cpfCnpj = document.getElementById('clienteCpfCnpj').value.replace(/\D/g, '');
    const telefone = document.getElementById('clienteTelefone').value.replace(/\D/g, '');
    const email = document.getElementById('clienteEmail').value.trim();
    
    // Validações
    if (!nome || !cpfCnpj || !telefone) {
        showToast('Preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
        showToast('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos', 'warning');
        return;
    }
    
    if (telefone.length < 10 || telefone.length > 11) {
        showToast('Telefone deve ter 10 ou 11 dígitos', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/clientes/rapido`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome,
                cpf_cnpj: cpfCnpj,
                telefone,
                email: email || null
            })
        });
        
        const data = await response.json();
        
        hideLoading();
        
        if (data.sucesso) {
            showToast('Cliente cadastrado com sucesso!', 'success');
            esconderModalCliente();
            
            // Recarregar clientes e selecionar o novo
            await carregarClientes();
            const clienteId = data.cliente?.id || data.id;
            document.getElementById('cliente').value = clienteId;
            onClienteChange();
        } else {
            showToast(data.erro || 'Erro ao cadastrar cliente', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Erro ao cadastrar cliente', 'error');
        console.error(error);
    }
}

async function onClienteChange() {
    const clienteId = document.getElementById('cliente').value;
    
    if (!clienteId) {
        state.clienteAtual = null;
        document.getElementById('veiculo').disabled = true;
        document.getElementById('btnNovoVeiculo').disabled = true;
        document.getElementById('veiculo').innerHTML = '<option value="">Selecione um cliente primeiro...</option>';
        return;
    }
    
    state.clienteAtual = clienteId;
    
    // Habilitar seleção de veículo
    document.getElementById('veiculo').disabled = false;
    document.getElementById('btnNovoVeiculo').disabled = false;
    
    // Carregar veículos do cliente
    await carregarVeiculosCliente(clienteId);
}

// ============================================
// API - VEÍCULOS
// ============================================
async function carregarVeiculosCliente(clienteId) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/clientes/${clienteId}/veiculos`);
        const data = await response.json();
        
        hideLoading();
        
        if (data.sucesso) {
            state.veiculos = data.veiculos;
            popularSelectVeiculos();
        }
    } catch (error) {
        hideLoading();
        console.error('Erro ao carregar veículos:', error);
    }
}

function popularSelectVeiculos() {
    const select = document.getElementById('veiculo');
    select.innerHTML = '<option value="">Selecione um veículo...</option>';
    
    state.veiculos.forEach(veiculo => {
        const option = document.createElement('option');
        option.value = veiculo.id;
        option.textContent = `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo} (${veiculo.ano})`;
        select.appendChild(option);
    });
}

function mostrarModalVeiculo() {
    if (!state.clienteAtual) {
        showToast('Selecione um cliente primeiro', 'warning');
        return;
    }
    document.getElementById('modalVeiculo').classList.remove('hidden');
}

function esconderModalVeiculo() {
    document.getElementById('modalVeiculo').classList.add('hidden');
    limparModalVeiculo();
}

function limparModalVeiculo() {
    document.getElementById('veiculoPlaca').value = '';
    document.getElementById('veiculoMarca').value = '';
    document.getElementById('veiculoModelo').value = '';
    document.getElementById('veiculoAno').value = '';
    document.getElementById('veiculoCor').value = '';
}

async function salvarVeiculo() {
    const placa = document.getElementById('veiculoPlaca').value.trim();
    const marca = document.getElementById('veiculoMarca').value.trim();
    const modelo = document.getElementById('veiculoModelo').value.trim();
    const ano = document.getElementById('veiculoAno').value;
    const cor = document.getElementById('veiculoCor').value.trim();
    
    // Validações
    if (!placa || !marca || !modelo || !ano) {
        showToast('Preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    const anoAtual = new Date().getFullYear();
    if (ano < 1900 || ano > anoAtual + 1) {
        showToast(`Ano deve estar entre 1900 e ${anoAtual + 1}`, 'warning');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/veiculos/rapido`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cliente_id: parseInt(state.clienteAtual),
                placa,
                marca,
                modelo,
                ano: parseInt(ano),
                cor: cor || null
            })
        });
        
        const data = await response.json();
        
        hideLoading();
        
        if (data.sucesso) {
            showToast('Veículo cadastrado com sucesso!', 'success');
            esconderModalVeiculo();
            
            // Recarregar veículos e selecionar o novo
            await carregarVeiculosCliente(state.clienteAtual);
            const veiculoId = data.veiculo?.id || data.id;
            document.getElementById('veiculo').value = veiculoId;
        } else {
            showToast(data.erro || 'Erro ao cadastrar veículo', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Erro ao cadastrar veículo', 'error');
        console.error(error);
    }
}

// ============================================
// API - MECÂNICOS
// ============================================
async function carregarMecanicos() {
    try {
        const response = await fetch(`${API_BASE_URL}/mecanicos`);
        const data = await response.json();
        
        if (data.sucesso) {
            state.mecanicos = data.mecanicos;
            popularSelectMecanicos();
        }
    } catch (error) {
        console.error('Erro ao carregar mecânicos:', error);
        throw error;
    }
}

function popularSelectMecanicos() {
    const select = document.getElementById('mecanico');
    select.innerHTML = '<option value="">Selecione um mecânico...</option>';
    
    state.mecanicos.forEach(mecanico => {
        const option = document.createElement('option');
        option.value = mecanico.id;
        option.textContent = `${mecanico.nome} - ${mecanico.especialidade}`;
        select.appendChild(option);
    });
}

// ============================================
// API - SERVIÇOS
// ============================================
async function carregarServicos() {
    try {
        const response = await fetch(`${API_BASE_URL}/servicos`);
        const data = await response.json();
        
        if (data.sucesso) {
            state.servicos = data.servicos;
            popularSelectServicos();
        }
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        throw error;
    }
}

function popularSelectServicos() {
    const select = document.getElementById('selectServico');
    select.innerHTML = '<option value="">Selecione um serviço...</option>';
    
    state.servicos.forEach(servico => {
        const option = document.createElement('option');
        option.value = servico.id;
        option.textContent = `${servico.nome} - R$ ${parseFloat(servico.preco_padrao).toFixed(2)}`;
        select.appendChild(option);
    });
}

function adicionarServico() {
    const selectServico = document.getElementById('selectServico');
    const servicoId = parseInt(selectServico.value);
    
    if (!servicoId) {
        showToast('Selecione um serviço', 'warning');
        return;
    }
    
    const servico = state.servicos.find(s => s.id === servicoId);
    if (!servico) return;
    
    // Verificar se já foi adicionado
    if (state.servicosSelecionados.find(s => s.servico_id === servicoId)) {
        showToast('Este serviço já foi adicionado', 'warning');
        return;
    }
    
    state.servicosSelecionados.push({
        servico_id: servicoId,
        nome: servico.nome,
        quantidade: 1,
        preco_unitario: parseFloat(servico.preco_padrao)
    });
    
    renderizarServicos();
    calcularTotal();
    selectServico.value = '';
}

function renderizarServicos() {
    const container = document.getElementById('listaServicos');
    
    if (state.servicosSelecionados.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum serviço adicionado</p>';
        return;
    }
    
    container.innerHTML = state.servicosSelecionados.map((servico, index) => `
        <div class="item-card">
            <div class="item-header">
                <span class="item-nome">${servico.nome}</span>
                <button type="button" class="btn-danger" onclick="removerServico(${index})">
                    🗑️ Remover
                </button>
            </div>
            <div class="item-body">
                <div class="item-field">
                    <label>Quantidade</label>
                    <input type="number" value="${servico.quantidade}" min="1" 
                           onchange="atualizarServicoQuantidade(${index}, this.value)">
                </div>
                <div class="item-field">
                    <label>Preço Unitário (R$)</label>
                    <input type="number" value="${servico.preco_unitario}" min="0" step="0.01" 
                           onchange="atualizarServicoPreco(${index}, this.value)">
                </div>
                <div class="item-field">
                    <label>Subtotal</label>
                    <div class="item-subtotal">R$ ${(servico.quantidade * servico.preco_unitario).toFixed(2)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function removerServico(index) {
    state.servicosSelecionados.splice(index, 1);
    renderizarServicos();
    calcularTotal();
}

function atualizarServicoQuantidade(index, valor) {
    state.servicosSelecionados[index].quantidade = parseInt(valor) || 1;
    renderizarServicos();
    calcularTotal();
}

function atualizarServicoPreco(index, valor) {
    state.servicosSelecionados[index].preco_unitario = parseFloat(valor) || 0;
    renderizarServicos();
    calcularTotal();
}

// ============================================
// API - PEÇAS
// ============================================
let timeoutBusca = null;

async function buscarPecas() {
    const termo = document.getElementById('buscaPeca').value.trim();
    
    if (termo.length < 2) {
        document.getElementById('resultadosBusca').classList.add('hidden');
        return;
    }
    
    // Debounce
    clearTimeout(timeoutBusca);
    
    timeoutBusca = setTimeout(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/pecas/buscar?q=${encodeURIComponent(termo)}`);
            const data = await response.json();
            
            if (data.sucesso && data.pecas.length > 0) {
                renderizarResultadosBusca(data.pecas);
            } else {
                document.getElementById('resultadosBusca').innerHTML = 
                    '<div class="autocomplete-item">Nenhuma peça encontrada</div>';
                document.getElementById('resultadosBusca').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Erro ao buscar peças:', error);
        }
    }, 300);
}

function renderizarResultadosBusca(pecas) {
    const container = document.getElementById('resultadosBusca');
    
    container.innerHTML = pecas.map(peca => {
        const estoqueClass = peca.estoque_baixo ? 'baixo' : 'disponivel';
        const estoqueTexto = peca.estoque_baixo 
            ? `⚠️ Estoque baixo: ${peca.quantidade_estoque} unidades`
            : `✅ Estoque: ${peca.quantidade_estoque} unidades`;
        
        return `
            <div class="autocomplete-item" onclick="selecionarPeca(${peca.id})">
                <div class="autocomplete-item-nome">${peca.nome}</div>
                <div class="autocomplete-item-codigo">Código: ${peca.codigo}</div>
                <div class="autocomplete-item-estoque ${estoqueClass}">${estoqueTexto}</div>
            </div>
        `;
    }).join('');
    
    container.classList.remove('hidden');
}

async function selecionarPeca(pecaId) {
    try {
        const response = await fetch(`${API_BASE_URL}/pecas/${pecaId}`);
        const data = await response.json();
        
        if (data.sucesso) {
            const peca = data.peca;
            
            // Verificar se já foi adicionada
            if (state.pecasSelecionadas.find(p => p.peca_id === pecaId)) {
                showToast('Esta peça já foi adicionada', 'warning');
                return;
            }
            
            // Verificar estoque
            if (peca.quantidade_estoque < 1) {
                showToast('Peça sem estoque disponível', 'error');
                return;
            }
            
            state.pecasSelecionadas.push({
                peca_id: pecaId,
                nome: peca.nome,
                codigo: peca.codigo,
                quantidade: 1,
                preco_unitario: parseFloat(peca.preco_venda),
                estoque_disponivel: peca.quantidade_estoque
            });
            
            renderizarPecas();
            calcularTotal();
            
            // Limpar busca
            document.getElementById('buscaPeca').value = '';
            document.getElementById('resultadosBusca').classList.add('hidden');
        }
    } catch (error) {
        console.error('Erro ao selecionar peça:', error);
        showToast('Erro ao adicionar peça', 'error');
    }
}

function renderizarPecas() {
    const container = document.getElementById('listaPecas');
    
    if (state.pecasSelecionadas.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma peça adicionada</p>';
        return;
    }
    
    container.innerHTML = state.pecasSelecionadas.map((peca, index) => {
        const estoqueClass = peca.quantidade > peca.estoque_disponivel ? 'text-danger' : 'text-success';
        const estoqueTexto = peca.quantidade > peca.estoque_disponivel 
            ? `⚠️ Quantidade solicitada maior que estoque (${peca.estoque_disponivel})`
            : `✅ Estoque disponível: ${peca.estoque_disponivel}`;
        
        return `
            <div class="item-card">
                <div class="item-header">
                    <div>
                        <span class="item-nome">${peca.nome}</span>
                        <div class="text-muted" style="font-size: 0.85rem;">Código: ${peca.codigo}</div>
                        <div class="${estoqueClass}" style="font-size: 0.85rem; margin-top: 4px;">${estoqueTexto}</div>
                    </div>
                    <button type="button" class="btn-danger" onclick="removerPeca(${index})">
                        🗑️ Remover
                    </button>
                </div>
                <div class="item-body">
                    <div class="item-field">
                        <label>Quantidade</label>
                        <input type="number" value="${peca.quantidade}" min="1" max="${peca.estoque_disponivel}"
                               onchange="atualizarPecaQuantidade(${index}, this.value)">
                    </div>
                    <div class="item-field">
                        <label>Preço Unitário (R$)</label>
                        <input type="number" value="${peca.preco_unitario}" min="0" step="0.01" 
                               onchange="atualizarPecaPreco(${index}, this.value)">
                    </div>
                    <div class="item-field">
                        <label>Subtotal</label>
                        <div class="item-subtotal">R$ ${(peca.quantidade * peca.preco_unitario).toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function removerPeca(index) {
    state.pecasSelecionadas.splice(index, 1);
    renderizarPecas();
    calcularTotal();
}

function atualizarPecaQuantidade(index, valor) {
    const quantidade = parseInt(valor) || 1;
    const peca = state.pecasSelecionadas[index];
    
    if (quantidade > peca.estoque_disponivel) {
        showToast(`Quantidade solicitada maior que estoque disponível (${peca.estoque_disponivel})`, 'warning');
    }
    
    state.pecasSelecionadas[index].quantidade = quantidade;
    renderizarPecas();
    calcularTotal();
}

function atualizarPecaPreco(index, valor) {
    state.pecasSelecionadas[index].preco_unitario = parseFloat(valor) || 0;
    renderizarPecas();
    calcularTotal();
}

// ============================================
// CÁLCULOS
// ============================================
function calcularTotal() {
    // Calcular valor dos serviços
    const valorServicos = state.servicosSelecionados.reduce((total, servico) => {
        return total + (servico.quantidade * servico.preco_unitario);
    }, 0);
    
    // Calcular valor das peças
    const valorPecas = state.pecasSelecionadas.reduce((total, peca) => {
        return total + (peca.quantidade * peca.preco_unitario);
    }, 0);
    
    // Calcular subtotal
    const subtotal = valorServicos + valorPecas;
    
    // Obter desconto
    const desconto = parseFloat(document.getElementById('desconto').value) || 0;
    
    // Calcular total
    const total = Math.max(0, subtotal - desconto);
    
    // Atualizar interface
    document.getElementById('valorServicos').textContent = `R$ ${valorServicos.toFixed(2)}`;
    document.getElementById('valorPecas').textContent = `R$ ${valorPecas.toFixed(2)}`;
    document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('valorTotal').textContent = `R$ ${total.toFixed(2)}`;
}

// ============================================
// VALIDAÇÕES
// ============================================
function onStatusChange() {
    const status = document.getElementById('status').value;
    const formaPagamentoField = document.getElementById('formaPagamento');
    
    // Se status for "Pago", forma de pagamento é obrigatória
    if (status === 'Pago') {
        formaPagamentoField.required = true;
        formaPagamentoField.parentElement.querySelector('label').innerHTML = 
            'Forma de Pagamento <span class="text-danger">*</span>';
    } else {
        formaPagamentoField.required = false;
        formaPagamentoField.parentElement.querySelector('label').textContent = 
            'Forma de Pagamento';
    }
}

async function validarEstoque() {
    for (const peca of state.pecasSelecionadas) {
        if (peca.quantidade > peca.estoque_disponivel) {
            showToast(`Peça "${peca.nome}" sem estoque suficiente`, 'error');
            return false;
        }
        
        try {
            const response = await fetch(
                `${API_BASE_URL}/estoque/validar?peca_id=${peca.peca_id}&quantidade=${peca.quantidade}`
            );
            const data = await response.json();
            
            if (!data.sucesso || !data.disponivel) {
                showToast(`Estoque insuficiente para "${peca.nome}"`, 'error');
                return false;
            }
        } catch (error) {
            console.error('Erro ao validar estoque:', error);
            showToast('Erro ao validar estoque', 'error');
            return false;
        }
    }
    
    return true;
}

// ============================================
// SALVAR OS
// ============================================
async function salvarOS(event) {
    event.preventDefault();
    
    // Validações básicas
    const clienteId = document.getElementById('cliente').value;
    const veiculoId = document.getElementById('veiculo').value;
    const mecanicoId = document.getElementById('mecanico').value;
    const dataAbertura = document.getElementById('dataAbertura').value;
    const status = document.getElementById('status').value;
    const descricaoProblema = document.getElementById('descricaoProblema').value.trim();
    
    if (!clienteId || !veiculoId || !mecanicoId || !dataAbertura || !status || !descricaoProblema) {
        showToast('Preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    // Validar se tem pelo menos 1 serviço OU 1 peça
    if (state.servicosSelecionados.length === 0 && state.pecasSelecionadas.length === 0) {
        showToast('Adicione pelo menos um serviço ou uma peça', 'warning');
        return;
    }
    
    // Validar forma de pagamento se status for "Pago"
    const formaPagamento = document.getElementById('formaPagamento').value;
    if (status === 'Pago' && !formaPagamento) {
        showToast('Forma de pagamento é obrigatória quando status é "Pago"', 'warning');
        return;
    }
    
    // Validar datas
    const dataConclusao = document.getElementById('dataConclusao').value;
    if (dataConclusao && new Date(dataConclusao) < new Date(dataAbertura)) {
        showToast('Data de conclusão não pode ser anterior à data de abertura', 'warning');
        return;
    }
    
    // Validar estoque
    if (state.pecasSelecionadas.length > 0) {
        const estoqueValido = await validarEstoque();
        if (!estoqueValido) {
            return;
        }
    }
    
    // Montar payload
    const payload = {
        cliente_id: parseInt(clienteId),
        veiculo_id: parseInt(veiculoId),
        mecanico_id: parseInt(mecanicoId),
        data_abertura: dataAbertura,
        data_conclusao: dataConclusao || null,
        status: status,
        descricao_problema: descricaoProblema,
        observacoes: document.getElementById('observacoes').value.trim() || null,
        servicos: state.servicosSelecionados.map(s => ({
            servico_id: s.servico_id,
            quantidade: s.quantidade,
            preco_unitario: s.preco_unitario
        })),
        pecas: state.pecasSelecionadas.map(p => ({
            peca_id: p.peca_id,
            quantidade: p.quantidade,
            preco_unitario: p.preco_unitario
        })),
        desconto: parseFloat(document.getElementById('desconto').value) || 0,
        forma_pagamento: formaPagamento || null
    };
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/os`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        hideLoading();
        
        if (data.sucesso) {
            showToast(`Ordem de serviço ${data.os.numero_os} criada com sucesso!`, 'success');
            
            // Limpar formulário após 2 segundos
            setTimeout(() => {
                limparFormulario();
            }, 2000);
        } else {
            showToast(data.erro || 'Erro ao criar ordem de serviço', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Erro ao criar ordem de serviço', 'error');
        console.error(error);
    }
}

// ============================================
// UTILITÁRIOS
// ============================================
function limparFormulario() {
    if (confirm('Deseja realmente limpar o formulário?')) {
        document.getElementById('formOS').reset();
        state.servicosSelecionados = [];
        state.pecasSelecionadas = [];
        state.clienteAtual = null;
        state.veiculoAtual = null;
        
        renderizarServicos();
        renderizarPecas();
        calcularTotal();
        
        document.getElementById('veiculo').disabled = true;
        document.getElementById('btnNovoVeiculo').disabled = true;
        document.getElementById('dataAbertura').valueAsDate = new Date();
        
        showToast('Formulário limpo', 'info');
    }
}

function formatarCpfCnpj(valor) {
    if (!valor) return '';
    const numeros = valor.replace(/\D/g, '');
    
    if (numeros.length === 11) {
        // CPF
        return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numeros.length === 14) {
        // CNPJ
        return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return valor;
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(mensagem, tipo = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.className = `toast ${tipo}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

// ============================================
// EXPOR FUNÇÕES GLOBAIS
// ============================================
window.removerServico = removerServico;
window.atualizarServicoQuantidade = atualizarServicoQuantidade;
window.atualizarServicoPreco = atualizarServicoPreco;
window.removerPeca = removerPeca;
window.atualizarPecaQuantidade = atualizarPecaQuantidade;
window.atualizarPecaPreco = atualizarPecaPreco;
window.selecionarPeca = selecionarPeca;
