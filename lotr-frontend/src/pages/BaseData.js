import React, { Component } from 'react';
import axios from 'axios';
import DataTable from '../DataTable';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

class BaseData extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeTab: 'Nations',
      units: [],
      nations: [],
      buildings: [],
      fields: [],
      rules:[],
      errors: {
        Nations: null,
        Buildings: null,
        Units: null,
        Rules: null,
      },
    };
  }

  componentDidMount() {
    this.fetchData(this.state.activeTab);
  }

  fetchData = async (tabName) => {
    const { apiUrls } = this;
    try {
      const response = await axios.get(apiUrls[tabName.toLowerCase()], {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      this.updateState(tabName, response.data);
      this.clearErrors(tabName);
    } catch (error) {
      console.error(`Error fetching ${tabName}:`, error);
      this.updateErrors(tabName, error);

      if (tabName === this.getCurrentTabName()) {
        this.showFetchErrorPopup(tabName);
      }
    }
  };

  getCurrentTabName = () => {
    return this.state.activeTab;
  };

  handleTabClick = (tabName) => {
    this.setState({ activeTab: tabName }, () => {
      this.fetchData(tabName);
    });
  };

  updateState = (tabName, data) => {
    switch (tabName.toLowerCase()) {
      case 'nations':
        this.setState({ nations: data });
        break;
      case 'units':
        this.setState({ units: data });
        break;
      case 'buildings':
        this.setState({ buildings: data });
        break;
      case 'fields':
        this.setState({ fields: data });
        break;
      case 'rules':
          this.setState({ rules: data });
          break;        
      default:
        break;
    }
  };

  updateErrors = (tabName, error) => {
    this.setState((prevState) => ({
      errors: { ...prevState.errors, [tabName]: error },
    }));
  };

  clearErrors = (tabName) => {
    this.setState((prevState) => ({
      errors: { ...prevState.errors, [tabName]: null },
    }));
  };

  showFetchErrorPopup = (tabName) => {
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

  apiUrls = {
    nations: 'http://192.168.178.23:81/nations',
    buildings: 'http://192.168.178.23:81/buildings',
    units: 'http://192.168.178.23:81/units',
    fields: 'http://192.168.178.23:81/fields',
    rules: 'http://192.168.178.23:81/rules',

  };

  render() {
    const { nations, buildings, units, fields,rules, activeTab, errors } = this.state;

    return (
      <div>
        <Tabs>
          <TabList>
            <Tab onClick={() => this.handleTabClick('Nations')}>Nations</Tab>
            <Tab onClick={() => this.handleTabClick('Buildings')}>Buildings</Tab>
            <Tab onClick={() => this.handleTabClick('Units')}>Units</Tab>
            <Tab onClick={() => this.handleTabClick('Fields')}>Fields</Tab>
            <Tab onClick={() => this.handleTabClick('Rules')}>Rules</Tab>
          </TabList>

           <TabPanel>
            <h2>Nations</h2>
            <DataTable data={nations} tableName="Nations" fetchData={this.fetchData} />
            {errors.Nations && <div>Error: {errors.Nations.message}</div>}
          </TabPanel>

          <TabPanel>
            <h2>Buildings</h2>
            <DataTable data={buildings} tableName="Buildings" fetchData={this.fetchData} />
            {errors.Buildings && <div>Error: {errors.Buildings.message}</div>}
          </TabPanel>

          <TabPanel>
            <h2>Units</h2>
            <DataTable data={units} tableName="Units" fetchData={this.fetchData} />
            {errors.Units && <div>Error: {errors.Units.message}</div>}
          </TabPanel>
        
          <TabPanel>
            <h2>Fields</h2>
            <DataTable data={fields} tableName="Fields" fetchData={this.fetchData} />
            {errors.Fields && <div>Error: {errors.Fields.message}</div>}
          </TabPanel>

          <TabPanel>
            <h2>Rules</h2>
            <DataTable data={rules} tableName="Rules" fetchData={this.fetchData} />
            {errors.Rules && <div>Error: {errors.rules.message}</div>}
          </TabPanel>          
        </Tabs>
        <ToastContainer />
      </div>
    );
  }
}

export default BaseData;
