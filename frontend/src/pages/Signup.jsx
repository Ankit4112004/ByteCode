import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, NavLink } from "react-router";
import { registerUser } from "../authSlice";

import AnimatedBackground from "../components/AnimatedBackground";
import CodeEditorAnimation from "../components/CodeEditorAnimation";

/* ===================== VALIDATION ===================== */
const signupSchema = z.object({
  firstName: z.string().min(3, "Minimum 3 characters"),
  emailId: z.string().email("Invalid email"),
  password: z.string().min(8, "Password too weak"),
});

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((s) => s.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  // useEffect(() => {
  //   if (isAuthenticated) navigate("/");
  // }, [isAuthenticated, navigate]);

  useEffect(() => {
  if (isAuthenticated) {
    setTimeout(() => navigate("/"), 100);
  }
}, [isAuthenticated, navigate]);


  const onSubmit = (data) => dispatch(registerUser(data));

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <AnimatedBackground />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-screen px-24">
        {/* LEFT */}
        <div className="flex items-center justify-start pl-24">
          <div className="max-w-sm w-full space-y-6">
            <div>
              <h1 className="text-4xl font-bold">
                Byte<span className="text-indigo-500">Code</span>
              </h1>
              <p className="text-gray-400 mt-2">
                Practice • Compete • Improve
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* FIRST NAME */}
              <div>
                <input
                  placeholder="First Name"
                  className="w-full bg-transparent border-b border-white/30
                             placeholder-gray-500 text-white
                             focus:border-indigo-500 outline-none py-2"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <input
                  placeholder="Email"
                  className="w-full bg-transparent border-b border-white/30
                             placeholder-gray-500 text-white
                             focus:border-indigo-500 outline-none py-2"
                  {...register("emailId")}
                />
                {errors.emailId && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.emailId.message}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full bg-transparent border-b border-white/30
                             placeholder-gray-500 text-white
                             focus:border-indigo-500 outline-none py-2 pr-12"
                  {...register("password")}
                />

                {/* EYE ICON */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showPassword ? (
                    /* Eye Off */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    /* Eye */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>

                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 py-3 rounded-md font-medium hover:bg-indigo-700 transition"
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </button>
            </form>

            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <NavLink to="/login" className="text-indigo-400">
                Login
              </NavLink>
            </p>
          </div>
        </div>

        {/* RIGHT — CODE EDITOR */}
        <div className="hidden md:flex items-center justify-center opacity-70">
          <div className="transform rotate-[6deg] scale-[1.35] translate-x-20">
            <CodeEditorAnimation />
          </div>
        </div>
      </div>
    </div>
  );
}
