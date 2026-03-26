import type { ReactNode } from 'react';

type TableProps = {
  headers: string[];
  children: ReactNode;
};

const Table = ({ headers, children }: TableProps) => (
  <table className="table">
    <thead>
      <tr>
        {headers.map((cell) => (
          <th key={cell}>{cell}</th>
        ))}
      </tr>
    </thead>
    <tbody>{children}</tbody>
  </table>
);

export default Table;

