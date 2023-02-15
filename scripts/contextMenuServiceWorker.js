
// Function to get + decode API key
const getKey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openai-key'], (result) => {
            if (result['openai-key']) {
                const decodedKey = atob(result['openai-key']);
                resolve(decodedKey);
            } else {
                reject(new Error('API key not found in storage'));
            }
        });
    });
}



const sendMessage = (content, messageType = 'modal') => {
    console.log("sendMessage before tabs.query");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            console.log("#1: Error: No active tabs found.");
            return;
        }

        const activeTab = tabs[0].id;

        chrome.tabs.sendMessage(
            activeTab,
            { message: messageType, content },
            (response) => {
                console.log('message sent! type: ' + messageType);
                if (!response) {
                    console.log('No response from content script.');
                    return;
                }
                if (response.error) {
                    console.log('Error sending message: ', response.error);
                } else {
                    if (response.status === 'failed') {
                        console.log('message failed.');
                    } else {
                        console.log('message sent without status notfailed; type: ' + messageType);
                    }
                }
            });
    });

};

// generate using openai api:
const generate = async (prompt) => {
    console.log("OPEN AI API WAS CALLED")
    // Get your API key from storage
    const key = await getKey();
    const url = 'https://api.openai.com/v1/completions';

    // OpenAI completions models:
    //text-davinci-003
    //text-curie-001
    //text-babbage-001
    //text-ada-001


    const completionResponse = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 850,
            temperature: 0.2,
            stream: true,
        }),
    });

    // stream version:

    const stream = completionResponse.body;
    const reader = stream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            const line = new TextDecoder("utf-8").decode(value);
            console.log("generate function completionResponse.body iwth getReader: " + line);
            // Check if there is a message from the main thread to cancel the request
            if (cancelled) {
                console.log('444444444444 cancelled');
                return;
            }
            console.log("33 out to call sendMessage using line: " + line + " and messageType: stream");
            sendMessage(line, 'stream');
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};
//end stream version.

// cancelling
let cancelled = false;

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (request.message === 'cancel_generate') {
            // code to cancel the OpenAI request
            cancelled = true;
        }

    }
);


//toggle Dummy mode:
let isDummyMode = false;

const generateCompletionAction = async (info) => {
    try {

        // Send mesage with generating text (this will be like a loading indicator)
        //sendMessage('<...generating ListBorg for ' + info.selectionText + '...>');

        let { selectionText } = info;
        console.log("#2: my selectionText is: " + selectionText);
//         const basePromptPrefix =
// `Task name: Generate a list that would accurately contain this item. Task Instructions: For the item requested provided, generate a real, accurate, and complete list that would really include that item. The generated list should not just be on the general topic of the requested item; it should be a list that would accurately include that item as one of its members. The request may optionally also include list metadata parameters like "details", "quantity", "order", etc. Create a list of 5-20 items unless specified otherwise. Follow the 2 examples provided below. As you generate your list title, check to make sure it would really include the requested item as one of its members, and if not, choose another list title. As you generate each list item (<li>'s), check it for accuracy to make sure it really belongs in the list, and if it doesn't, replace it with an item that does. Include no other HTML tags than those shown below.

// Generate a list that would accurately contain this item: <li>the godfather</li><li id="details">true</li>
// <h2 id="list-title">AFI's 100 Years...100 Movies</h2>
// <li class="item1">Citizen Kane</li>
// <li class="item2">Casablanca</li>
// <li class="item3">The Godfather</li>
// <li class="item4">Gone with the Wind</li>
// <li class="item5">Lawrence of Arabia</li>
// <li class="item6">The Wizard of Oz</li>
// <li class="item7">The Graduate</li>
// <li class="item8">On the Waterfront</li>
// <li class="item9">Schindler's List</li>
// <li class="item10">Singin' in the Rain</li>
// <li class="metadata quantity">10</li>
// <li class="metadata order">quality</li>
// <li class="metadata category">film</li>
// <li class="metadata list-type">evaluative</li>
// <li class="metadata notes">This is the first 10 of the AFI's 100 years...100 movies list.</li>
// <li class="metadata sources">https://en.wikipedia.org/wiki/AFI%27s_100_Years...100_Movies</li>
// <li class="metadata details">true</li>
// <li class="details item1">1941, directed by Orson Welles, produced by RKO Radio Pictures</li>
// <li class="details item2">1942, directed by Michael Curtiz, produced by Warner Bros. Pictures</li>
// <li class="details item3">1972, directed by Francis Ford Coppola, produced by Paramount Pictures, Alfran Productions</li>
// <li class="details item4">1939, directed by Victor Fleming, produced by Selznick International Pictures</li>
// <li class="details item5">1962, directed by David Lean, produced by Horizon Pictures</li>
// <li class="details item6">1939, directed by Victor Fleming, produced by Metro-Goldwyn-Mayer</li>
// <li class="details item7">1967, directed by Mike Nichols, produced by Lawrence Turman</li>
// <li class="details item8">1954, directed by Elia Kazan, produced by Horizon-American Pictures</li>
// <li class="details item9">1993, directed by Steven Spielberg, produced by Amblin Entertainment</li>
// <li class="details item10">1952, directed by Gene Kelly and Stanley Donen, produced by Metro-Goldwyn-Mayer</li>      

// Generate a list that would accurately contain this item: <li>Azerbaijan</li><li id="order">alphabetical</li>
// <h2 id="list-title">Wikipedia List of Landlocked Countries</h2>
// <li class="item1">Afghanistan</li>
// <li class="item2">Andorra</li>
// <li class="item3">Armenia</li>
// <li class="item4">Austria</li>
// <li class="item5">Azerbaijan</li>
// <li class="item6">Belarus</li>
// <li class="item7">Bhutan</li>
// <li class="metadata quantity">7</li>
// <li class="metadata order">alphabetical</li>
// <li class="metadata category">geography</li>
// <li class="metadata list-type">encyclopedic</li>
// <li class="metadata notes">This is a list of landlocked countries on Wikipedia</li>
// <li class="metadata sources">https://en.wikipedia.org/wiki/List_of_landlocked_countries</li>
// <li class="metadata details">false</li>

// Generate a list that would accurately contain this item: <li>${selectionText}</li><li class="metadata list-type">evaluative</li>
// `;

const basePromptPrefix =
`Task name: Generate a list that would accurately contain this item. Task Instructions: For the item requested provided, generate a real, accurate, and complete list that would really include that item. The generated list should not just be on the general topic of the requested item; it should be a list that would accurately include that item as one of its members. The request may optionally also include list metadata parameters like "details", "quantity", "order", etc. Create a list of 5-20 items unless specified otherwise. Follow the 2 examples provided below. As you generate your list title, check to make sure it would really include the requested item as one of its members, and if not, choose another list title. As you generate each list item (<li>'s), check it for accuracy to make sure it really belongs in the list, and if it doesn't, replace it with an item that does. Include no other HTML tags than those shown below.

Generate a list that would accurately contain this item: the godfather list-details: true
list-title:AFI's 100 Years...100 Movies
item-1:Citizen Kane
item-2:Casablanca
item-3:The Godfather
item-4:Gone with the Wind
item-5:Lawrence of Arabia
item-6:The Wizard of Oz
item-7:The Graduate
item-8:On the Waterfront
item-9:Schindler's List
item-10:Singin' in the Rain
list-quantity:10
list-order:quality
list-category:film
list-type:evaluative
list-notes:This is the first 10 of the AFI's 100 years...100 movies list.
list-sources:https://en.wikipedia.org/wiki/AFI%27s_100_Years...100_Movies
list-details:true
details-item-1:1941, directed by Orson Welles, produced by RKO Radio Pictures
details-item-2:1942, directed by Michael Curtiz, produced by Warner Bros. Pictures
details-item-3:1972, directed by Francis Ford Coppola, produced by Paramount Pictures, Alfran Productions
details-item-4:1939, directed by Victor Fleming, produced by Selznick International Pictures
details-item-5:1962, directed by David Lean, produced by Horizon Pictures
details-item-6:1939, directed by Victor Fleming, produced by Metro-Goldwyn-Mayer
details-item-7:1967, directed by Mike Nichols, produced by Lawrence Turman
details-item-8:1954, directed by Elia Kazan, produced by Horizon-American Pictures
details-item-9:1993, directed by Steven Spielberg, produced by Amblin Entertainment
details-item-10:1952, directed by Gene Kelly and Stanley Donen, produced by Metro-Goldwyn-Mayer

Generate a list that would accurately contain this item: Azerbaijan list-order:alphabetical
list-title:Wikipedia List of Landlocked Countries
item-1:Afghanistan
item-2:Andorra
item-3:Armenia
item-4:Austria
item-5:Azerbaijan
item-6:Belarus
item-7:Bhutan
list-quantity:7
list-order:alphabetical
list-category:geography
list-type:encyclopedic
list-notes:This is a list of landlocked countries on Wikipedia
list-sources:https://en.wikipedia.org/wiki/List_of_landlocked_countries
list-details:false

Generate a list that would accurately contain this item: ${selectionText} details:true
`;

        console.log(`#3: My basePromptPrefixSelectionText which is being sent to my baseCompletion is: ${basePromptPrefix}`);


        //added dummy mode to save api calls:
        let baseCompletion;
        if (isDummyMode) {
            baseCompletion = {
                text: `Wikipedia list of Christian terms in non-Christian cultures:
                1. Amen (Hebrew for "so be it")
                2. Hallelujah (Hebrew for "praise the Lord")
                3. Messiah (Hebrew for "anointed one")
                4. Abba (Aramaic for "father")
                5. Hosanna (Hebrew for "save us")
                6. Kyrie Eleison (Greek for "Lord, have mercy")
                7. Agape (Greek for "love")
                8. Eucharist (Greek for "thanksgiving")
                9. Amen (Egyptian for "hidden")
                10. Shalom (Hebrew for "peace")
                11. Adonai (Hebrew for "my Lord")
                12. Hope (Latin for "expectation")
                13. Love (Latin for "affection")"
                `
            };
        } else {
            //the AI api call:
            baseCompletion = await generate(`${basePromptPrefix}`);
        }

        //stream attempt a: i disabled the line below: ///////////////////////////////
        //const baseCompletionText = baseCompletion.text;

        // stream attempt b: i disabled the line below: ///////////////////////////////
        //sendMessage(baseCompletionText, 'modal');

        //change selectedText message while waiting for it to be updated by user:
        //sendMessage('<ListBorg ready for ' + selectionText + '>');

        // Create the context menu with the baseCompletion.text
        //createContextMenu(baseCompletionText);


        //second prompt:
        // const secondPrompt = `Given the following list of items: 
        // ${baseCompletion.text}

        // Ignore the exact items on the list, and compile in your memory a new complete list, which has every single possible item included the list. We will call this list in your memory the complete list. Now rank the items in this complete list in your memory, from best to worst. The best item is the item that you would most want to have, and the worst item is the item that you would least want to have.

        // Now pick the best item and print it out, with no other text or information added or formatting or parentheses or anything else except the item by itself. Always print out an item even if you don't think it's truly better, just print out the next best item.

        // Always make sure to print out an item that is different from ${selectionText}. 
        // `;




        // Call your second prompt
        let secondPromptCompletion;
        if (isDummyMode) {
            // Dummy response
            secondPromptCompletion = {
                text: "The best item is Love (Latin for 'affection')"
            };
        } else {
            // give the dummy response anyway right now till i figure out whether to use secondPromptCompletion:
            secondPromptCompletion = {
                text: "(DUMMY MODE STILL!) The best item is Love (Latin for 'affection')"
                // Normal mode
                //secondPromptCompletion = await generate(secondPrompt);
            }
        }

        // Send the output when we're all done
        //sendMessage(secondPromptCompletion.text);


    } catch (error) {
        console.log(error);

        // Add this here as well to see if we run into any errors!
        sendMessage(error.toString());
    }
}


// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    // create the main context menu:
    chrome.contextMenus.create({
        id: 'context-main',
        title: 'ListBorg: %s',
        contexts: ['selection'],
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'context-main') {
        //initModal is just to create a modal window to show the user a list is loading
        cancelled = false;
        sendMessage(null, 'initModal');
        generateCompletionAction(info);
        //console.log("Context menu click listener sees this selection text: " + info.selectionText);
    }

});