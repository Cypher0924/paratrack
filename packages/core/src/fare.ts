export type FareType = "regular" | "student" | "senior" | "pwd";
export type FareParams = { baseFare: number; baseKm: number; perKm: number };
export type FareBreakdown = {
  baseCentavos: number;
  extraKm: number;
  extraCentavos: number;
  discountCentavos: number;
  roundingCentavos: number;
  totalCentavos: number;
};

export const fare = (params: FareParams, distanceKm: number, fareType: FareType): FareBreakdown => {
  const baseCentavos = Math.round(params.baseFare * 100);
  const extraKm = Math.max(0, Math.round((distanceKm - params.baseKm) * 1000) / 1000);
  const extraCentavos = Math.round(extraKm * params.perKm * 100);
  const subtotal = baseCentavos + extraCentavos;
  const discountCentavos = fareType === "regular" ? 0 : Math.round(subtotal * 0.2);
  const discounted = subtotal - discountCentavos;
  const totalCentavos = Math.round(discounted / 25) * 25;
  return { baseCentavos, extraKm, extraCentavos, discountCentavos, roundingCentavos: totalCentavos - discounted, totalCentavos };
};

export const formatPeso = (centavos: number): string =>
  `${centavos < 0 ? "-" : ""}₱${(Math.abs(centavos) / 100).toFixed(2)}`;
