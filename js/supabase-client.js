// Configuração do Supabase
const SUPABASE_URL = 'https://fwkybhfzfrovjausuqgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3a3liaGZ6ZnJvdmphdXN1cWduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MDI4OTgsImV4cCI6MjA3NDA3ODg5OH0.M7fN2ML2C4Lc1skLZx9YWyA9CUq813V6DNXP2QdTV0E';

// Verificar se supabase está disponível
if (typeof supabase === 'undefined') {
    // Inicializar o cliente Supabase
    var supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Testar conexão
    supabase.from('fazendas').select('count', { count: 'exact', head: true })
        .then(({ count, error }) => {
            if (error) {
                console.error('Erro na conexão com Supabase:', error);
            } else {
                console.log('Conexão com Supabase estabelecida com sucesso');
            }
        });
}

// Exportar para uso global
window.supabase = supabase;