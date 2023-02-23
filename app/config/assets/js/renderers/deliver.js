'use strict';

function display() {
    var deliverBtn = $('#deliver');
    deliverBtn.click(deliver);

    if (odkCommon.getSessionVariable('clicked') === 'true') {
        deliverBtn.prop('disabled', true);
        document.getElementById('confirmation').dataset['localize'] = 'delivery_confirmed';
    }
}

function deliver() {
    var entitlementId = util.getQueryParameter('entitlement_id');
    var beneficiaryEntityId = util.getQueryParameter('beneficiary_entity_id');
    var authorizationId = util.getQueryParameter('authorization_id');

    if (entitlementId !== null) {
        console.log("Delivering entitlement: " + entitlementId);

        var entitlement_row = null;

        dataUtil.getRow(util.entitlementTable, entitlementId).then( function(result) {
            console.log('Got entitlement row');
            if (!result || result.getCount === 0) {
                throw ('Failed to retrieve entitlement.');
            }

            entitlement_row = result;

            return dataUtil.addDeliveryRowByEntitlement(entitlement_row, null, null);
        }).then(_handleRowEntry).catch( function(reason) {
            console.log('Failed to perform simple delivery: ' + reason);
        });

    } else if (beneficiaryEntityId !== null && authorizationId !== null) {
        dataUtil.getRow(util.authorizationTable, authorizationId).then( function(result) {
            return dataUtil.addDeliveryRowWithoutEntitlement(beneficiaryEntityId, result, null);
        }).then(_handleRowEntry).catch( function(reason) {
            console.log('Failed to perform simple delivery: ' + reason);
        });

    }
}

function _handleRowEntry(result) {
    var locale = window.locale || odkCommon.getPreferredLocale();

    console.log('Added delivery row');
    if (!result || result.getCount === 0) {
        throw ('Failed to add delivery to root table.');
    }

    var rootDeliveryRowId = result.get('_id');

    odkCommon.setSessionVariable('clicked', 'true');

    $('#deliver').prop('disabled', true);
    $('#confirmation').text(odkCommon.localizeText(locale, 'delivery_confirmed'));

    console.log('Created new row in root delivery table: ' + rootDeliveryRowId);
}
