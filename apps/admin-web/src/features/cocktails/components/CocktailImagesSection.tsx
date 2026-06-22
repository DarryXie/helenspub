import type { Dispatch, SetStateAction } from 'react';
import type { CocktailFormState } from '../types';
import { toAssetUrl } from '../services';

interface CocktailImagesSectionProps {
  form: CocktailFormState;
  setForm: Dispatch<SetStateAction<CocktailFormState>>;
  onUpload: (fileList: FileList | null) => Promise<void>;
  uploading: boolean;
}

export function CocktailImagesSection({
  form,
  setForm,
  onUpload,
  uploading,
}: CocktailImagesSectionProps) {
  return (
    <section className="cocktail-editor-section">
      <div className="section-heading">
        <p className="eyebrow">Images</p>
        <h3>封面与图集</h3>
        <p>可以先上传多张图片，再从中指定一张作为封面。前台列表优先显示封面图。</p>
      </div>
      <div className="editor-stack">
        <label className="upload-dropzone">
          <input
            multiple
            accept="image/*"
            type="file"
            onChange={(event) => void onUpload(event.target.files)}
          />
          <strong>{uploading ? '上传中...' : '点击选择图片或直接拖入'}</strong>
          <span>支持多图上传，单张限制 5MB。</span>
        </label>
        {form.images.length === 0 ? (
          <div className="empty-editor-state">
            <strong>还没有图片</strong>
            <span>先上传封面或图集，保存后公开前台才能展示更完整的视觉内容。</span>
          </div>
        ) : (
          <div className="image-grid">
            {form.images.map((image) => {
              const isCover = form.coverImageId === image.id;
              return (
                <article className={isCover ? 'image-card cover' : 'image-card'} key={image.id}>
                  <img alt="" src={toAssetUrl(image.url)} />
                  <div className="image-card-meta">
                    <span>{isCover ? '当前封面' : '详情图'}</span>
                    <small>{image.url.split('/').pop()}</small>
                  </div>
                  <div className="image-card-actions">
                    <button
                      className="ghost-outline-button"
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, coverImageId: image.id }))}
                    >
                      设为封面
                    </button>
                    <button
                      className="inline-button danger"
                      type="button"
                      onClick={() =>
                        setForm((current) => {
                          const nextImages = current.images.filter((item) => item.id !== image.id);
                          return {
                            ...current,
                            images: nextImages,
                            coverImageId:
                              current.coverImageId === image.id ? nextImages[0]?.id ?? '' : current.coverImageId,
                          };
                        })
                      }
                    >
                      移除
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
