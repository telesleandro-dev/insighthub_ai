import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do .env.local para os testes
config({ path: path.resolve(__dirname, '../.env.local') });
