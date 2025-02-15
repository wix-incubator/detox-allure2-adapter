import type { StepDescription, StepArgs } from '../../types';

export function concat(...results: (StepDescription | string | null)[]): StepDescription {
  return {
    message: results.map(stringify).reduce(join, ''),
    args: results.map(getArgs).reduce(mergeArgs),
  };
}

export function msg(message: string, args: StepArgs): StepDescription {
  return {
    message,
    args: omitEmpty(args),
  };
}

export function percent(value?: unknown): string {
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(num) ? (num * 100).toFixed(0) + '%' : '';
}

export function truncate(value?: unknown, maxLength = 30): string {
  if (!value) return '';

  const str = typeof value === 'string' ? value : String(value);
  if (str.length <= maxLength) return str;

  const charsToShow = maxLength - 1; // -1 for the ellipsis
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  const backStart = str.length - backChars;

  return str.slice(0, Math.max(0, frontChars)) + '…' + str.slice(Math.max(0, backStart));
}

function stringify(desc: StepDescription | string | null | undefined): string | null {
  if (!desc) return null;
  return typeof desc === 'string' ? desc : desc?.message;
}

function join(acc: string, desc: string | null): string {
  return acc && desc ? `${acc} ${desc}` : (desc ?? acc);
}

function omitEmpty(args: StepArgs): StepArgs {
  return args ? Object.fromEntries(Object.entries(args).filter(isNotNullish)) : args;
}

function isNotNullish([_key, value]: [string, unknown]): boolean {
  return value != null;
}

function getArgs(r: StepDescription | string | null): StepArgs {
  return r !== null && typeof r === 'object' ? r.args : null;
}

function mergeArgs(acc: StepArgs, r: StepArgs): StepArgs {
  return r == null ? acc : { ...acc, ...r };
}
