export default function Unauthorized() {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-2xl/10 font-semibold"
      style={{
        backgroundImage: "linear-gradient(to bottom, #a9c3d2, #fcf4e7)",
      }}
    >
      <div className="p-10 bg-white border-3 border-black rounded-lg text-center">
        Sorry, You are not authorized to access this page. <br></br> Please go
        back to your previous page.
      </div>
    </div>
  );
}
