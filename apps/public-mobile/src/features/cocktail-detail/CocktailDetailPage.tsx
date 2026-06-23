import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError, resolveApiAssetUrl } from '../../services/http';
import { fetchPublicCocktailDetail } from '../../services/public-menu';
import type { CocktailDetail } from '../../types/public-menu';

function formatPrice(price?: number | null) {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return '';
  }

  return `¥${price.toFixed(2)}`;
}

function uniqueImages(detail: CocktailDetail | null) {
  if (!detail) {
    return [];
  }

  return [
    ...new Set(
      [detail.coverImageUrl, ...detail.imageUrls].filter(
        (item): item is string => typeof item === 'string' && item.length > 0,
      ),
    ),
  ];
}

export function CocktailDetailPage() {
  const params = useParams();
  const location = useLocation();
  const [detail, setDetail] = useState<CocktailDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [activeImage, setActiveImage] = useState('');

  const cocktailId = Number(params.id);
  const hasValidCocktailId = Number.isInteger(cocktailId) && cocktailId > 0;
  const backSearch =
    typeof location.state === 'object' &&
    location.state &&
    'fromSearch' in location.state &&
    typeof location.state.fromSearch === 'string'
      ? location.state.fromSearch
      : '/';

  const galleryImages = useMemo(() => uniqueImages(detail), [detail]);
  const displayedImage =
    activeImage && galleryImages.includes(activeImage) ? activeImage : galleryImages[0] ?? '';

  useEffect(() => {
    let isCancelled = false;

    if (!hasValidCocktailId) {
      return undefined;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);
    setIsNotFound(false);

    fetchPublicCocktailDetail(cocktailId)
      .then((result) => {
        if (!isCancelled) {
          setDetail(result);
        }
      })
      .catch((requestError: Error) => {
        if (isCancelled) {
          return;
        }

        if (requestError instanceof ApiError && requestError.status === 404) {
          setIsNotFound(true);
          setDetail(null);
          return;
        }

        setError(requestError.message || '详情加载失败');
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [cocktailId, hasValidCocktailId, retryToken]);

  if (!hasValidCocktailId) {
    return (
      <main className="detail-shell">
        <div className="status-panel status-panel-roomy">
          <p className="menu-eyebrow">Menu Detail</p>
          <h1>酒单中暂未找到这杯酒</h1>
          <p>这个链接不是有效的鸡尾酒详情地址，回到菜单继续挑一杯吧。</p>
          <Link className="status-action status-link" to="/">
            返回菜单
          </Link>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="detail-shell">
        <div className="detail-skeleton" aria-hidden="true">
          <div className="detail-skeleton-hero" />
          <div className="detail-skeleton-copy">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main className="detail-shell">
        <div className="status-panel status-panel-roomy">
          <p className="menu-eyebrow">Menu Detail</p>
          <h1>酒单中暂未找到这杯酒</h1>
          <p>这杯鸡尾酒可能已经下架，或者链接已经失效。回到公开菜单继续选一杯吧。</p>
          <Link className="status-action status-link" to={backSearch}>
            返回菜单
          </Link>
        </div>
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main className="detail-shell">
        <div className="status-panel status-panel-roomy" role="alert">
          <p className="menu-eyebrow">Menu Detail</p>
          <h1>这杯酒还没加载出来</h1>
          <p>{error ?? '请稍后再试。'}</p>
          <div className="status-actions">
            <button
              className="status-action"
              onClick={() => setRetryToken((value) => value + 1)}
              type="button"
            >
              重新加载
            </button>
            <Link className="status-action status-link is-secondary" to={backSearch}>
              返回菜单
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const heroImage = resolveApiAssetUrl(displayedImage);

  return (
    <main className="detail-shell">
      <div className="detail-topbar">
        <Link className="back-link" to={backSearch}>
          返回菜单
        </Link>
      </div>

      <section className="detail-hero">
        <div className="detail-hero-media">
          {heroImage ? (
            <img src={heroImage} alt={detail.nameZh} />
          ) : (
            <div className="menu-card-placeholder detail-placeholder">
              <span>{detail.nameZh.slice(0, 1)}</span>
            </div>
          )}
          {galleryImages.length > 1 ? (
            <div className="detail-gallery">
              {galleryImages.map((imageUrl) => {
                const resolvedUrl = resolveApiAssetUrl(imageUrl);

                return (
                  <button
                    key={imageUrl}
                    className={`detail-gallery-thumb${imageUrl === activeImage ? ' is-active' : ''}`}
                    onClick={() => setActiveImage(imageUrl)}
                    type="button"
                  >
                    <img alt={`${detail.nameZh} 预览图`} src={resolvedUrl} />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="detail-hero-copy">
          <p className="menu-eyebrow">Cocktail Detail</p>
          <h1>{detail.nameZh}</h1>
          {detail.nameEn ? <p className="detail-name-en">{detail.nameEn}</p> : null}
          {detail.price !== null && detail.price !== undefined ? (
            <p className="detail-price">{formatPrice(detail.price)}</p>
          ) : null}
          {detail.shortDescription ? <p className="detail-lead">{detail.shortDescription}</p> : null}

          <div className="detail-chip-row">
            {detail.categories.map((category) => (
              <span key={category.id} className="filter-pill static-pill">
                {category.name}
              </span>
            ))}
            {detail.tags.map((tag) => (
              <span key={tag.id} className="tag-pill static-pill">
                {tag.name}
              </span>
            ))}
          </div>

          <dl className="detail-facts">
            {detail.baseSpirit ? (
              <>
                <dt>基酒</dt>
                <dd>{detail.baseSpirit}</dd>
              </>
            ) : null}
            {detail.tasteProfile ? (
              <>
                <dt>口感</dt>
                <dd>{detail.tasteProfile}</dd>
              </>
            ) : null}
            {detail.abvNote ? (
              <>
                <dt>酒精感受</dt>
                <dd>{detail.abvNote}</dd>
              </>
            ) : null}
            {detail.description ? (
              <>
                <dt>详情描述</dt>
                <dd>{detail.description}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </section>
    </main>
  );
}
