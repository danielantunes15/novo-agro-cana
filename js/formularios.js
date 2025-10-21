document.addEventListener('DOMContentLoaded', async () => {
    // Autenticação
    if (!window.sistemaAuth || !window.sistemaAuth.requerAutenticacao()) return;

    // Elementos do DOM
    const turmaSelect = document.getElementById('turma-select');
    const gerarPreviewBtn = document.getElementById('gerar-preview-btn');
    const gerarBrancoBtn = document.getElementById('gerar-branco-btn');
    const imprimirBtn = document.getElementById('imprimir-btn');
    const previewContainer = document.getElementById('preview-container');
    const errorElement = document.getElementById('error-message');
    
    // Carrega as turmas no select
    async function carregarTurmas() {
        try {
            const { data, error } = await supabase
                .from('turmas')
                .select('id, nome')
                .order('nome');

            if (error) throw error;

            turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
            data.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id;
                option.textContent = turma.nome;
                turmaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            errorElement.style.display = 'block';
            mostrarMensagem('Falha ao carregar a lista de turmas.', 'error');
        }
    }

    // Gera a pré-visualização do formulário POR TURMA
    async function gerarPreviewPorTurma() {
        const turmaId = turmaSelect.value;
        const turmaNome = turmaSelect.options[turmaSelect.selectedIndex].text;
        
        if (!turmaId) {
            mostrarMensagem('Por favor, selecione a turma.', 'error');
            return;
        }

        try {
            const { data: funcionarios, error } = await supabase
                .from('funcionarios')
                .select('nome, codigo')
                .eq('turma', turmaId)
                .order('nome'); // ALTERADO: Ordena APENAS por nome (ordem alfabética)

            if (error) throw error;

            // Preenche o cabeçalho
            document.getElementById('preview-turma').textContent = turmaNome;
            
            const tbody = document.getElementById('funcionarios-tbody');
            tbody.innerHTML = '';
            
            // Adiciona funcionários da turma
            funcionarios.forEach(func => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${func.codigo || ''}</td> <td>${func.nome}</td>           <td></td><td></td><td></td><td></td><td></td> `;
                tbody.appendChild(tr);
            });
            
            // Adiciona 5 linhas em branco extras para anotações (Total de 7 colunas)
            for (let i = 0; i < 5; i++) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td></td><td></td><td></td><td></td><td></td><td></td><td></td> `;
                tbody.appendChild(tr);
            }

            // Exibe o formulário
            previewContainer.style.display = 'block';
            imprimirBtn.style.display = 'inline-block';
            mostrarMensagem('Formulário da turma gerado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao gerar preview:', error);
            mostrarMensagem('Erro ao buscar funcionários: ' + error.message, 'error');
        }
    }

    // Gera um formulário EM BRANCO com 45 linhas
    function gerarFormularioEmBranco() {
        // Limpa o campo de turma
        document.getElementById('preview-turma').textContent = "__________________";

        const tbody = document.getElementById('funcionarios-tbody');
        tbody.innerHTML = '';
            
        // Adiciona 45 linhas totalmente em branco (Total de 7 colunas)
        for (let i = 0; i < 45; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td></td><td></td><td></td><td></td><td></td><td></td><td></td> `;
            tbody.appendChild(tr);
        }

        // Exibe o formulário
        previewContainer.style.display = 'block';
        imprimirBtn.style.display = 'inline-block';
        mostrarMensagem('Formulário em branco gerado com sucesso!', 'success');
    }

    // Função de impressão
    function imprimirFormulario() {
        window.print();
    }

    // Event Listeners
    gerarPreviewBtn.addEventListener('click', gerarPreviewPorTurma);
    gerarBrancoBtn.addEventListener('click', gerarFormularioEmBranco);
    imprimirBtn.addEventListener('click', imprimirFormulario);

    // Inicialização
    await carregarTurmas();
});