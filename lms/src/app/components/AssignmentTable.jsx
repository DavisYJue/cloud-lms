import Button from "./Button";

const AssignmentTable = ({ assignments, searchQuery, onRemove }) => {
  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-200">
          <th className="border border-gray-300 p-2">Title</th>
          <th className="border border-gray-300 p-2">Due Date</th>
          <th className="border border-gray-300 p-2">Status</th>
          <th className="border border-gray-300 p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {assignments
          .filter((assignment) =>
            assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((assignment) => (
            <tr key={assignment.id} className="border border-gray-300">
              <td className="border border-gray-300 p-2">{assignment.title}</td>
              <td className="border border-gray-300 p-2">
                {assignment.dueDate}
              </td>
              <td className="border border-gray-300 p-2">
                {assignment.status}
              </td>
              <td className="border border-gray-300 p-2 text-center">
                <Button
                  text="Remove"
                  onClick={() => onRemove(assignment)}
                  className="px-3 py-1 text-slate-950 bg-red-300 hover:bg-rose-400 transition active:bg-pink-800 active:text-white"
                />
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};

export default AssignmentTable;
