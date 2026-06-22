import { useEffect, useState } from 'react';
import { apiRequest } from '../services/http';

export function DashboardPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all([
      apiRequest<{ pagination: { total: number } }>('/admin/cocktails'),
      apiRequest<Array<unknown>>('/admin/categories'),
      apiRequest<Array<unknown>>('/admin/ingredients'),
      apiRequest<{ pagination: { total: number } }>('/admin/production-tasks'),
    ])
      .then(([cocktails, categories, ingredients, tasks]) => {
        setCounts({
          鸡尾酒: cocktails.pagination.total,
          分类: categories.length,
          原料: ingredients.length,
          待制作任务: tasks.pagination.total,
        });
      })
      .catch(() => {
        setCounts({});
      });
  }, []);

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>仪表盘</h2>
        </div>
      </header>
      <div className="card-grid">
        {Object.entries(counts).map(([label, value]) => (
          <article key={label} className="metric-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
