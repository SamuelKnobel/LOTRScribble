// UnitTable.js
import React, { useState } from 'react';
import { useTable, useSortBy } from 'react-table';
import "react-table-6/react-table.css";
import './UnitTable.css'; // Import your custom CSS file

const UnitTable = ({ data }) => {
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
      },
      {
        Header: 'Equipment',
        accessor: 'Equipment',
      },
      {
        Header: 'Number of Attacks',
        accessor: 'NbOfAttacks',
      },
      // Add more columns as needed
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
  } = useTable({ columns, data }, useSortBy);

  const { sorted } = state;

  return (
    <div>
      <div className="input-container">
        <div className="search-container">
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search Equipment..."
          />
        </div>
      </div>
      <table {...getTableProps()} className="react-table">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            // Filter rows based on the global filter
            if (
              globalFilter === '' ||
              row.cells.some((cell) => cell.value.toLowerCase().includes(globalFilter.toLowerCase()))
            ) {
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            } else {
              return null;
            }
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UnitTable;
