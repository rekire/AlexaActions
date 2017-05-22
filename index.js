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
                name: json.result.action || json.result.metadata.intentName,
                slots: {}
            }
        };
        for(let prop in json.result.parameters) {
            if(json.result.parameters.hasOwnProperty(prop)) {
                json.request.intent.slots[prop] = {name: prop, value: json.result.parameters[prop]}
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
        json.speech = json.response.outputSpeech.ssml.replace(/(<\/?phoneme([^>]*)>)/ig, "");
        json.displayText = json.speech.replace(/(<([^>]+)>)/ig, "").trim();
        json.messages = [];
        if(json.response.card) {
            const card = json.response.card;
            json.messages.push({
                "type": "simple_response",
                "platform": "google",
                "textToSpeech": json.speech.replace(/(<([^>]+)>)/ig, "").trim()
            });
            switch(card.type) {
            case 'Standard':
                json.messages.push({
                    "type": "basic_card",
                    "platform": "google",
                    "title": card.title.replace(/(<([^>]+)>)/ig, ""),
                    "formattedText": card.text.replace(/(<([^>]+)>)/ig, ""),
                    "image": {"url": card.image.largeImageUrl},
                    "buttons": []
                })
            }
        }
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