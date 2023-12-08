// import {settingsWords} from "./settingsWords.js";
// import {counterWords} from "./counterWords.js";
// import {wordsCloudCounter} from "./wordsCountLexical.js";
// export const wordsCloud = (tabId)=>{
//     chrome.tabs.get(tabId, function (tab) {
//         var tabContent = tab ? tab.content : null;
//         console.log(tab, { tabContent });
//         if (tab) {
//           chrome.scripting.executeScript(
//             {
//               target: { tabId: tab.id },
//               function(){
//                 counterWords(settingsWords); 
//                 wordsCloudCounter(counterWords().words);
//               }
//             });
//           }
//         });

// }