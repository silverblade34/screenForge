declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css'; // for side-effect imports

declare module 'clsx' {
  export type ClassValue = string | number | null | undefined | ClassValue[] | { [key: string]: any };
  export function clsx(...inputs: ClassValue[]): string;
  export default clsx;
}

declare module 'tailwind-merge' {
  export function twMerge(...inputs: any[]): string;
  export default twMerge;
}

/// <reference types="node" />
