import { useEffect, useState } from 'react';
import { apiRequest } from '../services/http';

export function TasksPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    apiRequest<{ list: Array<Record<string, unknown>> }>('/admin/production-tasks')
      .then((data) => setItems(data.list))
      .catch(() => setItems([]));
  }, []);

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Production</p>
          <h2>待制作任务</h2>
        </div>
      </header>
      <div className="table-card">
        <pre>{JSON.stringify(items, null, 2)}</pre>
      </div>
    </section>
  );
}
