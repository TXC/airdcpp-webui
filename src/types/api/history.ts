import { HintedUser } from './common';

export interface HistoryItem {
  name: string;
  hub_url: string;
  description: string;
  last_opened: number;
  user: HintedUser | null;
}
