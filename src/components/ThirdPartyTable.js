import React, { useEffect, useState, useRef, useContext } from "react";
import "../styles/ThirdPartyTable.css";
import { DataContext } from "../contexts/DataContext";
import Table from "./Table";
import { getHostname } from "../utility/thirdPartyUtility";

/**
 * Function to create JSX of ThirdPartyTable element
 * @param {String} id id of the audit for which the table is rendered
 * @param {Array} userInput Array of the user selections
 * @param {Array} scripts Array of all third party scripts
 * @param {Array} domainWiseScripts Array of all scripts appearing in the dropdown
 * @param {Function} passData Callback to pass data to graph renderer
 * @returns table jsx
 */

function ThirdPartyTable({
  id,
  userInput,
  scripts,
  passData,
  domainWiseScripts,
}) {
  // State to hold current third party headings according to the view
  const dataContext = useContext(DataContext);
  const data=dataContext.data.thirdParty;
  const [thirdPartyHeadings, setThirdPartyHeadings] = useState([]);
  // State to hold current third party items according to the view
  const [thirdPartyItems, setThirdPartyItems] = useState([]);
  const selectRef = useRef();
  
  useEffect(() => {
    changeView("entity");
  }, [userInput]);


  function getEntites(){
    let byEntity=new Map();
    data.map(item=>{
      let entity=undefined;
      if(item.entityName){
        entity=item.entityName.name;
      }
      else{
        let entityArray=userInput.filter(data=>{
          if(getHostname(data.key)===item.entity.url){
            return true;
          }
          return false;
        });

        if(entityArray.length>0){
          entity=entityArray[0].value;
        }
      }
      
      if(entity){
        let defaultConfig={
          blockingTime:0,
          mainThreadTime:0,
          resourceSize:0,
          transferSize:0
        }
        let entityData=byEntity.get(entity)||defaultConfig;
        entityData.blockingTime+=item.blockingTime;
        entityData.resourceSize+=item.resourceSize;
        entityData.transferSize+=item.transferSize;
        entityData.mainThreadTime+=item.mainThreadTime;
        byEntity.set(entity,entityData);
      }
      return {};
    })
    return Array.from(byEntity.entries()).sort(function(a,b){
      return a[1].mainThreadTime>b[1].mainThreadTime
    });
  }

  /**
   * Toogle view of third party table from script view to entity view and vice-versa
   * @param {Object} event Object to hold data for event which triggered view change
   */
  function changeView(view) {
    // Update the global data context with the props recieved
    dataContext.setData({
      type: "thirdPartySummary",
      data: {
        thirdPartyScripts: scripts,
        userInput,
        domainWiseScripts
      }
    });

    // If the current view is script view
    if (view === "script") {
      // Update Table headings
      selectRef.current.value = "script";
      setThirdPartyHeadings([
        { key: "url", text: "URL", itemType: "text" },
        { key: "mainThreadTime", text: "Main Thread Time", itemType: "ms" },
        {key:"blockingTime",text:"Main Thread Blocking Time", itemType:"ms"},
        { key: "resourceSize", text: "Resource Size", itemType: "bytes" },
        { key: "transferSize", text: "Transfer Size", itemType: "bytes" },
      ]);
      // Update thirdPartyItems to hold scripts instead of entities
      setThirdPartyItems(
        scripts.map((script) => {
          return {
            url: script.url,
            mainThreadTime: script.mainThreadTime,
            resourceSize: script.resourceSize,
            transferSize: script.transferSize,
            blockingTime: script.blockingTime
          };
        })
      );
    } else {
      // Default headings and items passed to the ThirdPartyTable are in entity view
      selectRef.current.value = "entity";
      setThirdPartyHeadings([
        { key: "entity", text: "Third-Party", itemType: "link" },
        { key: "mainThreadTime", text: "Main Thread Time", itemType: "ms" },
        { key: "blockingTime", text: "Render Blocking Time", itemType: "ms" },
        { key: "transferSize", text: "Transfer Size", itemType: "bytes" },
        { key: "resourceSize", text: "Resource Size", itemType: "bytes" },
      ]);


      const entities=getEntites();
      setThirdPartyItems(
        entities.map((entity) => {
          return {
            entity: entity[0],
            mainThreadTime: entity[1].mainThreadTime,
            blockingTime: entity[1].blockingTime,
            transferSize: entity[1].transferSize,
            resourceSize:entity[1].resourceSize
          };
        })
      );
    }
  }

  return (
    <div className="third-party-wrapper" style={{ marginLeft: "1em" }}>
      <select
        ref={selectRef}
        className="select-box"
        onChange={(e) => changeView(e.target.value)}
        style={{ width: "fit-content" }}
      >
        <option value="entity">Entity View</option>
        <option value="script">Script View</option>
      </select>
      <div className="table-container">
        <Table
          id={id}
          headings={thirdPartyHeadings}
          items={thirdPartyItems}
          passData={passData}
          showPagination={selectRef.current.value!=="entity"}
        />
      </div>
    </div>
  );
}

export default ThirdPartyTable;
