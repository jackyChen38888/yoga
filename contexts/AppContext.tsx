
import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { AppState, ClassSession, Instructor, User, UserRole } from '../types';

// Mock Data
const MOCK_INSTRUCTORS: Instructor[] = [
  { id: 'i1', name: 'Sarah Jenks', bio: '流動瑜伽專家', imageUrl: 'https://picsum.photos/100/100?random=1' },
  { id: 'i2', name: 'David Chen', bio: '哈達瑜伽與冥想', imageUrl: 'https://picsum.photos/100/100?random=2' },
  { id: 'i3', name: 'Elena Rodriguez', bio: '力量瑜伽教練', imageUrl: 'https://picsum.photos/100/100?random=3' },
  { id: 'i4', name: 'Marcus Cole', bio: '修復瑜伽專門', imageUrl: 'https://picsum.photos/100/100?random=4' },
];

// Weekly Schedule Mock Data
const MOCK_CLASSES: ClassSession[] = [
  {
    id: 'c1',
    title: '晨間喚醒流動',
    dayOfWeek: 1, // Monday
    startTimeStr: '08:00',
    durationMinutes: 60,
    instructorId: 'i1',
    capacity: 20,
    enrolledUserIds: ['student1', 'student2'],
    location: 'A 教室',
    difficulty: 'Intermediate',
    isSubstitute: false
  },
  {
    id: 'c2',
    title: '午間核心力量',
    dayOfWeek: 3, // Wednesday
    startTimeStr: '12:00',
    durationMinutes: 45,
    instructorId: 'i3',
    capacity: 15,
    enrolledUserIds: ['student3'],
    location: 'B 教室',
    difficulty: 'Advanced',
    isSubstitute: false
  },
  {
    id: 'c3',
    title: '日落舒緩修復',
    dayOfWeek: 5, // Friday
    startTimeStr: '18:30',
    durationMinutes: 75,
    instructorId: 'i4',
    capacity: 25,
    enrolledUserIds: [],
    location: 'A 教室',
    difficulty: 'Beginner',
    isSubstitute: false
  },
  {
    id: 'c4',
    title: '週末深度伸展',
    dayOfWeek: 6, // Saturday
    startTimeStr: '10:00',
    durationMinutes: 90,
    instructorId: 'i2',
    capacity: 20,
    enrolledUserIds: [],
    location: 'C 教室',
    difficulty: 'Beginner',
    isSubstitute: false
  }
];

const USERS: User[] = [
  { id: 'admin1', name: '教室經理', role: UserRole.ADMIN, avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=333&color=fff', username: 'admin', password: 'password' },
  { id: 'student1', name: '林小美', role: UserRole.STUDENT, avatarUrl: 'https://ui-avatars.com/api/?name=Alice&background=random', username: 'alice', password: '123', hasPaid: true },
  { id: 'student2', name: '陳志豪', role: UserRole.STUDENT, avatarUrl: 'https://ui-avatars.com/api/?name=Bob&background=random', username: 'bob', password: '123', hasPaid: false },
  { id: 'student3', name: '金泰亨', role: UserRole.STUDENT, avatarUrl: 'https://ui-avatars.com/api/?name=Charlie&background=random', username: 'charlie', password: '123', hasPaid: true },
  { id: 'student4', name: 'Diana Prince', role: UserRole.STUDENT, avatarUrl: 'https://ui-avatars.com/api/?name=Diana&background=random', username: 'diana', password: '123', hasPaid: true },
];

const GUEST_USER: User = {
    id: 'guest',
    name: '訪客',
    role: UserRole.GUEST,
    avatarUrl: 'https://ui-avatars.com/api/?name=Guest&background=eee&color=999',
    username: 'guest'
};

interface AppContextType extends AppState {
  login: (u: string, p: string) => boolean;
  logout: () => void;
  isLoginModalOpen: boolean;
  setLoginModalOpen: (isOpen: boolean) => void;

  bookClass: (classId: string, userId?: string) => void;
  cancelClass: (classId: string, userId?: string) => void;
  
  addClass: (classData: Omit<ClassSession, 'id' | 'enrolledUserIds' | 'isSubstitute'>) => void;
  updateClass: (id: string, updates: Partial<ClassSession>) => void;
  deleteClass: (id: string) => void;

  updateClassInstructor: (classId: string, newInstructorId: string, notification?: string) => void;
  addInstructor: (name: string, bio: string) => string;
  deleteInstructor: (id: string) => void;
  addStudent: (student: Partial<User>) => string;
  updateStudent: (id: string, updates: Partial<User>) => void;
  deleteStudent: (id: string) => void;
  getNextClassDate: (dayOfWeek: number, timeStr: string) => Date;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [classes, setClasses] = useState<ClassSession[]>(MOCK_CLASSES);
  const [instructors, setInstructors] = useState<Instructor[]>(MOCK_INSTRUCTORS);
  const [allUsers, setAllUsers] = useState<User[]>(USERS);

  const students = allUsers.filter(u => u.role === UserRole.STUDENT);

  const getNextClassDate = (dayOfWeek: number, timeStr: string): Date => {
    const now = new Date();
    const result = new Date(now);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    result.setHours(hours, minutes, 0, 0);

    const currentDay = now.getDay() || 7; // Convert Sunday 0 to 7
    let diffDays = dayOfWeek - currentDay;
    
    if (diffDays < 0) {
      diffDays += 7;
    } else if (diffDays === 0) {
      if (now.getTime() > result.getTime()) {
        diffDays = 7;
      }
    }

    result.setDate(now.getDate() + diffDays);
    return result;
  };

  // Auth Logic
  const login = (u: string, p: string) => {
    // Ensure we find the user in the latest allUsers state
    const user = allUsers.find(user => user.username === u && user.password === p);
    if (user) {
        setCurrentUser(user);
        return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(GUEST_USER);
  };

  const bookClass = (classId: string, userId?: string) => {
    const targetUserId = userId || currentUser.id;

    // VALIDATION: Check if user has paid
    // Retrieve the target user from the live allUsers list to ensure payment status is fresh
    const targetUser = allUsers.find(u => u.id === targetUserId);
    
    if (targetUser && targetUser.role === UserRole.STUDENT && !targetUser.hasPaid) {
        alert("⚠️ 預約失敗：尚未繳納會員費用。\n\n請聯繫管理員處理繳費事宜，謝謝。");
        return;
    }

    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        if (c.enrolledUserIds.includes(targetUserId)) return c;
        if (c.enrolledUserIds.length >= c.capacity) {
          alert("課程已額滿！");
          return c;
        }
        return { ...c, enrolledUserIds: [...c.enrolledUserIds, targetUserId] };
      }
      return c;
    }));
  };

  const cancelClass = (classId: string, userId?: string) => {
    const targetUserId = userId || currentUser.id;
    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        return { ...c, enrolledUserIds: c.enrolledUserIds.filter(id => id !== targetUserId) };
      }
      return c;
    }));
  };

  // Class CRUD
  const addClass = (classData: Omit<ClassSession, 'id' | 'enrolledUserIds' | 'isSubstitute'>) => {
    const newClass: ClassSession = {
      ...classData,
      dayOfWeek: Number(classData.dayOfWeek),
      capacity: Number(classData.capacity),
      // Use high precision timer + random to ensure unique IDs
      id: `class-${Date.now()}-${Math.floor(Math.random() * 10000)}-${performance.now().toString().replace('.','')}`,
      enrolledUserIds: [],
      isSubstitute: false
    };
    setClasses(prev => [...prev, newClass]);
  };

  const updateClass = (id: string, updates: Partial<ClassSession>) => {
    setClasses(prev => prev.map(c => {
        if (c.id === id) {
            return {
                ...c,
                ...updates,
                dayOfWeek: updates.dayOfWeek !== undefined ? Number(updates.dayOfWeek) : c.dayOfWeek,
                capacity: updates.capacity !== undefined ? Number(updates.capacity) : c.capacity,
            };
        }
        return c;
    }));
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const updateClassInstructor = (classId: string, newInstructorId: string, notification?: string) => {
    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        const originalId = c.originalInstructorId || c.instructorId;
        const isReverting = originalId === newInstructorId;

        return {
          ...c,
          originalInstructorId: originalId,
          instructorId: newInstructorId,
          isSubstitute: !isReverting,
          notificationMessage: notification || c.notificationMessage
        };
      }
      return c;
    }));
  };

  const addInstructor = (name: string, bio: string) => {
    const newId = `inst-${Date.now()}`;
    const newInstructor: Instructor = {
      id: newId,
      name,
      bio,
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };
    setInstructors(prev => [...prev, newInstructor]);
    return newId;
  };

  const deleteInstructor = (id: string) => {
    const isAssigned = classes.some(c => c.instructorId === id);
    if (isAssigned) {
      alert("無法刪除目前正在授課的老師，請先更換該課程的老師。");
      return;
    }
    setInstructors(prev => prev.filter(i => i.id !== id));
  };

  // Student Management
  const addStudent = (studentData: Partial<User>) => {
    const newId = `student-${Date.now()}`;
    const newStudent: User = {
        id: newId,
        name: studentData.name || '新學生',
        role: UserRole.STUDENT,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name || 'S')}&background=random`,
        username: studentData.username || `user${Math.floor(Math.random() * 1000)}`,
        password: studentData.password || '123456',
        hasPaid: studentData.hasPaid ?? false,
    };
    setAllUsers(prev => [...prev, newStudent]);
    return newId;
  };

  const updateStudent = (id: string, updates: Partial<User>) => {
    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    
    // Also update current user if it matches, to reflect changes in UI immediately
    if (currentUser.id === id) {
        setCurrentUser(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteStudent = (id: string) => {
    setClasses(prev => prev.map(c => ({
        ...c,
        enrolledUserIds: c.enrolledUserIds.filter(uid => uid !== id)
    })));
    setAllUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      classes,
      instructors,
      students,
      login,
      logout,
      isLoginModalOpen,
      setLoginModalOpen,
      bookClass,
      cancelClass,
      addClass,
      updateClass,
      deleteClass,
      updateClassInstructor,
      addInstructor,
      deleteInstructor,
      addStudent,
      updateStudent,
      deleteStudent,
      getNextClassDate
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
