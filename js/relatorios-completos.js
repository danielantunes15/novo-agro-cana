// js/relatorios-completos.js - SISTEMA DE RELATÓRIOS COMPLETOS COM PDF PROFISSIONAL E EXCEL

document.addEventListener('DOMContentLoaded', async function() {
    // Elementos do DOM
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    const errorElement = document.getElementById('error-message');
    const tipoRelatorioSelect = document.getElementById('tipo-relatorio');
    const funcionarioFiltro = document.getElementById('funcionario-filtro');
    const turmaFiltro = document.getElementById('turma-filtro');
    const fazendaFiltro = document.getElementById('fazenda-filtro'); // NOVO: Filtro de Fazenda
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
    const exportarExcelBtn = document.getElementById('exportar-excel'); // Novo botão
    
    // Variáveis para armazenar dados
    let funcionarios = [];
    let turmas = [];
    let fazendas = []; // NOVO: Lista de Fazendas
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
            carregarFazendasParaFiltro() // ADICIONADO
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

    // NOVO: Função para carregar fazendas
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

        // NOVO: Adiciona listener para o botão de exportar para Excel
        if (exportarExcelBtn) {
            exportarExcelBtn.addEventListener('click', exportarExcel);
        }
    }

    // Função principal para gerar relatório
    async function gerarRelatorio() {
        const tipoRelatorio = tipoRelatorioSelect.value;
        const funcionarioId = funcionarioFiltro.value;
        const turmaId = turmaFiltro.value;
        const fazendaId = fazendaFiltro.value; // ADICIONADO
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
        
        // Validar período máximo (90 dias)
        const diffTime = Math.abs(new Date(dataFimValue) - new Date(dataInicioValue));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 90) {
            mostrarMensagem('O período máximo permitido é de 90 dias', 'error');
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
            
            // NOVO: Aplicar filtro de Fazenda
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
                // CORREÇÃO: Adiciona verificação de apontamentos?.data_corte para evitar crash com valores null
                dados.sort((a, b) => {
                    const dataA = a.apontamentos?.data_corte ? new Date(a.apontamentos.data_corte) : 0;
                    const dataB = b.apontamentos?.data_corte ? new Date(b.apontamentos.data_corte) : 0;
                    return dataA - dataB;
                });
                break;
            case 'data_desc':
                 // CORREÇÃO: Adiciona verificação de apontamentos?.data_corte para evitar crash com valores null
                dados.sort((a, b) => {
                    const dataA = a.apontamentos?.data_corte ? new Date(a.apontamentos.data_corte) : 0;
                    const dataB = b.apontamentos?.data_corte ? new Date(b.apontamentos.data_corte) : 0;
                    return dataB - dataA;
                });
                break;
            case 'valor_asc':
                dados.sort((a, b) => a.valor - b.valor);
                break;
            case 'valor_desc':
                dados.sort((a, b) => b.valor - a.valor);
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
        
        // NOVO: Adiciona Fazenda no cabeçalho do relatório se filtrado por uma fazenda específica
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
        
        // Calcular totais e estatísticas
        const estatisticas = calcularEstatisticas(dadosRelatorio);
        
        // Atualizar cartões de resumo
        document.getElementById('total-dias').textContent = estatisticas.diasTrabalhados;
        document.getElementById('total-funcionarios').textContent = estatisticas.totalFuncionarios;
        document.getElementById('total-metros').textContent = estatisticas.totalMetros.toFixed(2);
        document.getElementById('total-valor').textContent = `R$ ${estatisticas.totalValor.toFixed(2)}`;
        
        // Preencher tabela de detalhes
        preencherTabelaDetalhes(dadosRelatorio, agruparPorData);
    }

    // Função para calcular estatísticas
    function calcularEstatisticas(dados) {
        let totalMetros = 0;
        let totalValor = 0;
        const diasTrabalhados = new Set();
        const funcionariosUnicos = new Set();
        
        dados.forEach(item => {
            const apontamento = item.apontamentos;
            // CORREÇÃO: Pula o item se apontamento for null
            if (!apontamento) return;
            
            totalMetros += item.metros || 0;
            totalValor += item.valor || 0;
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

    // Função para preencher tabela de detalhes
    function preencherTabelaDetalhes(dados, agruparPorData) {
        const tbody = document.getElementById('detalhes-producao');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        let dataAtual = '';
        let subtotalData = { metros: 0, valor: 0 };
        
        dados.forEach((item, index) => {
            const apontamento = item.apontamentos;
            const funcionario = item.funcionarios;
            
            // CORREÇÃO: Pula o item se apontamento ou funcionario for null
            if (!apontamento || !funcionario) return;
            
            const dataCorte = apontamento.data_corte;
            const dataFormatada = formatarData(dataCorte);
            // CORREÇÃO: Usa encadeamento opcional para evitar erro se apontamento for nulo
            const precoPorMetro = apontamento?.preco_por_metro || 0; 
            
            // Agrupar por data se solicitado
            if (agruparPorData && dataAtual !== dataCorte) {
                if (dataAtual !== '') {
                    // Adicionar subtotal da data anterior
                    const trSubtotal = document.createElement('tr');
                    trSubtotal.className = 'group-header';
                    trSubtotal.innerHTML = `
                        <td colspan="6" style="text-align: right; background: #e9ecef;">Subtotal ${formatarData(dataAtual)}</td>
                        <td style="background: #e9ecef;">${subtotalData.metros.toFixed(2)}</td>
                        <td style="background: #e9ecef;">R$ ${subtotalData.valor.toFixed(2)}</td>
                    `;
                    tbody.appendChild(trSubtotal);
                }
                
                // Reiniciar subtotal para nova data
                dataAtual = dataCorte;
                subtotalData = { metros: 0, valor: 0 };
                
                // Adicionar cabeçalho da nova data
                const trHeader = document.createElement('tr');
                trHeader.className = 'group-header';
                trHeader.innerHTML = `
                    <td colspan="8" style="background: #2c5530; color: white; text-align: center; font-size: 1.1rem;">
                        📅 ${dataFormatada}
                    </td>
                `;
                tbody.appendChild(trHeader);
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dataFormatada}</td>
                <td>${funcionario.nome || 'N/A'}</td>
                <td>${funcionario.turmas?.nome || 'Sem turma'}</td>
                <td>${apontamento.fazendas?.nome || 'N/A'}</td>
                <td>${apontamento.talhoes?.numero || 'N/A'}</td>
                <td>R$ ${precoPorMetro.toFixed(4)}</td>
                <td>${item.metros.toFixed(2)}</td>
                <td>R$ ${item.valor.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
            
            // Acumular subtotal
            if (agruparPorData) {
                subtotalData.metros += item.metros || 0;
                subtotalData.valor += item.valor || 0;
            }
        });
        
        // Adicionar subtotal final se estiver agrupando por data
        if (agruparPorData && dataAtual !== '') {
            const trSubtotal = document.createElement('tr');
            trSubtotal.className = 'group-header';
            trSubtotal.innerHTML = `
                <td colspan="6" style="text-align: right; background: #e9ecef;">Subtotal ${formatarData(dataAtual)}</td>
                <td style="background: #e9ecef;">${subtotalData.metros.toFixed(2)}</td>
                <td style="background: #e9ecef;">R$ ${subtotalData.valor.toFixed(2)}</td>
            `;
            tbody.appendChild(trSubtotal);
        }
        
        // Adicionar linha de totais gerais
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

    // Função para exportar PDF profissional
    async function exportarPDFProfissional() {
        if (dadosRelatorio.length === 0) {
            mostrarMensagem('Gere o relatório primeiro ou não há dados para exportar.', 'error');
            return;
        }

        try {
            mostrarMensagem('Gerando PDF profissional...', 'success');
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configurações do documento
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const contentWidth = pageWidth - (margin * 2);
            
            // Cabeçalho profissional
            doc.setFillColor(44, 85, 48);
            doc.rect(0, 0, pageWidth, 30, 'F');
            
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('AGRO CANA FORTE', pageWidth / 2, 15, { align: 'center' });
            
            doc.setFontSize(12);
            doc.text('ESPELHO DE PRODUÇÃO - CORTE DE CANA', pageWidth / 2, 22, { align: 'center' });
            
            // Informações do relatório
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, 40, contentWidth, 45, 'F');
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            
            let yPosition = 50;
            doc.text(`Tipo de Relatório: ${document.getElementById('relatorio-tipo').textContent}`, margin + 5, yPosition);
            doc.text(`Período: ${document.getElementById('relatorio-periodo').textContent}`, margin + 5, yPosition + 6);
            doc.text(`Data de Emissão: ${document.getElementById('relatorio-emissao').textContent}`, margin + 5, yPosition + 12);
            doc.text(`Total de Registros: ${document.getElementById('relatorio-registros').textContent}`, margin + 5, yPosition + 18);
            
            // Resumo estatístico
            yPosition += 30;
            doc.setFont('helvetica', 'bold');
            doc.text('RESUMO ESTATÍSTICO', margin, yPosition);
            
            doc.setFont('helvetica', 'normal');
            const resumo = [
                `Dias Trabalhados: ${document.getElementById('total-dias').textContent}`,
                `Funcionários Envolvidos: ${document.getElementById('total-funcionarios').textContent}`,
                `Metros Cortados: ${document.getElementById('total-metros').textContent} m`,
                `Valor Total: ${document.getElementById('total-valor').textContent}`
            ];
            
            resumo.forEach((item, index) => {
                doc.text(item, margin, yPosition + 10 + (index * 6));
            });
            
            // Tabela de detalhes
            yPosition += 40;
            const headers = [['Data', 'Funcionário', 'Turma', 'Fazenda', 'Talhão', 'Preço/m (R$)', 'Metros (m)', 'Valor (R$)']];
            const tableData = [];
            
            dadosRelatorio.forEach(item => {
                const apontamento = item.apontamentos;
                const funcionario = item.funcionarios;
                
                // CORREÇÃO: Usa encadeamento opcional para evitar erro se apontamento for nulo
                const precoPorMetro = apontamento?.preco_por_metro || 0; 

                if (apontamento && funcionario) {
                    tableData.push([
                        formatarData(apontamento.data_corte),
                        funcionario.nome || 'N/A',
                        funcionario.turmas?.nome || 'Sem turma',
                        apontamento.fazendas?.nome || 'N/A',
                        apontamento.talhoes?.numero || 'N/A',
                        `R$ ${precoPorMetro.toFixed(4)}`,
                        item.metros.toFixed(2),
                        `R$ ${item.valor.toFixed(2)}`
                    ]);
                }
            });
            
            // Adicionar totais
            const estatisticas = calcularEstatisticas(dadosRelatorio);
            tableData.push([
                'TOTAL GERAL', '', '', '', '', '', // Ajuste para cobrir a nova coluna de Preço/m (R$)
                estatisticas.totalMetros.toFixed(2),
                `R$ ${estatisticas.totalValor.toFixed(2)}`
            ]);
            
            doc.autoTable({
                startY: yPosition,
                head: headers,
                body: tableData,
                margin: { top: yPosition },
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [44, 85, 48], textColor: 255, fontStyle: 'bold' },
                footStyles: { fillColor: [44, 85, 48], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [240, 240, 240] },
                didDrawPage: function(data) {
                    // Rodapé em todas as páginas
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
            
            // Salvar PDF
            const fileName = `relatorio_producao_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            mostrarMensagem('PDF gerado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            mostrarMensagem('Erro ao gerar PDF: ' + error.message, 'error');
        }
    }

    // NOVO: Função para exportar para Excel (CSV)
    function exportarExcel() {
        if (dadosRelatorio.length === 0) {
            mostrarMensagem('Gere o relatório primeiro ou não há dados para exportar.', 'error');
            return;
        }

        try {
            mostrarMensagem('Preparando exportação para Excel...', 'success');

            const headers = [
                "Data", 
                "Funcionário", 
                "Turma", 
                "Fazenda", 
                "Talhão", 
                "Preço/m (R$)", 
                "Metros (m)", 
                "Valor (R$)"
            ].join(';');

            const csvData = dadosRelatorio.map(item => {
                const apontamento = item.apontamentos;
                const funcionario = item.funcionarios;

                const data = formatarData(apontamento?.data_corte);
                const nomeFuncionario = funcionario?.nome || 'N/A';
                const nomeTurma = funcionario?.turmas?.nome || 'Sem turma';
                const nomeFazenda = apontamento?.fazendas?.nome || 'N/A';
                const numTalhao = apontamento?.talhoes?.numero || 'N/A';
                const precoPorMetro = apontamento?.preco_por_metro?.toFixed(4).replace('.', ',') || '0,0000';
                const metros = item.metros?.toFixed(2).replace('.', ',') || '0,00';
                const valor = item.valor?.toFixed(2).replace('.', ',') || '0,00';

                return [
                    data, 
                    `"${nomeFuncionario}"`, // Aspas para nomes com espaços
                    `"${nomeTurma}"`,
                    `"${nomeFazenda}"`,
                    numTalhao,
                    precoPorMetro,
                    metros,
                    valor
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
        fazendaFiltro.value = ''; // ADICIONADO
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
});