import type { CategoryId, Garment, WeatherSnapshot } from "./types";

export interface WardrobeGap {
  id: string;
  title: string;
  hint: string;
  categoryId: CategoryId;
  priority: number;
}

export function analyzeWardrobeGaps(garments: Garment[], weather?: WeatherSnapshot | null): WardrobeGap[] {
  const active = garments.filter((item) => item.availability === "active" && !item.deletedAt);
  const count = (ids: CategoryId[]) => active.filter((item) => ids.includes(item.categoryId)).length;
  const gaps: WardrobeGap[] = [];
  const tops = count(["top-short", "top-long"]);
  const bottoms = count(["pants", "skirt"]);
  const dresses = count(["dress"]);
  const shoes = count(["shoes"]);
  if (!tops && !dresses) gaps.push({ id: "base-top", title: "补一件上装", hint: "先完成基础组合", categoryId: "top-short", priority: 100 });
  if (!bottoms && !dresses) gaps.push({ id: "base-bottom", title: "补一件下装", hint: "裤装或半身裙都可以", categoryId: "pants", priority: 98 });
  if (!shoes) gaps.push({ id: "base-shoes", title: "补一双鞋", hint: "让推荐成为完整穿搭", categoryId: "shoes", priority: 96 });
  if (tops + dresses < 3) gaps.push({ id: "core-variety", title: "增加核心单品", hint: "更容易生成不同方案", categoryId: dresses ? "dress" : "top-long", priority: 76 });
  if (shoes < 2) gaps.push({ id: "shoe-variety", title: "增加百搭鞋履", hint: "提升场景适配度", categoryId: "shoes", priority: 70 });
  if ((weather?.temp ?? 22) <= 18 && !count(["outerwear"])) gaps.push({ id: "cool-outerwear", title: "准备一件外套", hint: "适合降温和早晚温差", categoryId: "outerwear", priority: 82 });
  if (!count(["accessory"])) gaps.push({ id: "accessory", title: "加入一件配饰", hint: "让搭配更有层次", categoryId: "accessory", priority: 45 });
  return gaps.sort((a, b) => b.priority - a.priority).filter((item, index, list) => list.findIndex((candidate) => candidate.categoryId === item.categoryId) === index).slice(0, 5);
}
