import type { Dispatch, SetStateAction } from 'react';
import type { CocktailFormState } from '../types';
import { generateSlug } from '../utils';

interface CocktailBasicsSectionProps {
  form: CocktailFormState;
  setForm: Dispatch<SetStateAction<CocktailFormState>>;
}

export function CocktailBasicsSection({
  form,
  setForm,
}: CocktailBasicsSectionProps) {
  return (
    <section className="cocktail-editor-section">
      <div className="section-heading">
        <p className="eyebrow">Basics</p>
        <h3>基础信息</h3>
        <p>先录入名称、价格和展示文案，方便前台菜单与详情页直接复用。</p>
      </div>
      <div className="cocktail-form-grid">
        <label>
          中文名
          <input
            required
            value={form.nameZh}
            onChange={(event) =>
              setForm((current) => ({ ...current, nameZh: event.target.value }))
            }
          />
        </label>
        <label>
          英文名
          <input
            value={form.nameEn}
            onChange={(event) =>
              setForm((current) => ({ ...current, nameEn: event.target.value }))
            }
          />
        </label>
        <label>
          Slug
          <div className="inline-input-row">
            <input
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: event.target.value }))
              }
            />
            <button
              className="ghost-outline-button"
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  slug: generateSlug(
                    current.slug || current.nameZh || current.nameEn,
                  ),
                }))
              }
            >
              生成
            </button>
          </div>
        </label>
        <label>
          价格
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({ ...current, price: event.target.value }))
            }
          />
        </label>
        <label>
          基酒类型
          <input
            value={form.baseSpirit}
            onChange={(event) =>
              setForm((current) => ({ ...current, baseSpirit: event.target.value }))
            }
          />
        </label>
        <label className="span-2">
          简短描述
          <textarea
            rows={3}
            value={form.shortDescription}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                shortDescription: event.target.value,
              }))
            }
          />
        </label>
        <label className="span-2">
          详情描述
          <textarea
            rows={6}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
        </label>
        <label>
          发布状态
          <select
            value={form.publishStatus}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                publishStatus: event.target.value as CocktailFormState['publishStatus'],
              }))
            }
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="hidden">hidden</option>
          </select>
        </label>
        <label>
          排序
          <input
            type="number"
            value={form.sortOrder}
            onChange={(event) =>
              setForm((current) => ({ ...current, sortOrder: event.target.value }))
            }
          />
        </label>
        <label>
          酒精感受
          <input
            value={form.abvNote}
            onChange={(event) =>
              setForm((current) => ({ ...current, abvNote: event.target.value }))
            }
          />
        </label>
        <label>
          杯型
          <input
            value={form.glassType}
            onChange={(event) =>
              setForm((current) => ({ ...current, glassType: event.target.value }))
            }
          />
        </label>
        <label>
          风味文本
          <input
            value={form.tasteProfile}
            onChange={(event) =>
              setForm((current) => ({ ...current, tasteProfile: event.target.value }))
            }
          />
        </label>
        <label>
          装饰
          <input
            value={form.garnish}
            onChange={(event) =>
              setForm((current) => ({ ...current, garnish: event.target.value }))
            }
          />
        </label>
        <label className="span-2">
          做法说明
          <textarea
            rows={4}
            value={form.method}
            onChange={(event) =>
              setForm((current) => ({ ...current, method: event.target.value }))
            }
          />
        </label>
        <label className="span-2">
          场景 / 推荐时机
          <textarea
            rows={3}
            value={form.scene}
            onChange={(event) =>
              setForm((current) => ({ ...current, scene: event.target.value }))
            }
          />
        </label>
        <label className="toggle-field span-2">
          <input
            checked={form.isVisible}
            type="checkbox"
            onChange={(event) =>
              setForm((current) => ({ ...current, isVisible: event.target.checked }))
            }
          />
          <span>
            <strong>前台可见</strong>
            <small>关闭后不会出现在公开前台，即使这杯酒已经发布。</small>
          </span>
        </label>
      </div>
    </section>
  );
}
