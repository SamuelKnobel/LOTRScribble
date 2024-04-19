// src/App.js

// App.js
import React, { useState, useEffect } from 'react';

import 'react-tabs/style/react-tabs.css';

import 'react-toastify/dist/ReactToastify.css';
import BaseData from './pages/BaseData';

import { clarity } from 'react-microsoft-clarity';
import NavBar from './NavBar';
import "./styles.css"
import {Routes, Route} from  "react-router-dom"
import ChangeLog from './pages/ChangeLog';
import GameState from './pages/GameState';
import About from './pages/About';

function App () {
  clarity.init('lqa7df2dhh');


  return (
    <>
      <NavBar/>  
        <div className='router-container'>
          <Routes>
            <Route path= "/LOTRwebEditor.github.io/" element = {<BaseData/> }/>
            <Route path= "/LOTRwebEditor.github.io/changelog/" element = {<ChangeLog/> }/>
            <Route path= "/LOTRwebEditor.github.io/gamestate/" element = {<GameState/> }/>
            <Route path= "/LOTRwebEditor.github.io/about/" element = {<About/> }/>                        

          </Routes>
        </div>

  
    </>
   );
};

export default App;