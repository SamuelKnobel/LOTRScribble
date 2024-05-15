import axios from 'axios';
import BackendPath from './configs/Config_Path.json';
import { useQuery ,useQueries } from '@tanstack/react-query'


export const getConfigValue=(tableConfig,fieldName, property, returnDefault) => {

    if (fieldName && tableConfig.columnProps[fieldName]) {
      const columnConfig = tableConfig.columnProps[fieldName];
      return columnConfig.hasOwnProperty(property) ? columnConfig[property] : (returnDefault ? tableConfig.columnProps["Default"][property] : fieldName);
    }
    return returnDefault ? tableConfig.columnProps["Default"][property] : fieldName;
  };

async function fetchData (query)
{
    console.log(query)
    let headers= {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
    let URL= [BackendPath.BackEnd+ query ]
    console.log(URL)
    const response = await axios.get(URL, {
        headers: headers})
        .catch((error)=>{
            console.log(response)            
            console.log(error.message)
            return error.message
        })        
        console.log(response)
        console.log(response.data)
    return response.data
}

export function GameData(tabName)
{
  let temp = tabName.toLowerCase()
  return useQuery({
    queryKey: [tabName],
    queryFn: () => fetchData(temp)})
}
export function DataChanges()
{
  return useQuery({
    queryKey: ['changelog'],
    queryFn: () => fetchData('changelog')})
}




    