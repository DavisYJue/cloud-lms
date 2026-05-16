"use client";
import React from "react";
import CourseCard from "./CourseCard";

const CourseList = ({ courses, onEnroll }) => (
  <div className="flex flex-wrap gap-8 justify-start">
    {courses.map((course) => (
      <CourseCard key={course.course_id} course={course} onEnroll={onEnroll} />
    ))}
  </div>
);

export default CourseList;
