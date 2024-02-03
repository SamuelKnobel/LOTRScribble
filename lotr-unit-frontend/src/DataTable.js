
import './DataTable.css'; // Import your custom CSS file

import React, { useState } from 'react';

import { useTable, useFilters, useSortBy ,usePagination, useRowSelect } from 'react-table';

import Config_ColumnName from './configs/Config_ColumnName.json';


const DefaultColumnFilter = ({ column: { filterValue, setFilter } }) => {
  return <input value={filterValue || ''} onChange={(e) => setFilter(e.target.value)} />;
};

const EditableCell = ({ cell, rowIndex, columnIndex, value,column, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleEditEnd = () => {
    setIsEditing(false);
    onChange(rowIndex, columnIndex ,column , editedValue);
  };

  return isEditing ? (
    <input
      type="text"
      value={editedValue}
      onChange={(e) => setEditedValue(e.target.value)}
      onBlur={handleEditEnd}
      autoFocus
    />
  ) : (
    <div onClick={handleEditStart}>{value}</div>
  );
};

const updateUnit = async (id, fieldName, newValue) => {
  const apiUrl = `http://localhost:5000/units/${id}`;

  console.log("Call Update Unit")
  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field_name: fieldName,
        new_value: newValue,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data.message); // Log the response message
  } catch (error) {
    console.error('Error:', error.message);
  }
};

const DataTable = ({ data ,tableName}) => {
  const tableConfig = Config_ColumnName.tables[tableName];  
  
  const [editedData, setEditedData] = useState([...data]);

  const handleCellEdit = (rowIndex, columnIndex, column, newValue) => {
    const updatedData = [...editedData];
    updatedData[rowIndex][column] = newValue;
    setEditedData(updatedData);
  };

  //  const handleSaveChanges = () => {
    // Send editedData to the backend using a PUT request
    // (Implement the API endpoint in the backend to handle this)
   // const unitId = '65bd6d61c1bcc52822ff1603';
  //  const fieldToUpdate = 'Equipment';
   // const newValue = 'Sword';

   // updateUnit(unitId, fieldToUpdate, newValue);
  //  console.log('Send to Backend');
  //};
  const handleSaveChanges = async () => {
    try {
      // Iterate over the edited rows
      editedData.forEach(async (editedRow) => {
        const unitId = editedRow.id; // Assuming there's an 'id' field in your data
  
        // Iterate over the edited columns
        Object.keys(editedRow).forEach(async (columnName) => {
          const fieldToUpdate = columnName;
          const newValue = editedRow[columnName];
  
          // Send editedData to the backend using a PUT request
          await updateUnit(unitId, fieldToUpdate, newValue);
        });
      });
  
      console.log('Send to Backend');
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  const columns = React.useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    const keys = Object.keys(data[0]); 

    return tableConfig.columns.map((key, columnIndex) => {
      const isSearchable = tableConfig.searchableColumns[key]==true ? true : false
  
      return {
        Header: tableConfig.columnNames[key] || key,
        accessor: key,
        Filter: isSearchable ? DefaultColumnFilter : false,
        Cell: ({ cell, rowIndex }) => (
          <EditableCell
            cell={cell}
            rowIndex={rowIndex}
            columnIndex={columnIndex}
            value={cell.value}
            onChange={handleCellEdit}
          />
        ),
      };
    });
  }, [data, tableConfig]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    page,
    state: { pageIndex, pageSize, selectedRowIds },
    previousPage,
    nextPage,
    canPreviousPage,
    canNextPage,
    selectedFlatRows,
  } = useTable({ columns, data, initialState: { pageIndex: 0, pageSize:10 } , autoResetSelectedRows: false }, 
    useFilters, useSortBy, usePagination,useRowSelect);


  return (
    <div>
       {/* Button to save changes */}
       <button onClick={handleSaveChanges}>Save Changes</button>
      <table {...getTableProps()} className="react-table">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())} className="column-style">
                  {column.render('Header')}                  
                  <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                  <div>{column.canFilter ? column.render('Filter') : null}</div>                  
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row,rowIndex) => {
            prepareRow(row);
            return (
            <tr {...row.getRowProps()}>
              {row.cells.map((cell, columnIndex) => (
                <td {...cell.getCellProps()}>
                  {cell.render('Cell', { cell, rowIndex, columnIndex })}
                </td>
              ))}
            </tr>              
            );
          })}
        </tbody>        
      </table>
      <div>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          Previous Page
        </button>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {Math.ceil(rows.length / pageSize)}
          </strong>{' '}
        </span>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          Next Page
        </button>
      </div>    
      {/* Display selected rows */}
      <div>
        <h2>Selected Rows</h2>
        <ul>
          {Object.keys(selectedRowIds).map((rowId) => (
            <li key={rowId}>{selectedFlatRows.find((d) => d.id === rowId).original.Identifier}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DataTable;
