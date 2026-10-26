import { Target, Flag } from 'lucide-react';

// Activity types that can be recorded during a match
export const ACTIVITY_TYPES = {
  goal: { label: 'Goal', icon: Target, color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  foul: { label: 'Foul', icon: Flag, color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
};