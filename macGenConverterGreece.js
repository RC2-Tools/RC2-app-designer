var XRegExp = require('./xlsxconverter/XRegExp-All-3.0.0-pre-2014-12-24.js');
var readline = require('readline');
var _ = require('./devEnv/libs/underscore.js');
var XLSXConverter = require('./xlsxconverter/XLSXConverter2.js');
var fs = require('fs');
var path = require('path');
var Buffer = require('buffer').Buffer;
var constants = require('constants');
var XLSX = require('./xlsxconverter/js-xlsx');
var util = require('./devEnv/js/devenv-util.js');

function to_json(workbook) {
    var result = {};
    _.each(workbook.SheetNames, function(sheetName) {
        var rObjArr = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName],{raw:true});
        rObjArr = util.removeEmptyStrings(rObjArr);
        if(rObjArr.length > 0){
            result[sheetName] =  rObjArr;
        }
    });
    return result;
}

function downloadCsvFile (csvContent, fileName) {
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    link.click();
}

function writeOutDef(formDefStr) {
	// Write out the definition.csv if necessary
    var formDefJson = JSON.parse(formDefStr);
    var tableId = util.getTableIdFromFormDef(formDefJson);
	var defPath = 'appGreece/config/tables/' + tableId + '/definition.csv';
	try {
		if (util.shouldWriteOutDefinitionAndPropertiesCsv(formDefJson)) {
			// Write the definition.csv if necessary
			var dtm = formDefJson.specification.dataTableModel;

			var defCsv = util.createDefinitionCsvFromDataTableModel(dtm);
			fs.writeFileSync(defPath, defCsv);
		}
	} catch (e) {
		fs.writeFileSync(defPath, e.stack);
	}

}

function writeOutProp(formDefStr) {
	var formDefJson = JSON.parse(formDefStr);
	var tableId = util.getTableIdFromFormDef(formDefJson);

	// Write out the properties.csv if necessary
	var propPath = 'appGreece/config/tables/' + tableId + '/properties.csv';
	try {
		if (util.shouldWriteOutDefinitionAndPropertiesCsv(formDefJson)) {
			// Write the properties.csv if necessary
			var dtm = formDefJson.specification.dataTableModel;

			var propCsv = util.createPropertiesCsvFromDataTableModel(dtm, formDefJson);
			fs.writeFileSync(propPath, propCsv);
		}
	} catch (e) {
		fs.writeFileSync(propPath, e.stack);
	}
}

function writeOutTrx(formDefStr) {

    // Write the ...Definitions.js if necessary
    var formDefJson = JSON.parse(formDefStr);
	var tableId = util.getTableIdFromFormDef(formDefJson);

	try {
		if (util.shouldWriteOutDefinitionsJs(formDefJson)) {
			if ( tableId === 'framework' ) {
				// Create and write out frameworkDefinitions.js
				var trxPath = util.getRelativePathToFrameworkDefinitionsJs(formDefJson);
				var trxJs = util.createDefinitionsJsFromDataTableModel(tableId, formDefJson);
				fs.writeFileSync(trxPath, trxJs);

				// Create and write out commonDefinitions.js
				var trxCmnPath = util.getRelativePathToCommonDefinitionsJs(formDefJson);
				var trxCmnJs = util.createDefinitionsJsFromDataTableModel(null, formDefJson);
				fs.writeFileSync(trxCmnPath, trxCmnJs);
			} else {
				// Create and write out tableSpecificDefinitions.js
				var trxPath = 'appGreece/config/tables/' + tableId + '/tableSpecificDefinitions.js';
				var trxJs = util.createDefinitionsJsFromDataTableModel(tableId, formDefJson);
				fs.writeFileSync(trxPath, trxJs);
			}
		}
	} catch (e) {
		throw new Error("unable to write out ...Definitions file: " + tableId + " error: " + e.name + " message: " + e.message );
	}
}

var result = "";
var b64xlsx = "";
var processedWorkbook = {};

// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
    console.log('Usage: node ' + process.argv[1] + ' FILENAME');
    process.exit(1);
}

// Read the file
var fs = require('fs');
var filename = process.argv[2];
fs.readFile(filename, 'base64', function(err, data) {
    if (err) {
        throw err;
    }
    b64xlsx += data;
});

b64xlsx = fs.readFileSync(filename, 'base64');

try {
    var xlsx = XLSX.read(b64xlsx, {type: 'base64'});    
    var jsonWorkbook = to_json(xlsx);
    var processedWorkbook = XLSXConverter.processJSONWb(jsonWorkbook);
    result = JSON.stringify(processedWorkbook, 2, 2);

} catch(e) {
    console.log(e.stack);
}
console.log(result);

// Write out the definition.csv if necessary
writeOutDef(result);

// Write out the properties.csv if necessary
writeOutProp(result);

// Write out the ...Definitions.js if necessary
writeOutTrx(result);



