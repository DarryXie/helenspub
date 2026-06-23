import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  type ResourceConfig,
  type ResourceField,
  type ResourceKey,
  resourceConfigs,
} from '../features/resources/resource-config';
import { formatCellValue, getValueByPath, toInputValue } from '../features/resources/resource-utils';
import { moveItemById, persistSequentialSort } from '../features/sorting/utils';
import {
  createResourceItem,
  deleteResourceItem,
  fetchResourceItem,
  fetchResourceList,
  fetchRoles,
  updateResourceItem,
} from '../services/resources';

interface ResourceListPageProps {
  resource: ResourceKey;
  title: string;
}

type ResourceItem = Record<string, unknown>;

export function ResourceListPage({ resource, title }: ResourceListPageProps) {
  const config = useMemo<ResourceConfig>(() => resourceConfigs[resource], [resource]);
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [roleOptions, setRoleOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  useEffect(() => {
    void loadList();
  }, [resource]);

  useEffect(() => {
    if (resource !== 'users') {
      setRoleOptions([]);
      setRolesLoading(false);
      return;
    }

    setRolesLoading(true);
    fetchRoles()
      .then((roles) => {
        setRoleOptions(
          roles.map((role) => ({
            label: role.name,
            value: String(role.id),
          })),
        );
      })
      .catch(() => {
        setRoleOptions([]);
      })
      .finally(() => {
        setRolesLoading(false);
      });
  }, [resource]);

  useEffect(() => {
    if (
      resource === 'users' &&
      editorOpen &&
      editingId === null &&
      !formValues.roleId &&
      roleOptions.length > 0
    ) {
      setFormValues((current) => ({
        ...current,
        roleId: roleOptions[0].value,
      }));
    }
  }, [editingId, editorOpen, formValues.roleId, resource, roleOptions]);

  async function loadList() {
    setLoading(true);
    setError('');
    resetDragState();

    try {
      const list = await fetchResourceList(resource, config.paginated);
      setItems(list);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载失败');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function getFields() {
    return config.fields.map((field) => {
      if (field.key === 'roleId') {
        return {
          ...field,
          options: roleOptions,
        };
      }

      return field;
    });
  }

  function openCreateEditor() {
    if (reordering) {
      return;
    }

    setEditingId(null);
    setEditorOpen(true);
    setError('');
    setFormValues(buildInitialValues(resource, roleOptions));
  }

  async function openEditEditor(id: number) {
    if (reordering) {
      return;
    }

    setEditingId(id);
    setEditorOpen(true);
    setError('');

    try {
      const item = await fetchResourceItem(resource, id);
      setFormValues(mapItemToFormValues(resource, item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载详情失败');
    }
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(null);
    setFormValues({});
  }

  function updateFieldValue(field: ResourceField, value: unknown) {
    setFormValues((current) => ({
      ...current,
      [field.key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = buildPayload(resource, formValues, editingId !== null);

      if (editingId === null) {
        await createResourceItem(resource, payload);
      } else {
        await updateResourceItem(resource, editingId, payload);
      }

      closeEditor();
      await loadList();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (reordering) {
      return;
    }

    if (!window.confirm(resource === 'users' ? '确认禁用这个用户吗？' : '确认删除这条记录吗？')) {
      return;
    }

    setError('');

    try {
      await deleteResourceItem(resource, id);
      await loadList();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '删除失败');
    }
  }

  async function handleDrop(targetId: number) {
    if (!config.sortable || draggedId === null || draggedId === targetId || reordering) {
      resetDragState();
      return;
    }

    const previousItems = items;
    const nextItems = moveItemById(items, getResourceItemId, draggedId, targetId);
    if (nextItems === items) {
      resetDragState();
      return;
    }

    setItems(nextItems);
    setReordering(true);
    setError('');
    resetDragState();

    try {
      await persistSequentialSort(nextItems, getResourceItemId, (id, sortOrder) =>
        updateResourceItem(resource, id, { sortOrder }),
      );
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : '保存排序失败';
      setItems(previousItems);

      try {
        await persistSequentialSort(previousItems, getResourceItemId, (id, sortOrder) =>
          updateResourceItem(resource, id, { sortOrder }),
        );
      } catch {
        // Best-effort rollback; reload below to reflect the latest persisted state.
      }

      await loadList();
      setError(message);
    } finally {
      setReordering(false);
    }
  }

  function resetDragState() {
    setDraggedId(null);
    setDropTargetId(null);
  }

  const fields = getFields();
  const isCreateDisabled = (resource === 'users' && rolesLoading) || reordering;

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Master Data</p>
          <h2>{title}</h2>
          <p className="page-description">{config.subtitle}</p>
        </div>
        <button
          className="primary-button"
          disabled={isCreateDisabled}
          onClick={openCreateEditor}
          type="button"
        >
          {config.createLabel}
        </button>
      </header>
      {error ? <p className="error-text resource-error">{error}</p> : null}
      <div className="table-card">
        {loading ? (
          <p>加载中...</p>
        ) : (
          <table>
            <thead>
              <tr>
                {config.sortable ? <th className="drag-handle-col">排序</th> : null}
                {config.columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const id = getResourceItemId(item);
                const isDragging = draggedId === id;
                const isDropTarget = dropTargetId === id;

                return (
                  <tr
                    key={id}
                    className={`sortable-row${isDragging ? ' is-dragging' : ''}${isDropTarget ? ' is-drop-target' : ''}`}
                    onDragEnter={() => {
                      if (config.sortable && draggedId !== null && draggedId !== id) {
                        setDropTargetId(id);
                      }
                    }}
                    onDragOver={(event) => {
                      if (config.sortable && draggedId !== null && draggedId !== id) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        setDropTargetId(id);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      void handleDrop(id);
                    }}
                  >
                    {config.sortable ? (
                      <td className="drag-handle-cell">
                        <button
                          aria-label="拖动排序"
                          className="drag-handle-button"
                          disabled={reordering}
                          draggable={!reordering}
                          type="button"
                          onDragEnd={resetDragState}
                          onDragStart={(event) => {
                            setDraggedId(id);
                            setDropTargetId(id);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', String(id));
                          }}
                        >
                          ::
                        </button>
                      </td>
                    ) : null}
                    {config.columns.map((column) => (
                      <td key={column.key}>{formatCellValue(getValueByPath(item, column.key))}</td>
                    ))}
                    <td className="actions-cell">
                      <button
                        className="inline-button"
                        disabled={reordering}
                        onClick={() => void openEditEditor(id)}
                        type="button"
                      >
                        编辑
                      </button>
                      <button
                        className="inline-button danger"
                        disabled={reordering}
                        onClick={() => void handleDelete(id)}
                        type="button"
                      >
                        {resource === 'users' ? '禁用' : '删除'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {editorOpen ? (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Editor</p>
                <h3>{editingId === null ? config.createLabel : `编辑${config.title.replace('管理', '')}`}</h3>
              </div>
              <button className="ghost-outline-button" onClick={closeEditor} type="button">
                关闭
              </button>
            </div>
            <form className="resource-form-grid" onSubmit={handleSubmit}>
              {fields
                .filter((field) => !(editingId !== null && field.hiddenOnEdit))
                .map((field) => (
                  <label
                    className={field.type === 'textarea' ? 'field-span-full' : undefined}
                    key={field.key}
                  >
                    {field.label}
                    {renderField(field, formValues[field.key], updateFieldValue)}
                  </label>
                ))}
              <div className="form-actions field-span-full">
                <button className="ghost-outline-button" onClick={closeEditor} type="button">
                  取消
                </button>
                <button className="primary-button" disabled={saving} type="submit">
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function renderField(
  field: ResourceField,
  value: unknown,
  onChange: (field: ResourceField, value: unknown) => void,
) {
  if (field.type === 'checkbox') {
    return (
      <input
        checked={Boolean(value)}
        onChange={(event) => onChange(field, event.target.checked)}
        type="checkbox"
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        placeholder={field.placeholder}
        required={field.required}
        rows={4}
        value={String(toInputValue(value))}
        onChange={(event) => onChange(field, event.target.value)}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select
        required={field.required}
        value={String(toInputValue(value))}
        onChange={(event) => onChange(field, event.target.value)}
      >
        <option value="">请选择</option>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      placeholder={field.placeholder}
      required={field.required}
      type={field.type}
      value={String(toInputValue(value))}
      onChange={(event) => onChange(field, event.target.value)}
    />
  );
}

function buildInitialValues(
  resource: ResourceKey,
  roleOptions: Array<{ label: string; value: string }>,
) {
  if (resource === 'users') {
    return {
      username: '',
      password: '',
      newPassword: '',
      displayName: '',
      phone: '',
      email: '',
      roleId: roleOptions[0]?.value ?? '',
      status: 'active',
    };
  }

  return {
    name: '',
    slug: '',
    description: '',
    color: '',
    category: '',
    abv: '',
    isEnabled: true,
    sortOrder: 0,
  };
}

function mapItemToFormValues(resource: ResourceKey, item: Record<string, unknown>) {
  if (resource === 'users') {
    const role = (item.role as Record<string, unknown> | undefined) ?? {};

    return {
      username: toInputValue(item.username),
      newPassword: '',
      displayName: toInputValue(item.displayName),
      phone: toInputValue(item.phone),
      email: toInputValue(item.email),
      roleId: toInputValue(role.id),
      status: toInputValue(item.status || 'active'),
    };
  }

  return {
    name: toInputValue(item.name),
    slug: toInputValue(item.slug),
    description: toInputValue(item.description),
    color: toInputValue(item.color),
    category: toInputValue(item.category),
    abv: toInputValue(item.abv),
    isEnabled: item.isEnabled !== false,
    sortOrder: toInputValue(item.sortOrder ?? 0),
  };
}

function buildPayload(resource: ResourceKey, values: Record<string, unknown>, isEdit: boolean) {
  if (resource === 'users') {
    const payload: Record<string, unknown> = {
      username: toOptionalString(values.username),
      displayName: toOptionalString(values.displayName),
      phone: toOptionalString(values.phone),
      email: toOptionalString(values.email),
      roleId: Number(values.roleId),
      status: toOptionalString(values.status) || 'active',
    };

    if (!isEdit) {
      payload.password = toOptionalString(values.password);
    }

    if (isEdit && toOptionalString(values.newPassword)) {
      payload.password = toOptionalString(values.newPassword);
    }

    return payload;
  }

  const payload: Record<string, unknown> = {
    name: toOptionalString(values.name),
    slug: toOptionalString(values.slug),
    description: toOptionalString(values.description),
    isEnabled: Boolean(values.isEnabled),
    sortOrder: Number(values.sortOrder || 0),
  };

  if (resource === 'tags') {
    payload.color = toOptionalString(values.color);
  }

  if (resource === 'ingredients') {
    payload.category = toOptionalString(values.category);
    payload.abv = toOptionalNumber(values.abv);
  }

  return payload;
}

function getResourceItemId(item: ResourceItem) {
  return Number(item.id);
}

function toOptionalString(value: unknown) {
  const normalized = String(toInputValue(value)).trim();
  return normalized ? normalized : undefined;
}

function toOptionalNumber(value: unknown) {
  const normalized = String(toInputValue(value)).trim();

  if (!normalized) {
    return undefined;
  }

  return Number(normalized);
}
