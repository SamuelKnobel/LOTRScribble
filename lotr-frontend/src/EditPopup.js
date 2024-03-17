// EditPopup.js
import React, { useState, useEffect } from 'react';
import './EditPopup.css';
import Config_ColumnName from './configs/Config_ColumnName.json';
import Enums from './configs/Enums.json';
import Tooltip from './Tooltip/Tooltip';
import {getConfigValue} from './Utils'


const EditPopup = ({tableName, rowData, onSave, onCancel }) => {
    let tableConfig = Config_ColumnName.tables[tableName];
    const enumConfig = Enums.Enums;

  const [editedData, setEditedData] = useState({ ...rowData });

  useEffect(() => {
    setEditedData({ ...rowData });
  }, [rowData]);

  const handleInputChange = (fieldName, value) => {
    const typedValue =  getConfigValue(tableConfig,fieldName , "type", true) === 'number' ? parseFloat(value) : value;    
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

  const getCommonAttributes=(fieldName) =>
  {
    const CommonAttributes={
      type: getConfigValue(tableConfig,fieldName , "type", true),
      value:editedData[fieldName],
      onChange:(e) => handleInputChange(fieldName, e.target.value),
      disabled: getConfigValue(tableConfig, fieldName , "immutable", true) === true ? true : false,
    };
    return CommonAttributes;
  }

  const getToolTipInfo= (key) =>
  {
    if (enumConfig[key])
    {
      return JSON.stringify(enumConfig[key], undefined, 3)
    }
    else return key
  }


  return (
    <div className="edit-popup">
      <h2>Edit {rowData.Identifier}</h2>
      <div className="key-value-pairs">
        {Object.entries(rowData).map(([key, value]) => (            
            <div className="key-value-pair" key={key}>            
            <div className="key">{getConfigValue(tableConfig,key, "Name", false)}:</div>                         
            <Tooltip text ={getToolTipInfo(key)}>
              <div className="value">
                {typeof value === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={editedData[key]}
                  onChange={(e) => handleInputChange(key, e.target.checked)}
                  disabled={getConfigValue(tableConfig, key , "immutable", true) === true ? true : false}
                />
              ) : (
                getConfigValue(tableConfig, key , "componentType", true) === "input" ? 
                (<input {...getCommonAttributes(key)} />):
                (<textarea {...getCommonAttributes(key)} />)
              )}
            </div>  
            </Tooltip>                    
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
