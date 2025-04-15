// Arquivo: src/components/ui/table.tsx

import * as React from "react";

// Props para o componente Table
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  variant?: "default" | "compact" | "bordered";
}

// Props para os outros componentes
interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}
interface TableHeadProps extends React.HTMLAttributes<HTMLTableCellElement> {
  scope?: "col" | "row";
}
interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {}

export const Table: React.FC<TableProps> = ({ className, variant = "default", ...props }) => {
  const variantStyles = {
    default: "border-separate border-spacing-y-2",
    compact: "border-separate border-spacing-y-1",
    bordered: "border border-gray-700",
  };

  return (
    <table
      className={`w-full text-left text-white ${variantStyles[variant]} ${className || ""}`}
      {...props}
    />
  );
};

export const TableHeader: React.FC<TableHeaderProps> = ({ className, ...props }) => (
  <thead className={`text-xs uppercase ${className || ""}`} {...props} />
);

export const TableBody: React.FC<TableBodyProps> = ({ className, ...props }) => (
  <tbody className={className || ""} {...props} />
);

export const TableRow: React.FC<TableRowProps> = ({ className, ...props }) => (
  <tr className={`border-b border-gray-700 ${className || ""}`} {...props} />
);

export const TableHead: React.FC<TableHeadProps> = ({ className, scope = "col", ...props }) => (
  <th
    scope={scope}
    className={`text-sm text-gray-400 px-4 py-3 ${className || ""}`}
    {...props}
  />
);

export const TableCell: React.FC<TableCellProps> = ({ className, ...props }) => (
  <td
    className={`text-sm text-gray-500 px-4 py-2 ${className || ""}`}
    {...props}
  />
);