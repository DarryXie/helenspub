import type { Dispatch, SetStateAction } from 'react';
import type { CocktailFormState, CocktailOption } from '../types';

interface CocktailTaxonomySectionProps {
  categories: CocktailOption[];
  tags: CocktailOption[];
  form: CocktailFormState;
  setForm: Dispatch<SetStateAction<CocktailFormState>>;
}

export function CocktailTaxonomySection({
  categories,
  tags,
  form,
  setForm,
}: CocktailTaxonomySectionProps) {
  return (
    <section className="cocktail-editor-section">
      <div className="section-heading">
        <p className="eyebrow">Taxonomy</p>
        <h3>分类与标签</h3>
        <p>分类决定菜单归属，标签用于风味和筛选。这里的选择会直接影响前台展示。</p>
      </div>
      <div className="editor-stack">
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
                  <small>{category.slug || '未设置 slug'}</small>
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
                  <small>{tag.color || '默认色'}</small>
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
