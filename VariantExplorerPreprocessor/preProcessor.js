/*
 * Created by Justin on 11/17/14.
 * This program is taking an out file from ClinVar and presenting it in a user-interface designed to make it easy to navigate.
 *
 * Major variables:
 *
 * vArray - The array where all of the variant objects are stored.
 * lArray - The original file split into lines.
 * Variant object - The object that contains the following:
 *      .name - The array of the names of the variants.
 *      .transcript - The array of the transcripts in the name.
 *      .labInterps - The array of entries submitted by the labs.
 */

var fs = require('fs');

fs.readFile('../input/ClinVarJan.2016.txt', function (err, fileContents) {

        console.log('In: readFile');

        if(err) {console.log('file error' + err);}
        var fileContentsString = fileContents.toString();
        var sigArray = new Array(0);
        var vArray = new Array(0);
        var interpPairsArray = new Array(0);
        var matrix = new Array(0);

        var lArray = fileContentsString.split('\n');

        readFile(lArray, interpPairsArray);

        console.log('interpPairsArray length:' + interpPairsArray.length);

        interpPairsArray.sort(compareVariants); // This function sorts the variants in alphabetical order by name.

        console.log('completed sort');

        for(var i=0;i<interpPairsArray.length;i++){
            for(var j=0;j<interpPairsArray[i].labInterps.length;j++){
                console.log('Lab:' + interpPairsArray[i].labInterps[j].source);
            }
        }

        vArray = collapseVariant(interpPairsArray); /* This function combines every two variants that have the same name and are next to each other in the array.
                                                   When merging variants, it also merges lab interpretations. */

        console.log('vArray length:' + vArray.length);


        var labArray = Object.getOwnPropertyNames(countLabs(interpPairsArray));

        console.log('labArray length:' + labArray.length);

        sigArray = Object.getOwnPropertyNames(countSigs(interpPairsArray));
        labArray = labArray.sort();

        for ( var i = 0; i < interpPairsArray.length; i++ ) {
            var inArray = interpPairsArray[i];
            var l1 = inArray.labInterps[0].significance;
            var l2 = inArray.labInterps[1].significance;

            if (((l1 === "Pathogenic" || l2 === "Pathogenic") && (l1 === "Likely pathogenic" || l2 === "Likely pathogenic")) ||
                    ((l1 === "Benign" || l2 === "Benign") && (l1 === "Likely benign" || l2 === "Likely benign"))) {
                inArray.conflict = 0;
                inArray.discrepency = 1;
            }else{
                inArray.discrepency = 0;
                inArray.conflict = 1;
            }
        }

        var matrix = generateLabTable(labArray, interpPairsArray);
        console.log("matrix length:" + matrix.length);
        
        var vArrayString = JSON.stringify(vArray);
        var interpPairsArrayString = JSON.stringify(interpPairsArray);
        var labArrayString = JSON.stringify(labArray);
        var sigArrayString = JSON.stringify(sigArray);
        var matrixString = JSON.stringify(matrix);
     

        fs.writeFile('interpPairsArray.json', interpPairsArrayString, function (err) {
           if(err) return console.log(err); 
        });
        fs.writeFile('vArray.json', vArrayString, function (err) {
           if(err) return console.log(err); 
        });
        fs.writeFile('labArray.json', labArrayString, function (err) {
           if(err) return console.log(err); 
        });
        fs.writeFile('sigArray.json', sigArrayString, function (err) {
           if(err) return console.log(err); 
        });
        fs.writeFile('matrix.json', matrixString, function (err) {
           if(err) return console.log(err); 
        });

        console.log('Out: readFile');
    } // End of function
    ); // End of readFile

function countSigs(interpPairsArray) {
    var sigCounters = new Object();

    sigCounters["Pathogenic"] = 0;
    sigCounters["Likely pathogenic"] = 0;
    sigCounters["Uncertain significance"] = 0;
    sigCounters["Likely benign"] = 0;
    sigCounters["Benign"] = 0;

    for ( var i = 0; i < interpPairsArray.length; i++ ) {
        for ( var j = 0; j < interpPairsArray[i].labInterps.length; j++ ) {
            var sigClass = interpPairsArray[i].labInterps[j].significance;
            var propArray = Object.getOwnPropertyNames(sigCounters);

            if (propArray.indexOf(sigClass) === -1) {
                sigCounters[sigClass] = 0;
            }
            sigCounters[sigClass] = sigCounters[sigClass] + 1;
        }
    }

    return sigCounters;
}

function countLabs(interpPairsArray) {
    var labCounters = new Object();

    for ( var i = 0; i < interpPairsArray.length; i++ ) {
        for ( var j = 0; j < interpPairsArray[i].labInterps.length; j++ ) {
            var labName = interpPairsArray[i].labInterps[j].source;
            var propArray = Object.getOwnPropertyNames(labCounters);

            if (propArray.indexOf(labName) === -1) {
                labCounters[labName] = 0;
            }
            labCounters[labName] = labCounters[labName] + 1;
        }
    }

    return labCounters;
}

// This function determines whether or not a lab interp is already in the array, and if it isn't, it pushes it onto the interp array.
function pushInterpIfNotPresent (variant, labInterp) {
    var isPresent = false; // If this function is deemed true, the lab interp is already in the array, and we do not want to push it again.
    for ( var i = 0; i < variant.labInterps.length; i++ ) {
        if ( variant.labInterps[i].scv === labInterp.scv ) {
            isPresent = true;
        }
    }

    if (!isPresent) {
        variant.labInterps.push(labInterp);
    }

}

function collapseVariant(interpPairsArray) {
    var collapsedVArray = new Array();
    collapsedVArray.push(interpPairsArray[0]);
    for ( var i = 1; i < interpPairsArray.length - 1; i++ ) {
        if (compareVariants(interpPairsArray[i - 1], interpPairsArray[i]) !== 0) {
            collapsedVArray.push(interpPairsArray[i]);
        } else {
            pushInterpIfNotPresent(collapsedVArray[collapsedVArray.length - 1], interpPairsArray[i].labInterps[0]);
            pushInterpIfNotPresent(collapsedVArray[collapsedVArray.length - 1], interpPairsArray[i].labInterps[1]);
            // These functions are making sure that all of the variant's lab interpretations are being represented.
        }
    }
    return collapsedVArray;
}

function readFile(lArray, interpPairsArray) {
    console.log('In: readFile Function');
    lArray.shift();
    while(lArray.length > 0 && lArray.length !== 1) {
        readInterpPair(interpPairsArray, lArray);
        lArray.shift();
     }

     console.log('Out: readFile Function');
}

function readInterpPair(interpPairsArray,lArray) {
    // console.log('In: readInterpPair Function');
    var fArray = lArray[0].split('\t');
/*
    //If a line contains a return character put the line back together
    while (fArray.length < 20) {
        if(fArray.length < 19) {
//               alert("fArray length is less then to 24 when putting lines back together!  Line " + lArray.length + ".");
        }
        lArray.shift();
        var restOfLine = lArray[0].split('\t');
        fArray[fArray.length - 1] = fArray[fArray.length - 1] + restOfLine[0];
        restOfLine.shift();
        fArray = fArray.concat(restOfLine);
    }
*/
    if(fArray.length !== 20) {
        alert("fArray length is not equal to 25! Line " + lArray.length + ".");
    }

     //Only consider lines that meet this criteria
    if(fArray[18] !== '-1' && fArray[18] !== '0') {
       if (fArray[10] !== 'not provided' && fArray[16] !== 'not provided') {
            readVariant(interpPairsArray, fArray); // Reads overall variant.
            readLabInterp(interpPairsArray, fArray, 0); // Reads the 1st lab interp.
            readLabInterp(interpPairsArray, fArray, 1); // Reads the 2nd lab interp.
        }
    }
    // console.log('Out: readInterpPair Function');

}

// This function reads all of the information related to the variant: name and transcript.
function readVariant(vArray, fArray) {

    var variant = new Object();

    variant.name = fArray[2];
    variant.labInterps = new Array();
    variant.transcript = "";
    variant.alleleID = fArray[1];
    separateTranscript(variant);

    vArray.push(variant);

}

function compareVariants (a, b) {
    if (a.name > b.name) {
        return 1;
    }else if (a.name < b.name) {
        return -1;
    }else {
        return 0;
    }
}

// Removes the transcript from the .name of the variant and puts it into .transcript.
function separateTranscript(variant) {
    variant.transcript = variant.name.slice(0, variant.name.indexOf("("));
    variant.name = variant.name.slice( variant.name.indexOf("("), variant.name.length);
}

// Returns the value of the lab interp subsection without the header.
function readValueFromNameValuePair(lArray) {
    var line;
    line = lArray[0].slice(lArray[0].indexOf(':') + 1, lArray[0].length).trim();
    lArray.shift();
    return line;
}

// Reads the lab interps in the variant and pushes it onto the labInterps array.
function readLabInterp(vArray,fArray,index) {
    var labInterp = new Object();

    labInterp.scv = fArray[4 + (index*7)];
    labInterp.source = fArray[3 + (index*7)];
    labInterp.significance = fArray[5 + (index*7)];
    labInterp.evalDate = fArray[6 + (index*7)];
    labInterp.comments = fArray[9 + (index*7)];
    labInterp.subCondition = fArray[8 + (index*7)];
    
    var lastVariantIndex = vArray.length - 1;

    var lastVariant = vArray[lastVariantIndex];
    lastVariant.labInterps.push(labInterp);

}

function readComments (lArray) {
    var line = readValueFromNameValuePair(lArray);

    while(lArray.length !== 0 &&
            lArray[0].trim().length !== 0 &&
            lArray[0].slice(0,5).localeCompare("scv2:") !== 0 ) {
        var test = lArray[0].slice(0,4);
        line = line + lArray[0];
        lArray.shift();
    }

    return line;
}

function generateLabTable(labArray, interpPairsArray) {
    console.log("In: Generate Matrix");
    interpPairsArray = interpPairsArray.sort();
    var ltArray = createLabTableArray(labArray);
    var name;
    for ( var i = 0; i < interpPairsArray.length; i++ ) {
        var iArray = interpPairsArray[i].labInterps;
        for ( var j = 0; j < iArray.length; j++ ) {
            name = iArray[j].source;
            var jIndex = labArray.indexOf(name);
            for ( var k = j + 1; k < iArray.length; k++ ) {
                name = iArray[k].source;
                var kIndex = labArray.indexOf(name);
                ltArray[jIndex] [kIndex] = ltArray[jIndex] [kIndex] + 1;
            }
        }
    }
    return ltArray;
}

function createLabTableArray(labArray) {
    console.log("In: createLabTableArray");
    var ltArray = new Array();
    for ( var i = 0; i < labArray.length; i++ ){
        ltArray[i] = new Array();
        for ( var j = 0; j < labArray.length; j++ ) {
            ltArray[i][j] = 0;
        }
    }
    console.log("Out: createLabTableArray");
    return ltArray;
}