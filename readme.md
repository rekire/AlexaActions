Alexa Actions
=============

This is a npm module which adds support for API.ai on the Alexa-SDK to support e.g. Actions on Google.

Usage
-----

The simple way:  
Just replace `require('alexa-sdk')` by `require('alexa-actions')`.

The more advanced usage if something does not work for you:

    const AlexaActions = require('alexa-actions');
    // [...]
    exports.handler = (event, context) => {
        const alexa = Alexa.handler(AlexaActions.toAlexaStyle(event),
                                    AlexaActions.addApiAiAttributes(context));
        alexa.app_id = APP_ID;
        alexa.resources = languageStrings;
        alexa.registerHandlers(handlers);
        alexa.execute();
    };

Examples
--------

Real world examples on Google Home:

- *"Okay Google, ask **Dependency Lookup** where is the class `AdView`?"*"

License
-------

Apache 2.0