
let modal = null;
let modalContent = null;
let headerContainer = null;
let modalRect = null;
let storedPositionModal;
let modalIsLeft = false;

let updateTextBuffer = '';
let processorTextBuffer = '';

let asSidebar = false;

//cursor for when list is loading:
let cursorLoading = null;

function showCursor(element) {
    const existingCursor = document.querySelector('.lb-cursor');
    if (existingCursor) {
        existingCursor.remove();
    }
    let cursor = document.createElement("span");
    cursor.classList.add("lb-cursor");
    //make it the same height as the element:
    if (!element) {
        return;
    }

    setTimeout(() => {
        cursor.style.top = `${element.offsetTop + (element.offsetHeight - cursor.offsetHeight) / 2}px`;
        cursor.style.left = `${element.offsetLeft + element.offsetWidth + 20}px`;
    
    }, 0);

    let counter = 0;
    cursorLoading = setInterval(() => {
        cursor.style.opacity = counter % 2 === 0 ? '0' : '1';
        counter++;
    }, 500);
    if (element) {
        element.appendChild(cursor);
    } else if (modalContent) {
        modalContent.appendChild(cursor);
        cursor.style.height = '20px';
    }
}

function hideCursor() {
    clearInterval(cursorLoading);
    const cursor = document.querySelector('.lb-cursor');
    cursor ?
        cursor.style.display = 'none' : null;
}

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

    //Text selection and setting up positioning of modal and arrow:
    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    let rect = range.getBoundingClientRect();
    let vw = Math.round(rect.left / window.innerWidth * 100);
    let vh = Math.round(rect.top / window.innerHeight * 100);


    modal.innerHTML = `
    <div class="lb-modal-close"></div>
    <div class="lb-modal-content"><div class="lb-header-container"></div></div>`;

    // Append the modal to the page
    document.body.appendChild(modal);
    showCursor(modalContent);

    // modal.style.cssText = `
    // display: none;
    // position: fixed;
    // top: 100%;
    // left: 100%;
    // margin: 0;
    // width: 300px; /* adjust as needed */
    // background-color: #333;
    // border: 1px solid;
    // border-image: linear-gradient(to right, #3f87a6, #ebf8e1, #f69d3c);
    // border-image-slice: 1;
    // padding: 20px;
    // z-index: 2147483645;
    // border-radius: 10px;
    // color: #fff;
    // transition: all 0.2s ease-out;
    // `;


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

        // Check if the arrow already exists
        let arrow = document.querySelector(".lb-modal-arrow");
        if (!arrow) {
            // Create the arrow
            arrow = document.createElement("div");
            arrow.className = "lb-modal-arrow";
            arrow.style.position = "fixed";
            arrow.style.display = "none";
            arrow.style.width = "20px";
            arrow.style.height = "20px";
            arrow.style.transform = "rotate(45deg)";
            arrow.style.backgroundColor = "white";
            modal.appendChild(arrow);
        }
        // Update the position of the arrow
        if (modalIsLeft) {
            arrow.style.left = `${rect.left - arrow.offsetWidth - 10}px`;
        } else {
            arrow.style.left = `${rect.left + rect.width + 10}px`;
        }
        arrow.style.top = `${rect.top + (rect.height / 2) - 10}px`;

    };
    storedPositionModal = positionModal;
    storedPositionModal();

    modalContent = modal.querySelector('.lb-modal-content');
    headerContainer = modalContent.querySelector('.lb-header-container');


    // closeBtn
    const closeBtn = document.querySelector('.lb-modal-close');
    closeBtn.innerHTML = "&times;";

    modalCloseListener = (event) => {
        if (event.target.classList.contains('lb-modal-close') ||
            (modal && modal.contains && !modal.contains(event.target))) {
            if (modal) {
                modal.parentNode.removeChild(modal);
                modal = null;
                chrome.runtime.sendMessage({ message: 'cancel_generate' });
            }
        }
    };
    document.addEventListener("click", modalCloseListener);

    ///////////positioning of modal:
    modalRect = modal.getBoundingClientRect();
};

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

            // Replace "/n" with "<br>" in the text
            // if (lineText.indexOf('\n') !== -1) {
            //     lineText = lineText.replace(/\n/g, '<br>');
            // }


            // // your code to update the modal with the data
            // if (!modal) {
            //     console.error("The modal element was not found.");
            //     return;
            // }


            // // update the innerHTML with the AI response
            // modalContent.innerHTML = modalContent.innerHTML + lineText;

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

//just for an alert
let firstTime = true;

///////////////////////////////////////////PROCESSOR VERSION: 3+1 TYPES /////////////////////////////////////////////
let modalBuffer = "";
let itemsUL;
const updateModalProcessor = (text) => {
    if (!modal) {
        console.error("The modal element was not found.");
        return;
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
                itemsUL = document.querySelector(".lb-items-ul");
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
                let button = document.createElement("button");
                button.innerText = metadata[0];
                let buttonClass = "lb-metadata-" + metadata[0];
                let buttonVariable = "metadataButton" + metadata[0];
                button.classList.add("lb-metadata", buttonClass);
                window[buttonVariable] = button;
                button.dataset[metadata[0]] = metadata[1];
                modalContent.appendChild(button);
                showCursor(button);
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
    //modal positioning
    storedPositionModal();
};







// let modalBuffer = "";
// let headerCreated = false;
// const updateModalProcessor = (text) => {
//     if (!modal) {
//         console.error("The modal element was not found.");
//         return;
//     }
//     modalBuffer += text;
//     let lines = modalBuffer.split("\n");
//     if (lines.length > 1) {
//         modalBuffer = lines.pop();
//         lines.forEach((line) => {
//             if (line.startsWith("list-title:")) {
//                 if (!headerCreated) {
//                     //create current list title as an h2
//                     let currentListTitleText = line.replace("list-title:", "");
//                     let currentListTitle = document.createElement("h2");
//                     currentListTitle.innerText = currentListTitleText;
//                     currentListTitle.classList.add("lb-current-list-title");
//                     // create prev/next buttons
//                     let headerContainer = document.createElement("div");
//                     headerContainer.classList.add("lb-header-container");
//                     let prevButton = document.createElement("button");
//                     prevButton.innerText = "<";
//                     prevButton.classList.add("lb-prev-button");
//                     headerContainer.appendChild(prevButton);
//                     headerContainer.appendChild(currentListTitle);
//                     let nextButton = document.createElement("button");
//                     nextButton.innerText = ">";
//                     nextButton.classList.add("lb-next-button");
//                     headerContainer.appendChild(nextButton);
//                     modalContent.appendChild(headerContainer);
//                     headerCreated = true;
//                 }
//             } else {
//                 modalContent.innerHTML = modalContent.innerHTML + line + "\n";
//             }
//         });
//     }
//     //modal positioning
//     storedPositionModal();
// };



//this works to display the stream data in the modal but it cuts off the <div part of each line:
// const updateModalProcessor = (text) => {
//     // your code to process the text and update the modal with the data
//     if (!modal) {
//         console.error("The modal element was not found.");
//         return;
//     }

//     // update the innerHTML with the AI response
//     modalContent.innerHTML = modalContent.innerHTML + text;

//     //reminder of modal.innerHTML:
//     // modal.innerHTML = `
//     // <div class="modalClose"></div>
//     // <div class="modal-content"></div><span class="list-cursor"></span>`;

//     //modal positioning
//     storedPositionModal();
// };



// the following doesn't work to parse stream events into JSON:
/////22222222222222222222/////////////STREAM VERSION: UPDATE MODAL /////////////////////////////////////////////
// const updateModalStream = (streamData) => {
//     console.log("updateModalStream called with streamData: " + streamData);

//     let jsonString = '';
//     let startIndex = 0;
//     let endIndex = 0;

//     const chunks = streamData.split('data: ');

//     chunks.forEach(chunk => {
//         if (!chunk.trim()) {
//             return;
//         }

//         for (let i = 0; i < chunk.length; i++) {
//             if (chunk[i] === '{') {
//                 startIndex = i;
//             } else if (chunk[i] === '}') {
//                 endIndex = i + 1;
//                 jsonString = chunk.substring(startIndex, endIndex);

//                 try {
//                     let data = JSON.parse(jsonString);
//                     //console.log("the DATA is the following: " + data);

//                     let items = data.items;
//                     let itemList = '';

//                     // Create a list of items
//                     items.forEach(item => {
//                         itemList += '<li>' + item.item + ': ' + item.details + '</li>';
//                     });

//                     // your code to update the modal with the data
//                     if (!modal) {
//                         console.error("The modal element was not found.");
//                         return;
//                     }

//                     // update the innerHTML with the AI response
//                     modalContent.innerHTML = modalContent.innerHTML + '<ul>' + itemList + '</ul>';

//                     //modal positioning
//                     storedPositionModal();
//                 } catch (error) {
//                     console.error("My Error parsing JSON: " + error);
//                 }

//                 // Reset the variables for the next JSON string
//                 jsonString = '';
//                 startIndex = 0;
//                 endIndex = 0;
//             }
//         }
//     });
// };

const updateDone = () => {
    let doneText = "\n";
    updateModalProcessor(doneText);
    hideCursor();
    console.log("//////// Update Text is //////" + updateTextBuffer);
    console.log(processorTextBuffer);
};

/////////////////////////////////////////// UPDATE MODAL /////////////////////////////////////////////
const updateModal = (content) => {
    if (!modal) return;
    hideCursor();
    const { firstLine, lineListItems } = parseList(content);
    modal.innerHTML = `<div class="modal-content">
    <span class="modal-close">&times;</span>
    <div class="list-loading"></div>
    <h2>${firstLine}</h2>
    <ul>
    ${lineListItems}
    </ul>
    </div>`;

    ///////////Modal (Update) Positioning//////////////////
    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    let rect = range.getBoundingClientRect();
    let vw = Math.round(rect.left / window.innerWidth * 100);
    let vh = Math.round(rect.top / window.innerHeight * 100);
    console.log("before UPDATE off-window checks" + vw + "vw, " + vh + "vh");
    //off-window checks:
    // if (vh + modal.offsetHeight > 100) {
    //     vh = 100 - modal.offsetHeight;
    // }
    // if (vw + modal.offsetWidth > 100) {
    //     vw = 100 - modal.offsetWidth;
    // }

    console.log("AFTER UPDATE off-window checks: " + vw + "vw, " + vh + "vh");
    //end off-window checks////////

    modal.style.cssText = `
      display: block;
      position: fixed;
      top: ${vh}vh;
      left: ${vw}vw;
      margin: 0;
      width: 300px; /* adjust as needed */
      background-color: white;
      border: 1px solid #ccc;
      box-shadow: 2px 2px 10px rgba(0,0,0,0.3);
      padding: 10px;

      z-index: 2147483645;
      border-radius: 10px;
      `;

    ///////////end modal positioning//////////////////

    modal.querySelector('.lb-modal-content h2').style.cssText = `
   font-size: 1rem;
   margin-top: 0;
   text-align: center;
   color: #666;
   width: 80%;
`;
    modal.querySelector('.lb-modal-content ul').style.cssText = `
   list-style: none;
   margin: 0;
   padding: 0;
`;

    const li = modal.querySelectorAll('.lb-modal-content li');
    if (li.length > 0) {
        li.forEach(el => {
            el.style.cssText = `
   padding: 5px 0;
   font-size: .7rem;
   color: #666;
   transition: background-color 0.2s ease-in-out;
   user-select: none;
`;
            el.addEventListener('mouseover', () => {
                el.style.backgroundColor = red;
            });
            el.addEventListener('mouseout', () => {
                el.style.backgroundColor = '';
            });
            el.addEventListener('click', (event) => {
                let item = event.target.textContent;
                if (item.indexOf("(") !== -1) {
                    item = item.substring(0, item.indexOf("("));
                }

                console.log("before replace, the item is: " + item);
                // check for numbers and period before the first word
                item = item.replace(/^\s*\d*\.?\s*/, "");
                console.log("after replace, the item is: " + item);

                // console log what type item is:
                console.log("item is typeof: " + typeof item);
                insert(item);
            });
        });
    }

    // the arrow buttons to generate new lists and scroll between them
    // ARROW CONTENT NOT CURRENTLY ADDED
    const arrowButtons = modal.querySelectorAll('.lb-modal-content .lb-arrow-btn');
    if (arrowButtons.length) {
        arrowButtons.forEach(btn => {
            btn.style.cssText = `
            color: #666;
            font-size: 1rem;
            cursor: pointer;
            padding: 0 10px;
        `;
            btn.addEventListener('mouseover', () => {
                btn.style.color = red;
            });
            btn.addEventListener('mouseout', () => {
                btn.style.color = '#666';
            });
        });
    }

    // Get the close button
    //const closeBtn = document.querySelector('.close');
}


const insert = (content) => {

    //remove leading and trailing whitespace:
    content = content.trim();

    // Find Calmly editor input section
    const elements = document.getElementsByClassName('droid');
    console.log("elements: ", elements);

    if (elements.length === 0) {
        return;
    }

    const element = elements[0];

    // Check if there is a selected text
    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
        console.log("I returned early from selection because there was no rangeCount");
        return;
    }

    // Replace selected text with new content
    const range = selection.getRangeAt(0);
    console.log("before deletion, the range is: ", range);

    //BuildSp used delete Contents, but extractContents is another possibility
    range.deleteContents();

    //extractContents is another possibility 
    //const extractedContent = range.extractContents();

    const textNode = document.createTextNode(content);
    range.insertNode(textNode);


    console.log("after inserting, the range is: ", range);
    console.log("insert sees textNode as: ", textNode);
    console.log("textNode is typeof: " + typeof textNode);
    console.log("insert sees content as: ", content);
    console.log("content is typeof: " + typeof content);

    // remove the modal after inserting new text:
    let modal = document.querySelector(".list-modal");
    modal.style.display = 'none';
    createModalCloseListener();
    return true;
};



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


// create a function to parse lines into li's from baseCompletion message:

//for stream attempt I commented parseList out Feb 4 2023:
// const parseList = (content) => {
//     const lines = content.split('\n');
//     const firstLine = lines.shift();
//     const lineListItems = (lines) => {
//         let list = '';
//         lines.forEach(line => {
//             list += `<li>${line}</li>`;
//         });
//         return list;
//     };
//     return { firstLine, lineListItems: lineListItems(lines) };
// };