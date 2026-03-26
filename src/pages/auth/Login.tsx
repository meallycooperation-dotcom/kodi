import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import "../../styles/index.css";


const Login = () => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        window.location.href = "/dashboard";
      }
    };

    checkUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) throw error;

      // ✅ success
      // alert("Login successful 🎉");

      // 👉 redirect to dashboard
      window.location.href = "/dashboard";

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Login to Kodi
        </h2>

        {/* EMAIL */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full mb-4 p-3 border rounded-lg"
          required
        />

        {/* PASSWORD */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full mb-6 p-3 border rounded-lg"
          required
        />

        {/* LOGIN BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* EXTRA LINKS */}
        <div className="text-center mt-4 text-sm">
          <p>
            Don’t have an account?{" "}
            <a href="/auth/signup" className="text-purple-600 font-semibold">
              Sign up
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;

