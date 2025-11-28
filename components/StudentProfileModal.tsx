import React from 'react';
import { useApp } from '../contexts/AppContext';
import { X, User as UserIcon, CreditCard, Calendar, Trash2, MapPin } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const StudentProfileModal: React.FC<Props> = ({ onClose }) => {
  const { currentUser, classes, cancelClass, getNextClassDate, students } = useApp();

  // Get live student data to check payment status
  const liveStudentData = students.find(s => s.id === currentUser.id) || currentUser;
  const hasPaid = liveStudentData.hasPaid;

  // Get user's enrolled classes
  const myClasses = classes.filter(c => c.enrolledUserIds.includes(currentUser.id));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-zen-600 p-6 text-white relative">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
            >
                <X size={20} />
            </button>
            
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg overflow-hidden bg-white">
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover"/>
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                    <p className="text-zen-100 text-sm font-medium">@{currentUser.username}</p>
                    <div className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${hasPaid ? 'bg-white text-zen-700' : 'bg-red-500 text-white'}`}>
                        <CreditCard size={12} />
                        {hasPaid ? '正式會員 (已繳費)' : '會員費未繳'}
                    </div>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="p-0 overflow-y-auto flex-1 bg-gray-50">
            
            <div className="p-6">
                <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                    <Calendar className="text-zen-600" size={20} />
                    我的預約課程 ({myClasses.length})
                </h3>

                {myClasses.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-400 text-sm mb-2">目前沒有預約任何課程</p>
                        <button onClick={onClose} className="text-zen-600 font-bold text-sm hover:underline">
                            去逛逛課表
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {myClasses.map(session => {
                            const nextDate = getNextClassDate(session.dayOfWeek, session.startTimeStr);
                            const dayName = ['週日','週一','週二','週三','週四','週五','週六'][nextDate.getDay()];
                            
                            return (
                                <div key={session.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-zen-100 text-zen-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                    {dayName} {session.startTimeStr}
                                                </span>
                                                <span className="text-gray-400 text-xs">
                                                    {nextDate.toLocaleDateString('zh-TW', {month:'numeric', day:'numeric'})}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-gray-800 text-lg">{session.title}</h4>
                                            <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                                                <MapPin size={12}/> {session.location}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => cancelClass(session.id)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="取消預約"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};