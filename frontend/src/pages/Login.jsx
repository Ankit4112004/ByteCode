import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, NavLink } from "react-router";
import { loginUser } from "../authSlice";
import { motion } from "framer-motion";

import AnimatedBackground from "../components/ui/AnimatedBackground";
import CodeEditorAnimation from "../components/ui/CodeEditorAnimation";

/* ===================== VALIDATION ===================== */
const loginSchema = z.object({
  emailId: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/* ===================== ANIMATION VARIANTS ===================== */
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => dispatch(loginUser(data));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <AnimatedBackground />
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-screen px-6 md:px-24">
        
        {/* LEFT — FORM */}
        <div className="flex items-center justify-center md:justify-start md:pl-12 lg:pl-24">
          <motion.div 
            className="w-full max-w-sm space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={fadeInUp} className="select-none">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Byte<span className="text-indigo-500">Code</span>
              </h1>
              <p className="text-gray-400 mt-2 text-sm md:text-base">
                Log in to continue your coding journey.
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* SERVER / AUTH ERROR */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </motion.div>
              )}

              {/* EMAIL */}
              <motion.div variants={fadeInUp} className="space-y-2">
                <label className="text-sm font-medium text-gray-300 select-none">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="flex h-11 w-full rounded-md border border-white/10 bg-[#151515] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                  {...register("emailId")}
                />
                {errors.emailId && (
                  <p className="text-rose-400 text-xs font-medium">
                    {errors.emailId.message}
                  </p>
                )}
              </motion.div>

              {/* PASSWORD */}
              <motion.div variants={fadeInUp} className="space-y-2">
                <div className="flex items-center justify-between select-none">
                  <label className="text-sm font-medium text-gray-300">Password</label>
                  <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Forgot password?</a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="flex h-11 w-full rounded-md border border-white/10 bg-[#151515] px-3 py-2 pr-10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-rose-400 text-xs font-medium">
                    {errors.password.message}
                  </p>
                )}
              </motion.div>

              <motion.button
                variants={fadeInUp}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:pointer-events-none transition-all"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </div>
                ) : "Sign In"}
              </motion.button>
            </form>

            <motion.p variants={fadeInUp} className="text-sm text-gray-400 text-center md:text-left pt-2 select-none">
              Don't have an account?{" "}
              <NavLink to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Create one now
              </NavLink>
            </motion.p>
          </motion.div>
        </div>

        {/* RIGHT — CODE EDITOR */}
        <div className="hidden md:flex items-center justify-center opacity-80 perspective-1000">
          <motion.div 
            initial={{ opacity: 0, x: 50, rotateY: -10, rotateZ: 5 }}
            animate={{ opacity: 1, x: 0, rotateY: -5, rotateZ: 6 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="scale-[1.25] translate-x-10 shadow-2xl shadow-indigo-500/10 rounded-xl"
          >
            <CodeEditorAnimation />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
