
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { X, LogIn, User, Lock, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (success) {
        setError('');
        setUsername('');
        setPassword('');
        onClose();
    } else {
        setError('帳號或密碼錯誤');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
            <X size={24} />
        </button>

        <div className="p-8">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-zen-50 text-zen-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogIn size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">歡迎回來</h2>
                <p className="text-gray-500 text-sm mt-1">請登入您的帳號以管理預約</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">帳號</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zen-500 focus:bg-white focus:outline-none transition-all text-gray-900"
                            placeholder="請輸入帳號"
                            autoFocus
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">密碼</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zen-500 focus:bg-white focus:outline-none transition-all text-gray-900 font-mono text-sm"
                            placeholder="請輸入密碼"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-zen-600 text-white font-bold py-3.5 rounded-xl hover:bg-zen-700 shadow-lg shadow-zen-200 transition-all mt-2 active:scale-95"
                >
                    登入
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 mb-2">測試帳號提示：</p>
                <div className="flex justify-center gap-3 text-xs">
                    <code className="bg-gray-100 px-2 py-1 rounded text-gray-600">admin / password</code>
                    <code className="bg-gray-100 px-2 py-1 rounded text-gray-600">alice / 123</code>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
