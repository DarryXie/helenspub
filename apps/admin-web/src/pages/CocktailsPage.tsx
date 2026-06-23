import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCocktailPublishStatusLabel,
  type CocktailPublishStatus,
} from '../features/cocktails/status';
import { updateCocktail } from '../features/cocktails/services';
import { moveItemById, persistSequentialSort } from '../features/sorting/utils';
import { apiRequest } from '../services/http';

interface CocktailItem {
  id: number;
  nameZh: string;
  price?: number | null;
  publishStatus: CocktailPublishStatus;
  isVisible: boolean;
}

function formatPrice(price?: number | null) {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return '-';
  }

  return `¥${price.toFixed(2)}`;
}

export function CocktailsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CocktailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest<{ list: CocktailItem[] }>('/admin/cocktails');
      setItems(data.list);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载列表失败');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDrop(targetId: number) {
    if (draggedId === null || draggedId === targetId || reordering) {
      resetDragState();
      return;
    }

    const previousItems = items;
    const nextItems = moveItemById(items, (item) => item.id, draggedId, targetId);
    if (nextItems === items) {
      resetDragState();
      return;
    }

    setItems(nextItems);
    setReordering(true);
    setError('');
    resetDragState();

    try {
      await persistSequentialSort(nextItems, (item) => item.id, (id, sortOrder) =>
        updateCocktail(id, { sortOrder }),
      );
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : '保存排序失败';
      setItems(previousItems);

      try {
        await persistSequentialSort(previousItems, (item) => item.id, (id, sortOrder) =>
          updateCocktail(id, { sortOrder }),
        );
      } catch {
        // Best-effort rollback; reload below to reflect the latest persisted state.
      }

      await loadItems();
      setError(message);
    } finally {
      setReordering(false);
    }
  }

  function resetDragState() {
    setDraggedId(null);
    setDropTargetId(null);
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Content</p>
          <h2>鸡尾酒管理</h2>
        </div>
        <button
          className="primary-button"
          disabled={reordering}
          onClick={() => navigate('/cocktails/create')}
          type="button"
        >
          新增鸡尾酒
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
                <th aria-hidden="true" className="drag-handle-col" />
                <th>中文名</th>
                <th>价格</th>
                <th>发布状态</th>
                <th>显示</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isDragging = draggedId === item.id;
                const isDropTarget = dropTargetId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`sortable-row${isDragging ? ' is-dragging' : ''}${isDropTarget ? ' is-drop-target' : ''}`}
                    onDragEnter={() => {
                      if (draggedId !== null && draggedId !== item.id) {
                        setDropTargetId(item.id);
                      }
                    }}
                    onDragOver={(event) => {
                      if (draggedId !== null && draggedId !== item.id) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        setDropTargetId(item.id);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      void handleDrop(item.id);
                    }}
                  >
                    <td className="drag-handle-cell">
                      <button
                        aria-label="拖动排序"
                        className="drag-handle-button"
                        disabled={reordering}
                        draggable={!reordering}
                        type="button"
                        onDragEnd={resetDragState}
                        onDragStart={(event) => {
                          setDraggedId(item.id);
                          setDropTargetId(item.id);
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('text/plain', String(item.id));
                        }}
                      >
                        ::
                      </button>
                    </td>
                    <td>{item.nameZh}</td>
                    <td>{formatPrice(item.price)}</td>
                    <td>{getCocktailPublishStatusLabel(item.publishStatus)}</td>
                    <td>{item.isVisible ? '是' : '否'}</td>
                    <td className="actions-cell">
                      <button
                        className="inline-button"
                        disabled={reordering}
                        onClick={() => navigate(`/cocktails/${item.id}/edit`)}
                        type="button"
                      >
                        编辑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
