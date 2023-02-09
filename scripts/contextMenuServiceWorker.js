
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
                if (!response) {
                    console.log('No response from content script.');
                    return;
                }
                if (response.error) {
                    console.log('Error sending message: ', response.error);
                } else {
                    if (response.status === 'failed') {
                        console.log('injection failed.');
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
            max_tokens: 650,
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
                return;
            }

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
        const basePromptPrefix =
            `From the item shown below, pick a Wikipedia list of items that includes that item, and show other items in the same list. Make the list about 8-20 items long, say the Wikipedia list that it's found in (if applicable), and include extra information that is relevant in parentheses if helpful. For example:
        item: The Red Balloon
        list: Wikipedia list of Academy Award for Best Original Screenplay 
        1. Sunset Boulevard (1950)
        2. On the Waterfront (1954)
        3. Designing Woman (1957)
        4. The Defiant Ones (1958)
        5. Butch Cassidy and the Sundance Kid (1969)
        6. Patton (1970)
        7. Network (1976)
        8. Witness (1985)
        9. Rain Man (1988)
        10. Pulp Fiction (1994)
        11. Almost Famous (2000)
        12. Milk (2008)
        13. Midnight in Paris (2011)
        
        item: Stirling heat engine
        list: Wikipedia list of Scottish inventions and discoveries: 
        1. Iron-Hulled Steamship (invented by Henry Bell, 1812) 
        2. Wire Rope (invented by Robert Stirling Newall, 1834)
        3. Scotch Plough (invented by James Small, 1790)
        4. Kinetoscope (invented by William Kennedy-Laurie Dickson, 1891)
        5. Teleprinter (invented by Donald Murray, 1923)
        6. Theory of Electromagnetism (developed by James Clerk Maxwell, 1861)
        7. First Cloned Mammal (Dolly the Sheep, cloned by Ian Wilmut, 1996)
        8. General Anaesthetic (first used by James Young Simpson, 1847)
        9. Television (invented by John Logie Baird, 1926)
        10. Vacuum Flask (invented by James Dewar, 1892)
        11. Lucifer Friction Match (invented by Charles Macintosh, 1827)
        
        item: ${selectionText}
        list:`;
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
        sendMessage(null, 'initModal');
        generateCompletionAction(info);
        console.log("Context menu click listener sees this selection text: " + info.selectionText);
    }

});