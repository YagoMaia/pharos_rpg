const test = require("node:test");
const assert = require("node:assert/strict");

// Função utilitária que será exportada em utils/sessionDate.ts
function formatSessionDate(dateStr) {
  if (!dateStr || !dateStr.trim()) return "Data a definir";
  const str = dateStr.trim();

  // Se já tiver formato ISO como "2026-10-17T19:30" ou "2026-10-17"
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hours = isoMatch[4] ? parseInt(isoMatch[4], 10) : 0;
    const minutes = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;

    const date = new Date(year, month, day, hours, minutes);
    if (!isNaN(date.getTime())) {
      const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      const weekday = weekdays[date.getDay()];
      const dayFormatted = String(day).padStart(2, "0");
      const monthFormatted = String(month + 1).padStart(2, "0");
      const hasTime = !!isoMatch[4];
      const timeFormatted = hasTime ? ` às ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}` : "";

      return `${dayFormatted}/${monthFormatted}/${year} (${weekday})${timeFormatted}`;
    }
  }

  return str;
}

function toDatetimeLocalString(date) {
  const d = date instanceof Date ? date : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

test("formatSessionDate formata ISO com dia da semana e horário", () => {
  // 2026-10-17 é um Sábado
  const formatted = formatSessionDate("2026-10-17T19:30");
  assert.equal(formatted, "17/10/2026 (Sábado) às 19:30");
});

test("formatSessionDate formata ISO apenas com data sem horário", () => {
  // 2026-10-18 é um Domingo
  const formatted = formatSessionDate("2026-10-18");
  assert.equal(formatted, "18/10/2026 (Domingo)");
});

test("formatSessionDate retorna texto amigável legado se não for ISO", () => {
  assert.equal(formatSessionDate("Próximo Sábado"), "Próximo Sábado");
  assert.equal(formatSessionDate(""), "Data a definir");
  assert.equal(formatSessionDate(null), "Data a definir");
});

test("toDatetimeLocalString gera formato YYYY-MM-DDTHH:mm válido", () => {
  const fixedDate = new Date(2026, 9, 15, 20, 0); // 15 de Outubro de 2026 às 20:00
  const result = toDatetimeLocalString(fixedDate);
  assert.equal(result, "2026-10-15T20:00");
});
