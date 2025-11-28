
import React, { useState } from 'react';
import { ClassSession, Instructor } from '../types';
import { useApp } from '../contexts/AppContext';
import { generateSubstitutionNotification } from '../services/geminiService';
import { X, RefreshCw, Wand2, Check, UserMinus, UserPlus, Trash2, Plus, Users, UserCog } from 'lucide-react';

interface Props {
  session: ClassSession;
  instructor: Instructor;
  onClose: () => void;
}

type Tab = 'INSTRUCTOR' | 'STUDENTS';

export const AdminManageModal: React.FC<Props> = ({ session, instructor, onClose }) => {
  // Get classes from context to ensure we have live data
  const { instructors, students, classes, updateClassInstructor, bookClass, cancelClass, addInstructor, deleteInstructor, addStudent } = useApp();
  
  // Find the latest version of this session from the global state
  const currentSession = classes.find(c => c.id === session.id) || session;

  const [activeTab, setActiveTab] = useState<Tab>('INSTRUCTOR');
  
  // Instructor State
  const [selectedInstructorId, setSelectedInstructorId] = useState(instructor.id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<string | undefined>(currentSession.notificationMessage);
  
  // New Instructor State
  const [isAddingInstructor, setIsAddingInstructor] = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newInstBio, setNewInstBio] = useState('');

  // Student State
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<string>('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  const selectedInstructor = instructors.find(i => i.id === selectedInstructorId);
  const isChanged = selectedInstructorId !== currentSession.instructorId;
  
  // Use currentSession for derived lists to ensure they react to changes
  const enrolledStudents = students.filter(s => currentSession.enrolledUserIds.includes(s.id));
  const availableStudents = students.filter(s => !currentSession.enrolledUserIds.includes(s.id));

  const handleGenerate = async () => {
    if (!selectedInstructor || !isChanged) return;
    
    setIsGenerating(true);
    try {
        const daysMap = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        // dayOfWeek 1=Monday (index 1), 7=Sunday (index 7?? No, map expects 0-6 usually, but here:
        // Our dayOfWeek: 1=Mon, ..., 7=Sun.
        // Map: 0=Sun, 1=Mon...
        // Let's just do a simple switch or array lookup
        const dayName = currentSession.dayOfWeek === 7 ? '週日' : daysMap[currentSession.dayOfWeek];
        const timeStr = `每${dayName} ${currentSession.startTimeStr}`;
        
        const msg = await generateSubstitutionNotification(
        currentSession.title,
        instructor.name,
        selectedInstructor.name,
        timeStr
        );
        
        setGeneratedMessage(msg);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSaveInstructor = () => {
    updateClassInstructor(currentSession.id, selectedInstructorId, generatedMessage);
    onClose();
  };

  const handleCreateInstructor = () => {
    if (newInstName && newInstBio) {
        const newId = addInstructor(newInstName, newInstBio);
        // Auto-select the newly created instructor
        setSelectedInstructorId(newId);
        setIsAddingInstructor(false);
        setNewInstName('');
        setNewInstBio('');
    }
  };

  const handleCreateStudent = () => {
    if (newStudentName) {
        // Quick add creates a student with defaults
        const newId = addStudent({ name: newStudentName });
        // Automatically select the new student for enrollment
        setSelectedStudentToAdd(newId);
        setIsAddingStudent(false);
        setNewStudentName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-zen-50">
          <div>
              <h2 className="text-xl font-bold text-gray-800">{currentSession.title}</h2>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">課程後台管理</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
            <button 
                onClick={() => setActiveTab('INSTRUCTOR')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'INSTRUCTOR' ? 'text-zen-600 border-b-2 border-zen-600 bg-zen-50/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <UserCog size={18} />
                管理老師
            </button>
            <button 
                onClick={() => setActiveTab('STUDENTS')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'STUDENTS' ? 'text-zen-600 border-b-2 border-zen-600 bg-zen-50/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Users size={18} />
                管理學生名單 ({currentSession.enrolledUserIds.length})
            </button>
        </div>

        <div className="p-0 overflow-y-auto flex-1 bg-gray-50/30">
          
          {/* --- INSTRUCTOR TAB --- */}
          {activeTab === 'INSTRUCTOR' && (
            <div className="p-6 space-y-6">
                
                {/* Current & Selection List */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">選擇授課老師</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {instructors.map(inst => (
                            <div 
                                key={inst.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                    selectedInstructorId === inst.id 
                                    ? 'border-zen-500 bg-zen-50 ring-1 ring-zen-500' 
                                    : 'border-gray-200 bg-white hover:border-zen-300'
                                }`}
                            >
                                <button
                                    onClick={() => setSelectedInstructorId(inst.id)}
                                    className="flex items-center gap-3 flex-1 text-left"
                                >
                                    <img src={inst.imageUrl} className="w-8 h-8 rounded-full object-cover" alt={inst.name}/>
                                    <div>
                                        <p className={`text-sm ${selectedInstructorId === inst.id ? 'font-bold text-zen-900' : 'font-medium text-gray-700'}`}>
                                            {inst.name}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate w-32 md:w-48">{inst.bio}</p>
                                    </div>
                                </button>
                                
                                <div className="flex items-center gap-2">
                                    {selectedInstructorId === inst.id && <Check size={18} className="text-zen-600 mr-2"/>}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteInstructor(inst.id); }}
                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        title="刪除老師"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Instructor Form */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        {!isAddingInstructor ? (
                            <button 
                                onClick={() => setIsAddingInstructor(true)}
                                className="flex items-center gap-2 text-sm font-medium text-zen-600 hover:text-zen-700"
                            >
                                <Plus size={16} />
                                新增老師
                            </button>
                        ) : (
                            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm transition-all duration-300">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">新老師資料</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <input 
                                        type="text" 
                                        placeholder="姓名" 
                                        value={newInstName}
                                        onChange={e => setNewInstName(e.target.value)}
                                        className="text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-zen-500/20 focus:border-zen-500 text-gray-900 bg-white"
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="簡介 / 專長" 
                                        value={newInstBio}
                                        onChange={e => setNewInstBio(e.target.value)}
                                        className="text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-zen-500/20 focus:border-zen-500 text-gray-900 bg-white"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => setIsAddingInstructor(false)}
                                        className="text-xs px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded"
                                    >
                                        取消
                                    </button>
                                    <button 
                                        onClick={handleCreateInstructor}
                                        disabled={!newInstName}
                                        className="text-xs px-3 py-1.5 bg-zen-600 text-white rounded hover:bg-zen-700 disabled:opacity-50"
                                    >
                                        建立並選擇
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Notification Section */}
                <div className={`p-4 bg-amber-50 rounded-xl border border-amber-100 transition-opacity ${!isChanged ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-amber-900 text-sm">通知學生</h4>
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !isChanged}
                            className="flex items-center gap-1 text-xs bg-amber-200 text-amber-900 px-3 py-1.5 rounded-full hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!isChanged ? "請先選擇一位新老師" : "使用 AI 產生訊息"}
                        >
                            {isGenerating ? <RefreshCw size={12} className="animate-spin"/> : <Wand2 size={12}/>}
                            AI 產生訊息
                        </button>
                    </div>
                    
                    <textarea
                        value={generatedMessage || ''}
                        onChange={(e) => setGeneratedMessage(e.target.value)}
                        placeholder="更換老師後可輸入通知訊息..."
                        className="w-full text-sm p-3 rounded-lg border-amber-200 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900"
                        rows={3}
                        disabled={!isChanged}
                    />
                </div>
            </div>
          )}

          {/* --- STUDENTS TAB --- */}
          {activeTab === 'STUDENTS' && (
             <div className="p-6">
                
                {/* Add Student Section */}
                <div className="mb-6">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select 
                                value={selectedStudentToAdd}
                                onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                                className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-zen-500"
                            >
                                <option value="">選擇學生加入...</option>
                                {availableStudents.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} {s.hasPaid ? '' : '(未繳費)'}</option>
                                ))}
                                {availableStudents.length === 0 && <option disabled>所有學生已加入</option>}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                        <button 
                            disabled={!selectedStudentToAdd}
                            onClick={() => {
                                if(selectedStudentToAdd) {
                                    bookClass(currentSession.id, selectedStudentToAdd);
                                    setSelectedStudentToAdd('');
                                }
                            }}
                            className="bg-zen-600 hover:bg-zen-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UserPlus size={18} />
                            <span className="hidden sm:inline">加入</span>
                        </button>
                    </div>

                    {/* Create New Student Toggle */}
                    <div className="mt-3">
                        {!isAddingStudent ? (
                             <button 
                                onClick={() => setIsAddingStudent(true)}
                                className="flex items-center gap-1 text-xs font-semibold text-zen-600 hover:text-zen-700 bg-white"
                             >
                                <Plus size={14} />
                                快速新增學生帳號
                             </button>
                        ) : (
                            <div className="flex items-center gap-2 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                <input 
                                    type="text"
                                    placeholder="學生姓名"
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    className="text-sm flex-1 border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zen-500 text-gray-900 bg-white"
                                    autoFocus
                                />
                                <button
                                    onClick={() => setIsAddingStudent(false)}
                                    className="text-gray-500 hover:text-gray-700 p-1.5"
                                >
                                    <X size={16} />
                                </button>
                                <button
                                    onClick={handleCreateStudent}
                                    disabled={!newStudentName.trim()}
                                    className="bg-zen-600 text-white text-xs px-3 py-1.5 rounded hover:bg-zen-700 disabled:opacity-50"
                                >
                                    新增
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enrolled List */}
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    已報名學生
                </h3>
                
                {enrolledStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        尚無學生報名。
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                        {enrolledStudents.map(student => (
                            <div key={student.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <img src={student.avatarUrl} alt={student.name} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <span className="font-medium text-gray-700 block">{student.name}</span>
                                        {!student.hasPaid && <span className="text-xs text-red-500 font-semibold">費用未繳</span>}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => cancelClass(currentSession.id, student.id)}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                                >
                                    <UserMinus size={16} />
                                    移除
                                </button>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition-colors"
            >
                關閉
            </button>
            {activeTab === 'INSTRUCTOR' && (
                <button 
                    onClick={handleSaveInstructor}
                    className="px-5 py-2.5 rounded-lg bg-zen-600 text-white font-bold hover:bg-zen-700 shadow-lg shadow-zen-200 transition-colors"
                >
                    儲存變更
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
