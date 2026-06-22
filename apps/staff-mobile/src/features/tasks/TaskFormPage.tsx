import type { CocktailDetail, CocktailListItem, ProductionTaskDetail } from '@cocktail/shared-types';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { InlineError } from '../../components/InlineError';
import { fetchAppCocktailDetail, fetchAppCocktails } from '../../services/cocktails';
import {
  createProductionTask,
  fetchProductionTaskDetail,
  updateProductionTask,
} from '../../services/production-tasks';

const SEARCH_PAGE_SIZE = 8;

function recipeAmount(amount?: number | null, unit?: string | null) {
  if (typeof amount === 'number' && unit) {
    return `${amount}${unit}`;
  }

  if (typeof amount === 'number') {
    return String(amount);
  }

  return unit ?? '适量';
}

function priorityDescription(priority: number) {
  if (priority === 1) {
    return '优先处理';
  }

  if (priority === 2) {
    return '尽快安排';
  }

  return '按正常节奏';
}

export function TaskFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [selectedCocktail, setSelectedCocktail] = useState<CocktailDetail | null>(null);
  const [taskDetail, setTaskDetail] = useState<ProductionTaskDetail | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState(3);
  const [remark, setRemark] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searchResult, setSearchResult] = useState<CocktailListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const taskId = Number(params.id);
  const selectedCocktailId =
    mode === 'create'
      ? Number(searchParams.get('cocktailId') ?? selectedCocktail?.id ?? 0)
      : taskDetail?.cocktailId ?? selectedCocktail?.id ?? 0;

  useEffect(() => {
    let isCancelled = false;

    if (mode !== 'edit') {
      return undefined;
    }

    if (!Number.isInteger(taskId) || taskId <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      setError('任务编号无效。');
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    fetchProductionTaskDetail(taskId)
      .then((result) => {
        if (isCancelled) {
          return;
        }

        setTaskDetail(result);
        setQuantity(result.quantity);
        setPriority(result.priority);
        setRemark(result.remark ?? '');

        if (result.status === 'completed') {
          setError('已完成任务不允许编辑，请返回详情页查看。');
        }
      })
      .catch((requestError: Error) => {
        if (!isCancelled) {
          setError(requestError.message || '任务加载失败。');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [mode, taskId]);

  useEffect(() => {
    let isCancelled = false;

    if (!selectedCocktailId || Number.isNaN(selectedCocktailId)) {
      return undefined;
    }

    fetchAppCocktailDetail(selectedCocktailId)
      .then((result) => {
        if (!isCancelled) {
          setSelectedCocktail(result);
        }
      })
      .catch((requestError: Error) => {
        if (!isCancelled) {
          setError(requestError.message || '鸡尾酒详情加载失败。');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedCocktailId]);

  useEffect(() => {
    let isCancelled = false;

    if (mode !== 'create') {
      return undefined;
    }

    if (!searchValue.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResult([]);
      setSearchError(null);
      return undefined;
    }

    setIsSearching(true);
    setSearchError(null);

    const timer = window.setTimeout(() => {
      fetchAppCocktails({
        page: 1,
        pageSize: SEARCH_PAGE_SIZE,
        keyword: searchValue.trim(),
      })
        .then((result) => {
          if (!isCancelled) {
            setSearchResult(result.list);
          }
        })
        .catch((requestError: Error) => {
          if (!isCancelled) {
            setSearchError(requestError.message || '鸡尾酒搜索失败。');
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsSearching(false);
          }
        });
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [mode, searchValue]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === 'create' && !selectedCocktailId) {
      setError('请先选择要加入待制作的鸡尾酒。');
      return;
    }

    if (mode === 'edit' && taskDetail?.status === 'completed') {
      setError('已完成任务不能编辑。');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (mode === 'create') {
        const createdTask = await createProductionTask({
          cocktailId: selectedCocktailId,
          quantity,
          priority,
          remark: remark.trim() || undefined,
        });

        navigate('/tasks', {
          replace: true,
          state: { highlightTaskId: createdTask.id },
        });
        return;
      }

      if (!taskDetail) {
        return;
      }

      const updatedTask = await updateProductionTask(taskDetail.id, {
        quantity,
        priority,
        remark: remark.trim() || undefined,
      });

      navigate(`/tasks/${updatedTask.id}`, { replace: true });
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError('保存失败，请稍后重试。');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page-stack">
      <div className="detail-toolbar">
        <button className="back-link" onClick={() => navigate(-1)} type="button">
          返回上一页
        </button>
        {mode === 'edit' && taskDetail ? (
          <Link className="ghost-button is-solid" to={`/tasks/${taskDetail.id}`}>
            回到任务详情
          </Link>
        ) : (
          <Link className="ghost-button is-solid" to="/cocktails">
            去酒单里选酒
          </Link>
        )}
      </div>

      {error ? <InlineError message={error} /> : null}

      {isLoading ? (
        <section className="content-card">
          <span className="skeleton-line short" />
          <span className="skeleton-line long" />
          <span className="skeleton-line medium" />
        </section>
      ) : (
        <div className="form-layout">
          <section className="content-card">
            <div className="section-heading">
              <p className="app-eyebrow">{mode === 'create' ? 'Create Task' : 'Edit Task'}</p>
              <h2>{mode === 'create' ? '新增待制作任务' : '编辑待制作任务'}</h2>
            </div>

            <form className="editorial-form" onSubmit={handleSubmit}>
              {mode === 'create' ? (
                <div className="field-group">
                  <label className="field">
                    <span>搜索鸡尾酒</span>
                    <input
                      aria-label="搜索鸡尾酒"
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder="输入中文名或英文名，快速找到要加单的那一杯"
                      type="search"
                      value={searchValue}
                    />
                  </label>

                  {searchError ? <InlineError message={searchError} /> : null}
                  {isSearching ? <p className="muted-copy">正在检索鸡尾酒...</p> : null}

                  {searchResult.length > 0 ? (
                    <div className="selection-list">
                      {searchResult.map((item) => (
                        <button
                          className={`selection-item${selectedCocktailId === item.id ? ' is-active' : ''}`}
                          key={item.id}
                          onClick={() =>
                            setSelectedCocktail({
                              ...(selectedCocktail ?? {
                                categories: [],
                                recipeItems: [],
                                imageUrls: [],
                                description: '',
                                garnish: '',
                                method: '',
                                scene: '',
                                glassType: '',
                                abvNote: '',
                              }),
                              ...item,
                              id: item.id,
                            } as CocktailDetail)
                          }
                          type="button"
                        >
                          <strong>{item.nameZh}</strong>
                          <span>{item.shortDescription || item.tasteProfile || '点击选择这杯酒'}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <label className="field">
                <span>数量</span>
                <input
                  min={1}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  required
                  type="number"
                  value={quantity}
                />
              </label>

              <label className="field">
                <span>优先级</span>
                <select onChange={(event) => setPriority(Number(event.target.value))} value={priority}>
                  <option value={1}>1 - 优先处理</option>
                  <option value={2}>2 - 尽快安排</option>
                  <option value={3}>3 - 正常节奏</option>
                </select>
              </label>

              <label className="field">
                <span>备注</span>
                <textarea
                  onChange={(event) => setRemark(event.target.value)}
                  placeholder="例如 少冰、先出这一杯、与某桌其他酒同批次出杯"
                  rows={4}
                  value={remark}
                />
              </label>

              <button className="primary-button" disabled={isSaving} type="submit">
                {isSaving ? '保存中...' : mode === 'create' ? '创建待制作任务' : '保存任务修改'}
              </button>
            </form>
          </section>

          <section className="content-card">
            <div className="section-heading">
              <p className="app-eyebrow">Selected Cocktail</p>
              <h3>{selectedCocktail ? selectedCocktail.nameZh : '先选择一杯酒'}</h3>
            </div>
            {selectedCocktail ? (
              <>
                {selectedCocktail.shortDescription ? (
                  <p className="body-copy">{selectedCocktail.shortDescription}</p>
                ) : null}
                <div className="pill-row">
                  {selectedCocktail.categories.map((category) => (
                    <span className="soft-pill" key={category.id}>
                      {category.name}
                    </span>
                  ))}
                  {selectedCocktail.tags.map((tag) => (
                    <span className="soft-pill is-tag" key={tag.id}>
                      {tag.name}
                    </span>
                  ))}
                </div>
                <ol className="recipe-list">
                  {selectedCocktail.recipeItems.map((item) => (
                    <li className="recipe-item" key={item.id}>
                      <div>
                        <strong>{item.ingredientName}</strong>
                        {item.note ? <p>{item.note}</p> : null}
                      </div>
                      <span>{recipeAmount(item.amount, item.unit)}</span>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="muted-copy">
                从上面的搜索结果里点选鸡尾酒，或者先去鸡尾酒页查看详情，再从详情页直接“加入待制作”。
              </p>
            )}
            <div className="priority-note">
              <strong>当前优先级</strong>
              <span>{priorityDescription(priority)}</span>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
