// Arquivo: src/components/StatusCard.tsx

"use client";

import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";

interface UserInfo {
  isRegistered: boolean;
  registrationDate: string;
  sponsor: string;
  queuePosition: number;
  donationsReceived: number;
  hasDonated: boolean;
  entryFee: number;
  isInQueue: boolean;
  lockedAmount: number;
  unlockTimestamp: number;
}

interface StatusCardProps {
  userInfo: UserInfo | null;
  onRegister: () => void;
  onDonate: () => void;
  onWithdraw: () => void;
  onClaimIncentive: () => void;
}

export default function StatusCard({ userInfo, onRegister, onDonate, onWithdraw, onClaimIncentive }: StatusCardProps) {
  const { t } = useTranslation();

  const formatDate = (dateString: string | number) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (!userInfo) {
    return (
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-4">{t('dashboard.status', 'Status')}</h3>
        <p className="text-sm text-gray-400">Loading user info...</p>
      </Card>
    );
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const canClaimIncentive = userInfo.lockedAmount > 0 && currentTimestamp >= userInfo.unlockTimestamp;

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-4">{t('dashboard.status', 'Status')}</h3>
      <p
        className={`text-sm sm:text-base mb-2 ${
          userInfo.isRegistered ? "text-green-500" : "text-red-500"
        }`}
      >
        {userInfo.isRegistered ? t('status.registered', 'Registered') : "Not Registered"}
      </p>
      {userInfo.isRegistered && (
        <>
          <p className="text-sm text-gray-400 mb-1">
            {t('status.registered', 'Registered at')}: {formatDate(userInfo.registrationDate)}
          </p>
          <p className="text-sm text-gray-400 mb-2">
            {t('status.sponsor', 'Sponsor')}:{' '}
            <a
              href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/address/${userInfo.sponsor}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {userInfo.sponsor.slice(0, 6)}...{userInfo.sponsor.slice(-4)}
              <ExternalLink size={14} className="inline ml-1" />
            </a>
          </p>
          <p className="text-sm text-gray-200 mb-1">
            {t('status.queue', 'Queue Position')}: {userInfo.isInQueue ? userInfo.queuePosition : "Not in queue"}
          </p>
          <p className="text-sm text-gray-200 mb-1">
            {t('status.donations', 'Donations Received')}: {userInfo.donationsReceived}
          </p>
          <p className="text-sm text-gray-200 mb-1">
            {t('status.hasDonated', 'Has Donated')}: {userInfo.hasDonated ? "Yes" : t('status.no', 'No')}
          </p>
          {userInfo.lockedAmount > 0 && (
            <>
              <p className="text-sm text-gray-200 mb-1">
                {t('incentive.lockedAmount', 'Locked Amount')}: {userInfo.lockedAmount} HELP
              </p>
              <p className="text-sm text-gray-200 mb-1">
                {t('incentive.unlockDate', 'Unlock Date')}: {formatDate(userInfo.unlockTimestamp * 1000)}
              </p>
            </>
          )}
          <p className="text-xs text-green-500 mb-4">Entry Fee: {userInfo.entryFee} USDT</p>
        </>
      )}
      <div className="space-y-3">
        {!userInfo.isRegistered ? (
          <Button
            onClick={onRegister}
            className="w-full text-sm sm:text-base py-3 bg-green-500 hover:bg-green-600"
          >
            {t('status.register', 'Register Now')}
          </Button>
        ) : (
          <>
            <Button
              onClick={onDonate}
              className="w-full text-sm sm:text-base py-3 bg-blue-500 hover:bg-blue-600"
            >
              {t('status.donate', 'Donate')}
            </Button>
            <Button
              onClick={onWithdraw}
              className="w-full text-sm sm:text-base py-3 bg-purple-500 hover:bg-purple-600"
            >
              {t('status.withdraw', 'Withdraw')}
            </Button>
            {canClaimIncentive && (
              <Button
                onClick={onClaimIncentive}
                className="w-full text-sm sm:text-base py-3 bg-teal-500 hover:bg-teal-600"
              >
                {t('status.claimIncentive', 'Claim Incentive')}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}