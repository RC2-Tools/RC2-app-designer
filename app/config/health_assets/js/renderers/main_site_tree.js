'use strict';

// Displays homescreen

function display() {
    $('.menu-item').show();

    document.getElementById('beneficiary').onclick = function() {
        odkTables.launchHTML(null, 'config/health_assets/html/registration.html');
    };

    document.getElementById('volunteer').onclick = function() {
        launchVolunteerForm();
    };
};

function launchVolunteerForm() {
    alert('launching volunteer form');

    //var searchFormId = 'volunteers';
    //var searchFormKey = 'searchForm';
    //var searchRowIdKey = 'searchRowId';

    //let searchRowId = util.genUUID();
    //let searchJsonMap = {};

    //// We also need to add group permission fields
    //util.setJSONMap(searchJsonMap, '_row_owner', odkCommon.getActiveUser());
    //util.setJSONMap(searchJsonMap, '_default_access', 'hidden');

    //let defGrp = odkCommon.getSessionVariable(defaultGroupKey);
    //util.setJSONMap(searchJsonMap, '_group_modify', defGrp);

    //return new Promise( function(resolve, reject) {
    //    odkData.addRow(searchFormId, searchJsonMap, searchRowId, resolve, reject);
    //}).then( function(result) {
    //    if (!result) {
    //        util.displayError('Unable to open Survey to generate unique code (rc_id).');
    //        return;
    //    }
    //    let searchDispatchStruct = {};

    //    util.setJSONMap(searchDispatchStruct, util.actionTypeKey, actionSearchRcId);
    //    util.setJSONMap(searchDispatchStruct, searchRowIdKey, searchRowId);
    //    util.setJSONMap(searchDispatchStruct, searchFormKey, searchFormId);
    //    odkTables.editRowWithSurvey(JSON.stringify(searchDispatchStruct), searchFormId, searchRowId, searchFormId, null);
    //});
}
