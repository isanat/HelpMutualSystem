// Arquivo: src/components/HelpTransactions.tsx

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "./ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "./ui/table";
import { useTranslation } from "react-i18next";

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

interface HelpTransactionsProps {
  address: string;
}

export default function HelpTransactions({ address }: HelpTransactionsProps) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHelpTransactions = async () => {
      if (!address) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/help-transactions?address=${address}`);
        setTransactions(response.data);
      } catch (error) {
        console.error('Failed to fetch HELP transactions:', error);
        setError(t('errors.fetchFailed', 'Failed to fetch HELP transactions'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchHelpTransactions();
  }, [address, t]);

  return (
    <Card>
      <div className="text-lg font-semibold mb-2">{t('transactions.help', 'Recent HELP Transactions')}</div>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-sm text-gray-400">
              <TableHead>Transaction</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="text-gray-500 text-sm">
                <TableCell colSpan={4}>Loading...</TableCell>
              </TableRow>
            ) : transactions.length > 0 ? (
              transactions.map((tx, index) => (
                <TableRow key={index} className="text-gray-500 text-sm">
                  <TableCell>{tx.transactionHash.slice(0, 6)}...{tx.transactionHash.slice(-4)}</TableCell>
                  <TableCell>{tx.method}</TableCell>
                  <TableCell>{new Date(tx.date).toLocaleString()}</TableCell>
                  <TableCell>{tx.amount} {tx.token}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="text-gray-500 text-sm">
                <TableCell colSpan={4}>No HELP transactions found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}