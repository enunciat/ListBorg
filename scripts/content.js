
let modal = null;
let modalContent = null;
let modalRect = null;
let storedPositionModal;
let modalIsLeft = false;



// define colors:
const red = '#AA0000';
const gold = '#DEB60D';

//loading animation:
function showListLoader() {
    const listLoader = document.querySelector('.list-loading');
    listLoader ?
        listLoader.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    border: 4px solid #f3f3f3; /* Light grey */
    border-top: 4px solid #3498db; /* Blue */
    border-radius: 50%;
    width: 20px;
    height: 20px;
    animation: spin 0.8s linear infinite;
    ` : null;
}

function hideListLoader() {
    const listLoader = document.querySelector('.list-loading');
    listLoader ?
        listLoader.style.display = 'none' : null;
}

///////////////////////////////////////////// CREATE MODAL /////////////////////////////////////////////
const createModal = () => {
    if (modal) {
        modal.parentNode.removeChild(modal);
      }
    //create modal div:
    modal = document.createElement("div");
    modal.classList.add("listModal");

    //Text selection and setting up positioning of modal and arrow:
    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    let rect = range.getBoundingClientRect();
    let vw = Math.round(rect.left / window.innerWidth * 100);
    let vh = Math.round(rect.top / window.innerHeight * 100);


    modal.innerHTML = `
    <div class="modalClose">&times;</div>
    <div class="list-loading"></div>
    <div class="modal-content">
    </div>`;

    // Append the modal to the page
    document.body.appendChild(modal);
    showListLoader();

    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 50%;
        left: 50%;
        margin: 0;
        width: 300px; /* adjust as needed */
        background-color: white;
        border: 1px solid #ccc;
        padding: 20px;
        z-index: 2147483645;
        border-radius: 10px;
        color: blue;
        transition: all 0.2s ease-out;
        `;


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
        let arrow = document.querySelector(".modalArrow");
        if (!arrow) {
            // Create the arrow
            arrow = document.createElement("div");
            arrow.className = "modalArrow";
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

    // Add styles to the modal-content using cssText
    modalContent = modal.querySelector('.modal-content');
    modalContent.style.cssText = `
       overflow: auto; /* allows for scrolling if the list is long */
       max-height: 80vh; /* limits the height of the modal-content */
    `;

    // closeBtn
    const closeBtn = document.querySelector('.modalClose');

    closeBtn.style.cssText = `
   position: absolute;
   top: -10px;
   right: -12px;
   width: 30px;
   height: 30px;
   text-align: center;
   line-height: 30px;
   font-size: 25px;
   color: #fff;
   background-color: red;
   border-radius: 50%;
   cursor: pointer;
   z-index: 2147483646;
   cursor: 'pointer';
`;

    modalCloseListener = (event) => {
        if (event.target.classList.contains('modalClose') ||
            (modal && modal.contains && !modal.contains(event.target))) {
            console.log("modalCloseListener called");
            modal.parentNode.removeChild(modal);
            modal = null;
            chrome.runtime.sendMessage({ message: 'cancel_generate' });

        }
    };
    document.addEventListener("click", modalCloseListener);

    ///////////positioning of modal:
    modalRect = modal.getBoundingClientRect();

};

///////////////////////////////////////////STREAM VERSION: UPDATE MODAL /////////////////////////////////////////////

const updateModalStream = (streamData) => {
    console.log("updateModalStream called with streamData: " + streamData);

    // this streamData sometimes has multiple events (chunks) in one message, so we need to handle this properly
    const chunks = streamData.split('data: ');

    chunks.forEach(chunk => {
        //sometimes they're empty  
        if (!chunk.trim()) {
            return;
        }
        //console.log("the CHUNK is the following: " + chunk);
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
            if (lineText.indexOf('\n') !== -1) {
                lineText = lineText.replace(/\n/g, '<br>');
            }

            // your code to update the modal with the data
            if (!modal) {
                console.error("The modal element was not found.");
                return;
            }
            // update the innerHTML with the AI response
            modalContent.innerHTML = modalContent.innerHTML + lineText;

            //modal positioning
            storedPositionModal();
        } catch (error) {
            console.error("My Error parsing JSON: " + error);
        }
    });
};

const updateDone = () => {
    hideListLoader();
};

/////////////////////////////////////////// UPDATE MODAL /////////////////////////////////////////////
const updateModal = (content) => {
    if (!modal) return;
    hideListLoader();
    const { firstLine, lineListItems } = parseList(content);
    modal.innerHTML = `<div class="modal-content">
    <span class="modalClose">&times;</span>
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

    modal.querySelector('.modal-content h2').style.cssText = `
   font-size: 1rem;
   margin-top: 0;
   text-align: center;
   color: #666;
   width: 80%;
`;
    modal.querySelector('.modal-content ul').style.cssText = `
   list-style: none;
   margin: 0;
   padding: 0;
`;

    const li = modal.querySelectorAll('.modal-content li');
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
    const arrowButtons = modal.querySelectorAll('.modal-content .arrow-btn');
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
    let modal = document.querySelector(".listModal");
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
            case 'modal':
                console.log("MODAL message case being handled");
                updateModal(content);
                sendResponse({ status: 'success' });
                break;
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