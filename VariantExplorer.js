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
    sigArray = readJSONArray('input/sigArray.json');
    labArray = readJSONArray('input/labArray.json');

    $('#TheStatisticsTable tr td').click(function () {

        var td = $(this).closest('td');

        var tr = $(this).closest('tr');

//        generateSigVariantTables(td[0].cellIndex - 2, tr[0].rowIndex - 1);

    });


    /*
    document.getElementById("LabMegaTableButton").onclick = function () {

        clearAreas();

        generateMegaTable(labArray);

        ga('send', 'pageview', '/LabMegaTable');

    };
     */

    window.onload = function () {
        clearAreas();
        generateHome();
        ga('send', 'pageview', '/');
    };

    document.getElementById("HomeButton").onclick = function () {
        clearAreas();
        generateHome();
        ga('send', 'pageview', '/');
    };

    document.getElementById("AboutButton").onclick = function () {
        clearAreas();
        generateAbout();
        ga('send', 'pageview', '/About');
    };

    document.getElementById("LabSearchButton").onclick = function () {
        clearAreas();
        generateLabSearchButtons();
        ga('send', 'pageview', '/LabSearch');
    };

    document.getElementById("SignificanceSearchButton").onclick = function () {

        clearAreas();

        $("#Area1").html(

            "<div class=\"container-fluid \"><div class=\"row \"><div class=\"col-sm-12 \"><h4 class=\"margin-none\">Search By Significance</h4>A Clinical Significance Breakdown Table of all discrepancies in ClinVar <hr /></div> </div><div class=\"row \"><div class=\"col-sm-12 \">" +

            generateSigCountTable (sigArray, "N/A", 1, null, "N/A") +
//            generateSigCountTable(countSigs(), sigArray, "N/A", 1, interpPairsArray, "N/A") +

            "</td></tr></div></div></div>");

        ga('send', 'pageview', '/SignificanceTable');

    };



    addHighlighter();
}

function selectLab(lab) {
    console.log("selectLab: " + lab);
    var labNameNoSpecialChars = lab.replace(/\//g, '');
    var labNameNoSpace = labNameNoSpecialChars.replace(/\s/g, '');
    var labInterpPairsArray = readJSONArray('input/labFiles/' + labNameNoSpace + 'interpPairsArray.json');
    var labSigs = createLabSigArray(labInterpPairsArray);
    var tableGenerater = "";
    tableGenerater = tableGenerater + generateSigCountTable(labSigs, "0 ", 0, labInterpPairsArray, lab);

    for (var i = 0; i < labArray.length; i++) {
        if(labArray[i] !== lab) {
            var labPairArray = generateLabLArray(labInterpPairsArray, labArray[i]);
            var sigTable = generateSigCountTable(labSigs, labArray[i], 0, labPairArray, lab);
                if (sigTable !== "") {
                    tableGenerater = tableGenerater + "<tr><td>" + lab + "</td><td text-align:center>" + labArray[i] + sigTable + "</td></tr>";
                }
        }
    }

    $("#Area1").html("<div class=\" container \"><h2>Laboratory: " + lab + "<h2></div>");
    $("#Area2").html("<div class=\" container \"><h4>Lab by Lab Summary </h4></div>");
    $("#Area3").html("<div class=\" container \">" + generateConflictOrConfidenceTable(lab, labInterpPairsArray) + "</div>");
    $("#Area4").html("<div class=\" container \"><h4>Significance Break Downs</h4><Table id=\"TheLabSpecificTable\" class=\" table table-condensed  table-striped \" ><tr><td> </td><td text-align:center> All Other Labs: </td></tr><tr><td>" + lab + "</td><td>" + tableGenerater + "</td></tr></table></div>");
}

function generateLabLArray(labSpecificInterpPairsArray, secondLabName) {
    var labPairsArray = new Array();

    for (var i = 0; i < labSpecificInterpPairsArray.length; i++) {
        for (var j = 0; j < labSpecificInterpPairsArray[i].labInterps.length; j++) {
            if (labSpecificInterpPairsArray[i].labInterps[j].source === secondLabName) {
                labPairsArray.push(labSpecificInterpPairsArray[i]);
            }
        }
    }

    return labPairsArray;
}

function readJSONArray(url) {
    var obj = new Array(0);
    $.ajax({
        type: "GET",
        url: url,
        async: false,
        dataType: "text",
        success: function(response){
            obj = jQuery.parseJSON(response);
        },

        error: function(err) {
            console.log("Error loading:" + url + " err:" + err.toString());
        }
    });

    return obj;



}

function clearAreas(){
    $("#Home").html("");
    $("#Area1").html("");
    $("#Area2").html("");
    $("#Area3").html("");
    $("#Area4").html("");
    $("#Area5").html("");
    $("#labVariants").html("");
}

function generateConflictOrConfidenceTable(lab, labInterpPairsArray) {
    var cdtArray = generateConflictDiscrepencyArray(lab, labInterpPairsArray);
    var totalConflict = 0;
    var totalConfidence = 0;

    for ( var i = 0; i < cdtArray.length; i++ ) {
        if( cdtArray[i].conflict === 1 ){
            totalConflict = totalConflict + 1;
        } else {
            totalConfidence = totalConfidence + 1;
        }
    }

    var tableGenerater = "<Table id=\"TheConfidenceTable\" class=\" table table-condensed  table-striped table-bordered \" >";
    tableGenerater = tableGenerater + "<tr><td><b>" + "Lab Name" + "</b></td><td><b>" + "Conflict" + "</b></td><td><b>"  + "Confidence Discrepancy" + "</b></td><td><b>" + " Total " + "</b></td></tr>";

    for ( var j = 0; j < cdtArray.length; j++ ) {
        if(cdtArray[j].total !== 0) {
            tableGenerater = tableGenerater + "<tr><td>" + cdtArray[j].name + "</td><td>" + cdtArray[j].conflict + "</td><td>" + cdtArray[j].discrepency + "</td><td>" + cdtArray[j].total + "</td></tr>";
        }
    }

    tableGenerater = tableGenerater + "</table>";

    return tableGenerater;

}

function generateConflictDiscrepencyArray(lab, labInterpPairsArray){
    var cdtArray = createBlankCDTArray(labArray);
    var primaryLabSig;
    var primaryLabIndex;

    for ( var i = 0; i < labInterpPairsArray.length; i++ ) {
        // Find Pimary Lab Interp
        for (var j = 0; j < labInterpPairsArray[i].labInterps.length; j++) {
            if (lab === labInterpPairsArray[i].labInterps[j].source) {
                primaryLabSig = labInterpPairsArray[i].labInterps[j].significance;
                primaryLabIndex = j;
            }
        }

        // Add other discrepent interps
        for (var j = 0; j < labInterpPairsArray[i].labInterps.length; j++) {
                if (primaryLabIndex !== j && labInterpPairsArray[i].labInterps[j].source !== primaryLabSig) {
                    incrementCArray(labInterpPairsArray[i].labInterps[j].source, cdtArray, labInterpPairsArray[i].labInterps[j].significance,primaryLabSig);
                }
        }
    }

    return deleteBlanksFromCDTArray(cdtArray);
}

function deleteBlanksFromCDTArray(cdtArray) {
    for (var i = 0; i < cdtArray.length; i++) {
        if (cdtArray[i].total === 0) {
            cdtArray.splice(i, 1);
        }
    }

    return cdtArray;
}

function incrementCArray(lab, cdtArray, sig1, sig2) {

    //Default settings to be switched below if needed
    var discrepency = 0;
    var conflict = 1;

    if (((sig1 === "Pathogenic" || sig2 === "Pathogenic") && (sig1 === "Likely pathogenic" || sig2 === "Likely pathogenic")) ||
            ((sig1 === "Benign" || sig2 === "Benign") && (sig1 === "Likely benign" || sig2 === "Likely benign"))) {
        conflict = 0;
        discrepency = 1;
    }

    for ( var i = 0; i < cdtArray.length; i++ ) {
        if ( cdtArray[i].name === lab ) {
            cdtArray[i].conflict = cdtArray[i].conflict + conflict;
            cdtArray[i].discrepency = cdtArray[i].discrepency + discrepency;
            cdtArray[i].total = cdtArray[i].conflict + cdtArray[i].discrepency;
        }
    }
}

function createBlankCDTArray(labArray) {
    var newArray = new Array();
    for ( var i = 0; i < labArray.length; i++ ) {
        var object = new Object();
        object.name = labArray[i];
        object.conflict = 0;
        object.discrepency = 0;
        object.total = 0;
        newArray.push(object);
    }

    return(newArray);
}

function generateAbout() {

    clearAreas();

    var htmlOutput = "";

    htmlOutput = "<div class=\"container\"><div class=\"row \"><div class=\"col-sm-12 \"><h4 class=\"margin-none\">About Variant Explorer:</h4>Variant Explorer enables users to visualize differences in variant interpretations across laboratories.  Variant Explorer was created and is maintained by Justin Aronson, with significant clinical guidance from Dr. Steven Harrison and Dr. Heidi Rehm.  Larry Babb also provided technical guidance, along with Justin’s father Sandy Aronson.  A very significant update was provided by Scott Goehringer, who, among other things, radically improved the aesthetics of the site.<br><br>The code for Variant Explorer is available <a href=https://www.github.com/JustinAronson/VariantExplorer>here</a>.<br><br>Being a 13 year old, Justin felt a need to make a trailer available <a href=https://www.youtube.com/watch?v=z80mOGk5fuk>here</a>.<br><br>Feedback on this site is very much appreciated.  We can be reached at variantexplorer@gmail.com.</div></div>"

    $("#Area1").html(htmlOutput);

}

function generateHome() {
    clearAreas();
    var htmlOutput = "";
    htmlOutput = "<div class=\"container\"><h1 align = \"center\">Welcome to VariantExplorer!</h1>  <p>The goal of VariantExplorer is to facilitate identification of clinical significance interpretation discrepancies in ClinVar (<a href=\"http://www.ncbi.nlm.nih.gov/clinvar/\" target=\"_blank\">http://www.ncbi.nlm.nih.gov/clinvar/</a>), a submitter-driven repository that archives reports of the relationships among genomic variants and phenotypes submitted by clinical laboratories, researchers, clinicians, expert panels, practice guidelines, and other groups or organizations. Given the large number of submitters to ClinVar, many variants have interpretations from multiple submitters and those interpretations may not always agree. </p><p>By displaying how the full set of variant interpretations from a specific submitter compares to all other submitters (or to another specific submitter), VariantExplorer helps users view the types and levels of discrepancies in ClinVar. The submitter-specific Clinical Significance Breakdown Tables (seen below) displays pair-wise counts of discrepant interpretations, including confidence discrepancies (such as Benign vs Likely benign or Pathogenic vs Likely pathogenic). For example, the table below indicates there are 12 variants in ClinVar interpreted as Likely benign by Submitter A and interpreted as Uncertain significance by Submitter B. By displaying the discrepancies in this manner, VariantExplorer hopes to facilitate resolution of interpretation discrepancies.</p><div class=\"text-center\"> <h3 class=\"text-center margin-bottom-none\">Clinical Significance Breakdown Table example</h3><img src=\"img/chart.jpg\" class=\"img-responsive \" alt=\"Clinical Significance Breakdown Table example\" /></div><p><br /><strong>The discrepancy data in VariantExplorer can be viewed from four different approaches:</strong></p><ul class=\"list-group\"><li class=\"list-group-item\"><h4 class=\"margin-none\">Search By Submitter</h4>This option allows users to view all discrepancies with regard to a specific ClinVar submitter. Selecting a ClinVar submitter navigates to a Submitter by Submitter Summary table of all submitters with interpretations that are discrepant with the submitter of interest. The discrepancy counts are broken into Confidence Discrepancy and Conflict. Below the summary table are the Clinical Significance Breakdown Tables of each submitter-submitter pair listed in the Submitter by Submitter Summary table. Clicking the counts in any Clinical Significance Breakdown Table displays the variants with clinical significance discrepancies and summary information about each submission, such as asserted condition and date last evaluated. Selecting the variant name will direct a user to the variant page in ClinVar.  </li> <li class=\"list-group-item\"><h4 class=\"margin-none\">Show Submitter Mega Table</h4>This option allows users to view discrepancy counts between all submitters in ClinVar. Each submitter is assigned a lab number and hovering over a lab number or discrepancy count displays the full name of that ClinVar submitter. Clicking the discrepancy counts in any cell will display those variants of interest below the table. </li><li class=\"list-group-item\"><h4 class=\"margin-none\">Search By Significance</h4>A Clinical Significance Breakdown Table of all discrepancies in ClinVar</li><li class=\"list-group-item\"><h4 class=\"margin-none\">Search By Variant</h4>A dropdown list of all variants in ClinVar with clinical significance discrepancies</li></ul></div>"
    $("#Home").html(htmlOutput);
}

function generateLabSearchButtons() {
    var htmlOutput = "";

    for( var i = 0; i < labArray.length; i++ ) {
        htmlOutput = htmlOutput + "<div class=\"col-md-6 padding-thin \"><button class=\"btn btn-primary btn-block btn-text \" button type=\"button\" id=\"";
        htmlOutput = htmlOutput + labArray[i] + "\" onclick=\"selectLab('" + labArray[i] + "')\">" + labArray[i];
        htmlOutput = htmlOutput + "</button></div>"
    }

    htmlOutput = "<div class=\"container\"><div class=\"row \"><div class=\"col-sm-12 \"><h4 class=\"margin-none\">Search By Submitter</h4>This option allows users to view all discrepancies with regard to a specific ClinVar submitter. Selecting a ClinVar submitter navigates to a Submitter by Submitter Summary table of all submitters with interpretations that are discrepant with the submitter of interest. The discrepancy counts are broken into Confidence Discrepancy and Conflict. Below the summary table are the Clinical Significance Breakdown Tables of each submitter-submitter pair listed in the Submitter by Submitter Summary table. Clicking the counts in any Clinical Significance Breakdown Table displays the variants with clinical significance discrepancies and summary information about each submission, such as asserted condition and date last evaluated. Selecting the variant name will direct a user to the variant page in ClinVar. <hr /></div> </div><div class=\"row \">" + htmlOutput + "</div></div>"

    $("#Area1").html(htmlOutput);

}

function generateSigCountTable (labSigs, secondaryLab, labSpecificFlag, array, primaryLab) {
    clearAreas();

    var stArray;

    if(primaryLab === secondaryLab && primaryLab === "N/A") {
        stArray = readJSONArray('input/sigTableArray.json');
    } else {
        stArray = generateSigTableArray(labSigs, primaryLab, labSpecificFlag, array, secondaryLab);
    }

    if (checkIfValuesInSTArray (stArray) === false) {
        return "";
    }

    var tableGenerator = "";
    var labNoSpace = primaryLab.replace(/[';\s&,\/()]+/g, "");
    var secondLabNoSpace = secondaryLab.replace(/[';\s&,\/()]+/g, "");
    tableGenerator = "<Table id=\"The" + labNoSpace + secondLabNoSpace + "SigTable\" class=\" table table-condensed  table-striped table-bordered \" >";
    tableGenerator = tableGenerator + sigTableHeader(labSigs);

    for (var i = 0; i < labSigs.length; i++) {
        tableGenerator = tableGenerator + writeSigTableRow(labSigs[i], i, stArray, primaryLab);
    }

    tableGenerator = tableGenerator + "<tr><td></td><td id = \"" + labNoSpace + secondLabNoSpace + "\" colspan=\"6\"></td></tr>";
    tableGenerator = tableGenerator + "</Table>";
    tableGenerator = tableGenerator +  "<script>" +
        "$('#The" + labNoSpace + secondLabNoSpace + "SigTable tr td').click(function() {" +
        "var td = $(this).closest('td');" +
        "var tr = $(this).closest('tr');";
    tableGenerator = tableGenerator + "generateSigVariantListForLabPair(tr[0].rowIndex -1, td[0].cellIndex - 1, \"" + primaryLab + "\", \"" + secondaryLab + "\");});";
    tableGenerator = tableGenerator + "</script>";

    return tableGenerator;
}

function generateSigVariantListForLabPair(index1, index2, lab, secondaryLab) {
    console.log("In generateVariantListForLabPair: index1:" + index1 + " index2:" + index2 + "lab:" + lab + "secLab:" + secondaryLab );
        var sigVArray = generateSigVArrayForLabPair(sigArray, index1, index2, lab, secondaryLab);
        var labNoSpace = lab.replace(/[';\s&,\/()]+/g, "");
        var secondLabNoSpace = secondaryLab.replace(/[';\s&,\/()]+/g, "");
        var htmlOutput = "";

        for (var i = 0; i < sigVArray.length; i++) {
            htmlOutput = htmlOutput + buildVariantTable(sigVArray[i]);
        }

        $("#" + labNoSpace + secondLabNoSpace).html(htmlOutput);
        window.location.hash= "#" + labNoSpace + secondLabNoSpace;
}

function checkIfValuesInSTArray(stArray) {
    for ( var i = 0; i < stArray.length; i++ ) {
        for ( var j = 0; j < stArray[i].length; j++ ) {
            if (stArray[i][j] !== 0 && stArray[i][j] !== "x") {
                return true;
            }
        }
    }

    return false;
}

function generateMegaTable (labArray) {
    clearAreas();
    var ltArray = readJSONArray('input/megaTableArray.json');
    var labCounts = readJSONArray('input/labCounts.json');

    var tableGenerater = "<div class=\"container-fluid row \"><div class=\"col-sm-12 \"><h4 class=\"margin-none\">Show Submitter Mega Table</h4>This option allows users to view discrepancy counts between all submitters in ClinVar. Each submitter is assigned a lab number and hovering over a lab number or discrepancy count displays the full name of that ClinVar submitter. Clicking the discrepancy counts in any cell will display those variants of interest below the table. <hr /></div> </div><div class=\"table-responsive container-fluid \"><table id = \"TheLabMegaTable\" class=\" table table-condensed  table-striped table-bordered \" >";
    tableGenerater = tableGenerater + labTableHeader(labArray);

    for ( var i = 0; i < labArray.length; i++ ) {
        tableGenerater = tableGenerater + writeLabTableRow(labArray[i], labCounts[labArray[i]], i, ltArray);
    }

    tableGenerater = tableGenerater + "</table></div>";

    $("#Area1").html(tableGenerater);

    $('#TheLabMegaTable tr td').click(function () {
        var td = $(this).closest('td');
        var tr = $(this).closest('tr');

        selectLab(labArray[tr[0].rowIndex - 1]);
    });

    addHighlighter();
}



function generateSigTableArray(sigArray, primaryLab, labSpecificFlag, array, secondaryLab) {
    var stArray = initializeSTArray(sigArray.length);
    for ( var i = 0; i < array.length; i++ ) {
        var iArray = array[i].labInterps;

        for (var j = 0; j < sigArray.length; j++) {
            for (var k = 0; k < sigArray.length; k++) {
                if (j === k) {
                    stArray[j][k] = "x";
                } else {
                    if (interpsContainsPair(iArray, sigArray[j], primaryLab, sigArray[k], secondaryLab)) {
                        stArray[j][k]++;
                    }
                }
            }
        }

    }
    return stArray;
}


/*function generateSigVariantTables(index1, index2) {

    var sigArray = Object.getOwnPropertyNames(countSigs());

    var sigVArray = generateSigVArray(sigArray, index1, index2);

    var htmlOutput = "";

    for ( var i = 0; i < sigVArray.length; i++ ) {

        htmlOutput = htmlOutput + buildVariantTable(sigVArray[i]);

    }



    $("#sigVariants").html(htmlOutput);

}*/
function generateLabVariantTables(index1, index2) {
    var labNameNoSpecialChars = labArray[index1].replace(/\//g, '');
    var labNameNoSpace = labNameNoSpecialChars.replace(/\s/g, '');
    var labInterpPairsArray = readJSONArray('/input/labFiles/' + labNameNoSpace + 'interpPairsArray.json');
    var LabVArray = generateLabVArray(labArray, index1, index2, labInterpPairsArray);
    var htmlOutput = "";
    htmlOutput = htmlOutput + "<div id=\"variantSection\" >";

    for ( var i = 0; i < LabVArray.length; i++ ) {
        htmlOutput = htmlOutput + buildVariantTable(LabVArray[i]);
    }

    htmlOutput = htmlOutput + "</div>";

    $("#labVariants").html(htmlOutput);
}

/*function generateSigVArray(sigArray, index1, index2) {

    var sigVArray = new Array();

    for ( var i = 0; i < interpPairsArray.length; i++ ) {

        var iArray = interpPairsArray[i].labInterps;

        for ( var j = 0; j < iArray.length; j++ ) {

            var name1 = iArray[j].significance;

            var jIndex = sigArray.indexOf(name1);

            if(jIndex === index1 || jIndex === index2) {

                for ( var k = j + 1; k < iArray.length; k++ ) {

                    var name2 = iArray[k].significance;

                    var kIndex = sigArray.indexOf(name2);

                    if (kIndex === index2 || kIndex === index1) {

                        if (name1 != name2) {

                            sigVArray.push(interpPairsArray[i]);

                        }

                    }

                }

            }

        }

    }

    return sigVArray;

}*/

function generateSigVArrayForLabPair(sigArray, labSigIndex, secLabSigIndex, lab, secondaryLab) {
    var sigVArray = new Array();

    var labNameNoSpecialChars = lab.replace(/\//g, '');
    var labNameNoSpace = labNameNoSpecialChars.replace(/\s/g, '');
    var labInterpPairsArray = readJSONArray('/input/labFiles/' + labNameNoSpace + 'interpPairsArray.json');
    var lSig = sigArray[labSigIndex];
    var slSig = sigArray[secLabSigIndex];

    for (var i = 0; i < labInterpPairsArray.length; i++) {
        var labInterps = labInterpPairsArray[i].labInterps;

        if (interpsContainsPair(labInterps, lSig, lab, slSig, secondaryLab)) {
            sigVArray.push(labInterpPairsArray[i]);
        }
    }
    return sigVArray;

}

function interpsContainsPair(labInterps, sig1, lab1, sig2, lab2) {
    if(interpsContains(labInterps, sig1, lab1) && interpsContains(labInterps, sig2, lab2)) {
        return true;
    } else {
        return false;
    }
}

function interpsContains(labInterps, sig, lab ) {
    for (var i = 0; i < labInterps.length; i++) {
        if (labInterps[i].significance === sig &&
            (labInterps[i].source === lab || lab === "0 "))  //lab = "0 " indicates wildcard
        {
            return true;
        }
    }

    return false;
}

function generateLabVArray(labArray, index1, index2, labInterpPairsArray) {
    var LabVArray = new Array();

    for (var i = 0; i < labInterpPairsArray.length; i++) {
        var iArray = labInterpPairsArray[i].labInterps;

        for (var j = 0; j < iArray.length; j++) {
            var name1 = iArray[j].source;
            var jIndex = labArray.indexOf(name1);

            if (jIndex === index1 || jIndex === index2) {

                for (var k = j + 1; k < iArray.length; k++) {
                    var name2 = iArray[k].source;
                    var kIndex = labArray.indexOf(name2);

                    if (kIndex === index2 || kIndex === index1) {

                        if (name1 !== name2) {
                            LabVArray.push(labInterpPairsArray[i]);
                        }
                    }
                }
            }
        }
    }

    return LabVArray;
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
    var headerGenerator = "<thead><tr><th>Significance Name</th>";

    for( i = 0; i < sigArray.length; i++ ) {
        headerGenerator = headerGenerator + "<th>" + sigArray[i] + "</th>";
    }
    headerGenerator = headerGenerator + "</tr></thead>";

    return headerGenerator;
}

function labTableHeader(labArray) {
    var headerGenerater = "<thead><tr><th>Lab Name</th><th>Lab #</th><th>Lab Variant Count</th>";

    for( i = 0; i < labArray.length; i++ ) {
        headerGenerater = headerGenerater + "<th><span data-toggle=\"tooltip\" data-placement=\"top\" title=\"" + labArray[i] + "\">Lab " + ( i + 1 ) + "</span></th>";
    }

    headerGenerater = headerGenerater + "</tr></thead>";

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


function createLabSigArray(labPairsArray) {
    var labSigs = new Array();

    labSigs.push("Pathogenic");
    labSigs.push("Likely pathogenic");
    labSigs.push("Uncertain significance");
    labSigs.push("Likely benign");
    labSigs.push("Benign");

    for ( var i = 0; i < labPairsArray.length; i++ ) {
        for ( var j = 0; j < labPairsArray[i].labInterps.length; j++ ) {
            var sigClass = labPairsArray[i].labInterps[j].significance;
            if (labSigs.indexOf(sigClass) === -1) {
                labSigs.push(sigClass);
            }
        }
    }

    return labSigs;
}

function buildVariantTable(variant) {
    var htmlOutput = "<Table class=\"table table-condensed table-bordered  table-striped \" >";
    htmlOutput = htmlOutput + "<tr>";
    htmlOutput = htmlOutput + "<h3><a href=\"http://www.ncbi.nlm.nih.gov/clinvar/?term=" + variant.name + "\" target=\"_blank\">" + variant.transcript + variant.name + " <i class=\"glyphicon glyphicon-new-window \"></i></a></h3>";
    htmlOutput = htmlOutput + "</tr>";

    htmlOutput = htmlOutput + "<tr>";
    htmlOutput = htmlOutput + buildLabInterpTable(variant);
    htmlOutput = htmlOutput + "</tr>";
    htmlOutput = htmlOutput + "</table>";

    return htmlOutput;
}

function buildLabInterpTable(variant) {
    var htmlOutput = "";

    htmlOutput = htmlOutput + writeRow(variant.labInterps ,"source", 0);
    htmlOutput = htmlOutput + writeRow(variant.labInterps ,"significance", 1);
    htmlOutput = htmlOutput + writeRow(variant.labInterps ,"evalDate", 0);
    htmlOutput = htmlOutput + writeRow(variant.labInterps ,"scv", 0);
    htmlOutput = htmlOutput + writeRow(variant.labInterps ,"comments", 0);

    return htmlOutput;
}

function writeRow (labInterps, propName, sigFlag) {

    var htmlOutput = "<tr>";



    for ( var i = 0; i < labInterps.length; i++) {

        htmlOutput = htmlOutput + writeTD(labInterps);

        if(sigFlag === 1) {

            htmlOutput = htmlOutput + labInterps[i][propName] + " (" + labInterps[i].subCondition + ")";

        } else {

            htmlOutput = htmlOutput + labInterps[i][propName];

        }

        htmlOutput = htmlOutput + "</td>";

    }



    htmlOutput = htmlOutput + "</tr>";



    return htmlOutput;

}

function writeTD(labInterps) {

    return "<td width = \"100/" + labInterps.length + "\">";

}

function writeSigTableRow(sigName, sigIndex, stArray, lab) {
    var htmlOutput = "<tr><td>";
    htmlOutput = htmlOutput + sigName;
    htmlOutput = htmlOutput + "</td>";

    for ( var i = 0; i < stArray[sigIndex].length; i++ ) {
        var value = stArray[sigIndex][i];
        if (value > 0 && lab !== "N/A") {
            htmlOutput = htmlOutput + "<td><span style=\"text-decoration: underline;\">" + value + "</span></td>";
        } else {
            htmlOutput = htmlOutput + "<td>" + value + "</td>";
        }
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

        htmlOutput = htmlOutput + "<td><a href=\"#variantSection\" title=\"" + labArray[i] + " and " + labName + "\">" + ltArray[labIndex][i] + "</td>";

    }

    htmlOutput = htmlOutput + "</tr>";



    return htmlOutput;

}


function initializeSTArray(pLength) {
    var stArray = new Array();
    for ( var i = 0; i < pLength; i++ ) {
        stArray[i] = new Array();
        for ( var j = 0; j < pLength; j++ ) {
            stArray[i][j]=0;
        }
    }

    return stArray;
}