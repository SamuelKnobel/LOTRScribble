import React from 'react';
import { useTable, useFilters, useSortBy ,usePagination } from 'react-table';

import Config_ColumnName from './configs/Config_ColumnName.json';

const DefaultColumnFilter = ({ column: { filterValue, setFilter } }) => {
  return <input value={filterValue || ''} onChange={(e) => setFilter(e.target.value)} />;
};



const DummyTable = ({ data ,tableName}) => {
  const tableConfig = Config_ColumnName.tables[tableName];  
  const columns = React.useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    const keys = Object.keys(data[0]);

    return tableConfig.columns.map((key) => ({
      Header: tableConfig.columnNames[key] || key, // Use config value if available, else use key
      accessor: key,
      Filter: DefaultColumnFilter,
    }));
  }, [data,tableConfig]);

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
  } = useTable({ columns, data, initialState: { pageIndex: 0, pageSize:10 } }, useFilters, useSortBy, usePagination);


  return (
    <div>
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
          {page.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
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
    </div>
  );
};

export default DummyTable;
