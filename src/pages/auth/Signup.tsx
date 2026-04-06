import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import "../../styles/index.css";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const trimmedFullName = form.fullName.trim();
    const trimmedEmail = form.email.trim().toLowerCase();
    const sanitizedPhone = form.phoneNumber.replace(/[^+0-9]/g, '');

    const phoneRegex = /^\+?[0-9]{10,15}$/;

    if (!trimmedFullName) {
      alert("Full name is required");
      return;
    }

    if (!trimmedEmail) {
      alert("Email is required");
      return;
    }

    if (!phoneRegex.test(sanitizedPhone)) {
      alert("Phone number must be in international format (10-15 digits, optional leading +)");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: form.password,
      });

      if (error) throw error;
      const user = data.user;

      if (!user) throw new Error("Failed to create user");

      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        full_name: trimmedFullName,
        email: trimmedEmail,
        phone_number: sanitizedPhone,
      });

      if (profileError) throw profileError;

      alert("Account created successfully 🎉 Check your email for a confirmation link.");
      navigate('/auth/login');
    } catch (err: any) {
      alert(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Kodi Account</h2>

        {/* FULL NAME */}
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
          className="w-full mb-4 p-3 border rounded-lg"
          required
        />

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

        <input
          type="tel"
          name="phoneNumber"
          placeholder="Phone Number"
          value={form.phoneNumber}
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
          className="w-full mb-4 p-3 border rounded-lg"
          required
        />

        {/* CONFIRM PASSWORD */}
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <div className="auth-links">
          <p>
            Already have an account?{' '}
            <a href="/auth/login" className="auth-link">
              Login
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Signup;
