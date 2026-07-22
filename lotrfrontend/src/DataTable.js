import './DataTable.css';
import React, { useEffect, useState } from 'react';
import { useTable, useFilters, useSortBy, usePagination, useRowSelect } from 'react-table';
import Config_ColumnName from './configs/Config_ColumnName.json';
import Enums from './configs/Enums.json';
import EditPopup from './EditPopup';
import { ToastContainer } from 'react-toastify';
import { getConfigValue} from './Utils'
import { EMPTY_NUMBER } from './constants'

const DefaultColumnFilter = ({ column: { filterValue, setFilter } }) => {
  return (
    <input
      value={filterValue || ''}
      onChange={(e) => setFilter(e.target.value)}
      onClick={(e) => e.stopPropagation()} 
    />
  );
};

const DataTable = ({ rawdata, tableName ,refetchData}) => {
  const [data, setData] = useState([])
  const tableConfig = Config_ColumnName.tables[tableName];
  const enumConfig = Enums.Enums;
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    if (rawdata.isPending || !rawdata.data) {
      setData([])
    }
    else
      {setData(rawdata.data);}
    // Depend on the data itself: after a refetch isSuccess/isPending do not
    // change, so watching only those left the table showing stale rows.
  }, [rawdata.data, rawdata.isPending]);

const columns = React.useMemo(() => {
    if (data.length === 0 || (rawdata.length === 0)) {
      return [];
    }
    return tableConfig.columns.map((key, columnIndex) => {
      // 1. Helper for mapping values (moved up so it can be used by composite columns too)
      let mapValue = (colKey, val) => {
        if (Array.isArray(val)) {
          return val.join(', ')
        }
        if (enumConfig[colKey]) {
          return enumConfig[colKey][val]
        }
        else if (val === EMPTY_NUMBER) {
          return "-"
        }
        else {
          if (colKey === "fernkampfTreffer") {
            if (val === 0) return "-"
            else return val
          }
          else { return val }
        }
      }

      // 2. Check if this is a composite (grouped) column
      let isComposite = getConfigValue(tableConfig, key, "isComposite", true);

      if (isComposite) {
         let header = getConfigValue(tableConfig, key, "Name", key);
         // Safety: Add '|| []' to ensure it never returns undefined
         let fields = getConfigValue(tableConfig, key, "compositeFields", []) || []; 
         let separator = getConfigValue(tableConfig, key, "separator", " / ");
         let isSearchable = getConfigValue(tableConfig, key, "searchable", true);
        
         let alignProp = getConfigValue(tableConfig, key, "align", "center");

         return {
            Header: header,
            id: key,
            accessor: (row) => {
                // GUARD CLAUSE: If fields is undefined/null/not-array, STOP immediately.
               if (!fields || !Array.isArray(fields) || fields.length === 0) {
                   console.error(`[Runtime Error] Column '${key}' has invalid fields:`, fields);
                   return "CONFIG ERROR"; 
               }

               return fields.map(fieldKey => {
                  let val = row[fieldKey];
                  // DEBUG: See if we are finding data
                  if (val === undefined) console.warn(`[Missing Data] Row ${row.Identifier} missing key '${fieldKey}'`);                  
                  return mapValue(fieldKey, val); 
               }).join(separator);
            },
            Filter: isSearchable ? DefaultColumnFilter : false,
            Cell: ({ value }) => <div style={{ whiteSpace: 'pre-wrap', textAlign: alignProp }}>{value}</div>
         };
      }

      // 3. Standard Column Logic (Existing code)
      let header = getConfigValue(tableConfig, key, "Name", false);
      let isSearchable = getConfigValue(tableConfig, key, "searchable", true);
      let alignProp = getConfigValue(tableConfig, key, "align", "center");
      return {
        Header: header,
        id: key,
        accessor: (row) => mapValue(key, row[key]),
        Filter: isSearchable ? DefaultColumnFilter : false,
        Cell: ({ value }) =>
          typeof value === 'boolean' ? (
            <input
              type="checkbox"
              checked={value}
              readOnly={true}
              disabled={true}
            />
          ) : (
            <div style={{ whiteSpace: 'pre-wrap', textAlign: alignProp }}>{value}</div>
          ),
      };
    });

  }, [data, tableConfig, enumConfig, rawdata.length]);
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
  } = useTable({ columns, data, initialState: { pageIndex: 0, pageSize: 100 } }, useFilters, useSortBy, usePagination, useRowSelect);

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
              <th></th> {/* Empty cell for Edit button */}
              
              {headerGroup.headers.map((column, index) => (
                <th 
                  key={index} 
                  {...column.getHeaderProps(column.getSortByToggleProps())} 
                  className="column-style"
                >
                  {/* WRAPPER: Forces vertical layout (Title Top, Search Bottom) */}
                  <div className="header-content-wrapper">
                    
                    {/* TOP: Title */}
                    <div className="header-top">
                      {column.render('Header')}
                      <span className="sort-icon">
                        {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                      </span>
                    </div>

                    {/* BOTTOM: Search (Only if filterable) */}
                    <div className="header-bottom">
                      {column.canFilter ? column.render('Filter') : null}
                    </div>

                  </div>
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
      <div className="pagination">
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
