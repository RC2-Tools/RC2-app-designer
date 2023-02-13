/* global */
/**
 * Various functions that we might need across screens.
 */
'use strict';


/**
 * relif_util function object provides utility functions which do not interface with data tables
 */
var relief_util = {};

/************************** Relief specific constants *********************************/
relief_util.moduleDir='relief_assets'


/************************** Wrappers for general Util functions *********************************/

relief_util.resolveViewPath = function (tableId, viewType) {
    return util.resolveViewPath(tableId, viewType, relief_util.moduleDir);
}

/************************** UI Rendering Util Functions *********************************/

relief_util.getBeneficiariesListForVisit = function(visit_prog_id) {
    var selectFromClause =
        'SELECT\n' +
        '  visits._id,\n' +
        '  visits.custom_visit_row_id AS customVisitRowId,\n' +
        '  beneficiary_entities.beneficiary_entity_id AS rcId,\n ' +
        '  visits.custom_visit_table_id AS customVisitTableId,\n' +
        '  visits.custom_visit_form_id AS customVisitFormId\n' +
        'FROM visits\n';

    var innerJoinClause =
        '  INNER JOIN beneficiary_entities ON visits.beneficiary_unit_id = beneficiary_entities._id\n';

    var whereClause = 'WHERE visit_program_id = ?\n';

    var orderByClause = 'ORDER BY rcId ASC';

    var query = selectFromClause + innerJoinClause + whereClause + orderByClause;
    console.log('visit query: ' + query);

    var selectionArgs = [visit_prog_id];

    odkTables.openTableToListViewArbitraryQuery(
        null,
        'visits',
        query,
        selectionArgs,
        'config/tables/visits/relief_assets/html/visits_list.html'
    );
};

relief_util.getVisitProgListForBeneficiary = function(rcId) {
    var query =
      'SELECT' +
      '       visit_programs._id,' +
      '       visit_programs.name,' +
      '       visit_programs.status,' +
      '       visits._id AS visitRowId,' +
      '       visits.custom_visit_row_id, ' +
      '       visits.custom_visit_table_id, ' +
      '       visits.custom_visit_form_id ' +
      'FROM visit_programs, visits ' +
      'WHERE visits.visit_program_id = visit_programs._id AND visits.beneficiary_unit_id IN (' +
      '    SELECT beneficiary_entities._id FROM beneficiary_entities' +
      '    WHERE beneficiary_entities.beneficiary_entity_id = ?' +
      ')';

    odkTables.openTableToListViewArbitraryQuery(
      null,
      'visit_programs',
      query,
      [rcId],
      'config/tables/visit_programs/relief_assets/html/visit_programs_list.html?rcId=' + encodeURIComponent(rcId)
    );
};

/**
 * dataUtil function object provides utility functions which interface with data tables
 */
var reliefDataUtil = {};

/**
 * if there is no delivery form, then launch to simple delivery html page
 * else create the base delivery row and create and launch survey for custom delivery row
 */
reliefDataUtil.triggerEntitlementDelivery = function(entitlementId, actionTypeValue) {
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
                odkTables.launchHTML(null, 'config/relief_assets/html/deliver.html?entitlement_id=' +  encodeURIComponent(entitlementRow.getRowId(0)));
            }
        } else {
            util.displayError("Authorization missing from phone, please contact administrator");
        }

    });
};

reliefDataUtil.triggerAuthorizationDelivery = function(authorizationId, beneficiaryEntityId, actionTypeValue, customDeliveryJsonMap) {
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
                    'config/relief_assets/html/deliver.html' +
                    '?beneficiary_entity_id=' + encodeURIComponent(beneficiaryEntityId) +
                    '&authorization_id=' + encodeURIComponent(authorizationId)
                  );
              }
          } else {
              util.displayError("Authorization missing from phone, please contact administrator");
          }

      });
};