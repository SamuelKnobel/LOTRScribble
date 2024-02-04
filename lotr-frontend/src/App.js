// src/App.js

// App.js
import React, { useState, useEffect } from 'react';

import axios from 'axios';
import DataTable from './DataTable';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';


import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BaseData from './pages/BaseData';



function App () {

  return (
<BaseData/>  );
};

export default App;


