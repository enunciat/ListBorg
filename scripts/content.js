let modal = null;
let modalContent = null;
let headerContainer = null;
let buttonsContainer = null;
let closeBtn = null;
let modalRect = null;
let storedPositionModal;
let modalIsLeft = false;
let updateTextBuffer = '';
let processorTextBuffer = '';
let asSidebar = false;
//cursor for when list is loading:
let cursorLoading = null;

///////////////////////////////////////////// CREATE MODAL /////////////////////////////////////////////
const createModal = () => {
    if (modal) {
        modal.parentNode.removeChild(modal);
    }

    //clear console text buffers:
    updateTextBuffer = '';
    processorTextBuffer = '';

    //create modal div:
    modal = document.createElement("div");
    modal.classList.add("lb-modal");
    modal.id = "lb-modal-id";
    modal.innerHTML = `
        <div class="lb-modal-close" id="lb-modal-close-id"></div>
        <div class="lb-modal-content" id="lb-modal-content-id">
            <div class="lb-header-container" id="lb-header-container-id"></div>
            <div class="lb-buttons-container"" id="lb-buttons-container-id"></div>
        </div>
    `;

    ////////////////////////////////////// STYLES //////////////////////////////////////

    const style = document.createElement('style');
    style.textContent = `
    /* css reset: */
    html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed, figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary, time, mark, audio, video {
        margin: 0;
        padding: 0;
        border: 0;
        font-size: 100%;
        font: inherit;
        font-family: Arial, sans-serif;
        vertical-align: baseline;
        }

    /* my styles: */
    #lb-modal-id.lb-modal {
        display: none;
        position: fixed;
        top: 100%;
        left: 100%;
        margin: 0;
        width: 300px;
        /* adjust as needed */
        background-color: #333;
        border: 1px solid;
        border-image: linear-gradient(to right, #3f87a6, #ebf8e1, #f69d3c);
        border-image-slice: 1;
        border-radius: 0;
        padding: 20px;
        z-index: 2147483645;
        color: #fff;
        font-family: Arial, sans-serif;
        transition: all 0.2s ease-out;
    }
    
    #lb-modal-id .lb-modal-content {
        /* allows for scrolling if the list is long */
        overflow: auto;
        /* limits the height of the modal-content */
        max-height: 80vh;
    }
    
    #lb-modal-id .lb-cursor {
        display: inline-block;
        width: 5px;
        height: 14px;
        background-color: #ccc;
        left: 50px;
        transition: all 0.5s ease-in-out;
    }
    
    #lb-modal-id #lb-modal-close-id.lb-modal-close {
        position: absolute;
        top: -10px;
        right: -12px;
        width: 30px;
        height: 30px;
        text-align: center;
        background: linear-gradient(to right, #FFAB00, #F96B00);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 12px;
        z-index: 2147483646;
        border: 1px solid linear-gradient(to bottom right, #DA7E00, #F46D00);
    }
    
    #lb-modal-id .lb-header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
    }
    
    #lb-modal-id h2 {
        width: 80%;
        color: lightgrey;
        font-size: medium;
        /* center text */
        text-align: center;
        margin: 0;
    
    }
    
    #lb-modal-id .lb-next-button,
    #lb-modal-id .lb-prev-button {
        width: 10%;
        text-align: center;
    }
    
    #lb-modal-id .lb-prev-button {
        margin-right: 10px;
    }
    #lb-modal-id .lb-next-button {
        margin-left: 10px;
    }

    #lb-modal-content-id ul.lb-items-ul {
        list-style: none !important;
        text-decoration: none !important;
    }
    
    #lb-modal-id li[class*="item"] {
        display: block;
        text-decoration: none !important;
        color: lightgrey !important;
        font-family: Arial, sans-serif !important;
        list-style: none !important;

    }
    
    #lb-modal-id span.lb-item-details {
        margin: 0px;
        padding: 0px;
        font-size: smaller;
        color: gray;
        display: inline;
        padding-left: 0.5em;
        padding-right: 0.5em;
        background-color: #333 !important;
        font-family: Arial, sans-serif !important;
    }
    
    #lb-modal-id span.lb-item-details:before {
        content: ' (';
        list-style: none !important;
        text-decoration: none !important;
        padding: 0px;
    }
    
    #lb-modal-id span.lb-item-details:after {
        content: ')';
        list-style: none !important;
        text-decoration: none !important;
        padding: 0px;
    }
    
    #lb-modal-content-id .lb-items-ul li::before {
        content: '' !important;
        padding: 0px !important;
        padding-left: 0px !important;
      }
      
    ul>li {
        padding: 0px !important;
        list-style: none !important;
        content: '' !important;
    }
    
    /* /////////////////////////////buttons///////////////////////////// */
    
    
    #lb-modal-id .lb-quantity {
        width: 30px;
      }
    }
  `;
    document.head.appendChild(style);
    ////////////////////////////////////// END STYLES //////////////////////////////////////
    document.body.appendChild(modal);
    showCursor(modalContent);

    //Text selection and setting up positioning of modal and arrow:
    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    let rect = range.getBoundingClientRect();
    let vw = Math.round(rect.left / window.innerWidth * 100);
    let vh = Math.round(rect.top / window.innerHeight * 100);

    const positionModal = () => {
        // Get the height of the modal
        let modalHeight = modal.offsetHeight;

        // Calculate the top and left position of the modal
        let top = rect.top + (rect.height / 2) - (modalHeight / 2);
        let left = (rect.left + rect.width) + 15;

        // Check if the top of the modal is outside the viewport
        if (top < 0) {
            top = 20;
        }
        // Check if the bottom of the modal is outside the viewport
        if (top + modalHeight > window.innerHeight) {
            top = window.innerHeight - modalHeight;
        }

        // Check if the right of the modal is outside the viewport, if so move it to the left of the selection
        modalIsLeft = false;
        if (left + modal.offsetWidth > window.innerWidth) {
            left = (rect.left - modal.offsetWidth) - 15;
            modalIsLeft = true;
        }

        // Update the top and left position of the modal
        modal.style.top = `${top}px`;
        modal.style.left = `${left}px`;
        console.log("POSITION MODAL RAN with modal.style.top: " + modal.style.top + " and modalHeight: " + modalHeight);
        modal.style.display = `block`;

        //     // Check if the arrow already exists
        //     let arrow = shadowRoot.querySelector(".lb-modal-arrow");
        //     if (!arrow) {
        //         // Create the arrow
        //         arrow = document.createElement("div");
        //         arrow.className = "lb-modal-arrow";
        //         arrow.style.position = "fixed";
        //         arrow.style.display = "none";
        //         arrow.style.width = "20px";
        //         arrow.style.height = "20px";
        //         arrow.style.transform = "rotate(45deg)";
        //         arrow.style.backgroundColor = "white";
        //         modal.appendChild(arrow);
        //     }
        //     // Update the position of the arrow
        //     if (modalIsLeft) {
        //         arrow.style.left = `${rect.left - arrow.offsetWidth - 10}px`;
        //     } else {
        //         arrow.style.left = `${rect.left + rect.width + 10}px`;
        //     }
        //     arrow.style.top = `${rect.top + (rect.height / 2) - 10}px`;

    };
    storedPositionModal = positionModal;
    storedPositionModal();


    modalContent = modal.querySelector('.lb-modal-content');
    // if(modalContent === null) {
    //     alert("The modalContent was NOT found in the shadow root.");
    // } else {
    //     alert("modalContent was found!");
    // }
    headerContainer = modalContent.querySelector('.lb-header-container');
    buttonsContainer = modalContent.querySelector('.lb-buttons-container');
    closeBtn = modal.querySelector('.lb-modal-close');


    closeBtn.innerHTML = "&times;";

    modalCloseListener = (event) => {
        if (event.target.classList.contains('lb-modal-close') ||
            (modal && modal.contains && !modal.contains(event.target))) {
            if (modal) {
                modal.parentNode.removeChild(modal);
                modal = null;
                chrome.runtime.sendMessage({ message: 'cancel_generate' });
            }
        } else {
            // clicks outside the modal are handled by the host website
            event.stopPropagation();
        }
    };
    modal.addEventListener("click", modalCloseListener);

    ///////////positioning of modal:
    modalRect = modal.getBoundingClientRect();


};
///////////////////////////////////////////// END CREATE MODAL /////////////////////////////////////////////


///////////////////////////////////////////STREAM VERSION: UPDATE MODAL /////////////////////////////////////////////
const updateModalStream = (streamData) => {
    console.log("updateModalStream called with streamData: " + streamData);
    updateTextBuffer += streamData;

    // this streamData sometimes has multiple events (chunks) in one message, so we need to handle this properly
    const chunks = streamData.split('data: ');

    chunks.forEach(chunk => {
        //sometimes they're empty  
        if (!chunk.trim()) {
            return;
        }
        //the last one is just [DONE]
        if (chunk.trim() == "[DONE]") {
            //console.log("data: [DONE] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            updateDone();
            return;
        }
        let startIndex = chunk.indexOf('{');
        let endIndex = chunk.lastIndexOf('}') + 1;
        let jsonString = chunk.substring(startIndex, endIndex);
        // Add validation for JSON string
        if (!jsonString.trim()) {
            console.error("The JSON string is empty.");
            return;
        }
        try {
            let data = JSON.parse(jsonString);
            //console.log("the DATA is the following: " + data);

            // Extract the "text" value
            let lineText = data.choices[0].text;

            // Call the updateModalProcessor function and pass the text to it
            updateModalProcessor(lineText);
            processorTextBuffer += lineText;

            //modal positioning
            // storedPositionModal();
        } catch (error) {
            console.error("My Error parsing JSON: " + error);
        }
    });
};

///////////////////////////////////////////TEXT PROCESSOR /////////////////////////////////////////////
let modalBuffer = "";
let itemsUL;
const updateModalProcessor = (text) => {
    if (!modal) {
        console.error("The modal element was not found.");
    }
    modalBuffer += text;
    let lines = modalBuffer.split("\n");
    if (lines.length > 1) {
        modalBuffer = lines.pop();
        lines.forEach((line) => {
            if (line.startsWith("list-title:")) {
                //create current list title as an h2
                let currentListTitleText = line.replace("list-title:", "");
                let currentListTitle = document.createElement("h2");
                currentListTitle.innerText = currentListTitleText;
                currentListTitle.classList.add("lb-current-list-title");
                // create prev/next buttons
                let prevButton = document.createElement("button");
                prevButton.innerText = "<";
                prevButton.classList.add("lb-prev-button");
                headerContainer.appendChild(prevButton);
                headerContainer.appendChild(currentListTitle);
                showCursor(currentListTitle);
                let nextButton = document.createElement("button");
                nextButton.innerText = ">";
                nextButton.classList.add("lb-next-button");
                headerContainer.appendChild(nextButton);
                showCursor(nextButton);
            } else if (line.startsWith("item-")) {
                // if no UL with class="items", create one
                itemsUL = modal.querySelector(".lb-items-ul");
                if (!itemsUL) {
                    itemsUL = document.createElement("ul");
                    itemsUL.classList.add("lb-items-ul");
                    modalContent.appendChild(itemsUL);
                }
                // create list item
                let itemText = line.replace(/^item-[0-9]+:/, "");
                let itemLI = document.createElement("li");
                itemLI.innerText = itemText;
                let itemNum = line.split(":")[0].replace("item-", "");
                itemLI.classList.add("lb-item-li", "item-" + itemNum);
                itemsUL.appendChild(itemLI);
                showCursor(itemLI);
            } else if (line.startsWith("list-")) {
                // create button for list metadata
                let metadataText = line.replace(/^list-/, "");
                let metadata = metadataText.split(":");
                let metadataType = metadata[0];
                let metadataValue = metadata[1];
                if (metadataType === "quantity") {
                    let quantityInput = document.createElement("input");
                    quantityInput.type = "number";
                    quantityInput.value = metadataValue;
                    quantityInput.classList.add("lb-quantity");
                    headerContainer.insertBefore(quantityInput, headerContainer.firstChild);
                } else {
                    let button = document.createElement("button");
                    button.innerText = `${metadataType}: ${metadataValue}`;
                    let buttonClass = "lb-metadata-" + metadataType;
                    button.classList.add("lb-metadata", buttonClass);
                    button.dataset[metadataType] = metadataValue;
                    if (metadataType === "type") {
                        button.addEventListener("click", () => {
                            let select = document.createElement("select");
                            let options = ["encyclopedic", "evaluative", "top-10", "artistic"];
                            options.forEach((option) => {
                                let optionElement = document.createElement("option");
                                optionElement.value = option;
                                optionElement.text = option;
                                select.appendChild(optionElement);
                            });
                            select.value = metadataValue;
                            select.addEventListener("change", () => {
                                button.dataset[metadataType] = select.value;
                                button.innerText = `${metadataType}: ${select.value}`;
                                select.remove();
                            });
                            button.innerText = "";
                            button.appendChild(select);
                            select.focus();
                        });
                    } else if (metadataType === "details") {
                        button.innerText = "Details: On";
                        button.addEventListener("click", () => {
                            if (button.innerText === "Details: On") {
                                button.innerText = "Details: Off";
                                button.dataset[metadataType] = "off";
                            } else {
                                button.innerText = "Details: On";
                                button.dataset[metadataType] = "on";
                            }
                        });
                    } else {
                        button.addEventListener("click", () => {
                            let input = document.createElement("input");
                            input.value = metadataValue;
                            input.addEventListener("keydown", (event) => {
                                if (event.key === "Enter") {
                                    button.dataset[metadataType] = input.value;
                                    button.innerText = `${metadataType}: ${input.value}`;
                                    input.remove();
                                }
                            });
                            button.innerText = "";
                            button.appendChild(input);
                            input.focus();
                        });
                    }
                    buttonsContainer.appendChild(button);
                }
                addMetadataButtonListeners();
            }
            else if (line.startsWith("details-")) {
                // add details to corresponding list item
                let detailsText = line.replace(/^details-item-/, "");
                let details = detailsText.split(":");
                let itemId = "item-" + details[0];
                let item = itemsUL.querySelector("." + itemId);
                if (item) {
                    let detailsSpan = document.createElement("span");
                    detailsSpan.innerText = details[1];
                    detailsSpan.classList.add("lb-item-details");
                    item.appendChild(detailsSpan);
                    showCursor(detailsSpan);
                }
            } else {
                showCursor(modalContent);
                modalContent.innerHTML = modalContent.innerHTML + line + "\n";
                hideCursor();
            }
        });
    }
    //also added button listener above after each "list-" line
    addMetadataButtonListeners();
    //modal positioning
    storedPositionModal();
};


function addMetadataButtonListeners() {

    const metadataButtons = modal.querySelectorAll('.lb-metadata');
    let selectedText = '';
    let selectedKey = '';
    let selectedValue = '';

    metadataButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            selectedText = window.getSelection().toString();
            selectedKey = event.target.dataset.key;
            selectedValue = event.target.value;
        });

        button.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                chrome.runtime.sendMessage({
                    message: 'send_prompt',
                    prompt: {
                        selectionText: selectedText,
                        key: selectedKey,
                        value: selectedValue
                    }
                });
            }
        });
    });
}



const updateDone = () => {
    let doneText = "\n";
    updateModalProcessor(doneText);
    hideCursor();
    console.log("//////// Update Text is //////" + updateTextBuffer);
    console.log(processorTextBuffer);
};

function showCursor(element) {
    const existingCursor = modal.querySelector('.lb-cursor');
    if (existingCursor) {
        existingCursor.remove();
    }
    let cursor = document.createElement("span");
    cursor.classList.add("lb-cursor");
    modal.appendChild(cursor);
    //make it the same height as the element:
    setTimeout(() => {
        if (!element) {
            modalContent.appendChild(cursor);
            cursor.style.height = '20px';
        } else {
            element.appendChild(cursor);
            cursor.style.top = `${element.offsetTop + (element.offsetHeight - cursor.offsetHeight) / 2}px`;
            cursor.style.left = `${element.offsetLeft + element.offsetWidth + 20}px`;
        }

    }, 0);

    let counter = 0;
    cursorLoading = setInterval(() => {
        cursor.style.opacity = counter % 2 === 0 ? '0' : '1';
        counter++;
    }, 500);
}

function hideCursor() {
    clearInterval(cursorLoading);
    const cursors = modal.querySelectorAll('.lb-cursor');
    cursors.forEach(cursor => {
        cursor.parentNode.removeChild(cursor);
    });
}

// const insert = (content) => {

//     //remove leading and trailing whitespace:
//     content = content.trim();

//     // Find Calmly editor input section
//     const elements = shadowRoot.getElementsByClassName('droid');
//     console.log("elements: ", elements);

//     if (elements.length === 0) {
//         return;
//     }

//     const element = elements[0];

//     // Check if there is a selected text
//     const selection = window.getSelection();
//     if (selection.rangeCount === 0) {
//         console.log("I returned early from selection because there was no rangeCount");
//         return;
//     }

//     // Replace selected text with new content
//     const range = selection.getRangeAt(0);
//     console.log("before deletion, the range is: ", range);

//     //BuildSp used delete Contents, but extractContents is another possibility
//     range.deleteContents();

//     //extractContents is another possibility 
//     //const extractedContent = range.extractContents();

//     const textNode = shadowRoot.createTextNode(content);
//     range.insertNode(textNode);


//     console.log("after inserting, the range is: ", range);
//     console.log("insert sees textNode as: ", textNode);
//     console.log("textNode is typeof: " + typeof textNode);
//     console.log("insert sees content as: ", content);
//     console.log("content is typeof: " + typeof content);

//     // remove the modal after inserting new text:
//     let modal = shadowRoot.querySelector(".list-modal");
//     modal.style.display = 'none';
//     createModalCloseListener();
//     return true;
// };

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        console.log("I just received ANY message but haven't received content yet");
        if (request.message === 'modal') console.log("I just received a MODAL message but haven't received content yet");
        const { content } = request;
        switch (request.message) {
            case 'inject':
                // Call this insert function
                const insertText = insert(content);
                console.log("in the message listener, content is typeof: " + typeof content);

                // If something went wrong, send a failed status
                if (!insertText) {
                    sendResponse({ status: 'failed' });
                    console.log(
                        "#0: my status failed so there's no content here: " + content,
                    );
                } else {
                    console.log('My content variable is: ' + content);
                    sendResponse({ status: 'success' });
                }
                break;

            case 'initModal':
                console.log("initModal message case being handled");
                createModal();
                sendResponse({ status: 'success' });
                break;
            // case 'modal':
            //     console.log("MODAL message case being handled");
            //     updateModal(content);
            //     sendResponse({ status: 'success' });
            //     break;
            case 'stream':
                console.log('STREAM message case being handled');
                updateModalStream(content);
                sendResponse({ status: 'success' });
                break;
        }
        return true;
    },
);