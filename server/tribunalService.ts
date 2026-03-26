import axios, { AxiosInstance } from "axios";
import { TRPCError } from "@trpc/server";

/**
 * Tribunal webservice integration service
 * Handles communication with court/tribunal APIs for case data synchronization
 */
export class TribunalService {
  private client: AxiosInstance;
  private apiUrl: string;
  private authMethod: "api_key" | "oauth" | "basic_auth" | "custom";
  private apiKey?: string;
  private apiSecret?: string;

  constructor(
    apiUrl: string,
    authMethod: "api_key" | "oauth" | "basic_auth" | "custom",
    apiKey?: string,
    apiSecret?: string
  ) {
    this.apiUrl = apiUrl;
    this.authMethod = authMethod;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    // Initialize axios client with auth headers
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
      headers: this.getAuthHeaders(),
    });

    // Add error interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("[TribunalService] API Error:", error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Get authorization headers based on auth method
   */
  private getAuthHeaders(): Record<string, string> {
    switch (this.authMethod) {
      case "api_key":
        return {
          "X-API-Key": this.apiKey || "",
          "Content-Type": "application/json",
        };
      case "basic_auth":
        const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString("base64");
        return {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        };
      case "oauth":
        return {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        };
      default:
        return {
          "Content-Type": "application/json",
        };
    }
  }

  /**
   * Search for a case by process number
   */
  async searchCase(processNumber: string): Promise<any> {
    try {
      const response = await this.client.get("/cases/search", {
        params: { processNumber },
      });
      return response.data;
    } catch (error: any) {
      console.error("[TribunalService] Error searching case:", error.message);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Erro ao buscar processo: ${error.message}`,
      });
    }
  }

  /**
   * Get detailed case information
   */
  async getCaseDetails(processNumber: string): Promise<any> {
    try {
      const response = await this.client.get(`/cases/${processNumber}`);
      return response.data;
    } catch (error: any) {
      console.error("[TribunalService] Error getting case details:", error.message);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Erro ao obter detalhes do processo: ${error.message}`,
      });
    }
  }

  /**
   * Get case movements/history
   */
  async getCaseMovements(processNumber: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await this.client.get(`/cases/${processNumber}/movements`, {
        params: { limit },
      });
      return response.data.movements || [];
    } catch (error: any) {
      console.error("[TribunalService] Error getting case movements:", error.message);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Erro ao obter movimentações: ${error.message}`,
      });
    }
  }

  /**
   * Get case hearings/audiências
   */
  async getCaseHearings(processNumber: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/cases/${processNumber}/hearings`);
      return response.data.hearings || [];
    } catch (error: any) {
      console.error("[TribunalService] Error getting case hearings:", error.message);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Erro ao obter audiências: ${error.message}`,
      });
    }
  }

  /**
   * Get case documents
   */
  async getCaseDocuments(processNumber: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/cases/${processNumber}/documents`);
      return response.data.documents || [];
    } catch (error: any) {
      console.error("[TribunalService] Error getting case documents:", error.message);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Erro ao obter documentos: ${error.message}`,
      });
    }
  }

  /**
   * Get court information
   */
  async getCourtInfo(courtCode: string): Promise<any> {
    try {
      const response = await this.client.get(`/courts/${courtCode}`);
      return response.data;
    } catch (error: any) {
      console.error("[TribunalService] Error getting court info:", error.message);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Erro ao obter informações do tribunal: ${error.message}`,
      });
    }
  }

  /**
   * Get judge information
   */
  async getJudgeInfo(judgeCode: string): Promise<any> {
    try {
      const response = await this.client.get(`/judges/${judgeCode}`);
      return response.data;
    } catch (error: any) {
      console.error("[TribunalService] Error getting judge info:", error.message);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Erro ao obter informações do juiz: ${error.message}`,
      });
    }
  }

  /**
   * Sync case data from tribunal
   * Returns normalized court data
   */
  async syncCaseData(processNumber: string): Promise<{
    courtName?: string;
    vara?: string;
    judge?: string;
    processStatus?: string;
    lastMovement?: string;
    lastMovementDate?: Date;
    plaintiff?: string;
    defendant?: string;
    nextHearingDate?: Date;
    nextHearingLocation?: string;
    nextHearingType?: string;
  }> {
    try {
      const caseDetails = await this.getCaseDetails(processNumber);
      const movements = await this.getCaseMovements(processNumber, 1);
      const hearings = await this.getCaseHearings(processNumber);

      // Normalize data from tribunal API
      return {
        courtName: caseDetails.court?.name,
        vara: caseDetails.court?.vara,
        judge: caseDetails.judge?.name,
        processStatus: this.normalizeProcessStatus(caseDetails.status),
        lastMovement: movements[0]?.description,
        lastMovementDate: movements[0]?.date ? new Date(movements[0].date) : undefined,
        plaintiff: caseDetails.plaintiff?.name,
        defendant: caseDetails.defendant?.name,
        nextHearingDate: hearings[0]?.date ? new Date(hearings[0].date) : undefined,
        nextHearingLocation: hearings[0]?.location,
        nextHearingType: hearings[0]?.type,
      };
    } catch (error: any) {
      console.error("[TribunalService] Error syncing case data:", error.message);
      throw error;
    }
  }

  /**
   * Normalize process status from tribunal to system format
   */
  private normalizeProcessStatus(
    tribunalStatus: string
  ): "pending" | "active" | "suspended" | "archived" | "closed" | "appealed" | "unknown" {
    const statusMap: Record<string, any> = {
      ativo: "active",
      pendente: "pending",
      suspenso: "suspended",
      arquivado: "archived",
      encerrado: "closed",
      apelado: "appealed",
    };

    return statusMap[tribunalStatus?.toLowerCase()] || "unknown";
  }

  /**
   * Test connection to tribunal API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/health");
      return response.status === 200;
    } catch (error) {
      console.error("[TribunalService] Connection test failed:", error);
      return false;
    }
  }
}

/**
 * Create tribunal service instance from config
 */
export function createTribunalService(
  apiUrl: string,
  authMethod: "api_key" | "oauth" | "basic_auth" | "custom",
  apiKey?: string,
  apiSecret?: string
): TribunalService {
  return new TribunalService(apiUrl, authMethod, apiKey, apiSecret);
}
