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
    let currentTabData = GameData("StartData/"+activeTab.toLowerCase())
    
    const queryClient = useQueryClient()
  
    function ReloadData()
    {
      // Invalidate the active tab's query so react-query refetches it.
      queryClient.invalidateQueries({ queryKey: ["StartData/" + activeTab] })
    }


  // Count one pageview per tab so the dashboard shows which ones are used.
  useEffect(() => {
    trackPageview(`/gamestate/${activeTab}`, `Game State: ${activeTab}`);
  }, [activeTab]);

  useEffect(() => {
    // console.log("call use Effect")
    if(currentTabData.isError)
      {
        console.error(`Error fetching ${activeTab}:`, currentTabData.error);
        showFetchErrorPopup(activeTab);
      }
    else
    {
      updateState(activeTab,currentTabData)
    }
  }, [currentTabData.isSuccess, activeTab]);

  
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
