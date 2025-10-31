const TableHeader = ({ headers, sortField, sortOrder, onSort, selectAll, onSelectAll }) => (
  <thead className="bg-[#f5f5f5] dark:bg-gray-800 border-b border-[#ddd] dark:border-gray-800 sticky top-0 z-10">
    <tr>
      <th className="px-4 py-2 text-left">
        <input
          type="checkbox"
          checked={selectAll}
          onChange={onSelectAll}
          className="rounded border-gray-300"
        />
      </th>
      {headers.map(({ key, label, sortable }) => (
        <th
          key={key}
          className={`px-4 py-2 text-left font-normal text-[#666] dark:text-gray-300 ${
            sortable ? 'cursor-pointer hover:text-[#333] dark:hover:text-gray-100' : ''
          }`}
          onClick={sortable ? () => onSort(key) : undefined}
        >
          {label} {sortable && sortField === key && (sortOrder === 'asc' ? '↑' : '↓')}
        </th>
      ))}
      <th className="px-4 py-2 text-left font-normal text-[#666] dark:text-gray-300">Actions</th>
    </tr>
  </thead>
)

export default TableHeader
