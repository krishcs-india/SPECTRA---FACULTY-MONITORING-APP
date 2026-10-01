import React, { useState, useEffect } from 'react';
import adminImg from '../../assets/admin.png';
import teacher1Img from '../../assets/teacher-1.png';
import teacher2Img from '../../assets/teacher-2.png';

interface NavbarUserAvatarProps {
  role?: string;
  name?: string;
  className?: string;
}

export const NavbarUserAvatar: React.FC<NavbarUserAvatarProps> = ({
  role,
  name,
  className = '',
}) => {
  const isAdmin = role === 'ADMIN';
  const [isFlipped, setIsFlipped] = useState(false);

  // Flip between Teacher 1 and Teacher 2 every 3 seconds for Faculty / HOD
  useEffect(() => {
    if (isAdmin) return;
    const interval = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Admin Profile Image (Static circular admin emblem)
  if (isAdmin) {
    return (
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-rose-300/50 dark:border-rose-900/60 shadow-sm select-none shrink-0 bg-white dark:bg-[#201026] p-0.5 group-hover:scale-105 group-hover:border-rose-400 transition-all duration-200 ${className}`}
        title={name || 'Administrator'}
      >
        <img
          src={adminImg}
          alt="Administrator"
          className="w-full h-full object-contain rounded-lg"
          onError={(e) => {
            // Public path fallback if needed
            (e.target as HTMLImageElement).src = '/assets/admin.png';
          }}
        />
      </div>
    );
  }

  // Faculty and HOD: 3D Flip Card alternating Teacher 1 & Teacher 2 every 3 seconds
  return (
    <div
      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-rose-300/50 dark:border-rose-900/60 shadow-sm select-none shrink-0 bg-white dark:bg-[#201026] p-0.5 [perspective:600px] group-hover:border-rose-400 transition-all duration-200 ${className}`}
      title={name || 'Faculty Profile'}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
        }`}
      >
        {/* Front Face: Teacher 1 */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-lg overflow-hidden bg-rose-50/40 dark:bg-rose-950/30">
          <img
            src={teacher1Img}
            alt="Faculty Teacher 1"
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/teacher-1.png';
            }}
          />
        </div>

        {/* Back Face: Teacher 2 (Pre-rotated 180 degrees) */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-lg overflow-hidden bg-rose-50/40 dark:bg-rose-950/30">
          <img
            src={teacher2Img}
            alt="Faculty Teacher 2"
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/teacher-2.png';
            }}
          />
        </div>
      </div>
    </div>
  );
};
