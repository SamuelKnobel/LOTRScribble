// EditPopup.js
import React, { useState, useEffect } from 'react';
import './EditPopup.css';
import Config_ColumnName from './configs/Config_ColumnName.json';

const EditPopup = ({tableName, rowData, onSave, onCancel }) => {
    let tableConfig = Config_ColumnName.tables[tableName];

  const [editedData, setEditedData] = useState({ ...rowData });

  useEffect(() => {
    setEditedData({ ...rowData });
  }, [rowData]);

  const handleInputChange = (fieldName, value) => {
    const typedValue = gettype(fieldName) === 'number' ? parseFloat(value) : value;    
    console.log("Fieldname: ",fieldName)
    console.log("Value: ",value)    

    setEditedData((prevData) => ({
      ...prevData,
      [fieldName]: typedValue,
    }));
  };

  const handleSave = () => {
    onSave(editedData);
  };

  const getName =(fieldName) =>
  {
    if (fieldName)
    {
      if(tableConfig.columnProps[fieldName]){

        if(tableConfig.columnProps[fieldName].Name)
        {
          return tableConfig.columnProps[fieldName].Name
        }
      }
    }
    return fieldName
  }

  const getimmutable =(fieldName) =>
  {
    if (fieldName)
    {
      if(tableConfig.columnProps[fieldName]){
        if(tableConfig.columnProps[fieldName].immutable)
        {           
          return tableConfig.columnProps[fieldName].immutable  
        }
      }
    }
    return tableConfig.columnProps["Default"].immutable 
  }  

  const gettype =(fieldName) =>
  {
    if (fieldName)
    {
      if(tableConfig.columnProps[fieldName]){
   
        if(tableConfig.columnProps[fieldName].type)
        {           
          return tableConfig.columnProps[fieldName].type  
        }
      }
    }
    return tableConfig.columnProps["Default"].type  
  }    

  const getComponentType = (fieldName) =>
  {
    if (fieldName)
    {
      if(tableConfig.columnProps[fieldName]){
   
        if(tableConfig.columnProps[fieldName].componentType)
        {     
          return tableConfig.columnProps[fieldName].componentType  
        }
      }
    }
    return tableConfig.columnProps["Default"].componentType
   }

  const getCommonAttributes=(fieldname) =>
  {
    const CommonAttributes={
      type:gettype(fieldname),
      value:editedData[fieldname],
      onChange:(e) => handleInputChange(fieldname, e.target.value),
      disabled:getimmutable(fieldname)  === true ? true : false,
    };

    return CommonAttributes;
  }


  return (
    <div className="edit-popup">
      <h2>Edit {rowData.Identifier}</h2>
      <div className="key-value-pairs">
        {Object.entries(rowData).map(([key, value]) => (            
          <div className="key-value-pair" key={key}>
            <div className="key">{getName(key)}:</div>
            <div className="value">
            {typeof value === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={editedData[key]}
                  onChange={(e) => handleInputChange(key, e.target.checked)}
                  disabled={getimmutable(key) === true ? true : false}
                />
              ) : (
                getComponentType(key) === "input" ? 
                (<input {...getCommonAttributes(key)} />):
                (<textarea {...getCommonAttributes(key)} />)
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="buttons">
        <button className="cancel-button" onClick={onCancel}>
          Cancel
        </button>
        <button className="save-button" onClick={handleSave}>
          Save
        </button>        
      </div>
    </div>
  );
};

export default EditPopup;
