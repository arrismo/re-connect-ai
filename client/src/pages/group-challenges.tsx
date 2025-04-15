import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import GroupChallenges from '@/components/challenges/GroupChallenges';

const GroupChallengePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <GroupChallenges userId={user?.id} />
    </div>
  );
};

export default GroupChallengePage;