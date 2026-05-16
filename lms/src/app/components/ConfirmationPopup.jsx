import Button from "./Button";

const ConfirmationPopup = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-md flex justify-center items-center">
      <div className="bg-white p-6 rounded-md shadow-lg w-96 border-3">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p>{message}</p>
        <div className="mt-4 flex justify-end">
          <Button
            text="Cancel"
            onClick={onCancel}
            className="mr-2 px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 font-bold border-2 border-slate-900 active:bg-slate-900 active:border-stone-50 delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-100"
          />
          <Button
            text="Confirm"
            onClick={onConfirm}
            className="px-4 py-2 text-slate-950 bg-fuchsia-200 hover:bg-purple-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-fuchsia-900 active:text-white active:border-fuchsia-400"
          />
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
