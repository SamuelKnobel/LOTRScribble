// EditPopup.js
import React, { useState, useEffect, useMemo } from 'react';
import './EditPopup.css';
import Config_ColumnName from './configs/Config_ColumnName.json';
import Enums from './configs/Enums.json';
import Tooltip from './Tooltip/Tooltip';
import { getConfigValue, DataUpdater, GameData } from './Utils';

// Parameterized rules: Unity matches these by prefix, not literally
// (see RulesOverview.GetRuleSet in the Unity project). e.g. "Leibwache (Gondor)"
// is valid because the canonical rule "Leibwache (...)" exists.
const PARAMETERIZED_RULES = [
  ['Entsetzlich (', 'Entsetzlich (...)'],
  ['Erzfeinde', 'Erzfeinde (...)'],
  ['Fallensteller (', 'Fallensteller (...)'],
  ['General', 'General (...)'],
  ['Kundschafter (', 'Kundschafter (...)'],
  ['Inspirierender Anführer (', 'Inspirierender Anführer (...)'],
  ['Leibwache (', 'Leibwache (...)'],
  ['Rudelführer', 'Rudelführer (...)'],
  ['Uralte Feindschaft', 'Uralte Feindschaft (...)'],
];

const EditPopup = ({ tableName, rowData, onCancel, refetchData }) => {
  let tableConfig = Config_ColumnName.tables[tableName];
  const enumConfig = Enums.Enums;

  const [editedData, setEditedData] = useState({ ...rowData });
  const [invalidRules, setInvalidRules] = useState([]);

  useEffect(() => {
    setEditedData({ ...rowData });
    setInvalidRules([]);
  }, [rowData]);

  const isListField = (fieldName) => getConfigValue(tableConfig, fieldName, "isList", true) === true;

  // Set of valid rule names from the "Rules" collection (cached by react-query)
  const rulesQuery = GameData('Rules');
  const validRuleNames = useMemo(() => {
    const set = new Set();
    (Array.isArray(rulesQuery.data) ? rulesQuery.data : []).forEach((r) => {
      if (r && r.name) set.add(r.name.trim());
    });
    return set;
  }, [rulesQuery.data]);

  // Mirrors Unity's matching: exact name, or a parameterized-rule prefix
  const isKnownRule = (rule) => {
    const item = rule.trim();
    if (validRuleNames.has(item)) return true;
    return PARAMETERIZED_RULES.some(
      ([needle, canonical]) => item.includes(needle) && validRuleNames.has(canonical)
    );
  };

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

        {invalidRules.length > 0 && (
          <div className="rule-validation-error">
            <strong>Speichern blockiert – unbekannte Regeln:</strong>
            <div>{invalidRules.join(', ')}</div>
            <small>Diese Regeln existieren nicht in der Rules-Tabelle. Bitte korrigieren oder die Regel zuerst anlegen.</small>
          </div>
        )}

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
            // Block saving if any rule does not exist in the Rules collection.
            // (Skip if the rules list could not be loaded, to avoid trapping the user.)
            if (validRuleNames.size > 0 && Array.isArray(finalData.rules)) {
              const unknown = finalData.rules.filter((r) => !isKnownRule(r));
              if (unknown.length > 0) {
                setInvalidRules(unknown);
                return; // keep popup open, do not save
              }
            }
            setInvalidRules([]);
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