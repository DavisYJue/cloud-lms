"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import ConfirmationPopup from "../components/ConfirmationPopup";

export default function EditProfilePage() {
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
  const [originalData, setOriginalData] = useState(null);
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null });

  const hasUnsavedChanges = () => {
    if (!originalData) return false;
    const userDataChanged =
      userData.username !== originalData.username ||
      userData.email !== originalData.email ||
      userData.telephone !== originalData.telephone ||
      userData.address !== originalData.address ||
      userData.bio !== originalData.bio;
    const passwordChanged =
      changePassword &&
      (newPassword.trim() !== "" || confirmNewPassword.trim() !== "");
    const pictureChanged = profilePicture !== null;
    return userDataChanged || passwordChanged || pictureChanged;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const fetchedData = {
          username: data.username,
          email: data.email,
          telephone: data.telephone || "",
          address: data.address || "",
          bio: data.bio || "",
          role: data.role || "student",
          profile_image: data.profile_image || "/profile/defaultProfile.webp",
        };

        setUserData(fetchedData);
        setOriginalData(fetchedData);
      } catch (error) {
        console.error("Error fetching user:", error);
        setError(error.message);
        router.push("/?error=relogin");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const commitSave = async () => {
    setError("");

    if (changePassword) {
      if (!newPassword || !confirmNewPassword) {
        setError("Please fill in both password fields.");
        return;
      }

      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setError("New passwords don't match!");
        return;
      }
    }

    try {
      const formData = new FormData();

      formData.append("username", userData.username);
      formData.append("email", userData.email);
      formData.append("telephone", userData.telephone);
      formData.append("address", userData.address);
      formData.append("bio", userData.bio);

      if (changePassword) {
        formData.append("newPassword", newPassword);
        formData.append("confirmNewPassword", confirmNewPassword);
      }

      if (profilePicture?.file) {
        formData.append("profilePicture", profilePicture.file);
      }

      const response = await fetch("/api/user", {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save changes");
      }

      alert("Profile information updated successfully!");

      const role = originalData?.role || userData.role || "student";

      if (role === "student") {
        router.push("/lmsMainPageStudent");
      } else if (role === "administrator") {
        router.push("/lmsMainPageAdmin");
      } else {
        router.push("/lmsMainPage");
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (hasUnsavedChanges()) {
      setConfirmModal({ show: true, type: "save" });
    } else {
      commitSave();
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      setConfirmModal({ show: true, type: "cancel" });
    } else {
      const role = originalData?.role || userData.role || "student";

      if (role === "student") {
        router.push("/lmsMainPageStudent");
      } else if (role === "administrator") {
        router.push("/lmsMainPageAdmin");
      } else {
        router.push("/lmsMainPage");
      }
    }
  };

  const handleSaveModalConfirm = () => {
    setConfirmModal({ show: false, type: null });
    commitSave();
  };

  const handleCancelModalConfirm = () => {
    setConfirmModal({ show: false, type: null });
    const role = originalData?.role || userData.role || "student";

    if (role === "student") {
      router.push("/lmsMainPageStudent");
    } else if (role === "administrator") {
      router.push("/lmsMainPageAdmin");
    } else {
      router.push("/lmsMainPage");
    }
  };

  const handleModalCancel = () => {
    setConfirmModal({ show: false, type: null });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture({
        preview: URL.createObjectURL(file),
        file,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
        <p className="mt-4 text-gray-600">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header username={userData.username} title="Edit User Information" />
      <main
        className="flex-grow p-8 pt-13 flex flex-col items-center"
        style={{
          backgroundImage: "linear-gradient(to bottom, #a9c3d2, #fcf4e7)",
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
        >
          {error && (
            <div className="text-red-500 mb-4 text-center">{error}</div>
          )}

          <div className="mb-4 text-center">
            <img
              src={
                profilePicture?.preview ||
                userData.profile_image ||
                "/profile/defaultProfile.webp"
              }
              alt="Profile Preview"
              className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Username:</label>
              <input
                type="text"
                value={userData.username}
                onChange={(e) =>
                  setUserData({ ...userData, username: e.target.value })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300 bg-gray-200"
                readOnly
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Email:</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Telephone:</label>
              <input
                type="tel"
                value={userData.telephone}
                onChange={(e) =>
                  setUserData({ ...userData, telephone: e.target.value })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Address:</label>
              <input
                type="text"
                value={userData.address}
                onChange={(e) =>
                  setUserData({ ...userData, address: e.target.value })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Bio:</label>
              <textarea
                value={userData.bio}
                onChange={(e) =>
                  setUserData({ ...userData, bio: e.target.value })
                }
                className="w-full border p-2 rounded h-32 focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="pt-4 border-t">
              <label className="flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={changePassword}
                  onChange={() => setChangePassword(!changePassword)}
                  className="w-4 h-4"
                />
                Change Password
              </label>
              {changePassword && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block mb-2">New Password:</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border p-2 rounded pr-10 focus:ring-2 focus:ring-blue-300"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <FiEyeOff size={20} />
                        ) : (
                          <FiEye size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2">Confirm Password:</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full border p-2 rounded pr-10 focus:ring-2 focus:ring-blue-300"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <FiEyeOff size={20} />
                        ) : (
                          <FiEye size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 mt-8">
            <Button
              text="Save Changes"
              type="submit"
              className="text-slate-950 bg-blue-300 hover:bg-indigo-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-indigo-950 active:text-white active:border-indigo-400 py-2 rounded w-42"
            />
            <Button
              text="Cancel"
              type="button"
              onClick={handleCancel}
              className="text-slate-950 bg-red-300 hover:bg-rose-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-pink-800 active:text-white active:border-rose-400 py-2 rounded w-28"
            />
          </div>
        </form>

        {confirmModal.show && confirmModal.type === "save" && (
          <ConfirmationPopup
            title="Confirm Save"
            message="Are you sure you want to save the changes?"
            onConfirm={handleSaveModalConfirm}
            onCancel={handleModalCancel}
          />
        )}
        {confirmModal.show && confirmModal.type === "cancel" && (
          <ConfirmationPopup
            title="Confirm Cancel"
            message="You have unsaved changes. Are you sure you want to cancel? Your changes will not be saved."
            onConfirm={handleCancelModalConfirm}
            onCancel={handleModalCancel}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
