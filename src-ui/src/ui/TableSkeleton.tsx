type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="table-skeleton" role="status" aria-live="polite">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="table-skeleton__row" key={`row-${rowIndex}`}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <span
              key={`cell-${rowIndex}-${colIndex}`}
              className="table-skeleton__cell"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
