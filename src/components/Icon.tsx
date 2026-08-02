import {
  Wrench,
  Zap,
  GraduationCap,
  Sparkles,
  Hammer,
  PaintRoller,
  Car,
  Camera,
  Dumbbell,
  Scissors,
  PartyPopper,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Wrench,
  Zap,
  GraduationCap,
  Sparkles,
  Hammer,
  PaintRoller,
  Car,
  Camera,
  Dumbbell,
  Scissors,
  PartyPopper,
  Briefcase,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Briefcase;
  return <Icon className={className} />;
}
