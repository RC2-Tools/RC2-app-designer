'use strict';

function display() {
  var barcodeVal = odkCommon.getSessionVariable(barcodeSessionVariable);
  if (barcodeVal !== null && barcodeVal !== undefined && barcodeVal !== "") {
    $('#code').val(barcodeVal);
  }

  $('#barcode').on('click', doActionZxing);

  $('#enter').on('click', function() {
    var val = $('#code').val();

    odkCommon.setSessionVariable(barcodeSessionVariable, val);
    queryChain(val);
  });

  document
    .getElementById('allVisits')
    .addEventListener('click', openVisitProgramListView);

  var user = odkCommon.getActiveUser();
  odkCommon.setSessionVariable(userKey, user);
  console.log("Active User:" + user);

  return populateSyncList()
    .then(function () {
      myTimeoutVal = setTimeout(callBackFn, 1000);

      odkCommon.registerListener(callBackFn);

      // Call the registered callback in case the notification occurred before the page finished
      // loading
      callBackFn();
    });
}

function openVisitProgramListView() {
  odkTables.openTableToListView(
    null,
    'visit_programs',
    null,
    null,
    'config/tables/visit_programs/html/visit_programs_list.html'
  );
}

function queryChainDownstream(passed_code) {
  util.getVisitProgListForBeneficiary(passed_code);
}
