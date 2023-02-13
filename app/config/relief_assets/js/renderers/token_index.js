'use strict';

var tokenIndex = {};
tokenIndex.actionCustomAuthReset = "actionCustomAuthReset";
tokenIndex.actionTypeKey = "actionTypeKey";

tokenIndex.display = function () {
  $('.menu-item').hide();
  $('.workflow-none').show();

  return dataUtil
    .reconcileTokenAuthorizations()
    .then(function (result) {
      document.getElementById('deliver').onclick = function () {
        odkTables.launchHTML(null, 'config/relief_assets/html/delivery.html');
      };

      document.getElementById('data').onclick = function () {
        odkTables.launchHTML(
          null,
          'config/relief_assets/html/data_delivery.html'
        );
      };

      odkCommon.registerListener(tokenIndex.callBackFn);

      // Call the registered callback in case the notification occurred before the page finished
      // loading
      tokenIndex.callBackFn();
    })
    .then(function () {
      return util.renderSuperuserFeatures(function () {
        document.getElementById("overrides").onclick = function () {
          odkTables.launchHTML(null, 'config/relief_assets/html/token_overrides.html');
        };
      })
    })
};

tokenIndex.callBackFn = function () {
  var action = odkCommon.viewFirstQueuedAction();
  console.log('callback entered with action: ' + action);

  if (action === null || action === undefined) {
    // The queue is empty
    return;
  }

  var dispatchStr = JSON.parse(action.dispatchStruct);
  if (dispatchStr === null || dispatchStr === undefined) {
    console.log('Error: missing dispatch struct');
    odkCommon.removeFirstQueuedAction();
    return;
  }

  var actionType = dispatchStr[tokenIndex.actionTypeKey];
  console.log('callBackFn: actionType: ' + actionType);

  switch (actionType) {
    case tokenIndex.actionCustomAuthReset:
      console.log(action.jsonValue);
      var result = action.jsonValue.result;
      if (result !== undefined && result !== null) {
        var savepointType = result.savepoint_type;
        if (savepointType === util.savepointSuccess) {
          return dataUtil.reconcileTokenAuthorizations();
        }
      }
      odkCommon.removeFirstQueuedAction();
      break;
    default:
      console.log("Error: unrecognized action type in callback");
      odkCommon.removeFirstQueuedAction();
      break;
  }
};
