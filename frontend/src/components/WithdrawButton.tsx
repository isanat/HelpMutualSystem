// Arquivo: src/components/WithdrawButton.tsx

"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useWeb3 } from "../context/Web3Context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Modal from "./Modal";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { Loader2, Link2 } from "lucide-react";

interface WithdrawButtonProps {
  userHelpBalance: number;
}

export default function WithdrawButton({ userHelpBalance }: WithdrawButtonProps) {
  const { t } = useTranslation();
  const { contract, account, provider } = useWeb3();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedUsdt, setEstimatedUsdt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateAmount = (value: string) => {
    const amount = parseFloat(value);
    if (!value || amount <= 0) {
      setError(t('errors.invalidAmount', 'Enter a valid amount'));
      setEstimatedUsdt(null);
      return false;
    }
    if (amount > userHelpBalance) {
      setError(t('errors.insufficientHelp', 'Insufficient HELP balance'));
      setEstimatedUsdt(null);
      return false;
    }
    setError(null);
    return true;
  };

  useEffect(() => {
    const calculateEstimatedUsdt = async () => {
      if (!contract || !withdrawAmount) {
        setEstimatedUsdt(null);
        return;
      }

      if (!validateAmount(withdrawAmount)) return;

      try {
        const helpPrice = Number(ethers.formatUnits(await contract.getHelpPrice(), 18));
        const amount = parseFloat(withdrawAmount);
        setEstimatedUsdt(amount * helpPrice);
      } catch {
        setError(t('errors.calculationFailed', 'Unable to calculate USDT'));
        setEstimatedUsdt(null);
      }
    };

    calculateEstimatedUsdt();
  }, [withdrawAmount, contract, userHelpBalance, t]);

  const handleWithdraw = async () => {
    if (!contract || !account || !provider) {
      toast.error(t('errors.connectWallet', 'Please connect your wallet'));
      return;
    }
    if (error) return;

    setIsLoading(true);
    toast.info(t('transaction.processing', 'Processing withdrawal...'));
    try {
      const signer = await provider.getSigner();
      const helpAmount = ethers.parseUnits(withdrawAmount, 18);
      const usdtAmount = helpAmount
        .mul(await contract.getHelpPrice())
        .div(ethers.parseUnits("1", 18));
      const tx = await contract.connect(signer).withdraw(usdtAmount);
      await tx.wait();
      toast.success(
        t('transaction.successWithdraw', 'Withdrew {{amount}} USDT', {
          amount: ethers.formatUnits(usdtAmount, 6),
        })
      );
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
    } catch (error: any) {
      toast.error(
        error.code === 4001
          ? t('errors.userRejected', 'Transaction rejected')
          : t('errors.withdrawFailed', 'Withdrawal failed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsWithdrawModalOpen(true)}
        className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 text-sm sm:text-base py-3 px-6 rounded-full shadow-lg"
        disabled={isLoading}
        loading={isLoading}
        icon={<Link2 className="h-5 w-5" />}
        aria-label={t('actions.withdraw', 'Withdraw')}
      >
        {t('actions.withdraw', 'Withdraw')}
      </Button>

      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title={t('actions.withdraw', 'Withdraw Funds')}
      >
        <div className="space-y-4">
          <Input
            type="number"
            value={withdrawAmount}
            onChange={(e) => {
              setWithdrawAmount(e.target.value);
              validateAmount(e.target.value);
            }}
            placeholder={t('placeholders.enterAmountHelp', 'Enter amount (HELP)')}
            className="text-sm sm:text-base py-3"
            disabled={isLoading}
            error={!!error}
            aria-label="Withdraw amount"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          {estimatedUsdt && (
            <p className="text-sm text-gray-400">
              {t('withdraw.estimatedUsdt', 'Estimated: {{amount}} USDT', {
                amount: estimatedUsdt.toFixed(2),
              })}
            </p>
          )}
          <p className="text-sm text-gray-400">
            {t('withdraw.availableHelp', 'Available: {{amount}} HELP', {
              amount: userHelpBalance.toFixed(2),
            })}
          </p>
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-3"
            onClick={handleWithdraw}
            disabled={isLoading || !!error}
            loading={isLoading}
          >
            {t('actions.withdraw', 'Withdraw')}
          </Button>
        </div>
      </Modal>
    </>
  );
}