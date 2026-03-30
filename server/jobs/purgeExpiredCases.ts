import * as db from "../db";

/**
 * Job para limpar permanentemente processos deletados há mais de 30 dias
 * Deve ser executado diariamente via cron job ou task scheduler
 */
export async function purgeExpiredDeletedCases() {
  try {
    console.log("[Purge Job] Iniciando limpeza de processos expirados...");

    const result = await db.purgeExpiredDeletedCases();

    console.log("[Purge Job] Limpeza concluída com sucesso");
    return {
      success: true,
      message: "Processos expirados foram permanentemente removidos",
    };
  } catch (error) {
    console.error("[Purge Job] Erro ao limpar processos expirados:", error);
    throw error;
  }
}

/**
 * Função auxiliar para agendar o job de limpeza
 * Pode ser chamada durante a inicialização do servidor
 */
export function schedulePurgeJob() {
  // Executar a cada dia às 2 da manhã
  const schedule = require("node-schedule");

  schedule.scheduleJob("0 2 * * *", async () => {
    try {
      await purgeExpiredDeletedCases();
    } catch (error) {
      console.error("[Purge Job] Erro ao executar job agendado:", error);
    }
  });

  console.log("[Purge Job] Job de limpeza agendado para 02:00 diariamente");
}
