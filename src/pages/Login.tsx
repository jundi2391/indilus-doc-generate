import React, { useState } from 'react';
import { useCompany } from '../CompanyContext';
import { Landmark, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { IncoreLogo } from '../components/IncoreLogo';

export default function Login() {
    const { login } = useCompany();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error("Username dan password wajib diisi");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const success = await login(username, password);
            if (success) {
                toast.success("Login berhasil! Selamat datang.");
                // Redirect will happen automatically as React re-renders with authenticated state
            } else {
                setError("Username atau password salah. Silakan coba lagi.");
                toast.error("Credential tidak cocok");
            }
        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan sistem.");
            toast.error("Gagal melakukan login");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F7FE] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-primary/10">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-white rounded-3xl shadow-md border border-slate-100 flex items-center justify-center">
                        <IncoreLogo className="h-12 w-auto" />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                    Masuk ke Sistem
                </h2>
                <p className="mt-2.5 text-xs text-slate-400 font-semibold tracking-normal px-4">
                    Pencatatan invoice, delivery order, dan purchase order terintegrasi.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[420px]">
                <div className="bg-white py-10 px-8 sm:rounded-[2.5rem] border border-slate-150/60 shadow-[s_8px_30px_rgb(0,0,0,0.015)] space-y-6">
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-rose-700 leading-normal">{error}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300"
                                    placeholder="Username admin / unit bisnis"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-450 hover:text-slate-700 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-primary hover:bg-primary/95 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "Masuk"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                
                <div className="text-center mt-8">
                    <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black">
                        Powered by Indilus
                    </p>
                </div>
            </div>
        </div>
    );
}
