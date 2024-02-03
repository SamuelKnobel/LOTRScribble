// src/App.js

// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DummyTable from './DummyTable';
//import UnitsList from './UnitsList';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import UnitTable from './UnitTable'; // Adjust the path accordingly
import Config_ColumnName from  './configs/Config_ColumnName.json';

const App = () => {

  
const nationsData = [
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
  },
  {
    "Identifier": "Harad2",
    "eNation": 3,
    "CounterMax": 5,
    "CounterMaxPopDependend": 1,
    "maxPopulation": "ffff",
    "reductionMilitary": 1.0,
    "reductionCivil": 1.0,
    "side": 0,
    "BasicFood": 2.0
  },
  {
    "Identifier": "Harad3",
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

const buildingsData= [
  {
		"Identifier": "Farm",
		"eBuilding": 1,
		"prevoius_eBuilding": 0,
		"next_eBuilding": 2,
		"ebuildingClass": 1,
		"eBuildingType": 0,
		"Price": 100,
		"ConstructionTime": 2,
		"BaseIncomeGold": 10,
		"BaseIncomeFood": 10,
		"MinimalPopulation": 0,
		"BasePopulation": 0,
		"FoodPerFertility": 2,
		"FoodPerPopulation": 2,
		"GoldPerFertility": 0,
		"GoldPerPopulation": 0,
		"trade": 0,
		"upgradable": true,
		"constructable": true,
		"destructable": true
	},
	{
		"Identifier": "Village",
		"eBuilding": 2,
		"prevoius_eBuilding": 1,
		"next_eBuilding": 8,
		"ebuildingClass": 1,
		"eBuildingType": 0,
		"Price": 300,
		"ConstructionTime": 2,
		"BaseIncomeGold": 10,
		"BaseIncomeFood": 10,
		"MinimalPopulation": 1,
		"BasePopulation": 1,
		"FoodPerFertility": 4,
		"FoodPerPopulation": 4,
		"GoldPerFertility": 5,
		"GoldPerPopulation": 5,
		"trade": 1,
		"upgradable": true,
		"constructable": true,
		"destructable": true
	}
]



  const [units, setUnits] = useState([]);

  useEffect(() => {
    // Fetch units when the component mounts
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      // Make a GET request to your backend endpoint (replace with your actual backend URL)
      //const response = await axios.get('http://localhost:5000/units/65bd659ec1bcc52822f785a0', { 

      const response = await axios.get('http://localhost:5000/units', { 
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        },
      });    
      console.log('API Response:', response); // Log the entire response object
      console.log('Data from API:', response.data); // Log just the data property
      console.log('Response Header:', response.headers['content-type']); // Log just the data property
 
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
  // return (
  //  <div>
  //    <h2>Unit Data</h2>      
 //     <DummyTable data={data} />
 //        </div>
 // );
  return (
    <div>
      <Tabs>
        <TabList>
          <Tab>Nations</Tab>
          <Tab>Buildings</Tab>
          <Tab>Units</Tab>
        </TabList>

        <TabPanel>
          <h2>Nations</h2>
          <DummyTable data={nationsData} tableName ="Nations" />
        </TabPanel>
        
        <TabPanel>
          <h2>Buildings</h2>
          <DummyTable data={buildingsData} tableName ="Buildings" />
        </TabPanel>

        <TabPanel>
          <h2>Units</h2>
          <DummyTable data={units} tableName ="Units" />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default App;


