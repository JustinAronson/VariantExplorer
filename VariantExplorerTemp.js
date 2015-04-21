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

    function processDiffFile (location) {

        var myReadStatus = jQuery.get('input/diff_rpt.txt', function (fileContents) {

            vArray = new Array(0);

            // split the file contents into an array of lines

            var lArray = fileContents.split('\n');

            readFile(vArray, lArray);

            vArray.sort(compareVariants); // This function sorts the variants in alphabetical order by name.
            vArray = collapseVariant(vArray); /* This function combines every two variants that have the same name and are next to each other in the array.
                                                 When merging variants, it also merges lab interpretations. */

            generateStatistics(vArray);

            generateSelectionBox(vArray); // This function creates the selection box that contains all of the variant names.

            addHighlighter();

            var stopper = 0;
        } // End of function
        ); // End of jQuery.get

            myReadStatus.fail(function () {
                alert("file not loaded");
                });
    }

    function generateStatistics(vArray){
        var statistics = new Object();

        statistics.variantNumbers = vArray.length + " variants";
        statistics.uniqueLabs = createUniqueLabsArray(vArray);
        statistics.labAppearences = countLabs(vArray);
        statistics.sigAppearences = countSigs(vArray);
        var inputCounter = countLabs(vArray);
        var labArray = Object.getOwnPropertyNames(statistics.labAppearences);
        var sigArray = Object.getOwnPropertyNames(statistics.sigAppearences);

        var inputNumbersAndUniqueLabs = statistics.variantNumbers + ", " + statistics.uniqueLabs.length + " unique labs";
        var inputAppearencesForSigs = generateSigCountTable(statistics.sigAppearences, sigArray);
        var inputAppearencesForLabs = generateLabCountTable(statistics.labAppearences, labArray);

//        var inputlabTable = generateLabTable(vArray, Object.getOwnPropertyNames(inputCounter));
        $("#variantLabStatistics").html(inputNumbersAndUniqueLabs + inputAppearencesForLabs);
        $("#variantSigStatistics").html(inputAppearencesForSigs);

        generateSigVariantTables(2, 2);

    }

    function generateSigCountTable (sigCounts, sigArray) {
        var stArray = generateSigTable(vArray, sigArray);
        var tableGenerater = "<Table width = \"100%\" >";
        tableGenerater = tableGenerater + sigTableHeader(sigArray);

        for ( var i = 0; i < sigArray.length; i++ ) {
            tableGenerater = tableGenerater + writeSigTableRow(sigArray[i], sigCounts[sigArray[i]], i, stArray);

        }
        tableGenerater = tableGenerater + "</Table>";

        return tableGenerater;
    }

    function generateLabCountTable (labCounts, labArray) {
        var ltArray = generateLabTable(vArray, labArray);
        var tableGenerater = "<Table width = \"100%\" >";
        tableGenerater = tableGenerater + labTableHeader(labArray);

        for ( var i = 0; i < labArray.length; i++ ) {
            tableGenerater = tableGenerater + writeLabTableRow(labArray[i], labCounts[labArray[i]], i, ltArray);

        }
        tableGenerater = tableGenerater + "</Table>";

        return tableGenerater;
    }

    function generateSigTable(vArray, sigArray) {
        var tableGenerater = "";
        var stArray = createSigTableArray(sigArray);
        for ( var i = 0; i < vArray.length; i++ ) {
            var iArray = vArray[i].labInterps;
            for ( var j = 0; j < iArray.length; j++ ) {
                var name1 = iArray[j].significance;
                var jIndex = sigArray.indexOf(name1);
                for ( var k = j + 1; k < iArray.length; k++ ) {
                    var name2 = iArray[k].significance;
                    var kIndex = sigArray.indexOf(name2);
                    if (name1 != name2) {
                        stArray[jIndex] [kIndex] = stArray[jIndex] [kIndex] + 1;
                        stArray[kIndex] [jIndex] = stArray[kIndex] [jIndex] + 1;
                    }
                }
            }
        }
        return stArray;
    }

    function generateSigVariantTables(index1, index2) {
        var sigArray = Object.getOwnPropertyNames(countSigs(vArray));
        var sigVArray = generateSigVArray(vArray, sigArray, index1, index2);
        var htmlOutput = "";
        for ( var i = 0; i < sigVArray.length; i++ ) {
            htmlOutput = htmlOutput + buildVariantTable(sigVArray[i]);
        }

        $("#sigVariants").html(htmlOutput);
    }

    function generateSigVArray(vArray, sigArray, index1, index2) {
        var tableGenerater = "";
        var sigVArray = new Array();
        for ( var i = 0; i < vArray.length; i++ ) {
            var iArray = vArray[i].labInterps;
            for ( var j = 0; j < iArray.length; j++ ) {
                var name1 = iArray[j].significance;
                var jIndex = sigArray.indexOf(name1);
                if(jIndex === index1) {
                    for ( var k = j + 1; k < iArray.length; k++ ) {
                        var name2 = iArray[k].significance;
                        var kIndex = sigArray.indexOf(name2);
                        if (kIndex === index2) {
                            if (name1 != name2) {
                                sigVArray.push(vArray[i]);
                            }
                        }
                    }
                }
            }
        }
        return sigVArray;
    }

    function generateLabTable(vArray, labArray) {
        var tableGenerater = "";
        var ltArray = createLabTableArray(labArray);
        var name;
        for ( var i = 0; i < vArray.length; i++ ) {
            var iArray = vArray[i].labInterps;
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

    function addHighlighter() {
        var allCells = $('td, th');
        allCells.on('mouseover', function () {
            var el = $(this), pos = el.index();
            el.parent().find('th, td').addClass('hover');
            allCells.filter(':nth-child(' + (pos + 1) + ')').addClass('hover');
        }).on('mouseout', function () {
            allCells.removeClass('hover');
        });
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

    function createSigTableArray(sigArray) {
        var stArray = new Array();
        for ( var i = 0; i < sigArray.length; i++ ){
            stArray[i] = new Array();
            for ( var j = 0; j < sigArray.length; j++ ) {
                stArray[i][j] = 0;
            }
        }

        return stArray;
    }

    function createLabTableArray(labArray) {
        var ltArray = new Array();
        for ( var i = 0; i < labArray.length; i++ ){
            ltArray[i] = new Array();
            for ( var j = 0; j < labArray.length; j++ ) {
                ltArray[i][j] = 0;
            }
        }

        return ltArray;
    }

    function countSigs(vArray) {
        var sigCounters = new Object();

        for ( var i = 0; i < vArray.length; i++ ) {
            for ( var j = 0; j < vArray[i].labInterps.length; j++ ) {
                var sigClass = vArray[i].labInterps[j].significance;
                var propArray = Object.getOwnPropertyNames(sigCounters);

                if (propArray.indexOf(sigClass) === -1) {
                    sigCounters[sigClass] = 0;
                }
                sigCounters[sigClass] = sigCounters[sigClass] + 1;
            }
        }

        return sigCounters;
    }

    function countLabs(vArray) {
        var labCounters = new Object();

        for ( var i = 0; i < vArray.length; i++ ) {
            for ( var j = 0; j < vArray[i].labInterps.length; j++ ) {
                var labName = vArray[i].labInterps[j].source;
                var propArray = Object.getOwnPropertyNames(labCounters);

                if (propArray.indexOf(labName) === -1) {
                    labCounters[labName] = 0;
                }
                labCounters[labName] = labCounters[labName] + 1;
            }
        }

        return labCounters;
    }

    function createUniqueLabsArray (vArray) {
        var uniqueLabs = new Array();
        for ( var i = 0; i < vArray.length; i++ ) {
            $.each(vArray[i].labInterps, function (i, el) {
                if ($.inArray(el.source, uniqueLabs) === -1) uniqueLabs.push(el.source);
            });
        }
        return uniqueLabs;
    }

    // This function determines whether or not a lab interp is already in the array, and if it isn't, it pushes it onto the interp array.
    function pushInterpIfNotPresent (variant, labInterp) {
        var isPresent = false; // If this function is deemed true, the lab interp is already in the array, and we do not want to push it again.
        for ( var i = 0; i < variant.labInterps.length; i++ ) {
            if ( variant.labInterps[i].scv == labInterp.scv ) {
                isPresent = true;
            }
        }

        if (!isPresent) {
            variant.labInterps.push(labInterp);
        }

    }

    function collapseVariant(vArray) {
        var collapsedVArray = new Array();
        collapsedVArray.push(vArray[0]);
        for ( var i = 1; i < vArray.length - 1; i++ ) {
            if (compareVariants(vArray[i - 1], vArray[i]) != 0) {
                collapsedVArray.push(vArray[i]);
            } else {
                pushInterpIfNotPresent(collapsedVArray[collapsedVArray.length - 1], vArray[i].labInterps[0]);
                pushInterpIfNotPresent(collapsedVArray[collapsedVArray.length - 1], vArray[i].labInterps[1]);
                // These functions are making sure that all of the variant's lab interpretations are being represented.
            }
        }
        return collapsedVArray;
    }

    function readFile(vArray, lArray) {
        while(lArray.length > 0) {
            readInterpPair(vArray, lArray);
         }

    }

    function generateSelectionBox(vArray) {
        var htmlOut = "<select onChange=\"selectBoxChanged()\" id=\"varSelect\">";
        for ( var i = 0; i < vArray.length; i++) {
            htmlOut = htmlOut + "<option value=\"" + i + "\">" + vArray[i].name + "</option>";
        }
        htmlOut = htmlOut + "</select>";

        $("#selectBox").html(htmlOut);
    }

    function selectBoxChanged() {
        var myselect = document.getElementById("varSelect");
        var selectIndex = myselect.options[myselect.selectedIndex].value;

        var htmlOutput = buildVariantTable(vArray[selectIndex]);
        $("#variantDisplay").html(htmlOutput);

    }

    // This function reads all of the information related to the variant: name and transcript.
    function readVariant(vArray, lArray) {
        lArray.shift();

        var variant = new Object();

        variant.name = readValueFromNameValuePair(lArray);
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

    function readInterpPair(vArray,lArray) {
        readVariant(vArray,lArray); // Reads overall variant.
        readLabInterp(vArray,lArray); // Reads the 1st lab interp.
        readLabInterp(vArray,lArray); // Reads the 2nd lab interp.
        while(lArray.length != 0 && (lArray[0].trim().length == 0  || lArray[0].indexOf(':') == -1)) {
            lArray.shift();
        }

    }

    function buildVariantTable(variant) {
        var htmlOutput = "<Table width = \"100%\" >";
        htmlOutput = htmlOutput + "<tr>";
        htmlOutput = htmlOutput + variant.transcript;
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
        htmlOutput = htmlOutput + sigCount;
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
    function readLabInterp(vArray,lArray) {
        var labInterp = new Object();

        labInterp.scv = readValueFromNameValuePair(lArray);
        labInterp.source = readValueFromNameValuePair(lArray);
        labInterp.significance = readValueFromNameValuePair(lArray);
        labInterp.evalDate = readValueFromNameValuePair(lArray);
        labInterp.key = readValueFromNameValuePair(lArray);
        labInterp.comments = readComments(lArray);

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

