import { useMemo } from 'react';
import type { Card } from '@/types';

const compareCards = (a: Card, b: Card) =>
  a.position - b.position || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });

const cardFingerprint = (c: Card) =>
  [
    c._id,
    c.position,
    c.title,
    c.description,
    c.priority,
    c.dueDate ?? '',
    c.assignee?._id ?? '',
    c.updatedAt,
  ].join(':');

export const useSortedCards = (cards: Card[]) => {
  const sortKey = cards.map(cardFingerprint).join('|');

  return useMemo(() => [...cards].sort(compareCards), [sortKey, cards]);
};
