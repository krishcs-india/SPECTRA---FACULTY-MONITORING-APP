import React from 'react';

export const KalyaniMandalaBackground: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Clean subtle ambient rose/pink light for Dark and White modes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-rose-500/10 via-pink-500/5 to-transparent blur-3xl opacity-60 dark:opacity-30" />
      <div className="absolute -bottom-20 right-10 w-[500px] h-[300px] bg-gradient-to-t from-pink-500/8 to-transparent blur-3xl opacity-40 dark:opacity-20" />
    </div>
  );
};
