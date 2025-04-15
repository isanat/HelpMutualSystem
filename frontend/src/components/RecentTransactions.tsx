// Arquivo: src/components/RecentTransactions.tsx

"use client";

import { Card } from "./ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "./ui/table";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";

interface Transaction {
  transactionHash: string;
  method: string;
  block: number;
  date: string;
  from: string;
  to: string;
  amount: number;
  token: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  maxRows?: number;
}

export default function RecentTransactions({ transactions, maxRows = 5 }: RecentTransactionsProps) {
  const { t } = useTranslation();
  const displayedTransactions = transactions.slice(0, maxRows);

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-4">{t('transactions.title', 'Recent Transactions')}</h3>
      <div className="overflow-x-auto">
        <Table aria-label="Recent transactions table">
          <TableHeader>
            <TableRow className="text-xs sm:text-sm text-gray-400">
              <TableHead>{t('donations.date', 'Date')}</TableHead>
              <TableHead>{t('transactions.amount', 'Amount')}</TableHead>
              <TableHead>{t('donations.method', 'Method')}</TableHead>
              <TableHead>Tx Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTransactions.length ? (
              displayedTransactions.map((tx, index) => (
                <TableRow key={index} className="text-xs sm:text-sm text-gray-500">
                  <TableCell>{new Date(tx.date).toLocaleString()}</TableCell>
                  <TableCell>{tx.amount} {tx.token}</TableCell>
                  <TableCell>{tx.method}</TableCell>
                  <TableCell>
                    <a
                      href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${tx.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1"
                    >
                      {tx.transactionHash.slice(0, 6)}...{tx.transactionHash.slice(-4)}
                      <ExternalLink size={14} />
                    </a>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-gray-500 text-sm">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}