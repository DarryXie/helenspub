function paginationWindow(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export function Pagination({
  page,
  totalPages,
  onSelectPage,
}: {
  page: number;
  totalPages: number;
  onSelectPage: (nextPage: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = paginationWindow(page, totalPages);

  return (
    <nav className="pagination" aria-label="分页导航">
      <button
        className="pagination-button"
        disabled={page <= 1}
        onClick={() => onSelectPage(page - 1)}
        type="button"
      >
        上一页
      </button>
      <div className="pagination-pages">
        {pages.map((item) => (
          <button
            aria-current={item === page ? 'page' : undefined}
            className={`pagination-page${item === page ? ' is-active' : ''}`}
            key={item}
            onClick={() => onSelectPage(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <button
        className="pagination-button"
        disabled={page >= totalPages}
        onClick={() => onSelectPage(page + 1)}
        type="button"
      >
        下一页
      </button>
    </nav>
  );
}
