// src/App.js

// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DummyTable from './DummyTable';
//import UnitsList from './UnitsList';

import UnitTable from './UnitTable'; // Adjust the path accordingly
const App = () => {

  
const data = [
  {
    "Identifier": "Angmar",
    "eNation": 1,
    "CounterMax": 4,
    "CounterMaxPopDependend": 0,
    "maxPopulation": 3.0,
    "reductionMilitary": 1.0,
    "reductionCivil": "Tadasd",
    "side": 0,
    "BasicFood": 1.0
  },
  {
    "Identifier": "Gondor",
    "eNation": 2,
    "CounterMax": 5,
    "CounterMaxPopDependend": 1,
    "maxPopulation": 2.0,
    "reductionMilitary": "asdd" ,
    "reductionCivil": 1.0,
    "side": 1,
    "BasicFood": 2.0
  },
  {
    "Identifier": "Harad",
    "eNation": 3,
    "CounterMax": 5,
    "CounterMaxPopDependend": 1,
    "maxPopulation": "ffff",
    "reductionMilitary": 1.0,
    "reductionCivil": 1.0,
    "side": 0,
    "BasicFood": 2.0
  }
];


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
  //return (
  //  <div>
  //    <h2>Unit Data</h2>      
  // <UnitTable data={units} />
  //  </div>
  //);
  return (
    <div>
      <h2>Unit Data</h2>      
      <DummyTable data={data} />
          </div>
  );
};

export default App;


