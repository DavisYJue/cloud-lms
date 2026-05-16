"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import ConfirmationPopup from "../components/ConfirmationPopup";

const EditCourse = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");
  const [courseData, setCourseData] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null });
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseImage, setCourseImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [courseVisibility, setCourseVisibility] = useState("public");

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const response = await fetch("/api/courses/getSelectedManage");
        if (!response.ok) throw new Error("Failed to fetch course data");

        const data = await response.json();
        initializeFormData(data);
        setCourseData(data);
      } catch (error) {
        console.error("Error fetching course:", error);
        setFormError("Failed to load course data");
        router.push("/manageMainPage");
      } finally {
        setLoading(false);
      }
    };

    const initializeFormData = (data) => {
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      setCourseTitle(data.course_title);
      setCourseDescription(data.course_description);
      setStartDate(formatDate(data.start_date));
      setEndDate(formatDate(data.end_date));
      setCourseVisibility(data.course_type);
    };

    fetchCourseData();
  }, [router]);

  const hasChanges = () => {
    if (!courseData) return false;

    const formatDate = (dateString) =>
      new Date(dateString).toISOString().split("T")[0];
    const originalStart = formatDate(courseData.start_date);
    const originalEnd = formatDate(courseData.end_date);
    const currentStart = formatDate(startDate);
    const currentEnd = formatDate(endDate);

    const imageChanged =
      (courseImage && courseImage !== courseData.course_image) ||
      (previewImage && previewImage !== courseData.course_image);

    return (
      courseTitle !== courseData.course_title ||
      courseDescription !== courseData.course_description ||
      currentStart !== originalStart ||
      currentEnd !== originalEnd ||
      courseVisibility !== courseData.course_type ||
      imageChanged
    );
  };

  useEffect(
    () => () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
    },
    [previewImage]
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCourseImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const validateForm = () => {
    if (!courseTitle || !startDate || !endDate) {
      setFormError("Title and dates are required");
      return false;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setFormError("End date cannot be before start date");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) return;

    if (hasChanges()) {
      setConfirmModal({ show: true, type: "save" });
    } else {
      handleUpdateConfirm();
    }
  };

  const handleUpdateConfirm = async () => {
    try {
      const formData = new FormData();
      formData.append("title", courseTitle);
      formData.append("description", courseDescription);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("visibility", courseVisibility);
      if (courseImage) formData.append("image", courseImage);

      const response = await fetch("/api/courses/edit", {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Update failed");
      }

      alert("Course updated successfully!");
      router.push("/manageMainPage");
    } catch (error) {
      console.error("Update error:", error);
      setFormError(error.message || "Failed to update course");
    } finally {
      setConfirmModal({ show: false, type: null });
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setConfirmModal({ show: true, type: "cancel" });
    } else {
      router.push("/manageMainPage");
    }
  };

  const handleModalConfirm = () => {
    if (confirmModal.type === "save") {
      handleUpdateConfirm();
    } else {
      router.push("/manageMainPage");
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#a9c3d2] to-[#fcf4e7]">
      <Header title="Edit Course Information" />

      <main className="max-w-3xl w-full mx-auto mt-6 mb-6 p-6 bg-white shadow-lg rounded-lg flex-1">
        <h2 className="text-2xl font-bold mb-4 text-slate-900">Edit Course</h2>

        {formError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold">
              Course Title
            </label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">
              Course Description
            </label>
            <textarea
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              className="w-full min-h-48 p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">
              Course Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {(previewImage || courseData?.course_image) && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">
                  {previewImage
                    ? "New image preview:"
                    : "Current image preview:"}
                </p>
                <a
                  href={previewImage || courseData.course_image}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={previewImage || courseData.course_image}
                    alt="Course"
                    className="w-48 h-auto border border-gray-300 rounded-md shadow-md"
                  />
                </a>
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">
              Course Duration
            </label>
            <div className="flex gap-4">
              <div>
                <label className="text-gray-600 text-sm">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="text-gray-600 text-sm">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">
              Course Visibility
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="public"
                  checked={courseVisibility === "public"}
                  onChange={() => setCourseVisibility("public")}
                  className="mr-2"
                />
                Public
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="private"
                  checked={courseVisibility === "private"}
                  onChange={() => setCourseVisibility("private")}
                  className="mr-2"
                />
                Private
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-2 justify-end">
            <Button
              type="submit"
              text="Update Course"
              className="px-4 py-2 text-slate-950 bg-emerald-200 hover:bg-green-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-green-900 active:text-white active:border-green-400"
            />
            <Button
              onClick={handleCancel}
              text="Cancel"
              className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 font-bold border-2 border-slate-900 active:bg-slate-900 active:border-stone-50 delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-100"
            />
          </div>
        </form>
      </main>

      {confirmModal.show && (
        <ConfirmationPopup
          title={
            confirmModal.type === "save" ? "Confirm Update" : "Confirm Cancel"
          }
          message={
            confirmModal.type === "save"
              ? "Are you sure you want to update this course?"
              : "You have unsaved changes. Are you sure you want to cancel?"
          }
          onConfirm={handleModalConfirm}
          onCancel={() => setConfirmModal({ show: false, type: null })}
        />
      )}

      <Footer />
    </div>
  );
};

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#a9c3d2] to-[#fcf4e7]">
    <Header title="Edit Course Information" />
    <main className="max-w-3xl w-full mx-auto mt-6 mb-6 p-6 bg-white shadow-lg rounded-lg flex-1">
      <p className="text-center">Loading course data...</p>
    </main>
    <Footer />
  </div>
);

export default EditCourse;
