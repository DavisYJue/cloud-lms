"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmationPopup from "./ConfirmationPopup";

const CourseCard = ({ course, onEnroll }) => {
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (course.isEnrolled) {
      try {
        await fetch("/api/courses/setSelected", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: course.course_id }),
        });

        router.push("/courseDetails");
      } catch (error) {
        console.error("Failed to set selected course:", error);
      }
    } else {
      setShowPopup(true);
    }
  };

  const confirmEnroll = () => {
    onEnroll(course.course_id);
    setShowPopup(false);
  };

  return (
    <div
      className="bg-white border-2 shadow-lg rounded-lg p-6 transition transform hover:scale-105 hover:shadow-2xl"
      style={{ width: "298px", flexGrow: 0 }}
    >
      <img
        src={course.imageUrl || "/courses/defaultCourseImage.jpg"}
        alt={course.title}
        className="h-40 w-full object-cover rounded mb-4"
      />
      <h3 className="font-semibold text-lg text-gray-800 mb-2 truncate">
        {course.title}
      </h3>
      <p className="text-sm text-gray-600 mb-4">{course.dateRange}</p>
      <button
        onClick={handleClick}
        className={`delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-100 border-2 w-full px-4 py-2 font-bold rounded-md ${
          course.isEnrolled
            ? "bg-blue-300 text-slate-950 border-slate-900 hover:bg-indigo-400 active:bg-indigo-950 active:text-white"
            : "bg-green-300 text-slate-950 border-green-900 hover:bg-green-400 active:bg-green-700 active:text-white"
        }`}
      >
        {course.isEnrolled ? "View Course" : "Enroll Course"}
      </button>

      {showPopup && (
        <ConfirmationPopup
          title="Enroll Confirmation"
          message={`Are you sure you want to enroll in "${course.title}"?`}
          onConfirm={confirmEnroll}
          onCancel={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default CourseCard;
