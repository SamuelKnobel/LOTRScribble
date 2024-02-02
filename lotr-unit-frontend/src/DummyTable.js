import React from 'react';
import { useTable, useFilters, useSortBy } from 'react-table';

const DefaultColumnFilter = ({ column: { filterValue, setFilter } }) => {
  return <input value={filterValue || ''} onChange={(e) => setFilter(e.target.value)} />;
};

const DummyTable = ({ data }) => {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Identifier',
        accessor: 'Identifier',
        Filter: DefaultColumnFilter,
      },
      {
        Header: 'eNation',
        accessor: 'eNation',
        Filter: DefaultColumnFilter,
      },
      {
        Header: 'CounterMax',
        accessor: 'CounterMax',
        Filter: DefaultColumnFilter,
      },
      {
        Header: 'CounterMaxPopDependend',
        accessor: 'CounterMaxPopDependend',
        Filter: DefaultColumnFilter,
      },
      {
        Header: 'maxPopulation',
        accessor: 'maxPopulation',
        Filter: DefaultColumnFilter,
      },
      {
        Header: 'reductionMilitary',
        accessor: 'reductionMilitary',
        Filter: DefaultColumnFilter,
      },
      {
        Header: 'reductionCivil',
        accessor: 'reductionCivil',
        Filter: DefaultColumnFilter,
      },
      {
        Header: 'side',
        accessor: 'side',
        Filter: DefaultColumnFilter,
      },
      {
        Header: 'BasicFood',
        accessor: 'BasicFood',
        Filter: DefaultColumnFilter,
      },
    ],
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns,
      data,
    },
    useFilters,
    useSortBy
  );

  return (
    <div>
      <table {...getTableProps()} className="react-table">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <div>{column.canFilter ? column.render('Filter') : null}</div>
                  <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
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
    </div>
  );
};

export default DummyTable;
