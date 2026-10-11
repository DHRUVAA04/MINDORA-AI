/**
 * MINDORA AI — "Aurora Study Nebula" Design Tokens
 * 
 * Strict Single-Source-of-Truth token dictionary.
 * Components must consume semantic tokens or Tailwind classes
 * rather than hardcoded hex colors.
 */

export const PALETTE = {
  // Core palette
  midnightIndigo: '#1E1B4B', // primary dark
  royalIndigo: '#3730A3',    // primary
  electricViolet: '#7C3AED', // action/accent
  neonOrchid: '#D946EF',     // highlight
  auroraCyan: '#22D3EE',     // info/focus
  auroraMint: '#34D399',     // success/mastery
  solarAmber: '#FBBF24',     // warning/streak
  coralPulse: '#FB7185',     // error/weak topic
  lavenderMist: '#F5F3FF',   // soft background
  pearlWhite: '#FFFFFF',     // cards
  slateInk: '#1E293B',       // body text
} as const;

export const GRADIENTS = {
  // Signature gradients
  heroPrimary: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 45%, #7C3AED 100%)',
  auroraAccent: 'linear-gradient(120deg, #7C3AED 0%, #D946EF 50%, #22D3EE 100%)',
  masteryGlow: 'linear-gradient(135deg, #34D399 0%, #22D3EE 100%)',
  nebulaCardDark: 'linear-gradient(145deg, rgba(30, 27, 75, 0.7) 0%, rgba(21, 18, 49, 0.95) 100%)',
  timerRing: 'conic-gradient(#7C3AED, #D946EF, #22D3EE, #7C3AED)',
} as const;

export const SEMANTIC_STATUS = {
  mastered: {
    color: PALETTE.auroraMint,
    label: 'Mastered',
    bgLight: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.3)',
  },
  inProgress: {
    color: PALETTE.solarAmber,
    label: 'Needs Revision / In Progress',
    bgLight: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.3)',
  },
  weak: {
    color: PALETTE.coralPulse,
    label: 'Weak Topic',
    bgLight: 'rgba(251, 113, 133, 0.12)',
    border: 'rgba(251, 113, 133, 0.3)',
  },
  unassessed: {
    color: PALETTE.auroraCyan,
    label: 'Unassessed / Pending',
    bgLight: 'rgba(34, 211, 238, 0.12)',
    border: 'rgba(34, 211, 238, 0.3)',
  },
} as const;

export type TopicStatus = keyof typeof SEMANTIC_STATUS;

