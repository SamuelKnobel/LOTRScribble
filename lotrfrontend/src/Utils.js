import axios from 'axios';
import BackendPath from './configs/Config_Path.json';
import { useQuery , useMutation} from '@tanstack/react-query'


export const getConfigValue = (tableConfig, fieldName, property, returnDefault) => {
    // 1. Check if the field exists in the specific table config
    if (fieldName && tableConfig.columnProps[fieldName]) {
        const columnConfig = tableConfig.columnProps[fieldName];
        
        // A. If the specific property is defined (e.g., "Name": "My Unit"), return it
        if (columnConfig.hasOwnProperty(property)) {
            return columnConfig[property];
        }

        // B. If not defined, and we are asked to return defaults
        if (returnDefault) {
            // SPECIAL CASE: For "Name", we prefer the fieldName over the text "Default"
            if (property === "Name") {
                return fieldName;
            }
            // For everything else (type, componentType), return the Default config
            return tableConfig.columnProps["Default"][property];
        } else {
            // If returnDefault is false, fallback to fieldName
            return fieldName;
        }
    }

    // 2. Edge Case: Field not in config at all. 
    if (returnDefault) {
        if (property === "Name") return fieldName;
        return tableConfig.columnProps["Default"][property];
    }
    
    return fieldName;
};

export async function fetchData (query)
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
  // console.log("LoadGameData")
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

export function updateData({tableName,editedData})
{
  const dataToUpdate = editedData
  const header = { 'Content-Type': 'application/json'}
  const URL = `${BackendPath.BackEnd}${tableName.toLowerCase()}/${dataToUpdate._id}`
  const response =  axios.put(URL, {
    headers: header,
    body: JSON.stringify(dataToUpdate),
  });
  console.log(response)
  return response;
}


export function DataUpdater(onSucess)
{
  return useMutation({
    mutationFn: (tableName, dataToUpdate)=>{
      return updateData(tableName, dataToUpdate)
    },
    onSuccess: onSucess
  })
}


// Revert a single field of a changelog entry back to its previous value.
// Backend guards that the current value still matches before writing.
export function revertChange({ changelogId, field })
{
  const URL = `${BackendPath.BackEnd}revert/${changelogId}`
  return axios.post(URL, { field }, { headers: { 'Content-Type': 'application/json' } })
}

export function RevertChanger()
{
  return useMutation({ mutationFn: revertChange })
}




    