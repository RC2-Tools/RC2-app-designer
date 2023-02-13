/* global */
/**
 * Various functions that we might need across screens.
 */
'use strict';


/**
 * health_util function object provides utility functions which do not interface with data tables
 */
var health_util = {};

/************************** Health specific constants *********************************/
health_util.moduleDir='health_assets'


/************************** Wrappers for general Util functions *********************************/

health_util.resolveViewPath = function (tableId, viewType) {
    return util.resolveViewPath(tableId, viewType, health_util.moduleDir);
}

health_util.getReferralsForBeneficiary = function(rcId, programId, beneficiaryEntityRowId) {
    var query = 
      'SELECT ' +
      '       services._id, ' +
      '       services.name, ' +
      '       services.description, ' +
      '       referrals._id AS referral_row_id ' +
      'FROM services ' +
	  'INNER JOIN referrals ON services._id = referrals.service_id AND referrals.status = ? ' +
      'WHERE referrals.beneficiary_entity_id = ? '

    odkTables.openTableToListViewArbitraryQuery(
      null,
      'referrals',
      query,
      ['ACTIVE', beneficiaryEntityRowId],
      'config/tables/referrals/health_assets/html/services_all_referrals.html' +
        '?rcId=' + encodeURIComponent(rcId) +
        '&programId=' + encodeURIComponent(programId) +
        '&beneficiaryEntityRowId=' + encodeURIComponent(beneficiaryEntityRowId)
    );
};

health_util.getMedicalHistoryGrouped = function(rcId, programId, beneficiaryEntityRowId, user, superUser) {
	if(superUser) {
		var query = 
		  'SELECT beneficiary_services.grouping_column ' +
		  'FROM beneficiary_services, services ' +
		  'WHERE  beneficiary_services.beneficiary_entity_id = ? AND ' +
		  'services._id = beneficiary_services.service_id ' +
		  'GROUP BY beneficiary_services.grouping_column';

		odkTables.openTableToListViewArbitraryQuery(
		  null,
		  'beneficiary_services',
		  query,
		  [beneficiaryEntityRowId],
		  'config/tables/beneficiary_services/health_assets/html/beneficiary_grouped_list.html' +
			'?rcId=' + encodeURIComponent(rcId) +
			'&programId=' + encodeURIComponent(programId) +
			'&beneficiaryEntityRowId=' + encodeURIComponent(beneficiaryEntityRowId) +
			'&user=' + encodeURIComponent(user) +
			'&isSuperUser' + encodeURIComponent(superUser) 
		);
	} else {
		var query = 
		  'SELECT beneficiary_services.grouping_column ' +
		  'FROM beneficiary_services, services ' +
		  'WHERE  beneficiary_services.beneficiary_entity_id = ? AND ' +
		  'services._id = beneficiary_services.service_id AND ' +
		  'beneficiary_services._row_owner = ? ' +
		  'GROUP BY beneficiary_services.grouping_column';

		odkTables.openTableToListViewArbitraryQuery(
		  null,
		  'beneficiary_services',
		  query,
		  [beneficiaryEntityRowId, user],
		  'config/tables/beneficiary_services/health_assets/html/beneficiary_grouped_list.html' +
			'?rcId=' + encodeURIComponent(rcId) +
			'&programId=' + encodeURIComponent(programId) +
			'&beneficiaryEntityRowId=' + encodeURIComponent(beneficiaryEntityRowId) +
			'&user=' + encodeURIComponent(user) +
			'&isSuperUser' + encodeURIComponent(superUser) 
		);
	}
};

health_util.getMedicalHistoryForParticularGroup = function(rcId, programId, groupValue, beneficiaryEntityRowId, user, superUser) {
    if(superUser){
		var query = 
		  'SELECT ' +
		  '       services._id, ' +
		  '       services.name, ' +
		  '       beneficiary_services.custom_form_id, ' +
		  '       beneficiary_services.custom_form_instance_id, ' +
		  '       beneficiary_services.custom_table_id, ' +
		  '       beneficiary_services.date_performed ' +
		  'FROM beneficiary_services, services ' +
		  'WHERE services._id = beneficiary_services.service_id AND ' +
		  '    beneficiary_services.beneficiary_entity_id = ? AND ' +
		  '    beneficiary_services.grouping_column = ?';

		odkTables.openTableToListViewArbitraryQuery(
		  null,
		  'beneficiary_services',
		  query,
		  [beneficiaryEntityRowId, groupValue],
		  'config/tables/beneficiary_services/health_assets/html/beneficiary_services_list.html' +
			'?rcId=' + encodeURIComponent(rcId) +
			'&programId=' + encodeURIComponent(programId) +
			'&beneficiaryEntityRowId=' + encodeURIComponent(beneficiaryEntityRowId)
		); 
	} else {
		var query = 
		  'SELECT ' +
		  '       services._id, ' +
		  '       services.name, ' +
		  '       beneficiary_services.custom_form_id, ' +
		  '       beneficiary_services.custom_form_instance_id, ' +
		  '       beneficiary_services.custom_table_id, ' +
		  '       beneficiary_services.date_performed ' +
		  'FROM beneficiary_services, services ' +
		  'WHERE services._id = beneficiary_services.service_id AND ' +
		  '    beneficiary_services.beneficiary_entity_id = ? AND ' +
		  '    beneficiary_services.grouping_column = ? AND '
		  '    beneficiary_services._row_owner = ? ';

		odkTables.openTableToListViewArbitraryQuery(
		  null,
		  'beneficiary_services',
		  query,
		  [beneficiaryEntityRowId, groupValue, user],
		  'config/tables/beneficiary_services/health_assets/html/beneficiary_services_list.html' +
			'?rcId=' + encodeURIComponent(rcId) +
			'&programId=' + encodeURIComponent(programId) +
			'&beneficiaryEntityRowId=' + encodeURIComponent(beneficiaryEntityRowId)
		); 
	}
};

health_util.getServiceListForProgram = function(rcId, programId, beneficiaryEntityRowId) {
    var query = 
      'SELECT ' +
      '       services._id, ' +
      '       services.name, ' +
      '       services.description, ' +
      '       services.requires_referral, ' +
      '       services.end_with_referrals, ' +
      '       services.referral_form_id, ' +
      '       services.referral_table_id, ' +
      '       services.service_form_id, ' +
      '       services.service_table_id, ' +
	  '       referrals._id AS referral_row_id ' +
      'FROM services ' +
	  'INNER JOIN services_for_program ON services._id = services_for_program.service_id AND services_for_program.program_id = ? ' +
	  'LEFT OUTER JOIN referrals ON services._id = referrals.service_id ' +
	  'WHERE services.requires_referral = 0 OR (referrals.status = ? AND referrals.beneficiary_entity_id = ?) ' +
	  'ORDER BY services.name ASC' 

    odkTables.openTableToListViewArbitraryQuery(
      null,
      'services',
      query,
      [programId, 'ACTIVE', beneficiaryEntityRowId], 
      'config/tables/services/health_assets/html/services_list.html' +
        '?rcId=' + encodeURIComponent(rcId) +
        '&programId=' + encodeURIComponent(programId) +
        '&beneficiaryEntityRowId=' + encodeURIComponent(beneficiaryEntityRowId)
    );
};

health_util.triggerCustomReferral = function(servicesResultSet, index, beneficiaryEntityId, actionTypeValue, dispatchStruct) {
	dispatchStruct = dispatchStruct || {};
	dispatchStruct.beneficiaryEntityId = beneficiaryEntityId;
	
	var customReferralRowId = util.genUUID();
	
	var jsonMapSurvey = {};
	
	 // Add referral row
    return healthDataUtil.addBeneficiaryReferralRowByService(servicesResultSet, index, beneficiaryEntityId, customReferralRowId).then(function (rootReferralRow) {
				return dataUtil.createCustomRowFromBaseEntry(rootReferralRow, "custom_referral_form_id", "custom_referral_row_id", actionTypeValue, dispatchStruct, "_group_read_only", null, jsonMapSurvey);
			}).catch(function (reason) {
				console.log('Failed to add custom referral row: ' + reason);
			});        
	
};

health_util.triggerService = function(servicesResultSet, index, beneficiaryEntityId, actionTypeValue, dispatchStruct) {
    dispatchStruct = dispatchStruct || {};
    dispatchStruct.endWithReferrals = servicesResultSet.getData(index, 'end_with_referrals');
	dispatchStruct.beneficiaryEntityId = beneficiaryEntityId;
	dispatchStruct.serviceId = servicesResultSet.getData(index, '_id');
	dispatchStruct.referralRowId = servicesResultSet.getData(index, 'referral_row_id');

    var customServiceRowId = util.genUUID();

	var jsonMapSurvey = {};
		
    // Add beneficiary_service row
    return healthDataUtil.getHealthRegData(beneficiaryEntityId).then(function (result) {
		if (result !== null && result !== undefined) {
			console.log('Received a response to obtain health registration information')
			console.log('Size: ' + result.getCount());
			util.setJSONMap(jsonMapSurvey,'reg_birthday', result.getData(0, 'birthday'));
			util.setJSONMap(jsonMapSurvey, 'reg_first_name', result.getData(0, 'first_name'));
			util.setJSONMap(jsonMapSurvey, 'reg_family_name', result.getData(0, 'family_name'));
			util.setJSONMap(jsonMapSurvey, 'reg_gender', result.getData(0, 'gender'));
		} else {
			console.log('Failed to get health registration information!')
		}
		healthDataUtil.addBeneficiaryServiceRowByService(servicesResultSet, index, beneficiaryEntityId, customServiceRowId)
			.then(function (rootBeneficiaryServiceRow) {
				return dataUtil.createCustomRowFromBaseEntry(rootBeneficiaryServiceRow, "custom_form_id", "custom_form_instance_id", actionTypeValue, dispatchStruct, "_group_read_only", null, jsonMapSurvey);
			}).catch(function (reason) {
				console.log('Failed to perform custom beneficiary service: ' + reason);
			});        
		});
};

/************************** UI Rendering Util Functions *********************************/

/**
 * dataUtil function object provides utility functions which interface with data tables
 */
var healthDataUtil = {};

healthDataUtil.getHealthRegData = function(beneficiaryEntityId) {
	console.log('beneficiary_entity_id: ' + beneficiaryEntityId);
	var query = 'SELECT health_registration.birthday, health_registration.first_name, health_registration.family_name, health_registration.gender ' +
		'FROM beneficiary_entities, health_registration ' +
		'WHERE beneficiary_entities._id = ? AND beneficiary_entities.custom_beneficiary_entity_row_id = health_registration._id';
	
	return new Promise(function (resolve, reject) {
        odkData.arbitraryQuery(
			'health_registration',
			query,
            [beneficiaryEntityId],
            null,
            null,
            resolve,
            reject
            );
        }).catch(function (reason) {
			console.log('Failed to get health registration data: ' + reason.message);
		});
};

healthDataUtil.queryToCheckForMedicalHistory = function(beneficiaryEntityRowId, user, superUser) {
	if(superUser) {
		var query = 'SELECT beneficiary_services.custom_form_id, beneficiary_services.custom_form_instance_id ' +
			'FROM beneficiary_services ' +
			'WHERE beneficiary_services.beneficiary_entity_id = ?';
		return new Promise(function (resolve, reject) {
			odkData.arbitraryQuery(
				'beneficiary_services',
				query,
				[beneficiaryEntityRowId],
				null,
				null,
				resolve,
				reject
				);
			}).catch(function (reason) {
				console.log('Failed to query medical history : ' + reason.message);
			});
	} else {
		var query = 'SELECT beneficiary_services.custom_form_id, beneficiary_services.custom_form_instance_id ' +
			'FROM beneficiary_services ' +
			'WHERE beneficiary_services.beneficiary_entity_id = ? AND beneficiary_services._row_owner = ?';
		
		return new Promise(function (resolve, reject) {
			odkData.arbitraryQuery(
				'beneficiary_services',
				query,
				[beneficiaryEntityRowId, user],
				null,
				null,
				resolve,
				reject
				);
			}).catch(function (reason) {
				console.log('Failed to query medical history : ' + reason.message);
			});
	}

}

healthDataUtil.addBeneficiaryReferralRowByService = function(servicesResultSet, index, beneficiaryEntityId, customReferralRowId) {
    var jsonMap = {};
    util.setJSONMap(jsonMap, 'beneficiary_entity_id', beneficiaryEntityId);
    util.setJSONMap(jsonMap, 'service_id', servicesResultSet.getData(index, '_id'));
    util.setJSONMap(jsonMap, 'date_issued', util.getCurrentOdkTimestamp());
    util.setJSONMap(jsonMap, 'status', 'ACTIVE');
    util.setJSONMap(jsonMap, 'custom_referral_form_id', servicesResultSet.getData(index, 'referral_form_id'));
    util.setJSONMap(jsonMap, 'custom_referral_table_id', servicesResultSet.getData(index, 'referral_table_id'));
    util.setJSONMap(jsonMap, 'custom_referral_row_id', customReferralRowId);
    util.setJSONMap(jsonMap, '_row_owner', odkCommon.getActiveUser());
    util.setJSONMap(jsonMap, '_default_access', servicesResultSet.getData(index, '_default_access'));
    util.setJSONMap(jsonMap, '_group_read_only', servicesResultSet.getData(index, '_group_read_only'));

    return new Promise(function(resolve, reject) {
        odkData.addRow(util.referralsTable, jsonMap, util.genUUID(), resolve, reject);
    }).catch(function (reason) {
			console.log('Failed to create referrals row : ' + reason.message);
		});
};


healthDataUtil.addBeneficiaryServiceRowByService = function(servicesResultSet, index, beneficiaryEntityId, customSeriviceRowId) {
    var jsonMap = {};
    util.setJSONMap(jsonMap, 'beneficiary_entity_id', beneficiaryEntityId);
    util.setJSONMap(jsonMap, 'service_id', servicesResultSet.getData(index, '_id'));
    util.setJSONMap(jsonMap, 'program_id', window.localStorage.getItem('program_id'));
    util.setJSONMap(jsonMap, 'custom_form_id', servicesResultSet.getData(index, 'service_form_id'));
    util.setJSONMap(jsonMap, 'custom_form_instance_id', customSeriviceRowId);
    util.setJSONMap(jsonMap, 'custom_table_id', servicesResultSet.getData(index, 'service_table_id'));
    util.setJSONMap(jsonMap, '_row_owner', odkCommon.getActiveUser());
    util.setJSONMap(jsonMap, 'date_performed', util.getCurrentOdkTimestamp());

	// add performed service grouping method
	// temporarily set to group by day
	// TODO: someday provide as a javascript function that can be easily customized
	let current = new Date();
	let day = current.getDate();
	let month = current.getMonth() + 1;
	let year = current.getFullYear();
	let formattedDate = year + "-" + month + "-" + day;
	util.setJSONMap(jsonMap, 'grouping_column', formattedDate);

    util.setJSONMap(jsonMap, '_default_access', servicesResultSet.getData(index, '_default_access'));
    util.setJSONMap(jsonMap, '_group_read_only', servicesResultSet.getData(index, '_group_read_only'));

    return new Promise(function(resolve, reject) {
        odkData.addRow(util.beneficiaryServicesTable, jsonMap, util.genUUID(), resolve, reject);
    });
};

/**
 * if there is no delivery form, then launch to simple delivery html page
 * else create the base delivery row and create and launch survey for custom delivery row
 */
healthDataUtil.triggerEntitlementDelivery = function(entitlementId, actionTypeValue) {
    var entitlementRow;
    dataUtil.getRow(util.entitlementTable, entitlementId).then( function(result) {
        entitlementRow = result;
        if (entitlementRow === undefined || entitlementRow.getCount === 0) {
            return Promise.reject('Failed to retrieve entitlement.');
        }
        return dataUtil.getRow(util.authorizationTable, entitlementRow.get('authorization_id'));
    }).then(function(authorizationRow) {
        if (authorizationRow !== undefined && authorizationRow !== null && authorizationRow.getCount() !== 0) {
            if (dataUtil.isCustomDeliveryAuthorization(authorizationRow)) {
                var customDeliveryFormTableId = authorizationRow.getData(0, 'custom_delivery_form_id');
                dataUtil.tableExists(customDeliveryFormTableId)
                    .then(function (result) {
                        if (!result) {
                            util.displayError('Specified delivery form cannot be found. Unable to deliver.');
                            return Promise.reject('Specified delivery form cannot be found. Unable to deliver.')
                        }

                        return new Promise(function (resolve, reject) {
                            odkData.query(customDeliveryFormTableId, null, null, null, null, null, null, 1, null, true, resolve, reject);
                        })
                          .then(function (value) {
							  try{
								var onDeliverFunc = value.getMetadata().kvMap['Table']['default']['onDeliver']['value'];
							  } catch (exception) {
								  return {};
							  }

                              if (onDeliverFunc !== undefined && onDeliverFunc !== null && onDeliverFunc !== '') {
                                  var onDeliverPromise = eval(onDeliverFunc)(entitlementId);
                                  return Promise.resolve(onDeliverPromise);
                              } else {
                                  return {};
                              }
                          });
                    })
                  .then(function (result) {
                      result = result || {};
                      var jsonMapSurvey = result['jsonMapSurvey'] || {};

                      var customDeliveryRowId = util.genUUID();
                      var jsonMap = result['jsonMap'] || {};
                      var assigned_code = entitlementRow.get('assigned_item_code');
                      if (assigned_code !== undefined && assigned_code !== null && assigned_code !== "") {
                          util.setJSONMap(jsonMap, 'assigned_item_code', assigned_code);
                      }

                      return dataUtil.addDeliveryRowByEntitlement(entitlementRow, authorizationRow.get("custom_delivery_form_id"), customDeliveryRowId)
                        .then(function (rootDeliveryRow) {
                            return dataUtil.createCustomRowFromBaseEntry(rootDeliveryRow, "custom_delivery_form_id", "custom_delivery_row_id", actionTypeValue, null, "_group_read_only", jsonMap, jsonMapSurvey);
                        }).catch(function (reason) {
                            console.log('Failed to perform custom entitlement delivery: ' + reason);
                        });
                  })
            } else {
                console.log('Performing simple delivery');
                odkTables.launchHTML(null, 'config/health_assets/html/deliver.html?entitlement_id=' +  encodeURIComponent(entitlementRow.getRowId(0)));
            }
        } else {
            util.displayError("Authorization missing from phone, please contact administrator");
        }

    });
};

healthDataUtil.triggerAuthorizationDelivery = function(authorizationId, beneficiaryEntityId, actionTypeValue, customDeliveryJsonMap) {
    dataUtil
      .getRow(util.authorizationTable, authorizationId)
      .then(function(authorizationRow) {
          if (authorizationRow !== undefined && authorizationRow !== null && authorizationRow.getCount() !== 0) {
              if (dataUtil.isCustomDeliveryAuthorization(authorizationRow)) {
                  dataUtil.tableExists(authorizationRow.getData(0, 'custom_delivery_form_id'))
                    .then(function (result) {
                        if (!result) {
                            util.displayError('Specified delivery form cannot be found. Unable to deliver.');
                            return;
                        }

                        var customDeliveryRowId = util.genUUID();

                        return dataUtil.addDeliveryRowWithoutEntitlement(beneficiaryEntityId, authorizationRow, customDeliveryRowId)
                          .then(function (rootDeliveryRow) {
                              return dataUtil.createCustomRowFromBaseEntry(rootDeliveryRow, "custom_delivery_form_id",
                                  "custom_delivery_row_id", actionTypeValue, null, "_group_read_only", customDeliveryJsonMap);
                          }).catch(function (reason) {
                            console.log('Failed to perform custom entitlement delivery: ' + reason);
                        });
                    });
              } else {
                  console.log('Performing simple delivery');
                  odkTables.launchHTML(
                    null,
                    'config/health_assets/html/deliver.html' +
                    '?beneficiary_entity_id=' + encodeURIComponent(beneficiaryEntityId) +
                    '&authorization_id=' + encodeURIComponent(authorizationId)
                  );
              }
          } else {
              util.displayError("Authorization missing from phone, please contact administrator");
          }

      });
};
