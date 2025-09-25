// js/supabase-client.js - VERSÃO CORRIGIDA

// Configuração do Supabase
const SUPABASE_URL = 'https://fwkybhfzfrovjausuqgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3a3liaGZ6ZnJvdmphdXN1cWduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MDI4OTgsImV4cCI6MjA3NDA3ODg5OH0.M7fN2ML2C4Lc1skLZx9YWyA9CUq813V6DNXP2QdTV0E';

// ✅ Inicialização segura
document.addEventListener('DOMContentLoaded', function() {
    if (typeof supabase !== 'undefined') {
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("✅ Supabase client inicializado:", SUPABASE_URL);
    } else {
        console.error("❌ Biblioteca Supabase não carregada");
    }
});