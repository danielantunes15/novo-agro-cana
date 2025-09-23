// Configuração e inicialização para cadastro de fazendas
document.addEventListener('DOMContentLoaded', async function() {
    // Elementos do DOM
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    const errorElement = document.getElementById('error-message');
    const fazendaForm = document.getElementById('fazenda-form');
    const talhaoForm = document.getElementById('talhao-form');
    const fazendaTalhaoSelect = document.getElementById('fazenda-talhao');
    const fazendasList = document.getElementById('fazendas-list');

    try {
        // Mostrar loading
        loadingElement.style.display = 'block';
        contentElement.style.display = 'none';
        errorElement.style.display = 'none';

        // Testar conexão com Supabase
        await testarConexaoSupabase();
        
        // Esconder loading e mostrar conteúdo
        loadingElement.style.display = 'none';
        contentElement.style.display = 'block';

        // Carregar dados iniciais
        await carregarFazendasParaSelect();
        await carregarFazendasETalhoes();
        
        // Configurar event listeners
        fazendaForm.addEventListener('submit', salvarFazenda);
        talhaoForm.addEventListener('submit', salvarTalhao);

        console.log('Módulo de fazendas inicializado com sucesso!');

    } catch (error) {
        console.error('Erro na inicialização:', error);
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
    }

    // Função para testar conexão
    async function testarConexaoSupabase() {
        try {
            const { data, error } = await supabase
                .from('fazendas')
                .select('*')
                .limit(1);
                
            if (error) throw error;
            console.log('✅ Conexão com Supabase estabelecida (fazendas)');
            return true;
        } catch (error) {
            throw new Error(`Falha na conexão: ${error.message}`);
        }
    }

    // Função para mostrar mensagem
    function mostrarMensagem(mensagem, tipo = 'success') {
        const mensagensAntigas = document.querySelectorAll('.alert-message');
        mensagensAntigas.forEach(msg => msg.remove());

        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `alert-message ${tipo === 'error' ? 'alert-error' : 'alert-success'}`;
        mensagemDiv.innerHTML = `
            <div style="padding: 1rem; margin: 1rem 0; border-radius: 4px;">
                ${mensagem}
                <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">×</button>
            </div>
        `;
        
        document.querySelector('.main .container').prepend(mensagemDiv);

        setTimeout(() => {
            if (mensagemDiv.parentElement) {
                mensagemDiv.remove();
            }
        }, 5000);
    }

    // Função para salvar fazenda
    async function salvarFazenda(e) {
        e.preventDefault();
        
        const nomeFazenda = document.getElementById('nome-fazenda').value.trim();
        
        if (!nomeFazenda) {
            mostrarMensagem('Informe o nome da fazenda.', 'error');
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('fazendas')
                .insert([{ nome: nomeFazenda }])
                .select()
                .single();
                
            if (error) throw error;
            
            mostrarMensagem('Fazenda salva com sucesso!');
            fazendaForm.reset();
            await carregarFazendasParaSelect();
            await carregarFazendasETalhoes();
            
        } catch (error) {
            console.error('Erro ao salvar fazenda:', error);
            mostrarMensagem('Erro ao salvar fazenda: ' + error.message, 'error');
        }
    }

    // Função para salvar talhão
    async function salvarTalhao(e) {
        e.preventDefault();
        
        const fazendaId = fazendaTalhaoSelect.value;
        const numeroTalhao = document.getElementById('numero-talhao').value;
        const areaTalhao = document.getElementById('area-talhao').value;
        const espacamentoTalhao = document.getElementById('espacamento-talhao').value;
        const precoTonelada = document.getElementById('preco-tonelada').value;
        const producaoEstimada = document.getElementById('producao-estimada').value;
        
        if (!fazendaId || !numeroTalhao || !areaTalhao || !espacamentoTalhao || !precoTonelada || !producaoEstimada) {
            mostrarMensagem('Preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('talhoes')
                .insert([{
                    fazenda_id: fazendaId,
                    numero: parseInt(numeroTalhao),
                    area: parseFloat(areaTalhao),
                    espacamento: parseFloat(espacamentoTalhao),
                    preco_tonelada: parseFloat(precoTonelada),
                    producao_estimada: parseFloat(producaoEstimada)
                }])
                .select()
                .single();
                
            if (error) throw error;
            
            mostrarMensagem('Talhão salvo com sucesso!');
            talhaoForm.reset();
            document.getElementById('preco-tonelada').value = '10.00';
            document.getElementById('producao-estimada').value = '100.00';
            await carregarFazendasETalhoes();
            
        } catch (error) {
            console.error('Erro ao salvar talhão:', error);
            mostrarMensagem('Erro ao salvar talhão: ' + error.message, 'error');
        }
    }

    // Função para carregar fazendas no select
    async function carregarFazendasParaSelect() {
        try {
            const { data, error } = await supabase
                .from('fazendas')
                .select('id, nome')
                .order('nome');
                
            if (error) throw error;
            
            fazendaTalhaoSelect.innerHTML = '<option value="">Selecione a fazenda</option>';
            data.forEach(fazenda => {
                const option = document.createElement('option');
                option.value = fazenda.id;
                option.textContent = fazenda.nome;
                fazendaTalhaoSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar fazendas:', error);
            mostrarMensagem('Erro ao carregar fazendas', 'error');
        }
    }

    // Função para carregar fazendas e talhões
    async function carregarFazendasETalhoes() {
        try {
            const { data, error } = await supabase
                .from('fazendas')
                .select(`
                    id,
                    nome,
                    talhoes(
                        id,
                        numero,
                        area,
                        espacamento,
                        preco_tonelada,
                        producao_estimada
                    )
                `)
                .order('nome');
                
            if (error) throw error;
            
            if (data.length === 0) {
                fazendasList.innerHTML = '<p>Nenhuma fazenda cadastrada.</p>';
                return;
            }
            
            let html = '';
            
            data.forEach(fazenda => {
                html += `
                    <div class="fazenda-item" style="margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                        <h3 style="margin-bottom: 1rem; color: #2c7744;">${fazenda.nome}</h3>
                `;
                
                if (!fazenda.talhoes || fazenda.talhoes.length === 0) {
                    html += '<p>Nenhum talhão cadastrado.</p>';
                } else {
                    html += `
                        <table style="width: 100%;">
                            <thead>
                                <tr>
                                    <th>Talhão</th>
                                    <th>Área (ha)</th>
                                    <th>Espaçamento (m)</th>
                                    <th>Preço/T (R$)</th>
                                    <th>Produção (t/ha)</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    fazenda.talhoes.forEach(talhao => {
                        html += `
                            <tr>
                                <td>${talhao.numero}</td>
                                <td>${talhao.area}</td>
                                <td>${talhao.espacamento}</td>
                                <td>R$ ${talhao.preco_tonelada.toFixed(2)}</td>
                                <td>${talhao.producao_estimada.toFixed(2)}</td>
                                <td>
                                    <button class="btn-secondary" onclick="editarTalhao('${talhao.id}')">Editar</button>
                                    <button class="btn-remove" onclick="excluirTalhao('${talhao.id}')">Excluir</button>
                                </td>
                            </tr>
                        `;
                    });
                    
                    html += '</tbody></table>';
                }
                
                html += `</div>`;
            });
            
            fazendasList.innerHTML = html;
            
        } catch (error) {
            console.error('Erro ao carregar fazendas:', error);
            fazendasList.innerHTML = '<p>Erro ao carregar fazendas.</p>';
        }
    }

    // Funções globais para ações
    window.editarTalhao = async function(talhaoId) {
        mostrarMensagem('Funcionalidade de edição será implementada em breve.', 'error');
    };
    
    window.excluirTalhao = async function(talhaoId) {
        if (!confirm('Tem certeza que deseja excluir este talhão?')) {
            return;
        }
        
        try {
            const { error } = await supabase
                .from('talhoes')
                .delete()
                .eq('id', talhaoId);
                
            if (error) throw error;
            
            mostrarMensagem('Talhão excluído com sucesso!');
            await carregarFazendasETalhoes();
            
        } catch (error) {
            console.error('Erro ao excluir talhão:', error);
            mostrarMensagem('Erro ao excluir talhão: ' + error.message, 'error');
        }
    };
});