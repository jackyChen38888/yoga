import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { X, Save, Trash2, MapPin, Users, BarChart, AlertTriangle, Clock, Calendar, UserCheck } from 'lucide-react';

interface Props {
  classId?: string | null;
  initialDayOfWeek?: number; // New prop for pre-filling the day
  onClose: () => void;
}

// Helper for input groups using Flexbox for robust click handling
// This avoids absolute positioning overlaps which can block date/time pickers
const InputGroup = ({ label, icon: Icon, children }: { label: string, icon?: React.ElementType, children: React.ReactNode }) => (
  <div>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
      <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-zen-500 bg-white overflow-hidden transition-all hover:border-gray-400">
          {Icon && (
              <div className="pl-3 flex items-center justify-center text-gray-400 select-none">
                  <Icon size={16} />
              </div>
          )}
          <div className="flex-1 min-w-0">
              {children}
          </div>
      </div>
  </div>
);

export const ClassEditorModal: React.FC<Props> = ({ classId, initialDayOfWeek, onClose }) => {
  const { classes, addClass, updateClass, deleteClass, instructors } = useApp();
  
  // Find the live class object from context if ID is provided
  const existingClass = classId ? classes.find(c => c.id === classId) : undefined;
  
  const [formData, setFormData] = useState({
    title: '',
    dayOfWeek: 1, 
    startTimeStr: '10:00',
    durationMinutes: 60,
    instructorId: '',
    capacity: 20,
    location: 'A 教室',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    isSubstitute: false
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Populate form when existingClass is found, or reset for new
  useEffect(() => {
    if (existingClass) {
      setFormData({
        title: existingClass.title,
        dayOfWeek: existingClass.dayOfWeek,
        startTimeStr: existingClass.startTimeStr,
        durationMinutes: existingClass.durationMinutes,
        instructorId: existingClass.instructorId,
        capacity: existingClass.capacity,
        location: existingClass.location,
        difficulty: existingClass.difficulty,
        isSubstitute: existingClass.isSubstitute
      });
    } else {
       // Deep reset for new class
       setFormData({
            title: '',
            dayOfWeek: initialDayOfWeek || 1, // Use prop
            startTimeStr: '10:00',
            durationMinutes: 60,
            instructorId: instructors[0]?.id || '',
            capacity: 20,
            location: 'A 教室',
            difficulty: 'Beginner',
            isSubstitute: false
       });
    }
  }, [existingClass, initialDayOfWeek, instructors]); // Run whenever ID changes or modal opens for new day

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
        ...formData,
        // Ensure we handle the logic if marked as substitute manually
        originalInstructorId: formData.isSubstitute ? (existingClass?.originalInstructorId || existingClass?.instructorId) : undefined
    };

    if (existingClass) {
      updateClass(existingClass.id, submitData);
    } else {
      addClass(submitData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (existingClass) {
      deleteClass(existingClass.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">
            {existingClass ? '編輯每週課程' : '新增每週課程'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">課程名稱</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zen-500 outline-none text-gray-900 bg-white"
              placeholder="例如：晨間瑜伽"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputGroup label="星期" icon={Calendar}>
                <select
                  required
                  value={formData.dayOfWeek}
                  onChange={e => setFormData({...formData, dayOfWeek: parseInt(e.target.value, 10)})}
                  className="w-full p-2.5 bg-transparent outline-none text-gray-900 cursor-pointer [color-scheme:light]"
                >
                    <option value={1}>週一</option>
                    <option value={2}>週二</option>
                    <option value={3}>週三</option>
                    <option value={4}>週四</option>
                    <option value={5}>週五</option>
                    <option value={6}>週六</option>
                    <option value={7}>週日</option>
                </select>
            </InputGroup>
            
            <InputGroup label="時間" icon={Clock}>
                 <input 
                    required
                    type="time" 
                    value={formData.startTimeStr}
                    onChange={e => setFormData({...formData, startTimeStr: e.target.value})}
                    className="w-full p-2.5 bg-transparent outline-none text-gray-900 cursor-pointer [color-scheme:light]"
                  />
            </InputGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">時長 (分鐘)</label>
              <input 
                required
                type="number" 
                min="15"
                step="5"
                value={formData.durationMinutes}
                onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value)})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zen-500 outline-none text-gray-900 bg-white"
              />
            </div>
            <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">授課老師</label>
             <select 
                value={formData.instructorId}
                onChange={e => setFormData({...formData, instructorId: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zen-500 outline-none bg-white text-gray-900 cursor-pointer"
             >
                {instructors.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
             </select>
            </div>
          </div>
          
          {/* Substitute Toggle */}
          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-zen-300 transition-colors">
             <input 
                type="checkbox" 
                id="isSubstitute"
                checked={formData.isSubstitute}
                onChange={e => setFormData({...formData, isSubstitute: e.target.checked})}
                className="w-4 h-4 text-zen-600 rounded focus:ring-zen-500 border-gray-300 cursor-pointer"
             />
             <label htmlFor="isSubstitute" className="text-sm font-semibold text-gray-700 select-none cursor-pointer flex items-center gap-1.5 flex-1">
                <UserCheck size={16} className="text-zen-600" />
                標記為代課老師 (Substitute)
             </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <InputGroup label="人數限制" icon={Users}>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={formData.capacity}
                    onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    className="w-full p-2.5 bg-transparent outline-none text-gray-900"
                  />
             </InputGroup>
             <InputGroup label="地點" icon={MapPin}>
                  <select 
                    required
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full p-2.5 bg-transparent outline-none text-gray-900 cursor-pointer"
                  >
                    <option value="A 教室">A 教室</option>
                    <option value="B 教室">B 教室</option>
                    <option value="C 教室">C 教室</option>
                    <option value="D 教室">D 教室</option>
                    <option value="E 教室">E 教室</option>
                  </select>
             </InputGroup>
          </div>

          <InputGroup label="難度" icon={BarChart}>
                <select 
                    value={formData.difficulty}
                    onChange={e => setFormData({...formData, difficulty: e.target.value as any})}
                    className="w-full p-2.5 bg-transparent outline-none text-gray-900 cursor-pointer"
                >
                    <option value="Beginner">初學者</option>
                    <option value="Intermediate">中級</option>
                    <option value="Advanced">進階</option>
                </select>
          </InputGroup>

          <div className="pt-4 flex items-center justify-between">
            {existingClass ? (
               showDeleteConfirm ? (
                  <div className="flex gap-2">
                     <button 
                       type="button"
                       onClick={() => setShowDeleteConfirm(false)}
                       className="px-3 py-2 rounded-lg text-gray-600 bg-gray-100 text-sm font-medium hover:bg-gray-200 transition-colors"
                     >
                        取消
                     </button>
                     <button 
                       type="button"
                       onClick={handleDelete}
                       className="px-3 py-2 rounded-lg text-white bg-red-600 text-sm font-medium hover:bg-red-700 flex items-center gap-1 shadow-md transition-colors"
                     >
                        <AlertTriangle size={16} />
                        確認刪除
                     </button>
                  </div>
               ) : (
                  <button 
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-500 hover:bg-red-50 px-3 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Trash2 size={18} />
                    刪除課程
                  </button>
               )
            ) : (
                <div></div> // Spacer
            )}
            
            <button 
              type="submit"
              className="bg-zen-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-zen-700 shadow-lg shadow-zen-200 flex items-center gap-2 transition-transform active:scale-95"
            >
              <Save size={18} />
              {existingClass ? '儲存變更' : '建立課程'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};