
export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

class ChangeLogService {
  private logs: ChangeLogEntry[] = [];

  addLog(action: string, details: string) {
    const entry: ChangeLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      details,
    };
    this.logs.unshift(entry); // Add to the beginning
    console.log("Change Log:", entry);
  }

  getLogs(): ChangeLogEntry[] {
    return this.logs;
  }
}

export const changeLogService = new ChangeLogService();
