import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/http';

interface CocktailItem {
  id: number;
  nameZh: string;
  price?: number | null;
  publishStatus: string;
  isVisible: boolean;
}

function formatPrice(price?: number | null) {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return '-';
  }

  return `¥${price.toFixed(2)}`;
}

export function CocktailsPage() {
  const [items, setItems] = useState<CocktailItem[]>([]);

  useEffect(() => {
    apiRequest<{ list: CocktailItem[] }>('/admin/cocktails')
      .then((data) => setItems(data.list))
      .catch(() => setItems([]));
  }, []);

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Content</p>
          <h2>鸡尾酒管理</h2>
        </div>
        <Link className="primary-button" to="/cocktails/create">
          新增鸡尾酒
        </Link>
      </header>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>中文名</th>
              <th>价格</th>
              <th>发布状态</th>
              <th>显示</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.nameZh}</td>
                <td>{formatPrice(item.price)}</td>
                <td>{item.publishStatus}</td>
                <td>{item.isVisible ? '是' : '否'}</td>
                <td>
                  <Link to={`/cocktails/${item.id}/edit`}>编辑</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
