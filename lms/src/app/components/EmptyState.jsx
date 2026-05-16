"use client";
import Image from "next/image";

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-8 mt-6">
    <Image
      src="/NothingHere.webp"
      alt="No courses"
      width={300}
      height={300}
      className="mb-4 opacity-50 w-40 h-40"
    />
    <p className="text-gray-500 text-lg font-medium">{message}</p>
  </div>
);

export default EmptyState;
