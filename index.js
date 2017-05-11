'use strict';

function getAlexaLanguage(language) {
    switch(language) {
    case 'de':
        return 'de-DE';
    default:
        return 'en-US';
    }
}

function convertToAlexaStyle(json) {
    //console.log('input:', json);
    if(json.result && json.result.metadata && json.result.metadata.webhookUsed === 'true') {
        json['request'] = {
            locale: getAlexaLanguage(json.lang),
            type: 'IntentRequest',
            intent: {
                name: json.result.action,
                slots: {}
            }
        };
        for(let prop in json.result.parameters) {
            if(json.result.parameters.hasOwnProperty(prop)) {
                json.request.slots[prop] = {name: prop, value: json.result.parameters[prop]}
            }
        }
        json['session'] = {
            'application': {
                'applicationId': 'some-random-id'
            },
            'user': {
                'userId': 'foo'
            }
        };
        json.sessionId = 'api.ai.' + json.sessionId;
    }

    return json;
}

function addApiAiAttributes(context) {
    const orgSucceed = context.succeed;
    context.succeed = function(json) {
        json.speech = json.response.outputSpeech.ssml;
        json.displayText = json.speech.replace(/(<([^>]+)>)/ig, "").trim();
        return orgSucceed(json);
    };
    return context;
}

function wrapper(event, context, callback) {
    return require('alexa-sdk').handler(convertToAlexaStyle(event), addApiAiAttributes(context), callback);
}

module.exports.toAlexaStyle = convertToAlexaStyle;
module.exports.addApiAiAttributes = addApiAiAttributes;
module.exports.handler = wrapper;