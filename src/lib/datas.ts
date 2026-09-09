// src/lib/datas.ts
// Parse de datas acadêmicas SEM deslocamento de fuso horário.
//
// O problema: `new Date("2026-09-12")` (string só com data, sem hora) é
// interpretado como MEIA-NOITE UTC pela especificação ECMAScript. No Brasil
// (UTC-3) isso vira 21h do DIA ANTERIOR — então uma prova de sábado dia 12
// aparecia como "11 de setembro" (sexta-feira).
//
// `parseDataLocal("2026-09-12")` cria a data como MEIA-NOITE LOCAL, sem
// deslocamento. Use SEMPRE este helper para datas de eventos/avaliações
// (dataInicio, dataFim, dataPresencial). Timestamps completos com timezone
// (ex: criado_em do Supabase) continuam funcionando via `new Date()`.
export function parseDataLocal(data: string | Date): Date {
  if (data instanceof Date) return data;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.trim());
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(data);
}
