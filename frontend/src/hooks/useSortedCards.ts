import { useMemo } from 'react';
import type { Card } from '@/types';

export const useSortedCards = (cards: Card[]) =>
  useMemo(() => [...cards].sort((a, b) => a.position - b.position), [cards]);
