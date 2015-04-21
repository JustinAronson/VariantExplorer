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

    fs.readFile('input/ClinVarMar.2015.txt', function (err, fileContents) {

            alert(err);
            sigArray = new Array(0);
            vArray = new Array(0);
            interpPairsArray = new Array(0);
            // split the file contents into an array of lines

            var lArray = fileContents.split('\n');

            readFile(lArray);

            interpPairsArray.sort(compareVariants); // This function sorts the variants in alphabetical order by name.
            vArray = collapseVariant(); /* This function combines every two variants that have the same name and are next to each other in the array.
                                                 When merging variants, it also merges lab interpretations. */
            labArray = Object.getOwnPropertyNames(countLabs());

            $('#TheStatisticsTable tr td').click(function () {
                var td = $(this).closest('td');
                var tr = $(this).closest('tr');


                generateSigVariantTables(td[0].cellIndex -2, tr[0].rowIndex - 1);
            });

            sigArray = Object.getOwnPropertyNames(countSigs());

            document.getElementById("LabMegaTableButton").onclick = function () { clearAreas(); generateLabCountTable(countLabs(), labArray); };
            document.getElementById("LabSearchButton").onclick = function () { clearAreas(); generateLabSearchButtons() };
            document.getElementById("SignificanceSearchButton").onclick = function () { clearAreas();
                        $("#Area1").html(
                            "<Table width = \"80%\"><tr><td>" +
                            generateSigCountTable(countSigs(), sigArray, "N/A", 1, interpPairsArray, "N/A") +
                            "</td></tr></Table>"
                        )
            };
            document.getElementById("VariantSearchButton").onclick = function () { clearAreas(); generateSelectionBox(interpPairsArray);};
                                                                                   // This function creates the selection box that contains all of the variant names.

            addHighlighter();

            var stopper = 0;
        } // End of function
        ); // End of readFile


    function selectLab(lab) {
        clearAreas();
        var labVArray = generateLabLArray(interpPairsArray, lab);
        var sigCounts = countSigs();
        sigArray = Object.getOwnPropertyNames(sigCounts);
        var tableGenerater = "";
        tableGenerater = tableGenerater + generateSigCountTable(sigCounts, sigArray, "0 ", 0, labVArray, lab);
        for (var i = 0; i < labArray.length; i++) {
            if(labArray[i] !== lab) {
                var labVArray2 = generateLabLArray(labVArray, labArray[i]);
                var stArray = generateSigTableArray(sigArray, lab, 0, labVArray2);
                var sigTable = generateSigCountTable(sigCounts, sigArray, labArray[i], 0, labVArray2, lab);
                if (totalCount(stArray) > 0) {
                    tableGenerater = tableGenerater + "<tr><td>" + lab + "</td><td>" + labArray[i] + sigTable + "</td></tr>";
                }
            }
        }
        $("#Area1").html("Laboratory: " + lab);
        $("#Area2").html("Significance Summary <br><br>");
        $("#Area3").html("<Table id=\"TheLabSpecificTable\" width = \"80%\" ><tr><td> </td><td> All Other Labs: </td></tr><tr><td>" + lab + "</td><td>" + tableGenerater + "</td></tr></table>");
    }

    function clearAreas(){
        $("#Area1").html("");
        $("#Area2").html("");
        $("#Area3").html("");
        $("#Area4").html("");
        $("#Area5").html("");
        $("#labVariants").html("");

    }

    function generateLabLArray(array, lab) {
        var labLVArray = new Array();
        for ( var i = 0; i < array.length; i++ ) {
            var iArray = array[i].labInterps;
            if (iArray[0].source === lab ||iArray[1].source === lab) {
                labLVArray.push(array[i]);
            }
        }
        return labLVArray;

    }

    function generateLabLVariantArray(lab) {
        var labLVArray = new Array();
        for (var i = 0; i < interpPairsArray.length; i++) {
            var iArray = interpPairsArray[i].labInterps;
            if(iArray[0].source === lab || iArray[1].source === lab) {
                labLVArray.push(interpPairsArray[i]);
            }
        }
        return labLVArray;
    }

    function generateLabSearchButtons() {
        clearAreas();
        var htmlOutput = "";
        var uniqueLabArray = createUniqueLabsArray(vArray);

        for( var i = 0; i < uniqueLabArray.length; i++ ) {
            htmlOutput = htmlOutput + "<button style=\"background-color:deepskyblue; width: 48%; height: 75\" button type=\"button\" id=\"";
            htmlOutput = htmlOutput + uniqueLabArray[i] + "\" onclick=\"selectLab('" + uniqueLabArray[i] + "')\">" + uniqueLabArray[i];
            htmlOutput = htmlOutput + "</button>&nbsp"
        }
        $("#Area1").html(htmlOutput);
    }

    function generateSigTableForLabPair(lab1, lab2) {
        var labCount = countLabs();
        var sigCount = countSigs();
        var sigArray = Object.getOwnPropertyNames(sigCount);
        var stArray = generateSigTableArrayForLabPair(sigArray, labArray, lab1, lab2);
        var tableGenerater = "<Table id=\"TheStatisticsTable\" width = \"100%\" >";
        tableGenerater = tableGenerater + sigTableHeader(sigArray);

        for (var i = 0; i < sigArray.length; i++) {
            tableGenerater = tableGenerater + writeSigTableRow(sigArray[i], sigCount[sigArray[i]], i, stArray);

        }
        tableGenerater = tableGenerater + "</Table>";

        $("#variantSigStatistics").html(tableGenerater);
    }

    function generateSigCountTable (sigCounts, sigArray, secondaryLab, labSpecificFlag, array, primaryLab) {
        clearAreas();
        var stArray = generateSigTableArray(sigArray, primaryLab, labSpecificFlag, array);
        var tableGenerater = "";
        var labNoSpace = primaryLab.replace(/[';\s&,\/()]+/g, "");
        var secondLabNoSpace = secondaryLab.replace(/[';\s&,\/()]+/g, "");
        tableGenerater = "<Table id=\"The" + labNoSpace + secondLabNoSpace + "SigTable\" width = \"80%\" >";
        tableGenerater = tableGenerater + sigTableHeader(sigArray);

        for (var i = 0; i < sigArray.length; i++) {
            tableGenerater = tableGenerater + writeSigTableRow(sigArray[i], sigCounts[sigArray[i]], i, stArray);

        }

        tableGenerater = tableGenerater + "<tr><td></td><td id = \"" + labNoSpace + secondLabNoSpace + "\" colspan=\"6\"></td></tr>";
        tableGenerater = tableGenerater + "</Table>";
        tableGenerater = tableGenerater +  "<script>" +
        "$('#The" + labNoSpace + secondLabNoSpace + "SigTable tr td').click(function() {" +
        "var td = $(this).closest('td');" +
        "var tr = $(this).closest('tr');" +
        "generateSigVariantListForLabPair(tr[0].rowIndex -1, td[0].cellIndex - 2, \"" + primaryLab + "\", \"" + secondaryLab + "\");});" +
        "</script>";

        return tableGenerater;
    }

    function generateSigVariantListForLabPair(index1, index2, lab, secondaryLab) {
        var sigArray = Object.getOwnPropertyNames(countSigs());
        var sigVArray = generateSigVArrayForLabPair(sigArray, index1, index2, lab, secondaryLab);
        var labNoSpace = lab.replace(/[';\s&,\/()]+/g, "");
        var secondLabNoSpace = secondaryLab.replace(/[';\s&,\/()]+/g, "");
        var htmlOutput = "";
        for ( var i = 0; i < sigVArray.length; i++ ) {
            htmlOutput = htmlOutput + buildVariantTable(sigVArray[i]);
        }
        $("#" + labNoSpace + secondLabNoSpace ).html(htmlOutput);
    }

    function totalCount(stArray) {
        var count = 0;
        for ( var i = 0; i < stArray.length; i++ ) {
            for ( var j = 0; j < stArray[i].length; j++ ) {
                count = count + stArray[i][j];
            }
        }

        return count;
    }

    function generateLabCountTable (labCounts, labArray) {
        clearAreas();
        var ltArray = generateLabTable(labArray);
        var tableGenerater = "<Table id = \"TheLabMegaTable\" width = \"100%\" >";
        tableGenerater = tableGenerater + labTableHeader(labArray);

        for ( var i = 0; i < labArray.length; i++ ) {
            tableGenerater = tableGenerater + writeLabTableRow(labArray[i], labCounts[labArray[i]], i, ltArray);

        }
        tableGenerater = tableGenerater + "</Table>";

        $("#Area1").html(tableGenerater);

        $('#TheLabMegaTable tr td').click(function () {
            var td = $(this).closest('td');
            var tr = $(this).closest('tr');


            generateLabVariantTables(td[0].cellIndex - 3, tr[0].rowIndex - 1);
        });
        addHighlighter();
    }

    function generateLabTable(labArray) {
        var tableGenerater = "";
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
                    ltArray[kIndex] [jIndex] = ltArray[kIndex] [jIndex] + 1;
                }
            }
        }
        return ltArray;
    }

    function sigTableHeader(sigArray) {
        var headerGenerater = "<tr><td>Significance Name</td><td>Significance Variant Count</td>";
        for( i = 0; i < sigArray.length; i++ ) {
            headerGenerater = headerGenerater + "<td>" + sigArray[i] + "</td>";
        }
        headerGenerater = headerGenerater + "</tr>";
        return headerGenerater;

    }

    function labTableHeader(labArray) {
        var headerGenerater = "<tr><td>Lab Name</td><td>Lab #</td><td>Lab Variant Count</td>";
        for( i = 0; i < labArray.length; i++ ) {
            headerGenerater = headerGenerater + "<td>Lab " + ( i + 1 ) + "</td>";
        }
        headerGenerater = headerGenerater + "</tr>";
        return headerGenerater;

    }

    function countSigs() {
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

    function countLabs() {
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

    function createUniqueLabsArray () {
        var uniqueLabs = new Array();
        for ( var i = 0; i < vArray.length; i++ ) {
            $.each(vArray[i].labInterps, function (i, el) {
                if ($.inArray(el.source, uniqueLabs) === -1) uniqueLabs.push(el.source);
            });
        }
        return uniqueLabs;
    }

    function generateSelectionBox() {
        clearAreas();
        var htmlOut = "<select onChange=\"selectBoxChanged()\" id=\"varSelect\">";
        for ( var i = 0; i < vArray.length; i++) {
            htmlOut = htmlOut + "<option value=\"" + i + "\">" + vArray[i].name + "</option>";
        }
        htmlOut = htmlOut + "</select>";

        $("#Area1").html(htmlOut);
    }

    function selectBoxChanged() {
        var myselect = document.getElementById("varSelect");
        var selectIndex = myselect.options[myselect.selectedIndex].value;

        var htmlOutput = buildVariantTable(vArray[selectIndex]);
        $("#variantDisplay").html(htmlOutput);

    }

    // This function reads all of the information related to the variant: name and transcript.
    function readVariant(vArray, fArray) {

        var variant = new Object();

        variant.name = fArray[3];
        variant.labInterps = new Array();
        variant.transcript = "";

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

    function readInterpPair(interpPairsArray,lArray) {
        var fArray = lArray[0].split('\t');

        //If a line contains a return character put the line back together
        while (fArray.length < 25) {
            if(fArray.length < 24) {
//               alert("fArray length is less then to 24 when putting lines back together!  Line " + lArray.length + ".");
            }
            lArray.shift();
            var restOfLine = lArray[0].split('\t');
            fArray[fArray.length - 1] = fArray[fArray.length - 1] + restOfLine[0];
            restOfLine.shift();
            fArray = fArray.concat(restOfLine);
        }

        if(fArray.length !== 25) {
            alert("fArray length is not equal to 25! Line " + lArray.length + ".");
        }

        //Only consider lines that meet this criteria
        if(fArray[24] != '-1' && fArray[24] != '0') {
            if (fArray[8] != 'not provided' && fArray[18] != 'not provided') {
                readVariant(interpPairsArray, fArray); // Reads overall variant.
                readLabInterp(interpPairsArray, fArray, 0); // Reads the 1st lab interp.
                readLabInterp(interpPairsArray, fArray, 1); // Reads the 2nd lab interp.
            }
        }

    }

    function buildVariantTable(variant) {
        var htmlOutput = "<Table width = \"100%\" >";
        htmlOutput = htmlOutput + "<tr>";
        htmlOutput = htmlOutput + variant.transcript + variant.name;
        htmlOutput = htmlOutput + "</tr>";

        htmlOutput = htmlOutput + "<tr>";
        htmlOutput = htmlOutput + buildLabInterpTable(variant);
        htmlOutput = htmlOutput + "</tr>";
        htmlOutput = htmlOutput + "</table>";

        return htmlOutput;
    }

    function buildLabInterpTable(variant) {

        var htmlOutput = "";

        htmlOutput = htmlOutput + writeRow(variant.labInterps ,"source");
        htmlOutput = htmlOutput + writeRow(variant.labInterps ,"significance");
        htmlOutput = htmlOutput + writeRow(variant.labInterps ,"evalDate");
        htmlOutput = htmlOutput + writeRow(variant.labInterps ,"scv");
        htmlOutput = htmlOutput + writeRow(variant.labInterps ,"comments");

        return htmlOutput;
    }

    function writeRow (labInterps, propName) {

        var htmlOutput = "<tr>";

        for ( var i = 0; i < labInterps.length; i++) {
            htmlOutput = htmlOutput + writeTD(labInterps);
            htmlOutput = htmlOutput + labInterps[i][propName];
            htmlOutput = htmlOutput + "</td>";
        }

        htmlOutput = htmlOutput + "</tr>";

        return htmlOutput;

    }

    function writeTD(labInterps) {
        return "<td width = \"100/" + labInterps.length + "\">";
    }

    function writeLabTable(labInterp) {
        var htmlOutput = "<table>";
        htmlOutput = htmlOutput + writeTableRow(labInterp.source);
        htmlOutput = htmlOutput + writeTableRow(labInterp.scv);
        htmlOutput = htmlOutput + writeTableRow(labInterp.significance);
        htmlOutput = htmlOutput + writeTableRow(labInterp.evalDate);
        htmlOutput = htmlOutput + writeTableRow(labInterp.comments);
        htmlOutput = htmlOutput + "</table>";

        return htmlOutput;
    }

    function writeTableRow(input) {
        var htmlOutput = "<tr><td>";
        htmlOutput = htmlOutput + input;
        htmlOutput = htmlOutput + "</td></tr>";

        return htmlOutput;
    }

    function writeSigTableRow(sigName, sigCount, sigIndex, stArray) {
        var htmlOutput = "<tr><td>";
        htmlOutput = htmlOutput + sigName;
        htmlOutput = htmlOutput + "</td><td>";
        htmlOutput = htmlOutput + "Coming Soon";
        htmlOutput = htmlOutput + "</td>";
        for ( var i = 0; i < stArray[sigIndex].length; i++ ) {
            htmlOutput = htmlOutput + "<td>" + stArray[sigIndex][i] + "</td>";
        }
        htmlOutput = htmlOutput + "</tr>";

        return htmlOutput;
    }

    function writeLabTableRow(labName, labCount, labIndex, ltArray) {
        var htmlOutput = "<tr><td>";
        htmlOutput = htmlOutput + labName;
        htmlOutput = htmlOutput + "</td><td>";
        htmlOutput = htmlOutput + ( labIndex + 1 );
        htmlOutput = htmlOutput + "</td><td>";
        htmlOutput = htmlOutput + labCount;
        htmlOutput = htmlOutput + "</td>";
        for ( var i = 0; i < ltArray[labIndex].length; i++ ) {
            htmlOutput = htmlOutput + "<td>" + ltArray[labIndex][i] + "</td>";
        }
        htmlOutput = htmlOutput + "</tr>";

        return htmlOutput;
    }

    // Reads the lab interps in the variant and pushes it onto the labInterps array.
    function readLabInterp(vArray,fArray,index) {
        var labInterp = new Object();

        labInterp.scv = fArray[6 + (index*10)];
        labInterp.source = fArray[4+ (index*10)];
        labInterp.significance = fArray[8+ (index*10)];
        labInterp.evalDate = fArray[9+ (index*10)];
        labInterp.comments = fArray[13+ (index*10)];

        var lastVariantIndex = vArray.length - 1;

        var lastVariant = vArray[lastVariantIndex];
        lastVariant.labInterps.push(labInterp);

    }

    function readComments (lArray) {
        var line = readValueFromNameValuePair(lArray);

        while(lArray.length != 0 &&
                lArray[0].trim().length != 0 &&
                lArray[0].slice(0,5).localeCompare("scv2:") != 0 ) {
            var test = lArray[0].slice(0,4);
            line = line + lArray[0];
            lArray.shift();
        }

        return line;
    }

