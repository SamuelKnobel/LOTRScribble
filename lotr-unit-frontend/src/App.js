// src/App.js

// App.js
import React, { useState, useEffect } from 'react';


import axios from 'axios';
import DataTable from './DataTable';
//import UnitsList from './UnitsList';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import Config_ColumnName from  './configs/Config_ColumnName.json';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


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
  ];

  const apiUrls = {
    nations: 'http://localhost:5000/nations',
    buildings: 'http://localhost:5000/buildings',
    units: 'http://localhost:5000/units',
  };


  const [activeTab, setActiveTab] = useState('Nations');
  const [units, setUnits] = useState([]);
  const [nations, setNations] = useState([]);
  const [errors, setErrors] = useState({
    Nations: null,
    Buildings: null,
    Units: null,
  });


  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);



  const fetchData = async (tabName) => {
    try {
      const response = await axios.get(apiUrls[tabName.toLowerCase()], {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (tabName === 'Nations') {
        setNations(response.data);
      } else if (tabName === 'Units') {
        setUnits(response.data);
      }

      setErrors((prevErrors) => ({ ...prevErrors, [tabName]: null }));
    } catch (error) {
      console.error(`Error fetching ${tabName}:`, error);
      setErrors((prevErrors) => ({ ...prevErrors, [tabName]: error }));

      if (tabName === getCurrentTabName()) {
        showFetchErrorPopup(tabName);
      }
    }
  };

  const getCurrentTabName = () => {
    return activeTab;
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  const showFetchErrorPopup = (tabName) => {
    toast.error(`Failed to fetch ${tabName.toLowerCase()}. Check Network Connection.`, {
      position: 'top-center',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  return (
    <div>
      <Tabs>
        <TabList>
          <Tab onClick={() => handleTabClick('Nations')}>Nations</Tab>
          <Tab onClick={() => handleTabClick('Buildings')}>Buildings</Tab>
          <Tab onClick={() => handleTabClick('Units')}>Units</Tab>
        </TabList>

        <TabPanel>
          <h2>Nations</h2>
          <DataTable data={nations} tableName ="Nations" />
          {errors.Nations && <div>Error: {errors.Nations.message}</div>}          
        </TabPanel>
        
        <TabPanel>
          <h2>Buildings</h2>
          <DataTable data={buildingsData} tableName ="Buildings" />
          {errors.Buildings && <div>Error: {errors.Buildings.message}</div>}          
        </TabPanel>

        <TabPanel>
          <h2>Units</h2>
          <DataTable data={units} tableName ="Units" />
          {errors.Units && <div>Error: {errors.Units.message}</div>}          
        </TabPanel>
      </Tabs>  
      <ToastContainer />
    </div>
  );
};

export default App;


