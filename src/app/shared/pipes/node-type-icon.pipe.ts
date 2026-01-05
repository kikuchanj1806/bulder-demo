import { Pipe, PipeTransform } from '@angular/core';
import {NodeType} from '../../features/builder/mocks/home.schema.mock';

type IconResult = { cls: string; label: string };

@Pipe({
  name: 'nodeTypeIcon',
  standalone: true,
})
export class NodeTypeIconPipe implements PipeTransform {
  transform(type: NodeType | string | null | undefined): IconResult {
    const t = String(type ?? '').toUpperCase();

    const map: Record<string, IconResult> = {
      BLOCK: { cls: 'fa-light fa-square', label: 'Block' },
      TEXT: { cls: 'fa-light fa-text-size', label: 'Text' },
      IMAGE: { cls: 'fa-light fa-image', label: 'Image' },
      GRID: { cls: 'fa-light fa-grid-2', label: 'Grid' },
      LIST: { cls: 'fa-light fa-list', label: 'List' },
      PRODUCT_CARD: { cls: 'fa-light fa-bag-shopping', label: 'Product' },
      BLOG_CARD: { cls: 'fa-light fa-newspaper', label: 'Blog' },
    };

    return map[t] ?? { cls: 'fa-light fa-puzzle-piece', label: t || 'Unknown' };
  }
}
