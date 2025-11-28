
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { User, ClassSession } from '../types';
import { X, Search, UserPlus, CreditCard, Lock, Trash2, AlertTriangle, User as UserIcon, Save, Calendar, Clock, MapPin } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const StudentDirectoryModal: React.FC<Props> = ({ onClose }) => {
  const { students, classes, addStudent, updateStudent, deleteStudent, cancelClass, getNextClassDate } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    username: '',
    password: '',
    hasPaid: false
  });

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  
  // Get classes the selected student is enrolled in
  const studentClasses = selectedStudentId 
    ? classes.filter(c => c.enrolledUserIds.includes(selectedStudentId))
    : [];

  const handleSelectStudent = (student: User) => {
    setSelectedStudentId(student.id);
    setIsCreating(false);
    setShowDeleteConfirm(false); // Reset confirmation
    setFormData({
        name: student.name,
        username: student.username,
        password: student.password,
        hasPaid: student.hasPaid
    });
  };

  const handleCreateNew = () => {
    setSelectedStudentId(null);
    setIsCreating(true);
    setShowDeleteConfirm(false);
    setFormData({
        name: '',
        username: '',
        password: 'password123',
        hasPaid: false
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.username) return;

    if (isCreating) {
        const newId = addStudent(formData);
        setSelectedStudentId(newId);
        setIsCreating(false);
    } else if (selectedStudentId) {
        updateStudent(selectedStudentId, formData);
    }
  };

  const handleDelete = () => {
    if (selectedStudentId) {
        deleteStudent(selectedStudentId);
        setSelectedStudentId(null);
        setShowDeleteConfirm(false);
        setFormData({ name: '', username: '', password: '', hasPaid: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden">
        
        {/* Left Sidebar: List */}
        <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <UserIcon size={20} className="text-zen-600"/>
                    學生名錄
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="搜尋學生..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-500 text-gray-900 bg-white"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <button 
                    onClick={handleCreateNew}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-zen-700 bg-zen-50 hover:bg-zen-100 border border-zen-200 transition-colors mb-2"
                >
                    <div className="w-8 h-8 rounded-full bg-zen-200 flex items-center justify-center">
                        <UserPlus size={16} />
                    </div>
                    <span className="font-medium text-sm">新增學生</span>
                </button>

                {filteredStudents.map(student => {
                    // Calculate enrolled count for list preview
                    const enrolledCount = classes.filter(c => c.enrolledUserIds.includes(student.id)).length;
                    
                    return (
                        <button
                            key={student.id}
                            onClick={() => handleSelectStudent(student)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                                selectedStudentId === student.id 
                                ? 'bg-white shadow-md ring-1 ring-gray-200 z-10' 
                                : 'hover:bg-gray-100'
                            }`}
                        >
                            <div className="relative">
                                <img src={student.avatarUrl} alt={student.name} className="w-10 h-10 rounded-full bg-gray-200" />
                                {!student.hasPaid && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" title="Unpaid"></div>
                                )}
                            </div>
                            <div className="overflow-hidden flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium text-gray-900 truncate">{student.name}</p>
                                    {enrolledCount > 0 && (
                                        <span className="bg-zen-100 text-zen-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {enrolledCount} 堂
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">@{student.username}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Right Content: Details */}
        <div className="flex-1 bg-white flex flex-col">
            <div className="flex justify-end p-4">
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
            </div>

            {(selectedStudentId || isCreating) ? (
                <div className="flex-1 overflow-y-auto px-12 pb-12">
                    <div className="flex items-center gap-4 mb-8">
                         <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 overflow-hidden">
                             {formData.name ? (
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`} alt="avatar" className="w-full h-full object-cover"/>
                             ) : (
                                <UserIcon size={40} />
                             )}
                         </div>
                         <div>
                             <h1 className="text-2xl font-bold text-gray-800">
                                {isCreating ? '建立新學生檔案' : '編輯學生資料'}
                             </h1>
                             <p className="text-gray-500 text-sm">
                                {isCreating ? '輸入資料以註冊新成員。' : `ID: ${selectedStudentId}`}
                             </p>
                         </div>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        
                        {/* Status Card */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CreditCard className="text-gray-500" size={20} />
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">繳費狀態</p>
                                    <p className="text-xs text-gray-500">是否已繳納會員費？</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setFormData({...formData, hasPaid: !formData.hasPaid})}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    formData.hasPaid 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                            >
                                {formData.hasPaid ? '已繳費 / 啟用' : '未繳費 / 停用'}
                            </button>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">姓名</label>
                                <input 
                                    type="text" 
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-zen-500 focus:outline-none font-medium text-gray-900"
                                    placeholder="例如：王小明"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">帳號 (登入 ID)</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="text" 
                                        value={formData.username || ''}
                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                        className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-zen-500 focus:outline-none text-gray-900"
                                        placeholder="username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">密碼</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="text" 
                                        value={formData.password || ''}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-zen-500 focus:outline-none font-mono text-sm text-gray-900"
                                        placeholder="密碼"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Enrolled Classes List (Only for existing students) */}
                        {!isCreating && selectedStudentId && (
                            <div className="pt-6 mt-6 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Calendar size={16} />
                                    已預約課程 ({studentClasses.length})
                                </h3>
                                
                                {studentClasses.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 text-center">
                                        此學生目前無任何預約。
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {studentClasses.map(cls => {
                                            const daysMap = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
                                            const nextDate = getNextClassDate(cls.dayOfWeek, cls.startTimeStr);
                                            const dayStr = cls.dayOfWeek === 7 ? '週日' : daysMap[cls.dayOfWeek];
                                            
                                            return (
                                                <div key={cls.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-zen-300 transition-colors">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-bold text-zen-700 bg-zen-50 px-2 py-0.5 rounded-full">
                                                                {dayStr} {cls.startTimeStr}
                                                            </span>
                                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                <Calendar size={10} />
                                                                {nextDate.toLocaleDateString('zh-TW', {month:'numeric', day:'numeric'})}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-800">{cls.title}</p>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                            <span className="flex items-center gap-1"><MapPin size={10}/> {cls.location}</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => cancelClass(cls.id, selectedStudentId)}
                                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                        title="取消此預約"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-8 flex items-center justify-between border-t border-gray-100 mt-8">
                            {!isCreating && (
                                showDeleteConfirm ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 text-sm font-medium hover:bg-gray-200"
                                        >
                                            取消
                                        </button>
                                        <button 
                                            onClick={handleDelete}
                                            className="px-4 py-2 rounded-lg text-white bg-red-600 text-sm font-medium hover:bg-red-700 flex items-center gap-2 shadow-md"
                                        >
                                            <AlertTriangle size={16} />
                                            確認刪除
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        永久刪除
                                    </button>
                                )
                            )}
                            <div className="flex gap-3 ml-auto">
                                {isCreating && (
                                     <button 
                                        onClick={() => setSelectedStudentId(null)} 
                                        className="px-6 py-2.5 rounded-xl text-gray-500 font-medium hover:bg-gray-100"
                                     >
                                        取消
                                     </button>
                                )}
                                <button 
                                    onClick={handleSave}
                                    disabled={!formData.name || !formData.username}
                                    className="bg-zen-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-zen-700 shadow-lg shadow-zen-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={18} />
                                    {isCreating ? '建立學生' : '儲存變更'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                    <UserIcon size={64} className="mb-4 text-gray-200" />
                    <p className="text-lg font-medium text-gray-400">請選擇一位學生以檢視詳情</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
