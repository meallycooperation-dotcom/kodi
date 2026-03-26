import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "../../styles/index.css";
const Signup = () => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        propertyType: "single",
        rents: [""],
        password: "",
        confirmPassword: "",
    });
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleRentChange = (index, value) => {
        const newRents = [...form.rents];
        newRents[index] = value;
        setForm({ ...form, rents: newRents });
    };
    const addRentField = () => {
        setForm({ ...form, rents: [...form.rents, ""] });
    };
    const removeRentField = (index) => {
        const newRents = form.rents.filter((_, i) => i !== index);
        setForm({ ...form, rents: newRents });
    };
    const handlePropertyTypeChange = (value) => {
        if (value === "single") {
            setForm({ ...form, propertyType: value, rents: [""] });
        }
        else {
            setForm({ ...form, propertyType: value, rents: ["", ""] });
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form submitted", form);
        if (form.password !== form.confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        try {
            setLoading(true);
            console.log("Starting signup process...");
            // 🔐 1. SIGN UP USER
            const { data, error } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
            });
            console.log("Signup response:", { data, error });
            if (error)
                throw error;
            const user = data.user;
            if (!user)
                throw new Error("User not created");
            console.log("User created:", user);
            // 🧠 2. UPDATE PROFILE (name)
            const profileResult = await supabase
                .from("profiles")
                .update({ full_name: form.fullName })
                .eq("id", user.id)
                .select();
            console.log("Profile update result:", profileResult);
            // 🏠 3. SAVE RENT SETTINGS
            if (form.propertyType === "single") {
                await supabase.from("rent_settings").insert({
                    user_id: user.id,
                    rent_mode: "uniform",
                    default_rent: Number(form.rents[0]),
                });
            }
            else {
                await supabase.from("rent_settings").insert({
                    user_id: user.id,
                    rent_mode: "per_unit",
                });
            }
            // 🚀 OPTIONAL: create default property
            const { data: property } = await supabase
                .from("properties")
                .insert({
                user_id: user.id,
                name: "My Property",
            })
                .select()
                .single();
            // 🏢 4. CREATE UNITS IF MULTIPLE
            if (form.propertyType === "multiple" && property) {
                const units = form.rents.map((rent, index) => ({
                    property_id: property.id,
                    unit_number: `Unit ${index + 1}`,
                    rent_amount: Number(rent),
                }));
                await supabase.from("units").insert(units);
            }
            alert("Account created successfully 🎉");
            // 👉 redirect to login page
            window.location.href = "/auth/login";
        }
        catch (err) {
            alert(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-100", children: _jsxs("form", { onSubmit: handleSubmit, className: "bg-white p-8 rounded-2xl shadow-lg w-full max-w-md", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center", children: "Create Kodi Account" }), _jsx("input", { type: "text", name: "fullName", placeholder: "Full Name", value: form.fullName, onChange: handleChange, className: "w-full mb-4 p-3 border rounded-lg", required: true }), _jsx("input", { type: "email", name: "email", placeholder: "Email", value: form.email, onChange: handleChange, className: "w-full mb-4 p-3 border rounded-lg", required: true }), _jsxs("select", { value: form.propertyType, onChange: (e) => handlePropertyTypeChange(e.target.value), className: "w-full mb-4 p-3 border rounded-lg", children: [_jsx("option", { value: "single", children: "Single Property" }), _jsx("option", { value: "multiple", children: "Multiple Units" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "font-semibold block mb-2", children: "Rent Amount(s)" }), form.rents.map((rent, index) => (_jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("input", { type: "number", placeholder: `Rent ${index + 1}`, value: rent, onChange: (e) => handleRentChange(index, e.target.value), className: "flex-1 p-3 border rounded-lg", required: true }), form.propertyType === "multiple" && (_jsx("button", { type: "button", onClick: () => removeRentField(index), className: "bg-red-500 text-white px-3 rounded-lg", children: "X" }))] }, index))), form.propertyType === "multiple" && (_jsx("button", { type: "button", onClick: addRentField, className: "text-purple-600 text-sm mt-2", children: "+ Add another rent" }))] }), _jsx("input", { type: "password", name: "password", placeholder: "Password", value: form.password, onChange: handleChange, className: "w-full mb-4 p-3 border rounded-lg", required: true }), _jsx("input", { type: "password", name: "confirmPassword", placeholder: "Confirm Password", value: form.confirmPassword, onChange: handleChange, className: "w-full mb-6 p-3 border rounded-lg", required: true }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50", children: loading ? "Creating..." : "Sign Up" }), _jsx("div", { className: "text-center mt-4 text-sm", children: _jsxs("p", { children: ["Already have an account?", ' ', _jsx("a", { href: "/auth/login", className: "text-purple-600 font-semibold", children: "Login" })] }) })] }) }));
};
export default Signup;
