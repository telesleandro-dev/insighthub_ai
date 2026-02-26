import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Usando o cliente anônimo (como o Frontend faria)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Security - Multi-tenant Validation', () => {
    it('should block access to leads_profiles without a valid session (RLS)', async () => {
        // Tentar buscar leads sem estar logado
        const { data, error } = await supabase
            .from('leads_profiles')
            .select('*');

        // O RLS deve garantir que nada retorne (ou apenas dados públicos, que não existem nesta tabela)
        // No Supabase, se o RLS bloqueia, ele retorna um array vazio em vez de erro de acesso, 
        // a menos que a política seja explícitamente negada.
        expect(data).toHaveLength(0);
    });

    it('should not allow access to other users data even if we try to bypass user_id filter', async () => {
        // Simular uma tentativa maliciosa de buscar todos os leads (burlar multi-tenant no código do front)
        // Isso testa se a "Constituição" está sendo aplicada no banco, não só no código.
        const { data, error } = await supabase
            .from('leads_profiles')
            .select('*')
            .not('user_id', 'is', null);

        // Deve retornar vazio pois não há sessão ativa vinculada a um user_id
        expect(data).toHaveLength(0);
    });
});
