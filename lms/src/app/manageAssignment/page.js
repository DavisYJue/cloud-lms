"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import ConfirmationPopup from "../components/ConfirmationPopup";

const ManageAssignments = () => {
  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch("/api/user");
        if (!res.ok) throw new Error("Failed to fetch user role");
        const data = await res.json();
        setUserRole(data.role);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    const fetchAssignments = async () => {
      try {
        const res = await fetch("/api/courses/assignment");
        if (!res.ok) throw new Error("Failed to fetch assignments");
        const data = await res.json();

        const parsedData = data.map((a) => ({
          assignmentId: a.assignment_id,
          title: a.title,
          dueDate: new Date(a.due_date),
          submissions: a.submissions.map((s) => ({
            submissionId: s.submission_id,
            student: s.submitter,
            files: s.file_path
              ? s.file_path.split(",").map((p) => p.trim())
              : [],
            grade: s.grade ?? "",
            confirmed: s.confirmed,
            submissionTime: new Date(s.submission_time),
            role: s.role,
          })),
          notSubmitted: a.notSubmitted,
        }));

        setAssignments(parsedData);
      } catch (err) {
        console.error("Error fetching assignments:", err);
      }
    };

    fetchUserRole();
    fetchAssignments();
  }, []);

  const handleGradeChange = (ai, si, grade) => {
    if (grade >= 0 && grade <= 100) {
      setAssignments((prev) => {
        const next = [...prev];
        next[ai].submissions[si].grade = grade;
        return next;
      });
    }
  };

  const confirmGrade = async (ai, si) => {
    const updated = assignments[ai].submissions[si];
    if (updated.grade === "") return;

    setAssignments((prev) => {
      const next = [...prev];
      next[ai].submissions[si].confirmed = true;
      return next;
    });

    try {
      const res = await fetch("/api/courses/assignment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: updated.submissionId,
          new_grade: updated.grade,
          role: updated.role,
          confirmed: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm grade");
      console.log("Grade confirmed", data);
    } catch (err) {
      console.error("Error confirming grade:", err);
    }
  };

  const regrade = async (ai, si) => {
    const updated = assignments[ai].submissions[si];

    setAssignments((prev) => {
      const next = [...prev];
      next[ai].submissions[si].grade = "";
      next[ai].submissions[si].confirmed = false;
      return next;
    });

    try {
      const res = await fetch("/api/courses/assignment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: updated.submissionId,
          new_grade: "",
          role: updated.role,
          confirmed: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to regrade");
      console.log("Regrade successful", data);
    } catch (err) {
      console.error("Error regrading:", err);
    }
  };

  const handleEditInfo = async (assignmentId) => {
    await fetch("/api/courses/setAssignmentId", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId }),
    });
    router.push("/editAssignment");
  };

  const handleDeleteAssignment = async () => {
    try {
      const res = await fetch("/api/courses/deleteAssignment", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignment_id: selectedAssignmentId }),
      });
      const result = await res.json();

      if (res.ok) {
        setAssignments((prev) =>
          prev.filter((a) => a.assignmentId !== selectedAssignmentId)
        );
        alert("Assignment deleted successfully!");
      } else {
        alert(result.error || "Failed to delete assignment");
      }
    } catch (err) {
      console.error("Error deleting assignment:", err);
      alert("Server error occurred while deleting assignment.");
    } finally {
      setShowDeleteConfirm(false);
      setSelectedAssignmentId(null);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: "linear-gradient(to bottom, #a9c3d2, #fcf4e7)",
      }}
    >
      <Header title="Manage Course Assignment" />

      <main className="flex-grow w-full max-w-4xl mx-auto mt-6 p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-slate-900">
          Student Submissions
        </h2>

        <div className="flex justify-end gap-5 mt-6">
          <Button
            onClick={() => router.push("/addAssignment")}
            text="Add Assignment"
            className="px-4 py-2 text-slate-950 bg-emerald-200 hover:bg-green-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-green-900 active:text-white active:border-green-400"
          />
        </div>

        <div className="mt-6 space-y-6">
          {assignments.map((assignment, ai) => (
            <div
              key={assignment.assignmentId}
              className="p-4 border rounded-lg bg-gray-50"
            >
              <h3 className="text-xl font-semibold mb-3">{assignment.title}</h3>

              {assignment.submissions.length > 0 ? (
                <ul className="space-y-3">
                  {assignment.submissions.map((sub, si) => (
                    <li
                      key={sub.submissionId}
                      className="flex flex-wrap items-center justify-between p-3 shadow rounded-lg bg-gray-100"
                    >
                      <div className="w-1/4">
                        <p className="font-medium text-gray-700">
                          {sub.student}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            sub.submissionTime > assignment.dueDate
                              ? "text-red-500"
                              : "text-green-600"
                          }`}
                        >
                          Date: {sub.submissionTime.toLocaleDateString()} (
                          {sub.submissionTime > assignment.dueDate
                            ? "Late"
                            : "On-time"}
                          )
                        </p>
                      </div>

                      <div className="w-1/4 text-center">
                        {sub.files.length > 0 ? (
                          sub.files.map((file, idx) => (
                            <div key={idx}>
                              <a
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                {file.split("/").pop()}
                              </a>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No files</p>
                        )}
                      </div>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Grade"
                        value={sub.grade}
                        onChange={(e) =>
                          handleGradeChange(ai, si, e.target.value)
                        }
                        className="w-1/6 p-1 border rounded text-center"
                        disabled={sub.confirmed}
                      />

                      {!sub.confirmed ? (
                        <Button
                          onClick={() => confirmGrade(ai, si)}
                          text="Confirm"
                          className="px-3 py-1 text-slate-950 bg-emerald-200 hover:bg-green-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-green-900 active:text-white active:border-green-400"
                          disabled={sub.grade === ""}
                        />
                      ) : (
                        <Button
                          onClick={() => regrade(ai, si)}
                          text="Re-grade"
                          className="px-3 py-1 text-slate-950 bg-red-300 hover:bg-rose-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-pink-800 active:text-white active:border-rose-400"
                        />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No submissions yet.</p>
              )}

              {assignment.notSubmitted.length > 0 && (
                <div className="mt-3 text-gray-700">
                  <h4 className="font-semibold">Not Submitted:</h4>
                  <ul className="list-disc pl-5">
                    {assignment.notSubmitted.map((name, idx) => (
                      <li key={idx}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => handleEditInfo(assignment.assignmentId)}
                  text="Edit Assignment"
                  className="px-3 py-1 text-slate-950 bg-fuchsia-200 hover:bg-purple-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-fuchsia-900 active:text-white active:border-fuchsia-400"
                />
                <Button
                  onClick={() => {
                    setSelectedAssignmentId(assignment.assignmentId);
                    setShowDeleteConfirm(true);
                  }}
                  text="Delete Assignment"
                  className="px-3 py-1 text-slate-950 bg-red-300 hover:bg-rose-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-pink-800 active:text-white active:border-rose-400"
                />
              </div>
            </div>
          ))}
        </div>
      </main>

      {showDeleteConfirm && (
        <ConfirmationPopup
          title="Confirm Delete"
          message="Are you sure you want to delete this assignment? This cannot be undone."
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedAssignmentId(null);
          }}
          onConfirm={handleDeleteAssignment}
        />
      )}

      <div className="mt-auto p-4 flex justify-center">
        <Button
          onClick={() => {
            userRole === "assistant"
              ? router.push("/manageMainPageAssistant")
              : router.push("/manageMainPage");
          }}
          text="Back"
          className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 font-bold border-2 border-slate-900 active:bg-slate-900 active:border-stone-50 delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-100"
        />
      </div>

      <Footer />
    </div>
  );
};

export default ManageAssignments;
