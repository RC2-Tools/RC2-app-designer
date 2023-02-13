/**
 * Render the choose method page
 */
'use strict';

//var locale = odkCommon.getPreferredLocale();
var defaultProgramChoice = 'Select Program'; // TODO: localize this
var queryProgramsResult = null;

function display() {
    $('#continue')
      .prop('disabled', true)
      .addClass('disabled')
      .on('click', function() {
        var selectedProgram = $('#choose_program').val();

        // identify programId and put in localStorage
        // TODO: better way to do this then iterating over the programs again?
        var selectedProgramId = null;
        for (var i = 0; i < queryProgramsResult.getCount(); i++) {
            if (queryProgramsResult.getData(i, 'name') === selectedProgram) {
                selectedProgramId = queryProgramsResult.getData(i, '_id');
                break;
            }
        }

        window.localStorage.setItem('program_id', selectedProgramId);

        odkTables.launchHTML(null, 'config/health_assets/html/main.html');
    });

    $('#choose_program').on('change', verifyProgram);
//	$('#exit').on('click', function() {
//		odkCommon.closeWindow();
//	});
    return checkLocalTableForProgramValues();
}

function addOption(elem, item) {
    elem.append($('<option/>').attr('value', item).text(item));
}

function verifyProgram() {
    var selectedProgram = $('#choose_program').val();

    if (isValidProgram(selectedProgram) === true) {
       $('#continue').prop('disabled', false).removeClass('disabled');
    } else {
        $('#continue').prop('disabled', true).addClass('disabled');
    }
}

function isValidProgram(programToVerify) {
    if (programToVerify !== null && programToVerify !== undefined &&
        programToVerify !== defaultProgramChoice) {
        return true;
    }

    return false;
}

function checkLocalTableForProgramValues() {

    var queryProgramsPromise = new Promise(function(resolve, reject) {
        return odkData.query('programs', null, null, null, null, null, null, null, null, null,
            resolve, reject);
    });

    addOption($('#choose_program'), defaultProgramChoice);

    return queryProgramsPromise.then(function(result){
        queryProgramsResult = result;

        var programSelect = $('#choose_program');
        programSelect.empty();

        // Add default option
        addOption(programSelect, defaultProgramChoice);
        for (var i = 0; i < result.getCount(); i++) {
            addOption(programSelect, result.getData(i, 'name'));
        }
    }).catch(function (reason) {
        // TODO: add this string to localizations
        var errTxt = odkCommon.localizeText(locale, 'error_while_retrieving_programs') + ': ' + reason;
        util.displayError(errTxt);
        console.log(errTxt);
    });
}
