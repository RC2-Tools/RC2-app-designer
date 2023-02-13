define(['promptTypes','jquery','underscore', 'opendatakit', 'database', 'prompts'],
function(promptTypes, $,       _, opendatakit, database) {

var select_one_dropdown_autocomplete = promptTypes.select_one.extend({
    templatePath: '../config/tables/VZLA_IM_ConsultaMedica/forms/VZLA_IM_ConsultaMedica/templates/async_assign.handlebars',
    modification: function(evt) {
        var that = this;
		var event = evt;
		var changedElementName = evt.currentTarget.name;
        odkCommon.log('D',"prompts." + that.type + ".modification - px: " + that.promptIdx + " val: " + $(evt.target).attr('value'));
        var jsonFormSerialization = (that.$('form').serializeArray());
		if(jsonFormSerialization) {
			var promptName = this.name;
			var searchPromptName = "autocomplete-" + promptName;
			var searchDataValue = null;
            if(changedElementName === searchPromptName) {
				var searchSelectedValue = _.find(jsonFormSerialization, function(valueObject) {
					return (searchPromptName === valueObject.name);
				});
				if(searchSelectedValue) {
					var documentElement = document.getElementById(searchSelectedValue['value']);
					if(documentElement) {
					    searchDataValue = documentElement.getAttribute('data-value');
				
					    var selectedValue = _.find(jsonFormSerialization, function(valueObject) {
						    return (promptName === valueObject.name);
					    });
					
					    if(selectedValue) {
						    selectedValue['value'] = searchDataValue;
					    } else {
						    var encodedSelectedValue = {};
						    encodedSelectedValue['name'] = promptName;
						    encodedSelectedValue['value'] = searchDataValue;
						    jsonFormSerialization.push(encodedSelectedValue);
					    }
					}
				}
			}
        }
		
		
        // set the value early...
        // if an earlier event fails that's OK.
        // The user intended to make this change, so it
        // is fine to be out-of-order.
        //
        // If the change is applied with an earlier change
        // then the value has been persisted. If it
        // has not yet been persisted, it will be queued and
        // applied when the user corrects whatever error
        // they had that caused the earlier action to fail.
        //
        that.setValueDeferredChange(that.generateSaveValue(jsonFormSerialization));
        that.updateRenderValue(jsonFormSerialization);

        // Here we don't want to enqueueTriggeringContext - we will include the evt in case a screen redraw is necessary
        odkCommon.log('D',"prompts." + that.type + ".modification: reRender", "px: " + that.promptIdx);
        that.reRender(evt);
    },
	/**
	generateSaveValue: function(jsonFormSerialization) {
        var selectedValue;
        var promptName = this.name;
        if(jsonFormSerialization) {
            selectedValue = _.find(jsonFormSerialization, function(valueObject) {
                return (promptName === valueObject.name);
            });
            if(selectedValue) {
				return selectedValue.dbValue;
            }
        }
        return null;
    },
    
     * Parse a saved string value into the format
     * returned by jQuery's serializeArray function.
     
    parseSaveValue: function(savedValue){
        //Note that this function expects to run after renderContext.choices
        //has been initilized.
        var valInChoices = false;
        if(!_.isString(savedValue)) {
            return null;
        }
        if(this.renderContext.choices) {
            valInChoices = _.find(this.renderContext.choices, function(choice){
                return (choice.data_value === savedValue);
            });
        }
        if (valInChoices) {
			// TODO: NEED TO IMPROVE
			var valueToReturn = valInChoices.display.title.text; 
            return [{
                "name": this.name,
                "value": valueToReturn,
				"dbValue": savedValue
            }];
        }
        return null;
    },
	updateRenderValue: function(formValue) {
        var that = this;
        //that.renderContext.value = formValue;
        var filteredChoices = _.filter(that.renderContext.choices, function(choice) {
            return that.choice_filter(choice);
        });

        if ( !formValue ) {
            that.renderContext.choices = _.map(filteredChoices, function(choice) {
                choice.checked = false;
                return choice;
            });
            return;
        }
        //Check appropriate choices based on formValue
        that.renderContext.choices = _.map(filteredChoices, function(choice) {
            choice.checked = _.any(formValue, function(valueObject) {
                return choice.data_value === valueObject.dbValue;
            });
            return choice;
        });
    },*/
});

return {
"select_one_dropdown_autocomplete" : select_one_dropdown_autocomplete
}});