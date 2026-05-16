"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import ConfirmationPopup from "../components/ConfirmationPopup";

export default function CreateAccount() {
  const router = useRouter();
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    telephone: "",
    address: "",
    bio: "",
    role: "student",
    profile_image: "/profile/defaultProfile.webp",
  });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentData, setStudentData] = useState({ name: "", class: "" });
  const [teacherData, setTeacherData] = useState({ name: "", faculty: "" });
  const [assistantData, setAssistantData] = useState({
    name: "",
    department: "",
  });

  const isFormValid =
    userData.username &&
    userData.email &&
    password &&
    confirmPassword &&
    password === confirmPassword &&
    (userData.role === "student"
      ? studentData.name && studentData.class
      : userData.role === "teacher"
      ? teacherData.name && teacherData.faculty
      : userData.role === "assistant"
      ? assistantData.name && assistantData.department
      : true);

  useEffect(() => {
    return () => {
      if (profilePicture?.preview) {
        URL.revokeObjectURL(profilePicture.preview);
      }
    };
  }, [profilePicture]);

  useEffect(() => {
    setStudentData({ name: "", class: "" });
    setTeacherData({ name: "", faculty: "" });
    setAssistantData({ name: "", department: "" });
  }, [userData.role]);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture({
        preview: URL.createObjectURL(file),
        file,
      });
    }
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(userData).forEach(([key, value]) =>
      formData.append(key, value)
    );
    formData.append("password", password);

    switch (userData.role) {
      case "student":
        formData.append("studentName", studentData.name);
        formData.append("className", studentData.class);
        break;
      case "teacher":
        formData.append("teacherName", teacherData.name);
        formData.append("faculty", teacherData.faculty);
        break;
      case "assistant":
        formData.append("assistantName", assistantData.name);
        formData.append("department", assistantData.department);
        break;
    }

    if (profilePicture?.file) {
      formData.append("profile_image", profilePicture.file);
    }

    try {
      const res = await fetch("/api/createAccount", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(result.message || "Registration failed");
      }

      alert("Account created successfully!");
      router.push("/lmsMainPageAdmin");
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!isFormValid) {
      setError("Please fill out all required fields correctly.");
      return;
    }

    setShowConfirmModal(true);
  };

  const renderRoleSpecificFields = () => {
    switch (userData.role) {
      case "student":
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block mb-1 font-medium">Student Name:</label>
              <input
                type="text"
                value={studentData.name}
                onChange={(e) =>
                  setStudentData({ ...studentData, name: e.target.value })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Class:</label>
              <input
                type="text"
                value={studentData.class}
                onChange={(e) =>
                  setStudentData({ ...studentData, class: e.target.value })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
          </div>
        );
      case "teacher":
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block mb-1 font-medium">Teacher Name:</label>
              <input
                type="text"
                value={teacherData.name}
                onChange={(e) =>
                  setTeacherData({ ...teacherData, name: e.target.value })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Faculty:</label>
              <input
                type="text"
                value={teacherData.faculty}
                onChange={(e) =>
                  setTeacherData({ ...teacherData, faculty: e.target.value })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
          </div>
        );
      case "assistant":
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block mb-1 font-medium">Assistant Name:</label>
              <input
                type="text"
                value={assistantData.name}
                onChange={(e) =>
                  setAssistantData({ ...assistantData, name: e.target.value })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Department:</label>
              <input
                type="text"
                value={assistantData.department}
                onChange={(e) =>
                  setAssistantData({
                    ...assistantData,
                    department: e.target.value,
                  })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header title="Create Account" />
      <main className="flex-grow p-8 flex justify-center items-center bg-gradient-to-b from-[#a9c3d2] to-[#fcf4e7]">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
        >
          {error && (
            <div className="text-red-500 mb-4 text-center">{error}</div>
          )}

          <div className="mb-4 text-center">
            <img
              src={profilePicture?.preview || "/profile/defaultProfile.webp"}
              alt="Profile Preview"
              className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100"
            />
          </div>

          {[
            { label: "Username", name: "username", type: "text" },
            { label: "Email", name: "email", type: "email" },
            { label: "Telephone", name: "telephone", type: "tel" },
            { label: "Address", name: "address", type: "text" },
          ].map(({ label, name, type }) => (
            <div key={name} className="mb-4">
              <label className="block mb-1 font-medium">{label}:</label>
              <input
                type={type}
                value={userData[name]}
                onChange={(e) =>
                  setUserData({ ...userData, [name]: e.target.value })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                required={name === "username" || name === "email"}
              />
            </div>
          ))}

          <div className="mb-4">
            <label className="block mb-1 font-medium">Role:</label>
            <select
              value={userData.role}
              onChange={(e) =>
                setUserData({ ...userData, role: e.target.value })
              }
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="assistant">Assistant</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>

          {renderRoleSpecificFields()}

          <div className="mb-4">
            <label className="block mb-1 font-medium">Bio:</label>
            <textarea
              value={userData.bio}
              onChange={(e) =>
                setUserData({ ...userData, bio: e.target.value })
              }
              className="w-full border p-2 rounded h-24 focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Password:</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-2 rounded pr-10 focus:ring-2 focus:ring-blue-300"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-1 font-medium">Confirm Password:</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border p-2 rounded pr-10 focus:ring-2 focus:ring-blue-300"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 text-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 mt-8">
            <Button
              text={isSubmitting ? "Creating..." : "Create Account"}
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="text-slate-950 bg-blue-300 hover:bg-indigo-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-indigo-950 active:text-white active:border-indigo-400 py-2 rounded w-42"
            />
            <Button
              text="Cancel"
              type="button"
              onClick={() => router.push("/lmsMainPageAdmin")}
              className="text-slate-950 bg-red-300 hover:bg-rose-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-pink-800 active:text-white active:border-rose-400 py-2 rounded w-28"
            />
          </div>
        </form>
      </main>

      {showConfirmModal && (
        <ConfirmationPopup
          title="Confirm Account Creation"
          message="Are you sure you want to create this account?"
          onConfirm={handleConfirmedSubmit}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      <Footer />
    </div>
  );
}
