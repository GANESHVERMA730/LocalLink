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
} from 'lucide-react';

const ICONS = {
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

export function CategoryIcon({ name, className }) {
  const Icon = ICONS[name] ?? Briefcase;
  return <Icon className={className} />;
}
