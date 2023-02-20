let modal = null;
let modalContent = null;
let headerContainer = null;
let metadataContainer = null;
let footerContainer = null;
let closeBtn = null;
let modalRect = null;
let storedPositionModal;
let modalIsLeft = false;
let updateTextBuffer = '';
let processorTextBuffer = '';
let asSidebar = false;
//cursor for when list is loading:
let cursorLoading = null;
let modalBuffer = "";
let ULContainer;
let itemsUL;
let submitButton;
let selection;
let range;
let selectedItem;
let selectedItemValue;

///////////////////////////////////////////// CREATE MODAL /////////////////////////////////////////////
const createModal = (selectedText = '') => {
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
                <div class="lb-metadata-container"" id="lb-metadata-container-id"></div>
                <div class="lb-UL-container" id="lb-UL-container-id"><ul class="lb-itemsUL" id="lb-itemsUL-id"></ul></div>
                <div class="lb-footer-container"" id="lb-footer-container-id"></div>
            </div>
    `;

    modalContent = modal.querySelector('.lb-modal-content');
    headerContainer = modalContent.querySelector('.lb-header-container');
    metadataContainer = modalContent.querySelector('.lb-metadata-container');
    footerContainer = modalContent.querySelector('.lb-footer-container');
    closeBtn = modal.querySelector('.lb-modal-close');
    ULContainer = modal.querySelector('.lb-UL-container');
    itemsUL = modal.querySelector('.lb-itemsUL');
    submitButton = document.createElement("button");
    submitButton.innerHTML = "Refresh List";
    submitButton.id = "lb-submit-button-id";
    submitButton.classList.add("lb-submit-button");
    footerContainer.appendChild(submitButton);

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
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;        vertical-align: baseline;
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
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;
        transition: all 0.2s ease-out;
    }
    
    #lb-modal-id .lb-modal-content {
        /* allows for scrolling if the list is long */
        overflow: auto;
        /* limits the height of the modal-content */
        max-height: 80vh;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;
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
        z-index: 2147483646;
        border: 1px solid linear-gradient(to bottom right, #DA7E00, #F46D00);
    }

    #lb-modal-id #lb-modal-close-id.lb-modal-close:before {
        content: "\u00D7";
        position: absolute;
        top: 45%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.1em;
        font-family: Lucida Sans Unicode;
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
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;
    
    }

    #lb-modal-id #lb-UL-container-id.lb-UL-container {
        padding: 15px 0px;
    }

    #lb-modal-content-id ul.lb-items-ul {
        list-style: none !important;
        text-decoration: none !important;
    }
    
    #lb-modal-id li[class*="item"] {
        display: block;
        text-decoration: none !important;
        color: lightgrey !important;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;
        list-style: none !important;

    }
    
    #lb-modal-id span.lb-item-details {
        display: inline;
        margin: 0px;
        padding: 0px;
        padding-left: 0.5em;
        font-size: smaller;
        color: gray;
        background-color: #333 !important;
        
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
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;
    }

    #lb-modal-id #lb-footer-container-id.lb-footer-container {
        display: flex;
        justify-content: space-between;
      }
    
    /* /////////////////////////////buttons and inputs///////////////////////////// */
    
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

    #lb-modal-id .lb-quantity {
        width: 30px;
    }

    #lb-submit-button-id.lb-submit-button {
        display: none;
        background-color: #696969;
        border: 1px solid;
        border-image: linear-gradient(to right, #3f87a6, #ebf8e1, #f69d3c);
        border-image-slice: 1;
        border-radius: 0;
        color: #fff;
        font-size: 14px;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;
        padding: 10px 10px;
        cursor: pointer;
        text-align: center;
        
    }
    
    #lb-modal-id #lb-submit-button-id.lb-submit-button:hover {
        background-color: #f69d3c;
    }

    #lb-submit-button-id.lb-submit-button.inactive {
        pointer-events: none;
        opacity: 0.5;
      }
      
    
  `;
    document.head.appendChild(style);
    ////////////////////////////////////// END STYLES //////////////////////////////////////
    document.body.appendChild(modal);
    showCursor(modalContent);

    //Text selection and setting up positioning of modal and arrow:
    //if createModal is being passed a selectedText, find the selected text in the window.
    if (selectedText) {
        selection = window.getSelection();
        range = selection.getRangeAt(0);
        console.log("My selection is: " + selection);
    } else {
        console.log("No selectedText passed to createModal, my selection's still: " + selection);
    }
    selectedItem = document.getElementById("selectedItem");
    // set up selectedItem, not using window.getSelection but geting it from service worker

    if (!selectedItem) {
        selectedItem = document.createElement("input");
        selectedItem.type = "hidden";
        selectedItem.id = "selectedItem";
        metadataContainer.appendChild(selectedItem);
        selectedItem.value = selectedItemValue;
        console.log("SelectedItem was NOT found so a new one was just created: " + selectedItem.value);
    } else {
        console.log("selectedItem WAS found, this is the else selectedItem.value: " + selectedItem.value);
    }
    if (selectedText) {
        selectedItemValue = selectedText;
        selectedItem.value = selectedItemValue;
    }
    console.log("My selectedText is: " + selectedText);
    console.log("My selectedItem.value is: " + selectedItem.value);

    //positioning of modal

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

    //closeBtn.innerHTML = "&times;";

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

    ////////////////////////////////// SUBMIT BUTTON /////////////////////////////////////////////
    // //set up to check which metadata values have been changed by user
    // let inputs = metadataContainer.querySelectorAll("input, select");
    // inputs.forEach(input => {
    //     if (input.id !== "selectedItem") {
    //         if (input.type === "checkbox") {
    //             input.defaultValue = input.checked;
    //         } else {
    //             input.defaultValue = input.value;
    //         }
    //     }
    // });

    submitButton.addEventListener("click", function () {
        console.log("//////// Submit Button Clicked");
        let data = selectedItem.value + " ";
        console.log("my data with only selectedItem.value is:" + data);
        let inputs = metadataContainer.querySelectorAll("input, select");
        inputs.forEach(input => {
            if (input.id !== "selectedItem") {
                let name = input.id.replace("lb-", "list-");
                let defaultValue = input.defaultValue;
                let value;
                if (input.type === "checkbox") {
                    value = input.checked ? "on" : "off";
                } else {
                    value = input.value;
                }
                if (value !== defaultValue) {
                    data += `${name}:${value} `;
                }
            }
        });
        console.log("my form data is:" + data);
        chrome.runtime.sendMessage({ message: 'submit_form', formData: data });
    });



    ////////////////////////////// END SUBMIT BUTTON /////////////////////////////////

};
///////////////////////////////////////////// END CREATE MODAL /////////////////////////////////////////////


///////////////////////////////////////////STREAM DATA /////////////////////////////////////////////
const processStreamData = (streamData) => {
    console.log("processStreamData called with streamData: " + streamData);
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
            console.log("data: [DONE] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            hideCursor();
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

            // Call the processModalText function and pass the text to it
            processModalText(lineText);
            processorTextBuffer += lineText;

            //modal positioning
            // storedPositionModal();
        } catch (error) {
            console.error("My Error parsing JSON: " + error);
        }
    });
};
///////////////////////////////////////////END STREAM DATA /////////////////////////////////////////////

/////////////////////////////////////////// PROCESS MODAL TEXT /////////////////////////////////////////////
//this function adds html one line at a time to the modal's <form>
const processModalText = (text) => {
    if (!modal) {
        console.error("The modal element was not found.");
    }
    modalBuffer += text;
    let lines = modalBuffer.split("\n");
    if (lines.length > 1) {
        modalBuffer = lines.pop();
        lines.forEach((line) => {
            if (line.startsWith("list-title:")) {
                console.log("modalContent innerHTML at list-title is: " + modalContent.innerHTML);
                headerContainer.innerHTML = "";
                metadataContainer.innerHTML = "";
                itemsUL.innerHTML = "";

                //create current list title as an h2
                let currentListTitleText = line.replace("list-title:", "");
                let currentListTitle = document.createElement("h2");
                currentListTitle.innerText = currentListTitleText;
                currentListTitle.classList.add("lb-current-list-title");
                headerContainer.appendChild(currentListTitle);
                showCursor(currentListTitle);
                // Add previous/next buttons if they don't already exist
                if (!footerContainer.querySelector(".lb-prev-button")) {
                    let prevButton = document.createElement("button");
                    prevButton.innerText = "<";
                    prevButton.classList.add("lb-prev-button");
                    footerContainer.insertBefore(prevButton, submitButton);
                    showCursor(prevButton);
                }
                if (!footerContainer.querySelector(".lb-next-button")) {
                    let nextButton = document.createElement("button");
                    nextButton.innerText = ">";
                    nextButton.classList.add("lb-next-button");
                    footerContainer.appendChild(nextButton);
                    showCursor(nextButton);
                }
            } else if (line.startsWith("item-")) {
                // create list item
                let itemText = line.replace(/^item-[0-9]+:/, "");
                let itemLI = document.createElement("li");
                itemLI.innerText = itemText;
                let itemNum = line.split(":")[0].replace("item-", "");
                itemLI.classList.add("lb-item-li", "item-" + itemNum);
                itemsUL.appendChild(itemLI);
                showCursor(itemLI);
            } else if (line.startsWith("list-")) {
                let metadataText = line.replace(/^list-/, "");
                let metadata = metadataText.split(":");
                let metadataType = metadata[0];
                let metadataValue = metadata[1];
                console.log("quantity metadataType is: " + metadataType);
                console.log("quantity metadataValue is: " + metadataValue);
                let input;
                let label;
                switch (metadataType) {
                    case "quantity":
                        input = document.createElement("input");
                        input.type = "number";
                        input.value = metadataValue;
                        input.defaultValue = metadataValue;
                        break;
                    case "type":
                        input = document.createElement("select");
                        let options = ["encyclopedic", "evaluative", "top-10", "artistic"];
                        options.forEach((option) => {
                            let optionElement = document.createElement("option");
                            optionElement.value = option;
                            optionElement.text = option;
                            input.appendChild(optionElement);
                            if (option === metadataValue) {
                                optionElement.selected = true;
                                input.defaultValue = option;
                            }
                        });
                        break;
                    case "details":
                        input = document.createElement("input");
                        input.type = "checkbox";
                        input.value = metadataValue;
                        input.defaultValue = metadataValue;
                        if (metadataValue === "on") {
                            input.checked = true;
                        }
                        break;
                    default:
                        input = document.createElement("input");
                        input.type = "text";
                        input.value = metadataValue;
                        input.defaultValue = metadataValue;
                        break;
                }

                input.id = `lb-${metadataType}`;
                input.classList.add(`lb-${metadataType}`);
                label = document.createElement("label");
                label.innerHTML = metadataType;
                label.htmlFor = input.id;

                metadataContainer.appendChild(input);
                metadataContainer.appendChild(label);
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
                //modalContent.innerHTML = modalContent.innerHTML + line + "\n";
            }
        });
    }
    //modal positioning
    storedPositionModal();
};
/////////////////////////////////////////// END PROCESS MODAL TEXT /////////////////////////////////////////////

/////////////////////////////////////////// UPDATE DONE /////////////////////////////////////////////
const updateDone = () => {
    console.log("//////// UpdateDone ran");
    hideCursor();
    let doneText = "\n";
    processModalText(doneText);
    console.log("//////// Update Text is //////" + updateTextBuffer);
    console.log(processorTextBuffer);
    submitButton.style.display = "block";

};

function showCursor(element) {
    let cursor = modal.querySelector('.lb-cursor');
    if (cursor) {
        cursor.remove();
    }
    cursor = document.createElement("span");
    cursor.classList.add("lb-cursor");

    setTimeout(() => {
        if (!element) {
            if (modalContent) {
                modalContent.appendChild(cursor);
                //console.log("modalContent gets cursor");
                cursor.style.height = '20px';
            } else {
                console.log("modalContent is null");
            }
        } else {
            element.appendChild(cursor);
            //console.log("element gets cursor" + element);
            cursor.style.top = `${element.offsetTop + (element.offsetHeight - cursor.offsetHeight) / 2}px`;
            cursor.style.left = `${element.offsetLeft + element.offsetWidth + 20}px`;
        }
    }, 0);

    let counter = 0;
    cursorLoading = setInterval(() => {
        cursor.style.opacity = counter % 2 === 0 ? '0' : '1';
        counter++;
    }, 250);

    setTimeout(hideCursor, 2000);
}

let cursors;
const hideCursor = () => {
    //console.log("hideCursor ran ////////////////////////");
    if (cursorLoading !== null && cursorLoading !== undefined) {
        clearInterval(cursorLoading);
    }
    setTimeout(() => {
        cursors = document.querySelectorAll('.lb-cursor');
        //console.log("cursors: ", cursors)
        cursors.forEach(cursor => {
            cursor.parentNode.removeChild(cursor);
        });
        //console.log("timeout hideCursor ran ////////////////////////");
    }, 0);
}


// function addMetadataButtonListeners() {
//     const metadataButtons = modal.querySelectorAll('.lb-metadata');
//     let selectedText = '';
//     let selectedKey = '';
//     let selectedValue = '';

//     metadataButtons.forEach(button => {
//         button.addEventListener('click', (event) => {
//             selectedText = window.getSelection().toString();
//             selectedKey = event.target.dataset.key;
//             selectedValue = event.target.value;
//         });

//         button.addEventListener("keydown", (event) => {
//             if (event.key === "Enter") {
//                 chrome.runtime.sendMessage({
//                     message: 'send_prompt',
//                     prompt: {
//                         selectionText: selectedText,
//                         key: selectedKey,
//                         value: selectedValue
//                     }
//                 });
//             }
//         });
//     });
// }

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
        const { content } = request;
        if (request.message === 'context-main') {
            content = info.selectionText;
        }
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
                createModal(content);
                sendResponse({ status: 'success' });
                break;
            case 'stream':
                console.log('STREAM message case being handled');
                processStreamData(content);
                sendResponse({ status: 'success' });
                break;
        }
        return true;
    },
);