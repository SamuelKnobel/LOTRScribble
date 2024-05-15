import './DataTable.css';
import React, { useEffect, useState } from 'react';
import { useTable, useFilters, useSortBy, usePagination, useRowSelect } from 'react-table';
import Config_ColumnName from './configs/Config_ColumnName.json';
import Enums from './configs/Enums.json';
import EditPopup from './EditPopup';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import {getConfigValue} from './Utils'
import BackendPath from './configs/Config_Path.json';

const DefaultColumnFilter = ({ column: { filterValue, setFilter } }) => {
  return <input value={filterValue || ''} onChange={(e) => setFilter(e.target.value)} />;
};

const DataTable = ({ rawdata, tableName, fetchData }) => {
  const [data, setData] = useState([])
  const tableConfig = Config_ColumnName.tables[tableName];
  const enumConfig = Enums.Enums;
  const [selectedRow, setSelectedRow] = useState(null);
  
  useEffect(() => {
    if ((rawdata.isPending) | (rawdata.length===0 ))  { 
      setData([])
    }
    else
      {setData(rawdata.data);}

  }, [rawdata.isSuccess]);



  const columns = React.useMemo(() => {
    if (data.length === 0 | (rawdata.length===0 )) {
      return [];
    }

    const keys = Object.keys(data[0]);

    return tableConfig.columns.map((key, columnIndex) => {

      let header= getConfigValue(tableConfig,key, "Name", false);
      let isSearchable =  getConfigValue(tableConfig,key, "searchable", true)

      let mapValue = (key,value)=>{
 
        if (enumConfig[key])
        {
          return enumConfig[key][value]         
        }
        else if (value ===-99)
        {
          return NaN
        } 
        else 
        {
          if (key === "fernkampfTreffer")
          {
            if (value === 0)
            {
              return NaN
            }
            else {return value}          
          } 
          else {return value}                
        }
      }
      
      return {
        Header: header,
        accessor: key,
        Filter: isSearchable ? DefaultColumnFilter : false,
        Cell: ({ row, value }) =>
          typeof value === 'boolean' ? (
            <input
              type="checkbox"
              checked={value}
              readOnly={true}
              disabled={true}
            />
          ) : (
            <span>{mapValue(key,value)}</span>
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
    state: { pageIndex, pageSize },
    previousPage,
    nextPage,
    canPreviousPage,
    canNextPage,
  } = useTable({ columns, data, initialState: { pageIndex: 0, pageSize: 15 } }, useFilters, useSortBy, usePagination, useRowSelect);

  const openEditPopup = (row) => {
    setSelectedRow(row);
  };

  const closeEditPopup = () => {
    setSelectedRow(null);
  };  

  const handleSaveEdit = async (editedData) => {
    try {
      // Make a PUT request to the backend API with the edited data
      console.log(JSON.stringify(editedData))
      try 
      {
        const response = await axios.get(`${BackendPath.BackEnd}${tableName.toLowerCase()}/${editedData._id}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
      }
    catch (error) {
      console.error(`Error:`, error);
      };
      
      const response = await axios.put(`${BackendPath.BackEnd}${tableName.toLowerCase()}/${editedData._id}`, {
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
    <>
      <table {...getTableProps()} className="react-table">
      <thead>
        {headerGroups.map((headerGroup) => (
          <React.Fragment key={headerGroup.id}>
            <tr {...headerGroup.getHeaderGroupProps()}>
              <th></th> {/* Empty cell to align with Edit button */}
              {headerGroup.headers.map((column, index) => (
                <th key={index} {...column.getHeaderProps(column.getSortByToggleProps())} className="column-style">
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
                {row.cells.map((cell, index) => (
                    <td key={index} {...cell.getCellProps()}>{cell.render('Cell')}</td>
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
     <ToastContainer />
    </>
  );
};

export default DataTable;
