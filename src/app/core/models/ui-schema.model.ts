export type UiNodeType = 'BLOCK' | 'TEXT' | 'IMAGE' | string;

export interface UiSchema {
  id?: number;
  name?: string;
  components: UiNode[];
}

export interface UiNode {
  id: number;
  type: UiNodeType;
  order?: number;
  parentId?: number | null;
  name?: string | null;
  config?: Record<string, any> | null;
  children?: UiNode[];
}
