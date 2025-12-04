#!/usr/bin/env node
/**
 * Script para matar processos em uma porta específica
 * Compatível com Windows, Linux e macOS
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PORT = process.env.PORT || 3000;

async function killPort(port) {
  try {
    console.log(`🔍 Verificando processos na porta ${port}...`);

    // Detectar sistema operacional
    const isWindows = process.platform === 'win32';

    if (isWindows) {
      // Windows
      try {
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);

        if (stdout) {
          // Extrair PIDs únicos
          const pids = [...new Set(
            stdout
              .split('\n')
              .map(line => line.trim().split(/\s+/).pop())
              .filter(pid => pid && pid !== '0' && !isNaN(pid))
          )];

          if (pids.length > 0) {
            console.log(`⚠️  Processos encontrados na porta ${port}: ${pids.join(', ')}`);

            for (const pid of pids) {
              try {
                await execAsync(`taskkill /PID ${pid} /F`);
                console.log(`✅ Processo ${pid} finalizado com sucesso`);
              } catch (error) {
                console.log(`⚠️  Não foi possível finalizar o processo ${pid} (pode ser protegido)`);
              }
            }
          } else {
            console.log(`✅ Nenhum processo encontrado na porta ${port}`);
          }
        } else {
          console.log(`✅ Porta ${port} está livre`);
        }
      } catch (error) {
        // Se netstat não encontrar nada, a porta está livre
        console.log(`✅ Porta ${port} está livre`);
      }
    } else {
      // Linux/macOS
      try {
        const { stdout } = await execAsync(`lsof -ti:${port}`);

        if (stdout) {
          const pids = stdout.trim().split('\n').filter(pid => pid);

          if (pids.length > 0) {
            console.log(`⚠️  Processos encontrados na porta ${port}: ${pids.join(', ')}`);

            for (const pid of pids) {
              try {
                await execAsync(`kill -9 ${pid}`);
                console.log(`✅ Processo ${pid} finalizado com sucesso`);
              } catch (error) {
                console.log(`⚠️  Não foi possível finalizar o processo ${pid}`);
              }
            }
          }
        } else {
          console.log(`✅ Porta ${port} está livre`);
        }
      } catch (error) {
        // Se lsof não encontrar nada, a porta está livre
        console.log(`✅ Porta ${port} está livre`);
      }
    }

    console.log('✨ Porta verificada e liberada!\n');
  } catch (error) {
    console.error('❌ Erro ao verificar porta:', error.message);
    // Não falhar o processo, apenas avisar
  }
}

// Executar
killPort(PORT);
