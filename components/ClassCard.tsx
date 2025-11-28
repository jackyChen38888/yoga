
import React from 'react';
import { ClassSession, Instructor, UserRole } from '../types';
import { AlertCircle, X, Pencil, Clock, LogIn, CreditCard } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface ClassCardProps {
  session: ClassSession;
  instructor: Instructor;
  onAction: () => void;
  onEdit?: () => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({ session, instructor, onAction, onEdit }) => {
  const { currentUser, students, getNextClassDate, setLoginModalOpen } = useApp();
  const isBooked = session.enrolledUserIds.includes(currentUser.id);
  const isFull = session.enrolledUserIds.length >= session.capacity;
  
  // Roles
  const isGuest = currentUser.role === UserRole.GUEST;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  
  // Payment Check (LIVE DATA)
  // We fetch the student record from the live list to ensure we have the latest payment status,
  // preventing issues where currentUser might be stale.
  const liveStudent = currentUser.role === UserRole.STUDENT 
    ? students.find(s => s.id === currentUser.id) 
    : null;
    
  // If we found the live record, use its hasPaid status. Otherwise fallback to currentUser (e.g. mock data init)
  // Default to false (unpaid) if undefined for safety.
  const isUnpaid = currentUser.role === UserRole.STUDENT && (liveStudent ? !liveStudent.hasPaid : !currentUser.hasPaid);
  
  // Calculate next class date
  const nextDate = getNextClassDate(session.dayOfWeek, session.startTimeStr);
  const nextDateString = nextDate.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
  const dayName = ['週日','週一','週二','週三','週四','週五','週六'][nextDate.getDay()];
  const timeString = session.startTimeStr;

  // Check 3-day Booking Window Rule
  const now = new Date();
  const diffMs = nextDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // User can only book if the class is WITHIN 72 hours (3 days)
  const isBookingWindowOpen = diffHours <= 72;

  // Difficulty colors and labels
  const diffMap = {
    'Beginner': { color: 'bg-green-100 text-green-700', label: '初學者' },
    'Intermediate': { color: 'bg-yellow-100 text-yellow-700', label: '中級' },
    'Advanced': { color: 'bg-orange-100 text-orange-700', label: '進階' }
  };
  
  const diffInfo = diffMap[session.difficulty] || diffMap['Beginner'];

  const handleMainAction = () => {
    if (isGuest) {
        setLoginModalOpen(true);
    } else {
        onAction();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 relative group flex flex-col h-full">
      {/* Substitute Banner */}
      {session.isSubstitute && (
        <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 justify-center">
          <AlertCircle size={10} />
          <span>代課</span>
        </div>
      )}

      {/* Admin Edit Button */}
      {isAdmin && onEdit && (
        <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm border border-gray-200 text-gray-500 hover:text-zen-600 hover:border-zen-300 transition-all z-10 opacity-0 group-hover:opacity-100"
            title="編輯課程詳情"
        >
            <Pencil size={14} />
        </button>
      )}

      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
             <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${diffInfo.color}`}>
                {diffInfo.label}
             </span>
             <span className="text-sm font-bold text-gray-400">{timeString}</span>
          </div>
          <h3 className="font-bold text-gray-800 leading-tight">{session.title}</h3>
          <p className="text-xs text-zen-600 mt-1 flex items-center gap-1">
             <Clock size={12} />
             {nextDateString} ({dayName})
          </p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <img 
            src={instructor?.imageUrl || 'https://via.placeholder.com/100'} 
            alt={instructor?.name || 'Instructor'} 
            className="w-8 h-8 rounded-full object-cover border border-gray-100"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-gray-700 truncate">{instructor?.name || '未知老師'}</p>
          </div>
        </div>

        <div className="mt-auto">
             <div className="flex justify-between text-[10px] text-gray-500 mb-2">
                 <span>{session.location}</span>
                 <span>{session.enrolledUserIds.length}/{session.capacity} 人</span>
             </div>
             
             {/* Notification Alert for Substitution */}
            {session.notificationMessage && (
                <div className="mb-2 p-2 bg-amber-50 rounded text-[10px] text-amber-800 border border-amber-100 italic line-clamp-2">
                    "{session.notificationMessage}"
                </div>
            )}

            <button
                onClick={handleMainAction}
                // Logic Priority:
                // 1. Admin: Always enabled (Manage)
                // 2. Guest: Always enabled (Login)
                // 3. Student (Already Booked): Always enabled (Cancel)
                // 4. Student (Unpaid): DISABLED (Stop here)
                // 5. Student (Window Closed): DISABLED
                // 6. Student (Full): DISABLED
                disabled={
                    !isAdmin && !isGuest && !isBooked && (isUnpaid || !isBookingWindowOpen || isFull)
                }
                className={`w-full py-2 rounded-lg text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-1
                    ${isAdmin 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : isGuest
                            ? 'bg-zen-600 text-white hover:bg-zen-700'
                            : isBooked 
                                ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                                : isUnpaid
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed ring-1 ring-gray-300' // Distinct style for Unpaid
                                    : !isBookingWindowOpen
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : isFull
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-zen-600 text-white hover:bg-zen-700'
                    }`}
                title={isUnpaid ? "您的會員費用尚未繳納，無法預約。" : ""}
                >
                {isAdmin ? (
                    '管理'
                ) : isGuest ? (
                    <>
                        <LogIn size={14} />
                        登入以預約
                    </>
                ) : (
                    isBooked ? (
                        <>
                            <X size={14} />
                            取消
                        </>
                    ) : (
                        isUnpaid ? (
                            <>
                                <CreditCard size={14} />
                                未繳費
                            </>
                        ) :
                        !isBookingWindowOpen
                        ? '未開放 (限3天內)' 
                        : (isFull ? '額滿' : '預約')
                    )
                )}
            </button>
        </div>
      </div>
    </div>
  );
};
