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
    console.log('input:', json);
    if(json.result && json.result.metadata && json.result.metadata.webhookUsed === 'true') {
        json.request = {
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
        json.session = {
            application: {
                applicationId: 'some-random-id'
            },
            user: {
                userId: 'foo'
            }
        };
        json.sessionId = 'api.ai.' + json.sessionId;

        json.attributes = json.attributes || {};
        for(let i = 0; i < json.result.contexts.length; i++) {
            json.attributes[json.result.contexts[i].name] = json.result.contexts[i].parameters;
        }
    }

    return json;
}

function addApiAiAttributes(context) {
    const orgSucceed = context.succeed;
    context.succeed = function(json) {
        if(json.response) {
            json.speech = json.response.outputSpeech.ssml.replace(/(<\/?phoneme([^>]*)>)/ig, "");
            json.displayText = json.speech.replace(/(<([^>]+)>)/ig, "").trim();
            if(!json.messages) {
                json.messages = [];
                if(json.response.card) {
                    json.messages.push(createDefaultCard(json.speech));
                    json.messages.push(autoConvertCards(json.response.card));
                }
            }
        }
        if(!json.data) {
            json.data = {}
        }
        json.data.contextOut = [];
        for(let key in json.sessionAttributes) {
            json.data.contextOut.push({name: key, lifespan: 0, parameters: json.sessionAttributes[key]});
        }

        console.log("Send out:", json);
        return orgSucceed(json);
    };
    return context;
}

function wrapper(event, context, callback) {
    return require('alexa-sdk').handler(convertToAlexaStyle(event), addApiAiAttributes(context), callback);
}

function createDefaultCard(ssml) {
    return {
        "type": "simple_response",
        "platform": "google",
        "textToSpeech": ssml.replace(/(<([^>]+)>)/ig, "").trim()
    };
}

function autoConvertCards(card) {
    switch(card.type) {
        case 'Standard':
            return {
                "type": "basic_card",
                "platform": "google",
                "title": card.title.replace(/(<([^>]+)>)/ig, ""),
                "formattedText": card.text.replace(/(<([^>]+)>)/ig, ""),
                "image": {"url": card.image.largeImageUrl},
                "buttons": []
            };
        default:
            throw 'Card type "' + card.type + '" is not yet supported.';
    }
}

module.exports.toAlexaStyle = convertToAlexaStyle;
module.exports.addApiAiAttributes = addApiAiAttributes;
module.exports.handler = wrapper;
module.exports.createDefaultCard = createDefaultCard;
module.exports.autoConvertCards = autoConvertCards;