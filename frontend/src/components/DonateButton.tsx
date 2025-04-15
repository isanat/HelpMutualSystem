// Arquivo: src/components/DonateButton.tsx

"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWeb3 } from "../context/Web3Context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Modal from "./Modal";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { Loader2, Link2 } from "lucide-react";

export default function DonateButton() {
  const { t } = useTranslation();
  const { contract, account, provider } = useWeb3();
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAmount = (value: string) => {
    const amount = parseFloat(value);
    if (!value || amount <= 0) {
      setError(t('errors.invalidAmount', 'Please enter a valid donation amount.'));
      return false;
    }
    setError(null);
    return true;
  };

  const handleDonate = async () => {
    if (!contract || !account || !provider) {
      toast.error(t('errors.connectWallet', 'Please connect your wallet.'));
      return;
    }

    if (!validateAmount(donateAmount)) return;

    try {
      setIsLoading(true);
      toast.info(t('transaction.processing', 'Processing donation...'));

      const signer = await provider.getSigner();
      const usdtAddress = await contract.usdt();
      const usdtContract = new ethers.Contract(
        usdtAddress,
        [
          "function approve(address spender, uint256 amount) public returns (bool)",
          "function allowance(address owner, address spender) public view returns (uint256)",
          "function balanceOf(address account) public view returns (uint256)",
        ],
        signer
      );

      const amount = ethers.parseUnits(donateAmount, 6);
      const balance = await usdtContract.balanceOf(account);

      if (balance < amount) {
        throw new Error(t('errors.insufficientUsdt', 'Insufficient USDT balance.'));
      }

      const allowance = await usdtContract.allowance(account, contract.target);
      if (allowance < amount) {
        toast.info(t('transaction.approving', 'Approving USDT for donation...'));
        const approveTx = await usdtContract.approve(contract.target, amount);
        await approveTx.wait();
        toast.success(t('transaction.approved', 'USDT approved successfully!'));
      }

      const tx = await contract.connect(signer).donate(amount);
      await tx.wait();

      setIsDonateModalOpen(false);
      setDonateAmount("");
      toast.success(t('transaction.success', 'Donation successful!'));
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error(t('errors.userRejected', 'Transaction rejected by user.'));
      } else if (error.message.includes('Insufficient USDT')) {
        toast.error(error.message);
      } else {
        toast.error(t('errors.donationFailed', 'Failed to donate. Please try again.'));
      }
      console.error("Error donating:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsDonateModalOpen(true)}
        className="bg-green-500 hover:bg-green-600 flex items-center gap-2 text-sm sm:text-base py-3 px-6 rounded-full shadow-lg"
        disabled={isLoading}
        aria-label={t('actions.donate', 'Donate')}
        loading={isLoading}
        icon={<Link2 className="h-5 w-5" />}
      >
        {t('actions.donate', 'Donate')}
      </Button>

      <Modal
        isOpen={isDonateModalOpen}
        onClose={() => setIsDonateModalOpen(false)}
        title={t('actions.donate', 'Make a Donation')}
      >
        <div className="space-y-4">
          <Input
            type="number"
            value={donateAmount}
            onChange={(e) => {
              setDonateAmount(e.target.value);
              validateAmount(e.target.value);
            }}
            placeholder={t('donation.enterAmount', 'Enter donation amount (USDT)')}
            className="text-sm sm:text-base py-3"
            disabled={isLoading}
            error={!!error}
            aria-label="Donation amount"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            className="w-full bg-green-500 hover:bg-green-600 text-sm sm:text-base py-3"
            onClick={handleDonate}
            disabled={isLoading || !!error}
            loading={isLoading}
          >
            {t('donation.send', 'Send Donation')}
          </Button>
        </div>
      </Modal>
    </>
  );
}