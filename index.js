//uses OpenAI API
const checkForKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      resolve(result['openai-key']);
    });
  });
};

const encode = (input) => {
  return btoa(input);
};

const saveKey = () => {
  const input = document.getElementById('key_input');
  if (input) {
    const { value } = input;
    // Encode String
    const encodedValue = encode(value);
    // Save to google storage
    chrome.storage.local.set({ 'openai-key': encodedValue }, () => {
      document.getElementById('key_needed').style.display = 'none';
      document.getElementById('key_entered').style.display = 'block';
    });
  }
};

const changeKey = () => {
  document.getElementById('key_needed').style.display = 'block';
  document.getElementById('key_entered').style.display = 'none';
}

document.getElementById('save_key_button').addEventListener('click', saveKey);
document
  .getElementById('change_key_button')
  .addEventListener('click', changeKey);

checkForKey().then((response) => {
  if (response) {
    document.getElementById('key_needed').style.display = 'none';
    document.getElementById('key_entered').style.display = 'block';
  }
});







// chrome.runtime.onMessage.addListener((message) => {
//   if (message.type === "completion1") {
//       console.log("Received message in content script:", message);
//       const text1 = message.text;
//       console.log("The modal message: " + message)
//       console.log("The modal message.text was: " + text1)
//       // Create the modal with the response text
//       const modal1 = document.createElement("div");
//       modal1.innerHTML = `
//       <div class="modal">
//         <div class="modal-content">
//           <span class="close">&times;</span>
//           <p>${text}</p>
//         </div>
//       </div>
//     `;
//       // Append the modal to the page
//       document.body.appendChild(modal1);
//   }
// });


