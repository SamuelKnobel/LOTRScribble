// EditPopup.js
import React, { useState, useEffect } from 'react';
import './EditPopup.css';
import Config_ColumnName from './configs/Config_ColumnName.json';
import Enums from './configs/Enums.json';
import Tooltip from './Tooltip/Tooltip';
import { getConfigValue, DataUpdater } from './Utils';

const EditPopup = ({ tableName, rowData, onCancel, refetchData }) => {
  let tableConfig = Config_ColumnName.tables[tableName];
  const enumConfig = Enums.Enums;

  const [editedData, setEditedData] = useState({ ...rowData });

  useEffect(() => {
    setEditedData({ ...rowData });
  }, [rowData]);

  const isListField = (fieldName) => getConfigValue(tableConfig, fieldName, "isList", true) === true;

  const handleInputChange = (fieldName, value) => {
    let typedValue;
    if (isListField(fieldName)) {
      // Keep the raw string while typing (so "," and trailing spaces survive);
      // it is split back into an array on Save.
      typedValue = value;
    } else if (getConfigValue(tableConfig, fieldName, "type", true) === 'number') {
      typedValue = parseFloat(value);
    } else {
      typedValue = value;
    }
    setEditedData((prevData) => ({
      ...prevData,
      [fieldName]: typedValue,
    }));
  };

  const toList = (value) =>
    value.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

  const mutation = DataUpdater(refetchData);

  const getCommonAttributes = (fieldName) => {
    const CommonAttributes = {
      type: getConfigValue(tableConfig, fieldName, "type", true),
      // For list fields, show the array as a comma-separated string in the textarea
      value: isListField(fieldName) && Array.isArray(editedData[fieldName])
        ? editedData[fieldName].join(', ')
        : (editedData[fieldName] || ''), // Handle nulls gracefully
      onChange: (e) => handleInputChange(fieldName, e.target.value),
      disabled: getConfigValue(tableConfig, fieldName, "immutable", true) === true,
    };
    return CommonAttributes;
  };

  const getToolTipInfo = (key) => {
    if (enumConfig[key]) {
      return JSON.stringify(enumConfig[key], undefined, 3);
    }
    else return key;
  };

  return (
    // 1. Overlay handles the "Click outside to close" logic
    <div className="popup-overlay" onClick={onCancel}>
      
      {/* 2. StopPropagation prevents clicks INSIDE the box from closing it */}
      <div className="edit-popup" onClick={(e) => e.stopPropagation()}>
        
        <h2>Edit {rowData.Identifier || rowData.name || "Item"}</h2>
        
        <div className="key-value-pairs">
          {Object.entries(rowData)
            .filter(([key]) => getConfigValue(tableConfig, key, "hidden", true) !== true)
            .map(([key, value]) => (
            <div className="key-value-pair" key={key}>
              <div className="key">{getConfigValue(tableConfig, key, "Name", key)}:</div>
              <Tooltip text={getToolTipInfo(key)}>
                <div className="value">
                  {typeof value === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={editedData[key]}
                      onChange={(e) => handleInputChange(key, e.target.checked)}
                      disabled={getConfigValue(tableConfig, key, "immutable", true) === true}
                      style={{ width: 'auto', transform: 'scale(1.5)', margin: '10px 0' }} // Make checkbox easier to click
                    />
                  ) : (
                    getConfigValue(tableConfig, key, "componentType", true) === "input" ?
                      (<input {...getCommonAttributes(key)} />) :
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
          <button className="save-button" onClick={() => {
            const finalData = { ...editedData };
            // Convert list fields (edited as raw strings) back into arrays
            Object.keys(finalData).forEach((key) => {
              if (isListField(key) && typeof finalData[key] === 'string') {
                finalData[key] = toList(finalData[key]);
              }
            });
            // Keep the derived display string "_rules" in sync with the "rules" list
            if (Array.isArray(finalData.rules)) {
              finalData._rules = finalData.rules.join(', ');
            }
            mutation.mutate({ tableName, editedData: finalData });
            onCancel();
          }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPopup;