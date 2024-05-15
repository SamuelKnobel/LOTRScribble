import React, { useState, useEffect } from 'react';
import DataTable from '../DataTable';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GameData } from '../Utils';

const BaseData = () => {
  const [activeTab, setActiveTab] = useState('Nations');
  const [units, setUnits] = useState([]);
  const [ships, setShips] = useState([]);
  const [machines, setMachines] = useState([]);
  const [nations, setNations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [fields, setFields] = useState([]);
  const [rules, setRules] = useState([]);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  const updateState = (tabName, data) => {
    switch (tabName.toLowerCase()) {
      case 'nations':
        setNations(data);
        break;
      case 'units':
        setUnits(data);
        break;
      case 'ships':
        setShips(data);
        break;
      case 'machines':
        setMachines(data);
        break;
      case 'buildings':
        setBuildings(data);
        break;
      case 'fields':
        setFields(data);
        break;
      case 'rules':
        setRules(data);
        break;
      default:
        break;
    }
  };

  const showFetchErrorPopup = (tabName) => {
    toast.error(`Failed to fetch ${tabName.toLowerCase()}. Check Network Connection or Database.`, {
      position: 'top-center',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
    });
  };


  const currentTabData =GameData(activeTab)

  useEffect(() => {
    if(currentTabData.isError)
      {
        console.error(`Error fetching ${activeTab}:`, currentTabData.error);
        showFetchErrorPopup(activeTab);
      }
    else
      updateState(activeTab,currentTabData)
  }, [currentTabData.isSuccess, activeTab]);

  console.log(nations)
  return (
    <div>
      <Tabs>
        <h1 style = {{paddingLeft: 10 +'px'}}>Lord of the Rings - Data Overview</h1>
        <TabList>
          <Tab onClick={() => handleTabClick('Nations')}>Nations</Tab>
          <Tab onClick={() => handleTabClick('Buildings')}>Buildings</Tab>
          <Tab onClick={() => handleTabClick('Units')}>Units</Tab>
          <Tab onClick={() => handleTabClick('Ships')}>Ships</Tab>
          <Tab onClick={() => handleTabClick('Machines')}>Machines</Tab>
          <Tab onClick={() => handleTabClick('Fields')}>Fields</Tab>
          <Tab onClick={() => handleTabClick('Rules')}>Rules</Tab>
        </TabList>

        <TabPanel>
          <DataTable rawdata={nations} tableName="Nations"  />
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={buildings} tableName="Buildings"  />
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={units} tableName="Units"  />
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={ships} tableName="Ships"  />
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={machines} tableName="Machines"  />
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={fields} tableName="Fields"/>
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={rules} tableName="Rules"  />
        </TabPanel>
      </Tabs>

      <ToastContainer />
    </div>
  );
};

export default BaseData;
