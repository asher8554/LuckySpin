// 과일 구슬의 색상과 캔버스 드로잉 규칙을 제공한다.
import type { MarbleEntry } from "../types";

export interface FruitStyle {
  fill: string;
  ring: string;
  text: string;
  kind: "watermelon" | "kiwi" | "orange" | "generic";
}

function hashName(name: string) {
  return [...name].reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

export function getFruitStyle(name: string): FruitStyle {
  if (name.includes("수박")) {
    return { fill: "#ff5757", ring: "#f3fff0", text: "#ff5fb8", kind: "watermelon" };
  }

  if (name.includes("키위")) {
    return { fill: "#91c94d", ring: "#2d5f2d", text: "#39e8d0", kind: "kiwi" };
  }

  if (name.includes("귤") || name.includes("오렌지")) {
    return { fill: "#ffa928", ring: "#fef4b4", text: "#ffe55c", kind: "orange" };
  }

  const hue = hashName(name) % 360;
  return {
    fill: `hsl(${hue} 80% 56%)`,
    ring: `hsl(${hue} 90% 86%)`,
    text: `hsl(${hue} 100% 72%)`,
    kind: "generic",
  };
}

export function drawFruitMarble(
  context: CanvasRenderingContext2D,
  marble: MarbleEntry,
  x: number,
  y: number,
  radius: number,
) {
  const style = getFruitStyle(marble.name);

  context.save();
  context.translate(x, y);
  context.shadowBlur = 12;
  context.shadowColor = style.fill;
  context.fillStyle = style.ring;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = style.fill;
  context.beginPath();
  context.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
  context.fill();

  if (style.kind === "watermelon") {
    context.fillStyle = "#171717";
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      context.beginPath();
      context.ellipse(
        Math.cos(angle) * radius * 0.35,
        Math.sin(angle) * radius * 0.35,
        2,
        4,
        angle,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }

  if (style.kind === "kiwi") {
    context.fillStyle = "#f7f0b8";
    context.beginPath();
    context.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    context.fill();
  }

  if (style.kind === "orange") {
    context.strokeStyle = "#fff3bc";
    context.lineWidth = 1.5;
    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10;
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(Math.cos(angle) * radius * 0.72, Math.sin(angle) * radius * 0.72);
      context.stroke();
    }
  }

  context.restore();
}
