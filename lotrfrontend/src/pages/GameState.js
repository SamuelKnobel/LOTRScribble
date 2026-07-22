import React, { useState, useEffect } from 'react';
import DataTable from '../DataTable';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GameData } from '../Utils';
import { useQueryClient} from '@tanstack/react-query'
import { trackPageview } from '../analytics'


const GameState = () => {
{
  const [activeTab, setActiveTab] = useState('StartBuildings');
//   const [nations, setNations] = useState([]);
  const [fields, setFields] = useState([]);
  const [buildings, setBuildings] = useState([]);


  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };


    const updateState = (tabName, data) => {
    switch (tabName.toLowerCase()) {
    //   case 'startnations':
    //     setNations(data);
    //     break;
    //   case 'units':
    //     setUnits(data);
    //     break;
    //   case 'ships':
    //     setShips(data);
    //     break;
    //   case 'machines':
    //     setMachines(data);
    //     break;
      case 'startbuildings':
        setBuildings(data);
        break;
      case 'startfields':
        setFields(data);
        break;
    //   case 'rules':
    //     setRules(data);
    //     break;
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
    const tabQueryKey = "StartData/" + activeTab.toLowerCase()
    let currentTabData = GameData(tabQueryKey)

    const queryClient = useQueryClient()

    function ReloadData()
    {
      // Must use the same key GameData registered (it was lowercased there,
      // so invalidating the mixed-case name never matched).
      queryClient.invalidateQueries({ queryKey: [tabQueryKey] })
    }


  // Count one pageview per tab so the dashboard shows which ones are used.
  useEffect(() => {
    trackPageview(`/gamestate/${activeTab}`, `Game State: ${activeTab}`);
  }, [activeTab]);

  useEffect(() => {
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
        <h1 style = {{paddingLeft: 10 +'px'}}>Lord of the Rings - Game State</h1> 
        <TabList>
          {/* <Tab onClick={() => handleTabClick('StartNations')}>Start Nations</Tab> */}
            <Tab onClick={() => handleTabClick('StartBuildings')}>Start Buildings</Tab>
            <Tab onClick={() => handleTabClick('StartFields')}>Start Fields</Tab>

          {/* 
          <Tab onClick={() => handleTabClick('Units')}>Units</Tab>
          <Tab onClick={() => handleTabClick('Ships')}>Ships</Tab>
          <Tab onClick={() => handleTabClick('Machines')}>Machines</Tab>
          <Tab onClick={() => handleTabClick('Rules')}>Rules</Tab> */}
        </TabList>
{/* 
        <TabPanel>
          <DataTable rawdata={nations} tableName="StartNations" refetchData={ReloadData}  />
        </TabPanel> */}
        <TabPanel>
          <DataTable rawdata={buildings} tableName="StartBuildings" refetchData={ReloadData}  />
        </TabPanel>             
        <TabPanel>
          <DataTable rawdata={fields} tableName="StartFields" refetchData={ReloadData}  />
        </TabPanel>

{/* 


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
          <DataTable rawdata={rules} tableName="Rules"  refetchData={ReloadData}  />
        </TabPanel> */}
      </Tabs>

      <ToastContainer />
    </div>
    );
    };
}
export default GameState;
