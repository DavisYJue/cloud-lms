"use client";

export default function LoginInput({
  label,
  type,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div className="mb-4">
      <label className="block text-lg font-medium mb-2">{label}</label>
      <input
        type={type}
        className="p-3 w-xs border-2 rounded-lg focus:outline-none focus:ring-3 focus:ring-indigo-300 w-full"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
