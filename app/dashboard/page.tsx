'use client';

import { useEffect, useState } from 'react';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { ProfileCompletionModal } from '@/components/profile-completion-modal';
import { checkProfileStatus } from '@/app/actions';
import { useUser } from '@/hooks/useUser';

export default function DashboardPage() {
  const { user, loading } = useUser();
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncProfileStatus() {
      if (loading) {
        return;
      }

      if (!user) {
        if (isMounted) {
          setShowProfileModal(false);
        }
        return;
      }

      const status = await checkProfileStatus(user.id);
      if (isMounted) {
        setShowProfileModal(!status.isComplete);
      }
    }

    void syncProfileStatus();

    return () => {
      isMounted = false;
    };
  }, [loading, user]);

  return (
    <div className="animate-page-enter from-background/95 min-h-screen bg-gradient-to-br via-white/80 to-emerald-50/20">
      <div className="flex flex-1">
        <DashboardContent />
      </div>
      {user ? (
        <ProfileCompletionModal
          userId={user.id}
          isOpen={showProfileModal}
          onComplete={() => setShowProfileModal(false)}
          onClose={() => setShowProfileModal(false)}
        />
      ) : null}
    </div>
  );
}
