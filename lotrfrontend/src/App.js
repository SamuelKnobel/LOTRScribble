// src/App.js

// App.js
import React, { useState, useEffect } from 'react';

import 'react-tabs/style/react-tabs.css';

import 'react-toastify/dist/ReactToastify.css';
import BaseData from './pages/BaseData';

import { clarity } from 'react-microsoft-clarity';


function App () {

  clarity.init('lqa7df2dhh');

  return (
<BaseData/>  );
};

export default App;


