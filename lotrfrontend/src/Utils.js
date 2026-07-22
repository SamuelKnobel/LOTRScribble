import axios from 'axios';
import BackendPath from './configs/Config_Path.json';
import { useQuery , useMutation} from '@tanstack/react-query'

// Shared key sent on write requests (GETs stay open). Baked in at build time.
const WRITE_KEY = process.env.REACT_APP_WRITE_KEY;
const writeHeaders = () => ({ 'Content-Type': 'application/json', 'X-API-Key': WRITE_KEY });


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
    let headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
    let URL = BackendPath.BackEnd + query
    const response = await axios.get(URL, { headers })
    return response.data
}

// Fetch the download versions, authenticated with the download-password hash.
// Throws (rejects) on 401 so the caller can treat failure as "wrong password".
export async function fetchVersions(downloadKey)
{
  const URL = `${BackendPath.BackEnd}admin/versions`
  const response = await axios.get(URL, {
    headers: { Accept: 'application/json', 'X-Download-Key': downloadKey },
  })
  return response.data
}

export function GameData(tabName, enabled = true)
{
  let temp = tabName.toLowerCase()
  return useQuery({
    queryKey: [tabName],
    queryFn: () => fetchData(temp),
    enabled})
}

// --- StartData constants (Food_UnitType, FoodSize, FertSeason, Trade, ...) ---

export function fetchConstant(docName)
{
  return fetchData(`startdata/constants/${docName}`)
}

// The endpoint updates ONE key per request: { key, value }.
export function updateConstant({ docName, key, value })
{
  const URL = `${BackendPath.BackEnd}startdata/constants/${docName}`
  return axios.put(URL, { key, value }, { headers: writeHeaders() })
}

export function DataChanges()
{
  return useQuery({
    queryKey: ['changelog'],
    queryFn: () => fetchData('changelog?limit=500')})
}

export function updateData({tableName,editedData})
{
  const dataToUpdate = editedData
  const URL = `${BackendPath.BackEnd}${tableName.toLowerCase()}/${dataToUpdate._id}`
  // Send the fields directly as the JSON body; the API key goes in real headers.
  return axios.put(URL,
    dataToUpdate,
    { headers: writeHeaders() }
  );
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
  return axios.post(URL, { field }, { headers: writeHeaders() })
}

export function RevertChanger()
{
  return useMutation({ mutationFn: revertChange })
}




    