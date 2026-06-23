import type { Dispatch, SetStateAction } from 'react';
import type { CocktailFormState, CocktailOption } from '../types';

interface CocktailBasicsSectionProps {
  categories: CocktailOption[];
  tags: CocktailOption[];
  form: CocktailFormState;
  setForm: Dispatch<SetStateAction<CocktailFormState>>;
}

export function CocktailBasicsSection({
  categories,
  tags,
  form,
  setForm,
}: CocktailBasicsSectionProps) {
  return (
    <section className="cocktail-editor-section">
      <div className="section-heading">
        <p className="eyebrow">Basics</p>
        <h3>基础信息</h3>
        <p>这里集中填写前台菜单和详情页需要展示的文案与标签信息。</p>
      </div>
      <div className="editor-stack">
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
            风味文本
            <input
              value={form.tasteProfile}
              onChange={(event) =>
                setForm((current) => ({ ...current, tasteProfile: event.target.value }))
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
          <label className="span-2">
            场景及推荐时机
            <textarea
              rows={3}
              value={form.scene}
              onChange={(event) =>
                setForm((current) => ({ ...current, scene: event.target.value }))
              }
            />
          </label>
        </div>
        <div>
          <div className="taxonomy-headline">
            <strong>分类</strong>
            <span>至少选择一个</span>
          </div>
          <div className="token-grid">
            {categories.map((category) => {
              const selected = form.categoryIds.includes(category.id);
              return (
                <button
                  key={category.id}
                  className={selected ? 'token-chip selected' : 'token-chip'}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      categoryIds: toggleNumber(current.categoryIds, category.id),
                    }))
                  }
                >
                  <span>{category.name}</span>
                  <small>{selected ? '已选择' : '点击选择'}</small>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="taxonomy-headline">
            <strong>标签</strong>
            <span>可多选</span>
          </div>
          <div className="token-grid">
            {tags.map((tag) => {
              const selected = form.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  className={selected ? 'token-chip selected' : 'token-chip'}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      tagIds: toggleNumber(current.tagIds, tag.id),
                    }))
                  }
                >
                  <span>{tag.name}</span>
                  <small>{selected ? '已选择' : tag.color || '点击选择'}</small>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function toggleNumber(current: number[], value: number) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}
