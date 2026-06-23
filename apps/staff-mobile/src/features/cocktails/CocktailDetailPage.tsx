import type { CocktailDetail } from '@cocktail/shared-types';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { InlineError } from '../../components/InlineError';
import { fetchAppCocktailDetail } from '../../services/cocktails';

function recipeAmount(amount?: number | null, unit?: string | null) {
  if (typeof amount === 'number' && unit) {
    return `${amount}${unit}`;
  }

  if (typeof amount === 'number') {
    return String(amount);
  }

  return unit ?? '适量';
}

export function CocktailDetailPage() {
  const params = useParams();
  const location = useLocation();
  const [detail, setDetail] = useState<CocktailDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const cocktailId = Number(params.id);
  const isValidCocktailId = Number.isInteger(cocktailId) && cocktailId > 0;
  const backSearch =
    typeof location.state === 'object' &&
    location.state &&
    'fromSearch' in location.state &&
    typeof location.state.fromSearch === 'string'
      ? location.state.fromSearch
      : '/tasks/order';

  useEffect(() => {
    let isCancelled = false;

    if (!isValidCocktailId) {
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    fetchAppCocktailDetail(cocktailId)
      .then((result) => {
        if (!isCancelled) {
          setDetail(result);
        }
      })
      .catch((requestError: Error) => {
        if (!isCancelled) {
          setError(requestError.message || '配方详情加载失败');
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
  }, [cocktailId, isValidCocktailId, retryToken]);

  if (!isValidCocktailId) {
    return (
      <EmptyState
        title="没有找到这杯酒"
        description="链接可能已经失效，先回到点单页继续查看。"
        action={
          <Link className="status-link is-secondary" to="/tasks/order">
            回到点单页
          </Link>
        }
      />
    );
  }

  if (error) {
    return <InlineError message={error} onRetry={() => setRetryToken((value) => value + 1)} />;
  }

  if (isLoading || !detail) {
    return (
      <section className="detail-panel">
        <div className="detail-skeleton">
          <div className="detail-skeleton-copy">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="detail-panel">
      <div className="detail-toolbar detail-toolbar-end">
        <Link className="back-link" to={backSearch}>
          返回上一页
        </Link>
      </div>

      <div className="detail-layout">
        <section className="detail-section">
          <div className="detail-section-header">
            <p className="app-eyebrow">Recipe</p>
            <h2>{detail.nameZh}</h2>
          </div>
          <ol className="recipe-list">
            {detail.recipeItems.map((item) => (
              <li className="recipe-item" key={item.id}>
                <div>
                  <strong>{item.ingredientName}</strong>
                  {item.note ? <p>{item.note}</p> : null}
                </div>
                <span>{recipeAmount(item.amount, item.unit)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="detail-section">
          <div className="detail-section-header">
            <p className="app-eyebrow">Method</p>
            <h2>制作与出杯</h2>
          </div>
          {detail.glassType ? (
            <div className="detail-copy-block">
              <p>{detail.glassType}</p>
            </div>
          ) : null}
          {detail.method ? (
            <div className="detail-copy-block">
              <p>{detail.method}</p>
            </div>
          ) : null}
          {detail.garnish ? (
            <div className="detail-copy-block">
              <p>{detail.garnish}</p>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
