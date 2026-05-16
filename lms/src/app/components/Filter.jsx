"use client";
import React from "react";

const Filter = ({ filter, onChange, courseCounts }) => (
  <div className="flex items-center gap-4 mb-6">
    <select
      onChange={onChange}
      value={filter}
      className="p-2 border-2 rounded-md bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 w-48"
    >
      <option value="all">All Courses ({courseCounts.all})</option>
      <option value="ongoing">Ongoing ({courseCounts.ongoing})</option>
      <option value="completed">Completed ({courseCounts.completed})</option>
      <option value="outdated">Outdated ({courseCounts.outdated})</option>
    </select>
  </div>
);

export default Filter;
