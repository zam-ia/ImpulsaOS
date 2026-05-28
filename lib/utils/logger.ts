export function logInfo(scope: string, message: string, metadata?: Record<string, unknown>) {
  console.info(JSON.stringify({ level: "info", scope, message, metadata, at: new Date().toISOString() }));
}

export function logError(scope: string, message: string, metadata?: Record<string, unknown>) {
  console.error(JSON.stringify({ level: "error", scope, message, metadata, at: new Date().toISOString() }));
}
