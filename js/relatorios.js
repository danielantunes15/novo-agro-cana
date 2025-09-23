class RelatoriosApp {
    constructor() {
        this.supabase = null;
        this.dadosRelatorioAtual = null;
        this.dadosQuinzenaAtual = null;
        this.charts = {};
        
        this.init();
    }

    async init() {
        try {
            console.log('Iniciando RelatoriosApp...');
            await this.inicializarSupabase();
            await this.inicializarPagina();
            this.configurarEventListeners();
            
            this.mostrarConteudo();
            console.log('RelatoriosApp inicializado com sucesso!');
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.mostrarErro('Erro na inicialização: ' + error.message);
        }
    }

    async inicializarSupabase() {
        // Usar a configuração global já definida no HTML
        this.supabase = window.supabase;
        
        if (!this.supabase) {
            throw new Error('Cliente Supabase não inicializado');
        }
        
        // Testar conexão
        const { error } = await this.supabase
            .from('fazendas')
            .select('id')
            .limit(1);
            
        if (error) throw error;
        
        console.log('Conexão com Supabase estabelecida com sucesso');
    }

    async inicializarPagina() {
        try {
            await this.carregarDadosIniciais();
            this.configurarDatePickers();
        } catch (error) {
            throw error;
        }
    }

    async carregarDadosIniciais() {
        await Promise.all([
            this.carregarFazendas(),
            this.carregarTurmas()
        ]);
    }

    async carregarFazendas() {
        try {
            const { data, error } = await this.supabase
                .from('fazendas')
                .select('id, nome')
                .order('nome');

            if (error) throw error;

            const select = document.getElementById('fazenda-relatorio');
            if (select) {
                select.innerHTML = '<option value="">Todas as fazendas</option>';
                
                data.forEach(fazenda => {
                    const option = document.createElement('option');
                    option.value = fazenda.id;
                    option.textContent = fazenda.nome;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar fazendas:', error);
        }
    }

    async carregarTurmas() {
        try {
            // Buscar turmas existentes no banco de dados
            const { data, error } = await this.supabase
                .from('apontamentos')
                .select('turma')
                .not('turma', 'is', null);

            if (error) throw error;

            // Extrair turmas únicas
            const turmasUnicas = [...new Set(data.map(item => item.turma))].filter(turma => turma);
            
            const selects = [
                document.getElementById('turma-relatorio'),
                document.getElementById('turma-quinzena')
            ];

            selects.forEach(select => {
                if (select) {
                    select.innerHTML = select.id === 'turma-relatorio' 
                        ? '<option value="">Todas as turmas</option>'
                        : '<option value="">Selecione a turma</option>';

                    turmasUnicas.forEach(turma => {
                        const option = document.createElement('option');
                        option.value = turma;
                        option.textContent = turma;
                        select.appendChild(option);
                    });
                }
            });
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            
            // Fallback para turmas padrão caso haja erro
            const turmas = ['Turma 1', 'Turma 2', 'Turma 3'];
            const selects = [
                document.getElementById('turma-relatorio'),
                document.getElementById('turma-quinzena')
            ];

            selects.forEach(select => {
                if (select) {
                    select.innerHTML = select.id === 'turma-relatorio' 
                        ? '<option value="">Todas as turmas</option>'
                        : '<option value="">Selecione a turma</option>';

                    turmas.forEach(turma => {
                        const option = document.createElement('option');
                        option.value = turma;
                        option.textContent = turma;
                        select.appendChild(option);
                    });
                }
            });
        }
    }

    configurarDatePickers() {
        const hoje = new Date().toISOString().split('T')[0];
        const dataFim = document.getElementById('data-fim');
        if (dataFim) dataFim.value = hoje;
        
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
        const dataInicio = document.getElementById('data-inicio');
        if (dataInicio) dataInicio.value = umaSemanaAtras.toISOString().split('T')[0];
        
        // Configurar quinzena para o mês atual
        const quinzena = document.getElementById('quinzena');
        if (quinzena) quinzena.value = hoje.substring(0, 7); // Formato YYYY-MM
    }

    configurarEventListeners() {
        // Formulários
        const relatorioForm = document.getElementById('relatorio-form');
        const quinzenaForm = document.getElementById('quinzena-form');
        
        if (relatorioForm) {
            relatorioForm.addEventListener('submit', (e) => this.gerarRelatorio(e));
        }
        
        if (quinzenaForm) {
            quinzenaForm.addEventListener('submit', (e) => this.gerarEspelhoQuinzena(e));
        }
        
        // Exportação
        const exportPdf = document.getElementById('export-pdf');
        const exportQuinzena = document.getElementById('export-quinzena');
        
        if (exportPdf) {
            exportPdf.addEventListener('click', () => this.exportarPDF());
        }
        
        if (exportQuinzena) {
            exportQuinzena.addEventListener('click', () => this.exportarQuinzenaPDF());
        }
    }

    async gerarRelatorio(e) {
        e.preventDefault();
        
        const formData = this.obterDadosFormulario();
        if (!this.validarFormulario(formData)) return;

        this.mostrarLoading(true);

        try {
            const dados = await this.buscarDadosRelatorio(formData);
            this.dadosRelatorioAtual = dados;
            this.exibirRelatorio(dados);
            this.habilitarExportacao();
            
        } catch (error) {
            this.mostrarNotificacao('Erro ao gerar relatório: ' + error.message, 'error');
            console.error('Erro ao gerar relatório:', error);
        } finally {
            this.mostrarLoading(false);
        }
    }

    obterDadosFormulario() {
        return {
            dataInicio: document.getElementById('data-inicio').value,
            dataFim: document.getElementById('data-fim').value,
            turma: document.getElementById('turma-relatorio').value,
            fazendaId: document.getElementById('fazenda-relatorio').value
        };
    }

    validarFormulario(data) {
        if (!data.dataInicio || !data.dataFim) {
            this.mostrarNotificacao('Informe o período do relatório.', 'error');
            return false;
        }
        
        if (new Date(data.dataInicio) > new Date(data.dataFim)) {
            this.mostrarNotificacao('Data início não pode ser maior que data fim.', 'error');
            return false;
        }
        
        return true;
    }

    async buscarDadosRelatorio(filtros) {
        let query = this.supabase
            .from('apontamentos')
            .select(`
                id,
                data_corte,
                turma,
                fazenda_id,
                talhao_id,
                preco_por_metro,
                fazendas(nome),
                talhoes(numero, area, espacamento),
                cortes_funcionarios(
                    metros,
                    valor,
                    funcionario_id,
                    funcionarios(nome, turma)
                )
            `)
            .gte('data_corte', filtros.dataInicio)
            .lte('data_corte', filtros.dataFim)
            .order('data_corte', { ascending: false });

        if (filtros.turma) query = query.eq('turma', filtros.turma);
        if (filtros.fazendaId) query = query.eq('fazenda_id', filtros.fazendaId);

        const { data, error } = await query;
        if (error) throw error;

        return data || [];
    }

    exibirRelatorio(dados) {
        const container = document.getElementById('resultado-relatorio');
        
        if (!dados || dados.length === 0) {
            container.innerHTML = this.criarEstadoVazio('Nenhum dado encontrado para o período selecionado.');
            return;
        }

        const { html, totais } = this.criarTabelaRelatorio(dados);
        container.innerHTML = html;
        
        this.atualizarInfoResultado(dados.length, totais);
    }

    criarTabelaRelatorio(dados) {
        let totalMetros = 0;
        let totalValor = 0;
        let diasUnicos = new Set();

        const linhas = dados.map(apontamento => {
            diasUnicos.add(apontamento.data_corte);
            
            if (!apontamento.cortes_funcionarios || apontamento.cortes_funcionarios.length === 0) {
                return this.criarLinhaSemCortes(apontamento);
            }

            return apontamento.cortes_funcionarios.map(corte => {
                const metros = parseFloat(corte.metros) || 0;
                const valor = parseFloat(corte.valor) || 0;
                
                totalMetros += metros;
                totalValor += valor;

                return this.criarLinhaComCortes(apontamento, corte, metros, valor);
            }).join('');
        }).join('');

        return {
            html: `
                <div class="resumo-container">
                    <h3>Resumo do Período</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">📊</div>
                            <div>
                                <span class="stat-value">${dados.length}</span>
                                <span class="stat-label">Apontamentos</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📅</div>
                            <div>
                                <span class="stat-value">${diasUnicos.size}</span>
                                <span class="stat-label">Dias de Trabalho</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📏</div>
                            <div>
                                <span class="stat-value">${totalMetros.toFixed(2)}m</span>
                                <span class="stat-label">Total de Metros</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💰</div>
                            <div>
                                <span class="stat-value">R$ ${totalValor.toFixed(2)}</span>
                                <span class="stat-label">Valor Total</span>
                            </div>
                        </div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Turma</th>
                            <th>Fazenda</th>
                            <th>Talhão</th>
                            <th>Funcionário</th>
                            <th>Metros</th>
                            <th>Valor (R$)</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="5"><strong>TOTAL</strong></td>
                            <td><strong>${totalMetros.toFixed(2)}m</strong></td>
                            <td><strong>R$ ${totalValor.toFixed(2)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            `,
            totais: { metros: totalMetros, valor: totalValor, dias: diasUnicos.size, apontamentos: dados.length }
        };
    }

    criarLinhaSemCortes(apontamento) {
        return `
            <tr>
                <td>${this.formatarData(apontamento.data_corte)}</td>
                <td>${apontamento.turma || 'N/A'}</td>
                <td>${apontamento.fazendas?.nome || 'N/A'}</td>
                <td>${apontamento.talhoes?.numero || 'N/A'}</td>
                <td colspan="3" style="text-align: center; color: #999;">Nenhum corte registrado</td>
            </tr>
        `;
    }

    criarLinhaComCortes(apontamento, corte, metros, valor) {
        return `
            <tr>
                <td>${this.formatarData(apontamento.data_corte)}</td>
                <td>${apontamento.turma || 'N/A'}</td>
                <td>${apontamento.fazendas?.nome || 'N/A'}</td>
                <td>${apontamento.talhoes?.numero || 'N/A'}</td>
                <td>${corte.funcionarios?.nome || 'N/A'}</td>
                <td>${metros.toFixed(2)}</td>
                <td>R$ ${valor.toFixed(2)}</td>
            </tr>
        `;
    }

    criarEstadoVazio(mensagem) {
        return `
            <div class="empty-state">
                <div>📊</div>
                <h3>${mensagem}</h3>
                <p>Altere os filtros e tente novamente.</p>
            </div>
        `;
    }

    atualizarInfoResultado(quantidade, totais) {
        console.log(`Relatório gerado: ${quantidade} apontamentos, ${totais.metros.toFixed(2)}m, R$ ${totais.valor.toFixed(2)}`);
    }

    habilitarExportacao() {
        const exportPdf = document.getElementById('export-pdf');
        if (exportPdf) {
            exportPdf.disabled = false;
        }
    }

    async gerarEspelhoQuinzena(e) {
        e.preventDefault();
        
        this.mostrarNotificacao('Funcionalidade de espelho de quinzena em desenvolvimento', 'info');
    }

    async exportarPDF() {
        if (!this.dadosRelatorioAtual || this.dadosRelatorioAtual.length === 0) {
            this.mostrarNotificacao('Nenhum dado para exportar', 'warning');
            return;
        }
        
        this.mostrarNotificacao('Exportação PDF em desenvolvimento', 'info');
    }

    async exportarQuinzenaPDF() {
        this.mostrarNotificacao('Exportação PDF quinzena em desenvolvimento', 'info');
    }

    // Métodos de UI/UX
    mostrarConteudo() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        document.getElementById('error-message').style.display = 'none';
    }

    mostrarErro(mensagem) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'none';
        
        const errorDiv = document.getElementById('error-message');
        errorDiv.style.display = 'block';
        errorDiv.querySelector('p').textContent = mensagem;
        
        console.error('Erro RelatoriosApp:', mensagem);
    }

    mostrarLoading(mostrar) {
        const loading = document.getElementById('loading');
        const content = document.getElementById('content');
        
        if (mostrar) {
            loading.style.display = 'block';
            content.style.display = 'none';
        } else {
            loading.style.display = 'none';
            content.style.display = 'block';
        }
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        // Implementação simples de notificação
        console.log(`[${tipo.toUpperCase()}] ${mensagem}`);
        
        // Poderia ser implementado com um sistema de toast mais elaborado
        alert(`${tipo.toUpperCase()}: ${mensagem}`);
    }

    formatarData(data) {
        if (!data) return 'N/A';
        return new Date(data).toLocaleDateString('pt-BR');
    }

    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando RelatoriosApp...');
    window.relatoriosApp = new RelatoriosApp();
});