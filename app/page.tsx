import type { Metadata } from "next";
import FarmGame from "./game";

export const metadata: Metadata = {
  title: "青禾谷｜你的掌上田园",
  description: "种下第一颗种子，在青禾谷度过悠闲而充实的每一天。",
};

export default function Home() {
  return <FarmGame />;
}
