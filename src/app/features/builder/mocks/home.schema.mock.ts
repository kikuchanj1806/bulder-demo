export type EditorMode = 'mobile' | 'desktop';

export type NodeType =
  | 'BLOCK'
  | 'TEXT'
  | 'IMAGE'
  | 'GRID'
  | 'LIST'
  | 'PRODUCT_CARD'
  | 'BLOG_CARD';

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type Background =
  | { type: 'COLOR'; value: string }
  | { type: 'IMAGE'; value: string };

export interface NodePropsBase {
  // layout
  direction?: 'ROW' | 'COLUMN';
  gap?: number;
  align?: 'START' | 'CENTER' | 'END' | 'STRETCH';
  justify?: 'START' | 'CENTER' | 'END' | 'SPACE_BETWEEN';

  // box
  padding?: EdgeInsets;
  margin?: EdgeInsets;
  radius?: number;

  // visual
  background?: Background;

  // common
  isVisible?: boolean;

  // TEXT
  content?: string;
  fontSize?: number;
  fontWeight?: number;

  // IMAGE
  imageUrl?: string;
  ratio?: string;

  // GRID/LIST
  columns?: number;

  // card samples
  title?: string;
  price?: string;
}

export interface ResponsiveProps {
  base: NodePropsBase;
  overrides?: Partial<Record<EditorMode, Partial<NodePropsBase>>>;
}

export interface SchemaNode {
  id: string;
  type: NodeType;
  children: string[];
  props: ResponsiveProps;
}

export interface PageZones {
  header: { rootId: string };
  body: { rootId: string };
  footer: { rootId: string };
}

export interface DesignTokens {
  primaryColor: string;
  textColor: string;
  bgColor: string;
  cardRadius: number;
  fontScale: Record<EditorMode, number>;
}

export interface PageSchema {
  pageId: string;
  name: string;
  modeSupport: EditorMode[];
  designTokens: DesignTokens;
  zones: PageZones;
  nodes: Record<string, SchemaNode>;
}

/**
 * Mock schema for Home page
 */
export const HOME_PAGE_SCHEMA_MOCK: PageSchema = {
  pageId: 'home',
  name: 'Home page',
  modeSupport: ['mobile', 'desktop'],
  designTokens: {
    primaryColor: '#0d6efd',
    textColor: '#212529',
    bgColor: '#f8f9fa',
    cardRadius: 12,
    fontScale: {
      mobile: 1,
      desktop: 1.05,
    },
  },
  zones: {
    header: {rootId: 'n_header_root'},
    body: {rootId: 'n_body_root'},
    footer: {rootId: 'n_footer_root'},
  },
  nodes: {
    n_header_root: {
      id: 'n_header_root',
      type: 'BLOCK',
      children: ['n_header_bar'],
      props: {
        base: {
          direction: 'ROW',
          padding: {top: 12, right: 16, bottom: 12, left: 16},
          gap: 12,
          align: 'CENTER',
          justify: 'SPACE_BETWEEN',
          background: {type: 'COLOR', value: '#ffffff'},
        },
        overrides: {
          desktop: {
            padding: {top: 16, right: 24, bottom: 16, left: 24},
          },
        },
      },
    },

    n_header_bar: {
      id: 'n_header_bar',
      type: 'BLOCK',
      children: ['n_logo', 'n_nav'],
      props: {
        base: {direction: 'ROW', gap: 12, align: 'CENTER', justify: 'SPACE_BETWEEN'},
      },
    },

    n_logo: {
      id: 'n_logo',
      type: 'TEXT',
      children: [],
      props: {
        base: {content: 'MyShop', fontSize: 18, fontWeight: 700},
        overrides: {desktop: {fontSize: 20}},
      },
    },

    n_nav: {
      id: 'n_nav',
      type: 'BLOCK',
      children: ['n_nav_home', 'n_nav_products', 'n_nav_blog'],
      props: {
        base: {direction: 'ROW', gap: 10, align: 'CENTER'},
        overrides: {
          mobile: {isVisible: false},
          desktop: {isVisible: true},
        },
      },
    },
    n_nav_home: {id: 'n_nav_home', type: 'TEXT', children: [], props: {base: {content: 'Home', fontSize: 14}}},
    n_nav_products: {
      id: 'n_nav_products',
      type: 'TEXT',
      children: [],
      props: {base: {content: 'Products', fontSize: 14}}
    },
    n_nav_blog: {id: 'n_nav_blog', type: 'TEXT', children: [], props: {base: {content: 'Blog', fontSize: 14}}},

    n_body_root: {
      id: 'n_body_root',
      type: 'BLOCK',
      children: ['n_hero', 'n_featured_title_row', 'n_featured_grid', 'n_blog_title_row', 'n_blog_list'],
      props: {
        base: {
          direction: 'COLUMN',
          gap: 16,
          padding: {top: 16, right: 16, bottom: 24, left: 16},
          background: {type: 'COLOR', value: '#f8f9fa'},
        },
        overrides: {
          desktop: {
            padding: {top: 24, right: 80, bottom: 40, left: 80},
            gap: 20,
          },
        },
      },
    },

    n_hero: {
      id: 'n_hero',
      type: 'BLOCK',
      children: ['n_hero_img', 'n_hero_text'],
      props: {
        base: {
          direction: 'COLUMN',
          gap: 12,
          padding: {top: 12, right: 12, bottom: 12, left: 12},
          radius: 12,
          background: {type: 'IMAGE', value: 'https://picsum.photos/1200/600?random=12'},
        },
        overrides: {
          desktop: {
            direction: 'ROW',
            padding: {top: 18, right: 18, bottom: 18, left: 18},
          },
        },
      },
    },
    n_hero_img: {
      id: 'n_hero_img',
      type: 'IMAGE',
      children: [],
      props: {
        base: {imageUrl: 'https://picsum.photos/800/400?random=21', ratio: '16:9', radius: 12},
        overrides: {desktop: {ratio: '4:3'}},
      },
    },
    n_hero_text: {
      id: 'n_hero_text',
      type: 'BLOCK',
      children: ['n_hero_title', 'n_hero_desc'],
      props: {base: {direction: 'COLUMN', gap: 6, padding: {top: 6, right: 6, bottom: 6, left: 6}}},
    },
    n_hero_title: {
      id: 'n_hero_title',
      type: 'TEXT',
      children: [],
      props: {base: {content: 'New season sale', fontSize: 22, fontWeight: 700}}
    },
    n_hero_desc: {
      id: 'n_hero_desc',
      type: 'TEXT',
      children: [],
      props: {base: {content: 'Up to 50% off selected items.', fontSize: 14}}
    },

    n_featured_title_row: {
      id: 'n_featured_title_row',
      type: 'BLOCK',
      children: ['n_featured_title', 'n_featured_more'],
      props: {base: {direction: 'ROW', justify: 'SPACE_BETWEEN', align: 'CENTER', gap: 10}},
    },
    n_featured_title: {
      id: 'n_featured_title',
      type: 'TEXT',
      children: [],
      props: {base: {content: 'Featured products', fontSize: 18, fontWeight: 700}}
    },
    n_featured_more: {
      id: 'n_featured_more',
      type: 'TEXT',
      children: [],
      props: {base: {content: 'See more', fontSize: 12}}
    },

    n_featured_grid: {
      id: 'n_featured_grid',
      type: 'GRID',
      children: ['n_p1', 'n_p2', 'n_p3', 'n_p4'],
      props: {base: {columns: 2, gap: 12}, overrides: {desktop: {columns: 4, gap: 16}}},
    },
    n_p1: {
      id: 'n_p1',
      type: 'PRODUCT_CARD',
      children: [],
      props: {base: {title: 'Product 1', imageUrl: 'https://picsum.photos/400/300?random=1', price: '199.000đ'}}
    },
    n_p2: {
      id: 'n_p2',
      type: 'PRODUCT_CARD',
      children: [],
      props: {base: {title: 'Product 2', imageUrl: 'https://picsum.photos/400/300?random=2', price: '259.000đ'}}
    },
    n_p3: {
      id: 'n_p3',
      type: 'PRODUCT_CARD',
      children: [],
      props: {base: {title: 'Product 3', imageUrl: 'https://picsum.photos/400/300?random=3', price: '149.000đ'}}
    },
    n_p4: {
      id: 'n_p4',
      type: 'PRODUCT_CARD',
      children: [],
      props: {base: {title: 'Product 4', imageUrl: 'https://picsum.photos/400/300?random=4', price: '329.000đ'}}
    },

    n_blog_title_row: {
      id: 'n_blog_title_row',
      type: 'BLOCK',
      children: ['n_blog_title'],
      props: {base: {direction: 'ROW', align: 'CENTER'}}
    },
    n_blog_title: {
      id: 'n_blog_title',
      type: 'TEXT',
      children: [],
      props: {base: {content: 'Latest posts', fontSize: 18, fontWeight: 700}}
    },

    n_blog_list: {id: 'n_blog_list', type: 'LIST', children: ['n_b1', 'n_b2', 'n_b3'], props: {base: {gap: 12}}},
    n_b1: {
      id: 'n_b1',
      type: 'BLOG_CARD',
      children: [],
      props: {base: {title: 'Post 1', imageUrl: 'https://picsum.photos/600/400?random=31'}}
    },
    n_b2: {
      id: 'n_b2',
      type: 'BLOG_CARD',
      children: [],
      props: {base: {title: 'Post 2', imageUrl: 'https://picsum.photos/600/400?random=32'}}
    },
    n_b3: {
      id: 'n_b3',
      type: 'BLOG_CARD',
      children: [],
      props: {base: {title: 'Post 3', imageUrl: 'https://picsum.photos/600/400?random=33'}}
    },

    n_footer_root: {
      id: 'n_footer_root',
      type: 'BLOCK',
      children: ['n_footer_text'],
      props: {
        base: {
          direction: 'COLUMN',
          padding: {top: 16, right: 16, bottom: 16, left: 16},
          background: {type: 'COLOR', value: '#ffffff'},
        },
      },
    },
    n_footer_text: {
      id: 'n_footer_text',
      type: 'TEXT',
      children: [],
      props: {base: {content: '© 2026 MyShop', fontSize: 12}}
    }
  },
};
