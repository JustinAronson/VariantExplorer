    var fs = require('fs');
    
    getArrays();
    createSigIndex();
    writeFile();
        
    function getArrays(){
        var veUtil = require('./variantExplorerUtilities.js');

        sigArray = veUtil.readJSONArray('input/sigArray.json');
        vArray = veUtil.readJSONArray('input/vArray.json');
        interpPairsArray = veUtil.readJSONArray('input/interpPairsArray.json');
        labArray = veUtil.readJSONArray('input/labArray.json');
        
        console.log(sigArray);
    }
    
    function writeFile(){
        var labICounter = createLabInteractionSummary();
        var file = "Year,Lab 1,Lab 2, Variant Count\n";
        
        for(var uniqueCombination in labICounter){
            file = file + uniqueCombination + ", " + labICounter[uniqueCombination];
            file = file + "\n";
            
        }
        console.log(file);
        console.log("File Out");
        
        fs.writeFile('trade.csv', file, function (err) {
               if(err) return console.log(err); 
            });
        
    }
    function createLabInteractionSummary(){
        return interpPairsArray.reduce(function(counter, item) {
            var lab0Source = item.labInterps[0].source.replace(",", " ");
            var lab1Source = item.labInterps[1].source.replace(",", " ");
            var lab1Sig = item.labInterps[0].significance;
            var lab2Sig = item.labInterps[1].significance;
            if(sigIndex[lab1Sig]>sigIndex[lab2Sig]){
                var uniqueCombination = [lab1Sig + " - " + lab2Sig + "," + lab0Source + "," + lab1Source];
            } else {
                var uniqueCombination = [lab1Sig + " - " + lab2Sig + "," + lab1Source + "," + lab0Source];
            }
            counter[uniqueCombination] = counter.hasOwnProperty(uniqueCombination) ? counter[uniqueCombination] + 1 : 1;
            return counter;
        }, {});
    };
    function createSigIndex(){
        sigIndex = new Object();
        sigIndex["Pathogenic"] = 0;
        sigIndex["Likely pathogenic"] = 1;
        sigIndex["Uncertain significance"] = 2;
        sigIndex["Likely benign"] = 3;
        sigIndex["Benign"] = 4;
    }