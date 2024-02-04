// UnitsList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UnitsList = () => {
  const [units, setUnits] = useState([]);

  useEffect(() => {
    // Fetch units when the component mounts
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      // Make a GET request to your backend endpoint (replace with your actual backend URL)
      const response = await axios.get('http://localhost:5000/units');
	  setUnits(response.data);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  return (
    <div>
      <h1>List of Units</h1>
	  <div> units</div>
      <ul>
        {units.map((unit) => (
          <li key={unit._id}>
            <strong>{unit.name}</strong> - {unit.Equipment}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UnitsList;
