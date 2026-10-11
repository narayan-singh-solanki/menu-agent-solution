export function isoToLocalInput(iso: string, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(new Date(iso));
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value || '';

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
}

export function localInputToIso(localDateTime: string, timeZone: string): string {
  const [datePart, timePart] = localDateTime.split('T');
  if (!datePart || !timePart) throw new Error('Invalid date-time format from input.');

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  const targetWallClockUtc = Date.UTC(year, month - 1, day, hour, minute);

  let guessedUtcTime = targetWallClockUtc;

  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(guessedUtcTime));

    const getNum = (type: string) => Number(parts.find((part) => part.type === type)?.value);

    const guessedWallClockUtc = Date.UTC(
      getNum('year'), getNum('month') - 1, getNum('day'),
      getNum('hour'), getNum('minute')
    );
    const offsetDelta = targetWallClockUtc - guessedWallClockUtc;

    if (offsetDelta === 0) break;
    guessedUtcTime += offsetDelta;
  }

  return new Date(guessedUtcTime).toISOString();
}