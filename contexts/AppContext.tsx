
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
  getDocs
} from 'firebase/firestore';

// KEYS used for LocalStorage (Login persistence only)
const KEYS = {
  CURRENT_USER_ID: 'zenflow_current_user_id_v2'
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
  
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const students = allUsers.filter(u => u.role === UserRole.STUDENT);

  // --- FIRESTORE SYNCHRONIZATION ---

  // 1. Sync Classes
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'classes'), (snapshot) => {
        const data: ClassSession[] = snapshot.docs.map(doc => ({
            ...(doc.data() as Omit<ClassSession, 'id'>),
            id: doc.id
        }));
        setClasses(data);
    });
    return () => unsubscribe();
  }, []);

  // 2. Sync Instructors
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'instructors'), (snapshot) => {
        const data: Instructor[] = snapshot.docs.map(doc => ({
            ...(doc.data() as Omit<Instructor, 'id'>),
            id: doc.id
        }));
        setInstructors(data);
    });
    return () => unsubscribe();
  }, []);

  // 3. Sync Users
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const data: User[] = snapshot.docs.map(doc => ({
            ...(doc.data() as Omit<User, 'id'>),
            id: doc.id
        }));
        setAllUsers(data);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 4. Seeding: If DB is empty, populate with Mock Data
  useEffect(() => {
    const seedDatabase = async () => {
        if (isLoading) return;
        
        // Check if we have data. If arrays are empty after loading, we seed.
        // Note: This simple check relies on the fact that onSnapshot fires quickly.
        // A better production check would be getDocs() once.
        const classesRef = collection(db, 'classes');
        const snap = await getDocs(classesRef);
        
        if (snap.size === 0) {
            console.log("Seeding Database...");
            const batch = writeBatch(db);
            
            MOCK_INSTRUCTORS.forEach(i => {
                const ref = doc(db, 'instructors', i.id);
                batch.set(ref, i);
            });
            
            MOCK_CLASSES.forEach(c => {
                const ref = doc(db, 'classes', c.id);
                batch.set(ref, c);
            });
            
            MOCK_USERS.forEach(u => {
                const ref = doc(db, 'users', u.id);
                batch.set(ref, u);
            });
            
            await batch.commit();
            console.log("Database seeded successfully!");
        }
    };
    
    // Slight delay to ensure connection is established
    const timer = setTimeout(() => {
        seedDatabase().catch(console.error);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  // 5. Auth Persistence (Local Storage for ID only)
  useEffect(() => {
    const storedId = localStorage.getItem(KEYS.CURRENT_USER_ID);
    if (storedId && allUsers.length > 0) {
        const foundUser = allUsers.find(u => u.id === storedId);
        if (foundUser) {
            setCurrentUser(foundUser);
        }
    }
  }, [allUsers]);


  const getNextClassDate = (dayOfWeek: number, timeStr: string): Date => {
    const now = new Date();
    const result = new Date(now);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    result.setHours(hours, minutes, 0, 0);

    const currentDay = now.getDay() || 7; 
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
    const user = allUsers.find(user => user.username === u && user.password === p);
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

  // --- ACTIONS (FIRESTORE) ---

  const bookClass = async (classId: string, userId?: string) => {
    const targetUserId = userId || currentUser.id;
    const targetUser = allUsers.find(u => u.id === targetUserId);
    
    if (targetUser && targetUser.role === UserRole.STUDENT && !targetUser.hasPaid) {
        alert("⚠️ 預約失敗：尚未繳納會員費用。\n\n請聯繫管理員處理繳費事宜，謝謝。");
        return;
    }

    const classRef = doc(db, 'classes', classId);
    const currentClass = classes.find(c => c.id === classId);
    
    if (!currentClass) return;

    if (currentClass.enrolledUserIds.includes(targetUserId)) return;
    if (currentClass.enrolledUserIds.length >= currentClass.capacity) {
        alert("課程已額滿！");
        return;
    }

    await updateDoc(classRef, {
        enrolledUserIds: [...currentClass.enrolledUserIds, targetUserId]
    });
  };

  const cancelClass = async (classId: string, userId?: string) => {
    const targetUserId = userId || currentUser.id;
    const classRef = doc(db, 'classes', classId);
    const currentClass = classes.find(c => c.id === classId);

    if (currentClass) {
        await updateDoc(classRef, {
            enrolledUserIds: currentClass.enrolledUserIds.filter(id => id !== targetUserId)
        });
    }
  };

  const addClass = async (classData: Omit<ClassSession, 'id' | 'enrolledUserIds' | 'isSubstitute'>) => {
    const newClassData = {
      ...classData,
      dayOfWeek: Number(classData.dayOfWeek),
      capacity: Number(classData.capacity),
      enrolledUserIds: [],
      isSubstitute: false
    };
    // Let Firestore generate ID
    await addDoc(collection(db, 'classes'), newClassData);
  };

  const updateClass = async (id: string, updates: Partial<ClassSession>) => {
    const ref = doc(db, 'classes', id);
    const safeUpdates = { ...updates };
    if (updates.dayOfWeek) safeUpdates.dayOfWeek = Number(updates.dayOfWeek);
    if (updates.capacity) safeUpdates.capacity = Number(updates.capacity);
    await updateDoc(ref, safeUpdates);
  };

  const deleteClass = async (id: string) => {
    await deleteDoc(doc(db, 'classes', id));
  };

  const updateClassInstructor = async (classId: string, newInstructorId: string, notification?: string) => {
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
  };

  const addInstructor = (name: string, bio: string) => {
    // We return a temp ID, but Firestore is async. 
    // Ideally UI waits, but for this app structure we fire and forget.
    const newInstructor: Omit<Instructor, 'id'> = {
      name,
      bio,
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };
    addDoc(collection(db, 'instructors'), newInstructor);
    return ""; // Can't return ID immediately with addDoc easily without awaiting, UI handles reactivity
  };

  const deleteInstructor = async (id: string) => {
    const isAssigned = classes.some(c => c.instructorId === id);
    if (isAssigned) {
      alert("無法刪除目前正在授課的老師，請先更換該課程的老師。");
      return;
    }
    await deleteDoc(doc(db, 'instructors', id));
  };

  const addStudent = (studentData: Partial<User>) => {
    const newStudent: Omit<User, 'id'> = {
        name: studentData.name || '新學生',
        role: UserRole.STUDENT,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name || 'S')}&background=random`,
        username: studentData.username || `user${Math.floor(Math.random() * 1000)}`,
        password: studentData.password || '123456',
        hasPaid: studentData.hasPaid ?? false,
    };
    addDoc(collection(db, 'users'), newStudent);
    return "";
  };

  const updateStudent = async (id: string, updates: Partial<User>) => {
    await updateDoc(doc(db, 'users', id), updates);
  };

  const deleteStudent = async (id: string) => {
    // Remove student from all classes first (Client side logic for now, Cloud Function better)
    const updates = classes
        .filter(c => c.enrolledUserIds.includes(id))
        .map(c => updateDoc(doc(db, 'classes', c.id), {
            enrolledUserIds: c.enrolledUserIds.filter(uid => uid !== id)
        }));
    
    await Promise.all(updates);
    await deleteDoc(doc(db, 'users', id));
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
      isLoading
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
