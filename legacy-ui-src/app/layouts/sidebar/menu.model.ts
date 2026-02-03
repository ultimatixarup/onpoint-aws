export interface MenuItem {
    id: number;
    label: string;
    icon?: string;             // keep original icon support (like 'bx-car')
    iconPath?: string;         // add this line to support image-based icons
    link?: string;
    parentId?: number;
    isTitle?: boolean;
    isLayout?: boolean;
    badge?: {
      variant: string;
      text: string;
    };
    subItems?: MenuItem[];
  }
