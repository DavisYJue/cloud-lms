import Button from "./Button";

const DataTable = ({ data, searchQuery, onRemove, entityType }) => {
  const fields = {
    Student: { name: "student_name", id: "student_id", extra: "class" },
    Teacher: { name: "teacher_name", id: "teacher_id", extra: "faculty" },
    Assistant: {
      name: "assistant_name",
      id: "assistant_id",
      extra: "department",
    },
  }[entityType];

  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-200">
          <th className="border border-gray-300 p-2">Name</th>
          <th className="border border-gray-300 p-2">
            {entityType === "Student" ? "Student ID" : "Identity ID"}
          </th>
          <th className="border border-gray-300 p-2">
            {entityType === "Assistant"
              ? "Department"
              : entityType === "Teacher"
              ? "Faculty"
              : "Class"}
          </th>
          <th className="border border-gray-300 p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data
          .filter((item) => {
            const searchTerm = searchQuery.toLowerCase();
            const name = String(item[fields.name] || "").toLowerCase();
            const id = String(item[fields.id] || "").toLowerCase();
            const extra = String(item[fields.extra] || "").toLowerCase();

            return (
              name.includes(searchTerm) ||
              id.includes(searchTerm) ||
              extra.includes(searchTerm)
            );
          })
          .map((item, index) => (
            <tr
              key={item[fields.id] || index}
              className="border border-gray-300"
            >
              <td className="border border-gray-300 p-2">
                {item[fields.name]}
              </td>
              <td className="border border-gray-300 p-2">{item[fields.id]}</td>
              <td className="border border-gray-300 p-2">
                {item[fields.extra]}
              </td>
              <td className="border border-gray-300 p-2 text-center">
                <Button
                  text={`Remove ${entityType}`}
                  onClick={() => onRemove(item)}
                  className="px-3 py-1 text-slate-950 bg-red-300 hover:bg-rose-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-pink-800 active:text-white active:border-rose-400"
                />
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};

export default DataTable;
