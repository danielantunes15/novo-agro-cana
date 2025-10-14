// js/utils.js

/**
 * Exibe uma mensagem de alerta temporária na página.
 * @param {string} mensagem - A mensagem a ser exibida.
 * @param {string} [tipo='success'] - O tipo de mensagem ('success' ou 'error').
 */
function mostrarMensagem(mensagem, tipo = 'success') {
    const mensagensAntigas = document.querySelectorAll('.alert-message');
    mensagensAntigas.forEach(msg => msg.remove());

    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `alert-message ${tipo === 'error' ? 'alert-error' : 'alert-success'}`;
    mensagemDiv.innerHTML = `
        <div style="padding: 1rem; margin: 1rem 0; border-radius: 4px; background-color: ${tipo === 'error' ? '#f8d7da' : '#d4edda'}; color: ${tipo === 'error' ? '#721c24' : '#155724'};">
            <strong>${tipo === 'error' ? '⚠️' : '✅'} </strong> ${mensagem}
            <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">×</button>
        </div>
    `;
    
    const container = document.querySelector('.main .container');
    if (container) {
        container.prepend(mensagemDiv);
    }

    setTimeout(() => {
        if (mensagemDiv.parentElement) {
            mensagemDiv.remove();
        }
    }, 5000);
}

/**
 * Testa a conexão com o cliente Supabase.
 * @returns {Promise<boolean>} Retorna true se a conexão for bem-sucedida.
 */
async function testarConexaoSupabase() {
    try {
        const { data, error } = await supabase
            .from('fazendas')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        console.log('✅ Conexão com Supabase estabelecida');
        return true;
    } catch (error) {
        throw new Error(`Falha na conexão: ${error.message}`);
    }
}

/**
 * Formata uma data no formato DD/MM/YYYY.
 * @param {string|Date} data - A string ou objeto Date a ser formatado.
 * @returns {string} A data formatada.
 */
function formatarData(data) {
    if (!data) return '';
    const datePart = String(data).split('T')[0];
    const parts = datePart.split('-');
    
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    try {
        return new Date(data).toLocaleDateString('pt-BR');
    } catch (e) {
        return 'N/A';
    }
}