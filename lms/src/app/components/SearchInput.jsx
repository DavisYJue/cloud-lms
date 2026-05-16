const SearchInput = ({ value, onChange, placeholder }) => {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="w-full p-2 border border-gray-300 rounded-md mb-4"
      value={value}
      onChange={onChange}
    />
  );
};

export default SearchInput;
