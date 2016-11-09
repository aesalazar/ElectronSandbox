//Create the grid
const hypergrid = require('fin-hypergrid');
const dbService = require('./dbService');

const grid = new hypergrid("#fingrid");
const behavior = grid.behavior;
const wsconn = dbService.newConnection("ws://localhost:4080");

//Listen for data
let colkeys;

wsconn.subscribeToService(function (results){
    var newdata = results.args[0].data;
    
    if (!colkeys) {
        colkeys = Object.keys(newdata[0]);
        behavior.setData(newdata);
        return;
    }
    //Replace cell by cell
    for(let r = 0; r < newdata.length; r++) {
        for(let c = 0; c < behavior.getActiveColumnCount(); c++){
            behavior.setValue(c, r + 2,newdata[r][colkeys[c]]);
        }
    }
    
});

//Set the events for resize
window.addEventListener("resize", function(e){
    grid.div.style.width = `${window.document.body.clientWidth}px`;
    grid.div.style.height = `${window.document.body.clientHeight}px`;
});

//Kick things off
wsconn.onOpened(function(){
    let query = { start:0, end: 40, sortDirection: "DESC", sortColName: "emsTime", "filterObject": {} };
    wsconn.sendQuery(query);
});