
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { UserRole, ClassSession } from '../types';
import { ClassCard } from '../components/ClassCard';
import { AdminManageModal } from '../components/AdminManageModal';
import { StudentDirectoryModal } from '../components/StudentDirectoryModal';
import { ClassEditorModal } from '../components/ClassEditorModal';
import { Users, PlusCircle, Calendar, Plus, Database, WifiOff, LayoutGrid, List } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { classes, instructors, currentUser, bookClass, cancelClass, getNextClassDate, dataSource } = useApp();
  
  // State for Admin Modal (Roster/Substitution)
  const [managingClassSession, setManagingClassSession] = useState<ClassSession | null>(null);
  
  // State for Class Editor (CRUD)
  const [isClassEditorOpen, setIsClassEditorOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [newClassDay, setNewClassDay] = useState<number>(1); 
  
  const [showStudentDirectory, setShowStudentDirectory] = useState(false);
  
  // VIEW MODE STATE: 'normal' or 'compact'
  const [viewMode, setViewMode] = useState<'normal' | 'compact'>('normal');

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

  const handleCreateClass = (dayId?: number) => {
    setEditingClassId(null);
    const today = new Date().getDay() || 7;
    setNewClassDay(dayId || today);
    setIsClassEditorOpen(true);
  };

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
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                {currentUser.role === UserRole.ADMIN ? '教室管理看板' : '課程預約'}
                {/* Debug Indicator */}
                {dataSource === 'local' && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full border border-red-200 flex items-center gap-1 font-mono">
                        <WifiOff size={10} /> 本地模式
                    </span>
                )}
            </h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2 text-sm">
                <Calendar size={16}/>
                {isStudent 
                    ? '每週固定課程表 (需於課程開始 48 小時前完成預約)。' 
                    : '管理每週固定課程、安排師資與學生資料。'}
            </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
             {/* View Mode Toggle */}
             <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex items-center">
                <button 
                    onClick={() => setViewMode('normal')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'normal' ? 'bg-zen-100 text-zen-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    title="標準檢視"
                >
                    <LayoutGrid size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('compact')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'compact' ? 'bg-zen-100 text-zen-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    title="精簡檢視 (更明瞭)"
                >
                    <List size={18} />
                </button>
             </div>

            {currentUser.role === UserRole.ADMIN && (
                <>
                    <button 
                        onClick={() => handleCreateClass()} 
                        className="flex items-center justify-center gap-2 bg-zen-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-zen-700 shadow-lg shadow-zen-200 transition-all text-sm"
                    >
                        <PlusCircle size={18} />
                        <span className="hidden sm:inline">排定新課程</span>
                        <span className="sm:hidden">新增</span>
                    </button>
                    <button 
                        onClick={() => setShowStudentDirectory(true)}
                        className="flex items-center justify-center gap-2 bg-white border border-gray-200 shadow-sm text-gray-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
                    >
                        <Users size={18} className="text-zen-600" />
                        <span className="hidden sm:inline">學生名錄</span>
                    </button>
                </>
            )}
        </div>
      </header>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-start">
        {days.map(day => {
            const visibleClasses = classes
                .filter(c => Number(c.dayOfWeek) === day.id)
                .sort((a, b) => a.startTimeStr.localeCompare(b.startTimeStr));

            return (
                <div key={day.id} className="flex flex-col min-h-[100px] bg-gray-50/50 rounded-xl border border-gray-100 shadow-sm relative">
                    {/* Header */}
                    <div className="bg-white p-2 border-b border-gray-100 flex items-center justify-center sticky top-16 z-10 rounded-t-xl shadow-sm h-10">
                        <span className="font-bold text-gray-800 text-sm">{day.name}</span>
                        {currentUser.role === UserRole.ADMIN && (
                            <button 
                                onClick={() => handleCreateClass(day.id)}
                                className="absolute right-2 text-zen-600 hover:bg-zen-50 p-1 rounded-full transition-colors"
                                title={`新增${day.name}課程`}
                            >
                                <Plus size={14} />
                            </button>
                        )}
                    </div>
                    
                    <div className={`p-2 flex-1 ${viewMode === 'compact' ? 'space-y-2' : 'space-y-3'}`}>
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
                                        isCompact={viewMode === 'compact'}
                                    />
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-gray-300 text-xs italic space-y-1">
                                <span>{isStudent ? '無' : '無課程'}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {managingClassSession && instructors.length > 0 && (
        <AdminManageModal 
            session={managingClassSession}
            instructor={instructors.find(i => i.id === managingClassSession.instructorId)!}
            onClose={() => setManagingClassSession(null)}
        />
      )}

      {isClassEditorOpen && (
        <ClassEditorModal 
            key={`editor-${isClassEditorOpen ? 'open' : 'closed'}-${editingClassId || 'new'}-${newClassDay}`}
            classId={editingClassId}
            initialDayOfWeek={newClassDay}
            onClose={() => setIsClassEditorOpen(false)}
        />
      )}

      {showStudentDirectory && (
        <StudentDirectoryModal onClose={() => setShowStudentDirectory(false)} />
      )}
    </div>
  );
};
