"use client";

export default function LoginButton({ text, onClick }) {
  return (
    <button
      type="submit"
      className="delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-100 border-2 text-slate-950 border-slate-900 w-2/5 bg-blue-300 font-bold p-3 rounded-lg hover:bg-indigo-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-indigo-950 active:text-white active:border-indigo-400"
      onClick={onClick}
    >
      {text}
    </button>
  );
}
