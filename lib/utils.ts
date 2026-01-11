import { type ClassValue } from 'clsx'

let clsxFn: (...inputs: ClassValue[]) => string;
let twMergeFn: (classNames: string) => string;

// Try to load clsx
try {
  const { clsx } = await import('clsx');
  clsxFn = clsx;
} catch (error) {
  console.log('[v0] Using clsx fallback for Safari compatibility');
  // Fallback implementation for Safari/iOS when clsx can't load from blob URL
  clsxFn = (...inputs: ClassValue[]): string => {
    return inputs
      .flat()
      .filter((x) => typeof x === 'string' || typeof x === 'number')
      .join(' ')
      .trim();
  };
}

// Try to load tailwind-merge
try {
  const { twMerge } = await import('tailwind-merge');
  twMergeFn = twMerge;
} catch (error) {
  console.log('[v0] Using tailwind-merge fallback for Safari compatibility');
  // Fallback: just return the classes as-is if tailwind-merge can't load
  twMergeFn = (classNames: string) => classNames;
}

export function cn(...inputs: ClassValue[]) {
  return twMergeFn(clsxFn(inputs));
}
