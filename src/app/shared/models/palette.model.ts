import {NodeType} from '../../features/builder/mocks/home.schema.mock';

export type PaletteGroupKey = 'layout' | 'basic' | 'cards';

export interface PaletteItem {
  type: NodeType;
  title: string;
  subtitle?: string;
  icon?: string;
}

export interface PaletteGroup {
  key: PaletteGroupKey;
  title: string;
  items: PaletteItem[];
}
