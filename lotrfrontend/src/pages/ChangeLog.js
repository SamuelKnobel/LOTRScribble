import { DataChanges } from '../Utils';
import '../pages/ChangeLog.css';
import React, { useState, useEffect } from 'react';
import { useTable, useSortBy } from 'react-table';


export default function ChangeLog()
{
  const [checkbox, setCheckbox] = useState(false)

  const [changeData, setChangeData] = useState([])

  const changesraw = DataChanges()

  // const groupedData = {};

  useEffect(() => {

    if (changesraw.data=== undefined)
        setChangeData([])
      else{

        setChangeData(changesraw.data)
      }



  }, [changesraw.data,changesraw.isSuccess]);


  const groupedData = changeData.reduce((acc, item) => {
    const key = `${item.collection_name}_${item.item_identifier}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
  
  const transformedData = Object.values(groupedData).map((group) => {
    return {
      collection_name: group[0].collection_name,
      item_identifier: group[0].item_identifier,
      changes: group.map((item) => item.changes),
      timestamps: group.map((item) => item.timestamp),
    };
  });
  
  console.log(groupedData)
  console.log(transformedData)



    return (
        <>
          <h1 style = {{paddingLeft: 10 +'px'}}>Change Log</h1>     
          <label>
        <input
          type="checkbox"
          checked={checkbox}
          onChange={() => setCheckbox(!checkbox)}
          />{' '}
          Change to Grouped View
        </label>
        {/* 
        {
          changeData.map((el, index)=> Box(el,index))
        }     */}
      <span>{!checkbox ? <DataTable data={changeData} /> : <TransformedTable2 data={transformedData} /> } </span>
      

      </>
    )
}
  
function Box(test,id) {
  const data=test;
  return (    
    <div className="changeField_box" key={id}>
      <div className="changeField_date">{data.timestamp}</div>
      <div className="changeField_content">
      <p><strong>Collection Name:</strong> {data.collection_name}</p>
        <p><strong>Item Identifier:</strong> {data.item_identifier}</p>
        {Object.entries(data.changes).map(([key, value]) => (
          <div key={key}>
            <p><strong>{key}:</strong></p>
            <ul>
              <li>Old Value: {value.old}</li>
              <li>New Value: {value.new}</li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const DataTable = ({ data }) => {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Collection Name',
        accessor: 'collection_name',
      },
      {
        Header: 'Identifier',
        accessor: 'item_identifier',
      },
      {
        Header: 'Field',
        accessor: (row) => Object.keys(row.changes)[0],
      },
      {
        Header: 'Old Value',
        accessor: (row) => row.changes[Object.keys(row.changes)[0]].old,
      },
      {
        Header: 'New Value',
        accessor: (row) => row.changes[Object.keys(row.changes)[0]].new,
      },
      {
        Header: 'Date of Change',
        accessor: 'timestamp',
        sortType: (rowA, rowB, columnId) => {
          const dateA = new Date(rowA.values[columnId]);
          const dateB = new Date(rowB.values[columnId]);
          return dateA.getTime() - dateB.getTime();
        },        
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        sortBy: [{ id: 'collection_name', desc: false }],
      },
    },
    useSortBy
  );

  return (
    <table {...getTableProps()} className="react-table">
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
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
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};




const TransformedTable = ({ data }) => {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Collection Name',
        accessor: 'collection_name',
      },
      {
        Header: 'Item Identifier',
        accessor: 'item_identifier',
      },
      {
        Header: 'Changes',
        accessor: 'changes',
        Cell: ({ value }) => (
          <ul>
            {value.map((change, index) => (
              <li key={index}>
                <strong>Field:</strong> {Object.keys(change)[0]} |{' '}
                <strong>Old Value:</strong> {change[Object.keys(change)[0]].old} |{' '}
                <strong>New Value:</strong> {change[Object.keys(change)[0]].new}
              </li>
            ))}
          </ul>
        ),
      },
      {
        Header: 'Timestamps',
        accessor: 'timestamps',
        Cell: ({ value }) => (
          <ul>
            {value.map((timestamp, index) => (
              <li key={index}>{timestamp}</li>
            ))}
          </ul>
        ),
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data });

  return (
    <table {...getTableProps()} style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th
                {...column.getHeaderProps()}
                style={{
                  background: '#f2f2f2',
                  padding: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr
              {...row.getRowProps()}
              style={{
                background: row.index % 2 === 0 ? '#f9f9f9' : '#ffffff',
                borderBottom: '1px solid #ddd',
              }}
            >
              {row.cells.map(cell => (
                <td
                  {...cell.getCellProps()}
                  style={{
                    padding: '8px',
                    borderRight: '1px solid #ddd',
                  }}
                >
                  {cell.render('Cell')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};


const TransformedTable2 = ({ data }) => {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Collection Name',
        accessor: 'collection_name',
      },
      {
        Header: 'Item Identifier',
        accessor: 'item_identifier',
      },
      {
        Header: 'Changes',
        accessor: 'changes',
        Cell: ({ value }) => (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>Field</th>
                <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>Old Value</th>
                <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>New Value</th>
              </tr>
            </thead>
            <tbody>
              {value.map((change, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px' }}>{Object.keys(change)[0]}</td>
                  <td style={{ padding: '8px' }}>{change[Object.keys(change)[0]].old}</td>
                  <td style={{ padding: '8px' }}>{change[Object.keys(change)[0]].new}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      },
      {
        Header: 'Timestamps',
        accessor: 'timestamps',
        Cell: ({ value }) => (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>Timestamps </th>
              </tr>
            </thead>
            <tbody>
              {value.map((timestamp, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px' }}>{timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      },
      
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data });

  return (
    <table {...getTableProps()} style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th
                {...column.getHeaderProps()}
                style={{
                  background: '#f2f2f2',
                  padding: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr
              {...row.getRowProps()}
              style={{
                background: row.index % 2 === 0 ? '#f9f9f9' : '#ffffff',
                borderBottom: '1px solid #ddd',
              }}
            >
              {row.cells.map(cell => (
                <td
                  {...cell.getCellProps()}
                  style={{
                    padding: '8px',
                    borderRight: '1px solid #ddd',
                  }}
                >
                  {cell.render('Cell')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};


const TransformedTable3 = ({ data }) => {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Collection Name',
        accessor: 'collection_name',
      },
      {
        Header: 'Item Identifier',
        accessor: 'item_identifier',
      },
      {
        Header: 'Field',
        accessor: 'field',
      },
      {
        Header: 'Old Value',
        accessor: 'old_value',
      },
      {
        Header: 'New Value',
        accessor: 'new_value',
      },
      {
        Header: 'Timestamp',
        accessor: 'timestamp',
      },
    ],
    []
  );

  const mergedData = React.useMemo(() => {
    // Merging changes with timestamps
    const merged = data.map(item => {
      const changes = item.changes;
      const timestamps = [item.timestamp];
      const mergedChanges = Object.keys(changes).map(field => ({
        collection_name: item.collection_name,
        item_identifier: item.item_identifier,
        field: field,
        old_value: changes[field].old,
        new_value: changes[field].new,
        timestamp: timestamps[0],
      }));
      return mergedChanges;
    });
    return merged.flat();
  }, [data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: mergedData });

  return (
    <table {...getTableProps()} style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th
                {...column.getHeaderProps()}
                style={{
                  background: '#f2f2f2',
                  padding: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr
              {...row.getRowProps()}
              style={{
                background: row.index % 2 === 0 ? '#f9f9f9' : '#ffffff',
                borderBottom: '1px solid #ddd',
              }}
            >
              {row.cells.map(cell => (
                <td
                  {...cell.getCellProps()}
                  style={{
                    padding: '8px',
                    borderRight: '1px solid #ddd',
                  }}
                >
                  {cell.render('Cell')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
