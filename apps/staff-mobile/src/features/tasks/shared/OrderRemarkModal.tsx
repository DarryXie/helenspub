import type { CocktailListItem } from '@cocktail/shared-types';
import { useEffect, useState } from 'react';

export function OrderRemarkModal({
  cocktail,
  error,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  cocktail: CocktailListItem;
  error: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (remark: string) => Promise<void> | void;
}) {
  const [remark, setRemark] = useState('');

  useEffect(() => {
    setRemark('');
  }, [cocktail.id]);

  return (
    <div className="modal-overlay active" role="presentation">
      <div aria-modal="true" className="modal-box" role="dialog">
        <div className="modal-title">下单备注：{cocktail.nameZh}</div>
        <textarea
          className="textarea-memo"
          onChange={(event) => setRemark(event.target.value)}
          placeholder="请输入客人的特殊要求..."
          value={remark}
        />
        {error ? <p className="modal-error">{error}</p> : null}
        <div className="modal-buttons">
          <button className="btn-modal btn-cancel" onClick={onCancel} type="button">
            取消
          </button>
          <button
            className="btn-modal btn-confirm"
            disabled={isSubmitting}
            onClick={() => onConfirm(remark)}
            type="button"
          >
            {isSubmitting ? '下单中...' : '确认下单'}
          </button>
        </div>
      </div>
    </div>
  );
}
