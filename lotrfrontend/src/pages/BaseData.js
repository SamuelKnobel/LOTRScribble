import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../DataTable';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BackendPath from '../configs/Config_Path.json';

const BaseData = () => {
  const [activeTab, setActiveTab] = useState('Nations');
  const [units, setUnits] = useState([]);
  const [ships, setShips] = useState([]);
  const [machines, setMachines] = useState([]);
  const [nations, setNations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [fields, setFields] = useState([]);
  const [rules, setRules] = useState([]);

  const fetchData = async (tabName) => {
    // const BackEnd= "https://192.168.17823:81/"    
    const BackEnd = BackendPath.BackEnd;
    const apiUrls = {
      nations: ['nations'],
      buildings: ['buildings'],
      fields: ['fields'],
      units: ['units'],
      ships: ['ships'],
      machines: ['machines'],
      rules: ['rules'],
    };

    try {
      const response = await axios.get(BackEnd + apiUrls[tabName.toLowerCase()], {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      updateState(tabName, response.data);
    } catch (error) {
      console.error(`Error fetching ${tabName}:`, error);
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

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  return (
    <div>
      <Tabs>
        <h1>Lord of the Rings - Data Overview</h1>
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
          <DataTable data={nations} tableName="Nations" fetchData={fetchData} />
        </TabPanel>

        <TabPanel>
          <DataTable data={buildings} tableName="Buildings" fetchData={fetchData} />
        </TabPanel>

        <TabPanel>
          <DataTable data={units} tableName="Units" fetchData={fetchData} />
        </TabPanel>

        <TabPanel>
          <DataTable data={ships} tableName="Ships" fetchData={fetchData} />
        </TabPanel>

        <TabPanel>
          <DataTable data={machines} tableName="Machines" fetchData={fetchData} />
        </TabPanel>

        <TabPanel>
          <DataTable data={fields} tableName="Fields" fetchData={fetchData} />
        </TabPanel>

        <TabPanel>
          <DataTable data={rules} tableName="Rules" fetchData={fetchData} />
        </TabPanel>
      </Tabs>

      <ToastContainer />
    </div>
  );
};

export default BaseData;
