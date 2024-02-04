// EditPopup.js
import React, { useState, useEffect } from 'react';
import './EditPopup.css';
import Config_ColumnName from './configs/Config_ColumnName.json';

const EditPopup = ({tableName, rowData, onSave, onCancel }) => {
    const tableConfig = Config_ColumnName.tables[tableName];

  const [editedData, setEditedData] = useState({ ...rowData });

  useEffect(() => {
    setEditedData({ ...rowData });
  }, [rowData]);

  const handleInputChange = (fieldName, value) => {
    setEditedData((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));
  };

  const handleSave = () => {
    onSave(editedData);
  };

  return (
    <div className="edit-popup">
      <h2>Edit {rowData.Identifier}</h2>
      <div className="key-value-pairs">
        {Object.entries(rowData).map(([key, value]) => (            
          <div className="key-value-pair" key={key}>
            <div className="key">{tableConfig.columnNames[key] || key}:</div>
            <div className="value">
              <input
                type="text"
                value={editedData[key]}
                onChange={(e) => handleInputChange(key, e.target.value)}
              />
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
