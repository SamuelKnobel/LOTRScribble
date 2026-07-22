import React, { useState, useEffect } from 'react';
import DataTable from '../DataTable';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GameData } from '../Utils';
import { useQueryClient} from '@tanstack/react-query'
import { trackPageview } from '../analytics'
import StartSettings from './StartSettings'


const BaseData = () => {
  const [activeTab, setActiveTab] = useState('Nations');
  const [units, setUnits] = useState([]);
  const [ships, setShips] = useState([]);
  const [machines, setMachines] = useState([]);
  const [nations, setNations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [fields, setFields] = useState([]);
  const [rules, setRules] = useState([]);
  const [battlerules, setBattleRules] = useState([]);
  const [spells, setSpells] = useState([]);


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
      case 'battlefield':
        setBattleRules(data);
        break;
      case 'spells':
        setSpells(data);
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

  // The settings tab manages its own data (Constants), so skip the list fetch.
  const isSettingsTab = activeTab === 'StartSettings'
  let currentTabData = GameData(activeTab, !isSettingsTab)

  const queryClient = useQueryClient()

  function ReloadData()
  {
    // Invalidate the active tab's query so react-query refetches it.
    queryClient.invalidateQueries({ queryKey: [activeTab] })
  }

  // Count one pageview per table so the dashboard shows which tables are used.
  useEffect(() => {
    trackPageview(`/data/${activeTab}`, `Data: ${activeTab}`);
  }, [activeTab]);

  useEffect(() => {
    if (isSettingsTab) return;
    if(currentTabData.isError)
      {
        console.error(`Error fetching ${activeTab}:`, currentTabData.error);
        showFetchErrorPopup(activeTab);
      }
    else
    {
      updateState(activeTab,currentTabData)
    }
    // Depend on the data itself: after a refetch (e.g. following a save)
    // isSuccess stays true, so watching it alone never propagated new data.
  }, [currentTabData.data, currentTabData.isError, activeTab]);

  return (
    <div>      
      <Tabs>
        <h1 style={{ paddingLeft: 10 + 'px' }}>Lord of the Rings - Data Overview</h1>
        <TabList>
          <Tab onClick={() => handleTabClick('Nations')}>Nations</Tab>
          <Tab onClick={() => handleTabClick('Buildings')}>Buildings</Tab>
          <Tab onClick={() => handleTabClick('Units')}>Einheiten</Tab>
          <Tab onClick={() => handleTabClick('Ships')}>Ships</Tab>
          <Tab onClick={() => handleTabClick('Machines')}>Machines</Tab>
          <Tab onClick={() => handleTabClick('Fields')}>Fields</Tab>
          <Tab onClick={() => handleTabClick('Rules')}>Einheiten Regeln </Tab>
          <Tab onClick={() => handleTabClick('Battlefield')}>Battle-Rules</Tab>
          <Tab onClick={() => handleTabClick('Spells')}>Spells</Tab>
          <Tab onClick={() => handleTabClick('StartSettings')}>Start Settings</Tab>

        </TabList>

        <TabPanel>
          <DataTable rawdata={nations} tableName="Nations" refetchData={ReloadData}  />
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={buildings} tableName="Buildings" refetchData={ReloadData}  />
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={units} tableName="Units"  refetchData={ReloadData}  />
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={ships} tableName="Ships" refetchData={ReloadData}  />
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={machines} tableName="Machines" refetchData={ReloadData}  />
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={fields} tableName="Fields" refetchData={ReloadData}  />
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={rules} tableName="Rules"  refetchData={ReloadData}  />
        </TabPanel>

        <TabPanel>
          <DataTable rawdata={battlerules} tableName="Battlefield"  refetchData={ReloadData}  />
        </TabPanel>        
        <TabPanel>

          <DataTable rawdata={spells} tableName="Spells"  refetchData={ReloadData}  />
        </TabPanel>
        <TabPanel>
          <StartSettings />
        </TabPanel>
      </Tabs>

      <ToastContainer />
    </div>
  );
};

export default BaseData;
