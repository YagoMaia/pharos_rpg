/**
 * Utilitários de data e formatação para agendamento de sessões de RPG.
 */

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/**
 * Formata uma data de sessão para exibição amigável em português.
 * Se estiver no formato ISO (ex: "2026-10-17T19:30"), converte para "17/10/2026 (Sábado) às 19:30".
 * Caso contrário, retorna o texto original ou fallback "Data a definir".
 */
export function formatSessionDate(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return "Data a definir";
  const str = dateStr.trim();

  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hours = isoMatch[4] ? parseInt(isoMatch[4], 10) : 0;
    const minutes = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;

    const date = new Date(year, month, day, hours, minutes);
    if (!isNaN(date.getTime())) {
      const weekday = WEEKDAYS[date.getDay()];
      const dayFormatted = String(day).padStart(2, "0");
      const monthFormatted = String(month + 1).padStart(2, "0");
      const hasTime = !!isoMatch[4];
      const timeFormatted = hasTime ? ` às ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}` : "";

      return `${dayFormatted}/${monthFormatted}/${year} (${weekday})${timeFormatted}`;
    }
  }

  return str;
}

/**
 * Converte um objeto Date para o formato ISO local "YYYY-MM-DDTHH:mm",
 * compatível com o elemento web <input type="datetime-local" />.
 */
export function toDatetimeLocalString(date?: Date): string {
  const d = date instanceof Date ? date : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Retorna uma data inicial sugerida para a próxima sessão
 * (por exemplo, próximo sábado às 19:30).
 */
export function getSuggestedNextSessionDate(): string {
  const d = new Date();
  // Avança até o próximo sábado (dia 6)
  const currentDay = d.getDay();
  const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  d.setHours(19, 30, 0, 0);
  return toDatetimeLocalString(d);
}
