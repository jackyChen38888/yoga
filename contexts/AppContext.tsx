
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { AppState, ClassSession, Instructor, User, UserRole } from '../types';
import { db } from '../firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  writeBatch,
  getDocs,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';

// KEYS used for LocalStorage
const KEYS = {
  CURRENT_USER_ID: 'zenflow_current_user_id_v2',
  LOCAL_CLASSES: 'zenflow_local_classes_backup', // Fallback storage
  LOCAL_INSTRUCTORS: 'zenflow_local_instructors_backup',
  LOCAL_USERS: 'zenflow_local_users_backup'
};

// Mock Data (Used for initial seeding only)
const MOCK_INSTRUCTORS: Instructor[] = [
  { id: 'i1', name: 'Sarah Jenks', bio: '流動瑜伽專家', imageUrl: 'https://picsum.photos/100/100?random=1' },
  { id: 'i2', name: 'David Chen', bio: '哈達瑜伽與冥想', imageUrl: 'https://picsum.photos/100/100?random=2' },
  { id: 'i3', name: 'Elena Rodriguez', bio: '力量瑜伽教練', imageUrl: 'https://picsum.photos/100/100?random=3' },
  { id: 'i4', name: 'Marcus Cole', bio: '修復瑜伽專門', imageUrl: 'https://picsum.photos/100/100?random=4' },
];

const MOCK_CLASSES: ClassSession[] = [
  {
    id: 'c1',
    title: '晨間喚醒流動',
    dayOfWeek: 1, 
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
    dayOfWeek: 3, 
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
    dayOfWeek: 5, 
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
    dayOfWeek: 6,
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

const MOCK_USERS: User[] = [
  { id: 'admin1', name: '教室經理', role: UserRole.ADMIN, avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=333&color=fff', username: 'admin', password: 'ooxx1234' },
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

  bookClass: (classId: string, userId?: string) => Promise<void>;
  cancelClass: (classId: string, userId?: string) => Promise<void>;
  
  addClass: (classData: Omit<ClassSession, 'id' | 'enrolledUserIds' | 'isSubstitute'>) => Promise<void>;
  updateClass: (id: string, updates: Partial<ClassSession>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;

  updateClassInstructor: (classId: string, newInstructorId: string, notification?: string) => void;
  addInstructor: (name: string, bio: string) => string;
  deleteInstructor: (id: string) => void;
  addStudent: (student: Partial<User>) => string;
  updateStudent: (id: string, updates: Partial<User>) => void;
  deleteStudent: (id: string) => void;
  getNextClassDate: (dayOfWeek: number, timeStr: string) => Date;
  
  isLoading: boolean;
  dataSource: 'firebase' | 'local'; // Debugging info
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'firebase' | 'local'>('firebase');

  const students = allUsers.filter(u => u.role === UserRole.STUDENT);

  // Helper: Save to LocalStorage (Backup)
  const saveToLocalBackup = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Local Backup Failed", e);
    }
  };

  // Helper: Load from LocalStorage (Backup)
  const loadFromLocalBackup = <T,>(key: string): T[] => {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  };

  // --- FIRESTORE SYNCHRONIZATION ---

  useEffect(() => {
    let unsubClasses: () => void;
    let unsubInstructors: () => void;
    let unsubUsers: () => void;

    try {
        unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot: QuerySnapshot<DocumentData>) => {
            const data: ClassSession[] = snapshot.docs.map(doc => ({
                ...(doc.data() as Omit<ClassSession, 'id'>),
                id: doc.id
            }));
            setClasses(data);
            setDataSource('firebase');
            saveToLocalBackup(KEYS.LOCAL_CLASSES, data);
        }, (error) => {
            console.error("Firestore Classes Error:", error);
            // Don't auto-fallback immediately if it's just a temporary network glitch, 
            // but if initial load fails, maybe. For now, stick to simple.
        });

        unsubInstructors = onSnapshot(collection(db, 'instructors'), (snapshot: QuerySnapshot<DocumentData>) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data() as any, id: doc.id }));
            setInstructors(data);
            saveToLocalBackup(KEYS.LOCAL_INSTRUCTORS, data);
        }, (error) => console.error(error));

        unsubUsers = onSnapshot(collection(db, 'users'), (snapshot: QuerySnapshot<DocumentData>) => {
             const data = snapshot.docs.map(doc => ({ ...doc.data() as any, id: doc.id }));
             setAllUsers(data);
             saveToLocalBackup(KEYS.LOCAL_USERS, data);
             setIsLoading(false);
        }, (error) => {
             console.error(error);
             setIsLoading(false);
        });

    } catch (e) {
        console.error("Firebase Init Failed:", e);
        // Fallback to local
        setClasses(loadFromLocalBackup(KEYS.LOCAL_CLASSES));
        setInstructors(loadFromLocalBackup(KEYS.LOCAL_INSTRUCTORS));
        setAllUsers(loadFromLocalBackup(KEYS.LOCAL_USERS));
        setIsLoading(false);
        setDataSource('local');
    }

    return () => {
        if (unsubClasses) unsubClasses();
        if (unsubInstructors) unsubInstructors();
        if (unsubUsers) unsubUsers();
    };
  }, []);

  // Seeding Logic
  useEffect(() => {
    const seedDatabase = async () => {
        if (isLoading) return;
        
        // Ensure admin exists locally or remotely
        const hasAdmin = allUsers.some(u => u.username === 'admin');
        
        if (!hasAdmin && allUsers.length === 0) {
            console.log("No users found. Seeding local defaults if DB is empty...");
            // Only seed locally if absolutely nothing exists
            // Since onSnapshot handles the "DB is empty" case by returning empty array,
            // we might want to prompt seeding or just leave it.
            // For this app, let's just make sure we can login.
        }
    };
    seedDatabase();
  }, [isLoading, allUsers.length]);

  // Auth Persistence
  useEffect(() => {
    const storedId = localStorage.getItem(KEYS.CURRENT_USER_ID);
    if (storedId && allUsers.length > 0) {
        const foundUser = allUsers.find(u => u.id === storedId);
        if (foundUser) setCurrentUser(foundUser);
    }
  }, [allUsers]);


  const getNextClassDate = (dayOfWeek: number, timeStr: string): Date => {
    const now = new Date();
    const result = new Date(now);
    const [hours, minutes] = timeStr.split(':').map(Number);
    result.setHours(hours, minutes, 0, 0);
    const currentDay = now.getDay() || 7; 
    let diffDays = dayOfWeek - currentDay;
    if (diffDays < 0) diffDays += 7;
    else if (diffDays === 0 && now.getTime() > result.getTime()) diffDays = 7;
    result.setDate(now.getDate() + diffDays);
    return result;
  };

  const login = (u: string, p: string) => {
    // Trim whitespace to handle accidental spaces
    const trimmedUsername = u.trim();
    const user = allUsers.find(user => user.username === trimmedUsername && user.password === p);
    if (user) {
        setCurrentUser(user);
        localStorage.setItem(KEYS.CURRENT_USER_ID, user.id);
        return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(GUEST_USER);
    localStorage.removeItem(KEYS.CURRENT_USER_ID);
  };

  // --- ACTIONS ---

  const bookClass = async (classId: string, userId?: string) => {
    const targetUserId = userId || currentUser.id;
    const targetUser = allUsers.find(u => u.id === targetUserId);
    
    if (targetUser && targetUser.role === UserRole.STUDENT && !targetUser.hasPaid) {
        alert("⚠️ 預約失敗：尚未繳納會員費用。");
        return;
    }

    try {
        const classRef = doc(db, 'classes', classId);
        const currentClass = classes.find(c => c.id === classId);
        if (currentClass && !currentClass.enrolledUserIds.includes(targetUserId)) {
             await updateDoc(classRef, {
                enrolledUserIds: [...currentClass.enrolledUserIds, targetUserId]
            });
        }
    } catch (error) {
        console.error("Book Error:", error);
        alert("預約失敗，請檢查網路連線。");
    }
  };

  const cancelClass = async (classId: string, userId?: string) => {
    const targetUserId = userId || currentUser.id;
    try {
        const classRef = doc(db, 'classes', classId);
        const currentClass = classes.find(c => c.id === classId);
        if (currentClass) {
            await updateDoc(classRef, {
                enrolledUserIds: currentClass.enrolledUserIds.filter(id => id !== targetUserId)
            });
        }
    } catch (error) {
        console.error("Cancel Error:", error);
    }
  };

  const addClass = async (classData: Omit<ClassSession, 'id' | 'enrolledUserIds' | 'isSubstitute'>) => {
    const isSub = (classData as any).isSubstitute;
    const dayNum = Number(classData.dayOfWeek);
    const validDay = isNaN(dayNum) ? 1 : dayNum;

    // Generate ID for consistency (though addDoc also does this)
    const newId = doc(collection(db, 'classes')).id;

    // CRITICAL FIX: Ensure NO undefined values are passed to Firestore
    const newClass: any = {
      id: newId,
      ...classData,
      dayOfWeek: validDay,
      capacity: Number(classData.capacity),
      enrolledUserIds: [],
      isSubstitute: isSub === true ? true : false,
      // Default to null if undefined, Firestore hates undefined
      originalInstructorId: (classData as any).originalInstructorId || null,
      notificationMessage: (classData as any).notificationMessage || null
    };

    console.log("Preparing to write to Firestore:", newClass);

    try {
        await setDoc(doc(db, 'classes', newId), newClass);
        console.log("✅ Successfully wrote to DB. Waiting for onSnapshot to update UI.");
    } catch (error) {
        console.error("❌ Firestore Write Failed:", error);
        alert(`新增失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  const updateClass = async (id: string, updates: Partial<ClassSession>) => {
    try {
        const ref = doc(db, 'classes', id);
        const safeUpdates = { ...updates };
        if (updates.dayOfWeek) safeUpdates.dayOfWeek = Number(updates.dayOfWeek);
        if (updates.capacity) safeUpdates.capacity = Number(updates.capacity);
        
        // Sanitize
        if (safeUpdates.originalInstructorId === undefined) delete safeUpdates.originalInstructorId;
        if (safeUpdates.notificationMessage === undefined) delete safeUpdates.notificationMessage;

        await updateDoc(ref, safeUpdates);
    } catch (error) {
        console.error("Update Failed:", error);
        alert("更新失敗");
    }
  };

  const deleteClass = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'classes', id));
    } catch (error) {
        console.error("Delete Failed:", error);
        alert("刪除失敗");
    }
  };

  const updateClassInstructor = async (classId: string, newInstructorId: string, notification?: string) => {
     try {
         const c = classes.find(item => item.id === classId);
         if (!c) return;
         const originalId = c.originalInstructorId || c.instructorId;
         const isReverting = originalId === newInstructorId;
         await updateDoc(doc(db, 'classes', classId), {
            originalInstructorId: originalId,
            instructorId: newInstructorId,
            isSubstitute: !isReverting,
            notificationMessage: notification || c.notificationMessage || ''
        });
     } catch(e) { 
         console.error(e);
     }
  };
  
  const addInstructor = (name: string, bio: string) => {
      const id = doc(collection(db, 'instructors')).id;
      const newInst = { id, name, bio, imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random` };
      
      try {
          setDoc(doc(db, 'instructors', id), newInst);
      } catch(e) {
          console.error(e);
      }
      return id;
  };

  const deleteInstructor = (id: string) => {
      try { deleteDoc(doc(db, 'instructors', id)); } catch(e) { console.error(e); }
  };

  const addStudent = (studentData: Partial<User>) => {
      const id = doc(collection(db, 'users')).id;
      const newStudent = {
            id,
            name: studentData.name || '新學生',
            role: UserRole.STUDENT,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name || 'S')}&background=random`,
            username: studentData.username || `user${Math.floor(Math.random() * 1000)}`,
            password: studentData.password || '123456',
            hasPaid: studentData.hasPaid ?? false,
      };
      
      try {
          setDoc(doc(db, 'users', id), newStudent);
          console.log("Student added to DB:", id);
      } catch(e) {
          console.error("Add Student Failed:", e);
      }
      return id;
  };
  
  const updateStudent = (id: string, updates: Partial<User>) => {
      try { updateDoc(doc(db, 'users', id), updates); } catch(e) { console.error(e); }
  };
  
  const deleteStudent = (id: string) => {
      try { deleteDoc(doc(db, 'users', id)); } catch(e) { console.error(e); }
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
      getNextClassDate,
      isLoading,
      dataSource
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
