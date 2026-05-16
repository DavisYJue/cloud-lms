"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import ConfirmationPopup from "../components/ConfirmationPopup";

const EditAssignment = () => {
  const router = useRouter();
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await fetch("/api/courses/editAssignment");
        if (res.ok) {
          const data = await res.json();
          setAssignmentTitle(data.assignment_title);
          setAssignmentDescription(data.assignment_description);
          setDueDate(
            data.due_date
              ? new Date(data.due_date).toLocaleDateString("en-CA")
              : ""
          );

          setExistingFiles(data.files || []);
        }
      } catch (error) {
        console.error("Error fetching assignment:", error);
      }
    };
    fetchAssignment();
  }, []);

  const handleFileUpload = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmitClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    setShowConfirmation(false);

    if (!assignmentTitle || !assignmentDescription || !dueDate) return;

    const formData = new FormData();
    formData.append("assignment_title", assignmentTitle);
    formData.append("assignment_description", assignmentDescription);
    formData.append("due_date", dueDate);
    formData.append(
      "keep_existing_files",
      files.length === 0 ? "true" : "false"
    );

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await fetch("/api/courses/updateAssignment", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        alert("Assignment updated successfully!");
        router.push("/manageAssignment");
      } else {
        alert(`Update failed: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Failed to connect to server");
    } finally {
      setFiles([]);
    }
  };

  const handleCancelUpdate = () => {
    setShowConfirmation(false);
  };

  const isFormValid = assignmentTitle && assignmentDescription && dueDate;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#a9c3d2] to-[#fcf4e7]">
      <Header title="Edit Assignment" />

      <main className="flex-grow max-w-3xl w-full mx-auto mt-6 p-6 bg-white shadow-lg rounded-lg min-w-[300px]">
        <h2 className="text-2xl font-bold text-center text-slate-900">
          Edit Assignment
        </h2>

        <div className="mt-6 space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold">
              Assignment Title
            </label>
            <input
              type="text"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              placeholder="Enter Assignment Title"
              className="w-full p-2 border border-gray-300 rounded-md mt-2"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">
              Assignment Description
            </label>
            <textarea
              value={assignmentDescription}
              onChange={(e) => setAssignmentDescription(e.target.value)}
              placeholder="Enter Assignment Description"
              className="w-full min-h-65 p-2 border border-gray-300 rounded-md mt-2"
              rows="4"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mt-2"
            />
          </div>

          <div className="mt-4">
            <label className="block text-gray-700 font-semibold">
              Assignment Materials
            </label>

            {existingFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-gray-700 font-semibold">Current Files:</p>
                <ul className="list-disc pl-5">
                  {existingFiles.map((file, index) => (
                    <li key={`existing-${index}`} className="text-gray-700">
                      <a
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {file.split("/").pop()}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-2">
                <p className="text-gray-700 font-semibold">Files to Upload:</p>
                <ul className="list-disc pl-5">
                  {files.map((file, index) => (
                    <li key={`new-${index}`} className="text-gray-700">
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="w-full p-2 border border-gray-300 rounded-md mt-2"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleSubmitClick}
              text="Update Assignment"
              className="px-4 py-2 text-slate-950 bg-emerald-200 hover:bg-green-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-green-900 active:text-white active:border-green-400"
              disabled={!isFormValid}
            />
          </div>
        </div>
      </main>

      <div className="mt-auto p-4 flex justify-center w-full">
        <Button
          onClick={() => router.push("/manageAssignment")}
          text="Back to Course"
          className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 font-bold border-2 border-slate-900 active:bg-slate-900 active:border-stone-50 delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-100"
        />
      </div>

      {showConfirmation && (
        <ConfirmationPopup
          title="Confirm Update"
          message={
            files.length > 0
              ? "Are you sure you want to update this assignment and replace existing files?"
              : "Are you sure you want to update this assignment (keeping existing files)?"
          }
          onConfirm={handleConfirmUpdate}
          onCancel={handleCancelUpdate}
        />
      )}

      <Footer />
    </div>
  );
};

export default EditAssignment;
