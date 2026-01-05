import { PageSchema } from '../mocks/home.schema.mock';

export function buildParentMap(schema: PageSchema): Record<string, string | null> {
  const parent: Record<string, string | null> = {};
  Object.values(schema.nodes).forEach((n) => {
    n.children?.forEach((cid) => (parent[cid] = n.id));
    if (!(n.id in parent)) parent[n.id] = parent[n.id] ?? null;
  });
  return parent;
}

export function validateSchema(schema: PageSchema): string[] {
  const errs: string[] = [];
  const roots = [schema.zones.header.rootId, schema.zones.body.rootId, schema.zones.footer.rootId];
  roots.forEach((rid) => {
    if (!schema.nodes[rid]) errs.push(`Missing root node: ${rid}`);
  });
  return errs;
}
