'use strict';

var display = function() {
  document.getElementById('title').innerText = util.getQueryParameter('serviceName');
 
  var referral_id = util.getQueryParameter("referralRowId");

  // check if editing the referral or it is new
  if(referral_id === null || referral_id === '') {
	document.getElementById('referralNotesSubmit').addEventListener('click', addReferralOnClick);
  } else {
	document.getElementById('referralNotesSubmit').addEventListener('click', saveReferralOnClick);  
	return new Promise( function(resolve, reject) {
			odkData.getViewData(resolve, reject);
		}).then( function(result) {
			document.getElementById('referralNotesTextarea').value = result.get('notes');
		});
  }
};

var saveReferralOnClick = function () {
  // TODO: handle referral custom table
  // TODO: error when notes exceeds max length

  var rowId = util.getQueryParameter("referralRowId");

  return new Promise(function (resolve, reject) {
		var notes = document.getElementById('referralNotesTextarea').value;
		if (notes === undefined || notes === '') {
			notes = null;
		}

		var updatedReferral = {
			notes: notes
		}

		odkData.updateRow('referrals', updatedReferral, rowId, resolve, reject)
  }).then(function () {
      // TODO: new util for non-error popup
      util.displayConfirm('Referral Updated', function () {
        odkCommon.closeWindow();
      });
    })
    .catch(function (e) {
      util.displayError(e);
    });
};


var addReferralOnClick = function () {
  // TODO: handle referral custom table
  // TODO: error when notes exceeds max length

  var notes = document.getElementById('referralNotesTextarea').value;
  if (notes === undefined || notes === '') {
    notes = null;
  }

  var newReferral = {
    beneficiary_entity_id: util.getQueryParameter('beneficiaryEntityRowId'),
    date_issued: odkCommon.toOdkTimeStampFromDate(new Date()),
    notes: notes,
    service_id: util.getQueryParameter('serviceRowId'),
    status: 'ACTIVE'
  }

 return new Promise(function (resolve, reject) {
	 
    odkData.addRow('referrals', newReferral, odkCommon.genUUID(), resolve, reject)
  })
    .then(function () {
      // TODO: new util for non-error popup
      util.displayConfirm('Referral Created', function () {
        odkCommon.closeWindow();
      });
    })
    .catch(function (e) {
      util.displayError(e);
    });
};
