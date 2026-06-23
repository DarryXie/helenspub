export type ResourceKey = 'categories' | 'tags' | 'ingredients' | 'users';

export interface ResourceColumn {
  key: string;
  label: string;
}

export interface ResourceFieldOption {
  label: string;
  value: string;
}

export interface ResourceField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'email' | 'password';
  required?: boolean;
  placeholder?: string;
  options?: ResourceFieldOption[];
  hiddenOnEdit?: boolean;
}

export interface ResourceConfig {
  key: ResourceKey;
  title: string;
  subtitle: string;
  endpoint: string;
  paginated: boolean;
  sortable: boolean;
  columns: ResourceColumn[];
  fields: ResourceField[];
  createLabel: string;
}

export const resourceConfigs: Record<ResourceKey, ResourceConfig> = {
  categories: {
    key: 'categories',
    title: '分类管理',
    subtitle: '维护公开菜单和后台内容使用的鸡尾酒分类。',
    endpoint: '/admin/categories',
    paginated: false,
    sortable: true,
    createLabel: '新增分类',
    columns: [
      { key: 'name', label: '名称' },
      { key: 'slug', label: 'Slug' },
      { key: 'description', label: '描述' },
      { key: 'isEnabled', label: '启用' },
    ],
    fields: [
      { key: 'name', label: '名称', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text' },
      { key: 'description', label: '描述', type: 'textarea' },
      { key: 'isEnabled', label: '启用', type: 'checkbox' },
      { key: 'sortOrder', label: '排序', type: 'number' },
    ],
  },
  tags: {
    key: 'tags',
    title: '标签管理',
    subtitle: '维护鸡尾酒风味、特征和前台筛选标签。',
    endpoint: '/admin/tags',
    paginated: false,
    sortable: true,
    createLabel: '新增标签',
    columns: [
      { key: 'name', label: '名称' },
      { key: 'slug', label: 'Slug' },
      { key: 'color', label: '颜色' },
      { key: 'isEnabled', label: '启用' },
    ],
    fields: [
      { key: 'name', label: '名称', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text' },
      { key: 'color', label: '颜色', type: 'text', placeholder: '#38BDF8' },
      { key: 'isEnabled', label: '启用', type: 'checkbox' },
      { key: 'sortOrder', label: '排序', type: 'number' },
    ],
  },
  ingredients: {
    key: 'ingredients',
    title: '原料管理',
    subtitle: '维护配方可选原料及基础属性。',
    endpoint: '/admin/ingredients',
    paginated: false,
    sortable: true,
    createLabel: '新增原料',
    columns: [
      { key: 'name', label: '名称' },
      { key: 'category', label: '分类' },
      { key: 'abv', label: '酒精度' },
      { key: 'isEnabled', label: '启用' },
    ],
    fields: [
      { key: 'name', label: '名称', type: 'text', required: true },
      {
        key: 'category',
        label: '分类',
        type: 'text',
        required: true,
        placeholder: 'base_spirit / juice / syrup',
      },
      { key: 'description', label: '描述', type: 'textarea' },
      { key: 'abv', label: '酒精度', type: 'number' },
      { key: 'isEnabled', label: '启用', type: 'checkbox' },
      { key: 'sortOrder', label: '排序', type: 'number' },
    ],
  },
  users: {
    key: 'users',
    title: '用户管理',
    subtitle: '维护管理员与前台业务人员账号。',
    endpoint: '/admin/users',
    paginated: true,
    sortable: false,
    createLabel: '新增用户',
    columns: [
      { key: 'username', label: '用户名' },
      { key: 'displayName', label: '显示名称' },
      { key: 'role.name', label: '角色' },
      { key: 'status', label: '状态' },
      { key: 'lastLoginAt', label: '最后登录' },
    ],
    fields: [
      { key: 'username', label: '用户名', type: 'text', required: true },
      { key: 'password', label: '密码', type: 'password', required: true, hiddenOnEdit: true },
      { key: 'newPassword', label: '新密码', type: 'password' },
      { key: 'displayName', label: '显示名称', type: 'text', required: true },
      { key: 'phone', label: '手机号', type: 'text' },
      { key: 'email', label: '邮箱', type: 'email' },
      { key: 'roleId', label: '角色', type: 'select', required: true, options: [] },
      {
        key: 'status',
        label: '状态',
        type: 'select',
        required: true,
        options: [
          { label: '启用', value: 'active' },
          { label: '禁用', value: 'disabled' },
        ],
      },
    ],
  },
};
