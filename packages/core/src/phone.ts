export const parsePhMobile = (input: string): string | null => {
  const digits = input.replace(/[\s-]/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return null;
  const m = /^(?:63|0)?(9\d{9})$/.exec(digits);
  return m ? `+63${m[1]}` : null;
};
