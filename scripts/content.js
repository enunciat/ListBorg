let modal = null;
let modalContent = null;
let headerContainer = null;
let metadataContainer = null;
let metadataContainerToggle = null;
let metadataToggleButton = null;
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
let detailsButton = null;
let screenshotButton = null;
let flashEffect;
let currentListTitleText;
let currentListTitle;
//let currentListTitleInput;
let titleEdited = false;
let itemEdited = false;
let addItemButton; 


/////////////////////////////////////////// CREATE LIST ITEM /////////////////////////////////////////////
console.log("itemsUL 1: " + itemsUL);
// function for create list items adding li's from either API or from user input:
function createListItem(itemText = "debug") {
    itemsUL = modal.querySelector(".lb-itemsUL");
    console.log("createListItem() sees this itemText: " + itemText);
    let itemLI = document.createElement("li");
    let itemSpan = document.createElement("span");
    itemSpan.classList.add("lb-item-text");
    itemSpan.contentEditable = true;
    itemSpan.innerText = itemText + " ";
    itemLI.appendChild(itemSpan);
    console.log("itemsUL.children: " + itemsUL.children + " itemsUL.children.length: " + itemsUL.children.length);
    let itemNum = itemsUL.children.length + 1;
    itemLI.classList.add("lb-item-li", `item-${itemNum}`);

    let removeButton = document.createElement("button");
    removeButton.classList.add("lb-remove-item-button");
    removeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        itemLI.remove();
        let items = itemsUL.querySelectorAll('li');
        //recalculate item numbers
        for (let i = 0; i < items.length; i++) {
            let oldClass = items[i].classList[1];
            items[i].classList.remove(oldClass);
            items[i].classList.add(`item-${i + 1}`);
        }
    });
    itemLI.appendChild(removeButton);

    // Set up event listener to track whether item has been edited
    itemEdited = false;
    itemSpan.addEventListener("input", () => {
        if (!itemEdited) {
            itemEdited = true;
        }
    });
    // Check for placeholder text when the new item loses focus
    itemSpan.addEventListener("blur", () => {
        if (itemSpan.innerText.trim() === "") {
            itemLI.remove();
        } else if (itemEdited) {
            const details = itemLI.querySelector('.lb-item-details');
            if (details) {
                details.innerText = "";
            }
        }
    });

    console.log("createListItem ran: itemLI: " + itemLI + " itemSpan: " + itemSpan);
    return itemLI;
}

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
                <div class="lb-UL-container" id="lb-UL-container-id"><ul class="lb-itemsUL" id="lb-itemsUL-id"></ul></div>
            <div class="lb-metadata-container"" id="lb-metadata-container-id"></div>
                <div class="lb-footer-container"" id="lb-footer-container-id"></div>
            </div>
    `;

    modalContent = modal.querySelector('.lb-modal-content');
    headerContainer = modalContent.querySelector('.lb-header-container');
    metadataContainer = modalContent.querySelector('.lb-metadata-container');
    footerContainer = modalContent.querySelector('.lb-footer-container');
    closeBtn = modal.querySelector('.lb-modal-close');
    ULContainer = modal.querySelector('.lb-UL-container');
    itemsUL = modalContent.querySelector('.lb-itemsUL');
    submitButton = document.createElement("button");
    submitButton.innerHTML = "Refresh List";
    submitButton.id = "lb-submit-button-id";
    submitButton.classList.add("lb-submit-button");
    footerContainer.appendChild(submitButton);
    // Get the parent modal div
    //modal = document.getElementById('lb-modal-id');



    // create add new item addListItem button:
    addItemButton = document.createElement("button");
    addItemButton.innerText = "Add Item";
    addItemButton.classList.add("lb-add-item-button");
    addItemButton.addEventListener("click", () => {
        itemsUL = document.querySelector(".lb-itemsUL");
        const newItem = createListItem("");
        itemsUL.appendChild(newItem);
        newItem.querySelector(".lb-item-text").focus();
        newItem.querySelector(".lb-item-text").setAttribute("placeholder", "Add a new item...");
    });

    ULContainer.appendChild(addItemButton);


    // Create the flash-effect div
    flashEffect = document.createElement('div');
    flashEffect.id = 'flash-effect-id';
    flashEffect.style.display = 'none';
    flashEffect.style.backgroundColor = 'white';
    flashEffect.style.position = 'absolute';
    flashEffect.style.top = '0';
    flashEffect.style.left = '0';
    flashEffect.style.width = '100%';
    flashEffect.style.height = '100%';

    // Insert the flash-effect div as the first child of the modal div
    modal.insertBefore(flashEffect, modal.firstChild);

    //create metadata container toggle functionality
    metadataContainerToggle = document.getElementById("lb-metadata-container-toggle-id");
    metadataToggleButton = document.getElementById("lb-metadata-toggle-button-id");

    if (!metadataContainerToggle) {
        metadataContainerToggle = document.createElement("div");
        metadataContainerToggle.id = "lb-metadata-container-toggle-id";
        metadataContainerToggle.classList.add("lb-metadata-container-toggle");
    }

    if (!metadataToggleButton) {
        metadataToggleButton = document.createElement("button");
        metadataToggleButton.innerText = "List Settings";
        metadataToggleButton.classList.add("lb-metadata-toggle-button");
        metadataContainer.classList.toggle("hidden");
        metadataToggleButton.classList.add("toggled");
        metadataToggleButton.id = "lb-metadata-toggle-button-id";
    }

    metadataContainerToggle.appendChild(metadataToggleButton);

    if (!metadataContainerToggle.parentNode) {
        modalContent.insertBefore(metadataContainerToggle, metadataContainer);
    }

    metadataToggleButton.addEventListener("click", () => {
        console.log("metadataToggleButton clicked");
        metadataContainer.classList.toggle("hidden");
        metadataToggleButton.classList.toggle("toggled");
        console.log("metadataContainer.classList: " + metadataContainer.classList);
        positionModal();
    });
    //end metadata container toggle functionality

    //// CREATE SCREENSHOT BUTTON ///////////   
    screenshotButton = document.getElementById("lb-screenshot-button-id");

    // create a button element
    if (!screenshotButton) {
        screenshotButton = document.createElement('button');
        screenshotButton.id = "lb-screenshot-button-id";
        screenshotButton.classList.add("lb-screenshot-button");
        //screenshotButton.textContent = 'Take Screenshot';
        screenshotButton.setAttribute('title', 'Screenshot this list');
        screenshotButton.innerHTML = '<img src="' + chrome.runtime.getURL('images/camera_icon.png') + '">';
        screenshotButton.style.display = 'none';
    };

    // add click event listener to the button to capture a PNG snapshot
    screenshotButton.addEventListener('click', () => {
        // display flash-effect div
        flashEffect.style.display = 'block';

        //add screenshot class to change styles just for screen capture
        modalContent.classList.add('screenshot');
        // create a canvas element with the same size as the modal content
        html2canvas(modalContent, {
            backgroundColor: '#f5f5f5',
            removeContainer: true,
            ignoreElements: element => {
                // Return true if the element has the "modal-header" class
                if (element.classList.contains('modal-header') ||
                    element.classList.contains('lb-screenshot-button') ||
                    element.classList.contains('lb-metadata-container-toggle') ||
                    element.classList.contains('lb-metadata-container') ||
                    element.classList.contains('lb-add-item-button') ||
                    element.classList.contains('lb-footer-container')) {
                    return true;
                }
                // Return true if the element is a span with the class 'details-hidden'
                if (element.tagName === 'SPAN' && element.classList.contains('details-hidden')) {
                    return true;
                }
                return false;
            }
        }).then(canvas => {
            // remove "screenshot" class
            modalContent.classList.remove('screenshot');

            // Convert the canvas to a data URL in PNG format
            const dataUrl = canvas.toDataURL('image/png');

            // Create a link element to download the image
            const link = document.createElement('a');
            link.download = 'List Borg.png';
            link.href = dataUrl;

            // Add the link to the document and click it to trigger the download
            document.body.appendChild(link);
            link.click();

            // Clean up the link element
            document.body.removeChild(link);
            flashEffect.style.display = 'none';
        });
    });
    //////////// END SCREENSHOT BUTTON


    ////////////////////////////////////// STYLES //////////////////////////////////////

    const style = document.createElement('style');
    style.textContent = `
    
    /* blue: #4088A6  */
    /* mid: #EBF4DB  */
    /* orange: #F69D3C  */

    /* css reset: */
    html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed, figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary, time, mark, audio, video {
        margin: 0;
        padding: 0;
        border: 0;
        font-size: 100%;
        font: inherit;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;        vertical-align: baseline;
        }

        /*        SCREEENSHOT STYLES      */


        button#lb-screenshot-button-id {
            background-color: transparent;
            margin-left: auto;
            margin-right: 0px;
            margin-bottom: 0px;
            margin-top: 8px;
            padding: 0px;
            border: none;
            width: 40px;
            height: auto;
            
          }
          
          #lb-screenshot-button-id:hover {
            background-color: lightgrey;
          }
          
          #lb-screenshot-button-id img {
            margin: 0px;
            padding: 0px;
            width: 80%;
            height: 80%;
            object-fit: contain;
          }

        /* FLASH EFFECT FOR SCREENSHOT */

        #lb-modal-id > #flash-effect-id {

            z-index: 99999999;
            background-color: red;
            opacity: 1;
            width: 100%;
            height: 100%;
          } 

        /* END FLASH EFFECT FOR SCREENSHOT */



        div#lb-modal-content-id.lb-modal-content.screenshot {
            margin: 20px;
            padding: 0px;
            background-color: #F4F0F0;
            height: auto !important;
        }
        
        div#lb-modal-content-id.screenshot .lb-header-container h2.lb-current-list-title {
            display: flex;
            background-color: transparent !important;
            justify-content: center;
            align-items: center;
            text-align: center;
            color: #333333 !important;
            margin: 10px;
            padding: 0px;
            font-weight: bold;
            font-size: 18px;
          }

          div#lb-modal-content-id.screenshot #lb-UL-container-id.lb-UL-container {
            margin-top: 5px;
        }
    
          div#lb-modal-content-id.screenshot .lb-item-li {
            color: #414141;
            font-size: 12px;
            font-weight: bold;
            margin-left: 15px;
            margin-bottom: 0px !important;
            padding: 0px;
        }
          div#lb-modal-content-id.screenshot .lb-item-text {
            margin-bottom: 0px !important;
            padding: 0px;
        }

        div#lb-modal-content-id.lb-modal-content.screenshot span.lb-item-details {
            display: block;
            font-size: 10px;
            font-weight: normal;
            margin: 0px 10px 3px 10px;
            padding: 0px;
            max-height: 200px;
            font-color: #717171;
          }

          

        /*        END SCREEENSHOT STYLES      */

    /* my styles: */

    #lb-modal-id.lb-modal {
        display: none;
        position: fixed;
        top: 100%;
        left: 100%;
        margin: 0;
        width: 300px;
        overflow-x: hidden; 
        background-color: #333;
        border: 1px solid;
        border-image: linear-gradient(to right, #3f87a6, #ebf8e1, #f69d3c);
        border-image-slice: 1;
        border-radius: 0;
        padding: 10px;
        
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
        top: 0;
        right: 0;
        width: 25px;
        height: 25px;
        text-align: center;
        background-color: #BB7329;
        /*border-radius: 50%; */
        cursor: pointer;
        color: lightgrey;
       
        display: flex;
        align-items: center;
        z-index: 2147483646;

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
    
    #lb-modal-id div.lb-header-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-start;
        margin-top: 20px;
        min-height: 50px;
    }
    

    #lb-modal-id div#lb-header-container-id h2.lb-current-list-title {
        color: lightgrey;
        background-color: #333333;
        text-align: center;
        font-size: large;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-basis: 100%;
        margin: 0 8px;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;
        box-sizing: border-box;
        border: 2px solid transparent; /* add a transparent border */
        padding: 5px;
    }

    #lb-modal-id div#lb-header-container-id h2.lb-current-list-title:not(:focus):hover {
        border: 1px solid white;
        border-radius: 20px;
    }
    #lb-modal-id div#lb-header-container-id h2.lb-current-list-title:focus {
        border: 2px solid white;
        border-radius: 20px;
    }

    #lb-modal-id #lb-UL-container-id.lb-UL-container {
        padding: 0px;
        padding-bottom: 15px;
        margin-left: 15px;
        margin-top: -10px;
    }

    #lb-modal-content-id ul.lb-items-ul {
        list-style: none !important;
        text-decoration: none !important;
        background-color: red;

    }
    
    #lb-modal-id li[class*="item"] {
        display: flex;
        align-items: flex-start;
        flex-direction: column;
        text-decoration: none !important;
        color: lightgrey;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;
        list-style: none !important;
        position: relative;
        margin-bottom: 5px;
    }
    
    #lb-modal-id span.lb-item-text {
        flex: 1;
        box-sizing: border-box;
        margin-bottom: 6px;
        padding: 0px 4px 0px 4px;
    }

    #lb-modal-id li.lb-item-li:hover .lb-item-text:not(:focus) {
        outline: 1.5px solid lightgrey;
        outline-offset: 4px;
        border-radius: 10px;
    }

    #lb-modal-id li .lb-item-text:focus {
        outline: 2px solid white;
        outline-offset: 4px;
        border-radius: 10px;

    }
    
    #lb-modal-id span.lb-item-details {
        margin: 0 20px 0 15px;
        font-size: smaller;
        color: gray;
        max-height: 100px;
      }  
      
      #lb-modal-id span.lb-item-details.details-hidden {
        display: none;
      }

   /* remove x "x" button for items */
      
        #lb-modal-id button.lb-remove-item-button {
          display: flex;
          align-self: center !important;
          position: absolute;
          right: 0px;
          top: 0px;
         
          padding: 0.5em 0em 0.5em 0.5em;
          font-size: 20px;
          line-height: 1;
          border: none;
          background: none;
          color: #c1c1c1;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.1s ease-in-out;

        } 
        
        #lb-modal-id button.lb-remove-item-button::before {
          content: "\\00D7  ";
          font-size: 1.2em;
        }
  
        #lb-modal-id .lb-item-li:hover button.lb-remove-item-button {
          opacity: 1; /* show the button on hover */
        }
        
        /* add items buttons */

        #lb-modal-id button.lb-add-item-button {
            display: none;
            align-items: center;
            margin-top: 15px;
            background-color: transparent;
            border-left: 1px solid lightgrey;
            border-bottom: 1px solid lightgrey;
            border-right: 1px solid lightgrey;
            border-radius: 30px;
            cursor: pointer;
            background-color: transparent;
            color: lightgrey;
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;
            border: 1px solid white;
            border-radius: 20px;
            padding: 2px 15px;
            margin-left: 3px;
        }

        #lb-modal-id button.lb-add-item-button::before {
            content: "+ ";
            color: lightgrey;
            font-size: 1.5em;
            margin-right: 7px;
        }
        #lb-modal-id button.lb-add-item-button:hover{
            background-color: #4088A6;
        }
      
    #lb-modal-id #lb-footer-container-id.lb-footer-container {
            display: flex;
            justify-content: center;
        }

        #lb-modal-id #lb-footer-container-id.lb-footer-container:only-child {
            justify-content: center;
        }

                                        /*  BUTTONS  */
    
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

    /*  METADATA TOGGLE  */

    #lb-metadata-container-toggle-id.lb-metadata-container-toggle {
        display: none;
        justify-content: flex-end;
        align-items: center;
        margin-bottom: 10px;
      }

    #lb-metadata-toggle-button-id.lb-metadata-toggle-button
    {
        background-color: #333333;
        border: none;
        /* border: 2px;
        border-style: solid;
        border-radius: 5px;
        border-color: lightgrey;
        box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); */
        color: lightgrey;
        cursor: pointer;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;
        font-size:  small;
        padding: 8px 10px;
        transition: all 0.2s ease;
        content: " "; /* add some content to the button */

        border-top: 1px solid grey;
        border-left: 1px solid grey;
        border-right: 1px solid grey;
        border-bottom: none;
        border-radius: 5px 5px 0 0;

        }
        
        #lb-metadata-toggle-button-id.lb-metadata-toggle-button:hover {
        background-color: #4188A6;
        color: #fff;
        }

        #lb-metadata-toggle-button-id.lb-metadata-toggle-button:after {
        content: "\\25BC";
        font-size: 1.2em;
        margin-left: 10px;
        transform: rotate(0deg);
        transition: transform 0.2s ease;
        }
        
        #lb-metadata-toggle-button-id.lb-metadata-toggle-button.toggled:after {
        content: "\\25B6";
        }


      /*  METADATA  */

.lb-modal div#lb-metadata-container-id.lb-metadata-container.hidden {
display: none;
height: 0;
grid-gap: 0;
margin: 0;
transition: height 0.2s;
}

.lb-modal div#lb-metadata-container-id.lb-metadata-container input,
.lb-modal div#lb-metadata-container-id.lb-metadata-container select {
  width: calc(100% - 10px); /* Set the width of the inputs to 100% of the available space minus the grid gap */
}
      

.lb-modal div#lb-metadata-container-id.lb-metadata-container {
  display: grid;
  grid-template-columns: .4fr .8fr 1fr;
  grid-template-rows: auto;
  grid-gap: 5px;
  margin: 10px 0;
}

.lb-modal div#lb-metadata-container-id.lb-metadata-container label {
  font-size: 12px;
  color: lightgrey;
  margin-bottom: 0px;
  text-transform: capitalize;
}

.lb-modal div#lb-metadata-container-id.lb-metadata-container input,
.lb-modal div#lb-metadata-container-id.lb-metadata-container select {
  padding: 5px;
  border: none;
  border-radius: 0px;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;
  color: lightgrey;
}

.lb-modal div#lb-metadata-container-id.lb-metadata-container label[for="lb-quantity"] {
  grid-row: 1;
  grid-column: 1;

}

.lb-modal div#lb-metadata-container-id.lb-metadata-container input#lb-quantity {
  grid-row: 2;
  grid-column: 1;

}

.lb-modal div#lb-metadata-container-id.lb-metadata-container label[for="lb-order"] {
  grid-row: 1;
  grid-column: 2;
}

.lb-modal div#lb-metadata-container-id.lb-metadata-container input#lb-order {
  grid-row: 2;
  grid-column: 2;
}

.lb-modal div#lb-metadata-container-id.lb-metadata-container label[for="lb-type"] {
  grid-row: 1;
  grid-column: 3;
}

.lb-modal div#lb-metadata-container-id.lb-metadata-container select#lb-type {
  grid-row: 2;
  grid-column: 3;
}

.lb-modal div#lb-metadata-container-id.lb-metadata-container label[for="lb-category"] {
    display: none;
   }
   
   .lb-modal div#lb-metadata-container-id.lb-metadata-container input#lb-category {
   display: none;
   }

.lb-modal div#lb-metadata-container-id.lb-metadata-container label[for="lb-notes"] {
  grid-row: 3;
  grid-column: 1 / span 2;
  height: 10px;
}

.lb-modal div#lb-metadata-container-id.lb-metadata-container input#lb-notes {
  grid-row: 4;
  grid-column: 1 / span 2;
}

.lb-modal div#lb-metadata-container-id.lb-metadata-container label[for="lb-sources"] {
  display: none; 
  grid-row: 5;
  grid-column: 1 / span 3; /* span 3 columns */
}

.lb-modal div#lb-metadata-container-id.lb-metadata-container input#lb-sources {
  display: none;
  grid-row: 6;
  grid-column: 1 / span 3; /* span 3 columns */
}

      /* LIST DETAILS CHECKBOX  */

      label.lb-details-label {
        grid-area: 3 / 3 / 4 / 4;
        height: 10px;
        padding: 5px;
        border: none;
        border-radius: 0px;
        font-size: small;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif, Arial;
        color: lightgrey;
      }
      
      .lb-modal input#lb-details.lb-details[type="checkbox"] {
        grid-area: 4 / 3 / 5 / 4;
        width: 36px;
        height: 18px;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background-color: #ccc;
        border-radius: 30px;
        outline: none;
        transition: background-color .15s;
        position: relative;
        justify-self: center;
      }
      
      .lb-modal input#lb-details.lb-details[type="checkbox"]::before {
        position: absolute;
        content: '';
        width: 14px;
        height: 14px;
        border-radius: 50%;
        top: 10%;
        left: 10%;
        background-color: #fff;
        transition: transform .15s;
      }
      
      .lb-modal input#lb-details.lb-details[type="checkbox"]:checked {
        background-color: #4188A6;
      }
      
      .lb-modal input#lb-details.lb-details[type="checkbox"]:checked::before {
        transform: translateX(100%);
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
    //  PROMPT:  create userPrompt and submit it (uses some form langauge but not a form)
    submitButton.addEventListener("click", function () {

        console.log("Prompt 1: Submit Button Clicked");
        let userPrompt = selectedItem.value + " ";

        // add list-title if it has been edited
        if (titleEdited) {
            console.log("Prompt 2: if titleEdited ran!");
            userPrompt += "list-title:" + currentListTitle.textContent.trim() + " ";
        }

        // add all items to userPrompt if any items have been added, removed, or edited
        // items should be in the plain text format: item-2:Armenia item-5:Austria
        if (itemEdited) {
            console.log("Prompt 3: if itemEdited ran!");
            let allItems = "";
            itemsUL.querySelectorAll(".lb-item-li .lb-item-text").forEach(item => {
                if (item.textContent.trim() !== "") {
                    let itemDashNum = item.parentElement.classList[1];
                    allItems += `${itemDashNum}:${item.textContent.trim()} `;
                }
            });
            userPrompt += allItems;
        }
        // add inputs to userPrompt
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
                    userPrompt += `${name}:${value} `;
                    console.log("Prompt 4: inputs were edited ran!");
                }
            }
        });
        console.log("Prompt 5 FINAL: form data is:" + userPrompt);
        chrome.runtime.sendMessage({ message: 'submit_form', formData: userPrompt });
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
                // Check if "list-title:" is not at the start of the line
                if (line.indexOf("list-title:") > 0) {
                    // Update the line by moving "list-title:" to the start and removing anything before it
                    line = "list-title:" + line.substring(line.indexOf("list-title:") + "list-title:".length);
                    console.log("list-title was MID-LINE! the line is now: " + line);
                }
                //create current list title as an h2 and an editable input for prompt/form submission
                currentListTitleText = line.replace("list-title:", "");
                currentListTitle = document.createElement("h2");
                currentListTitle.innerHTML = currentListTitleText;
                currentListTitle.classList.add("lb-current-list-title");
                currentListTitle.setAttribute("data-original-title", currentListTitleText);
                currentListTitle.setAttribute("contenteditable", "true");
                headerContainer.appendChild(currentListTitle);

                // set up event listener to track whether title has been edited
                titleEdited = false;
                currentListTitle.addEventListener('input', () => {
                    if (!titleEdited) {
                        titleEdited = true;
                    }
                });

                showCursor(currentListTitle);

                //commented out creation of prev/next buttons
                // Add previous/next buttons if they don't already exist
                // if (!footerContainer.querySelector(".lb-prev-button")) {
                //     let prevButton = document.createElement("button");
                //     prevButton.innerText = "<";
                //     prevButton.classList.add("lb-prev-button");
                //     footerContainer.insertBefore(prevButton, submitButton);
                // }
                // if (!footerContainer.querySelector(".lb-next-button")) {
                //     let nextButton = document.createElement("button");
                //     nextButton.innerText = ">";
                //     nextButton.classList.add("lb-next-button");
                //     footerContainer.appendChild(nextButton);
                // }
            } else if (line.startsWith("item-")) {
                // create list item
                let itemText = line.replace(/^item-[0-9]+:/, "");
                console.log("about to run createlistitem.... itemText is: " + itemText);
                let itemLI = createListItem(itemText);
                //let itemNum = line.split(":")[0].replace("item-", "");
                //itemLI.classList.add("lb-item-li", "item-" + itemNum);
                console.log("itemLI is: " + itemLI + itemLI.textContent);
                itemsUL.appendChild(itemLI);
                console.log("itemsUL is: " + itemsUL);
                showCursor(itemLI);
            } else if (line.startsWith("list-")) {
                // Check if there are any child elements in metadataContainer
                if (metadataContainer.childElementCount > 0) {
                    // Show metadataToggleButton
                    metadataContainerToggle.style.display = 'flex';
                } else {
                    // Hide metadataToggleButton
                    metadataContainerToggle.style.display = 'none';
                }
                // metadata fields functionality
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
                        input.id = `lb-${metadataType}`;
                        input.classList.add(`lb-${metadataType}`);
                        label = document.createElement("label");
                        label.innerHTML = metadataType;
                        label.htmlFor = input.id;
                        metadataContainer.appendChild(input);
                        metadataContainer.appendChild(label);
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
                            input.id = `lb-${metadataType}`;
                            input.classList.add(`lb-${metadataType}`);
                            label = document.createElement("label");
                            label.innerHTML = metadataType;
                            label.htmlFor = input.id;
                            metadataContainer.appendChild(input);
                            metadataContainer.appendChild(label);
                        });
                        break;
                    case "details":
                        detailsButton = metadataContainerToggle.querySelector('input.lb-details');
                        if (!detailsButton) {
                            input = document.createElement("input");
                            input.type = "checkbox";
                            input.value = metadataValue;
                            input.defaultValue = metadataValue;
                            if (metadataValue === "on") {
                                input.checked = true;
                            }
                            input.id = `lb-${metadataType}`;
                            input.classList.add(`lb-${metadataType}`);
                            label = document.createElement("label");
                            label.innerHTML = "Item Details:";
                            label.htmlFor = input.id;
                            label.classList.add("lb-details-label");
                            console.log("trying to create a details button");
                            console.log("trying to see metadataContainerToggle: " + metadataContainerToggle);
                            metadataContainer.appendChild(label);
                            metadataContainer.appendChild(input);
                            detailsButton = metadataContainer.querySelector('.lb-details');
                            console.log("trying succeeded, detailsButton is: " + detailsButton);
                        }

                        if (metadataValue === "on") {
                            detailsButton.checked = true;
                        } else {
                            detailsButton.checked = false;
                        }
                        break;
                    default:
                        input = document.createElement("input");
                        input.type = "text";
                        input.value = metadataValue;
                        input.defaultValue = metadataValue;
                        input.id = `lb-${metadataType}`;
                        input.classList.add(`lb-${metadataType}`);
                        label = document.createElement("label");
                        label.innerHTML = metadataType;
                        label.htmlFor = input.id;
                        metadataContainer.appendChild(input);
                        metadataContainer.appendChild(label);
                        break;
                }

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
    addItemButton.style.display = "flex";
    let doneText = "\n";
    processModalText(doneText);
    console.log("//////// Update Text is //////" + updateTextBuffer);
    console.log(processorTextBuffer);
    submitButton.style.display = "block";

    // Append and show screenshot button
    headerContainer.appendChild(screenshotButton);
    screenshotButton.style.display = 'block';

    if (detailsButton) {
        let detailsSpans = document.querySelectorAll('.lb-item-details');
        detailsButton.addEventListener('click', function () {

            detailsSpans.forEach(function (detail) {
                console.log("detailsSpans is being toggled : " + detail);
                detail.classList.toggle('details-hidden');
            });
        });
    }
    setTimeout(storedPositionModal, 1000);
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