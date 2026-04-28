"use client";

import React, { useEffect, useState } from 'react';
import PhoneModal from './PhoneModal';
import { checkProfileStatus } from '../actions';
import { useUser } from '@/hooks/useUser';

type ProfileStatusResult = {
  showModal?: boolean;
};

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const [isVisible, setIsVisible] = useState(true);
  const [showModalFromServer, setShowModalFromServer] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      try {
        const res = await checkProfileStatus(user.id);
        const show = (res as ProfileStatusResult).showModal ?? false;
        setShowModalFromServer(show);
      } catch {
        setShowModalFromServer(true);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isVisible && showModalFromServer) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isVisible, showModalFromServer]);

  return (
    <div>
      <h1>Dashboard</h1>
      {showModalFromServer && isVisible ? <PhoneModal onClose={() => setIsVisible(false)} /> : null}
    </div>
  );
};

export default Dashboard;
