const raw =
  import.meta.env.VITE_API_URL?.trim() ??
  import.meta.env.NEXT_PUBLIC_API_URL?.trim() ??
  '';

export const API_URL = raw.replace(/\/+$/, '');
