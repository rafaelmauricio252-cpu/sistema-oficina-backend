import db from '../config/db.js';

/**
 * Dashboard Financeiro
 * GET /api/financeiro/dashboard
 */
async function getDashboard(req, res) {
    try {
        // Query 1: Receitas do mês atual
        const receitasMesAtual = await db('ordem_servico')
            .where('status', 'Pago')
            .whereRaw('EXTRACT(MONTH FROM data_fechamento) = EXTRACT(MONTH FROM CURRENT_DATE)')
            .whereRaw('EXTRACT(YEAR FROM data_fechamento) = EXTRACT(YEAR FROM CURRENT_DATE)')
            .sum('valor_total as total')
            .first();

        // Query 2: Receitas do mês anterior
        const receitasMesAnterior = await db('ordem_servico')
            .where('status', 'Pago')
            .whereRaw('EXTRACT(MONTH FROM data_fechamento) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL \'1 month\')')
            .whereRaw('EXTRACT(YEAR FROM data_fechamento) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL \'1 month\')')
            .sum('valor_total as total')
            .first();

        // Query 3: Ticket Médio (Mês Atual)
        const ticketMedioData = await db('ordem_servico')
            .where('status', 'Pago')
            .whereRaw('EXTRACT(MONTH FROM data_fechamento) = EXTRACT(MONTH FROM CURRENT_DATE)')
            .whereRaw('EXTRACT(YEAR FROM data_fechamento) = EXTRACT(YEAR FROM CURRENT_DATE)')
            .count('id as qtd')
            .sum('valor_total as total')
            .first();

        // Query 4: Total de Receitas (All Time)
        const totalReceitas = await db('ordem_servico')
            .where('status', 'Pago')
            .sum('valor_total as total')
            .first();

        const totalOsPagas = await db('ordem_servico')
            .where('status', 'Pago')
            .count('id as total')
            .first();

        // Query 5: Evolução dos Últimos 6 Meses
        const evolucaoMensal = await db('ordem_servico')
            .select(
                db.raw("TO_CHAR(data_fechamento, 'Mon/YY') as mes"),
                db.raw('SUM(valor_total) as valor')
            )
            .where('status', 'Pago')
            .whereRaw("data_fechamento >= CURRENT_DATE - INTERVAL '6 months'")
            .groupByRaw("TO_CHAR(data_fechamento, 'Mon/YY'), EXTRACT(YEAR FROM data_fechamento), EXTRACT(MONTH FROM data_fechamento)")
            .orderByRaw('EXTRACT(YEAR FROM data_fechamento), EXTRACT(MONTH FROM data_fechamento)')
            .limit(6);

        // Query 6: Receitas por Forma de Pagamento (Mês Atual)
        const receitasPorFormaPagamento = await db('ordem_servico')
            .select('forma_pagamento as forma')
            .sum('valor_total as valor')
            .where('status', 'Pago')
            .whereRaw('EXTRACT(MONTH FROM data_fechamento) = EXTRACT(MONTH FROM CURRENT_DATE)')
            .whereRaw('EXTRACT(YEAR FROM data_fechamento) = EXTRACT(YEAR FROM CURRENT_DATE)')
            .groupBy('forma_pagamento')
            .orderBy('valor', 'desc');

        // Query 7: Top 5 Serviços Mais Lucrativos (Mês Atual)
        const topServicos = await db('os_servicos')
            .select(
                'servicos.nome as servico',
                db.raw('COUNT(os_servicos.id) as quantidade'),
                db.raw('SUM(os_servicos.preco_servico) as valor')
            )
            .join('servicos', 'os_servicos.servico_id', 'servicos.id')
            .join('ordem_servico', 'os_servicos.os_id', 'ordem_servico.id')
            .where('ordem_servico.status', 'Pago')
            .whereRaw('EXTRACT(MONTH FROM ordem_servico.data_fechamento) = EXTRACT(MONTH FROM CURRENT_DATE)')
            .whereRaw('EXTRACT(YEAR FROM ordem_servico.data_fechamento) = EXTRACT(YEAR FROM CURRENT_DATE)')
            .groupBy('servicos.nome')
            .orderBy('valor', 'desc')
            .limit(5);

        // Query 8: Últimas 10 Receitas
        const ultimasReceitas = await db('ordem_servico')
            .select(
                'ordem_servico.id',
                'ordem_servico.valor_total',
                'ordem_servico.forma_pagamento',
                'ordem_servico.data_fechamento as data_conclusao',
                'clientes.nome as cliente_nome',
                'veiculos.placa as veiculo_placa'
            )
            .join('clientes', 'ordem_servico.cliente_id', 'clientes.id')
            .join('veiculos', 'ordem_servico.veiculo_id', 'veiculos.id')
            .where('ordem_servico.status', 'Pago')
            .orderBy('ordem_servico.data_fechamento', 'desc')
            .limit(10);

        // Cálculos
        const mesAtual = parseFloat(receitasMesAtual?.total || 0);
        const mesAnterior = parseFloat(receitasMesAnterior?.total || 0);

        const variacaoPercentual = mesAnterior > 0
            ? ((mesAtual - mesAnterior) / mesAnterior) * 100
            : (mesAtual > 0 ? 100 : 0);

        const ticketMedioQtd = parseInt(ticketMedioData?.qtd || 0);
        const ticketMedioTotal = parseFloat(ticketMedioData?.total || 0);
        const ticketMedio = ticketMedioQtd > 0 ? ticketMedioTotal / ticketMedioQtd : 0;

        // Retornar dados
        res.json({
            sucesso: true,
            dados: {
                receitas_mes_atual: mesAtual,
                receitas_mes_anterior: mesAnterior,
                variacao_percentual: variacaoPercentual,
                ticket_medio: ticketMedio,
                total_receitas: parseFloat(totalReceitas?.total || 0),
                total_os_pagas: parseInt(totalOsPagas?.total || 0),
                evolucao_mensal: evolucaoMensal.map(r => ({ mes: r.mes, valor: parseFloat(r.valor) })),
                receitas_por_forma_pagamento: receitasPorFormaPagamento.map(r => ({ forma: r.forma, valor: parseFloat(r.valor) })),
                top_servicos: topServicos.map(r => ({ servico: r.servico, quantidade: parseInt(r.quantidade), valor: parseFloat(r.valor) })),
                ultimas_receitas: ultimasReceitas.map(r => ({
                    ...r,
                    valor_total: parseFloat(r.valor_total)
                }))
            }
        });
    } catch (erro) {
        console.error('Erro ao buscar dashboard financeiro:', erro);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao buscar dashboard financeiro'
        });
    }
}

/**
 * Listagem de Receitas
 * GET /api/financeiro/receitas
 */
async function getReceitas(req, res) {
    try {
        const { periodo, forma_pagamento, busca } = req.query;

        let query = db('ordem_servico')
            .select(
                'ordem_servico.id',
                'ordem_servico.valor_total',
                'ordem_servico.forma_pagamento',
                'ordem_servico.data_fechamento as data_conclusao',
                'ordem_servico.desconto',
                'clientes.nome as cliente_nome',
                'veiculos.placa as veiculo_placa',
                'veiculos.modelo as veiculo_modelo',
                'mecanicos.nome as mecanico_nome'
            )
            .join('clientes', 'ordem_servico.cliente_id', 'clientes.id')
            .join('veiculos', 'ordem_servico.veiculo_id', 'veiculos.id')
            .leftJoin('mecanicos', 'ordem_servico.mecanico_id', 'mecanicos.id')
            .where('ordem_servico.status', 'Pago');

        // Filtro de período
        if (periodo === 'mes_atual') {
            query = query
                .whereRaw('EXTRACT(MONTH FROM data_fechamento) = EXTRACT(MONTH FROM CURRENT_DATE)')
                .whereRaw('EXTRACT(YEAR FROM data_fechamento) = EXTRACT(YEAR FROM CURRENT_DATE)');
        } else if (periodo === 'mes_anterior') {
            query = query
                .whereRaw('EXTRACT(MONTH FROM data_fechamento) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL \'1 month\')')
                .whereRaw('EXTRACT(YEAR FROM data_fechamento) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL \'1 month\')');
        } else if (periodo === 'ultimos_3_meses') {
            query = query.whereRaw('data_fechamento >= CURRENT_DATE - INTERVAL \'3 months\'');
        } else if (periodo === 'ultimos_6_meses') {
            query = query.whereRaw('data_fechamento >= CURRENT_DATE - INTERVAL \'6 months\'');
        } else if (periodo === 'ano_atual') {
            query = query.whereRaw('EXTRACT(YEAR FROM data_fechamento) = EXTRACT(YEAR FROM CURRENT_DATE)');
        }

        // Filtro de forma de pagamento
        if (forma_pagamento && forma_pagamento !== 'todas') {
            query = query.where('ordem_servico.forma_pagamento', forma_pagamento);
        }

        // Filtro de busca (cliente, placa, mecânico)
        if (busca && busca.trim() !== '') {
            query = query.where(function () {
                this.where('clientes.nome', 'ilike', `%${busca}%`)
                    .orWhere('veiculos.placa', 'ilike', `%${busca}%`)
                    .orWhere('mecanicos.nome', 'ilike', `%${busca}%`);
            });
        }

        const receitas = await query.orderBy('ordem_servico.data_fechamento', 'desc');

        // Totalizadores
        // Reutilizar a lógica de filtros para os totalizadores
        let totalizadoresQuery = db('ordem_servico')
            .select(
                db.raw('COUNT(*) as total_os'),
                db.raw('SUM(valor_total) as total_receita'),
                db.raw('SUM(desconto) as total_desconto')
            )
            .leftJoin('clientes', 'ordem_servico.cliente_id', 'clientes.id') // Joins necessários para o filtro de busca
            .leftJoin('veiculos', 'ordem_servico.veiculo_id', 'veiculos.id')
            .leftJoin('mecanicos', 'ordem_servico.mecanico_id', 'mecanicos.id')
            .where('ordem_servico.status', 'Pago');

        if (periodo === 'mes_atual') {
            totalizadoresQuery = totalizadoresQuery
                .whereRaw('EXTRACT(MONTH FROM data_fechamento) = EXTRACT(MONTH FROM CURRENT_DATE)')
                .whereRaw('EXTRACT(YEAR FROM data_fechamento) = EXTRACT(YEAR FROM CURRENT_DATE)');
        } else if (periodo === 'mes_anterior') {
            totalizadoresQuery = totalizadoresQuery
                .whereRaw('EXTRACT(MONTH FROM data_fechamento) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL \'1 month\')')
                .whereRaw('EXTRACT(YEAR FROM data_fechamento) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL \'1 month\')');
        } else if (periodo === 'ultimos_3_meses') {
            totalizadoresQuery = totalizadoresQuery.whereRaw('data_fechamento >= CURRENT_DATE - INTERVAL \'3 months\'');
        } else if (periodo === 'ultimos_6_meses') {
            totalizadoresQuery = totalizadoresQuery.whereRaw('data_fechamento >= CURRENT_DATE - INTERVAL \'6 months\'');
        } else if (periodo === 'ano_atual') {
            totalizadoresQuery = totalizadoresQuery.whereRaw('EXTRACT(YEAR FROM data_fechamento) = EXTRACT(YEAR FROM CURRENT_DATE)');
        }

        if (forma_pagamento && forma_pagamento !== 'todas') {
            totalizadoresQuery = totalizadoresQuery.where('ordem_servico.forma_pagamento', forma_pagamento);
        }

        if (busca && busca.trim() !== '') {
            totalizadoresQuery = totalizadoresQuery.where(function () {
                this.where('clientes.nome', 'ilike', `%${busca}%`)
                    .orWhere('veiculos.placa', 'ilike', `%${busca}%`)
                    .orWhere('mecanicos.nome', 'ilike', `%${busca}%`);
            });
        }

        const totalizadores = await totalizadoresQuery.first();

        const totalOs = parseInt(totalizadores?.total_os || 0);
        const totalReceita = parseFloat(totalizadores?.total_receita || 0);

        res.json({
            sucesso: true,
            receitas: receitas.map(r => ({
                ...r,
                valor_total: parseFloat(r.valor_total),
                desconto: parseFloat(r.desconto)
            })),
            totalizadores: {
                total_os: totalOs,
                total_receita: totalReceita,
                total_desconto: parseFloat(totalizadores?.total_desconto || 0),
                ticket_medio: totalOs > 0 ? totalReceita / totalOs : 0
            }
        });
    } catch (erro) {
        console.error('Erro ao buscar receitas:', erro);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao buscar receitas'
        });
    }
}

export default {
    getDashboard,
    getReceitas
};
