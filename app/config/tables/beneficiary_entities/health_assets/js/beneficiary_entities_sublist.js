/**
 * Render the beneficiary sublist page
 */

'use strict';


var locale = odkCommon.getPreferredLocale();
var beneficiaryEntitiesResultSet;
var beneficiaryEntityId;
var user;
var superUser;

function getBeneficiaryInformation() {
	return new Promise( function(resolve, reject) {
		// retrieve custom row data
		odkData.getViewData(resolve, reject);
	});
}

function renderButtons(result) {
	beneficiaryEntitiesResultSet = result;
    beneficiaryEntityId = beneficiaryEntitiesResultSet.get('beneficiary_entity_id');

    // launch medical history button
    document.getElementById('medical_history_button').addEventListener('click', function () {
      let programId = window.localStorage.getItem('program_id');
	  health_util.getMedicalHistoryGrouped(beneficiaryEntityId, programId, beneficiaryEntitiesResultSet.getRowId(0), user, superUser);
    })

    // launch services button
    document.getElementById('service_button').addEventListener('click', function () {
      let programId = window.localStorage.getItem('program_id');
      health_util.getServiceListForProgram(beneficiaryEntityId, programId, beneficiaryEntitiesResultSet.getRowId(0));
    })

    // launch deliveries button
   document.getElementById('deliveries_button').addEventListener('click', function () {
      odkTables.openDetailWithListView(
        null,
        util.getBeneficiaryEntityCustomFormId(),
        beneficiaryEntitiesResultSet.getData(0, 'custom_beneficiary_entity_row_id'),
        'config/tables/' + util.beneficiaryEntityTable + '/health_assets/html/beneficiary_entities_deliveries.html');
    })

    // launch referrals button
    document.getElementById('referrals_button').addEventListener('click', function () {
      let programId = window.localStorage.getItem('program_id');
      health_util.getReferralsForBeneficiary(beneficiaryEntityId, programId, beneficiaryEntitiesResultSet.getRowId(0));
    })

	// show medical history button if medical history exists
	return healthDataUtil.queryToCheckForMedicalHistory(beneficiaryEntitiesResultSet.getRowId(0), user, superUser);
}


function display() {
  return new Promise(function(resolve, reject) {
        odkData.getRoles(resolve, reject);
	}).then(function(result) {
		var roles = result.getRoles();
		user = odkCommon.getActiveUser();
		superUser = $.inArray('ROLE_SUPER_USER_TABLES', roles) > -1;
		return getBeneficiaryInformation();
	}).then(function(result){
		return renderButtons(result);
	}).then(function(result){
		// show medical history button if medical history exists
		if(result.getCount() > 0) {
			document.getElementById('medical_history_button').style.display = "flex";
		}
  }).catch( function(reason) {
      console.log('failed with message: ' + reason);
  }).finally( function() {

  });
}
