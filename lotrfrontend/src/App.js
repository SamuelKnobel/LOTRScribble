import React from 'react';

import 'react-tabs/style/react-tabs.css';

import 'react-toastify/dist/ReactToastify.css';
import BaseData from './pages/BaseData';

import NavBar from './NavBar';
import "./styles.css"
import {Routes, Route} from  "react-router-dom"
import ChangeLog from './pages/ChangeLog';
import GameState from './pages/GameState';
import About from './pages/About';
import Downloads from './pages/Downloads';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {ReactQueryDevtools} from "@tanstack/react-query-devtools"
import PageviewTracker from './PageviewTracker'
function App () {

  const client = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
      },
    },    
  });

  return (
    <>
      <QueryClientProvider client={client}>
      <PageviewTracker/>
      <NavBar/>
        <div className='router-container'>
          <Routes>
            <Route path= "/" element = {<BaseData/> }/>
            <Route path= "/changelog/" element = {<ChangeLog/> }/>
            <Route path= "/gamestate/" element = {<GameState/> }/>
            <Route path="/downloads/" element={<Downloads />} />            
            <Route path= "/about/" element = {<About/> }/>                        

          </Routes>
        </div>
        <ReactQueryDevtools/>
        </QueryClientProvider>

    </>
   );
};

export default App;