import { DataChanges } from '../Utils';
import '../pages/ChangeLog.css';
import React, { useState, useEffect } from 'react';


export default function ChangeLog()
{
  const [changeData, setChangeData] = useState([])

  const changesraw = DataChanges()

  useEffect(() => {

    if (changesraw.data=== undefined)
        setChangeData([])
      else{
        setChangeData(changesraw.data)
      }
  }, [changesraw.data,changesraw.isSuccess]);

    return (
        <>
        <h1 style = {{paddingLeft: 10 +'px'}}>Change Log</h1>
        {
          changeData.map((el, index)=> Box(el,index))
        }    
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