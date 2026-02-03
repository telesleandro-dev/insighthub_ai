import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || '', serviceRoleKey || '');

interface AnalyticsQuery {
    userId: string;
    timeFilter?: 'today' | '7d' | '30d';
    productId?: string;
}

// Calculate reputation score from sentiments
function calculateReputationScore(sentimentCounts: Record<string, number>): {
    score: number;
    label: 'Ruim' | 'Neutro' | 'Bom' | 'Excelente';
} {
    const positivos = sentimentCounts['Positivo'] || 0;
    const neutros = sentimentCounts['Neutro'] || 0;
    const negativos = sentimentCounts['Negativo'] || 0;
    const total = positivos + neutros + negativos;

    if (total === 0) {
        return { score: 50, label: 'Neutro' };
    }

    // Formula: (positivos * 100 + neutros * 50 + negativos * 0) / total
    const score = Math.round(((positivos * 100) + (neutros * 50)) / total);

    let label: 'Ruim' | 'Neutro' | 'Bom' | 'Excelente';
    if (score >= 76) label = 'Excelente';
    else if (score >= 51) label = 'Bom';
    else if (score >= 26) label = 'Neutro';
    else label = 'Ruim';

    return { score, label };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const timeFilter = searchParams.get('timeFilter') || '7d';
        const productId = searchParams.get('productId'); // NEW: product filter

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (timeFilter) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case '30d':
                startDate = new Date(now.setDate(now.getDate() - 30));
                break;
            case '7d':
            default:
                startDate = new Date(now.setDate(now.getDate() - 7));
        }

        // Build query with optional product filter
        let query = supabase
            .from('inbox_messages')
            .select('*')
            .eq('user_id', userId)
            .gte('received_at', startDate.toISOString());

        // Apply product filter if provided
        if (productId && productId !== 'all') {
            query = query.eq('product_id', productId);
        }

        const { data: messages, error } = await query.order('received_at', { ascending: false });

        if (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }

        // Aggregate statistics
        const totalMessages = messages?.length || 0;

        // Group by intention (intencao)
        const intentionCounts: Record<string, number> = {};
        messages?.forEach(msg => {
            const intention = msg.intencao || 'Outros';
            intentionCounts[intention] = (intentionCounts[intention] || 0) + 1;
        });

        // Group by sentiment
        const sentimentCounts: Record<string, number> = {
            'Positivo': 0,
            'Neutro': 0,
            'Negativo': 0
        };
        messages?.forEach(msg => {
            const sentiment = msg.analise_sentimento || 'Neutro';
            sentimentCounts[sentiment]++;
        });

        // Calculate reputation
        const reputation = calculateReputationScore(sentimentCounts);

        // Calculate average conversion probability
        const avgConversion = messages && messages.length > 0
            ? messages.reduce((acc, msg) => acc + (msg.probabilidade_conversao || 0), 0) / messages.length
            : 0;

        // Extract top pain points
        const allPainPoints: string[] = [];
        messages?.forEach(msg => {
            if (msg.dores_identificadas && Array.isArray(msg.dores_identificadas)) {
                allPainPoints.push(...msg.dores_identificadas);
            }
        });

        const painPointCounts: Record<string, number> = {};
        allPainPoints.forEach(pain => {
            painPointCounts[pain] = (painPointCounts[pain] || 0) + 1;
        });

        const topPainPoints = Object.entries(painPointCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([pain, count]) => ({ pain, count }));

        return NextResponse.json({
            totalMessages,
            intentionCounts,
            sentimentCounts,
            avgConversion: Math.round(avgConversion),
            topPainPoints,
            reputationScore: reputation.score, // NEW
            reputationLabel: reputation.label, // NEW
            messages: messages || []
        });

    } catch (error: any) {
        console.error('Error in analytics endpoint:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
