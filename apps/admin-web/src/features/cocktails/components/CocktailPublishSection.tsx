import type { Dispatch, SetStateAction } from 'react';
import {
  COCKTAIL_PUBLISH_STATUS_LABELS,
  type CocktailPublishStatus,
} from '../status';
import type { CocktailFormState } from '../types';

interface CocktailPublishSectionProps {
  form: CocktailFormState;
  setForm: Dispatch<SetStateAction<CocktailFormState>>;
}

export function CocktailPublishSection({
  form,
  setForm,
}: CocktailPublishSectionProps) {
  return (
    <section className="cocktail-editor-section">
      <div className="section-heading">
        <p className="eyebrow">Publish</p>
        <h3>发布配置</h3>
        <p>这里管理 SKU 的状态、排序以及是否在前台可见。</p>
      </div>
      <div className="cocktail-form-grid">
        <label>
          发布状态
          <select
            value={form.publishStatus}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                publishStatus: event.target.value as CocktailPublishStatus,
              }))
            }
          >
            {Object.entries(COCKTAIL_PUBLISH_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
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
        <label className="toggle-field span-2">
          <input
            checked={form.isVisible}
            type="checkbox"
            onChange={(event) =>
              setForm((current) => ({ ...current, isVisible: event.target.checked }))
            }
          />
          <span>
            <strong>前台是否可见</strong>
            <small>关闭后不会出现在公开前台，即使这杯鸡尾酒已经发布。</small>
          </span>
        </label>
      </div>
    </section>
  );
}
