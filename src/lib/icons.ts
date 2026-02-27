import {
  Boxes,
  Code2,
  Cpu,
  Palette,
  PanelTop,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  Code2,
  Cpu,
  PanelTop,
  Palette,
  ShieldCheck,
};

export function getIconByName(name: string): LucideIcon {
  return iconMap[name] ?? Boxes;
}
