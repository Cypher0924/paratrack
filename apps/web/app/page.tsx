import type { Metadata } from "next";
import { Landing } from "@/components/landing";

export const metadata: Metadata = {
  title: "ParaTrack: live jeepney and bus tracking for Tarlac City",
  description: "See where each jeepney, e-jeep, bus and campus shuttle is, its arrival time, seats left and LTFRB fare.",
};

export default function Page() {
  return <Landing />;
}
