<<<<<<< HEAD
// js/relatorios-completos.js - VERSÃO CORRIGIDA (COM 4 CASAS DECIMAIS NO PREÇO/M)

document.addEventListener('DOMContentLoaded', async function() {
    // Elementos do DOM
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    const errorElement = document.getElementById('error-message');
    const tipoRelatorioSelect = document.getElementById('tipo-relatorio');
    const funcionarioFiltro = document.getElementById('funcionario-filtro');
    const turmaFiltro = document.getElementById('turma-filtro');
    const fazendaFiltro = document.getElementById('fazenda-filtro'); 
    const funcionarioGroup = document.getElementById('funcionario-group');
    const turmaGroup = document.getElementById('turma-group');
    const dataInicio = document.getElementById('data-inicio');
    const dataFim = document.getElementById('data-fim');
    const ordenacaoSelect = document.getElementById('ordenacao');
    const agruparPorDataCheck = document.getElementById('agrupar-por-data');
    const gerarRelatorioBtn = document.getElementById('gerar-relatorio');
    const limparFiltrosBtn = document.getElementById('limpar-filtros');
    const relatorioContainer = document.getElementById('relatorio-container');
    const semDados = document.getElementById('sem-dados');
    const imprimirBtn = document.getElementById('imprimir-relatorio');
    const exportarPdfBtn = document.getElementById('exportar-pdf');
    const exportarExcelBtn = document.getElementById('exportar-excel'); 
    
    // Variáveis para armazenar dados
    let funcionarios = [];
    let turmas = [];
    let fazendas = []; 
    let dadosRelatorio = [];

    try {
        // Configurar interface inicial
        if (loadingElement) loadingElement.style.display = 'block';
        if (contentElement) contentElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';
        if (relatorioContainer) relatorioContainer.style.display = 'none';
        if (semDados) semDados.style.display = 'none';

        // Testar conexão
        await testarConexaoSupabase();
        
        // Mostrar conteúdo principal
        if (loadingElement) loadingElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'block';

        // Configurar datas padrão (últimos 30 dias)
        configurarDatasPadrao();
        
        // Carregar dados para os filtros
        await carregarDadosParaFiltros();
        
        // Configurar event listeners
        configurarEventListeners();

        console.log('✅ Sistema de relatórios completos inicializado com sucesso!');

    } catch (error) {
        console.error('Erro na inicialização:', error);
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'block';
    }

    // Função para configurar datas padrão
    function configurarDatasPadrao() {
        if (!dataInicio || !dataFim) return;
        
        const hoje = new Date();
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(hoje.getDate() - 30);
        
        dataInicio.value = trintaDiasAtras.toISOString().split('T')[0];
        dataFim.value = hoje.toISOString().split('T')[0];
    }

    // Função para carregar dados para os filtros
    async function carregarDadosParaFiltros() {
        await Promise.all([
            carregarFuncionariosParaFiltro(),
            carregarTurmasParaFiltro(),
            carregarFazendasParaFiltro() 
        ]);
    }

    // Função para carregar funcionários
    async function carregarFuncionariosParaFiltro() {
        if (!funcionarioFiltro) return;
        
        try {
            const { data, error } = await supabase
                .from('funcionarios')
                .select(`
                    id,
                    nome,
                    turmas(nome)
                `)
                .order('nome');
                
            if (error) throw error;
            
            funcionarios = data || [];
            
            funcionarioFiltro.innerHTML = '<option value="">Selecione o funcionário</option><option value="todos">Todos os Funcionários</option>';
            funcionarios.forEach(funcionario => {
                const option = document.createElement('option');
                option.value = funcionario.id;
                option.textContent = `${funcionario.nome} - ${funcionario.turmas?.nome || 'Sem turma'}`;
                funcionarioFiltro.appendChild(option);
            });
            
            console.log(`✅ ${funcionarios.length} funcionários carregados`);
            
        } catch (error) {
            console.error('Erro ao carregar funcionários:', error);
            mostrarMensagem('Erro ao carregar lista de funcionários', 'error');
        }
    }

    // Função para carregar turmas
    async function carregarTurmasParaFiltro() {
        if (!turmaFiltro) return;
        
        try {
            const { data, error } = await supabase
                .from('turmas')
                .select('id, nome')
                .order('nome');
                
            if (error) throw error;
            
            turmas = data || [];
            
            turmaFiltro.innerHTML = '<option value="">Selecione a turma</option><option value="todos">Todas as Turmas</option>';
            turmas.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id;
                option.textContent = turma.nome;
                turmaFiltro.appendChild(option);
            });
            
            console.log(`✅ ${turmas.length} turmas carregadas`);
            
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            mostrarMensagem('Erro ao carregar lista de turmas', 'error');
        }
    }

    // Função para carregar fazendas
    async function carregarFazendasParaFiltro() {
        if (!fazendaFiltro) return;
        
        try {
            const { data, error } = await supabase
                .from('fazendas')
                .select('id, nome')
                .order('nome');
                
            if (error) throw error;
            
            fazendas = data || [];
            
            fazendaFiltro.innerHTML = '<option value="">Todas as Fazendas</option><option value="todos">Todas as Fazendas</option>';
            fazendas.forEach(fazenda => {
                const option = document.createElement('option');
                option.value = fazenda.id;
                option.textContent = fazenda.nome;
                fazendaFiltro.appendChild(option);
            });
            
            console.log(`✅ ${fazendas.length} fazendas carregadas`);
            
        } catch (error) {
            console.error('Erro ao carregar fazendas:', error);
            mostrarMensagem('Erro ao carregar lista de fazendas', 'error');
        }
    }

    // Função para configurar event listeners
    function configurarEventListeners() {
        // Controle de exibição dos grupos de filtro
        if (tipoRelatorioSelect) {
            tipoRelatorioSelect.addEventListener('change', function() {
                const tipo = this.value;
                if (tipo === 'funcionario') {
                    funcionarioGroup.style.display = 'block';
                    turmaGroup.style.display = 'none';
                } else if (tipo === 'turma') {
                    funcionarioGroup.style.display = 'none';
                    turmaGroup.style.display = 'block';
                } else {
                    funcionarioGroup.style.display = 'none';
                    turmaGroup.style.display = 'none';
                }
            });
        }
        
        if (gerarRelatorioBtn) {
            gerarRelatorioBtn.addEventListener('click', gerarRelatorio);
        }
        
        if (limparFiltrosBtn) {
            limparFiltrosBtn.addEventListener('click', limparFiltros);
        }
        
        if (imprimirBtn) {
            imprimirBtn.addEventListener('click', imprimirRelatorio);
        }
        
        // CORREÇÃO: Chama a função de exportação única com a nova lógica
        if (exportarPdfBtn) {
            exportarPdfBtn.addEventListener('click', exportarPDFProfissional);
        }

<<<<<<< HEAD
=======
        // CORREÇÃO: Chama a função de exportação única com a nova lógica
>>>>>>> 06a1383e7cf614ef1ba4a68d5b575e7413f0cf44
        if (exportarExcelBtn) {
            exportarExcelBtn.addEventListener('click', exportarExcel);
        }
    }

    // Função principal para gerar relatório
    async function gerarRelatorio() {
        const tipoRelatorio = tipoRelatorioSelect.value;
        const funcionarioId = funcionarioFiltro.value;
        const turmaId = turmaFiltro.value;
        const fazendaId = fazendaFiltro.value; 
        const dataInicioValue = dataInicio.value;
        const dataFimValue = dataFim.value;
        const ordenacao = ordenacaoSelect.value;
        const agruparPorData = agruparPorDataCheck.checked;
        
        // Validações
        if (!dataInicioValue || !dataFimValue) {
            mostrarMensagem('Preencha as datas de início e fim!', 'error');
            return;
        }
        
        if (new Date(dataInicioValue) > new Date(dataFimValue)) {
            mostrarMensagem('A data de início não pode ser maior que a data de fim!', 'error');
            return;
        }
        
        // Validar período máximo (365 dias)
        const diffTime = Math.abs(new Date(dataFimValue) - new Date(dataInicioValue));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 365) {
            mostrarMensagem('O período máximo permitido é de 365 dias', 'error');
            return;
        }
        
        try {
            mostrarMensagem('Gerando relatório... Aguarde', 'success');
            
            let query = supabase
                .from('cortes_funcionarios')
                .select(`
                    id,
                    metros,
                    valor,
                    created_at,
                    funcionarios(
                        id,
                        nome,
                        turmas(id, nome)
                    ),
                    apontamentos(
                        id,
                        data_corte,
                        turma,
                        preco_por_metro,
                        fazenda_id,
                        fazendas(nome),
                        talhoes(numero)
                    )
                `)
                .gte('apontamentos.data_corte', dataInicioValue)
                .lte('apontamentos.data_corte', dataFimValue);
            
            // Aplicar filtros conforme o tipo de relatório
            if (tipoRelatorio === 'funcionario' && funcionarioId && funcionarioId !== 'todos') {
                query = query.eq('funcionario_id', funcionarioId);
            } else if (tipoRelatorio === 'turma' && turmaId && turmaId !== 'todos') {
                query = query.eq('funcionarios.turma', turmaId);
            }
            
            // Aplicar filtro de Fazenda
            if (fazendaId && fazendaId !== 'todos') {
                query = query.eq('apontamentos.fazenda_id', fazendaId);
            }

            const { data: apontamentos, error } = await query;
                
            if (error) throw error;
            
            dadosRelatorio = apontamentos || [];
            
            // Ordenar dados
            ordenarDados(dadosRelatorio, ordenacao);
            
            // Exibir relatório
            if (dadosRelatorio.length > 0) {
                // Passa o fazendaId para a função exibirRelatorio
                exibirRelatorio(tipoRelatorio, funcionarioId, turmaId, fazendaId, dataInicioValue, dataFimValue, diffDays, agruparPorData); 
                relatorioContainer.style.display = 'block';
                semDados.style.display = 'none';
                mostrarMensagem(`Relatório gerado com ${dadosRelatorio.length} registros de produção`);
            } else {
                relatorioContainer.style.display = 'none';
                semDados.style.display = 'block';
                mostrarMensagem('Nenhum registro encontrado para os filtros selecionados', 'error');
            }
            
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            mostrarMensagem('Erro ao gerar relatório: ' + error.message, 'error');
        }
    }

    // Função para ordenar dados
    function ordenarDados(dados, ordenacao) {
        switch (ordenacao) {
            case 'data_asc':
                dados.sort((a, b) => {
                    const dataA = a.apontamentos?.data_corte ? new Date(a.apontamentos.data_corte) : 0;
                    const dataB = b.apontamentos?.data_corte ? new Date(b.apontamentos.data_corte) : 0;
                    return dataA - dataB;
                });
                break;
            case 'data_desc':
                dados.sort((a, b) => {
                    const dataA = a.apontamentos?.data_corte ? new Date(a.apontamentos.data_corte) : 0;
                    const dataB = b.apontamentos?.data_corte ? new Date(b.apontamentos.data_corte) : 0;
                    return dataB - dataA;
                });
                break;
            case 'valor_asc':
                // CORREÇÃO: Ordena pelo valor recalculado
                dados.sort((a, b) => {
                    const valorA = (a.metros || 0) * (a.apontamentos?.preco_por_metro || 0);
                    const valorB = (b.metros || 0) * (b.apontamentos?.preco_por_metro || 0);
                    return valorA - valorB;
                });
                break;
            case 'valor_desc':
                // CORREÇÃO: Ordena pelo valor recalculado
                dados.sort((a, b) => {
                    const valorA = (a.metros || 0) * (a.apontamentos?.preco_por_metro || 0);
                    const valorB = (b.metros || 0) * (b.apontamentos?.preco_por_metro || 0);
                    return valorB - valorA;
                });
                break;
        }
    }

    // Função para exibir relatório na interface
    function exibirRelatorio(tipoRelatorio, funcionarioId, turmaId, fazendaId, dataInicio, dataFim, diasPeriodo, agruparPorData) {
        // Configurar informações do relatório
        let tipoTexto = '';
        if (tipoRelatorio === 'funcionario') {
            if (funcionarioId === 'todos') {
                tipoTexto = 'Todos os Funcionários';
            } else {
                const funcionario = funcionarios.find(f => f.id === funcionarioId);
                tipoTexto = funcionario ? `Funcionário: ${funcionario.nome}` : 'Por Funcionário';
            }
        } else if (tipoRelatorio === 'turma') {
            if (turmaId === 'todos') {
                tipoTexto = 'Todas as Turmas';
            } else {
                const turma = turmas.find(t => t.id === turmaId);
                tipoTexto = turma ? `Turma: ${turma.nome}` : 'Por Turma';
            }
        } else {
            tipoTexto = 'Relatório Geral';
        }
        
        // Adiciona Fazenda no cabeçalho do relatório se filtrado por uma fazenda específica
        if (fazendaId && fazendaId !== 'todos') {
            const fazenda = fazendas.find(f => f.id === fazendaId);
            if (fazenda) {
                tipoTexto += (tipoTexto === 'Relatório Geral' ? '' : ' | ') + `Fazenda: ${fazenda.nome}`;
            }
        }
        
        document.getElementById('relatorio-tipo').textContent = tipoTexto;
        document.getElementById('relatorio-periodo').textContent = `${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
        document.getElementById('relatorio-emissao').textContent = formatarData(new Date());
        document.getElementById('relatorio-registros').textContent = dadosRelatorio.length;
        
        // Calcular totais e estatísticas (JÁ CORRIGIDO)
        const estatisticas = calcularEstatisticas(dadosRelatorio);
        
        // Atualizar cartões de resumo
        document.getElementById('total-dias').textContent = estatisticas.diasTrabalhados;
        document.getElementById('total-funcionarios').textContent = estatisticas.totalFuncionarios;
        document.getElementById('total-metros').textContent = estatisticas.totalMetros.toFixed(2);
        document.getElementById('total-valor').textContent = `R$ ${estatisticas.totalValor.toFixed(2)}`;
        
        // Preencher tabela de detalhes (JÁ CORRIGIDO)
        preencherTabelaDetalhes(dadosRelatorio, agruparPorData);
    }

    // Função para calcular estatísticas (CORRIGIDA)
    // Garante que o valor total seja sempre recalculado
    function calcularEstatisticas(dados) {
        let totalMetros = 0;
        let totalValor = 0;
        const diasTrabalhados = new Set();
        const funcionariosUnicos = new Set();
        
        dados.forEach(item => {
            const apontamento = item.apontamentos;
            if (!apontamento) return;
            
            // *** INÍCIO DA CORREÇÃO ***
            // Recalcula o valor baseado nos dados mestres, ignorando o item.valor salvo
            const metros = item.metros || 0;
            const precoPorMetro = apontamento.preco_por_metro || 0;
            const valorCorreto = metros * precoPorMetro;
            // *** FIM DA CORREÇÃO ***

            totalMetros += metros;
            totalValor += valorCorreto; // Usa o valor recalculado
            diasTrabalhados.add(apontamento.data_corte);
            funcionariosUnicos.add(item.funcionarios?.id);
        });
        
        return {
            totalMetros,
            totalValor,
            diasTrabalhados: diasTrabalhados.size,
            totalFuncionarios: funcionariosUnicos.size
        };
    }

    // Função para preencher tabela de detalhes (CORRIGIDA)
    // Garante que o valor exibido e somado seja sempre recalculado
    function preencherTabelaDetalhes(dados, agruparPorData) {
        const tbody = document.getElementById('detalhes-producao');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const tipoRelatorio = tipoRelatorioSelect.value;
        
        // Agrupar e ordenar por Funcionário (se for geral ou turma) e Data
        let dadosAgrupados = dados;
        if (tipoRelatorio === 'geral' || tipoRelatorio === 'turma') {
            dadosAgrupados = agruparEOrdenarPorFuncionario(dados);
        }
        
        let dataAtual = '';
        let funcionarioAtual = '';
        let subtotalData = { metros: 0, valor: 0 };
        let totalFuncionario = { metros: 0, valor: 0 };
        
        dadosAgrupados.forEach((item, index) => {
            const apontamento = item.apontamentos;
            const funcionario = item.funcionarios;
            
            if (!apontamento || !funcionario) return;
            
            const dataCorte = apontamento.data_corte;
            const dataFormatada = formatarData(dataCorte);
<<<<<<< HEAD
            const nomeFuncionario = funcionario.nome || 'N/A';
            
            // *** INÍCIO DA CORREÇÃO ***
            // Recalcula o valor para exibição e soma
            const metros = item.metros || 0;
            const precoPorMetro = apontamento?.preco_por_metro || 0; 
            const valorCorreto = metros * precoPorMetro;
            // *** FIM DA CORREÇÃO ***
            
=======
            const precoPorMetro = apontamento?.preco_por_metro || 0; 
            const nomeFuncionario = funcionario.nome || 'N/A';
            
>>>>>>> 06a1383e7cf614ef1ba4a68d5b575e7413f0cf44
            // --- INÍCIO: Agrupamento/Totalização por Funcionário (para 'geral' e 'turma') ---
            if ((tipoRelatorio === 'geral' || tipoRelatorio === 'turma') && funcionarioAtual !== funcionario.id) {
                if (funcionarioAtual !== '') {
                    // Adicionar TOTAL do Funcionário Anterior
                    adicionarLinhaTotalFuncionario(tbody, totalFuncionario, funcionarioAtual);
                    // Reinicia a data após o total do funcionário, para que o próximo funcione corretamente
                    dataAtual = ''; 
                }
                
                // Reiniciar totais
                funcionarioAtual = funcionario.id;
                subtotalData = { metros: 0, valor: 0 };
                totalFuncionario = { metros: 0, valor: 0 };
                
                // Adicionar CABEÇALHO do NOVO Funcionário
                adicionarLinhaCabecalhoFuncionario(tbody, nomeFuncionario, funcionario.turmas?.nome || 'Sem turma');
            }
            // --- FIM: Agrupamento/Totalização por Funcionário ---
            
            // --- INÍCIO: Agrupamento/Totalização por Data ---
            if (agruparPorData && dataAtual !== dataCorte) {
                if (dataAtual !== '') {
                    // Adicionar subtotal da data anterior
                    adicionarLinhaSubtotalData(tbody, subtotalData, dataAtual);
                }
                
                // Reiniciar subtotal para nova data
                dataAtual = dataCorte;
                subtotalData = { metros: 0, valor: 0 };
                
                // Adicionar cabeçalho da nova data
                adicionarLinhaCabecalhoData(tbody, dataFormatada);
            }
            // --- FIM: Agrupamento/Totalização por Data ---
            
            // Linha de Detalhe
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dataFormatada}</td>
                <td>${nomeFuncionario}</td>
                <td>${funcionario.turmas?.nome || 'Sem turma'}</td>
                <td>${apontamento.fazendas?.nome || 'N/A'}</td>
                <td>${apontamento.talhoes?.numero || 'N/A'}</td>
                <td>R$ ${precoPorMetro.toFixed(4)}</td> <td>${metros.toFixed(2)}</td>
                <td>R$ ${valorCorreto.toFixed(2)}</td> `;
            tbody.appendChild(tr);
            
            // Acumular totais
            if (agruparPorData) {
                subtotalData.metros += metros;
                subtotalData.valor += valorCorreto; // Soma o valor recalculado
            }
            if (tipoRelatorio === 'geral' || tipoRelatorio === 'turma') {
                totalFuncionario.metros += metros;
                totalFuncionario.valor += valorCorreto; // Soma o valor recalculado
            }
            if (tipoRelatorio === 'geral' || tipoRelatorio === 'turma') {
                totalFuncionario.metros += item.metros || 0;
                totalFuncionario.valor += item.valor || 0;
            }
        });
        
        // Adicionar subtotal final (da última data)
        if (agruparPorData && dataAtual !== '') {
            adicionarLinhaSubtotalData(tbody, subtotalData, dataAtual);
<<<<<<< HEAD
=======
        }
        
        // Adicionar total do último funcionário (se for agrupado)
        if ((tipoRelatorio === 'geral' || tipoRelatorio === 'turma') && funcionarioAtual !== '') {
            adicionarLinhaTotalFuncionario(tbody, totalFuncionario, funcionarioAtual);
>>>>>>> 06a1383e7cf614ef1ba4a68d5b575e7413f0cf44
        }
        
        // Adicionar total do último funcionário (se for agrupado)
        if ((tipoRelatorio === 'geral' || tipoRelatorio === 'turma') && funcionarioAtual !== '') {
            adicionarLinhaTotalFuncionario(tbody, totalFuncionario, funcionarioAtual);
        }
        
        // Adicionar linha de totais gerais (Já usa a função 'calcularEstatisticas' corrigida)
        const estatisticas = calcularEstatisticas(dados);
        const trTotal = document.createElement('tr');
        trTotal.className = 'total-row';
        trTotal.innerHTML = `
            <td colspan="6" style="text-align: right;">TOTAL GERAL</td>
            <td>${estatisticas.totalMetros.toFixed(2)}</td>
            <td>R$ ${estatisticas.totalValor.toFixed(2)}</td>
        `;
        tbody.appendChild(trTotal);
    }
    
    // NOVO: Função para agrupar e ordenar por Funcionário (necessário para o detalhamento individual)
    function agruparEOrdenarPorFuncionario(dados) {
        // 1. Criar uma cópia dos dados
        const dadosCopia = [...dados];

        // 2. Ordenar por Nome do Funcionário e depois pela data de corte (se necessário)
        dadosCopia.sort((a, b) => {
            const nomeA = a.funcionarios?.nome || 'ZZZ';
            const nomeB = b.funcionarios?.nome || 'ZZZ';
            
            if (nomeA < nomeB) return -1;
            if (nomeA > nomeB) return 1;

            // Ordenação secundária por data
            const dataA = a.apontamentos?.data_corte ? new Date(a.apontamentos.data_corte) : 0;
            const dataB = b.apontamentos?.data_corte ? new Date(b.apontamentos.data_corte) : 0;
            return dataB - dataA; // Data mais recente primeiro
        });

        return dadosCopia;
    }
    
    // NOVO: Funções auxiliares para adicionar linhas
    function adicionarLinhaCabecalhoFuncionario(tbody, nome, turma) {
         const trHeader = document.createElement('tr');
         trHeader.className = 'group-header';
         trHeader.innerHTML = `
             <td colspan="8" style="background: #1e3a23; color: white; text-align: center; font-size: 1.2rem; padding: 10px;">
                 👤 FUNCIONÁRIO: ${nome} (Turma: ${turma})
             </td>
         `;
         tbody.appendChild(trHeader);
    }
    
    function adicionarLinhaTotalFuncionario(tbody, totais, funcionarioId) {
        const funcionario = funcionarios.find(f => f.id === funcionarioId);
        const nome = funcionario?.nome || 'Total do Funcionário';

        const trTotal = document.createElement('tr');
        trTotal.style.cssText = 'font-weight: bold; background: #c3e6cb; color: #155724;';
        trTotal.innerHTML = `
            <td colspan="6" style="text-align: right;">TOTAL DE ${nome.toUpperCase()}</td>
            <td>${totais.metros.toFixed(2)}</td>
            <td>R$ ${totais.valor.toFixed(2)}</td>
        `;
        tbody.appendChild(trTotal);
    }
    
    function adicionarLinhaCabecalhoData(tbody, dataFormatada) {
         const trHeader = document.createElement('tr');
         trHeader.className = 'group-header';
         trHeader.innerHTML = `
             <td colspan="8" style="background: #2c5530; color: white; text-align: center; font-size: 1.1rem;">
                 📅 ${dataFormatada}
             </td>
         `;
         tbody.appendChild(trHeader);
    }
    
    function adicionarLinhaSubtotalData(tbody, totais, dataCorte) {
         const trSubtotal = document.createElement('tr');
         trSubtotal.className = 'group-header';
         trSubtotal.innerHTML = `
             <td colspan="6" style="text-align: right; background: #e9ecef;">Subtotal ${formatarData(dataCorte)}</td>
             <td style="background: #e9ecef;">${totais.metros.toFixed(2)}</td>
             <td style="background: #e9ecef;">R$ ${totais.valor.toFixed(2)}</td>
         `;
         tbody.appendChild(trSubtotal);
    }


<<<<<<< HEAD
    // FUNÇÃO PDF (CORRIGIDA)
    // Garante que o PDF recalcule os valores e exiba 4 casas decimais
=======
    // FUNÇÃO PDF (Exporta um único arquivo com agrupamento, com quebra de página por funcionário se for geral/turma)
>>>>>>> 06a1383e7cf614ef1ba4a68d5b575e7413f0cf44
    async function exportarPDFProfissional() {
        if (dadosRelatorio.length === 0) {
            mostrarMensagem('Gere o relatório primeiro ou não há dados para exportar.', 'error');
            return;
        }

        try {
            mostrarMensagem('Gerando PDF profissional...', 'success');
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4'); // Configuração A4
            
            const tipoRelatorio = tipoRelatorioSelect.value;
            const nomeRelatorio = document.getElementById('relatorio-tipo').textContent;
            const dataInicioValue = dataInicio.value;
            const dataFimValue = dataFim.value;
<<<<<<< HEAD
            
            // Usa a função já corrigida
            const estatisticasGerais = calcularEstatisticas(dadosRelatorio); 
=======
            const estatisticasGerais = calcularEstatisticas(dadosRelatorio);
>>>>>>> 06a1383e7cf614ef1ba4a68d5b575e7413f0cf44

            // 1. Preparar dados para loop (agrupa por funcionário se for geral/turma)
            let dadosPorFuncionario = {};
            let isIndividualReport = (tipoRelatorio === 'funcionario' && funcionarioFiltro.value !== 'todos');

            if (tipoRelatorio === 'geral' || tipoRelatorio === 'turma') {
                 // Agrupa e ordena para iteração
                 const dadosOrdenados = agruparEOrdenarPorFuncionario(dadosRelatorio); 
                 dadosOrdenados.forEach(item => {
                     const funcId = item.funcionarios?.id;
                     if (funcId) {
                         if (!dadosPorFuncionario[funcId]) {
                             dadosPorFuncionario[funcId] = [];
                         }
                         dadosPorFuncionario[funcId].push(item);
                     }
                 });
            } else {
                // Relatório Consolidado (Funcionário 'todos' ou Turma 'todos') ou Funcionário Individual
                dadosPorFuncionario['unico'] = dadosRelatorio;
            }
            
            const funcionarioIds = Object.keys(dadosPorFuncionario);
            let totalPaginas = 0;

            // Função para desenhar o cabeçalho base da página
            const drawBaseHeader = (doc) => {
                const pageWidth = doc.internal.pageSize.getWidth();
                doc.setFillColor(44, 85, 48);
                doc.rect(0, 0, pageWidth, 30, 'F');
                doc.setFontSize(16);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('AGRO CANA FORTE', pageWidth / 2, 15, { align: 'center' });
                doc.setFontSize(12);
                doc.text('ESPELHO DE PRODUÇÃO - CORTE DE CANA', pageWidth / 2, 22, { align: 'center' }); 
            };

            // 2. Iterar sobre cada funcionário (ou o grupo único)
            for (let i = 0; i < funcionarioIds.length; i++) {
                const funcId = funcionarioIds[i];
                const dadosFuncionario = dadosPorFuncionario[funcId];
<<<<<<< HEAD
                
                // Usa a função já corrigida
=======
>>>>>>> 06a1383e7cf614ef1ba4a68d5b575e7413f0cf44
                const estatisticasFuncionario = calcularEstatisticas(dadosFuncionario);
                
                // Se não for a primeira iteração E se o relatório for Geral/Turma (multi-funcionário), adiciona uma nova página
                if (i > 0 && (tipoRelatorio === 'geral' || tipoRelatorio === 'turma')) {
                    doc.addPage();
                } else if (i > 0 && isIndividualReport) {
                    // Se for relatório de funcionário individual, não adiciona página (apenas um relatório)
                    break;
                }

                // --- 2.1. Desenhar o Cabeçalho (Página 1) ---
                drawBaseHeader(doc);
                
                let yPosition = 40;
                
                // --- 2.2. Informações Específicas do Relatório/Funcionário ---
                doc.setFillColor(240, 240, 240);
                doc.rect(15, yPosition, doc.internal.pageSize.getWidth() - 30, 45, 'F');
                
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'normal');
                
                let funcNome = 'N/A';
                let funcTurma = 'N/A';
                let funcHeader = 'RELATÓRIO CONSOLIDADO';

                if (funcId !== 'unico') {
                    // Relatório Individual por Funcionário (dentro do loop do Geral/Turma)
                    const func = funcionarios.find(f => f.id === funcId);
                    funcNome = func?.nome || 'N/A';
                    funcTurma = func?.turmas?.nome || 'N/A';
                    funcHeader = `RELATÓRIO INDIVIDUAL - ${funcNome}`;
                } else {
                    funcHeader = nomeRelatorio;
                }

                
                let yStartInfo = yPosition + 10;
                doc.setFont('helvetica', 'bold');
                doc.text(`${funcHeader}`, 20, yStartInfo);
                doc.setFont('helvetica', 'normal');
                doc.text(`Período: ${formatarData(dataInicioValue)} a ${formatarData(dataFimValue)}`, 20, yStartInfo + 6);
                doc.text(`Data de Emissão: ${formatarData(new Date())}`, 20, yStartInfo + 12);
                doc.text(`Total de Registros (Deste): ${dadosFuncionario.length}`, 20, yStartInfo + 18);
                
                // --- CORREÇÃO DE POSIÇÃO: Ajusta a yPosition para começar o Resumo abaixo do bloco de informações (que termina em 85mm) ---
                yPosition = 95; // Posição segura para começar o resumo abaixo do bloco de 45mm (40 + 45 + 10 de margem)
                
                // --- 2.3. Resumo Estatístico (Deste Funcionário / Deste Relatório) ---
                doc.setFont('helvetica', 'bold');
                doc.text('RESUMO DA PRODUÇÃO', 15, yPosition);
                
                doc.setFont('helvetica', 'normal');
                const resumo = [
                    `Dias Trabalhados: ${estatisticasFuncionario.diasTrabalhados}`,
                    `Metros Cortados: ${estatisticasFuncionario.totalMetros.toFixed(2)} m`,
                    `Valor Total: R$ ${estatisticasFuncionario.totalValor.toFixed(2)}`
                ];
                
                // Adiciona informações de funcionários se for consolidado
                if (funcId === 'unico' || isIndividualReport) {
                     resumo.unshift(`Funcionários Envolvidos: ${estatisticasFuncionario.totalFuncionarios}`);
                }
                
                resumo.forEach((item, index) => {
                    doc.text(item, 15, yPosition + 10 + (index * 6));
                });
                
                // --- 2.4. Tabela de Detalhes ---
                yPosition += 40; // Ajuste para começar a tabela após o resumo
                const headers = [['Data', 'Funcionário', 'Turma', 'Fazenda', 'Talhão', 'Preço/m (R$)', 'Metros (m)', 'Valor (R$)']];
                const tableData = [];
                
                dadosFuncionario.forEach(item => {
                    const apontamento = item.apontamentos;
                    const funcionario = item.funcionarios;
                    
                    if (!apontamento || !funcionario) return;
<<<<<<< HEAD
                    
                    // *** INÍCIO DA CORREÇÃO ***
                    const metros = item.metros || 0;
                    const precoPorMetro = apontamento?.preco_por_metro || 0; 
                    const valorCorreto = metros * precoPorMetro;
                    // *** FIM DA CORREÇÃO ***
=======

                    const precoPorMetro = apontamento?.preco_por_metro || 0; 
>>>>>>> 06a1383e7cf614ef1ba4a68d5b575e7413f0cf44

                    tableData.push([
                        formatarData(apontamento.data_corte),
                        funcionario.nome || 'N/A',
                        funcionario.turmas?.nome || 'Sem turma',
                        apontamento.fazendas?.nome || 'N/A',
                        apontamento.talhoes?.numero || 'N/A',
<<<<<<< HEAD
                        `R$ ${precoPorMetro.toFixed(4)}`, // <--- ALTERAÇÃO AQUI
                        metros.toFixed(2),
                        `R$ ${valorCorreto.toFixed(2)}` // Usa o valor recalculado
                    ]);
                });
                
                // Adicionar Totais do Funcionário/Grupo (Já usa 'estatisticasFuncionario' corrigido)
=======
                        `R$ ${precoPorMetro.toFixed(2)}`,
                        item.metros.toFixed(2),
                        `R$ ${item.valor.toFixed(2)}`
                    ]);
                });
                
                // Adicionar Totais do Funcionário/Grupo
>>>>>>> 06a1383e7cf614ef1ba4a68d5b575e7413f0cf44
                tableData.push([
                    { content: 'TOTAL DE PRODUÇÃO', colSpan: 6, styles: { fontStyle: 'bold', fillColor: [195, 230, 203], halign: 'right' } },
                    { content: estatisticasFuncionario.totalMetros.toFixed(2), styles: { fontStyle: 'bold', fillColor: [195, 230, 203] } },
                    { content: `R$ ${estatisticasFuncionario.totalValor.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [195, 230, 203] } }
                ]);
                
                // Gera a tabela
                doc.autoTable({
                    startY: yPosition,
                    head: headers,
                    body: tableData,
                    margin: { top: 15, left: 15, right: 15 },
                    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                    headStyles: { fillColor: [44, 85, 48], textColor: 255, fontStyle: 'bold' },
                    
                    didDrawPage: function(data) {
                        // Redesenha o cabeçalho em páginas de continuação do mesmo funcionário
                        if (data.pageNumber > totalPaginas + 1) { 
                            drawBaseHeader(doc);
                        }
                        
                        // Rodapé em todas as páginas
                        const pageWidth = doc.internal.pageSize.getWidth();
                        doc.setFontSize(8);
                        doc.setTextColor(100, 100, 100);
                        doc.text(
                            `Página ${doc.internal.getNumberOfPages()} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
                            pageWidth / 2,
                            doc.internal.pageSize.getHeight() - 10,
                            { align: 'center' }
                        );
                    }
                });

                // Atualiza a contagem total de páginas para o rodapé
                totalPaginas = doc.internal.getNumberOfPages();
            }
            
            // 3. Adiciona o TOTAL GERAL na última página se for um relatório consolidado
            if (funcionarioIds.length > 1 || (funcionarioIds[0] === 'unico' && !isIndividualReport && dadosRelatorio.length > 0)) {
                 
                 if (funcionarioIds.length > 1) { // Só adiciona nova página se for relatório multifolha
                    doc.addPage();
                    drawBaseHeader(doc); // Desenha o cabeçalho
                 }
                 
                 let yStartTotal = 40;
                 doc.setFontSize(14);
                 doc.setTextColor(44, 85, 48);
                 doc.setFont('helvetica', 'bold');
                 doc.text('RESUMO GERAL DO PERÍODO', 15, yStartTotal);
                 
                 yStartTotal += 10;
                 
<<<<<<< HEAD
                 // Usa 'estatisticasGerais' (já corrigido)
=======
>>>>>>> 06a1383e7cf614ef1ba4a68d5b575e7413f0cf44
                 const summaryData = [
                     ['Itens', 'Valor'],
                     ['Total de Dias Trabalhados', estatisticasGerais.diasTrabalhados.toString()],
                     ['Total de Funcionários Envolvidos', estatisticasGerais.totalFuncionarios.toString()],
                     ['Total de Metros Cortados (m)', estatisticasGerais.totalMetros.toFixed(2)],
                     ['VALOR TOTAL GERAL (R$)', `R$ ${estatisticasGerais.totalValor.toFixed(2)}`],
                 ];

                 doc.autoTable({
                     startY: yStartTotal,
                     head: [summaryData[0]],
                     body: summaryData.slice(1, summaryData.length - 1),
                     foot: [[summaryData[summaryData.length - 1][0], summaryData[summaryData.length - 1][1]]],
                     margin: { top: 15, left: 15, right: 15 },
                     styles: { fontSize: 10, cellPadding: 3 },
                     headStyles: { fillColor: [44, 85, 48], textColor: 255, fontStyle: 'bold' },
                     footStyles: { fillColor: [44, 85, 48], textColor: 255, fontStyle: 'bold' },
                     alternateRowStyles: { fillColor: [240, 240, 240] },
                 });
            }
            
            // Salvar PDF
            const fileName = `relatorio_producao_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            mostrarMensagem('PDF gerado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            mostrarMensagem('Erro ao gerar PDF: ' + error.message, 'error');
        }
    }

<<<<<<< HEAD
    // FUNÇÃO EXCEL (CORRIGIDA)
    // Garante que o Excel recalcule os valores e exiba 4 casas decimais
=======
    // FUNÇÃO EXCEL (Exporta um único arquivo sem agrupamento de metadados, apenas dados brutos)
>>>>>>> 06a1383e7cf614ef1ba4a68d5b575e7413f0cf44
    function exportarExcel() {
        if (dadosRelatorio.length === 0) {
            mostrarMensagem('Gere o relatório primeiro ou não há dados para exportar.', 'error');
            return;
        }

        try {
            mostrarMensagem('Preparando exportação para Excel...', 'success');

            // Define os dados a serem exportados, garantindo que o relatório "Geral" seja agrupado por funcionário
            const dadosParaExportacao = (tipoRelatorioSelect.value === 'geral' || tipoRelatorioSelect.value === 'turma')
                                        ? agruparEOrdenarPorFuncionario(dadosRelatorio)
                                        : dadosRelatorio;

            const headers = [
                "Data", 
                "Funcionario", 
                "Turma", 
                "Fazenda", 
                "Talhao", 
                "Preco/m (R$)", 
                "Metros (m)", 
                "Valor (R$)"
            ].join(';');

            const csvData = dadosParaExportacao.map(item => {
                const apontamento = item.apontamentos;
                const funcionario = item.funcionarios;

                const data = formatarData(apontamento?.data_corte);
                const nomeFuncionario = funcionario?.nome || 'N/A';
                const nomeTurma = funcionario?.turmas?.nome || 'Sem turma';
                const nomeFazenda = apontamento?.fazendas?.nome || 'N/A';
                const numTalhao = apontamento?.talhoes?.numero || 'N/A';
<<<<<<< HEAD
                
                // *** INÍCIO DA CORREÇÃO ***
                const metros = item.metros || 0;
                const precoPorMetro = apontamento?.preco_por_metro || 0;
                const valorCorreto = metros * precoPorMetro;
                // *** FIM DA CORREÇÃO ***

                // Formata para o padrão CSV brasileiro (vírgula como decimal)
                const precoPorMetroStr = precoPorMetro.toFixed(4).replace('.', ',') || '0,0000'; // <--- ALTERAÇÃO AQUI
                const metrosStr = metros.toFixed(2).replace('.', ',') || '0,00';
                const valorStr = valorCorreto.toFixed(2).replace('.', ',') || '0,00'; // Usa o valor recalculado
=======
                const precoPorMetro = apontamento?.preco_por_metro?.toFixed(2).replace('.', ',') || '0,00';
                const metros = item.metros?.toFixed(2).replace('.', ',') || '0,00';
                const valor = item.valor?.toFixed(2).replace('.', ',') || '0,00';
>>>>>>> 06a1383e7cf614ef1ba4a68d5b575e7413f0cf44

                return [
                    data, 
                    `"${nomeFuncionario}"`,
                    `"${nomeTurma}"`,
                    `"${nomeFazenda}"`,
                    numTalhao,
                    precoPorMetroStr,
                    metrosStr,
                    valorStr
                ].join(';');
            }).join('\n');

            const csvContent = headers + '\n' + csvData;
            
            // Cria o Blob e o link para download
            const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const fileName = `relatorio_producao_${new Date().toISOString().split('T')[0]}.csv`;

            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            mostrarMensagem('Exportação para Excel concluída!', 'success');

        } catch (error) {
            console.error('Erro ao exportar para Excel:', error);
            mostrarMensagem('Erro ao exportar para Excel: ' + error.message, 'error');
        }
    }

    // Função para imprimir relatório
    function imprimirRelatorio() {
        window.print();
    }

    // Função para limpar filtros
    function limparFiltros() {
        tipoRelatorioSelect.value = 'funcionario';
        funcionarioFiltro.value = '';
        turmaFiltro.value = '';
        fazendaFiltro.value = ''; 
        configurarDatasPadrao();
        ordenacaoSelect.value = 'data_desc';
        agruparPorDataCheck.checked = true;
        
        funcionarioGroup.style.display = 'block';
        turmaGroup.style.display = 'none';
        
        relatorioContainer.style.display = 'none';
        semDados.style.display = 'block';
        
        mostrarMensagem('Filtros limpos com sucesso!');
    }

    // Configurar botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (window.sistemaAuth && typeof window.sistemaAuth.fazerLogout === 'function') {
                window.sistemaAuth.fazerLogout();
            } else {
                localStorage.removeItem('usuarioLogado');
                window.location.href = 'login.html';
            }
        });
    }
=======
// js/relatorios-completos.js - VERSÃO CORRIGIDA (COM 4 CASAS DECIMAIS NO PREÇO/M)

document.addEventListener('DOMContentLoaded', async function() {
    // Elementos do DOM
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    const errorElement = document.getElementById('error-message');
    const tipoRelatorioSelect = document.getElementById('tipo-relatorio');
    const funcionarioFiltro = document.getElementById('funcionario-filtro');
    const turmaFiltro = document.getElementById('turma-filtro');
    const fazendaFiltro = document.getElementById('fazenda-filtro'); 
    const funcionarioGroup = document.getElementById('funcionario-group');
    const turmaGroup = document.getElementById('turma-group');
    const dataInicio = document.getElementById('data-inicio');
    const dataFim = document.getElementById('data-fim');
    const ordenacaoSelect = document.getElementById('ordenacao');
    const agruparPorDataCheck = document.getElementById('agrupar-por-data');
    const gerarRelatorioBtn = document.getElementById('gerar-relatorio');
    const limparFiltrosBtn = document.getElementById('limpar-filtros');
    const relatorioContainer = document.getElementById('relatorio-container');
    const semDados = document.getElementById('sem-dados');
    const imprimirBtn = document.getElementById('imprimir-relatorio');
    const exportarPdfBtn = document.getElementById('exportar-pdf');
    const exportarExcelBtn = document.getElementById('exportar-excel'); 
    
    // Variáveis para armazenar dados
    let funcionarios = [];
    let turmas = [];
    let fazendas = []; 
    let dadosRelatorio = [];

    try {
        // Configurar interface inicial
        if (loadingElement) loadingElement.style.display = 'block';
        if (contentElement) contentElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';
        if (relatorioContainer) relatorioContainer.style.display = 'none';
        if (semDados) semDados.style.display = 'none';

        // Testar conexão
        await testarConexaoSupabase();
        
        // Mostrar conteúdo principal
        if (loadingElement) loadingElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'block';

        // Configurar datas padrão (últimos 30 dias)
        configurarDatasPadrao();
        
        // Carregar dados para os filtros
        await carregarDadosParaFiltros();
        
        // Configurar event listeners
        configurarEventListeners();

        console.log('✅ Sistema de relatórios completos inicializado com sucesso!');

    } catch (error) {
        console.error('Erro na inicialização:', error);
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'block';
    }

    // Função para configurar datas padrão
    function configurarDatasPadrao() {
        if (!dataInicio || !dataFim) return;
        
        const hoje = new Date();
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(hoje.getDate() - 30);
        
        dataInicio.value = trintaDiasAtras.toISOString().split('T')[0];
        dataFim.value = hoje.toISOString().split('T')[0];
    }

    // Função para carregar dados para os filtros
    async function carregarDadosParaFiltros() {
        await Promise.all([
            carregarFuncionariosParaFiltro(),
            carregarTurmasParaFiltro(),
            carregarFazendasParaFiltro() 
        ]);
    }

    // Função para carregar funcionários
    async function carregarFuncionariosParaFiltro() {
        if (!funcionarioFiltro) return;
        
        try {
            const { data, error } = await supabase
                .from('funcionarios')
                .select(`
                    id,
                    nome,
                    turmas(nome)
                `)
                .order('nome');
                
            if (error) throw error;
            
            funcionarios = data || [];
            
            funcionarioFiltro.innerHTML = '<option value="">Selecione o funcionário</option><option value="todos">Todos os Funcionários</option>';
            funcionarios.forEach(funcionario => {
                const option = document.createElement('option');
                option.value = funcionario.id;
                option.textContent = `${funcionario.nome} - ${funcionario.turmas?.nome || 'Sem turma'}`;
                funcionarioFiltro.appendChild(option);
            });
            
            console.log(`✅ ${funcionarios.length} funcionários carregados`);
            
        } catch (error) {
            console.error('Erro ao carregar funcionários:', error);
            mostrarMensagem('Erro ao carregar lista de funcionários', 'error');
        }
    }

    // Função para carregar turmas
    async function carregarTurmasParaFiltro() {
        if (!turmaFiltro) return;
        
        try {
            const { data, error } = await supabase
                .from('turmas')
                .select('id, nome')
                .order('nome');
                
            if (error) throw error;
            
            turmas = data || [];
            
            turmaFiltro.innerHTML = '<option value="">Selecione a turma</option><option value="todos">Todas as Turmas</option>';
            turmas.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id;
                option.textContent = turma.nome;
                turmaFiltro.appendChild(option);
            });
            
            console.log(`✅ ${turmas.length} turmas carregadas`);
            
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            mostrarMensagem('Erro ao carregar lista de turmas', 'error');
        }
    }

    // Função para carregar fazendas
    async function carregarFazendasParaFiltro() {
        if (!fazendaFiltro) return;
        
        try {
            const { data, error } = await supabase
                .from('fazendas')
                .select('id, nome')
                .order('nome');
                
            if (error) throw error;
            
            fazendas = data || [];
            
            fazendaFiltro.innerHTML = '<option value="">Todas as Fazendas</option><option value="todos">Todas as Fazendas</option>';
            fazendas.forEach(fazenda => {
                const option = document.createElement('option');
                option.value = fazenda.id;
                option.textContent = fazenda.nome;
                fazendaFiltro.appendChild(option);
            });
            
            console.log(`✅ ${fazendas.length} fazendas carregadas`);
            
        } catch (error) {
            console.error('Erro ao carregar fazendas:', error);
            mostrarMensagem('Erro ao carregar lista de fazendas', 'error');
        }
    }

    // Função para configurar event listeners
    function configurarEventListeners() {
        // Controle de exibição dos grupos de filtro
        if (tipoRelatorioSelect) {
            tipoRelatorioSelect.addEventListener('change', function() {
                const tipo = this.value;
                if (tipo === 'funcionario') {
                    funcionarioGroup.style.display = 'block';
                    turmaGroup.style.display = 'none';
                } else if (tipo === 'turma') {
                    funcionarioGroup.style.display = 'none';
                    turmaGroup.style.display = 'block';
                } else {
                    funcionarioGroup.style.display = 'none';
                    turmaGroup.style.display = 'none';
                }
            });
        }
        
        if (gerarRelatorioBtn) {
            gerarRelatorioBtn.addEventListener('click', gerarRelatorio);
        }
        
        if (limparFiltrosBtn) {
            limparFiltrosBtn.addEventListener('click', limparFiltros);
        }
        
        if (imprimirBtn) {
            imprimirBtn.addEventListener('click', imprimirRelatorio);
        }
        
        if (exportarPdfBtn) {
            exportarPdfBtn.addEventListener('click', exportarPDFProfissional);
        }

        if (exportarExcelBtn) {
            exportarExcelBtn.addEventListener('click', exportarExcel);
        }
    }

    // Função principal para gerar relatório
    async function gerarRelatorio() {
        const tipoRelatorio = tipoRelatorioSelect.value;
        const funcionarioId = funcionarioFiltro.value;
        const turmaId = turmaFiltro.value;
        const fazendaId = fazendaFiltro.value; 
        const dataInicioValue = dataInicio.value;
        const dataFimValue = dataFim.value;
        const ordenacao = ordenacaoSelect.value;
        const agruparPorData = agruparPorDataCheck.checked;
        
        // Validações
        if (!dataInicioValue || !dataFimValue) {
            mostrarMensagem('Preencha as datas de início e fim!', 'error');
            return;
        }
        
        if (new Date(dataInicioValue) > new Date(dataFimValue)) {
            mostrarMensagem('A data de início não pode ser maior que a data de fim!', 'error');
            return;
        }
        
        // Validar período máximo (365 dias)
        const diffTime = Math.abs(new Date(dataFimValue) - new Date(dataInicioValue));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 365) {
            mostrarMensagem('O período máximo permitido é de 365 dias', 'error');
            return;
        }
        
        try {
            mostrarMensagem('Gerando relatório... Aguarde', 'success');
            
            let query = supabase
                .from('cortes_funcionarios')
                .select(`
                    id,
                    metros,
                    valor,
                    created_at,
                    funcionarios(
                        id,
                        nome,
                        turmas(id, nome)
                    ),
                    apontamentos(
                        id,
                        data_corte,
                        turma,
                        preco_por_metro,
                        fazenda_id,
                        fazendas(nome),
                        talhoes(numero)
                    )
                `)
                .gte('apontamentos.data_corte', dataInicioValue)
                .lte('apontamentos.data_corte', dataFimValue);
            
            // Aplicar filtros conforme o tipo de relatório
            if (tipoRelatorio === 'funcionario' && funcionarioId && funcionarioId !== 'todos') {
                query = query.eq('funcionario_id', funcionarioId);
            } else if (tipoRelatorio === 'turma' && turmaId && turmaId !== 'todos') {
                query = query.eq('funcionarios.turma', turmaId);
            }
            
            // Aplicar filtro de Fazenda
            if (fazendaId && fazendaId !== 'todos') {
                query = query.eq('apontamentos.fazenda_id', fazendaId);
            }

            const { data: apontamentos, error } = await query;
                
            if (error) throw error;
            
            dadosRelatorio = apontamentos || [];
            
            // Ordenar dados
            ordenarDados(dadosRelatorio, ordenacao);
            
            // Exibir relatório
            if (dadosRelatorio.length > 0) {
                // Passa o fazendaId para a função exibirRelatorio
                exibirRelatorio(tipoRelatorio, funcionarioId, turmaId, fazendaId, dataInicioValue, dataFimValue, diffDays, agruparPorData); 
                relatorioContainer.style.display = 'block';
                semDados.style.display = 'none';
                mostrarMensagem(`Relatório gerado com ${dadosRelatorio.length} registros de produção`);
            } else {
                relatorioContainer.style.display = 'none';
                semDados.style.display = 'block';
                mostrarMensagem('Nenhum registro encontrado para os filtros selecionados', 'error');
            }
            
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            mostrarMensagem('Erro ao gerar relatório: ' + error.message, 'error');
        }
    }

    // Função para ordenar dados
    function ordenarDados(dados, ordenacao) {
        switch (ordenacao) {
            case 'data_asc':
                dados.sort((a, b) => {
                    const dataA = a.apontamentos?.data_corte ? new Date(a.apontamentos.data_corte) : 0;
                    const dataB = b.apontamentos?.data_corte ? new Date(b.apontamentos.data_corte) : 0;
                    return dataA - dataB;
                });
                break;
            case 'data_desc':
                dados.sort((a, b) => {
                    const dataA = a.apontamentos?.data_corte ? new Date(a.apontamentos.data_corte) : 0;
                    const dataB = b.apontamentos?.data_corte ? new Date(b.apontamentos.data_corte) : 0;
                    return dataB - dataA;
                });
                break;
            case 'valor_asc':
                // CORREÇÃO: Ordena pelo valor recalculado
                dados.sort((a, b) => {
                    const valorA = (a.metros || 0) * (a.apontamentos?.preco_por_metro || 0);
                    const valorB = (b.metros || 0) * (b.apontamentos?.preco_por_metro || 0);
                    return valorA - valorB;
                });
                break;
            case 'valor_desc':
                // CORREÇÃO: Ordena pelo valor recalculado
                dados.sort((a, b) => {
                    const valorA = (a.metros || 0) * (a.apontamentos?.preco_por_metro || 0);
                    const valorB = (b.metros || 0) * (b.apontamentos?.preco_por_metro || 0);
                    return valorB - valorA;
                });
                break;
        }
    }

    // Função para exibir relatório na interface
    function exibirRelatorio(tipoRelatorio, funcionarioId, turmaId, fazendaId, dataInicio, dataFim, diasPeriodo, agruparPorData) {
        // Configurar informações do relatório
        let tipoTexto = '';
        if (tipoRelatorio === 'funcionario') {
            if (funcionarioId === 'todos') {
                tipoTexto = 'Todos os Funcionários';
            } else {
                const funcionario = funcionarios.find(f => f.id === funcionarioId);
                tipoTexto = funcionario ? `Funcionário: ${funcionario.nome}` : 'Por Funcionário';
            }
        } else if (tipoRelatorio === 'turma') {
            if (turmaId === 'todos') {
                tipoTexto = 'Todas as Turmas';
            } else {
                const turma = turmas.find(t => t.id === turmaId);
                tipoTexto = turma ? `Turma: ${turma.nome}` : 'Por Turma';
            }
        } else {
            tipoTexto = 'Relatório Geral';
        }
        
        // Adiciona Fazenda no cabeçalho do relatório se filtrado por uma fazenda específica
        if (fazendaId && fazendaId !== 'todos') {
            const fazenda = fazendas.find(f => f.id === fazendaId);
            if (fazenda) {
                tipoTexto += (tipoTexto === 'Relatório Geral' ? '' : ' | ') + `Fazenda: ${fazenda.nome}`;
            }
        }
        
        document.getElementById('relatorio-tipo').textContent = tipoTexto;
        document.getElementById('relatorio-periodo').textContent = `${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
        document.getElementById('relatorio-emissao').textContent = formatarData(new Date());
        document.getElementById('relatorio-registros').textContent = dadosRelatorio.length;
        
        // Calcular totais e estatísticas (JÁ CORRIGIDO)
        const estatisticas = calcularEstatisticas(dadosRelatorio);
        
        // Atualizar cartões de resumo
        document.getElementById('total-dias').textContent = estatisticas.diasTrabalhados;
        document.getElementById('total-funcionarios').textContent = estatisticas.totalFuncionarios;
        document.getElementById('total-metros').textContent = estatisticas.totalMetros.toFixed(2);
        document.getElementById('total-valor').textContent = `R$ ${estatisticas.totalValor.toFixed(2)}`;
        
        // Preencher tabela de detalhes (JÁ CORRIGIDO)
        preencherTabelaDetalhes(dadosRelatorio, agruparPorData);
    }

    // Função para calcular estatísticas (CORRIGIDA)
    // Garante que o valor total seja sempre recalculado
    function calcularEstatisticas(dados) {
        let totalMetros = 0;
        let totalValor = 0;
        const diasTrabalhados = new Set();
        const funcionariosUnicos = new Set();
        
        dados.forEach(item => {
            const apontamento = item.apontamentos;
            if (!apontamento) return;
            
            // *** INÍCIO DA CORREÇÃO ***
            // Recalcula o valor baseado nos dados mestres, ignorando o item.valor salvo
            const metros = item.metros || 0;
            const precoPorMetro = apontamento.preco_por_metro || 0;
            const valorCorreto = metros * precoPorMetro;
            // *** FIM DA CORREÇÃO ***

            totalMetros += metros;
            totalValor += valorCorreto; // Usa o valor recalculado
            diasTrabalhados.add(apontamento.data_corte);
            funcionariosUnicos.add(item.funcionarios?.id);
        });
        
        return {
            totalMetros,
            totalValor,
            diasTrabalhados: diasTrabalhados.size,
            totalFuncionarios: funcionariosUnicos.size
        };
    }

    // Função para preencher tabela de detalhes (CORRIGIDA)
    // Garante que o valor exibido e somado seja sempre recalculado
    function preencherTabelaDetalhes(dados, agruparPorData) {
        const tbody = document.getElementById('detalhes-producao');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const tipoRelatorio = tipoRelatorioSelect.value;
        
        // Agrupar e ordenar por Funcionário (se for geral ou turma) e Data
        let dadosAgrupados = dados;
        if (tipoRelatorio === 'geral' || tipoRelatorio === 'turma') {
            dadosAgrupados = agruparEOrdenarPorFuncionario(dados);
        }
        
        let dataAtual = '';
        let funcionarioAtual = '';
        let subtotalData = { metros: 0, valor: 0 };
        let totalFuncionario = { metros: 0, valor: 0 };
        
        dadosAgrupados.forEach((item, index) => {
            const apontamento = item.apontamentos;
            const funcionario = item.funcionarios;
            
            if (!apontamento || !funcionario) return;
            
            const dataCorte = apontamento.data_corte;
            const dataFormatada = formatarData(dataCorte);
            const nomeFuncionario = funcionario.nome || 'N/A';
            
            // *** INÍCIO DA CORREÇÃO ***
            // Recalcula o valor para exibição e soma
            const metros = item.metros || 0;
            const precoPorMetro = apontamento?.preco_por_metro || 0; 
            const valorCorreto = metros * precoPorMetro;
            // *** FIM DA CORREÇÃO ***
            
            // --- INÍCIO: Agrupamento/Totalização por Funcionário (para 'geral' e 'turma') ---
            if ((tipoRelatorio === 'geral' || tipoRelatorio === 'turma') && funcionarioAtual !== funcionario.id) {
                if (funcionarioAtual !== '') {
                    // Adicionar TOTAL do Funcionário Anterior
                    adicionarLinhaTotalFuncionario(tbody, totalFuncionario, funcionarioAtual);
                    // Reinicia a data após o total do funcionário, para que o próximo funcione corretamente
                    dataAtual = ''; 
                }
                
                // Reiniciar totais
                funcionarioAtual = funcionario.id;
                subtotalData = { metros: 0, valor: 0 };
                totalFuncionario = { metros: 0, valor: 0 };
                
                // Adicionar CABEÇALHO do NOVO Funcionário
                adicionarLinhaCabecalhoFuncionario(tbody, nomeFuncionario, funcionario.turmas?.nome || 'Sem turma');
            }
            // --- FIM: Agrupamento/Totalização por Funcionário ---
            
            // --- INÍCIO: Agrupamento/Totalização por Data ---
            if (agruparPorData && dataAtual !== dataCorte) {
                if (dataAtual !== '') {
                    // Adicionar subtotal da data anterior
                    adicionarLinhaSubtotalData(tbody, subtotalData, dataAtual);
                }
                
                // Reiniciar subtotal para nova data
                dataAtual = dataCorte;
                subtotalData = { metros: 0, valor: 0 };
                
                // Adicionar cabeçalho da nova data
                adicionarLinhaCabecalhoData(tbody, dataFormatada);
            }
            // --- FIM: Agrupamento/Totalização por Data ---
            
            // Linha de Detalhe
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dataFormatada}</td>
                <td>${nomeFuncionario}</td>
                <td>${funcionario.turmas?.nome || 'Sem turma'}</td>
                <td>${apontamento.fazendas?.nome || 'N/A'}</td>
                <td>${apontamento.talhoes?.numero || 'N/A'}</td>
                <td>R$ ${precoPorMetro.toFixed(4)}</td> <td>${metros.toFixed(2)}</td>
                <td>R$ ${valorCorreto.toFixed(2)}</td> `;
            tbody.appendChild(tr);
            
            // Acumular totais
            if (agruparPorData) {
                subtotalData.metros += metros;
                subtotalData.valor += valorCorreto; // Soma o valor recalculado
            }
            if (tipoRelatorio === 'geral' || tipoRelatorio === 'turma') {
                totalFuncionario.metros += metros;
                totalFuncionario.valor += valorCorreto; // Soma o valor recalculado
            }
        });
        
        // Adicionar subtotal final (da última data)
        if (agruparPorData && dataAtual !== '') {
            adicionarLinhaSubtotalData(tbody, subtotalData, dataAtual);
        }
        
        // Adicionar total do último funcionário (se for agrupado)
        if ((tipoRelatorio === 'geral' || tipoRelatorio === 'turma') && funcionarioAtual !== '') {
            adicionarLinhaTotalFuncionario(tbody, totalFuncionario, funcionarioAtual);
        }
        
        // Adicionar linha de totais gerais (Já usa a função 'calcularEstatisticas' corrigida)
        const estatisticas = calcularEstatisticas(dados);
        const trTotal = document.createElement('tr');
        trTotal.className = 'total-row';
        trTotal.innerHTML = `
            <td colspan="6" style="text-align: right;">TOTAL GERAL</td>
            <td>${estatisticas.totalMetros.toFixed(2)}</td>
            <td>R$ ${estatisticas.totalValor.toFixed(2)}</td>
        `;
        tbody.appendChild(trTotal);
    }
    
    // NOVO: Função para agrupar e ordenar por Funcionário (necessário para o detalhamento individual)
    function agruparEOrdenarPorFuncionario(dados) {
        // 1. Criar uma cópia dos dados
        const dadosCopia = [...dados];

        // 2. Ordenar por Nome do Funcionário e depois pela data de corte (se necessário)
        dadosCopia.sort((a, b) => {
            const nomeA = a.funcionarios?.nome || 'ZZZ';
            const nomeB = b.funcionarios?.nome || 'ZZZ';
            
            if (nomeA < nomeB) return -1;
            if (nomeA > nomeB) return 1;

            // Ordenação secundária por data
            const dataA = a.apontamentos?.data_corte ? new Date(a.apontamentos.data_corte) : 0;
            const dataB = b.apontamentos?.data_corte ? new Date(b.apontamentos.data_corte) : 0;
            return dataB - dataA; // Data mais recente primeiro
        });

        return dadosCopia;
    }
    
    // NOVO: Funções auxiliares para adicionar linhas
    function adicionarLinhaCabecalhoFuncionario(tbody, nome, turma) {
         const trHeader = document.createElement('tr');
         trHeader.className = 'group-header';
         trHeader.innerHTML = `
             <td colspan="8" style="background: #1e3a23; color: white; text-align: center; font-size: 1.2rem; padding: 10px;">
                 👤 FUNCIONÁRIO: ${nome} (Turma: ${turma})
             </td>
         `;
         tbody.appendChild(trHeader);
    }
    
    function adicionarLinhaTotalFuncionario(tbody, totais, funcionarioId) {
        const funcionario = funcionarios.find(f => f.id === funcionarioId);
        const nome = funcionario?.nome || 'Total do Funcionário';

        const trTotal = document.createElement('tr');
        trTotal.style.cssText = 'font-weight: bold; background: #c3e6cb; color: #155724;';
        trTotal.innerHTML = `
            <td colspan="6" style="text-align: right;">TOTAL DE ${nome.toUpperCase()}</td>
            <td>${totais.metros.toFixed(2)}</td>
            <td>R$ ${totais.valor.toFixed(2)}</td>
        `;
        tbody.appendChild(trTotal);
    }
    
    function adicionarLinhaCabecalhoData(tbody, dataFormatada) {
         const trHeader = document.createElement('tr');
         trHeader.className = 'group-header';
         trHeader.innerHTML = `
             <td colspan="8" style="background: #2c5530; color: white; text-align: center; font-size: 1.1rem;">
                 📅 ${dataFormatada}
             </td>
         `;
         tbody.appendChild(trHeader);
    }
    
    function adicionarLinhaSubtotalData(tbody, totais, dataCorte) {
         const trSubtotal = document.createElement('tr');
         trSubtotal.className = 'group-header';
         trSubtotal.innerHTML = `
             <td colspan="6" style="text-align: right; background: #e9ecef;">Subtotal ${formatarData(dataCorte)}</td>
             <td style="background: #e9ecef;">${totais.metros.toFixed(2)}</td>
             <td style="background: #e9ecef;">R$ ${totais.valor.toFixed(2)}</td>
         `;
         tbody.appendChild(trSubtotal);
    }


    // FUNÇÃO PDF (CORRIGIDA)
    // Garante que o PDF recalcule os valores e exiba 4 casas decimais
    async function exportarPDFProfissional() {
        if (dadosRelatorio.length === 0) {
            mostrarMensagem('Gere o relatório primeiro ou não há dados para exportar.', 'error');
            return;
        }

        try {
            mostrarMensagem('Gerando PDF profissional...', 'success');
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4'); // Configuração A4
            
            const tipoRelatorio = tipoRelatorioSelect.value;
            const nomeRelatorio = document.getElementById('relatorio-tipo').textContent;
            const dataInicioValue = dataInicio.value;
            const dataFimValue = dataFim.value;
            
            // Usa a função já corrigida
            const estatisticasGerais = calcularEstatisticas(dadosRelatorio); 

            // 1. Preparar dados para loop (agrupa por funcionário se for geral/turma)
            let dadosPorFuncionario = {};
            let isIndividualReport = (tipoRelatorio === 'funcionario' && funcionarioFiltro.value !== 'todos');

            if (tipoRelatorio === 'geral' || tipoRelatorio === 'turma') {
                 // Agrupa e ordena para iteração
                 const dadosOrdenados = agruparEOrdenarPorFuncionario(dadosRelatorio); 
                 dadosOrdenados.forEach(item => {
                     const funcId = item.funcionarios?.id;
                     if (funcId) {
                         if (!dadosPorFuncionario[funcId]) {
                             dadosPorFuncionario[funcId] = [];
                         }
                         dadosPorFuncionario[funcId].push(item);
                     }
                 });
            } else {
                // Relatório Consolidado (Funcionário 'todos' ou Turma 'todos') ou Funcionário Individual
                dadosPorFuncionario['unico'] = dadosRelatorio;
            }
            
            const funcionarioIds = Object.keys(dadosPorFuncionario);
            let totalPaginas = 0;

            // Função para desenhar o cabeçalho base da página
            const drawBaseHeader = (doc) => {
                const pageWidth = doc.internal.pageSize.getWidth();
                doc.setFillColor(44, 85, 48);
                doc.rect(0, 0, pageWidth, 30, 'F');
                doc.setFontSize(16);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('AGRO CANA FORTE', pageWidth / 2, 15, { align: 'center' });
                doc.setFontSize(12);
                doc.text('ESPELHO DE PRODUÇÃO - CORTE DE CANA', pageWidth / 2, 22, { align: 'center' }); 
            };

            // 2. Iterar sobre cada funcionário (ou o grupo único)
            for (let i = 0; i < funcionarioIds.length; i++) {
                const funcId = funcionarioIds[i];
                const dadosFuncionario = dadosPorFuncionario[funcId];
                
                // Usa a função já corrigida
                const estatisticasFuncionario = calcularEstatisticas(dadosFuncionario);
                
                // Se não for a primeira iteração E se o relatório for Geral/Turma (multi-funcionário), adiciona uma nova página
                if (i > 0 && (tipoRelatorio === 'geral' || tipoRelatorio === 'turma')) {
                    doc.addPage();
                } else if (i > 0 && isIndividualReport) {
                    // Se for relatório de funcionário individual, não adiciona página (apenas um relatório)
                    break;
                }

                // --- 2.1. Desenhar o Cabeçalho (Página 1) ---
                drawBaseHeader(doc);
                
                let yPosition = 40;
                
                // --- 2.2. Informações Específicas do Relatório/Funcionário ---
                doc.setFillColor(240, 240, 240);
                doc.rect(15, yPosition, doc.internal.pageSize.getWidth() - 30, 45, 'F');
                
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'normal');
                
                let funcNome = 'N/A';
                let funcTurma = 'N/A';
                let funcHeader = 'RELATÓRIO CONSOLIDADO';

                if (funcId !== 'unico') {
                    // Relatório Individual por Funcionário (dentro do loop do Geral/Turma)
                    const func = funcionarios.find(f => f.id === funcId);
                    funcNome = func?.nome || 'N/A';
                    funcTurma = func?.turmas?.nome || 'N/A';
                    funcHeader = `RELATÓRIO INDIVIDUAL - ${funcNome}`;
                } else {
                    funcHeader = nomeRelatorio;
                }

                
                let yStartInfo = yPosition + 10;
                doc.setFont('helvetica', 'bold');
                doc.text(`${funcHeader}`, 20, yStartInfo);
                doc.setFont('helvetica', 'normal');
                doc.text(`Período: ${formatarData(dataInicioValue)} a ${formatarData(dataFimValue)}`, 20, yStartInfo + 6);
                doc.text(`Data de Emissão: ${formatarData(new Date())}`, 20, yStartInfo + 12);
                doc.text(`Total de Registros (Deste): ${dadosFuncionario.length}`, 20, yStartInfo + 18);
                
                // --- CORREÇÃO DE POSIÇÃO: Ajusta a yPosition para começar o Resumo abaixo do bloco de informações (que termina em 85mm) ---
                yPosition = 95; // Posição segura para começar o resumo abaixo do bloco de 45mm (40 + 45 + 10 de margem)
                
                // --- 2.3. Resumo Estatístico (Deste Funcionário / Deste Relatório) ---
                doc.setFont('helvetica', 'bold');
                doc.text('RESUMO DA PRODUÇÃO', 15, yPosition);
                
                doc.setFont('helvetica', 'normal');
                const resumo = [
                    `Dias Trabalhados: ${estatisticasFuncionario.diasTrabalhados}`,
                    `Metros Cortados: ${estatisticasFuncionario.totalMetros.toFixed(2)} m`,
                    `Valor Total: R$ ${estatisticasFuncionario.totalValor.toFixed(2)}`
                ];
                
                // Adiciona informações de funcionários se for consolidado
                if (funcId === 'unico' || isIndividualReport) {
                     resumo.unshift(`Funcionários Envolvidos: ${estatisticasFuncionario.totalFuncionarios}`);
                }
                
                resumo.forEach((item, index) => {
                    doc.text(item, 15, yPosition + 10 + (index * 6));
                });
                
                // --- 2.4. Tabela de Detalhes ---
                yPosition += 40; // Ajuste para começar a tabela após o resumo
                const headers = [['Data', 'Funcionário', 'Turma', 'Fazenda', 'Talhão', 'Preço/m (R$)', 'Metros (m)', 'Valor (R$)']];
                const tableData = [];
                
                dadosFuncionario.forEach(item => {
                    const apontamento = item.apontamentos;
                    const funcionario = item.funcionarios;
                    
                    if (!apontamento || !funcionario) return;
                    
                    // *** INÍCIO DA CORREÇÃO ***
                    const metros = item.metros || 0;
                    const precoPorMetro = apontamento?.preco_por_metro || 0; 
                    const valorCorreto = metros * precoPorMetro;
                    // *** FIM DA CORREÇÃO ***

                    tableData.push([
                        formatarData(apontamento.data_corte),
                        funcionario.nome || 'N/A',
                        funcionario.turmas?.nome || 'Sem turma',
                        apontamento.fazendas?.nome || 'N/A',
                        apontamento.talhoes?.numero || 'N/A',
                        `R$ ${precoPorMetro.toFixed(4)}`, // <--- ALTERAÇÃO AQUI
                        metros.toFixed(2),
                        `R$ ${valorCorreto.toFixed(2)}` // Usa o valor recalculado
                    ]);
                });
                
                // Adicionar Totais do Funcionário/Grupo (Já usa 'estatisticasFuncionario' corrigido)
                tableData.push([
                    { content: 'TOTAL DE PRODUÇÃO', colSpan: 6, styles: { fontStyle: 'bold', fillColor: [195, 230, 203], halign: 'right' } },
                    { content: estatisticasFuncionario.totalMetros.toFixed(2), styles: { fontStyle: 'bold', fillColor: [195, 230, 203] } },
                    { content: `R$ ${estatisticasFuncionario.totalValor.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [195, 230, 203] } }
                ]);
                
                // Gera a tabela
                doc.autoTable({
                    startY: yPosition,
                    head: headers,
                    body: tableData,
                    margin: { top: 15, left: 15, right: 15 },
                    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                    headStyles: { fillColor: [44, 85, 48], textColor: 255, fontStyle: 'bold' },
                    
                    didDrawPage: function(data) {
                        // Redesenha o cabeçalho em páginas de continuação do mesmo funcionário
                        if (data.pageNumber > totalPaginas + 1) { 
                            drawBaseHeader(doc);
                        }
                        
                        // Rodapé em todas as páginas
                        const pageWidth = doc.internal.pageSize.getWidth();
                        doc.setFontSize(8);
                        doc.setTextColor(100, 100, 100);
                        doc.text(
                            `Página ${doc.internal.getNumberOfPages()} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
                            pageWidth / 2,
                            doc.internal.pageSize.getHeight() - 10,
                            { align: 'center' }
                        );
                    }
                });

                // Atualiza a contagem total de páginas para o rodapé
                totalPaginas = doc.internal.getNumberOfPages();
            }
            
            // 3. Adiciona o TOTAL GERAL na última página se for um relatório consolidado
            if (funcionarioIds.length > 1 || (funcionarioIds[0] === 'unico' && !isIndividualReport && dadosRelatorio.length > 0)) {
                 
                 if (funcionarioIds.length > 1) { // Só adiciona nova página se for relatório multifolha
                    doc.addPage();
                    drawBaseHeader(doc); // Desenha o cabeçalho
                 }
                 
                 let yStartTotal = 40;
                 doc.setFontSize(14);
                 doc.setTextColor(44, 85, 48);
                 doc.setFont('helvetica', 'bold');
                 doc.text('RESUMO GERAL DO PERÍODO', 15, yStartTotal);
                 
                 yStartTotal += 10;
                 
                 // Usa 'estatisticasGerais' (já corrigido)
                 const summaryData = [
                     ['Itens', 'Valor'],
                     ['Total de Dias Trabalhados', estatisticasGerais.diasTrabalhados.toString()],
                     ['Total de Funcionários Envolvidos', estatisticasGerais.totalFuncionarios.toString()],
                     ['Total de Metros Cortados (m)', estatisticasGerais.totalMetros.toFixed(2)],
                     ['VALOR TOTAL GERAL (R$)', `R$ ${estatisticasGerais.totalValor.toFixed(2)}`],
                 ];

                 doc.autoTable({
                     startY: yStartTotal,
                     head: [summaryData[0]],
                     body: summaryData.slice(1, summaryData.length - 1),
                     foot: [[summaryData[summaryData.length - 1][0], summaryData[summaryData.length - 1][1]]],
                     margin: { top: 15, left: 15, right: 15 },
                     styles: { fontSize: 10, cellPadding: 3 },
                     headStyles: { fillColor: [44, 85, 48], textColor: 255, fontStyle: 'bold' },
                     footStyles: { fillColor: [44, 85, 48], textColor: 255, fontStyle: 'bold' },
                     alternateRowStyles: { fillColor: [240, 240, 240] },
                 });
            }
            
            // Salvar PDF
            const fileName = `relatorio_producao_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            mostrarMensagem('PDF gerado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            mostrarMensagem('Erro ao gerar PDF: ' + error.message, 'error');
        }
    }

    // FUNÇÃO EXCEL (CORRIGIDA)
    // Garante que o Excel recalcule os valores e exiba 4 casas decimais
    function exportarExcel() {
        if (dadosRelatorio.length === 0) {
            mostrarMensagem('Gere o relatório primeiro ou não há dados para exportar.', 'error');
            return;
        }

        try {
            mostrarMensagem('Preparando exportação para Excel...', 'success');

            // Define os dados a serem exportados, garantindo que o relatório "Geral" seja agrupado por funcionário
            const dadosParaExportacao = (tipoRelatorioSelect.value === 'geral' || tipoRelatorioSelect.value === 'turma')
                                        ? agruparEOrdenarPorFuncionario(dadosRelatorio)
                                        : dadosRelatorio;

            const headers = [
                "Data", 
                "Funcionario", 
                "Turma", 
                "Fazenda", 
                "Talhao", 
                "Preco/m (R$)", 
                "Metros (m)", 
                "Valor (R$)"
            ].join(';');

            const csvData = dadosParaExportacao.map(item => {
                const apontamento = item.apontamentos;
                const funcionario = item.funcionarios;

                const data = formatarData(apontamento?.data_corte);
                const nomeFuncionario = funcionario?.nome || 'N/A';
                const nomeTurma = funcionario?.turmas?.nome || 'Sem turma';
                const nomeFazenda = apontamento?.fazendas?.nome || 'N/A';
                const numTalhao = apontamento?.talhoes?.numero || 'N/A';
                
                // *** INÍCIO DA CORREÇÃO ***
                const metros = item.metros || 0;
                const precoPorMetro = apontamento?.preco_por_metro || 0;
                const valorCorreto = metros * precoPorMetro;
                // *** FIM DA CORREÇÃO ***

                // Formata para o padrão CSV brasileiro (vírgula como decimal)
                const precoPorMetroStr = precoPorMetro.toFixed(4).replace('.', ',') || '0,0000'; // <--- ALTERAÇÃO AQUI
                const metrosStr = metros.toFixed(2).replace('.', ',') || '0,00';
                const valorStr = valorCorreto.toFixed(2).replace('.', ',') || '0,00'; // Usa o valor recalculado

                return [
                    data, 
                    `"${nomeFuncionario}"`,
                    `"${nomeTurma}"`,
                    `"${nomeFazenda}"`,
                    numTalhao,
                    precoPorMetroStr,
                    metrosStr,
                    valorStr
                ].join(';');
            }).join('\n');

            const csvContent = headers + '\n' + csvData;
            
            // Cria o Blob e o link para download
            const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const fileName = `relatorio_producao_${new Date().toISOString().split('T')[0]}.csv`;

            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            mostrarMensagem('Exportação para Excel concluída!', 'success');

        } catch (error) {
            console.error('Erro ao exportar para Excel:', error);
            mostrarMensagem('Erro ao exportar para Excel: ' + error.message, 'error');
        }
    }

    // Função para imprimir relatório
    function imprimirRelatorio() {
        window.print();
    }

    // Função para limpar filtros
    function limparFiltros() {
        tipoRelatorioSelect.value = 'funcionario';
        funcionarioFiltro.value = '';
        turmaFiltro.value = '';
        fazendaFiltro.value = ''; 
        configurarDatasPadrao();
        ordenacaoSelect.value = 'data_desc';
        agruparPorDataCheck.checked = true;
        
        funcionarioGroup.style.display = 'block';
        turmaGroup.style.display = 'none';
        
        relatorioContainer.style.display = 'none';
        semDados.style.display = 'block';
        
        mostrarMensagem('Filtros limpos com sucesso!');
    }

    // Configurar botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (window.sistemaAuth && typeof window.sistemaAuth.fazerLogout === 'function') {
                window.sistemaAuth.fazerLogout();
            } else {
                localStorage.removeItem('usuarioLogado');
                window.location.href = 'login.html';
            }
        });
    }
>>>>>>> 3b6d102 (atualizei)
});