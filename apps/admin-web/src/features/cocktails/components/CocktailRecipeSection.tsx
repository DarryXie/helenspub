import type { Dispatch, SetStateAction } from 'react';
import type { CocktailFormState, CocktailOption } from '../types';
import { createEmptyRecipeItem } from '../utils';

interface CocktailRecipeSectionProps {
  ingredients: CocktailOption[];
  form: CocktailFormState;
  setForm: Dispatch<SetStateAction<CocktailFormState>>;
}

export function CocktailRecipeSection({
  ingredients,
  form,
  setForm,
}: CocktailRecipeSectionProps) {
  return (
    <section className="cocktail-editor-section">
      <div className="section-heading">
        <p className="eyebrow">Recipe</p>
        <h3>配方明细</h3>
        <p>这里维护前台点单和制作时要用到的杯型、装饰、配方明细与做法说明。</p>
      </div>
      <div className="editor-stack">
        <div className="cocktail-form-grid">
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
            装饰
            <input
              value={form.garnish}
              onChange={(event) =>
                setForm((current) => ({ ...current, garnish: event.target.value }))
              }
            />
          </label>
        </div>
        {form.recipeItems.map((item, index) => (
          <div className="recipe-row" key={item.id}>
            <div className="recipe-row-head">
              <strong>第 {index + 1} 条</strong>
              <div className="recipe-row-actions">
                <button
                  className="ghost-outline-button"
                  disabled={index === 0}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      recipeItems: moveItem(current.recipeItems, index, index - 1),
                    }))
                  }
                >
                  上移
                </button>
                <button
                  className="ghost-outline-button"
                  disabled={index === form.recipeItems.length - 1}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      recipeItems: moveItem(current.recipeItems, index, index + 1),
                    }))
                  }
                >
                  下移
                </button>
                <button
                  className="inline-button danger"
                  disabled={form.recipeItems.length === 1}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      recipeItems:
                        current.recipeItems.length === 1
                          ? current.recipeItems
                          : current.recipeItems.filter((recipe) => recipe.id !== item.id),
                    }))
                  }
                >
                  删除
                </button>
              </div>
            </div>
            <div className="cocktail-form-grid">
              <label className="span-2">
                原料
                <select
                  required
                  value={item.ingredientId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      recipeItems: current.recipeItems.map((recipe) =>
                        recipe.id === item.id
                          ? { ...recipe, ingredientId: event.target.value }
                          : recipe,
                      ),
                    }))
                  }
                >
                  <option value="">请选择原料</option>
                  {ingredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                      {ingredient.category ? ` / ${ingredient.category}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                用量
                <input
                  type="number"
                  step="0.1"
                  value={item.amount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      recipeItems: current.recipeItems.map((recipe) =>
                        recipe.id === item.id ? { ...recipe, amount: event.target.value } : recipe,
                      ),
                    }))
                  }
                />
              </label>
              <label>
                单位
                <input
                  value={item.unit}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      recipeItems: current.recipeItems.map((recipe) =>
                        recipe.id === item.id ? { ...recipe, unit: event.target.value } : recipe,
                      ),
                    }))
                  }
                />
              </label>
              <label className="span-2">
                备注
                <textarea
                  rows={2}
                  value={item.note}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      recipeItems: current.recipeItems.map((recipe) =>
                        recipe.id === item.id ? { ...recipe, note: event.target.value } : recipe,
                      ),
                    }))
                  }
                />
              </label>
            </div>
          </div>
        ))}
        <button
          className="ghost-outline-button add-row-button"
          type="button"
          onClick={() =>
            setForm((current) => ({
              ...current,
              recipeItems: [...current.recipeItems, createEmptyRecipeItem()],
            }))
          }
        >
          新增一条配方
        </button>
        <div className="cocktail-form-grid">
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
        </div>
      </div>
    </section>
  );
}

function moveItem<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
