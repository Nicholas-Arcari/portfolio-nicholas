// src/utils/romeDate.js
// Data e ora nel formato GG/MM/AAAA HH:MM, sempre nel fuso di Roma (CEST
// d'estate, CET d'inverno), indipendentemente dal fuso del dispositivo.
const FORMAT = new Intl.DateTimeFormat('it-IT', {
  timeZone: 'Europe/Rome',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export const formatRomeDateTime = (iso) => {
  const parts = Object.fromEntries(
    FORMAT.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
};
