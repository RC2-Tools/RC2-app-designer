/**
 * Render the registration detail page
 */

'use strict';


var locale = odkCommon.getPreferredLocale();
var beneficiaryEntitiesResultSet;
var customResultSet;
var beneficiaryEntityId;
var type;
var retryLimit = 5;
var dept = util.getQueryParameter(util.departmentParam);
var pam = util.getQueryParameter(util.pamParam);

// Note that the call to open this detail view will be for the custom beneficiary entity table so that
// pressing the edit button in the top right will open the appropriate form.
function display() {

    type = util.getQueryParameter('type');
    if (type === 'unregistered_voucher') {
        // If we have an entitlement for an unregistered beneificiary unit id, there is no view data to show
        beneficiaryEntityId = util.getQueryParameter('beneficiary_entity_id');
        $('#title').text(odkCommon.localizeText(locale, 'beneficiary_entity_id') + ": " + beneficiaryEntityId);
        $('#toggle_workflow').hide();
        initEntitlementToggle();
        setToDeliveryView(true);

        return Promise.resolve();
    }

    var exclusionList = ['beneficiary_entity_id', 'consent_signature', 'location_accuracy',
        'location_altitude', 'location_latitude', 'location_longitude',
        'consent_signature_contentType', 'consent_signature_uriFragment',
        'custom_beneficiary_entity_form_id', 'custom_beneficiary_entity_row_id', 'status_reason'];

    return new Promise( function(resolve, reject) {
        // retrieve custom row data
        odkData.getViewData(resolve, reject);
    }).then( function(result) {
        customResultSet = result;
        // retrieve base row data
        return new Promise(function (resolve, reject) {
            odkData.query(util.beneficiaryEntityTable, "custom_beneficiary_entity_row_id = ?", [customResultSet.getRowId(0)],
                null, null, null, null, null, null, true, resolve, reject);
        });
    }).then(function(result) {

        // populate title, workflow toggles, and sublist

        beneficiaryEntitiesResultSet = result;
        beneficiaryEntityId = beneficiaryEntitiesResultSet.get('beneficiary_entity_id');
        // set title as beneficiary entity id
        $('#title').text(odkCommon.localizeText(locale, 'beneficiary_entity_id') + ": " + beneficiaryEntityId);
        if (type === 'override_beneficiary_entity_status') {
            // administrator changing beneficiary entity status
            $('#toggle_workflow').hide();
            initBeneficiaryStatusToggle(beneficiaryEntitiesResultSet.getData(0, "status"));
            exclusionList.push('status');
        }  else if (type === 'override_ent_status') {
            // administrator changing entitlement status of beneficiary entity
            $('#toggle_workflow').hide();
            setSublistToAllPendingEntitlements('change_status');

        } else if (util.getRegistrationMode() === "INDIVIDUAL") {
            $('#toggle_workflow').hide();
            if (beneficiaryEntitiesResultSet.get('status') === 'DISABLED') {
                // do nothing, this should be called as a detail view without sublist
            } else {
                initEntitlementToggle();
                setToDeliveryView(false);
            }
        } else if (util.getRegistrationMode() === "HOUSEHOLD") {
            if (beneficiaryEntitiesResultSet.get('status') === 'DISABLED') {
                $('#toggle_workflow').hide();
                setToHouseholdView();
            } else {
                initEntitlementToggle();
                if (type === "registration") {
                    setToHouseholdView();
                } else if (type === "delivery") {
                    setToDeliveryView(true);
                }
            }
        }

        if (type === 'delivery') {
            document.getElementById('deliveryVisitTabs').classList.remove('d-none');
            document.getElementById('visitTab').addEventListener('click', function () {
                health_util.getVisitProgListForBeneficiary(beneficiaryEntityId);
            })
        } else {
            document.getElementById('deliveryVisitTabs').classList.add('d-none');
        }

        if (util.getRegistrationMode() === 'HOUSEHOLD') {

            return dataUtil.getHouseholdSize(beneficiaryEntitiesResultSet.getRowId(0));
        } else {
            return Promise.resolve();
        }
    }).then( function(result) {

        // populate detail view of beneficiary entity

        var keyValuePairs = {};
        if (result != null) {
            keyValuePairs['hh_size'] = result;
        }
        var resultSets = [beneficiaryEntitiesResultSet, customResultSet];

        util.populateDetailViewArbitrary(resultSets, keyValuePairs, "field_list", locale, exclusionList);
    }).catch( function(reason) {
        console.log('failed with message: ' + reason);
    }).finally( function() {
        // extracting the url fragment
        var hash = window.location.hash;
        var retryCount;
        if (hash === undefined || hash === null || hash === '') {
            retryCount = 1;
        } else {
            retryCount = parseInt(hash.substring(hash.indexOf('#')), 10);
        }

        if (retryCount < retryLimit) {
            dataUtil.selfHealMembers(beneficiaryEntitiesResultSet.getRowId(0), customResultSet.getRowId(0))
                .then( function(result) {
                    if (result) {
                        window.location.hash += "#" + retryCount + 1;
                        window.location.reload();
                    }
                });
        } else {
            // TODO: display some error to the user about an inconsistent state for this beneficiary entity
        }
    });
}


 function initBeneficiaryStatusToggle(status) {
     $('#switch-title-id').text('Beneficiary Entity Status'); // TODO: localize this

     var leftToggle = $('.toggle-left');
     var rightToggle = $('.toggle-right');

     if (status === 'ENABLED') {
         leftToggle.addClass('active');
         rightToggle.removeClass('active');
     } else {
         leftToggle.removeClass('active');
         rightToggle.addClass('active');
     }

     leftToggle.find('span').text('Enabled'); // TODO: Localize this
     leftToggle.click(function() {
        return changeStatusPromise('ENABLED');
     });

     rightToggle.find('span').text('Disabled'); // TODO: Localize this
     rightToggle.click(function() {
         return changeStatusPromise('DISABLED');
     });

     $('#switch-id').show();
 }

 function changeStatusPromise(status) {
     return new Promise( function(resolve, reject) {
         odkData.updateRow(util.beneficiaryEntityTable, {'status' : status}, beneficiaryEntitiesResultSet.getData(0, "_id"),
             resolve, reject);
     }).then( function(result) {
         console.log('Update success: ' + result);
     }).catch( function(reason) {
         console.log('Update failure: ' + reason);
     });
 }


function initEntitlementToggle() {
    $('#switch-title-id').text('Items'); // TODO: localize this

    var leftToggle = $('.toggle-left');
    var rightToggle = $('.toggle-right');

    leftToggle.find('span').text('Pending'); // TODO: Localize this

    leftToggle.addClass('active');
    rightToggle.removeClass('active');

    leftToggle.click(function() {
        setSublistToEnabledPendingEntitlements('deliver');
    });

    rightToggle.find('span').text('Delivered'); // TODO: Localize this
    rightToggle.click(function() {
        setSublistToDeliveredEntitlements();
    });
}

// TODO: abstract a default member foreign key value to populate the registration detail view with

function setToHouseholdView() {
    var toggleWorkflowButton = $('#toggle_workflow');

    toggleWorkflowButton.off('click').on('click', function(e) {
        e.preventDefault();
        console.log("setting to delivery view");
        setToDeliveryView(true);
    });
    $('#switch-id').hide();
    setSublistToHousehold();
}

function setToIndividualView() {

}

function setToDeliveryView(includeWorkflowButton) {
    if (includeWorkflowButton) {
        var toggleWorkflowButton = $('#toggle_workflow');
        toggleWorkflowButton.off('click').on('click', function(e) {
            console.log("preventing default");
            e.preventDefault();
            console.log("setting to registration view");
            setToHouseholdView();
        });
    }
    $('#switch-id').show();
    if ($('.toggle-left').hasClass('active')) {
        setSublistToEnabledPendingEntitlements('deliver');
    } else {
        setSublistToDeliveredEntitlements();
    }
}

//TODO: join on authorization table so that we do not allow a delivery to an authorization that doesn't exist

function setSublistToEnabledPendingEntitlements(action) {
    console.log("setting to enabled pending");

    if (util.getWorkflowMode() === util.workflow.idOnly) {
        var query = 'SELECT _id, item_name, status, extra_field_entitlements FROM ' + util.authorizationTable +
          ' WHERE ' + util.authorizationTable + '.status = ?';

        odkTables.setSubListViewArbitraryQuery(
          util.authorizationTable,
          query,
          ['ACTIVE'],
          'config/tables/' + util.entitlementTable + '/health_assets/html/' + util.entitlementTable + '_list.html' +
          '?action=' + encodeURIComponent(action) +
          '&beneficiary_entity_id=' + encodeURIComponent(beneficiaryEntityId) +
          '&' + util.departmentParam + '=' + encodeURIComponent(dept) +
          '&' + util.pamParam + '=' + encodeURIComponent(pam)
        );
    } else {
        var joinQuery = 'SELECT * FROM ' + util.entitlementTable + ' ent' +
          ' LEFT JOIN ' +  util.deliveryTable + ' del' +
          ' ON del.entitlement_id = ent._id' +
          ' INNER JOIN '  + util.authorizationTable + ' auth' +
          ' ON ent.authorization_id = auth._id' +
          ' WHERE del._id IS NULL' +
          ' AND ent.beneficiary_entity_id = ?' +
          ' AND ent.status = ?' +
          ' AND (auth.status = ? OR auth.status = ?)';

        odkTables.setSubListViewArbitraryQuery(
          util.entitlementTable,
          joinQuery,
          [beneficiaryEntityId, 'ENABLED', 'ACTIVE', 'INACTIVE'],
          'config/tables/' + util.entitlementTable + '/health_assets/html/' + util.entitlementTable + '_list.html' +
          '?action=' + encodeURIComponent(action)
        );
    }
}

function setSublistToAllPendingEntitlements(action) {
    console.log("setting to all pending");

    if (util.getWorkflowMode() === util.workflow.idOnly) {
        // TODO: Currently, this isn't used in Colombia deployment

        var query = 'SELECT _id, item_name, status FROM ' + util.authorizationTable;

        odkTables.setSubListViewArbitraryQuery(
          util.authorizationTable,
          query,
          [],
          'config/tables/' + util.entitlementTable + '/health_assets/html/' + util.entitlementTable + '_list.html' +
          '?action=' + encodeURIComponent(action) +
          '&beneficiary_entity_id=' + encodeURIComponent(beneficiaryEntityId) +
          '&' + util.departmentParam + '=' + encodeURIComponent(dept) +
          '&' + util.pamParam + '=' + encodeURIComponent(pam)
        );
    } else {
        var joinQuery = 'SELECT * FROM ' + util.entitlementTable + ' ent' +
          ' LEFT JOIN ' +  util.deliveryTable + ' del' +
          ' ON del.entitlement_id = ent._id' +
          ' INNER JOIN ' + util.authorizationTable + ' auth' +
          ' ON ent.authorization_id = auth._id' +
          ' WHERE del._id IS NULL' +
          ' AND ent.beneficiary_entity_id = ?' +
          ' AND (auth.status = ? OR auth.status = ?)';

        odkTables.setSubListViewArbitraryQuery(
          util.entitlementTable,
          joinQuery,
          [beneficiaryEntityId, 'ACTIVE', 'INACTIVE'],
          'config/tables/' + util.entitlementTable + '/health_assets/html/' + util.entitlementTable + '_list.html' +
          '?action=' + encodeURIComponent(action)
        );
    }
}

function setSublistToDeliveredEntitlements() {
    console.log("setting to delivered");

    if (util.getWorkflowMode() === util.workflow.idOnly) {
        var query = 'SELECT ' + util.authorizationTable + '._id AS auth_id, ' + util.authorizationTable + '.item_name, ' +
          util.authorizationTable + '.status, ' + util.deliveryTable + '._id AS del_id, ' +
          util.authorizationTable + '.custom_delivery_form_id, ' + util.deliveryTable + '.custom_delivery_row_id ' +
          'FROM ' + util.deliveryTable + ' ' +
          'INNER JOIN ' + util.authorizationTable + ' ON ' + util.deliveryTable + '.authorization_id = ' +
          util.authorizationTable + '._id ' +
          'WHERE ' + util.deliveryTable + '.beneficiary_entity_id = ?';

        odkTables.setSubListViewArbitraryQuery(
          util.authorizationTable,
          query,
          [beneficiaryEntityId],
          'config/tables/' + util.entitlementTable + '/health_assets/html/' + util.entitlementTable + '_list.html' +
          '?action=detail' +
          '&beneficiary_entity_id=' + encodeURIComponent(beneficiaryEntityId)
        );
    } else {
        var joinQuery = 'SELECT * FROM ' + util.entitlementTable + ' ent' +
          ' INNER JOIN ' + util.deliveryTable + ' t2' +
          ' ON t2.entitlement_id = ent._id' +
          ' WHERE ent.beneficiary_entity_id = ?';

        odkTables.setSubListViewArbitraryQuery(
          util.entitlementTable,
          joinQuery,
          [beneficiaryEntityId],
          'config/tables/' + util.entitlementTable + '/health_assets/html/' + util.entitlementTable + '_list.html' +
          '?action=' + encodeURIComponent('detail')
        );
    }
}

function setSublistToHousehold() {
    console.log("setting to household");
    odkTables.setSubListView(util.membersTable, 'beneficiary_entity_row_id = ?',
        [beneficiaryEntitiesResultSet.getRowId(0)],
        'config/tables/' + util.membersTable + '/health_assets/html/' + util.membersTable +'_list.html');
}
