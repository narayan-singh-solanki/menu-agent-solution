import type { ResolveContext, Schedule } from './types';

function timeToMinutes(timeStr: string): number {
  const [hour, minute] = timeStr.split(':').map(Number);
  
  if (isNaN(hour) || isNaN(minute) || hour > 23 || minute > 59) {
    throw new Error(`Invalid schedule time format: ${timeStr}`);
  }
  
  return (hour * 60) + minute;
}

export function getTargetDate(ctx: ResolveContext): Date {
  const target = new Date(ctx.preorder_slot || ctx.now);
  
  if (isNaN(target.getTime())) {
    throw new Error(`Invalid timestamp in context: ${ctx.preorder_slot || ctx.now}`);
  }
  
  return target;
}

export function isWithinSchedule(schedule: Schedule | null, ctx: ResolveContext): boolean {
  if (!schedule) return true;

  const targetDate = getTargetDate(ctx);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ctx.timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(targetDate);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const currentDay = getPart('weekday').toLowerCase();
  const currentMinuteOfDay = (Number(getPart('hour')) * 60) + Number(getPart('minute'));

  const startMinute = timeToMinutes(schedule.start);
  const endMinute = timeToMinutes(schedule.end);

  if (endMinute <= startMinute) {
    throw new Error(`Invalid or overnight schedule range not supported: ${schedule.start}-${schedule.end}`);
  }

  const scheduledDays = schedule.days.map((day) => day.toLowerCase());
  const isScheduledToday = scheduledDays.includes(currentDay);

  return isScheduledToday && currentMinuteOfDay >= startMinute && currentMinuteOfDay < endMinute;
}