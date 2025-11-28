
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { UserRole, ClassSession } from '../types';
import { ClassCard } from '../components/ClassCard';
import { AdminManageModal } from '../components/AdminManageModal';
import { StudentDirectoryModal } from '../components/StudentDirectoryModal';
import { ClassEditorModal } from '../components/ClassEditorModal';
import { Users, PlusCircle, Calendar, Plus } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { classes, instructors, currentUser, bookClass, cancelClass, getNextClassDate } = useApp();
  
  // State for Admin Modal (Roster/Substitution)
  const [managingClassSession, setManagingClassSession] = useState<ClassSession | null>(null);
  
  // State for Class Editor (CRUD)
  const [isClassEditorOpen, setIsClassEditorOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [newClassDay, setNewClassDay] = useState<number>(1); // Default to Monday if not specified
  
  const [showStudentDirectory, setShowStudentDirectory] = useState(false);

  const handleClassAction = (session: ClassSession) => {
    if (currentUser.role === UserRole.ADMIN) {
      setManagingClassSession(session);
    } else {
      const isBooked = session.enrolledUserIds.includes(currentUser.id);
      if (isBooked) {
        cancelClass(session.id);
      } else {
        bookClass(session.id);
      }
    }
  };

  const handleEditClass = (sessionId: string) => {
    setEditingClassId(sessionId);
    setIsClassEditorOpen(true);
  };

  const handleCreateClass = (dayId: number = 1) => {
    setEditingClassId(null);
    setNewClassDay(dayId);
    setIsClassEditorOpen(true);
  };

  // Days of Week definition
  const days = [
    { id: 1, name: '週一' },
    { id: 2, name: '週二' },
    { id: 3, name: '週三' },
    { id: 4, name: '週四' },
    { id: 5, name: '週五' },
    { id: 6, name: '週六' },
    { id: 7, name: '週日' },
  ];

  const isStudent = currentUser.role === UserRole.STUDENT;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">
                {currentUser.role === UserRole.ADMIN ? '教室管理看板' : '課程預約'}
            </h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2 text-sm">
                <Calendar size={16}/>
                {isStudent 
                    ? '每週固定課程表 (需於課程開始 48 小時前完成預約)。' 
                    : '管理每週固定課程、安排師資與學生資料。'}
            </p>
        </div>
        
        {currentUser.role === UserRole.ADMIN && (
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button 
                    onClick={() => handleCreateClass(1)}
                    className="flex items-center justify-center gap-2 bg-zen-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-zen-700 shadow-lg shadow-zen-200 transition-all"
                >
                    <PlusCircle size={18} />
                    排定新課程
                </button>
                <button 
                    onClick={() => setShowStudentDirectory(true)}
                    className="flex items-center justify-center gap-2 bg-white border border-gray-200 shadow-sm text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                    <Users size={18} className="text-zen-600" />
                    學生名錄
                </button>
            </div>
        )}
      </header>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-start">
        {days.map(day => {
            // Display all classes for the week. We removed the strict "3-day only" filter
            // because in a Weekly Grid layout, hiding specific days makes the schedule look empty/broken.
            // Students can view the full week, but booking logic is handled in the ClassCard.
            const visibleClasses = classes
                .filter(c => c.dayOfWeek === day.id)
                .sort((a, b) => a.startTimeStr.localeCompare(b.startTimeStr));

            return (
                <div key={day.id} className="flex flex-col min-h-[120px] bg-gray-50/50 rounded-xl border border-gray-100 shadow-sm relative">
                    {/* Header */}
                    <div className="bg-white p-3 border-b border-gray-100 flex items-center justify-center sticky top-0 z-10 rounded-t-xl shadow-sm">
                        <span className="font-bold text-gray-800">{day.name}</span>
                        {currentUser.role === UserRole.ADMIN && (
                            <button 
                                onClick={() => handleCreateClass(day.id)}
                                className="absolute right-2 text-zen-600 hover:bg-zen-50 p-1 rounded-full transition-colors"
                                title={`新增${day.name}課程`}
                            >
                                <Plus size={16} />
                            </button>
                        )}
                    </div>
                    
                    <div className="p-2 space-y-3 flex-1">
                        {visibleClasses.length > 0 ? (
                            visibleClasses.map(session => {
                                const instructor = instructors.find(i => i.id === session.instructorId) || {
                                    id: 'unknown',
                                    name: 'Unknown',
                                    bio: '',
                                    imageUrl: 'https://via.placeholder.com/100'
                                };
                                return (
                                    <ClassCard 
                                        key={session.id} 
                                        session={session} 
                                        instructor={instructor}
                                        onAction={() => handleClassAction(session)}
                                        onEdit={() => handleEditClass(session.id)}
                                    />
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-gray-300 text-xs italic space-y-1">
                                <span>{isStudent ? '近期無' : '無課程'}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {/* Roster / Substitution Modal */}
      {managingClassSession && instructors.length > 0 && (
        <AdminManageModal 
            session={managingClassSession}
            instructor={instructors.find(i => i.id === managingClassSession.instructorId)!}
            onClose={() => setManagingClassSession(null)}
        />
      )}

      {/* Class CRUD Modal */}
      {isClassEditorOpen && (
        <ClassEditorModal 
            // CRITICAL FIX: Use a unique key to force React to destroy and recreate the modal
            // whenever it is opened or the target day changes. This ensures the form 
            // state (Day/Time) is completely reset and not stale.
            key={`editor-${isClassEditorOpen ? 'open' : 'closed'}-${editingClassId || 'new'}-${newClassDay}`}
            classId={editingClassId}
            initialDayOfWeek={newClassDay}
            onClose={() => setIsClassEditorOpen(false)}
        />
      )}

      {/* Student Directory */}
      {showStudentDirectory && (
        <StudentDirectoryModal onClose={() => setShowStudentDirectory(false)} />
      )}
    </div>
  );
};
