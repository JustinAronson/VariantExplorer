
exports.readJSONArray = function readJSONArray(url) {
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
            console.log("Error loading:" + url);
        }
    });
    return obj;

};
