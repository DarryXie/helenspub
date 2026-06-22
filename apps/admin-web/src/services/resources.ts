import type { ResourceKey } from '../features/resources/resource-config';
import { apiRequest } from './http';

export interface RoleOption {
  id: number;
  code: string;
  name: string;
}

export async function fetchResourceList(resource: ResourceKey, paginated: boolean) {
  const data = await apiRequest<Array<Record<string, unknown>> | { list: Array<Record<string, unknown>> }>(
    `/admin/${resource}`,
  );

  if (paginated) {
    return (data as { list: Array<Record<string, unknown>> }).list;
  }

  return data as Array<Record<string, unknown>>;
}

export async function fetchResourceItem(resource: ResourceKey, id: number) {
  return apiRequest<Record<string, unknown>>(`/admin/${resource}/${id}`);
}

export async function createResourceItem(resource: ResourceKey, payload: Record<string, unknown>) {
  return apiRequest(`/admin/${resource}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateResourceItem(
  resource: ResourceKey,
  id: number,
  payload: Record<string, unknown>,
) {
  return apiRequest(`/admin/${resource}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteResourceItem(resource: ResourceKey, id: number) {
  return apiRequest(`/admin/${resource}/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchRoles() {
  return apiRequest<RoleOption[]>('/admin/roles');
}
