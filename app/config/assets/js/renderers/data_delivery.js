/**
 * Render the data options page
 */
'use strict';

function display() {
    $('.menu-item').hide();
    $('.' + util.workflowToClass[util.getWorkflowMode()]).show();

    if (util.getWorkflowMode() === util.workflow.none) {
        var allDeliveries = document.getElementById('viewAllDelivery');
        allDeliveries.onclick = function() {
            odkTables.openTableToListView(null, util.deliveryTable, null, null,
              'config/tables/deliveries/html/deliveries_list.html');
        };
    } else {
        // TODO: need to add view by distribution
        var byAuth = document.getElementById('viewByAuthorization');
        byAuth.onclick = function () {
            odkTables.openTableToListView(null, util.authorizationTable, null, null,
              'config/tables/authorizations/html/authorizations_list.html?type=deliveries');
        };
    }

    var deliverySearch = document.getElementById('deliverySearch');
    deliverySearch.onclick = function () {
        odkTables.launchHTML(null,
          'config/assets/html/search.html?type=' + util.deliveryTable);
    };
}
