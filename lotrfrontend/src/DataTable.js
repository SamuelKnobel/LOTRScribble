import './DataTable.css';
import React, { useEffect, useState } from 'react';
import { useTable, useFilters, useSortBy, usePagination, useRowSelect } from 'react-table';
import Config_ColumnName from './configs/Config_ColumnName.json';
import Enums from './configs/Enums.json';
import EditPopup from './EditPopup';
import { ToastContainer } from 'react-toastify';
import { getConfigValue} from './Utils'

const DefaultColumnFilter = ({ column: { filterValue, setFilter } }) => {
  return <input value={filterValue || ''} onChange={(e) => setFilter(e.target.value)} />;
};

const DataTable = ({ rawdata, tableName ,refetchData}) => {
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

  }, [rawdata.isSuccess,rawdata.isPending,rawdata.length]);


  const columns = React.useMemo(() => {
    // console.log("call UseMemo")
    if (data.length === 0 | (rawdata.length===0 )) {
      return [];
    }

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

  }, [data, tableConfig, enumConfig,rawdata.length]);

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
        // <EditPopup tableName={tableName} rowData={selectedRow} onSave={handleSaveEdit} onCancel={closeEditPopup} />
        <EditPopup tableName={tableName} rowData={selectedRow} onCancel={closeEditPopup} refetchData={refetchData}/>
      )}
     <ToastContainer />
    </>
  );
};

export default DataTable;
