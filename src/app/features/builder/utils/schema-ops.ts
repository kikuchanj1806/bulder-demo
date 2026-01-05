import { PageSchema } from '../mocks/home.schema.mock';

export function cloneSchema(schema: PageSchema): PageSchema {
  return structuredClone(schema);
}

// move/insert/remove sẽ làm ở phase drag-drop, giờ chỉ tạo khung
