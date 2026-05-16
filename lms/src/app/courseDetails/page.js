"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import ConfirmationPopup from "../components/ConfirmationPopup";

const CourseDetails = () => {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [submittedFiles, setSubmittedFiles] = useState({});
  const [showMaterial, setShowMaterial] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const fileInputRefs = useRef({});
  const [showUnsubmitConfirm, setShowUnsubmitConfirm] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const response = await fetch("/api/courses/details", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch course details");
        const data = await response.json();

        const initialSubmitted = {};
        data.assignments?.forEach((assignment) => {
          if (assignment.submission) {
            initialSubmitted[assignment.assignment_title] = {
              files: assignment.submission.file_path.split(",").map((path) => ({
                name: path.split("/").pop(),
                path: path,
              })),
              submittedAt: assignment.submission.submission_time,
            };
          }
        });
        setSubmittedFiles(initialSubmitted);
        setCourseData(data);
      } catch (error) {
        console.error("Error loading course data:", error);
      }
    };
    fetchCourseDetails();
  }, []);

  const handleFileUpload = (event, assignmentTitle) => {
    const files = Array.from(event.target.files);
    setUploadedFiles((prev) => ({
      ...prev,
      [assignmentTitle]: files,
    }));
  };

  const handleSubmit = async (assignmentTitle, assignmentId) => {
    try {
      const files = uploadedFiles[assignmentTitle];
      if (!files?.length) return;

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("assignmentId", assignmentId);

      const response = await fetch("/api/submitSubmission", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Submission failed");
      const result = await response.json();

      setSubmittedFiles((prev) => ({
        ...prev,
        [assignmentTitle]: {
          files: result.files.map((path) => ({
            name: path.split("/").pop(),
            path: path,
          })),
          submittedAt: result.submission_time,
        },
      }));
      setUploadedFiles((prev) => ({ ...prev, [assignmentTitle]: [] }));
      setShowSubmitConfirm(null);
      alert("Submit assignment successfully");

      window.location.reload();
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit files");
    }
  };

  const handleUnsubmit = async (assignmentTitle, assignmentId) => {
    try {
      const response = await fetch("/api/unsubmitSubmission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Unsubmit failed");

      setSubmittedFiles((prev) => {
        const newState = { ...prev };
        delete newState[assignmentTitle];
        return newState;
      });
      setShowUnsubmitConfirm(null);
      alert("Submission removed successfully");

      window.location.reload();
    } catch (error) {
      console.error("Unsubmit error:", error);
      alert("Failed to remove submission");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: "linear-gradient(to bottom, #a9c3d2, #fcf4e7)",
      }}
    >
      <Header title="Course Details" />

      <main className="flex-grow max-w-3xl w-full mx-auto mt-6 p-6 bg-white shadow-lg rounded-lg min-w-[300px]">
        {courseData ? (
          <>
            <div className="flex justify-between items-center">
              <div className="text-center flex-grow">
                <h2 className="text-2xl font-bold text-slate-900">
                  {courseData.course.course_title}
                </h2>
                <p className="text-gray-700 mt-2">
                  {courseData.course.course_description}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-semibold text-slate-900">
                Assignments
              </h3>
              <ul className="list-none mt-2 text-gray-700">
                {(courseData.assignments || []).map((assignment, index) => (
                  <li key={index} className="p-2 border-b">
                    <div className="flex justify-between items-center">
                      {(() => {
                        const submitted =
                          submittedFiles[assignment.assignment_title];
                        const dueDate = new Date(assignment.due_date);
                        const now = new Date();
                        const isLate = submitted
                          ? new Date(submitted.submittedAt) > dueDate
                          : now > dueDate;

                        let textColor = "text-black";
                        if (submitted && isLate)
                          textColor = "text-red-600 font-bold";
                        else if (submitted && !isLate)
                          textColor = "text-green-600 font-bold";
                        else if (!submitted && isLate)
                          textColor = "text-red-600 font-bold";
                        else textColor = "text-black";

                        return (
                          <span className={`${textColor}`}>
                            {assignment.assignment_title}
                          </span>
                        );
                      })()}

                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            setShowMaterial(
                              showMaterial === assignment.assignment_title
                                ? null
                                : assignment.assignment_title,
                            )
                          }
                          text={
                            showMaterial === assignment.assignment_title
                              ? "Hide Details"
                              : "View Details"
                          }
                          className="px-3 py-1 text-slate-950 bg-blue-300 hover:bg-indigo-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-indigo-950 active:text-white active:border-indigo-400"
                        />
                      </div>
                    </div>

                    {showMaterial === assignment.assignment_title && (
                      <div className="mt-2 p-2 bg-gray-200 rounded-lg">
                        <p className="text-gray-700 font-semibold">
                          Description:
                        </p>

                        <p className="mb-2">
                          {assignment.assignment_description}
                        </p>

                        <hr className="mt-3"></hr>

                        <p className="text-gray-700 font-semibold mb-1 mt-3">
                          Attach your answer here:
                        </p>

                        <div className="space-y-4">
                          <input
                            type="file"
                            multiple
                            ref={(el) =>
                              (fileInputRefs.current[
                                assignment.assignment_title
                              ] = el)
                            }
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, assignment.assignment_title)
                            }
                            disabled={
                              !!submittedFiles[assignment.assignment_title]
                            }
                          />
                          <Button
                            text="Attach Files"
                            onClick={() =>
                              fileInputRefs.current[
                                assignment.assignment_title
                              ]?.click()
                            }
                            className="w-30 h-9 text-sm bg-gray-500 text-white hover:bg-gray-600 font-bold border-2 border-slate-900 active:bg-slate-900 active:border-stone-50 delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-100 flex items-center justify-center"
                            disabled={
                              !!submittedFiles[assignment.assignment_title]
                            }
                          />

                          {uploadedFiles[assignment.assignment_title]?.length >
                            0 && (
                            <div className="mt-2 text-gray-700">
                              <strong>Selected Files:</strong>
                              <ul className="list-disc pl-5">
                                {uploadedFiles[assignment.assignment_title].map(
                                  (file, i) => (
                                    <li key={i}>{file.name}</li>
                                  ),
                                )}
                              </ul>

                              <Button
                                text="Submit"
                                onClick={() =>
                                  setShowSubmitConfirm({
                                    title: assignment.assignment_title,
                                    id: assignment.assignment_id,
                                  })
                                }
                                className="mt-2 px-3 py-1 text-slate-950 bg-emerald-200 hover:bg-green-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-green-900 active:text-white active:border-green-400"
                              />

                              {showSubmitConfirm && (
                                <ConfirmationPopup
                                  title="Confirm Submission"
                                  message={`Are you sure you want to submit files for "${showSubmitConfirm.title}"?`}
                                  onConfirm={() =>
                                    handleSubmit(
                                      showSubmitConfirm.title,
                                      showSubmitConfirm.id,
                                    )
                                  }
                                  onCancel={() => setShowSubmitConfirm(null)}
                                />
                              )}
                            </div>
                          )}

                          {submittedFiles[assignment.assignment_title] && (
                            <div className="mt-2">
                              <p className="text-green-600">Submitted Files:</p>
                              <p className="text-sm text-gray-600">
                                Submitted at:{" "}
                                {new Date(
                                  submittedFiles[assignment.assignment_title]
                                    .submittedAt,
                                ).toLocaleDateString()}
                              </p>

                              <ul className="list-disc pl-5 mt-2">
                                {submittedFiles[
                                  assignment.assignment_title
                                ].files.map((file, i) => (
                                  <li key={i}>
                                    <a
                                      href={file.path}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline"
                                    >
                                      {file.name}
                                    </a>
                                  </li>
                                ))}
                              </ul>

                              <div className="flex flex-col gap-2 mt-2">
                                <Button
                                  text="Unsubmit"
                                  onClick={() =>
                                    setShowUnsubmitConfirm({
                                      title: assignment.assignment_title,
                                      id: assignment.assignment_id,
                                    })
                                  }
                                  className="w-3/20 mt-2 px-3 py-1 text-slate-950 bg-red-300 hover:bg-rose-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-pink-800 active:text-white active:border-rose-400"
                                />

                                {assignment.submission?.grade !== null &&
                                  assignment.submission?.grade !==
                                    undefined && (
                                    <div className="pt-4 border-t mt-2">
                                      <p className="text-gray-700 font-semibold">
                                        Grade:
                                      </p>

                                      <span
                                        className={` ${
                                          assignment.submission.grade >= 80
                                            ? "text-green-600"
                                            : assignment.submission.grade >= 50
                                              ? "text-yellow-500"
                                              : "text-red-600"
                                        }`}
                                      >
                                        {assignment.submission.grade}
                                      </span>
                                    </div>
                                  )}

                                {showUnsubmitConfirm && (
                                  <ConfirmationPopup
                                    title="Confirm Unsubmit"
                                    message={`Are you sure you want to unsubmit "${showUnsubmitConfirm.title}"?`}
                                    onConfirm={() =>
                                      handleUnsubmit(
                                        showUnsubmitConfirm.title,
                                        showUnsubmitConfirm.id,
                                      )
                                    }
                                    onCancel={() =>
                                      setShowUnsubmitConfirm(null)
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <hr className="mt-3"></hr>

                        {(assignment.materials || []).length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-lg font-semibold">
                              Assignment Attachments:
                            </h4>
                            <ul>
                              {assignment.materials.map((material, idx) => (
                                <li key={idx}>
                                  <a
                                    href={material.file_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    {material.file_path.split("/").pop()}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <hr className="mt-3"></hr>

                        <div className="text-gray-700 font-semibold text-lg mt-3">
                          <p>Due Date:</p>

                          <p className="text-gray-600 text-sm">
                            {" "}
                            {new Date(assignment.due_date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-slate-900">
                Teacher Materials
              </h3>
              <ul className="list-none mt-2 text-gray-700">
                {(courseData.materials || []).map((material, index) => (
                  <li key={index} className="p-2 border-b">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">
                        {material.material_title}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            window.open(material.material_file, "_blank")
                          }
                          text="Open Material"
                          className="px-3 py-1 text-slate-950 bg-blue-300 hover:bg-indigo-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-indigo-950 active:text-white active:border-indigo-400"
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600">Loading course details...</p>
        )}
      </main>

      <div className="mt-auto p-4 flex justify-center w-full">
        <Button
          onClick={() => {
            const userRole = courseData?.user?.role?.toLowerCase() || "student";
            router.push(
              userRole === "student" ? "/lmsMainPageStudent" : "/lmsMainPage",
            );
          }}
          text="Back"
          className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 font-bold border-2 border-slate-900 active:bg-slate-900 active:border-stone-50 delay-150 duration-300 ease-in-out"
        />
      </div>

      <Footer />
    </div>
  );
};

export default CourseDetails;
