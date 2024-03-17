

   export const getConfigValue=(tableConfig,fieldName, property, returnDefault) => {

        if (fieldName && tableConfig.columnProps[fieldName]) {
          const columnConfig = tableConfig.columnProps[fieldName];
          return columnConfig.hasOwnProperty(property) ? columnConfig[property] : (returnDefault ? tableConfig.columnProps["Default"][property] : fieldName);
        }
        return returnDefault ? tableConfig.columnProps["Default"][property] : fieldName;
      };



  