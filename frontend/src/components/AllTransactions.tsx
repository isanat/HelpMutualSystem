// Arquivo: src/components/AllTransactions.tsx

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "./ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "./ui/table";
import { Button } from "./ui/button";
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

export default function AllTransactions() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/all-contract-transactions');
        setTransactions(response.data);
      } catch (error) {
        console.error('Failed to fetch all contract transactions:', error);
        setError(t('errors.fetchFailed', 'Failed to fetch transactions'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [t]);

  const indexOfLastTx = currentPage * transactionsPerPage;
  const indexOfFirstTx = indexOfLastTx - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTx, indexOfLastTx);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  return (
    <Card>
      <div className="text-lg font-semibold mb-2">{t('transactions.all', 'All Transactions')}</div>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-sm text-gray-400">
              <TableHead>Transaction</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Token</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="text-gray-500 text-sm">
                <TableCell colSpan={7}>Loading...</TableCell>
              </TableRow>
            ) : currentTransactions.length > 0 ? (
              currentTransactions.map((tx, index) => (
                <TableRow key={index} className="text-gray-500 text-sm">
                  <TableCell>{tx.transactionHash.slice(0, 6)}...{tx.transactionHash.slice(-4)}</TableCell>
                  <TableCell>{tx.method}</TableCell>
                  <TableCell>{new Date(tx.date).toLocaleString()}</TableCell>
                  <TableCell>{tx.from.slice(0, 6)}...{tx.from.slice(-4)}</TableCell>
                  <TableCell>{tx.to.slice(0, 6)}...{tx.to.slice(-4)}</TableCell>
                  <TableCell>{tx.amount}</TableCell>
                  <TableCell>{tx.token}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="text-gray-500 text-sm">
                <TableCell colSpan={7}>No transactions found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-400 flex items-center">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
  );
}