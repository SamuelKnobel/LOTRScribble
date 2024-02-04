import './DataTable.css';
import React, { useState } from 'react';
import { useTable, useFilters, useSortBy, usePagination, useRowSelect } from 'react-table';
import Config_ColumnName from './configs/Config_ColumnName.json';
import EditPopup from './EditPopup';
import axios from 'axios';

const DefaultColumnFilter = ({ column: { filterValue, setFilter } }) => {
  return <input value={filterValue || ''} onChange={(e) => setFilter(e.target.value)} />;
};

const DataTable = ({ data, tableName, fetchData }) => {
  const tableConfig = Config_ColumnName.tables[tableName];
  const [selectedRow, setSelectedRow] = useState(null);
  
  const columns = React.useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    const keys = Object.keys(data[0]);

    return tableConfig.columns.map((key, columnIndex) => {
      const isSearchable = tableConfig.searchableColumns[key] === true ? true : false;

      return {
        Header: tableConfig.columnNames[key] || key,
        accessor: key,
        Filter: isSearchable ? DefaultColumnFilter : false,
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
    state: { pageIndex, pageSize },
    previousPage,
    nextPage,
    canPreviousPage,
    canNextPage,
  } = useTable({ columns, data, initialState: { pageIndex: 0, pageSize: 10 } }, useFilters, useSortBy, usePagination, useRowSelect);

  const openEditPopup = (row) => {
    setSelectedRow(row);
  };

  const closeEditPopup = () => {
    setSelectedRow(null);
  };

  const logDataChanges = (existingData, newData) => {
    // Assume both datasets have the same structure with unique identifiers
    const identifierKey = '_id'; // Replace with the actual key used for identification
  
    // Find the keys present in both datasets
    const keys = new Set([
      ...Object.keys(existingData),
      ...Object.keys(newData)
    ]);
  
    // Find added, removed, and updated items
    const addedItems = [];
    const removedItems = [];
    const updatedItems = [];
  
    keys.forEach((key) => {
      const existingItem = existingData[key];
      const newItem = newData[key];
  
      if (!existingItem) {
        addedItems.push({ id: key, value: newItem });
      } else if (!newItem) {
        removedItems.push({ id: key, value: existingItem });
      } else if (existingItem !== newItem) {
        updatedItems.push({ id: key, oldValue: existingItem, newValue: newItem });
      }
    });
  
    // Log the changes
    console.log('Added items:', addedItems);
    console.log('Removed items:', removedItems);
    console.log('Updated items:', updatedItems);
  };
  
  

  const handleSaveEdit = async (editedData) => {
    try {
      // Make a PUT request to the backend API with the edited data
      console.log(JSON.stringify(editedData))
      try 
      {
        const response = await axios.get(`http://localhost:5000/${tableName.toLowerCase()}/${editedData._id}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        logDataChanges(response.data,editedData)
      }
    catch (error) {
      console.error(`Error:`, error);
      };



      
      const response = await axios.put(`http://localhost:5000/${tableName.toLowerCase()}/${editedData._id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });
  

      // Log the response from the backend (you can handle it as needed)
      console.log('Update successful:', response.data);
  
      // Close the edit popup
      closeEditPopup();
      // Reload the data from the backend after a successful update
      await fetchData(tableName.toLowerCase()); // Assuming fetchData is a function to fetch data (you can adapt it based on your actual implementation)

    } catch (error) {
      // Handle errors from the backend
      console.error('Error updating data:', error.message);
      // You can provide feedback to the user here (e.g., show an error message)
    }
  };

  return (
    <div>
      <table {...getTableProps()} className="react-table">
      <thead>
        {headerGroups.map((headerGroup) => (
          <React.Fragment key={headerGroup.id}>
            <tr {...headerGroup.getHeaderGroupProps()}>
              <th></th> {/* Empty cell to align with Edit button */}
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())} className="column-style">
                  {column.render('Header')}
                  <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                  <div>{column.canFilter ? column.render('Filter') : null}</div>
                </th>
              ))}
            </tr>
          </React.Fragment>
        ))}
      </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, rowIndex) => {
            prepareRow(row);
            return (
              <React.Fragment key={rowIndex}>
                <tr {...row.getRowProps()}>
                <td>
                    <button onClick={() => openEditPopup(row.original)}>Edit</button>
                  </td>
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              </React.Fragment>
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
        {/* Edit Popup */}
            {selectedRow && (
        <EditPopup tableName={tableName} rowData={selectedRow} onSave={handleSaveEdit} onCancel={closeEditPopup} />
      )}
    </div>
  );
};

export default DataTable;
