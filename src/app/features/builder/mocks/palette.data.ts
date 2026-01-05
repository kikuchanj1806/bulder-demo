import {PaletteGroup} from '../../../shared/models/palette.model';

export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    key: 'layout',
    title: 'Layout',
    items: [
      { type: 'BLOCK', title: 'Block', subtitle: 'Flex container (row/column)', icon: 'fa-light fa-square' },
      { type: 'GRID', title: 'Grid', subtitle: 'Grid container', icon: 'fa-light fa-grid-2' },
      { type: 'LIST', title: 'List', subtitle: 'Vertical list', icon: 'fa-light fa-list' },
    ],
  },
  {
    key: 'basic',
    title: 'Basic',
    items: [
      { type: 'TEXT', title: 'Text', subtitle: 'Heading / paragraph', icon: 'fa-light fa-text' },
      { type: 'IMAGE', title: 'Image', subtitle: 'Responsive image', icon: 'fa-light fa-image' },
    ],
  },
  {
    key: 'cards',
    title: 'Cards',
    items: [
      { type: 'PRODUCT_CARD', title: 'Product card', subtitle: 'Image + title + price', icon: 'fa-light fa-bag-shopping' },
      { type: 'BLOG_CARD', title: 'Blog card', subtitle: 'Image + title', icon: 'fa-light fa-newspaper' },
    ],
  },
];
