import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CocktailBasicsSection } from '../features/cocktails/components/CocktailBasicsSection';
import { CocktailImagesSection } from '../features/cocktails/components/CocktailImagesSection';
import { CocktailRecipeSection } from '../features/cocktails/components/CocktailRecipeSection';
import { CocktailTaxonomySection } from '../features/cocktails/components/CocktailTaxonomySection';
import {
  createCocktail,
  fetchCocktailDetail,
  fetchCocktailEditorResources,
  updateCocktail,
  uploadCocktailImage,
} from '../features/cocktails/services';
import type { CocktailEditorResources, CocktailFormState } from '../features/cocktails/types';
import {
  buildCocktailPayload,
  buildPublishWarnings,
  createInitialCocktailForm,
  mapCocktailDetailToForm,
} from '../features/cocktails/utils';

interface EditorProps {
  mode: 'create' | 'edit';
}

const emptyResources: CocktailEditorResources = {
  categories: [],
  tags: [],
  ingredients: [],
};

export function CocktailEditorPage({ mode }: EditorProps) {
  const navigate = useNavigate();
  const params = useParams();
  const [form, setForm] = useState<CocktailFormState>(createInitialCocktailForm);
  const [resources, setResources] = useState<CocktailEditorResources>(emptyResources);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setResourceLoading(true);
    fetchCocktailEditorResources()
      .then((data) => setResources(data))
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载基础数据失败');
      })
      .finally(() => {
        setResourceLoading(false);
      });
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !params.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchCocktailDetail(Number(params.id))
      .then((data) => {
        setForm(mapCocktailDetailToForm(data));
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载鸡尾酒详情失败');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [mode, params.id]);

  const warnings = useMemo(() => buildPublishWarnings(form), [form]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      const files = Array.from(fileList);
      const uploaded = await Promise.all(files.map((file) => uploadCocktailImage(file)));

      setForm((current) => {
        const nextImages = [
          ...current.images,
          ...uploaded.map((item) => ({
            id: `image-${Math.random().toString(36).slice(2, 10)}`,
            url: item.url,
          })),
        ];

        return {
          ...current,
          images: nextImages,
          coverImageId: current.coverImageId || nextImages[0]?.id || '',
        };
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '上传图片失败');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = buildCocktailPayload(form);

      if (mode === 'create') {
        await createCocktail(payload);
      } else if (params.id) {
        await updateCocktail(Number(params.id), payload);
      }

      navigate('/cocktails');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '保存鸡尾酒失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <header className="page-header cocktail-editor-header">
        <div>
          <p className="eyebrow">Editor</p>
          <h2>{mode === 'create' ? '新增鸡尾酒' : '编辑鸡尾酒'}</h2>
          <p className="page-description">
            这一页把基础资料、分类标签、配方和图片放在同一个编辑流里，减少来回切换和漏填。
          </p>
        </div>
      </header>
      {error ? <p className="error-text resource-error">{error}</p> : null}
      {warnings.length > 0 ? (
        <div className="editor-warning-banner">
          {warnings.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      ) : null}
      {loading || resourceLoading ? (
        <div className="table-card">
          <p>正在准备编辑器...</p>
        </div>
      ) : (
        <form className="cocktail-editor-layout" onSubmit={handleSubmit}>
          <div className="cocktail-editor-main">
            <CocktailBasicsSection form={form} setForm={setForm} />
            <CocktailTaxonomySection
              categories={resources.categories}
              form={form}
              setForm={setForm}
              tags={resources.tags}
            />
            <CocktailRecipeSection
              form={form}
              ingredients={resources.ingredients}
              setForm={setForm}
            />
            <CocktailImagesSection
              form={form}
              onUpload={handleUpload}
              setForm={setForm}
              uploading={uploading}
            />
          </div>
          <aside className="cocktail-editor-sidebar">
            <div className="editor-summary-card">
              <p className="eyebrow">Checklist</p>
              <h3>发布前检查</h3>
              <ul className="editor-summary-list">
                <li>{form.nameZh.trim() ? '已填写中文名' : '缺少中文名'}</li>
                <li>{form.categoryIds.length > 0 ? '已选择分类' : '缺少分类'}</li>
                <li>
                  {form.recipeItems.some((item) => item.ingredientId) ? '已配置配方' : '缺少配方'}
                </li>
                <li>{form.images.length > 0 ? '已上传图片' : '还没有图片'}</li>
                <li>{form.publishStatus === 'published' ? '当前为已发布' : '当前未发布'}</li>
              </ul>
              <div className="editor-summary-actions">
                <button className="ghost-outline-button" type="button" onClick={() => navigate('/cocktails')}>
                  返回列表
                </button>
                <button className="primary-button" disabled={saving || uploading} type="submit">
                  {saving ? '保存中...' : '保存鸡尾酒'}
                </button>
              </div>
            </div>
          </aside>
        </form>
      )}
    </section>
  );
}
